import type { Todo } from '../types/todo'

interface Props {
  todo: Todo
  onToggleComplete: (id: string) => void
  onToggleImportant: (id: string) => void
  onDelete: (id: string) => void
}

export function TodoItem({ todo, onToggleComplete, onToggleImportant, onDelete }: Props) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700/50 group">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggleComplete(todo.id)}
        className="w-4 h-4 cursor-pointer accent-blue-500"
      />
      <span
        className={`flex-1 text-sm ${
          todo.completed ? 'line-through text-gray-500' : 'text-gray-200'
        }`}
      >
        {todo.title}
      </span>
      <button
        aria-label="중요"
        onClick={() => onToggleImportant(todo.id)}
        className={`text-sm px-1 transition-opacity ${
          todo.important
            ? 'text-yellow-400'
            : 'opacity-0 group-hover:opacity-100 text-gray-500'
        }`}
      >
        ★
      </button>
      <button
        aria-label="삭제"
        onClick={() => onDelete(todo.id)}
        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 text-sm px-1 transition-opacity"
      >
        ✕
      </button>
    </div>
  )
}
