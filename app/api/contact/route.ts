import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Database } from '@/types/database.types'
import { getServerSupabase } from '@/lib/supabase-server'
import { createLeadRefToken } from '@/lib/lead-ref-token'
import sgMail from '@sendgrid/mail'

const sendGridApiKey = process.env.SENDGRID_API_KEY
const sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL

if (!sendGridApiKey || !sendGridFromEmail) {
  console.error('SendGrid の環境変数が設定されていません')
}

if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey)
}

const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY

function isValidPhone(val: string): boolean {
  const digits = val.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 11
}

const leadSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  phone: z
    .string()
    .min(1, '電話番号は必須です')
    .refine(isValidPhone, '有効な電話番号を入力してください（10〜11桁）'),
  category: z.string().min(1, 'カテゴリは必須です'),
  company_name: z.string().optional(),
  industry: z.string().optional(),
  requested_document: z.string().min(1, 'ご希望資料を選択してください'),
  position: z.string().optional(),
  purpose: z.string().min(1, '資料ご利用の目的を選択してください'),
  concerns: z.array(z.string()).optional(),
  instagram_id: z.string().optional(),
  recaptchaToken: z.string().optional(),
}).refine(
  (data) => {
    if (data.category === '法人') {
      return !!data.company_name && data.company_name.length > 0
    }
    return true
  },
  {
    message: '法人の場合、会社名は必須です',
    path: ['company_name'],
  }
)

async function verifyRecaptcha(token: string): Promise<boolean> {
  if (!recaptchaSecretKey) return true
  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: recaptchaSecretKey,
      response: token,
    }),
  })
  const data = await res.json()
  return data.success === true && (data.score ?? 0) >= 0.5
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getServerSupabase()
    const body = await request.json()
    
    const validationResult = leadSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'バリデーションエラー',
          errors: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data
    const { recaptchaToken, ...leadPayload } = validatedData

    if (recaptchaToken && recaptchaSecretKey) {
      const valid = await verifyRecaptcha(recaptchaToken)
      if (!valid) {
        return NextResponse.json(
          { success: false, message: 'reCAPTCHAの検証に失敗しました。再度お試しください。' },
          { status: 400 }
        )
      }
    }

    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      // @ts-expect-error - Supabase infers insert payload as never with generic Database type
      .insert({
        name: leadPayload.name,
        email: leadPayload.email,
        phone: leadPayload.phone,
        category: leadPayload.category,
        company_name: leadPayload.company_name || null,
        industry: leadPayload.industry || null,
        requested_document: leadPayload.requested_document || null,
        position: leadPayload.position || null,
        purpose: leadPayload.purpose || null,
        concerns: leadPayload.concerns || null,
        instagram_id: leadPayload.instagram_id || null,
      })
      .select()
      .single()

    if (leadError) {
      console.error('データベース保存エラー:', leadError)
      return NextResponse.json(
        { success: false, message: 'データベースへの保存に失敗しました' },
        { status: 500 }
      )
    }

    const { data: templateData, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('document_type', leadPayload.requested_document)
      .eq('is_published', true)
      .single()

    let template: Database['public']['Tables']['email_templates']['Row']

    if (templateError || !templateData) {
      console.warn(
        `document_type="${leadPayload.requested_document}" のテンプレートが見つかりません。フォールバックします。`
      )
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_published', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (fallbackError || !fallbackData) {
        console.error('フォールバックテンプレート取得エラー:', fallbackError)
        return NextResponse.json(
          { success: false, message: 'メールテンプレートの取得に失敗しました' },
          { status: 500 }
        )
      }
      template = fallbackData as Database['public']['Tables']['email_templates']['Row']
    } else {
      template = templateData as Database['public']['Tables']['email_templates']['Row']
    }

    let documentButtons = ''
    if (template.document_links && Array.isArray(template.document_links) && template.document_links.length > 0) {
      const documentIds = template.document_links.map(link => link.document_id)
      const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .in('id', documentIds)

      if (documents && documents.length > 0) {
        const docMap = new Map(documents.map(doc => [doc.id, doc]))
        documentButtons = template.document_links
          .map(link => {
            const doc = docMap.get(link.document_id)
            if (!doc || !doc.download_url) return ''
            return `
              <a href="${doc.download_url}" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 style="display: inline-block; margin: 10px 5px; padding: 12px 24px; background-color: #0d6aeb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                ${link.label}
              </a>
            `
          })
          .filter(btn => btn)
          .join('')
      }
    }

    let emailBody = template.body_html
    emailBody = emailBody.replace(/\{\{name\}\}/g, leadPayload.name)
    emailBody = emailBody.replace(/\{\{documentButtons\}\}/g, documentButtons)

    if (!sendGridApiKey || !sendGridFromEmail) {
      console.error('SendGrid が設定されていないため、メール送信をスキップします')
      let ref: string | undefined
      try {
        ref = createLeadRefToken(leadData.id)
      } catch {
        // INSTAGRAM_REF_SECRET 未設定時は ref なし
      }
      return NextResponse.json({
        success: true,
        message: 'お問い合わせを受け付けました（メール送信はスキップされました）',
        ...(ref && { ref }),
      })
    }

    try {
      await sgMail.send({
        to: leadPayload.email,
        from: sendGridFromEmail,
        subject: template.subject,
        html: emailBody,
      })
    } catch (emailError) {
      console.error('メール送信エラー:', emailError)
      return NextResponse.json(
        { 
          success: false, 
          message: 'メールの送信に失敗しましたが、お問い合わせは受け付けました' 
        },
        { status: 500 }
      )
    }

    let ref: string | undefined
    try {
      ref = createLeadRefToken(leadData.id)
    } catch {
      // INSTAGRAM_REF_SECRET 未設定時は ref なし
    }
    return NextResponse.json({
      success: true,
      message: 'お問い合わせを受け付けました',
      ...(ref && { ref }),
    })

  } catch (error) {
    console.error('予期しないエラー:', error)
    return NextResponse.json(
      { success: false, message: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
