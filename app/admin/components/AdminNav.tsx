'use client'

import Link from 'next/link'
import { useAdminLocale } from '../context/AdminLocaleContext'
import LanguageSwitcher from './LanguageSwitcher'

export type AdminNavTab = 'documents' | 'email-templates' | 'leads'

interface AdminNavProps {
  current?: AdminNavTab
  right?: React.ReactNode
}

const TABS: { tab: AdminNavTab; href: string; labelKey: string }[] = [
  { tab: 'documents', href: '/admin/documents', labelKey: 'nav.documents' },
  { tab: 'email-templates', href: '/admin', labelKey: 'nav.emailTemplates' },
  { tab: 'leads', href: '/admin/leads', labelKey: 'nav.leads' },
]

export default function AdminNav({ current, right }: AdminNavProps) {
  const { t } = useAdminLocale()
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {t('backToDashboard')}
        </Link>
        <nav className="flex gap-1 p-1 bg-gray-100 rounded-lg" role="tablist">
          {TABS.map(({ tab, href, labelKey }) => (
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
              {t(labelKey)}
            </Link>
          ))}
        </nav>
        <LanguageSwitcher />
      </div>
      {right != null && <div className="flex items-center gap-2">{right}</div>}
    </div>
  )
}
