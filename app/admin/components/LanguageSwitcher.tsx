'use client'

import { useAdminLocale } from '../context/AdminLocaleContext'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useAdminLocale()
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
      <button
        type="button"
        onClick={() => setLocale('ja')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          locale === 'ja' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
        aria-pressed={locale === 'ja'}
      >
        日本語
      </button>
      <button
        type="button"
        onClick={() => setLocale('ko')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          locale === 'ko' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
        aria-pressed={locale === 'ko'}
      >
        한국어
      </button>
    </div>
  )
}
