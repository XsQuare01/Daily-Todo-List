import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { cn } from './lib/utils'
import type { Todo, Priority } from './types/todo'

const drag = { WebkitAppRegion: 'drag' } as React.CSSProperties
const noDrag = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

function getKSTToday(): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 10)
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function formatDate(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00')
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`
}

const PRIORITY_DOT: Record<Priority, string> = {
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-blue-400',
}

export default function WidgetView() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [today, setToday] = useState(getKSTToday)

  useEffect(() => {
    window.api.getTodos().then((json) => {
      try { setTodos(JSON.parse(json)) } catch { /* empty */ }
    })

    window.api.getNetworkDate().then((date) => {
      if (date) setToday(date)
    }).catch(() => {})

    window.api.onTodosUpdated((json) => {
      try { setTodos(JSON.parse(json)) } catch { /* empty */ }
    })
  }, [])

  const todayTodos = todos.filter((t) => t.createdAt === today && !t.completed)

  function handleToggle(id: string) {
    const updated = todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    setTodos(updated)
    window.api.saveTodos(JSON.stringify(updated))
  }

  return (
    <div
      style={drag}
      className="w-full h-full flex flex-col overflow-hidden bg-[#0a0a0f] border border-white/[0.06] select-none font-sans"
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-1.5">
        <span className="text-[11px] text-white/40 font-medium tracking-wide uppercase">
          {formatDate(today)}
        </span>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-1.5 pb-2">
        {todayTodos.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-xs text-white/20">할 일 없음</span>
          </div>
        ) : (
          todayTodos.map((todo) => {
            const subtasks = todo.subtasks ?? []
            const doneCount = subtasks.filter((s) => s.completed).length
            return (
              <div
                key={todo.id}
                className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
              >
                <button
                  style={noDrag}
                  onClick={() => handleToggle(todo.id)}
                  className="shrink-0 mt-[3px] size-3.5 rounded-full border border-white/20 hover:border-white/40 flex items-center justify-center transition-colors active:scale-[0.96]"
                >
                  {todo.completed && <Check size={8} strokeWidth={3} className="text-white/60" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {todo.priority && (
                      <span className={cn('shrink-0 size-[5px] rounded-full', PRIORITY_DOT[todo.priority])} />
                    )}
                    <span className="text-[13px] text-white/60 truncate leading-snug">
                      {todo.title}
                    </span>
                  </div>
                  {subtasks.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex-1 h-[2px] rounded-full bg-white/[0.06] overflow-hidden max-w-[60px]">
                        <div
                          className="h-full rounded-full bg-white/25 transition-all"
                          style={{ width: `${(doneCount / subtasks.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-white/25 tabular-nums">
                        {doneCount}/{subtasks.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
