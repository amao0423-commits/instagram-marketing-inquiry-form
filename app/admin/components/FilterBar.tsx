'use client'

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'すべて' },
  { value: '未対応', label: '未対応' },
  { value: '対応中', label: '対応中' },
  { value: '対応完了', label: '対応完了' },
  { value: '要フォローアップ', label: '要フォローアップ' },
  { value: 'キャンセル', label: 'キャンセル' },
]

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
  return (
    <div className="flex flex-wrap items-end gap-4 mb-4 p-4 bg-white border border-gray-200 rounded-lg">
      <div>
        <label htmlFor="filter-status" className="block text-xs font-medium text-gray-600 mb-1">
          ステータス
        </label>
        <select
          id="filter-status"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="filter-date-from" className="block text-xs font-medium text-gray-600 mb-1">
          受付日（から）
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
          受付日（まで）
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
          検索（名前・メール・会社名）
        </label>
        <input
          id="filter-search"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="検索..."
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}
