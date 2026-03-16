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
  const user = await getAuthenticatedUser(request.headers.get('cookie'))
  if (!user) {
    return NextResponse.json({ message: '認証が必要です' }, { status: 401 })
  }
  const { id } = await params
  const body = await request.json()
  const updates: EmailTemplateUpdate = {}
  if (typeof body.subject === 'string') updates.subject = body.subject
  if (typeof body.body_html === 'string') updates.body_html = body.body_html
  if (typeof body.document_type === 'string' || body.document_type === null)
    updates.document_type = body.document_type
  if (typeof body.is_published === 'boolean')
    updates.is_published = body.is_published
  if (validateDocumentLinks(body.document_links))
    updates.document_links = body.document_links

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
    return NextResponse.json({ message: '更新に失敗しました' }, { status: 500 })
  }
  return NextResponse.json(data)
}
