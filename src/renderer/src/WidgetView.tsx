import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { Maximize2 } from 'lucide-react'
import { formatDate, getKSTToday } from './lib/date'
import { loadTodos, persistTodos, createTodo, subscribeTodos } from './lib/todos-ipc'
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

const PRIORITY_ORDER: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

const filterTag = new URLSearchParams(window.location.search).get('tag') ?? null

export default function WidgetView() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [today, setToday] = useState(getKSTToday)
  const [hovered, setHovered] = useState(false)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null)
  const [addMode, setAddMode] = useState(false)
  const addInputRef = useRef<HTMLInputElement>(null)

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

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    setCtxMenu({ x: e.clientX, y: e.clientY })
  }

  function openAddMode() {
    setCtxMenu(null)
    setAddMode(true)
    requestAnimationFrame(() => addInputRef.current?.focus())
  }

  function handleAddKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setAddMode(false)
      return
    }
    if (e.key !== 'Enter') return
    const raw = (e.target as HTMLInputElement).value.trim()
    if (!raw) return
    const { title, tags } = parseTodoInput(raw)
    if (!title) return
    const newTodo = createTodo(title, today, tags.length > 0 ? tags : filterTag ? [filterTag] : undefined)
    const updated = [...todos, newTodo]
    setTodos(updated)
    void persistTodos(updated)
    ;(e.target as HTMLInputElement).value = ''
    setAddMode(false)
  }

  const sortedTodos = [...todayTodos].sort((a, b) => {
    const pa = a.priority ? PRIORITY_ORDER[a.priority] : 3
    const pb = b.priority ? PRIORITY_ORDER[b.priority] : 3
    return pa - pb
  })

  return (
    <div
      style={{ ...drag, opacity: hovered ? 1 : 0.72 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setCtxMenu(null) }}
      onContextMenu={handleContextMenu}
      onClick={() => setCtxMenu(null)}
      className="w-full h-full flex flex-col overflow-hidden select-none font-sans transition-[opacity,background-color,backdrop-filter] duration-200 rounded-[18px] bg-[#0b0d12]/58 border border-white/[0.16] backdrop-blur-2xl shadow-[0_10px_34px_rgba(0,0,0,0.24)]"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-2 pb-1">
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

      {/* Todo list */}
      <div style={noDrag} className="flex-1 overflow-y-auto px-2.5 pb-2 min-h-0 scrollbar-none">
        {sortedTodos.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {sortedTodos.map((todo) => (
              <button
                key={todo.id}
                onClick={() => handleToggle(todo.id)}
                className="flex items-center gap-2 w-full text-left hover:bg-white/[0.04] rounded-xl px-2 py-1.5 active:scale-[0.99]"
              >
                <span className="shrink-0 size-3 rounded-full border border-white/25" />
                {todo.priority && (
                  <span className={cn('shrink-0 size-[5px] rounded-full', PRIORITY_DOT[todo.priority])} />
                )}
                <span className="flex-1 min-w-0 text-[12px] text-white/78 truncate">
                  {todo.title}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="text-[12px] text-white/28">할 일 없음</div>
            <div className="text-[10px] text-white/18 mt-1">필요할 때 크게 열기</div>
          </div>
        )}
      </div>

      {/* Inline add input */}
      {addMode && (
        <div style={noDrag} className="shrink-0 px-2.5 pb-2">
          <input
            ref={addInputRef}
            type="text"
            placeholder="할 일 입력... (#태그)"
            spellCheck={false}
            onKeyDown={handleAddKeyDown}
            onBlur={() => setAddMode(false)}
            className="w-full h-7 px-2 rounded-lg bg-white/[0.06] border border-white/[0.14] text-[11px] text-white/80 placeholder-white/30 outline-none focus:border-teal-400/50"
          />
        </div>
      )}

      {/* Context menu */}
      {ctxMenu && (
        <div
          style={{ ...noDrag, position: 'fixed', left: ctxMenu.x, top: ctxMenu.y }}
          className="z-50 min-w-[120px] py-1 rounded-lg bg-[#1a1d24] border border-white/[0.14] shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
        >
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={openAddMode}
            className="w-full text-left px-3 py-1.5 text-[11px] text-white/70 hover:bg-white/[0.08] hover:text-white/90 transition-colors"
          >
            할 일 추가
          </button>
        </div>
      )}
    </div>
  )
}
