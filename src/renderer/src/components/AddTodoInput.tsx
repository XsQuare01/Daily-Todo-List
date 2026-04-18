import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Plus } from 'lucide-react'
import { parseTodoInput } from '../lib/todo-input'
import { cn } from '../lib/utils'

interface Props {
  onAdd: (title: string, tags?: string[]) => void
  focusSignal?: number
}

export function AddTodoInput({ onAdd, focusSignal }: Props) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (focusSignal === undefined) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [focusSignal])

  function handleAdd() {
    const trimmed = value.trim()
    if (!trimmed) return
    const { title, tags } = parseTodoInput(trimmed)
    if (title) {
      onAdd(title, tags.length > 0 ? tags : undefined)
      setValue('')
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.04] bg-white/[0.01]">
      <input
        ref={inputRef}
        className="flex-1 bg-transparent text-zinc-300 placeholder-zinc-600 outline-none text-[15px] tracking-[-0.01em]"
        placeholder="할 일 추가... (#태그)"
        spellCheck={false}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button
        onClick={handleAdd}
        disabled={!value.trim()}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg active:scale-[0.96]',
          'bg-teal-500 text-white hover:bg-teal-400 glow-teal',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none'
        )}
      >
        <Plus size={12} />
        추가
      </button>
    </div>
  )
}
