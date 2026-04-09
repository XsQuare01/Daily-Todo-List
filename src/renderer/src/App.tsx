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
  const { todos, addTodo, toggleComplete, toggleImportant, deleteTodo } = useTodos()

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

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 select-none">
      <Sidebar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      <main className="flex flex-col flex-1 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h1 className="text-lg font-semibold text-gray-100">
            {FILTER_TITLES[activeFilter]}
          </h1>
        </div>
        <TodoList
          todos={filteredTodos}
          onToggleComplete={toggleComplete}
          onToggleImportant={toggleImportant}
          onDelete={deleteTodo}
        />
        {activeFilter !== 'completed' && <AddTodoInput onAdd={addTodo} />}
      </main>
    </div>
  )
}
