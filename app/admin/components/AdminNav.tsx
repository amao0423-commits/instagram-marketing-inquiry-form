'use client'

import Link from 'next/link'

export type AdminNavTab = 'documents' | 'email-templates' | 'leads'

interface AdminNavProps {
  current?: AdminNavTab
  right?: React.ReactNode
}

const TABS: { tab: AdminNavTab; href: string; label: string }[] = [
  { tab: 'documents', href: '/admin/documents', label: '資料' },
  { tab: 'email-templates', href: '/admin', label: 'メールテンプレート' },
  { tab: 'leads', href: '/admin/leads', label: 'お問い合わせ' },
]

export default function AdminNav({ current, right }: AdminNavProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ← ダッシュボードに戻る
        </Link>
        <nav className="flex gap-1 p-1 bg-gray-100 rounded-lg" role="tablist">
          {TABS.map(({ tab, href, label }) => (
            <Link
              key={tab}
              href={href}
              role="tab"
              aria-selected={current === tab}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                current === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      {right != null && <div className="flex items-center gap-2">{right}</div>}
    </div>
  )
}
