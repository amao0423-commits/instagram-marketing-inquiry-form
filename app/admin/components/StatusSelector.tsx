'use client'

import type { Database } from '@/types/database.types'

type Lead = Database['public']['Tables']['leads']['Row']

const STATUS_OPTIONS: { value: string; label: string; className: string }[] = [
  { value: '未対応', label: '未対応', className: 'bg-gray-100 text-gray-800' },
  { value: '対応中', label: '対応中', className: 'bg-yellow-100 text-yellow-800' },
  { value: '対応完了', label: '対応完了', className: 'bg-green-100 text-green-800' },
  { value: '要フォローアップ', label: '要フォローアップ', className: 'bg-red-100 text-red-800' },
  { value: 'キャンセル', label: 'キャンセル', className: 'bg-gray-200 text-gray-700' },
]

export function getStatusClass(status: string): string {
  const found = STATUS_OPTIONS.find((s) => s.value === status)
  return found ? found.className : 'bg-gray-100 text-gray-800'
}

interface StatusSelectorProps {
  lead: Lead
  onUpdate: (lead: Lead) => void
}

export default function StatusSelector({ lead, onUpdate }: StatusSelectorProps) {
  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      const updated = await res.json()
      onUpdate(updated)
    }
  }

  const currentStatus = lead.status ?? '未対応'

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      className={`text-xs font-medium px-2 py-1 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusClass(currentStatus)}`}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
