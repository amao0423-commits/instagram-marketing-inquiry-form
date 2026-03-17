/**
 * 廃止済みエンドポイント（スタブ）
 * - ファイルをこのAPIに送る方式は Vercel の 4.5MB 制限で 413 になるため使用禁止。
 * - 利用するのは POST /api/admin/documents/upload-url のみ（署名URL取得 → クライアントから Supabase へ直接 PUT）。
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    {
      message:
        'このエンドポイントは廃止されました。POST /api/admin/documents/upload-url をご利用ください。',
    },
    { status: 410 }
  )
}

export async function POST() {
  return NextResponse.json(
    {
      message:
        'このエンドポイントは廃止されました。POST /api/admin/documents/upload-url をご利用ください。',
    },
    { status: 410 }
  )
}
