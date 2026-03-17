import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { getServerSupabase } from '@/lib/supabase-server'
import { DEFAULT_EMAIL_TEMPLATE_BODY_HTML } from '@/lib/email-template-defaults'
import type { Database } from '@/types/database.types'

type EmailTemplateInsert = Database['public']['Tables']['email_templates']['Insert']

export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(_request.headers.get('cookie'))
    if (!user) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 })
    }
    const supabase = getServerSupabase()
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[GET /api/admin/email-templates] Supabase error:', error.message, error)
      return NextResponse.json({ message: 'テンプレートの取得に失敗しました' }, { status: 500 })
    }
    return NextResponse.json(data ?? [])
  } catch (e) {
    console.error('[GET /api/admin/email-templates] Exception:', e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function POST(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(_request.headers.get('cookie'))
    if (!user) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 })
    }
    const supabase = getServerSupabase()
    const { data: setting } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'default_email_template_body_html')
      .single()
    const rawValue = (setting as { value: string } | null)?.value
    const body_html =
      rawValue != null && rawValue !== '' ? rawValue : DEFAULT_EMAIL_TEMPLATE_BODY_HTML

    const payload: EmailTemplateInsert = {
      subject: '',
      body_html,
      download_url: '',
      document_type: null,
      document_links: [],
      is_published: false,
    }

    const { data, error } = await supabase
      .from('email_templates')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('[POST /api/admin/email-templates] Supabase error:', error.message, error)
      return NextResponse.json({ message: 'テンプレートの作成に失敗しました' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (e) {
    console.error('[POST /api/admin/email-templates] Exception:', e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
