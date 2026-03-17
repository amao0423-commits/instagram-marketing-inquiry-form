'use client'

import { useState } from 'react'
import LeadsTab from './tabs/LeadsTab'
import EmailTemplatesTab from './tabs/EmailTemplatesTab'
import DocumentsTab from './tabs/DocumentsTab'
import { useAdminLocale } from './context/AdminLocaleContext'
import LanguageSwitcher from './components/LanguageSwitcher'

type TabType = 'leads' | 'email-templates' | 'documents'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('leads')
  const { t } = useAdminLocale()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">{t('admin.title')}</h1>
              {activeTab !== 'leads' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('leads')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t('backToDashboard')}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <button
                type="button"
                onClick={() => setActiveTab('email-templates')}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                  activeTab === 'email-templates'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                }`}
              >
                {t('nav.emailTemplates')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('documents')}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                  activeTab === 'documents'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                }`}
              >
                {t('nav.documents')}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 text-sm font-medium hover:bg-gray-50"
              >
                {t('admin.logout')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {activeTab === 'leads' && <LeadsTab />}
        {activeTab === 'email-templates' && <EmailTemplatesTab />}
        {activeTab === 'documents' && <DocumentsTab />}
      </div>
    </div>
  )
}
