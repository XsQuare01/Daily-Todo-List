import { useState } from 'react'
import { Star, X, Check, CalendarClock, Tag } from 'lucide-react'
import { cn } from '../lib/utils'
import type { Todo } from '../types/todo'

interface Props {
  todo: Todo
  onToggleComplete: (id: string) => void
  onToggleImportant: (id: string) => void
  onDelete: (id: string) => void
  onUpdateDescription: (id: string, description: string) => void
  onUpdateDueDate: (id: string, dueDate: string) => void
  onUpdateTags: (id: string, tags: string[]) => void
  dragHandleProps?: React.HTMLAttributes<HTMLElement>
}

function getDday(dueDate: string): string {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(dueDate + 'T00:00:00')
  const diff = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'D-Day'
  if (diff > 0) return `D-${diff}`
  return `D+${Math.abs(diff)}`
}

export function TodoItem({
  todo,
  onToggleComplete,
  onToggleImportant,
  onDelete,
  onUpdateDescription,
  onUpdateDueDate,
  onUpdateTags,
  dragHandleProps,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const [localDesc, setLocalDesc] = useState(todo.description ?? '')
  const [localDueDate, setLocalDueDate] = useState(todo.dueDate ?? '')
  const [localTags, setLocalTags] = useState((todo.tags ?? []).join(', '))

  const dday = todo.dueDate ? getDday(todo.dueDate) : null

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-900/60 group transition-colors">
        {/* Drag handle */}
        <span
          {...dragHandleProps}
          className="shrink-0 text-zinc-700 hover:text-zinc-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="순서 변경"
        >
          ⠿
        </span>

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

        {/* Title — click to toggle expanded */}
        <button onClick={() => setExpanded((v) => !v)} className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={cn(
                'text-base leading-relaxed truncate',
                todo.completed ? 'line-through text-zinc-600' : 'text-zinc-200'
              )}
            >
              {todo.title}
            </span>
            {dday && !todo.completed && (
              <span
                className={cn(
                  'shrink-0 text-xs font-medium tabular-nums',
                  dday === 'D-Day'
                    ? 'text-red-400'
                    : dday.startsWith('D+')
                      ? 'text-zinc-500'
                      : 'text-sky-400'
                )}
              >
                {dday}
              </span>
            )}
          </div>
          {!expanded && (
            <>
              {todo.tags && todo.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-0.5">
                  {todo.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="text-xs text-violet-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              {todo.description && !(todo.tags && todo.tags.length > 0) && (
                <span className="text-sm text-zinc-600 truncate block leading-tight mt-0.5">
                  {todo.description}
                </span>
              )}
            </>
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
        <div className="px-4 pb-3 pl-14 space-y-2">
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

          <div className="flex items-center gap-1.5">
            <CalendarClock size={12} className="text-zinc-600 shrink-0" />
            <input
              type="date"
              value={localDueDate}
              onChange={(e) => {
                setLocalDueDate(e.target.value)
                onUpdateDueDate(todo.id, e.target.value)
              }}
              className="bg-transparent text-zinc-400 text-xs outline-none [color-scheme:dark] flex-1"
            />
            {localDueDate && (
              <button
                onClick={() => {
                  setLocalDueDate('')
                  onUpdateDueDate(todo.id, '')
                }}
                className="text-zinc-600 hover:text-zinc-400 text-xs"
              >
                <X size={11} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Tag size={12} className="text-zinc-600 shrink-0" />
            <input
              type="text"
              placeholder="태그 (쉼표로 구분, 예: 업무, 개인)"
              value={localTags}
              onChange={(e) => setLocalTags(e.target.value)}
              onBlur={() =>
                onUpdateTags(
                  todo.id,
                  localTags
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
              className="flex-1 bg-transparent text-zinc-400 text-xs outline-none placeholder-zinc-600"
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </div>
  )
}
