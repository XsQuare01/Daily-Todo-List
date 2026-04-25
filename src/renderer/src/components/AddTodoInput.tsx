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
        className="flex-1 h-11 px-3 bg-white/[0.03] border-2 border-white/[0.24] rounded-lg text-zinc-100 placeholder-zinc-500 outline-none text-[17px] font-medium tracking-[-0.015em] focus-visible:border-white/90 focus-visible:outline-[3px] focus-visible:outline-white/85 focus-visible:outline-offset-0"
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
          'shrink-0 h-11 flex items-center gap-1.5 px-3 py-1.5 text-[15px] font-semibold rounded-md whitespace-nowrap active:scale-[0.96]',
          'border-2 border-white/20 bg-teal-500 text-white hover:bg-teal-400 hover:border-white/35 glow-teal',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none'
        )}
      >
        <Plus size={13} />
        추가
      </button>
    </div>
  )
}
