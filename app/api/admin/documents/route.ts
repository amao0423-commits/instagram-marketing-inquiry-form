import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'
import { getAuthenticatedUser } from '@/lib/auth'
import { getServerSupabase } from '@/lib/supabase-server'

type DocumentInsert = Database['public']['Tables']['documents']['Insert']

export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(_request.headers.get('cookie'))
    if (!user) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 })
    }
    const supabase = getServerSupabase()
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[GET /api/admin/documents] Supabase error:', error.message, error)
      return NextResponse.json({ message: '資料の取得に失敗しました' }, { status: 500 })
    }
    return NextResponse.json(data ?? [])
  } catch (e) {
    console.error('[GET /api/admin/documents] Exception:', e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request.headers.get('cookie'))
    if (!user) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 })
    }
    let body: { 
      title?: string
      download_url?: string
      file_name?: string
      file_size?: number
      file_type?: string
    } = {}
    try {
      body = await request.json()
    } catch {
      // empty body is ok
    }
    const insert: DocumentInsert = {
      title: typeof body.title === 'string' && body.title.trim() ? body.title.trim() : '無題',
      download_url: body.download_url || null,
      file_name: body.file_name || null,
      file_size: body.file_size || null,
      file_type: body.file_type || null,
    }
    const supabase = getServerSupabase()
    const { data, error } = await supabase.from('documents' as any).insert(insert as any).select().single()

    if (error) {
      console.error('[POST /api/admin/documents] Supabase error:', error.message, error)
      return NextResponse.json({ message: '資料の作成に失敗しました' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (e) {
    console.error('[POST /api/admin/documents] Exception:', e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
