import type { FilterType } from '../types/todo'

interface Props {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
}

const FILTERS: { key: FilterType; label: string; icon: string }[] = [
  { key: 'today', label: '오늘', icon: '📅' },
  { key: 'all', label: '전체', icon: '📋' },
  { key: 'important', label: '중요', icon: '⭐' },
  { key: 'completed', label: '완료', icon: '✅' },
]

export function Sidebar({ activeFilter, onFilterChange }: Props) {
  return (
    <aside className="w-48 bg-gray-800 border-r border-gray-700 flex flex-col p-3 gap-1">
      <div className="text-xs font-bold text-blue-400 uppercase tracking-widest px-2 py-2">
        TODAY
      </div>
      {FILTERS.map(({ key, label, icon }) => (
        <button
          key={key}
          onClick={() => onFilterChange(key)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
            activeFilter === key
              ? 'bg-gray-700 text-gray-100'
              : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
          }`}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </aside>
  )
}
