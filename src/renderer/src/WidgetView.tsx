import { useState, useEffect, KeyboardEvent } from 'react'
import { Check, Plus, Minimize2, Maximize2 } from 'lucide-react'
import { formatDate, getKSTToday } from './lib/date'
import { parseTodoInput } from './lib/todo-input'
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
  const [draft, setDraft] = useState('')
  const compactKey = filterTag ? `widget:compact:${filterTag}` : 'widget:compact'
  const [compact, setCompact] = useState(() => localStorage.getItem(compactKey) === '1')
  const [hovered, setHovered] = useState(false)

  function toggleCompact() {
    setCompact((c) => {
      const next = !c
      localStorage.setItem(compactKey, next ? '1' : '0')
      return next
    })
  }

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

  const todayTodos = filterTag
    ? todos.filter((t) => !t.completed && t.tags?.includes(filterTag))
    : todos.filter((t) => t.createdAt === today && !t.completed)

  function handleToggle(id: string) {
    const updated = todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    setTodos(updated)
    window.api.saveTodos(JSON.stringify(updated))
  }

  function handleAdd() {
    const trimmed = draft.trim()
    if (!trimmed) return
    const { title, tags } = parseTodoInput(trimmed)
    if (!title) return
    const mergedTags = filterTag
      ? Array.from(new Set([filterTag, ...tags]))
      : tags
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      important: false,
      createdAt: today,
      ...(mergedTags.length > 0 ? { tags: mergedTags } : {}),
    }
    const updated = [...todos, newTodo]
    setTodos(updated)
    window.api.saveTodos(JSON.stringify(updated))
    setDraft('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAdd()
  }

  const firstPending = todayTodos[0]

  return (
    <div
      style={{ ...drag, opacity: hovered ? 1 : 0.7 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full h-full flex flex-col overflow-hidden bg-[#0a0a0f] border border-white/[0.06] select-none font-sans transition-opacity duration-200"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
        <span className="flex-1 text-[11px] text-white/40 font-medium tracking-wide uppercase truncate">
          {filterTag ? `#${filterTag}` : formatDate(today)}
        </span>
        <button
          style={noDrag}
          onClick={toggleCompact}
          aria-label={compact ? '펼치기' : '한 줄 모드'}
          title={compact ? '펼치기' : '한 줄 모드'}
          className="shrink-0 size-5 flex items-center justify-center rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.06] active:scale-[0.96]"
        >
          {compact ? <Maximize2 size={11} /> : <Minimize2 size={11} />}
        </button>
      </div>

      {/* Compact single-line view */}
      {compact && (
        <div className="flex-1 flex items-center px-3 pb-2 min-h-0">
          {firstPending ? (
            <button
              style={noDrag}
              onClick={() => handleToggle(firstPending.id)}
              className="flex items-center gap-2 w-full text-left hover:bg-white/[0.04] rounded-md px-1.5 py-1 active:scale-[0.99]"
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
            <span className="text-xs text-white/20 mx-auto">할 일 없음</span>
          )}
        </div>
      )}

      {/* Task list */}
      {!compact && (
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
      )}

      {/* Inline add */}
      {!compact && (
      <div
        style={noDrag}
        className="flex items-center gap-1.5 px-2.5 py-1.5 border-t border-white/[0.06] bg-white/[0.02]"
      >
        <input
          className="flex-1 bg-transparent text-[12px] text-white/70 placeholder-white/20 outline-none tracking-[-0.01em]"
          placeholder="빠른 추가... (#태그)"
          spellCheck={false}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleAdd}
          disabled={!draft.trim()}
          aria-label="추가"
          className="shrink-0 size-5 flex items-center justify-center rounded-md text-white/40 hover:text-teal-400 hover:bg-white/[0.05] active:scale-[0.96] disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Plus size={11} />
        </button>
      </div>
      )}
    </div>
  )
}
