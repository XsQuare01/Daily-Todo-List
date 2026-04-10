import { Inbox } from 'lucide-react'
import { TodoItem } from './TodoItem'
import type { Todo } from '../types/todo'

interface Props {
  todos: Todo[]
  onToggleComplete: (id: string) => void
  onToggleImportant: (id: string) => void
  onDelete: (id: string) => void
  onUpdateDescription: (id: string, description: string) => void
}

export function TodoList({ todos, onToggleComplete, onToggleImportant, onDelete, onUpdateDescription }: Props) {
  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-2 text-zinc-600">
        <Inbox size={32} strokeWidth={1.5} />
        <span className="text-base">할 일이 없습니다</span>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto py-1">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggleComplete={onToggleComplete}
          onToggleImportant={onToggleImportant}
          onDelete={onDelete}
          onUpdateDescription={onUpdateDescription}
        />
      ))}
    </div>
  )
}
