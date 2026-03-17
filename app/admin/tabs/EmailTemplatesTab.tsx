'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Database, DocumentLink } from '@/types/database.types'
import { useAdminLocale } from '../context/AdminLocaleContext'

type EmailTemplate = Database['public']['Tables']['email_templates']['Row']
type Document = Database['public']['Tables']['documents']['Row']

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export default function EmailTemplatesTab() {
  const { t } = useAdminLocale()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<EmailTemplate | null>(null)
  const [form, setForm] = useState({
    subject: '',
    body_html: '',
    document_type: '',
    document_links: [] as DocumentLink[],
    is_published: false,
  })
  const [saving, setSaving] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([])
  const [documentLabels, setDocumentLabels] = useState<Record<string, string>>({})
  const [defaultTemplateBody, setDefaultTemplateBody] = useState<string>('')
  const [defaultTemplateSaving, setDefaultTemplateSaving] = useState(false)
  const [defaultTemplateMessage, setDefaultTemplateMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [showDefaultTemplateSection, setShowDefaultTemplateSection] = useState(false)

  const fetchTemplates = useCallback(async () => {
    const res = await fetch('/api/admin/email-templates', { credentials: 'include' })
    if (!res.ok) {
      setTemplates([])
      setLoading(false)
      return
    }
    const data = await res.json()
    setTemplates(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  useEffect(() => {
    if (selected) {
      setForm({
        subject: selected.subject,
        body_html: selected.body_html,
        document_type: selected.document_type ?? '',
        document_links: selected.document_links ?? [],
        is_published: selected.is_published ?? false,
      })
      const ids = (selected.document_links ?? []).map(link => link.document_id)
      setSelectedDocIds(ids)
      const labels: Record<string, string> = {}
      ;(selected.document_links ?? []).forEach(link => {
        labels[link.document_id] = link.label
      })
      setDocumentLabels(labels)
    }
  }, [selected])

  const fetchDocuments = useCallback(async () => {
    setDocumentsLoading(true)
    const res = await fetch('/api/admin/documents', { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      setDocuments(Array.isArray(data) ? data : [])
    } else {
      setDocuments([])
    }
    setDocumentsLoading(false)
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const fetchDefaultTemplate = useCallback(async () => {
    const res = await fetch('/api/admin/settings/default-email-template', { credentials: 'include' })
    if (!res.ok) return
    const data = await res.json()
    const body = data.body_html != null && data.body_html !== '' ? data.body_html : (data.fallback_body_html ?? '')
    setDefaultTemplateBody(body)
  }, [])

  useEffect(() => {
    if (showDefaultTemplateSection) {
      fetchDefaultTemplate()
    }
  }, [showDefaultTemplateSection, fetchDefaultTemplate])

  const handleSaveDefaultTemplate = async () => {
    setDefaultTemplateSaving(true)
    setDefaultTemplateMessage(null)
    const res = await fetch('/api/admin/settings/default-email-template', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ body_html: defaultTemplateBody }),
    })
    if (res.ok) {
      setDefaultTemplateMessage({ type: 'success', text: t('emailTemplates.defaultSaved') })
    } else {
      const data = await res.json().catch(() => ({}))
      setDefaultTemplateMessage({ type: 'error', text: (data.message as string) ?? t('emailTemplates.saveFailed') })
    }
    setDefaultTemplateSaving(false)
  }

  const handleDocumentToggle = (docId: string) => {
    setSelectedDocIds(prev => {
      if (prev.includes(docId)) {
        return prev.filter(id => id !== docId)
      } else {
        return [...prev, docId]
      }
    })
  }

  const handleLabelChange = (docId: string, label: string) => {
    setDocumentLabels(prev => ({
      ...prev,
      [docId]: label
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return

    const document_links: DocumentLink[] = selectedDocIds.map(docId => ({
      document_id: docId,
      label: documentLabels[docId] || documents.find(d => d.id === docId)?.title || '資料を開く'
    }))

    setSaving(true)
    setMessage(null)
    const res = await fetch(`/api/admin/email-templates/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        ...form,
        document_links,
        is_published: form.is_published
      }),
    })
    if (res.ok) {
      setMessage({ type: 'success', text: t('emailTemplates.saveSuccess') })
      await fetchTemplates()
    } else {
      const data = await res.json().catch(() => ({}))
      setMessage({ type: 'error', text: (data.message as string) ?? '保存に失敗しました' })
    }
    setSaving(false)
  }

  const handlePublish = async () => {
    if (!selected) return
    if (!form.document_type || !form.document_type.trim()) {
      setMessage({ type: 'error', text: t('emailTemplates.documentTypeRequired') })
      return
    }

    const document_links: DocumentLink[] = selectedDocIds.map(docId => ({
      document_id: docId,
      label: documentLabels[docId] || documents.find(d => d.id === docId)?.title || t('emailTemplates.openDocument')
    }))

    setSaving(true)
    setMessage(null)
    const res = await fetch(`/api/admin/email-templates/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        ...form,
        document_links,
        is_published: true
      }),
    })
    if (res.ok) {
      setMessage({ type: 'success', text: t('emailTemplates.publishSuccess') })
      await fetchTemplates()
    } else {
      const data = await res.json().catch(() => ({}))
      setMessage({ type: 'error', text: (data.message as string) ?? t('emailTemplates.publishFailed') })
    }
    setSaving(false)
  }

  const handleUnpublish = async () => {
    if (!selected) return
    if (!window.confirm(t('emailTemplates.unpublishConfirm'))) return

    setSaving(true)
    setMessage(null)
    const res = await fetch(`/api/admin/email-templates/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ is_published: false }),
    })
    if (res.ok) {
      setMessage({ type: 'success', text: t('emailTemplates.unpublishSuccess') })
      await fetchTemplates()
    } else {
      const data = await res.json().catch(() => ({}))
      setMessage({ type: 'error', text: (data.message as string) ?? t('emailTemplates.unpublishFailed') })
    }
    setSaving(false)
  }

  const handleCopyTemplate = async () => {
    if (!selected) return
    const templateText = `件名: ${form.subject}\n\n本文:\n${form.body_html}`
    try {
      await navigator.clipboard.writeText(templateText)
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 2000)
    } catch (err) {
      console.error('コピー失敗:', err)
    }
  }

  const handleCreateNew = async () => {
    setMessage(null)
    try {
      const res = await fetch('/api/admin/email-templates', {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setMessage({ type: 'error', text: (err.message as string) ?? t('emailTemplates.createFailed') })
        return
      }
      const newTemplate = (await res.json()) as EmailTemplate
      setTemplates(prev => [newTemplate, ...prev])
      setSelected(newTemplate)
      setMessage({ type: 'success', text: t('emailTemplates.createSuccess') })
    } catch {
      setMessage({ type: 'error', text: t('emailTemplates.createFailed') })
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">{t('emailTemplates.title')}</h2>

      {message && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mb-6 border border-gray-200 rounded-lg bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDefaultTemplateSection(prev => !prev)}
          className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span>{t('emailTemplates.defaultSection')}</span>
          <span className="text-gray-400">{showDefaultTemplateSection ? '▲' : '▼'}</span>
        </button>
        {showDefaultTemplateSection && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            {defaultTemplateMessage && (
              <div
                className={`mb-3 p-3 rounded-lg text-sm ${
                  defaultTemplateMessage.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
                }`}
              >
                {defaultTemplateMessage.text}
              </div>
            )}
            <p className="text-xs text-gray-600 mb-2">
              {t('emailTemplates.defaultHint')}
            </p>
            <textarea
              value={defaultTemplateBody}
              onChange={(e) => setDefaultTemplateBody(e.target.value)}
              rows={14}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white"
            />
            <div className="mt-3">
              <button
                type="button"
                onClick={handleSaveDefaultTemplate}
                disabled={defaultTemplateSaving}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
              >
                {defaultTemplateSaving ? t('emailTemplates.savingDefault') : t('emailTemplates.saveDefault')}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('emailTemplates.listTitle')}</h3>
            <button
              type="button"
              onClick={handleCreateNew}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              {t('emailTemplates.createNew')}
            </button>
          </div>
          {loading ? (
            <div className="text-gray-500">{t('emailTemplates.loading')}</div>
          ) : templates.length === 0 ? (
            <div className="text-gray-500">{t('emailTemplates.noTemplates')}</div>
          ) : (
            <div className="space-y-2">
              {templates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => setSelected(tmpl)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selected?.id === tmpl.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{tmpl.subject || t('emailTemplates.subjectEmpty')}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {tmpl.document_type || t('emailTemplates.documentTypeUnset')}
                  </div>
                  {tmpl.is_published && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                      {t('emailTemplates.published')}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {!selected ? (
            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
              {t('emailTemplates.selectPrompt')}
            </div>
          ) : (
            <form onSubmit={handleSave} className="bg-white p-6 rounded-lg shadow space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('emailTemplates.subject')}</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('emailTemplates.documentType')}<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.document_type}
                  onChange={(e) => setForm({ ...form, document_type: e.target.value })}
                  placeholder={t('emailTemplates.documentTypePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t('emailTemplates.documentTypeHint')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('emailTemplates.linkDocuments')}
                </label>
                {documentsLoading ? (
                  <div className="text-gray-500 text-sm">{t('emailTemplates.documentsLoading')}</div>
                ) : documents.length === 0 ? (
                  <div className="text-gray-500 text-sm">{t('emailTemplates.noDocuments')}</div>
                ) : (
                  <div className="space-y-3 border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto">
                    {documents.map(doc => {
                      const isSelected = selectedDocIds.includes(doc.id)
                      return (
                        <div key={doc.id} className="border-b border-gray-200 pb-3 last:border-0">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleDocumentToggle(doc.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{doc.title}</div>
                              <div className="text-xs text-gray-500">{doc.file_name}</div>
                              {isSelected && (
                                <div className="mt-2 space-y-2">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      {t('emailTemplates.buttonLabel')}
                                    </label>
                                    <input
                                      type="text"
                                      value={documentLabels[doc.id] || ''}
                                      onChange={(e) => handleLabelChange(doc.id, e.target.value)}
                                      placeholder={t('emailTemplates.buttonLabelPlaceholder', { title: doc.title })}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      {t('emailTemplates.publicUrl')}
                                    </label>
                                    {doc.download_url ? (
                                      <div className="flex gap-2 items-center">
                                        <input
                                          type="text"
                                          readOnly
                                          value={doc.download_url}
                                          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded bg-gray-50 text-gray-700 font-mono truncate"
                                          title={doc.download_url}
                                        />
                                        <button
                                          type="button"
                                          onClick={async (e) => {
                                            e.preventDefault()
                                            if (!doc.download_url) return
                                            try {
                                              await navigator.clipboard.writeText(doc.download_url)
                                              setCopiedDocId(doc.id)
                                              setTimeout(() => setCopiedDocId(null), 2000)
                                            } catch {
                                              setMessage({ type: 'error', text: t('emailTemplates.copyFailed') })
                                            }
                                          }}
                                          className="shrink-0 px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded font-medium transition-colors"
                                        >
                                          {copiedDocId === doc.id ? t('emailTemplates.copied') : t('emailTemplates.copyUrl')}
                                        </button>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                                        {t('emailTemplates.noPublicUrl')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </label>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('emailTemplates.bodyHtml')}</label>
                <textarea
                  value={form.body_html}
                  onChange={(e) => setForm({ ...form, body_html: e.target.value })}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t('emailTemplates.bodyHint')}
                </p>
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">{t('emailTemplates.preview')}</p>
                  <div className="border border-gray-300 rounded-lg bg-gray-100 overflow-hidden">
                    <iframe
                      title={t('emailTemplates.previewTitle')}
                      srcDoc={(() => {
                        const previewButtons = selectedDocIds
                          .map(docId => {
                            const label = documentLabels[docId] || documents.find(d => d.id === docId)?.title || t('emailTemplates.openDocument')
                            return `<a href="#" style="display: inline-block; margin: 10px 5px; padding: 12px 24px; background-color: #0d6aeb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">${escapeHtml(label)}</a>`
                          })
                          .join('')
                        return form.body_html
                          .replace(/\{\{name\}\}/g, '山田 太郎')
                          .replace(/\{\{documentButtons\}\}/g, previewButtons || `<span style="color:#888;">${t('emailTemplates.previewPlaceholder')}</span>`)
                      })()}
                      className="w-full border-0 bg-white"
                      style={{ minHeight: 480 }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors"
                >
                  {saving ? t('emailTemplates.saving') : t('emailTemplates.save')}
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors"
                >
                  {saving ? t('emailTemplates.publishing') : t('emailTemplates.publish')}
                </button>
                {selected.is_published && (
                  <button
                    type="button"
                    onClick={handleUnpublish}
                    disabled={saving}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium disabled:opacity-50 transition-colors"
                  >
                    {t('emailTemplates.unpublish')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCopyTemplate}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  {copyFeedback ? t('emailTemplates.copyDone') : t('emailTemplates.copy')}
                </button>
              </div>
              <p className="text-xs text-gray-500 -mt-2">
                {t('emailTemplates.footerHint')}
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
