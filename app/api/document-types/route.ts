import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type EmailTemplateRow = Database['public']['Tables']['email_templates']['Row']

export async function GET() {
  const { data, error } = await supabase
    .from('email_templates')
    .select('document_type')
    .eq('is_published', true)
    .not('document_type', 'is', null)

  if (error) {
    console.error('document-types fetch error:', error)
    return NextResponse.json(
      { error: '資料一覧の取得に失敗しました' },
      { status: 500 }
    )
  }

  const documentTypes = Array.from(
    new Set(
      ((data ?? []) as Pick<EmailTemplateRow, 'document_type'>[])
        .map((row) => row.document_type)
        .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
    )
  ).sort()

  return NextResponse.json({ documentTypes })
}
