'use client'

import { useState } from 'react'
import { useAdminLocale } from '../context/AdminLocaleContext'

interface ExportButtonProps {
  statusFilter: string
  dateFrom: string
  dateTo: string
}

export default function ExportButton({ statusFilter, dateFrom, dateTo }: ExportButtonProps) {
  const { t } = useAdminLocale()
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)
      const url = `/api/export?${params.toString()}`
      const res = await fetch(url, { credentials: 'include' })
      if (!res.ok) {
        return
      }
      const blob = await res.blob()
      const contentDisposition = res.headers.get('Content-Disposition')
      const match = contentDisposition?.match(/filename="?([^"]+)"?/)
      const filename = match ? match[1] : `leads_${new Date().toISOString().slice(0, 10)}.csv`
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(a.href)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-700 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
    >
      {loading ? t('export.exporting') : t('export.button')}
    </button>
  )
}
