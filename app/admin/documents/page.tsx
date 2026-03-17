'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import AdminNav from '../components/AdminNav'
import { useAdminLocale } from '../context/AdminLocaleContext'
import type { Database } from '@/types/database.types'

type Document = Database['public']['Tables']['documents']['Row']

export default function AdminDocumentsPage() {
  const { t } = useAdminLocale()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocuments = useCallback(async () => {
    const res = await fetch('/api/admin/documents', { credentials: 'include' })
    if (res.status === 401) {
      window.location.href = '/login'
      return
    }
    if (!res.ok) {
      setMessage({ type: 'error', text: t('documents.fetchFailed') })
      return
    }
    const data = await res.json()
    setDocuments(Array.isArray(data) ? data : [])
  }, [t])

  useEffect(() => {
    fetchDocuments().finally(() => setLoading(false))
  }, [fetchDocuments])

  const handleUploadClick = () => {
    setShowUploadModal(true)
    setUploadTitle('')
    setSelectedFile(null)
    setMessage(null)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!uploadTitle.trim()) {
      setMessage({ type: 'error', text: t('documents.docNameEmpty') })
      return
    }
    if (!selectedFile) {
      setMessage({ type: 'error', text: t('documents.fileEmpty') })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      // ステップ1: ファイル本体は送らずメタ情報だけで署名付きURLを取得
      const urlRes = await fetch('/api/admin/documents/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
        }),
      })

      if (!urlRes.ok) {
        const errorData = await urlRes.json().catch(() => ({}))
        setMessage({ type: 'error', text: errorData.message ?? t('documents.uploadUrlFailed') })
        return
      }

      const { upload_url, download_url, file_name, file_size, file_type } = await urlRes.json()

      // ステップ2: ブラウザから Supabase Storage へ直接アップロード（Vercelを経由しない）
      const putRes = await fetch(upload_url, {
        method: 'PUT',
        body: selectedFile,
        headers: { 'Content-Type': selectedFile.type },
      })

      if (!putRes.ok) {
        setMessage({ type: 'error', text: t('documents.uploadFailed') })
        return
      }

      // ステップ3: 資料レコードを登録
      const createRes = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: uploadTitle.trim(),
          download_url,
          file_name,
          file_size,
          file_type,
        }),
      })

      if (!createRes.ok) {
        const errorData = await createRes.json().catch(() => ({}))
        setMessage({ type: 'error', text: errorData.message ?? t('documents.createFailed') })
        return
      }

      setMessage({ type: 'success', text: t('documents.uploadSuccess') })
      setShowUploadModal(false)
      await fetchDocuments()
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (doc: Document) => {
    if (!window.confirm(t('documents.deleteConfirm', { title: doc.title }))) return
    setDeletingId(doc.id)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/documents/${doc.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
        setMessage({ type: 'success', text: t('documents.deleteSuccess') })
      } else {
        const data = await res.json().catch(() => ({}))
        setMessage({ type: 'error', text: (data.message as string) ?? t('documents.deleteFailed') })
      }
    } finally {
      setDeletingId(null)
    }
  }

  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents
    const q = searchQuery.toLowerCase()
    return documents.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.file_name && d.file_name.toLowerCase().includes(q))
    )
  }, [documents, searchQuery])

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileTypeLabel = (mimeType: string | null) => {
    if (!mimeType) return '-'
    if (mimeType === 'application/pdf') return 'PDF'
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'PowerPoint'
    if (mimeType.includes('word') || mimeType.includes('document')) return 'Word'
    if (mimeType.includes('image')) return t('documents.typeImage')
    return t('documents.typeOther')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav current="documents" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">{t('documents.title')}</h1>
          <button
            onClick={handleUploadClick}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {t('documents.upload')}
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mb-6">
          <input
            type="text"
            placeholder={t('documents.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">{t('documents.loading')}</div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? t('documents.noMatch') : t('documents.noDocuments')}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('documents.docName')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('documents.fileName')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('documents.type')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('documents.size')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('documents.registeredAt')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('documents.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{doc.file_name || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {getFileTypeLabel(doc.file_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(doc.file_size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(doc.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {doc.download_url && (
                        <a
                          href={doc.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          {t('documents.download')}
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(doc)}
                        disabled={deletingId === doc.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {deletingId === doc.id ? t('documents.deleting') : t('documents.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{t('documents.uploadModalTitle')}</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('documents.docNameRequired')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder={t('documents.docNamePlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('documents.fileRequired')} <span className="text-red-500">*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.ppt,.pptx,.jpg,.jpeg,.png,.doc,.docx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('documents.formats')}
              </p>
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-700">
                  {t('documents.selectingFile')}: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? t('documents.uploading') : t('documents.uploadButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
