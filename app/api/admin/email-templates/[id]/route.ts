import { NextRequest, NextResponse } from 'next/server'
import type { Database, DocumentLink } from '@/types/database.types'
import { getAuthenticatedUser } from '@/lib/auth'
import { getServerSupabase } from '@/lib/supabase-server'

type EmailTemplateUpdate = Database['public']['Tables']['email_templates']['Update']

function validateDocumentLinks(links: unknown): links is DocumentLink[] {
  return (
    Array.isArray(links) &&
    links.every(
      (link: unknown): link is DocumentLink =>
        typeof link === 'object' &&
        link !== null &&
        'document_id' in link &&
        'label' in link &&
        typeof (link as DocumentLink).document_id === 'string' &&
        typeof (link as DocumentLink).label === 'string'
    )
  )
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request.headers.get('cookie'))
    if (!user) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 })
    }
    const { id } = await params
    let body: unknown
    try {
      body = await request.json()
    } catch {
      console.error('[PATCH /api/admin/email-templates] Invalid JSON body')
      return NextResponse.json({ message: 'リクエストの形式が不正です' }, { status: 400 })
    }
    const updates: EmailTemplateUpdate = {}
    if (typeof body === 'object' && body !== null) {
      const b = body as Record<string, unknown>
      if (typeof b.subject === 'string') updates.subject = b.subject
      if (typeof b.body_html === 'string') updates.body_html = b.body_html
      if (typeof b.document_type === 'string' || b.document_type === null)
        updates.document_type = b.document_type
      if (typeof b.is_published === 'boolean')
        updates.is_published = b.is_published
      if (validateDocumentLinks(b.document_links))
        updates.document_links = b.document_links
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: '更新する項目がありません' }, { status: 400 })
    }

    const supabase = getServerSupabase()
    const { data, error } = await supabase
      .from('email_templates')
      // @ts-expect-error - updates matches email_templates.Update
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[PATCH /api/admin/email-templates] Supabase error:', error.code, error.message, error)
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { message: '指定のテンプレートが見つかりません。一覧を再読み込みしてください。' },
          { status: 404 }
        )
      }
      return NextResponse.json({ message: '更新に失敗しました' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (e) {
    console.error('[PATCH /api/admin/email-templates] Exception:', e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(_request.headers.get('cookie'))
    if (!user) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 })
    }
    const { id } = await params
    const supabase = getServerSupabase()
    const { error } = await supabase.from('email_templates').delete().eq('id', id)

    if (error) {
      console.error('[DELETE /api/admin/email-templates] Supabase error:', error.code, error.message, error)
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { message: '指定のテンプレートが見つかりません。一覧を再読み込みしてください。' },
          { status: 404 }
        )
      }
      return NextResponse.json({ message: '削除に失敗しました' }, { status: 500 })
    }
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    console.error('[DELETE /api/admin/email-templates] Exception:', e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
