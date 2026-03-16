'use client'

import { useState, useEffect } from 'react'
import type { Database } from '@/types/database.types'

type Lead = Database['public']['Tables']['leads']['Row']

interface MemoEditorProps {
  lead: Lead
  onClose: () => void
  onSave: (updated: Lead) => void
}

export default function MemoEditor({ lead, onClose, onSave }: MemoEditorProps) {
  const [memo, setMemo] = useState(lead.memo ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setMemo(lead.memo ?? '')
  }, [lead])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memo: memo.trim() || null }),
      })
      if (res.ok) {
        const updated = await res.json()
        onSave(updated)
        onClose()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-lg shadow-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-2">管理メモの編集</h3>
        <p className="text-sm text-gray-600 mb-4">{lead.name} 様</p>
        <form onSubmit={handleSubmit}>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={5}
            className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="メモを入力..."
          />
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
