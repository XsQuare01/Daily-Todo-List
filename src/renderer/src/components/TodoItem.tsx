import { useState } from 'react'
import { Star, X, Check } from 'lucide-react'
import { cn } from '../lib/utils'
import type { Todo } from '../types/todo'

interface Props {
  todo: Todo
  onToggleComplete: (id: string) => void
  onToggleImportant: (id: string) => void
  onDelete: (id: string) => void
  onUpdateDescription: (id: string, description: string) => void
}

export function TodoItem({ todo, onToggleComplete, onToggleImportant, onDelete, onUpdateDescription }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [localDesc, setLocalDesc] = useState(todo.description ?? '')

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-900/60 group transition-colors">
        {/* Custom checkbox */}
        <button
          role="checkbox"
          aria-checked={todo.completed}
          onClick={() => onToggleComplete(todo.id)}
          className={cn(
            'shrink-0 size-4 rounded border transition-colors flex items-center justify-center active:scale-[0.9]',
            todo.completed
              ? 'bg-sky-500 border-sky-500'
              : 'border-zinc-600 hover:border-zinc-400 bg-transparent'
          )}
        >
          {todo.completed && <Check size={10} strokeWidth={3} className="text-white" />}
        </button>

        {/* Title — click to toggle description */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 text-left min-w-0"
        >
          <span
            className={cn(
              'text-base leading-relaxed block truncate',
              todo.completed ? 'line-through text-zinc-600' : 'text-zinc-200'
            )}
          >
            {todo.title}
          </span>
          {todo.description && !expanded && (
            <span className="text-sm text-zinc-600 truncate block leading-tight mt-0.5">
              {todo.description}
            </span>
          )}
        </button>

        <button
          aria-label="중요"
          onClick={() => onToggleImportant(todo.id)}
          className={cn(
            'shrink-0 size-6 flex items-center justify-center rounded transition-all active:scale-[0.9]',
            todo.important
              ? 'text-amber-400'
              : 'opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-zinc-400'
          )}
        >
          <Star size={13} fill={todo.important ? 'currentColor' : 'none'} />
        </button>

        <button
          aria-label="삭제"
          onClick={() => onDelete(todo.id)}
          className="shrink-0 size-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all active:scale-[0.9]"
        >
          <X size={13} />
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-3 pl-11">
          <textarea
            autoFocus
            rows={2}
            className="w-full bg-transparent text-zinc-400 text-sm resize-none outline-none placeholder-zinc-600 leading-relaxed"
            placeholder="메모 추가..."
            spellCheck={false}
            value={localDesc}
            onChange={(e) => setLocalDesc(e.target.value)}
            onBlur={() => onUpdateDescription(todo.id, localDesc)}
          />
        </div>
      )}
    </div>
  )
}
