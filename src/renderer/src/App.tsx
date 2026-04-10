import { useState, useMemo } from 'react'
import { Sidebar } from './components/Sidebar'
import { TodoList } from './components/TodoList'
import { AddTodoInput } from './components/AddTodoInput'
import { useTodos } from './hooks/useTodos'
import type { FilterType } from './types/todo'

const FILTER_TITLES: Record<FilterType, string> = {
  today: '오늘의 할 일',
  all: '전체 할 일',
  important: '중요 할 일',
  completed: '완료된 할 일',
}

export default function App() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('today')
  const { todos, addTodo, toggleComplete, toggleImportant, deleteTodo, updateDescription } = useTodos()

  const today = new Date().toISOString().slice(0, 10)

  const filteredTodos = useMemo(() => {
    switch (activeFilter) {
      case 'today':
        return todos.filter((t) => t.createdAt === today && !t.completed)
      case 'all':
        return todos.filter((t) => !t.completed)
      case 'important':
        return todos.filter((t) => t.important && !t.completed)
      case 'completed':
        return todos.filter((t) => t.completed)
    }
  }, [todos, activeFilter, today])

  const formattedDate = new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

  return (
    <div className="flex h-dvh bg-zinc-950 text-zinc-100 select-none font-sans">
      <Sidebar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      <main className="flex flex-col flex-1 overflow-hidden">
        <div className="px-6 py-5 border-b border-zinc-800/60">
          <div className="flex items-baseline gap-3">
            <h1 className="text-base font-semibold text-zinc-100 text-balance">
              {FILTER_TITLES[activeFilter]}
            </h1>
            <span className="text-xs text-zinc-500 tabular-nums">{formattedDate}</span>
          </div>
        </div>
        <TodoList
          todos={filteredTodos}
          onToggleComplete={toggleComplete}
          onToggleImportant={toggleImportant}
          onDelete={deleteTodo}
          onUpdateDescription={updateDescription}
        />
        {activeFilter !== 'completed' && <AddTodoInput onAdd={addTodo} />}
      </main>
    </div>
  )
}
