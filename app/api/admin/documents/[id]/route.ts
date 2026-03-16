import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'
import { getAuthenticatedUser } from '@/lib/auth'
import { getServerSupabase } from '@/lib/supabase-server'

type DocumentUpdate = Database['public']['Tables']['documents']['Update']

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
  const { data, error } = await supabase.from('documents').select('*').eq('id', id).single()

  if (error || !data) {
    return NextResponse.json({ message: '資料が見つかりません' }, { status: 404 })
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
  const updates: DocumentUpdate = { updated_at: new Date().toISOString() }
  if (typeof body.title === 'string') updates.title = body.title
  if (typeof body.download_url === 'string' || body.download_url === null)
    updates.download_url = body.download_url
  if (typeof body.file_name === 'string' || body.file_name === null)
    updates.file_name = body.file_name
  if (typeof body.file_size === 'number' || body.file_size === null)
    updates.file_size = body.file_size
  if (typeof body.file_type === 'string' || body.file_type === null)
    updates.file_type = body.file_type

  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('documents')
    // @ts-expect-error - updates matches documents.Update
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ message: '更新に失敗しました' }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(_request.headers.get('cookie'))
  if (!user) {
    return NextResponse.json({ message: '認証が必要です' }, { status: 401 })
  }
  const { id } = await params
  const supabase = getServerSupabase()
  const { error } = await supabase.from('documents').delete().eq('id', id)

  if (error) {
    console.error('[DELETE /api/admin/documents/[id]]', error.message)
    return NextResponse.json({ message: '資料の削除に失敗しました' }, { status: 500 })
  }
  return new NextResponse(null, { status: 204 })
}
