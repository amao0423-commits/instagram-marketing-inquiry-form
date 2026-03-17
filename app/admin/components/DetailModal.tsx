'use client'

import { useEffect, useCallback } from 'react'
import type { Database } from '@/types/database.types'
import { useAdminLocale } from '../context/AdminLocaleContext'

type Lead = Database['public']['Tables']['leads']['Row']

interface DetailModalProps {
  lead: Lead | null
  allLeads: Lead[]
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
  hasPrev: boolean
  hasNext: boolean
}

function copyToClipboard(text: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text)
  }
}

export default function DetailModal({
  lead,
  allLeads,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: DetailModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev()
      if (e.key === 'ArrowRight' && hasNext && onNext) onNext()
    },
    [onClose, onPrev, onNext, hasPrev, hasNext]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const { t, getStatusLabel, locale } = useAdminLocale()
  if (!lead) return null

  const dateLocale = locale === 'ko' ? 'ko-KR' : 'ja-JP'
  const fields: { labelKey: string; value: string | null | undefined; copyable?: boolean }[] = [
    { labelKey: 'detailModal.receivedAt', value: new Date(lead.created_at).toLocaleString(dateLocale) },
    { labelKey: 'detailModal.updatedAt', value: lead.updated_at ? new Date(lead.updated_at).toLocaleString(dateLocale) : '-' },
    { labelKey: 'detailModal.name', value: lead.name },
    { labelKey: 'detailModal.category', value: lead.category },
    { labelKey: 'detailModal.company', value: lead.company_name ?? '-' },
    { labelKey: 'detailModal.email', value: lead.email, copyable: true },
    { labelKey: 'detailModal.phone', value: lead.phone, copyable: true },
    { labelKey: 'detailModal.industry', value: lead.industry ?? '-' },
    { labelKey: 'detailModal.requestedDocument', value: lead.requested_document ?? '-' },
    { labelKey: 'detailModal.position', value: lead.position ?? '-' },
    { labelKey: 'detailModal.purpose', value: lead.purpose ?? '-' },
    { labelKey: 'detailModal.concerns', value: lead.concerns?.length ? lead.concerns.join('、') : '-' },
    { labelKey: 'detailModal.instagramId', value: lead.instagram_id ?? '-' },
    { labelKey: 'detailModal.status', value: getStatusLabel(lead.status ?? '未対応') },
    { labelKey: 'detailModal.memo', value: lead.memo ?? '-' },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 id="modal-title" className="text-lg font-bold text-gray-900">
            {t('detailModal.title')}
          </h2>
          <div className="flex items-center gap-2">
            {hasPrev && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onPrev?.()
                }}
                className="text-gray-600 hover:text-gray-900 p-1"
                aria-label={t('detailModal.prev')}
              >
                {t('detailModal.prev')}
              </button>
            )}
            {hasNext && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onNext?.()
                }}
                className="text-gray-600 hover:text-gray-900 p-1"
                aria-label={t('detailModal.next')}
              >
                {t('detailModal.next')}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              aria-label={t('detailModal.close')}
            >
              &times;
            </button>
          </div>
        </div>
        <div className="px-6 py-4 space-y-3">
          {fields.map(({ labelKey, value, copyable }) => (
            <div key={labelKey} className="text-sm">
              <div className="font-medium text-gray-700 mb-0.5">{t(labelKey)}</div>
              <div className="text-gray-900 flex items-center gap-2">
                <span className="break-all">{value ?? '-'}</span>
                {copyable && value && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(value)}
                    className="text-blue-600 hover:underline text-xs shrink-0"
                  >
                    {t('detailModal.copy')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
