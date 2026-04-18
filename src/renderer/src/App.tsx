import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import {
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { TodoList } from './components/TodoList'
import { AddTodoInput } from './components/AddTodoInput'
import { useTodos } from './hooks/useTodos'
import { FILTERS } from './lib/filters'
import { formatDate, getKSTToday, offsetDate } from './lib/date'
import { cn } from './lib/utils'
import type { FilterType } from './types/todo'

const drag = { WebkitAppRegion: 'drag' } as React.CSSProperties
const noDrag = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

interface AppProps {
  mode?: 'popup' | 'desktop'
}

export default function App({ mode = 'popup' }: AppProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('today')
  const [selectedDate, setSelectedDate] = useState(getKSTToday)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const isDesktop = mode === 'desktop'

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
    return window.api.onFocusAdd(() => setFocusAddSignal((n) => n + 1))
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

  const counts = useMemo(
    () => ({
      pending: todos.filter((t) => !t.completed).length,
      completed: todos.filter((t) => t.completed).length,
      important: todos.filter((t) => t.important && !t.completed).length,
      tags: allTags.length,
    }),
    [todos, allTags]
  )

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

  const filtersNav = (
    <>
      {FILTERS.map(({ key, label, Icon }) => (
        <button
          key={key}
          onClick={() => setActiveFilter(key)}
          className={cn(
            'flex items-center rounded-xl transition-colors text-left',
            isDesktop ? 'gap-2 px-3 py-2 text-sm' : 'gap-1.5 px-2 py-1.5 text-[12px]',
            activeFilter === key
              ? 'bg-white/[0.07] text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
          )}
        >
          <Icon size={isDesktop ? 12 : 11} />
          {label}
        </button>
      ))}
    </>
  )

  const dateNavigator = activeFilter === 'today' && (
    <div className={cn('flex items-center gap-2', isDesktop ? 'rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-3' : 'px-3 py-2 border-b border-white/[0.04] shrink-0')}>
      <button
        onClick={() => setSelectedDate(offsetDate(selectedDate, -1))}
        className="size-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05] active:scale-[0.96]"
      >
        <ChevronLeft size={15} />
      </button>

      <div className="flex-1 flex items-center justify-center gap-2">
        <span className={cn('text-sm tabular-nums tracking-wide', isToday ? 'text-zinc-100' : 'text-zinc-400')}>
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
  )

  const tagSelector = activeFilter === 'tag' && (
    <div className={cn('flex flex-wrap gap-1.5', isDesktop ? 'rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-3 min-h-[88px] content-start' : 'px-3 py-2 border-b border-white/[0.04] shrink-0 min-h-[40px]')}>
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
  )

  const todoList = (
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
  )

  const addInput = activeFilter !== 'completed' && (
    <AddTodoInput
      focusSignal={focusAddSignal}
      onAdd={(title, tags) => addTodo(title, activeFilter === 'today' ? selectedDate : undefined, tags)}
    />
  )

  if (isDesktop) {
    return (
      <div className="grain w-full h-full overflow-hidden bg-[#0a0a0f] text-zinc-100 font-sans">
        <div className="h-full flex flex-col">
          <div style={drag} className="shrink-0 border-b border-white/[0.05] bg-white/[0.02] px-8 py-5 flex items-start gap-6">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] uppercase tracking-[0.28em] text-teal-400/80 font-semibold">Desktop Workspace</div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-100">Daily Todo 관리 화면</h1>
              <p className="mt-2 text-sm text-zinc-500 max-w-3xl">오늘 일정, 전체 작업, 중요도, 태그, 서브태스크와 타이머까지 한 번에 관리하는 전체 뷰입니다.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 min-w-[420px]" style={noDrag}>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Pending</div>
                <div className="mt-2 text-2xl font-semibold text-zinc-100 tabular-nums">{counts.pending}</div>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Completed</div>
                <div className="mt-2 text-2xl font-semibold text-zinc-100 tabular-nums">{counts.completed}</div>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Important</div>
                <div className="mt-2 text-2xl font-semibold text-zinc-100 tabular-nums">{counts.important}</div>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Tags</div>
                <div className="mt-2 text-2xl font-semibold text-zinc-100 tabular-nums">{counts.tags}</div>
              </div>
            </div>

            <button
              style={noDrag}
              onClick={() => window.api.hideWindow()}
              aria-label="닫기"
              className="relative size-8 mt-1 flex items-center justify-center rounded-lg text-zinc-600 hover:text-red-400 hover:bg-white/[0.04] active:scale-[0.96]"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-[280px_minmax(0,1fr)] gap-6 px-8 py-6">
            <aside className="rounded-[28px] border border-white/[0.06] bg-white/[0.03] p-4 flex flex-col gap-4 overflow-hidden">
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 mb-3">Views</div>
                <div className="flex flex-col gap-1.5">{filtersNav}</div>
              </div>
              {dateNavigator}
              {tagSelector}
            </aside>

            <section className="min-w-0 min-h-0 rounded-[32px] border border-white/[0.06] bg-[#0c0f14] shadow-[0_30px_80px_rgba(0,0,0,0.28)] flex flex-col overflow-hidden">
              <div className="shrink-0 px-6 py-4 border-b border-white/[0.05] bg-white/[0.02]">
                <div className="text-[12px] uppercase tracking-[0.24em] text-zinc-500">Overview</div>
                <div className="mt-1 text-xl font-semibold text-zinc-100">{activeFilter === 'today' ? formatDate(selectedDate) : FILTERS.find((f) => f.key === activeFilter)?.label ?? '전체'}</div>
              </div>
              {todoList}
              <div className="shrink-0">{addInput}</div>
            </section>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grain w-full h-full flex flex-col overflow-hidden bg-[#0a0a0f] border border-white/[0.06] shadow-[0_8px_48px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.04)] select-none font-sans">
      <div className="h-[1px] shrink-0 bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />
      <div style={drag} className="flex items-center gap-2 px-4 py-3 bg-white/[0.02] border-b border-white/[0.04] shrink-0">
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-zinc-200 block leading-none tracking-tight text-balance">Daily Todo</span>
          <span className="text-[11px] text-zinc-500 tabular-nums tracking-wide mt-0.5 block">{formatDate(today)}</span>
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
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-white/[0.04] shrink-0">{filtersNav}</div>
      {dateNavigator}
      {tagSelector}
      {todoList}
      {addInput}
    </div>
  )
}
