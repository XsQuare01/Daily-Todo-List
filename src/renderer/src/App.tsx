import { useState, useMemo, useEffect } from 'react'
import { X, Calendar, List, Star, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { TodoList } from './components/TodoList'
import { AddTodoInput } from './components/AddTodoInput'
import { useTodos } from './hooks/useTodos'
import { cn } from './lib/utils'
import type { FilterType } from './types/todo'

const FILTERS: { key: FilterType; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { key: 'today', label: '날짜', Icon: Calendar },
  { key: 'all', label: '전체', Icon: List },
  { key: 'important', label: '중요', Icon: Star },
  { key: 'completed', label: '완료', Icon: CheckCircle },
]

const drag = { WebkitAppRegion: 'drag' } as React.CSSProperties
const noDrag = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function offsetDate(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

function formatDate(isoDate: string): string {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

export default function App() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('today')
  const [selectedDate, setSelectedDate] = useState(() => toISODate(new Date()))
  const { todos, addTodo, toggleComplete, toggleImportant, deleteTodo, updateDescription } = useTodos()

  const [today, setToday] = useState(() => toISODate(new Date()))
  const isToday = selectedDate === today

  useEffect(() => {
    window.api.getNetworkDate().then((date) => {
      if (date) {
        setToday(date)
        setSelectedDate(date)
      }
    }).catch(() => {/* stay on system date */})
  }, [])

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
    }
  }, [todos, activeFilter, selectedDate])

  return (
    <div className="w-full h-full flex flex-col rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/60 shadow-[0_8px_40px_rgba(0,0,0,0.7)] select-none font-sans">

      {/* Drag header */}
      <div
        style={drag}
        className="flex items-center gap-2 px-4 py-3 bg-zinc-950/70 border-b border-zinc-800/40 shrink-0"
      >
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-zinc-300 block leading-none">Daily Todo</span>
          <span className="text-xs text-zinc-600 tabular-nums">{formatDate(today)}</span>
        </div>
        <button
          style={noDrag}
          onClick={() => window.api.hideWindow()}
          aria-label="닫기"
          className="size-6 flex items-center justify-center rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors active:scale-90"
        >
          <X size={12} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-0.5 px-2.5 py-2 border-b border-zinc-800/60 shrink-0">
        {FILTERS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors',
              activeFilter === key
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            )}
          >
            <Icon size={11} />
            {label}
          </button>
        ))}
      </div>

      {/* Date navigator — only for '날짜' tab */}
      {activeFilter === 'today' && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800/40 shrink-0">
          <button
            onClick={() => setSelectedDate(offsetDate(selectedDate, -1))}
            className="size-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors active:scale-90"
          >
            <ChevronLeft size={15} />
          </button>

          <div className="flex-1 flex items-center justify-center gap-2">
            <span className={cn('text-sm tabular-nums', isToday ? 'text-zinc-200' : 'text-zinc-400')}>
              {formatDate(selectedDate)}
            </span>
            {!isToday && (
              <button
                onClick={() => setSelectedDate(today)}
                className="text-xs text-sky-500 hover:text-sky-400 transition-colors"
              >
                오늘
              </button>
            )}
          </div>

          <button
            onClick={() => setSelectedDate(offsetDate(selectedDate, 1))}
            className="size-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors active:scale-90"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* Todo list */}
      <TodoList
        todos={filteredTodos}
        onToggleComplete={toggleComplete}
        onToggleImportant={toggleImportant}
        onDelete={deleteTodo}
        onUpdateDescription={updateDescription}
      />

      {/* Add input */}
      {activeFilter !== 'completed' && (
        <AddTodoInput
          onAdd={(title) => addTodo(title, activeFilter === 'today' ? selectedDate : undefined)}
        />
      )}
    </div>
  )
}
