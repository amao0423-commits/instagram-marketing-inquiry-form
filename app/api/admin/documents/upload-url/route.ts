import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { getServerSupabase } from '@/lib/supabase-server'

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request.headers.get('cookie'))
    if (!user) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 })
    }

    let body: { file_name?: string; file_size?: number; file_type?: string } = {}
    try {
      body = await request.json()
    } catch {
      // empty body is ok
    }

    const { file_name, file_size, file_type } = body

    if (!file_name || !file_type) {
      return NextResponse.json({ message: 'ファイル情報が不足しています' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file_type)) {
      return NextResponse.json(
        { message: '許可されていないファイル形式です。PDF、PowerPoint、画像（JPG/PNG）、Wordファイルのみアップロード可能です。' },
        { status: 400 }
      )
    }

    if (typeof file_size === 'number' && file_size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: 'ファイルサイズが大きすぎます。50MB以下のファイルをアップロードしてください。' },
        { status: 400 }
      )
    }

    const supabase = getServerSupabase()
    const fileExt = file_name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `documents/${fileName}`

    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUploadUrl(filePath)

    if (error || !data) {
      console.error('[createSignedUploadUrl Error]', error)
      return NextResponse.json(
        { message: 'アップロードURLの生成に失敗しました' },
        { status: 500 }
      )
    }

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath)

    return NextResponse.json({
      upload_url: data.signedUrl,
      download_url: urlData.publicUrl,
      file_name,
      file_size: file_size ?? null,
      file_type,
    })
  } catch (e) {
    console.error('[POST /api/admin/documents/upload-url] Exception:', e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
