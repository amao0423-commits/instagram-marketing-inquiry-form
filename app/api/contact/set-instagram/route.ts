/**
 * 無料アカウント診断（account-check）から Instagram ID を受け取り、該当リードに保存する API。
 *
 * 診断ツール側で以下①②を満たせば、この API は正常に受け取れます。
 *
 * ① 送信内容
 *    - Content-Type: application/json
 *    - body: JSON で { "ref": "Thanks から渡した ref", "instagram_id": "入力されたID" }
 *    - ref / instagram_id は必須。クエリや Referer ではなく body で送ること。
 *
 * ② 送信先
 *    - https://【この HP のドメイン】/api/contact/set-instagram
 *    - 例: 本番が https://example.vercel.app なら
 *      https://example.vercel.app/api/contact/set-instagram に POST。
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSupabase } from '@/lib/supabase-server'
import { verifyLeadRefToken } from '@/lib/lead-ref-token'

const bodySchema = z.object({
  ref: z.string().min(1, 'ref は必須です'),
  instagram_id: z.string().min(1, 'instagram_id は必須です').max(500),
})

const ALLOWED_ORIGIN = 'https://account-check-gold.vercel.app'

function corsHeaders(origin: string | null): HeadersInit {
  const allowOrigin =
    origin === ALLOWED_ORIGIN || origin?.startsWith('https://account-check-gold-')
      ? origin
      : ALLOWED_ORIGIN
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const headers = corsHeaders(origin)

  try {
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'ref と instagram_id を送信してください' },
        { status: 400, headers }
      )
    }

    const { ref, instagram_id } = parsed.data
    const leadId = verifyLeadRefToken(ref)
    if (!leadId) {
      return NextResponse.json(
        { success: false, message: '無効または期限切れのリンクです' },
        { status: 400, headers }
      )
    }

    const supabase = getServerSupabase()
    const { error } = await supabase
      .from('leads')
      // @ts-expect-error - Supabase の型推論で update が never になるため
      .update({
        instagram_id: instagram_id.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)

    if (error) {
      console.error('Instagram ID 更新エラー:', error)
      return NextResponse.json(
        { success: false, message: '更新に失敗しました' },
        { status: 500, headers }
      )
    }

    return NextResponse.json({ success: true }, { status: 200, headers })
  } catch {
    return NextResponse.json(
      { success: false, message: 'サーバーエラーが発生しました' },
      { status: 500, headers }
    )
  }
}
