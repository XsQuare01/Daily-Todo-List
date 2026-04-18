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
  const [focusedTodoId, setFocusedTodoId] = useState<string | null>(null)
  const isDesktop = mode === 'desktop'

  useEffect(() => {
    if (isDesktop && activeFilter !== 'all' && activeFilter !== 'important') {
      setActiveFilter('all')
    }
  }, [isDesktop, activeFilter])

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
      important: todos.filter((t) => t.important && !t.completed).length,
    }),
    [todos]
  )

  const pendingTodos = useMemo(() => todos.filter((t) => !t.completed), [todos])
  const importantTodos = useMemo(
    () => todos.filter((t) => t.important && !t.completed),
    [todos]
  )
  const focusCandidates = useMemo(
    () => (importantTodos.length > 0 ? importantTodos : pendingTodos).slice(0, 5),
    [importantTodos, pendingTodos]
  )
  const focusedTodo = useMemo(() => {
    if (activeTimerId) {
      return todos.find((t) => t.id === activeTimerId) ?? null
    }
    if (focusedTodoId) {
      return todos.find((t) => t.id === focusedTodoId) ?? null
    }
    return focusCandidates[0] ?? null
  }, [activeTimerId, focusedTodoId, todos, focusCandidates])

  useEffect(() => {
    if (!focusedTodoId) return
    const exists = todos.some((t) => t.id === focusedTodoId && !t.completed)
    if (!exists) {
      setFocusedTodoId(null)
    }
  }, [focusedTodoId, todos])

  const popupTodos = useMemo(() => {
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

  const desktopFiltersNav = (
    <>
      {[
        { key: 'all' as const, label: 'Pending' },
        { key: 'important' as const, label: 'Important' },
      ].map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setActiveFilter(key)}
          className={cn(
            'flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors',
            activeFilter === key
              ? 'bg-white/[0.07] border-teal-300/55 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
              : 'border-white/[0.12] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] hover:border-white/[0.22]'
          )}
        >
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs tabular-nums text-zinc-400">{key === 'all' ? counts.pending : counts.important}</span>
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

  const sharedTodoListProps = {
    activeTimerId,
    getDisplayElapsed,
    onToggleComplete: handleToggleComplete,
    onToggleImportant: toggleImportant,
    onDelete: deleteTodo,
    onUpdateDescription: updateDescription,
    onUpdateDueDate: updateDueDate,
    onUpdateTags: updateTags,
    onToggleTimer: toggleTimer,
    onResetTimer: handleResetTimer,
    onUpdatePriority: updatePriority,
    onAddSubtask: addSubtask,
    onToggleSubtask: toggleSubtask,
    onDeleteSubtask: deleteSubtask,
    onReorder: reorderTodos,
  }

  const todoList = (
    <TodoList
      todos={popupTodos}
      {...sharedTodoListProps}
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
          <div style={drag} className="shrink-0 border-b border-white/[0.12] bg-white/[0.02] px-8 py-5 flex items-start gap-6">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] uppercase tracking-[0.28em] text-teal-400/80 font-semibold">Desktop Workspace</div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-100">Daily Todo 관리 화면</h1>
              <p className="mt-2 text-sm text-zinc-500 max-w-3xl">중요한 일과 아직 남은 일을 빠르게 훑고 정리하는 큰 관리 화면입니다.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 min-w-[420px]" style={noDrag}>
              <div className="rounded-xl border border-white/[0.14] bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Pending</div>
                <div className="mt-2 text-2xl font-semibold text-zinc-100 tabular-nums">{counts.pending}</div>
              </div>
              <div className="rounded-xl border border-white/[0.14] bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Important</div>
                <div className="mt-2 text-2xl font-semibold text-zinc-100 tabular-nums">{counts.important}</div>
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
            <aside className="rounded-[18px] border border-white/[0.14] bg-white/[0.03] p-4 flex flex-col gap-4 overflow-hidden">
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 mb-3">Focus</div>
                <div className="flex flex-col gap-2">{desktopFiltersNav}</div>
              </div>
              <div className="rounded-xl border border-white/[0.14] bg-white/[0.02] p-4 space-y-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Focus Session</div>
                  {focusedTodo ? (
                    <>
                      <div className="mt-2 text-base font-semibold text-zinc-100 leading-snug">{focusedTodo.title}</div>
                      <div className="mt-2 flex items-center gap-2 flex-wrap text-xs text-zinc-400">
                        <span className="px-2 py-1 rounded-md border border-white/[0.12] bg-white/[0.03] tabular-nums">
                          {activeTimerId === focusedTodo.id ? '진행 중' : '대기 중'}
                        </span>
                        <span className="px-2 py-1 rounded-md border border-white/[0.12] bg-white/[0.03] tabular-nums">
                          {getDisplayElapsed(focusedTodo)}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          style={noDrag}
                          onClick={() => toggleTimer(focusedTodo.id)}
                          className="rounded-md border border-teal-300/50 bg-teal-400/10 px-3 py-2 text-xs font-medium text-teal-200 hover:bg-teal-400/16"
                        >
                          {activeTimerId === focusedTodo.id ? '세션 일시정지' : '세션 시작'}
                        </button>
                        <button
                          style={noDrag}
                          onClick={() => handleToggleComplete(focusedTodo.id)}
                          className="rounded-md border border-white/[0.14] bg-white/[0.03] px-3 py-2 text-xs font-medium text-zinc-200 hover:border-white/[0.24]"
                        >
                          완료 처리
                        </button>
                        <button
                          style={noDrag}
                          onClick={() => setFocusedTodoId(null)}
                          className="rounded-md border border-white/[0.12] px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 hover:border-white/[0.22]"
                        >
                          선택 해제
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-zinc-500">집중할 작업을 하나 선택해 세션을 시작하세요.</p>
                  )}
                </div>

                {focusCandidates.length > 0 && (
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Suggested</div>
                    <div className="flex flex-col gap-2">
                      {focusCandidates.map((todo) => (
                        <button
                          key={todo.id}
                          style={noDrag}
                          onClick={() => setFocusedTodoId(todo.id)}
                          className={cn(
                            'rounded-lg border px-3 py-2 text-left transition-colors',
                            focusedTodo?.id === todo.id
                              ? 'border-teal-300/55 bg-teal-400/10'
                              : 'border-white/[0.1] bg-white/[0.02] hover:border-white/[0.22] hover:bg-white/[0.04]'
                          )}
                        >
                          <div className="text-sm text-zinc-100 truncate">{todo.title}</div>
                          <div className="mt-1 text-[11px] text-zinc-500">
                            {todo.important ? 'Important' : 'Pending'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-white/[0.14] bg-white/[0.02] p-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Today</div>
                <div className="mt-2 text-base font-medium text-zinc-100">{formatDate(today)}</div>
                <p className="mt-3 text-xs leading-5 text-zinc-500">작업 추가와 상세 수정은 오른쪽 리스트에서 바로 처리할 수 있습니다.</p>
              </div>
            </aside>

            <section className="min-w-0 min-h-0 rounded-[20px] border border-white/[0.14] bg-[#0c0f14] shadow-[0_30px_80px_rgba(0,0,0,0.28)] flex flex-col overflow-hidden">
              <div className="shrink-0 px-6 py-4 border-b border-white/[0.12] bg-white/[0.02]">
                <div className="text-[12px] uppercase tracking-[0.24em] text-zinc-500">Overview</div>
                <div className="mt-1 text-xl font-semibold text-zinc-100">Pending &amp; Important</div>
                <p className="mt-2 text-sm text-zinc-500">큰 화면에서 남은 일과 중요한 일을 동시에 비교하면서 정리할 수 있습니다.</p>
              </div>
              <div className="flex-1 min-h-0 grid grid-cols-2 divide-x divide-white/[0.08]">
                <div className="min-h-0 flex flex-col">
                  <div className="shrink-0 px-5 py-3 border-b border-white/[0.08] bg-white/[0.015]">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Pending Lane</div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-lg font-semibold text-zinc-100">Pending</div>
                      <div className="text-xs tabular-nums text-zinc-400">{counts.pending}</div>
                    </div>
                  </div>
                  <TodoList todos={pendingTodos} {...sharedTodoListProps} />
                </div>
                <div className="min-h-0 flex flex-col">
                  <div className="shrink-0 px-5 py-3 border-b border-white/[0.08] bg-white/[0.015]">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Important Lane</div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-lg font-semibold text-zinc-100">Important</div>
                      <div className="text-xs tabular-nums text-zinc-400">{counts.important}</div>
                    </div>
                  </div>
                  <TodoList todos={importantTodos} {...sharedTodoListProps} />
                </div>
              </div>
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
