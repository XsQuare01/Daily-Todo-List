import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { Maximize2, ArrowLeft, ExternalLink, Plus } from 'lucide-react'
import { formatDate, getKSTToday } from './lib/date'
import { loadTodos, persistTodos, createTodo, subscribeTodos } from './lib/todos-ipc'
import { parseTodoInput } from './lib/todo-input'
import { cn } from './lib/utils'
import type { Todo, Priority, Subtask } from './types/todo'

const drag = { WebkitAppRegion: 'drag' } as React.CSSProperties
const noDrag = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

const PRIORITY_DOT: Record<Priority, string> = {
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-blue-400',
}

const PRIORITY_LABEL: Record<Priority, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
}

const PRIORITY_ORDER: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

const filterTag = new URLSearchParams(window.location.search).get('tag') ?? null

export default function WidgetView() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [today, setToday] = useState(getKSTToday)
  const [hovered, setHovered] = useState(false)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null)
  const [addMode, setAddMode] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [subtaskInput, setSubtaskInput] = useState('')
  const addInputRef = useRef<HTMLInputElement>(null)
  const subtaskInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadTodos().then(setTodos)

    window.api.getNetworkDate().then((date) => {
      if (date) setToday(date)
    }).catch(() => {})

    return subscribeTodos(setTodos)
  }, [])

  const todayTodos = filterTag
    ? todos.filter((t) => !t.completed && t.tags?.includes(filterTag))
    : todos.filter((t) => t.createdAt === today && !t.completed)

  const sortedTodos = [...todayTodos].sort((a, b) => {
    const pa = a.priority ? PRIORITY_ORDER[a.priority] : 3
    const pb = b.priority ? PRIORITY_ORDER[b.priority] : 3
    return pa - pb
  })

  const selectedTodo = selectedId ? todos.find((t) => t.id === selectedId) ?? null : null

  function save(updated: Todo[]) {
    setTodos(updated)
    void persistTodos(updated)
  }

  function handleComplete(id: string) {
    save(todos.map((t) => (t.id === id ? { ...t, completed: true } : t)))
    setSelectedId(null)
  }

  function handleSubtaskToggle(todoId: string, subtaskId: string) {
    save(
      todos.map((t) =>
        t.id === todoId
          ? { ...t, subtasks: t.subtasks?.map((s) => (s.id === subtaskId ? { ...s, completed: !s.completed } : s)) }
          : t
      )
    )
  }

  function handleAddSubtask(todoId: string) {
    const title = subtaskInput.trim()
    if (!title) return
    const sub: Subtask = { id: crypto.randomUUID(), title, completed: false }
    save(
      todos.map((t) =>
        t.id === todoId ? { ...t, subtasks: [...(t.subtasks ?? []), sub] } : t
      )
    )
    setSubtaskInput('')
    subtaskInputRef.current?.focus()
  }

  function handleSubtaskKeyDown(e: KeyboardEvent<HTMLInputElement>, todoId: string) {
    if (e.key === 'Enter') handleAddSubtask(todoId)
    if (e.key === 'Escape') setSubtaskInput('')
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    setCtxMenu({ x: e.clientX, y: e.clientY })
  }

  function openAddMode() {
    setCtxMenu(null)
    setAddMode(true)
    requestAnimationFrame(() => addInputRef.current?.focus())
  }

  function handleAddKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setAddMode(false)
      return
    }
    if (e.key !== 'Enter') return
    const raw = (e.target as HTMLInputElement).value.trim()
    if (!raw) return
    const { title, tags } = parseTodoInput(raw)
    if (!title) return
    const newTodo = createTodo(title, today, tags.length > 0 ? tags : filterTag ? [filterTag] : undefined)
    save([...todos, newTodo])
    ;(e.target as HTMLInputElement).value = ''
    setAddMode(false)
  }

  return (
    <div
      style={{ ...drag, opacity: hovered ? 1 : 0.72 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setCtxMenu(null) }}
      onContextMenu={handleContextMenu}
      onClick={() => setCtxMenu(null)}
      className="w-full h-full flex flex-col overflow-hidden select-none font-sans transition-[opacity,background-color,backdrop-filter] duration-200 rounded-[18px] bg-[#0b0d12]/58 border border-white/[0.16] backdrop-blur-2xl shadow-[0_10px_34px_rgba(0,0,0,0.24)]"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-2 pb-1 shrink-0">
        {selectedTodo && (
          <button
            style={noDrag}
            onClick={() => { setSelectedId(null); setSubtaskInput('') }}
            className="shrink-0 size-[25px] flex items-center justify-center rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.06] active:scale-[0.96]"
          >
            <ArrowLeft size={14} />
          </button>
        )}
        <span className="flex-1 text-[14px] text-white/40 font-medium tracking-wide uppercase truncate">
          {filterTag ? `#${filterTag}` : formatDate(today)}
        </span>
        <button
          style={noDrag}
          onClick={() => window.api.openDesktopApp()}
          aria-label="데스크톱 앱 열기"
          title="데스크톱 앱 열기"
          className="shrink-0 size-[25px] flex items-center justify-center rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.06] active:scale-[0.96]"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {selectedTodo ? (
        /* ── Detail view ── */
        <div style={noDrag} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-3 pb-2 scrollbar-none">
            {/* Title */}
            <p className="text-[16px] font-semibold text-white/88 leading-snug mb-2">
              {selectedTodo.title}
            </p>

            {/* Priority + due date */}
            {(selectedTodo.priority || selectedTodo.dueDate) && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedTodo.priority && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/[0.06] text-[13px] text-white/55">
                    <span className={cn('size-[6px] rounded-full', PRIORITY_DOT[selectedTodo.priority])} />
                    {PRIORITY_LABEL[selectedTodo.priority]}
                  </span>
                )}
                {selectedTodo.dueDate && (
                  <span className="px-1.5 py-0.5 rounded-md bg-white/[0.06] text-[13px] text-white/55">
                    {selectedTodo.dueDate}
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            {selectedTodo.description && (
              <p className="text-[14px] text-white/50 leading-relaxed mb-2">
                {selectedTodo.description}
              </p>
            )}

            {/* Tags */}
            {selectedTodo.tags && selectedTodo.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedTodo.tags.map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 rounded-md bg-teal-500/15 text-[13px] text-teal-300/70">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Link */}
            {selectedTodo.link && (
              <a
                href={selectedTodo.link}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-[13px] text-teal-400/70 hover:text-teal-300 mb-2 truncate"
              >
                <ExternalLink size={11} className="shrink-0" />
                <span className="truncate">{selectedTodo.link}</span>
              </a>
            )}

            {/* ── Subtasks ── */}
            <div className="border-t border-white/[0.06] pt-2 mt-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] text-white/35 font-medium">하위 항목</span>
                {(selectedTodo.subtasks?.length ?? 0) > 0 && (
                  <span className="text-[13px] text-white/25 tabular-nums">
                    {selectedTodo.subtasks!.filter((s) => s.completed).length}/{selectedTodo.subtasks!.length}
                  </span>
                )}
              </div>

              {/* Subtask list */}
              {selectedTodo.subtasks && selectedTodo.subtasks.length > 0 && (
                <div className="flex flex-col gap-0.5 mb-1.5">
                  {selectedTodo.subtasks.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => handleSubtaskToggle(selectedTodo.id, sub.id)}
                      className="flex items-center gap-2 w-full text-left hover:bg-white/[0.04] rounded-lg px-1.5 py-1 active:scale-[0.99]"
                    >
                      <span className={cn(
                        'shrink-0 size-[13px] rounded-full border',
                        sub.completed ? 'bg-teal-400/60 border-teal-400/60' : 'border-white/25'
                      )} />
                      <span className={cn(
                        'text-[14px] truncate',
                        sub.completed ? 'text-white/30 line-through' : 'text-white/65'
                      )}>
                        {sub.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Add subtask input */}
              <div className="flex items-center gap-1.5">
                <Plus size={13} className="shrink-0 text-white/25" />
                <input
                  ref={subtaskInputRef}
                  type="text"
                  placeholder="하위 항목 추가..."
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  onKeyDown={(e) => handleSubtaskKeyDown(e, selectedTodo.id)}
                  className="flex-1 bg-transparent text-[14px] text-white/70 placeholder-white/20 outline-none"
                  spellCheck={false}
                />
                {subtaskInput.trim() && (
                  <button
                    onClick={() => handleAddSubtask(selectedTodo.id)}
                    className="shrink-0 text-[13px] text-teal-400/80 hover:text-teal-300"
                  >
                    추가
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Complete button */}
          <div className="shrink-0 px-3 pb-2.5">
            <button
              onClick={() => handleComplete(selectedTodo.id)}
              className="w-full h-[35px] rounded-lg bg-teal-500/20 border border-teal-400/25 text-[14px] text-teal-300/80 hover:bg-teal-500/30 hover:text-teal-200 active:scale-[0.98] transition-colors"
            >
              완료로 표시
            </button>
          </div>
        </div>
      ) : (
        /* ── Todo list ── */
        <>
          <div style={noDrag} className="flex-1 overflow-y-auto px-2.5 pb-2 min-h-0 scrollbar-none">
            {sortedTodos.length > 0 ? (
              <div className="flex flex-col gap-0.5">
                {sortedTodos.map((todo) => (
                  <button
                    key={todo.id}
                    onClick={() => setSelectedId(todo.id)}
                    className="flex items-center gap-2 w-full text-left hover:bg-white/[0.04] rounded-xl px-2 py-1.5 active:scale-[0.99]"
                  >
                    <span className="shrink-0 size-[15px] rounded-full border border-white/25" />
                    {todo.priority && (
                      <span className={cn('shrink-0 size-[6px] rounded-full', PRIORITY_DOT[todo.priority])} />
                    )}
                    <span className="flex-1 min-w-0 text-[15px] text-white/78 truncate">
                      {todo.title}
                    </span>
                    {todo.subtasks && todo.subtasks.length > 0 && (
                      <span className="shrink-0 text-[13px] text-white/28 tabular-nums">
                        {todo.subtasks.filter((s) => s.completed).length}/{todo.subtasks.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="text-[15px] text-white/28">할 일 없음</div>
                <div className="text-[13px] text-white/18 mt-1">필요할 때 크게 열기</div>
              </div>
            )}
          </div>

          {/* Inline add input */}
          {addMode && (
            <div style={noDrag} className="shrink-0 px-2.5 pb-2">
              <input
                ref={addInputRef}
                type="text"
                placeholder="할 일 입력... (#태그)"
                spellCheck={false}
                onKeyDown={handleAddKeyDown}
                onBlur={() => setAddMode(false)}
                className="w-full h-[35px] px-2 rounded-lg bg-white/[0.06] border border-white/[0.14] text-[14px] text-white/80 placeholder-white/30 outline-none focus:border-teal-400/50"
              />
            </div>
          )}
        </>
      )}

      {/* Context menu */}
      {ctxMenu && (
        <div
          style={{ ...noDrag, position: 'fixed', left: ctxMenu.x, top: ctxMenu.y }}
          className="z-50 min-w-[120px] py-1 rounded-lg bg-[#1a1d24] border border-white/[0.14] shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
        >
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={openAddMode}
            className="w-full text-left px-3 py-1.5 text-[14px] text-white/70 hover:bg-white/[0.08] hover:text-white/90 transition-colors"
          >
            할 일 추가
          </button>
        </div>
      )}
    </div>
  )
}
