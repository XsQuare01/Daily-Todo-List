import { useState, KeyboardEvent } from 'react'
import {
  Star, X, Check, CalendarClock, Tag, GripVertical,
  Play, Pause, Timer, RotateCcw, Plus, Circle, Trash2,
  ExternalLink,
} from 'lucide-react'
import { cn } from '../lib/utils'
import type { Todo, Priority } from '../types/todo'

interface Props {
  todo: Todo
  isTimerActive: boolean
  displayElapsed: number
  onToggleComplete: (id: string) => void
  onToggleImportant: (id: string) => void
  onDelete: (id: string) => void
  onUpdateDescription: (id: string, description: string) => void
  onUpdateDueDate: (id: string, dueDate: string) => void
  onUpdateTags: (id: string, tags: string[]) => void
  onToggleTimer: (id: string) => void
  onResetTimer: (id: string) => void
  onUpdatePriority: (id: string, priority: Priority | undefined) => void
  onUpdateLink: (id: string, link: string) => void
  onAddSubtask: (id: string, title: string) => void
  onToggleSubtask: (id: string, subtaskId: string) => void
  onDeleteSubtask: (id: string, subtaskId: string) => void
  dragHandleProps?: React.HTMLAttributes<HTMLElement>
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: (id: string) => void
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

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

const PRIORITY_CONFIG: Record<Priority, { label: string; dot: string; badge: string }> = {
  high:   { label: '상', dot: 'bg-red-400',   badge: 'text-red-300 bg-red-500/15 border-red-500/20' },
  medium: { label: '중', dot: 'bg-amber-400', badge: 'text-amber-300 bg-amber-500/15 border-amber-500/20' },
  low:    { label: '하', dot: 'bg-blue-400',  badge: 'text-blue-300 bg-blue-500/15 border-blue-500/20' },
}

export function TodoItem({
  todo,
  isTimerActive,
  displayElapsed,
  onToggleComplete,
  onToggleImportant,
  onDelete,
  onUpdateDescription,
  onUpdateDueDate,
  onUpdateTags,
  onToggleTimer,
  onResetTimer,
  onUpdatePriority,
  onUpdateLink,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  dragHandleProps,
  selectable = false,
  selected = false,
  onToggleSelect,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const [localDesc, setLocalDesc] = useState(todo.description ?? '')
  const [localDueDate, setLocalDueDate] = useState(todo.dueDate ?? '')
  const [localTags, setLocalTags] = useState((todo.tags ?? []).join(', '))
  const [localLink, setLocalLink] = useState(todo.link ?? '')
  const [subtaskInput, setSubtaskInput] = useState('')

  const dday = todo.dueDate ? getDday(todo.dueDate) : null
  const hasElapsed = displayElapsed > 0
  const subtasks = todo.subtasks ?? []
  const doneCount = subtasks.filter((s) => s.completed).length
  const hasSubtasks = subtasks.length > 0

  function handleAddSubtask() {
    if (!subtaskInput.trim()) return
    onAddSubtask(todo.id, subtaskInput.trim())
    setSubtaskInput('')
  }

  function handleSubtaskKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAddSubtask()
  }

  return (
    <div className="animate-slide-in">
      <div className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/[0.03] group transition-colors relative">
        {/* Drag handle */}
        <span
          {...dragHandleProps}
          className="shrink-0 text-zinc-800 hover:text-zinc-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex items-center"
          aria-label="순서 변경"
        >
          <GripVertical size={14} />
        </span>

        {selectable && onToggleSelect && (
          <button
            aria-label="선택"
            onClick={() => onToggleSelect(todo.id)}
            className={cn(
              'shrink-0 size-[18px] rounded-[5px] border transition-colors flex items-center justify-center active:scale-[0.96]',
              selected
                ? 'border-teal-300/80 bg-teal-400/14 text-teal-200'
                : 'border-white/[0.14] text-zinc-600 hover:border-white/[0.24]'
            )}
          >
            {selected && <Check size={10} strokeWidth={3} />}
          </button>
        )}

        {/* Custom checkbox */}
        <button
          role="checkbox"
          aria-checked={todo.completed}
          onClick={() => onToggleComplete(todo.id)}
          className={cn(
            'shrink-0 size-[18px] rounded-full border-[1.5px] transition-[color,background-color,border-color,box-shadow,transform] flex items-center justify-center active:scale-[0.96]',
            todo.completed
              ? 'bg-teal-500 border-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.3)]'
              : 'border-zinc-600 hover:border-teal-500/50 bg-transparent'
          )}
        >
          {todo.completed && <Check size={10} strokeWidth={3} className="text-white" />}
        </button>

        {/* Title — click to toggle expanded */}
        <button onClick={() => setExpanded((v) => !v)} className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Priority dot */}
            {todo.priority && !todo.completed && (
              <span className={cn('shrink-0 size-[6px] rounded-full', PRIORITY_CONFIG[todo.priority].dot)} />
            )}
            <span
              className={cn(
                'text-[15px] leading-relaxed truncate tracking-[-0.01em]',
                todo.completed ? 'line-through text-zinc-600' : 'text-zinc-200'
              )}
            >
              {todo.title}
            </span>
            {dday && !todo.completed && (
              <span
                className={cn(
                  'shrink-0 text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full',
                  dday === 'D-Day'
                    ? 'text-red-300 bg-red-500/15 border border-red-500/20'
                    : dday.startsWith('D+')
                      ? 'text-zinc-500 bg-zinc-700/30'
                      : 'text-teal-300 bg-teal-500/10 border border-teal-500/15'
                )}
              >
                {dday}
              </span>
            )}
            {todo.link && !todo.completed && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  window.api.openExternal(todo.link!)
                }}
                className="shrink-0 text-sky-400/80 hover:text-sky-300 transition-colors"
                aria-label="링크 열기"
              >
                <ExternalLink size={11} />
              </button>
            )}
            {(hasElapsed || isTimerActive) && !todo.completed && (
              <span
                className={cn(
                  'shrink-0 text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded-full',
                  isTimerActive
                    ? 'text-teal-300 bg-teal-500/15 border border-teal-500/20'
                    : 'text-zinc-400 bg-white/[0.04]'
                )}
              >
                {formatElapsed(displayElapsed)}
              </span>
            )}
          </div>

          {/* Collapsed preview row */}
          {!expanded && (
            <>
              {/* Subtask progress */}
              {hasSubtasks && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-[3px] rounded-full bg-white/[0.04] overflow-hidden max-w-[80px]">
                    <div
                      className="h-full rounded-full bg-teal-500/60 transition-all"
                      style={{ width: `${(doneCount / subtasks.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 tabular-nums">{doneCount}/{subtasks.length}</span>
                </div>
              )}
              {todo.tags && todo.tags.length > 0 && !hasSubtasks && (
                <div className="flex gap-1.5 flex-wrap mt-1">
                  {todo.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="text-[10px] text-violet-400/80 bg-violet-500/8 px-1.5 py-0.5 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              {todo.description && !hasSubtasks && !(todo.tags && todo.tags.length > 0) && (
                <span className="text-[13px] text-zinc-600 truncate block leading-tight mt-0.5">
                  {todo.description}
                </span>
              )}
            </>
          )}
        </button>

        {/* Timer play/pause */}
        {!todo.completed && (
          <button
            aria-label={isTimerActive ? '일시정지' : '시작'}
            onClick={() => onToggleTimer(todo.id)}
            className={cn(
              'relative shrink-0 size-6 flex items-center justify-center rounded-full transition-[color,background-color,transform] active:scale-[0.96] after:absolute after:content-[\'\'] after:-inset-2',
              isTimerActive
                ? 'text-teal-400 bg-teal-500/15'
                : hasElapsed
                  ? 'text-zinc-500 hover:text-teal-400'
                  : 'text-zinc-600 hover:text-teal-400'
            )}
          >
            {isTimerActive ? (
              <Pause size={11} fill="currentColor" />
            ) : (
              <Play size={11} fill="currentColor" className="ml-[1px]" />
            )}
          </button>
        )}

        <button
          aria-label="중요"
          onClick={() => onToggleImportant(todo.id)}
          className={cn(
            'relative shrink-0 size-6 flex items-center justify-center rounded-full transition-[color,background-color,transform] active:scale-[0.96] after:absolute after:content-[\'\'] after:-inset-2',
            todo.important
              ? 'text-amber-400 bg-amber-400/10'
              : 'opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-amber-400/70'
          )}
        >
          <Star size={12} fill={todo.important ? 'currentColor' : 'none'} />
        </button>

        <button
          aria-label="삭제"
          onClick={() => onDelete(todo.id)}
          className="relative shrink-0 size-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-[color,background-color,opacity,transform] active:scale-[0.96] after:absolute after:content-[''] after:-inset-2"
        >
          <X size={12} />
        </button>
      </div>

      {/* ── Expanded panel ── */}
      {expanded && (
        <div className="px-4 pb-3 pl-[60px] space-y-2.5">
          {/* Description */}
          <textarea
            autoFocus
            rows={2}
            className="w-full bg-white/[0.02] rounded-lg px-3 py-2 text-zinc-400 text-sm resize-none outline-none placeholder-zinc-500 leading-relaxed border border-white/[0.04] focus:border-teal-500/20"
            placeholder="메모 추가..."
            spellCheck={false}
            value={localDesc}
            onChange={(e) => setLocalDesc(e.target.value)}
            onBlur={() => onUpdateDescription(todo.id, localDesc)}
          />

          {/* Priority selector */}
          <div className="flex items-center gap-1.5">
            <Circle size={11} className="text-zinc-600 shrink-0" />
            <span className="text-xs text-zinc-500 mr-1">우선순위</span>
            {(['high', 'medium', 'low'] as Priority[]).map((p) => {
              const cfg = PRIORITY_CONFIG[p]
              const active = todo.priority === p
              return (
                <button
                  key={p}
                  onClick={() => onUpdatePriority(todo.id, active ? undefined : p)}
                  className={cn(
                    'text-[10px] px-2 py-0.5 rounded-full border transition-colors',
                    active
                      ? cfg.badge + ' border'
                      : 'text-zinc-500 border-white/[0.06] hover:border-white/[0.12]'
                  )}
                >
                  <span className={cn('inline-block size-[5px] rounded-full mr-1 align-middle', active ? cfg.dot : 'bg-zinc-600')} />
                  {cfg.label}
                </button>
              )
            })}
          </div>

          {/* Due date */}
          <div className="flex items-center gap-1.5">
            <CalendarClock size={11} className="text-zinc-600 shrink-0" />
            <input
              type="date"
              value={localDueDate}
              onChange={(e) => {
                setLocalDueDate(e.target.value)
                onUpdateDueDate(todo.id, e.target.value)
              }}
              className="bg-transparent text-zinc-400 text-xs outline-none flex-1"
            />
            {localDueDate && (
              <button
                onClick={() => { setLocalDueDate(''); onUpdateDueDate(todo.id, '') }}
                className="text-zinc-500 hover:text-zinc-400"
              >
                <X size={10} />
              </button>
            )}
          </div>

          {/* Tags */}
          <div className="flex items-center gap-1.5">
            <Tag size={11} className="text-zinc-600 shrink-0" />
            <input
              type="text"
              placeholder="태그 (쉼표로 구분)"
              value={localTags}
              onChange={(e) => setLocalTags(e.target.value)}
              onBlur={() =>
                onUpdateTags(todo.id, localTags.split(',').map((s) => s.trim()).filter(Boolean))
              }
              className="flex-1 bg-transparent text-zinc-400 text-xs outline-none placeholder-zinc-500"
              spellCheck={false}
            />
          </div>

          {/* Link */}
          <div className="flex items-center gap-1.5">
            <ExternalLink size={11} className="text-zinc-600 shrink-0" />
            <input
              type="url"
              placeholder="링크 (PR, Issue 등)"
              value={localLink}
              onChange={(e) => setLocalLink(e.target.value)}
              onBlur={() => onUpdateLink(todo.id, localLink.trim())}
              className="flex-1 bg-transparent text-zinc-400 text-xs outline-none placeholder-zinc-500"
              spellCheck={false}
            />
            {localLink.trim() && (
              <button
                onClick={() => window.api.openExternal(localLink.trim())}
                className="text-sky-400/80 hover:text-sky-300 transition-colors"
                aria-label="링크 열기"
              >
                <ExternalLink size={10} />
              </button>
            )}
            {localLink.trim() && (
              <button
                onClick={() => { setLocalLink(''); onUpdateLink(todo.id, '') }}
                className="text-zinc-500 hover:text-zinc-400"
              >
                <X size={10} />
              </button>
            )}
          </div>

          {/* Timer detail */}
          {hasElapsed && (
            <div className="flex items-center gap-1.5">
              <Timer size={11} className="text-zinc-600 shrink-0" />
              <span className="text-xs text-zinc-400 tabular-nums font-mono">
                {formatElapsed(displayElapsed)}
              </span>
              <button
                onClick={() => onResetTimer(todo.id)}
                aria-label="타이머 초기화"
                className="text-zinc-600 hover:text-zinc-400 ml-auto"
              >
                <RotateCcw size={10} />
              </button>
            </div>
          )}

          {/* ── Subtasks ── */}
          <div className="pt-1 border-t border-white/[0.04]">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[11px] text-zinc-500 font-medium">하위 항목</span>
              {hasSubtasks && (
                <span className="text-[10px] text-zinc-600 tabular-nums">{doneCount}/{subtasks.length}</span>
              )}
            </div>

            {/* Subtask list */}
            {subtasks.map((sub) => (
              <div key={sub.id} className="flex items-center gap-2 py-1 group/sub">
                <button
                  onClick={() => onToggleSubtask(todo.id, sub.id)}
                  className={cn(
                    'shrink-0 size-3.5 rounded border transition-colors flex items-center justify-center',
                    sub.completed
                      ? 'bg-teal-500/80 border-teal-500/80'
                      : 'border-zinc-600 hover:border-teal-500/50'
                  )}
                >
                  {sub.completed && <Check size={8} strokeWidth={3} className="text-white" />}
                </button>
                <span className={cn(
                  'flex-1 text-xs truncate',
                  sub.completed ? 'line-through text-zinc-600' : 'text-zinc-300'
                )}>
                  {sub.title}
                </span>
                <button
                  onClick={() => onDeleteSubtask(todo.id, sub.id)}
                  className="shrink-0 opacity-0 group-hover/sub:opacity-100 text-zinc-700 hover:text-red-400 transition-opacity"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}

            {/* Add subtask input */}
            <div className="flex items-center gap-1.5 mt-1">
              <Plus size={11} className="text-zinc-600 shrink-0" />
              <input
                type="text"
                placeholder="하위 항목 추가..."
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={handleSubtaskKeyDown}
                className="flex-1 bg-transparent text-zinc-300 text-xs outline-none placeholder-zinc-600"
                spellCheck={false}
              />
              {subtaskInput.trim() && (
                <button
                  onClick={handleAddSubtask}
                  className="text-[10px] text-teal-400 hover:text-teal-300"
                >
                  추가
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
