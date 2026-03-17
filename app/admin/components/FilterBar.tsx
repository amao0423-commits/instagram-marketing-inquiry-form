'use client'

import { useAdminLocale } from '../context/AdminLocaleContext'

const STATUS_FILTER_VALUES = ['', '未対応', '対応中', '対応完了', '要フォローアップ', 'キャンセル'] as const

interface FilterBarProps {
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  dateFrom: string
  dateTo: string
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  searchQuery: string
  onSearchQueryChange: (value: string) => void
}

export default function FilterBar({
  statusFilter,
  onStatusFilterChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  searchQuery,
  onSearchQueryChange,
}: FilterBarProps) {
  const { t, getStatusLabel } = useAdminLocale()
  return (
    <div className="flex flex-wrap items-end gap-4 mb-4 p-4 bg-white border border-gray-200 rounded-lg">
      <div>
        <label htmlFor="filter-status" className="block text-xs font-medium text-gray-600 mb-1">
          {t('filter.status')}
        </label>
        <select
          id="filter-status"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t('filter.all')}</option>
          {STATUS_FILTER_VALUES.filter(Boolean).map((value) => (
            <option key={value} value={value}>
              {getStatusLabel(value)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="filter-date-from" className="block text-xs font-medium text-gray-600 mb-1">
          {t('filter.dateFrom')}
        </label>
        <input
          id="filter-date-from"
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="filter-date-to" className="block text-xs font-medium text-gray-600 mb-1">
          {t('filter.dateTo')}
        </label>
        <input
          id="filter-date-to"
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex-1 min-w-[200px]">
        <label htmlFor="filter-search" className="block text-xs font-medium text-gray-600 mb-1">
          {t('filter.search')}
        </label>
        <input
          id="filter-search"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder={t('filter.searchPlaceholder')}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}
