import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import type { Database } from '@/types/database.types'
import { getAuthenticatedUser } from '@/lib/auth'
import { getServerSupabase } from '@/lib/supabase-server'

type LeadRow = Database['public']['Tables']['leads']['Row']

const UTF8_BOM = '\uFEFF'

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request.headers.get('cookie'))
  if (!user) {
    return NextResponse.json({ message: '認証が必要です' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? ''
  const dateFrom = searchParams.get('from') ?? ''
  const dateTo = searchParams.get('to') ?? ''

  const supabase = getServerSupabase()
  let query = supabase.from('leads').select('*').order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }
  if (dateFrom) {
    query = query.gte('created_at', `${dateFrom}T00:00:00.000Z`)
  }
  if (dateTo) {
    query = query.lte('created_at', `${dateTo}T23:59:59.999Z`)
  }

  const { data: leads, error } = await query

  if (error) {
    return NextResponse.json({ message: 'データの取得に失敗しました' }, { status: 500 })
  }

  const leadList = (leads ?? []) as LeadRow[]
  const rows = leadList.map((row) => ({
    受付日時: row.created_at ? new Date(row.created_at).toLocaleString('ja-JP') : '',
    名前: row.name ?? '',
    カテゴリ: row.category ?? '',
    会社名: row.company_name ?? '',
    メール: row.email ?? '',
    電話番号: row.phone ?? '',
    業界: row.industry ?? '',
    ご希望資料: row.requested_document ?? '',
    役職: row.position ?? '',
    目的: row.purpose ?? '',
    お悩み: Array.isArray(row.concerns) ? row.concerns.join('、') : '',
    InstagramID: row.instagram_id ?? '',
    ステータス: row.status ?? '未対応',
    管理メモ: row.memo ?? '',
    更新日時: row.updated_at ? new Date(row.updated_at).toLocaleString('ja-JP') : '',
  }))

  const csv = Papa.unparse(rows, { header: true })
  const body = UTF8_BOM + csv

  const filename = `leads_${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-6)}.csv`

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
