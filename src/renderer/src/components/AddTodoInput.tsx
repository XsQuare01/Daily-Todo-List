import { useState, KeyboardEvent } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '../lib/utils'

interface Props {
  onAdd: (title: string) => void
}

export function AddTodoInput({ onAdd }: Props) {
  const [value, setValue] = useState('')

  function handleAdd() {
    if (value.trim()) {
      onAdd(value.trim())
      setValue('')
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-t border-zinc-800/60">
      <input
        className="flex-1 bg-transparent text-zinc-300 placeholder-zinc-600 outline-none text-base"
        placeholder="할 일 추가..."
        spellCheck={false}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button
        onClick={handleAdd}
        disabled={!value.trim()}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors active:scale-[0.96]',
          'bg-sky-600 text-white hover:bg-sky-500',
          'disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100'
        )}
      >
        <Plus size={12} />
        추가
      </button>
    </div>
  )
}
