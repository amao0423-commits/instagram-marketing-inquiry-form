import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { buildSessionCookieValues } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'メールアドレスとパスワードを入力してください' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return NextResponse.json(
        { success: false, message: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    if (!data.session) {
      return NextResponse.json(
        { success: false, message: 'ログインに失敗しました' },
        { status: 401 }
      )
    }

    const response = NextResponse.json({ success: true })
    const cookieValues = buildSessionCookieValues({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })
    cookieValues.forEach((value) => response.headers.append('Set-Cookie', value))

    return response
  } catch {
    return NextResponse.json(
      { success: false, message: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
