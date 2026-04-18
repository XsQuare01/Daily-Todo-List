import { FILTERS } from '../lib/filters'
import { cn } from '../lib/utils'
import type { FilterType } from '../types/todo'

interface Props {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
}

export function Sidebar({ activeFilter, onFilterChange }: Props) {
  return (
    <aside className="w-48 bg-zinc-900 border-r border-zinc-800/60 flex flex-col p-3 gap-0.5">
      <div className="text-[10px] font-semibold text-sky-500 uppercase tracking-widest px-3 py-2">
        TODAY
      </div>
      {FILTERS.map(({ key, label, Icon }) => (
        <button
          key={key}
          onClick={() => onFilterChange(key)}
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors active:scale-[0.98]',
            activeFilter === key
              ? 'bg-zinc-800 text-zinc-100'
              : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
          )}
        >
          <Icon size={14} className="shrink-0" />
          <span>{label}</span>
        </button>
      ))}
    </aside>
  )
}
