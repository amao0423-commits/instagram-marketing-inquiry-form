'use client'

import { useEffect, useCallback } from 'react'
import type { Database } from '@/types/database.types'

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

  if (!lead) return null

  const fields: { label: string; value: string | null | undefined; copyable?: boolean }[] = [
    { label: '受付日時', value: new Date(lead.created_at).toLocaleString('ja-JP') },
    { label: '更新日時', value: lead.updated_at ? new Date(lead.updated_at).toLocaleString('ja-JP') : '-' },
    { label: '名前', value: lead.name },
    { label: 'カテゴリ', value: lead.category },
    { label: '会社名', value: lead.company_name ?? '-' },
    { label: 'メールアドレス', value: lead.email, copyable: true },
    { label: '電話番号', value: lead.phone, copyable: true },
    { label: '業界', value: lead.industry ?? '-' },
    { label: 'ご希望資料', value: lead.requested_document ?? '-' },
    { label: '役職', value: lead.position ?? '-' },
    { label: '目的', value: lead.purpose ?? '-' },
    { label: 'お悩み・関心', value: lead.concerns?.length ? lead.concerns.join('、') : '-' },
    { label: 'Instagram ID', value: lead.instagram_id ?? '-' },
    { label: 'ステータス', value: lead.status ?? '未対応' },
    { label: '管理メモ', value: lead.memo ?? '-' },
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
            お問い合わせ詳細
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
                aria-label="前へ"
              >
                前へ
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
                aria-label="次へ"
              >
                次へ
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              aria-label="閉じる"
            >
              &times;
            </button>
          </div>
        </div>
        <div className="px-6 py-4 space-y-3">
          {fields.map(({ label, value, copyable }) => (
            <div key={label} className="text-sm">
              <div className="font-medium text-gray-700 mb-0.5">{label}</div>
              <div className="text-gray-900 flex items-center gap-2">
                <span className="break-all">{value ?? '-'}</span>
                {copyable && value && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(value)}
                    className="text-blue-600 hover:underline text-xs shrink-0"
                  >
                    コピー
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
