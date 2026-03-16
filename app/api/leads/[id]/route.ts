import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { getServerSupabase } from '@/lib/supabase-server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(_request.headers.get('cookie'))
  if (!user) {
    return NextResponse.json({ message: '認証が必要です' }, { status: 401 })
  }
  const { id } = await params
  const supabase = getServerSupabase()
  const { data, error } = await supabase.from('leads').select('*').eq('id', id).single()
  if (error || !data) {
    return NextResponse.json({ message: 'お問い合わせが見つかりません' }, { status: 404 })
  }
  return NextResponse.json(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request.headers.get('cookie'))
  if (!user) {
    return NextResponse.json({ message: '認証が必要です' }, { status: 401 })
  }
  const { id } = await params
  const body = await request.json()
  const updates: { status?: string; memo?: string | null } = {}
  if (typeof body.status === 'string') updates.status = body.status
  if (typeof body.memo === 'string' || body.memo === null) updates.memo = body.memo
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: '更新する項目がありません' }, { status: 400 })
  }
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('leads')
    // @ts-expect-error - Supabase infers update payload as never with generic Database type
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) {
    return NextResponse.json({ message: '更新に失敗しました' }, { status: 500 })
  }
  return NextResponse.json(data)
}
