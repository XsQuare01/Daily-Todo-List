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

const defaultProps = {
  onToggleComplete: vi.fn(),
  onToggleImportant: vi.fn(),
  onDelete: vi.fn(),
  onUpdateDescription: vi.fn(),
}

describe('TodoItem', () => {
  it('renders the todo title', () => {
    render(<TodoItem todo={todo} {...defaultProps} />)
    expect(screen.getByText('테스트 할 일')).toBeInTheDocument()
  })

  it('calls onToggleComplete when checkbox clicked', async () => {
    const onToggleComplete = vi.fn()
    render(<TodoItem todo={todo} {...defaultProps} onToggleComplete={onToggleComplete} />)
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onToggleComplete).toHaveBeenCalledWith('1')
  })

  it('shows line-through when completed', () => {
    render(<TodoItem todo={{ ...todo, completed: true }} {...defaultProps} />)
    expect(screen.getByText('테스트 할 일')).toHaveClass('line-through')
  })

  it('calls onDelete when delete button clicked', async () => {
    const onDelete = vi.fn()
    render(<TodoItem todo={todo} {...defaultProps} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole('button', { name: /삭제/i }))
    expect(onDelete).toHaveBeenCalledWith('1')
  })

  it('calls onToggleImportant when star button clicked', async () => {
    const onToggleImportant = vi.fn()
    render(<TodoItem todo={todo} {...defaultProps} onToggleImportant={onToggleImportant} />)
    await userEvent.click(screen.getByRole('button', { name: /중요/i }))
    expect(onToggleImportant).toHaveBeenCalledWith('1')
  })

  it('expands description textarea when title is clicked', async () => {
    render(<TodoItem todo={todo} {...defaultProps} />)
    await userEvent.click(screen.getByText('테스트 할 일'))
    expect(screen.getByPlaceholderText('메모 추가...')).toBeInTheDocument()
  })

  it('calls onUpdateDescription on textarea blur', async () => {
    const onUpdateDescription = vi.fn()
    render(<TodoItem todo={todo} {...defaultProps} onUpdateDescription={onUpdateDescription} />)
    await userEvent.click(screen.getByText('테스트 할 일'))
    const textarea = screen.getByPlaceholderText('메모 추가...')
    await userEvent.type(textarea, '설명 내용')
    await userEvent.tab()
    expect(onUpdateDescription).toHaveBeenCalledWith('1', '설명 내용')
  })
})
