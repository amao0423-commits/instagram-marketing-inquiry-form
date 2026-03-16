import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '資料請求ダウンロード',
  description: 'Next.js + Supabase + SendGrid による資料請求システム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
