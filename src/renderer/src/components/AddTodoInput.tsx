import { useState, KeyboardEvent } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '../lib/utils'

interface Props {
  onAdd: (title: string, tags?: string[]) => void
}

function parseInput(raw: string): { title: string; tags: string[] } {
  const tags: string[] = []
  const title = raw
    .replace(/#([^\s#]+)/g, (_, tag: string) => {
      tags.push(tag)
      return ''
    })
    .replace(/\s+/g, ' ')
    .trim()
  return { title, tags }
}

export function AddTodoInput({ onAdd }: Props) {
  const [value, setValue] = useState('')

  function handleAdd() {
    const trimmed = value.trim()
    if (!trimmed) return
    const { title, tags } = parseInput(trimmed)
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
          'disabled:opacity-20 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none'
        )}
      >
        <Plus size={12} />
        추가
      </button>
    </div>
  )
}
