import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { getServerSupabase } from '@/lib/supabase-server'

export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(_request.headers.get('cookie'))
    if (!user) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 })
    }
    const supabase = getServerSupabase()
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /api/admin/leads] Supabase error:', error.message, error)
      return NextResponse.json({ message: 'お問い合わせ一覧の取得に失敗しました' }, { status: 500 })
    }
    return NextResponse.json(data ?? [])
  } catch (e) {
    console.error('[GET /api/admin/leads] Exception:', e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
