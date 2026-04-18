import { useState, useEffect } from 'react'
import { Maximize2 } from 'lucide-react'
import { formatDate, getKSTToday } from './lib/date'
import { loadTodos, persistTodos, subscribeTodos } from './lib/todos-ipc'
import { cn } from './lib/utils'
import type { Todo, Priority } from './types/todo'

const drag = { WebkitAppRegion: 'drag' } as React.CSSProperties
const noDrag = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

const PRIORITY_DOT: Record<Priority, string> = {
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-blue-400',
}

const filterTag = new URLSearchParams(window.location.search).get('tag') ?? null

export default function WidgetView() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [today, setToday] = useState(getKSTToday)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    loadTodos().then(setTodos)

    window.api.getNetworkDate().then((date) => {
      if (date) setToday(date)
    }).catch(() => {})

    return subscribeTodos(setTodos)
  }, [])

  const todayTodos = filterTag
    ? todos.filter((t) => !t.completed && t.tags?.includes(filterTag))
    : todos.filter((t) => t.createdAt === today && !t.completed)

  function handleToggle(id: string) {
    const updated = todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    setTodos(updated)
    void persistTodos(updated)
  }

  const firstPending = todayTodos[0]

  return (
    <div
      style={{ ...drag, opacity: hovered ? 1 : 0.76 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full h-full flex flex-col overflow-hidden select-none font-sans transition-[opacity,background-color,backdrop-filter] duration-200 rounded-[20px] bg-[#0b0d12]/62 border border-white/[0.14] backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.28)]"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
        <span className="flex-1 text-[11px] text-white/40 font-medium tracking-wide uppercase truncate">
          {filterTag ? `#${filterTag}` : formatDate(today)}
        </span>
        <button
          style={noDrag}
          onClick={() => window.api.openDesktopApp()}
          aria-label="데스크톱 앱 열기"
          title="데스크톱 앱 열기"
          className="shrink-0 size-5 flex items-center justify-center rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.06] active:scale-[0.96]"
        >
          <Maximize2 size={11} />
        </button>
      </div>

      {/* Basic widget view */}
      <div className="flex-1 flex items-center px-3 pb-2.5 min-h-0">
          {firstPending ? (
            <button
              style={noDrag}
              onClick={() => handleToggle(firstPending.id)}
              className="flex items-center gap-2 w-full text-left hover:bg-white/[0.04] rounded-xl px-2 py-1.5 active:scale-[0.99]"
            >
              <span className="shrink-0 size-3 rounded-full border border-white/25" />
              {firstPending.priority && (
                <span className={cn('shrink-0 size-[5px] rounded-full', PRIORITY_DOT[firstPending.priority])} />
              )}
              <span className="flex-1 min-w-0 text-[13px] text-white/75 truncate">
                {firstPending.title}
              </span>
              {todayTodos.length > 1 && (
                <span className="shrink-0 text-[10px] text-white/30 tabular-nums">
                  +{todayTodos.length - 1}
                </span>
              )}
            </button>
          ) : (
            <div className="mx-auto text-center">
              <div className="text-[12px] text-white/28">할 일 없음</div>
              <div className="text-[10px] text-white/18 mt-1">필요할 때 데스크톱 앱에서 관리</div>
            </div>
          )}
      </div>
    </div>
  )
}
