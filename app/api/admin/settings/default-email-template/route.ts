import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { getServerSupabase } from '@/lib/supabase-server'
import { DEFAULT_EMAIL_TEMPLATE_BODY_HTML } from '@/lib/email-template-defaults'

const KEY = 'default_email_template_body_html'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request.headers.get('cookie'))
    if (!user) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 })
    }
    const supabase = getServerSupabase()
    const { data: raw } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', KEY)
      .single()
    const data = raw as { value: string } | null

    const body_html =
      data?.value != null && data.value !== '' ? data.value : null
    const fallback_body_html = DEFAULT_EMAIL_TEMPLATE_BODY_HTML

    return NextResponse.json({
      body_html,
      fallback_body_html,
    })
  } catch (e) {
    console.error('[GET default-email-template]', e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'サーバーエラー' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request.headers.get('cookie'))
    if (!user) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 })
    }
    const body = await request.json()
    const body_html =
      typeof body.body_html === 'string' ? body.body_html : undefined
    if (body_html === undefined) {
      return NextResponse.json(
        { message: 'body_html を指定してください' },
        { status: 400 }
      )
    }

    const supabase = getServerSupabase()
    const { error } = await supabase
      .from('site_settings')
      // @ts-expect-error - Supabase の型推論で upsert が never になるため
      .upsert({ key: KEY, value: body_html }, { onConflict: 'key' })

    if (error) {
      console.error('[PATCH default-email-template]', error)
      return NextResponse.json(
        { message: '保存に失敗しました' },
        { status: 500 }
      )
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[PATCH default-email-template]', e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'サーバーエラー' },
      { status: 500 }
    )
  }
}
