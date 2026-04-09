import { TodoItem } from './TodoItem'
import type { Todo } from '../types/todo'

interface Props {
  todos: Todo[]
  onToggleComplete: (id: string) => void
  onToggleImportant: (id: string) => void
  onDelete: (id: string) => void
}

export function TodoList({ todos, onToggleComplete, onToggleImportant, onDelete }: Props) {
  if (todos.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
        할 일이 없습니다
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggleComplete={onToggleComplete}
          onToggleImportant={onToggleImportant}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
