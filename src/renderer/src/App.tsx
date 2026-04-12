import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import {
  X,
  Calendar,
  List,
  Star,
  Archive,
  ChevronLeft,
  ChevronRight,
  Tag as TagIcon,
} from 'lucide-react'
import { TodoList } from './components/TodoList'
import { AddTodoInput } from './components/AddTodoInput'
import { useTodos } from './hooks/useTodos'
import { cn } from './lib/utils'
import type { FilterType } from './types/todo'

const FILTERS: { key: FilterType; label: string; Icon: React.ComponentType<{ size?: number }> }[] =
  [
    { key: 'today', label: '날짜', Icon: Calendar },
    { key: 'all', label: '전체', Icon: List },
    { key: 'important', label: '중요', Icon: Star },
    { key: 'completed', label: '완료', Icon: Archive },
    { key: 'tag', label: '태그', Icon: TagIcon },
  ]

const drag = { WebkitAppRegion: 'drag' } as React.CSSProperties
const noDrag = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getKSTToday(): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 10)
}

function offsetDate(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function formatDate(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00')
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekday = WEEKDAYS[d.getDay()]
  return `${month}월 ${day}일 (${weekday})`
}

export default function App() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('today')
  const [selectedDate, setSelectedDate] = useState(getKSTToday)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const {
    todos,
    addTodo,
    toggleComplete,
    toggleImportant,
    deleteTodo,
    updateDescription,
    updateDueDate,
    updateTags,
    updateElapsed,
    updatePriority,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    reorderTodos,
  } = useTodos()

  // ── Stopwatch state ──
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null)
  const sessionStartRef = useRef(0)
  const [, tick] = useState(0)

  // Re-render every second while a timer is active
  useEffect(() => {
    if (!activeTimerId) return
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [activeTimerId])

  const pauseActiveTimer = useCallback(() => {
    if (!activeTimerId) return
    const delta = Date.now() - sessionStartRef.current
    const todo = todos.find((t) => t.id === activeTimerId)
    updateElapsed(activeTimerId, (todo?.elapsedMs ?? 0) + delta)
    setActiveTimerId(null)
  }, [activeTimerId, todos, updateElapsed])

  function toggleTimer(todoId: string) {
    if (activeTimerId === todoId) {
      pauseActiveTimer()
    } else {
      if (activeTimerId) pauseActiveTimer()
      setActiveTimerId(todoId)
      sessionStartRef.current = Date.now()
    }
  }

  function handleToggleComplete(id: string) {
    if (activeTimerId === id) pauseActiveTimer()
    toggleComplete(id)
  }

  function handleResetTimer(id: string) {
    if (activeTimerId === id) setActiveTimerId(null)
    updateElapsed(id, 0)
  }

  function getDisplayElapsed(todo: typeof todos[number]): number {
    const base = todo.elapsedMs ?? 0
    if (activeTimerId === todo.id) {
      return base + (Date.now() - sessionStartRef.current)
    }
    return base
  }

  const [today, setToday] = useState(getKSTToday)
  const isToday = selectedDate === today

  // Focus add input when main process sends app:focus-add (Ctrl+Shift+N)
  const [focusAddSignal, setFocusAddSignal] = useState(0)
  useEffect(() => {
    window.api.onFocusAdd(() => setFocusAddSignal((n) => n + 1))
  }, [])

  useEffect(() => {
    window.api
      .getNetworkDate()
      .then((date) => {
        if (date && date !== today) {
          setToday(date)
          setSelectedDate(date)
        }
      })
      .catch(() => {
        /* stay on KST date */
      })
  }, [])

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    todos.forEach((t) => t.tags?.forEach((tag) => tagSet.add(tag)))
    return Array.from(tagSet).sort()
  }, [todos])

  const filteredTodos = useMemo(() => {
    switch (activeFilter) {
      case 'today':
        return todos.filter((t) => t.createdAt === selectedDate)
      case 'all':
        return todos.filter((t) => !t.completed)
      case 'important':
        return todos.filter((t) => t.important && !t.completed)
      case 'completed':
        return todos.filter((t) => t.completed)
      case 'tag':
        return activeTag
          ? todos.filter((t) => !t.completed && t.tags?.includes(activeTag))
          : todos.filter((t) => !t.completed)
    }
  }, [todos, activeFilter, selectedDate, activeTag])

  return (
    <div className="grain w-full h-full flex flex-col overflow-hidden bg-[#0a0a0f] border border-white/[0.06] shadow-[0_8px_48px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.04)] select-none font-sans">

      {/* Accent glow line at top */}
      <div className="h-[1px] shrink-0 bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />

      {/* Drag header */}
      <div
        style={drag}
        className="flex items-center gap-2 px-4 py-3 bg-white/[0.02] border-b border-white/[0.04] shrink-0"
      >
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-zinc-200 block leading-none tracking-tight text-balance">
            Daily Todo
          </span>
          <span className="text-[11px] text-zinc-500 tabular-nums tracking-wide mt-0.5 block">
            {formatDate(today)}
          </span>
        </div>

        <button
          style={noDrag}
          onClick={() => window.api.hideWindow()}
          aria-label="닫기"
          className="relative size-6 flex items-center justify-center rounded-md text-zinc-600 hover:text-red-400 hover:bg-white/[0.04] active:scale-[0.96] after:absolute after:content-[''] after:-inset-2"
        >
          <X size={12} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-0.5 px-2.5 py-2 border-b border-white/[0.04] shrink-0">
        {FILTERS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors',
              activeFilter === key
                ? 'bg-white/[0.07] text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
            )}
          >
            <Icon size={11} />
            {label}
          </button>
        ))}
      </div>

      {/* Date navigator — only for '날짜' tab */}
      {activeFilter === 'today' && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.04] shrink-0">
          <button
            onClick={() => setSelectedDate(offsetDate(selectedDate, -1))}
            className="size-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05] active:scale-[0.96]"
          >
            <ChevronLeft size={15} />
          </button>

          <div className="flex-1 flex items-center justify-center gap-2">
            <span
              className={cn(
                'text-sm tabular-nums tracking-wide',
                isToday ? 'text-zinc-100' : 'text-zinc-400'
              )}
            >
              {formatDate(selectedDate)}
            </span>
            {isToday && (
              <span className="text-[10px] tracking-widest uppercase text-teal-400 font-semibold px-1.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20">
                오늘
              </span>
            )}
          </div>

          <button
            onClick={() => setSelectedDate(offsetDate(selectedDate, 1))}
            className="size-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05] active:scale-[0.96]"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* Tag selector — only for '태그' tab */}
      {activeFilter === 'tag' && (
        <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-white/[0.04] shrink-0 min-h-[40px]">
          {allTags.length === 0 ? (
            <span className="text-xs text-zinc-600 self-center">태그가 없습니다</span>
          ) : (
            allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={cn(
                  'text-xs px-2 py-1 rounded-full border transition-colors',
                  activeTag === tag
                    ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                    : 'bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:text-zinc-200 hover:border-white/[0.1]'
                )}
              >
                #{tag}
              </button>
            ))
          )}
        </div>
      )}

      {/* Todo list */}
      <TodoList
        todos={filteredTodos}
        activeTimerId={activeTimerId}
        getDisplayElapsed={getDisplayElapsed}
        onToggleComplete={handleToggleComplete}
        onToggleImportant={toggleImportant}
        onDelete={deleteTodo}
        onUpdateDescription={updateDescription}
        onUpdateDueDate={updateDueDate}
        onUpdateTags={updateTags}
        onToggleTimer={toggleTimer}
        onResetTimer={handleResetTimer}
        onUpdatePriority={updatePriority}
        onAddSubtask={addSubtask}
        onToggleSubtask={toggleSubtask}
        onDeleteSubtask={deleteSubtask}
        onReorder={reorderTodos}
      />

      {/* Add input */}
      {activeFilter !== 'completed' && (
        <AddTodoInput
          focusSignal={focusAddSignal}
          onAdd={(title, tags) =>
            addTodo(title, activeFilter === 'today' ? selectedDate : undefined, tags)
          }
        />
      )}
    </div>
  )
}
