'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import type { Database } from '@/types/database.types'
import DetailModal from '../components/DetailModal'
import StatusSelector from '../components/StatusSelector'
import FilterBar from '../components/FilterBar'
import ExportButton from '../components/ExportButton'
import MemoEditor from '../components/MemoEditor'
import { useAdminLocale } from '../context/AdminLocaleContext'

type Lead = Database['public']['Tables']['leads']['Row']

const PAGE_SIZE = 50

export default function LeadsTab() {
  const { t, locale } = useAdminLocale()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState<string | null>(null)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')

  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)

  const [detailLead, setDetailLead] = useState<Lead | null>(null)
  const [memoLead, setMemoLead] = useState<Lead | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission)
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          setNotificationPermission(permission)
        })
      }
    }
  }, [])

  const showNotification = useCallback((lead: Lead) => {
    setNotification(`${t('leads.newInquiry')}: ${lead.name} (${lead.category})`)
    setTimeout(() => setNotification(null), 5000)
    if (notificationPermission === 'granted' && typeof window !== 'undefined' && 'Notification' in window) {
      new Notification(t('leads.newInquiry'), {
        body: t('leads.newInquiryBody', { name: lead.name, category: lead.category }),
        icon: '/favicon.ico',
        tag: lead.id,
      })
    }
  }, [notificationPermission, t])

  const fetchLeads = useCallback(async () => {
    const res = await fetch('/api/admin/leads', { credentials: 'include' })
    if (!res.ok) {
      console.error('データ取得エラー:', res.status)
      setLeads([])
      return
    }
    const data = await res.json()
    setLeads(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      await fetchLeads()
      if (!cancelled) setLoading(false)
    }
    load()
    const interval = setInterval(fetchLeads, 30000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [fetchLeads])

  const filteredLeads = useMemo(() => {
    let list = leads
    if (statusFilter) {
      list = list.filter((l) => (l.status ?? '未対応') === statusFilter)
    }
    if (dateFrom) {
      const from = new Date(dateFrom)
      from.setHours(0, 0, 0, 0)
      list = list.filter((l) => new Date(l.created_at) >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      list = list.filter((l) => new Date(l.created_at) <= to)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          (l.email ?? '').toLowerCase().includes(q) ||
          (l.company_name ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [leads, statusFilter, dateFrom, dateTo, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE))
  const paginatedLeads = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredLeads.slice(start, start + PAGE_SIZE)
  }, [filteredLeads, page])

  const stats = useMemo(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
    const todayCount = leads.filter((l) => {
      const t = new Date(l.created_at)
      return t >= todayStart && t <= todayEnd
    }).length
    const unpaidCount = leads.filter((l) => (l.status ?? '未対応') === '未対応').length
    return { total: leads.length, unpaid: unpaidCount, today: todayCount }
  }, [leads])

  const detailIndex = detailLead ? filteredLeads.findIndex((l) => l.id === detailLead.id) : -1
  const hasPrev = detailIndex > 0
  const hasNext = detailIndex >= 0 && detailIndex < filteredLeads.length - 1

  const handleLeadUpdate = (updated: Lead) => {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
    if (detailLead?.id === updated.id) setDetailLead(updated)
    if (memoLead?.id === updated.id) setMemoLead(updated)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-xl text-gray-600">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('leads.title')}</h2>
          <p className="text-gray-600 text-sm mt-1">{t('leads.subtitle')}</p>
        </div>
        <ExportButton
          statusFilter={statusFilter}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">{t('leads.totalCount')}</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">{t('leads.uncounted')}</p>
          <p className="text-2xl font-bold text-gray-900">{stats.unpaid}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">{t('leads.todayCount')}</p>
          <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
        </div>
      </div>

      {notification && (
        <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded text-blue-800 text-sm">
          {notification}
        </div>
      )}
      {notificationPermission === 'denied' && (
        <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded text-yellow-800 text-sm">
          {t('leads.notificationDenied')}
        </div>
      )}
      {notificationPermission === 'default' && (
        <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded text-blue-800 text-sm">
          {t('leads.notificationHint')}
        </div>
      )}

      <FilterBar
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => {
          setStatusFilter(v)
          setPage(1)
        }}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={(v) => {
          setDateFrom(v)
          setPage(1)
        }}
        onDateToChange={(v) => {
          setDateTo(v)
          setPage(1)
        }}
        searchQuery={searchQuery}
        onSearchQueryChange={(v) => {
          setSearchQuery(v)
          setPage(1)
        }}
      />

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">{t('leads.receivedAt')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">{t('leads.name')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">{t('leads.category')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">{t('leads.company')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">{t('leads.email')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">{t('leads.phone')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">{t('leads.instagramId')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">{t('leads.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    {t('leads.noLeads')}
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setDetailLead(lead)}
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleString(locale === 'ko' ? 'ko-KR' : 'ja-JP')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{lead.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <span className={lead.category === '法人' ? 'text-blue-700' : 'text-green-700'}>
                        {lead.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{lead.company_name ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{lead.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{lead.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{lead.instagram_id ?? '—'}</td>
                    <td className="px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
                      <StatusSelector
                        lead={lead}
                        onUpdate={handleLeadUpdate}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {t('leads.displayRange', {
            from: String(filteredLeads.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1),
            to: String(Math.min(page * PAGE_SIZE, filteredLeads.length)),
            total: String(filteredLeads.length),
          })}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            {t('leads.prev')}
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            {t('leads.next')}
          </button>
        </div>
      </div>

      {detailLead && (
        <DetailModal
          lead={detailLead}
          allLeads={filteredLeads}
          onClose={() => setDetailLead(null)}
          onPrev={hasPrev ? () => setDetailLead(filteredLeads[detailIndex - 1]) : undefined}
          onNext={hasNext ? () => setDetailLead(filteredLeads[detailIndex + 1]) : undefined}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onEditMemo={(l) => setMemoLead(l)}
        />
      )}

      {memoLead && (
        <MemoEditor
          lead={memoLead}
          onClose={() => setMemoLead(null)}
          onSave={handleLeadUpdate}
        />
      )}
    </div>
  )
}
