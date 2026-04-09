import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TodoItem } from './TodoItem'
import type { Todo } from '../types/todo'

const todo: Todo = {
  id: '1',
  title: '테스트 할 일',
  completed: false,
  important: false,
  createdAt: '2026-04-09',
}

describe('TodoItem', () => {
  it('renders the todo title', () => {
    render(<TodoItem todo={todo} onToggleComplete={vi.fn()} onToggleImportant={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('테스트 할 일')).toBeInTheDocument()
  })

  it('calls onToggleComplete when checkbox clicked', async () => {
    const onToggleComplete = vi.fn()
    render(<TodoItem todo={todo} onToggleComplete={onToggleComplete} onToggleImportant={vi.fn()} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onToggleComplete).toHaveBeenCalledWith('1')
  })

  it('shows line-through when completed', () => {
    render(<TodoItem todo={{ ...todo, completed: true }} onToggleComplete={vi.fn()} onToggleImportant={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('테스트 할 일')).toHaveClass('line-through')
  })

  it('calls onDelete when delete button clicked', async () => {
    const onDelete = vi.fn()
    render(<TodoItem todo={todo} onToggleComplete={vi.fn()} onToggleImportant={vi.fn()} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole('button', { name: /삭제/i }))
    expect(onDelete).toHaveBeenCalledWith('1')
  })

  it('calls onToggleImportant when star button clicked', async () => {
    const onToggleImportant = vi.fn()
    render(<TodoItem todo={todo} onToggleComplete={vi.fn()} onToggleImportant={onToggleImportant} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /중요/i }))
    expect(onToggleImportant).toHaveBeenCalledWith('1')
  })
})
