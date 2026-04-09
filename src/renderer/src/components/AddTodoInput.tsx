import { useState, KeyboardEvent } from 'react'

interface Props {
  onAdd: (title: string) => void
}

export function AddTodoInput({ onAdd }: Props) {
  const [value, setValue] = useState('')

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && value.trim()) {
      onAdd(value.trim())
      setValue('')
    }
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-700">
      <span className="text-gray-500">+</span>
      <input
        className="flex-1 bg-transparent text-gray-300 placeholder-gray-600 outline-none text-sm"
        placeholder="할 일 추가..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}
