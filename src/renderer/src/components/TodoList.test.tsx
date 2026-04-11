import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TodoList } from './TodoList'
import type { Todo } from '../types/todo'

const todos: Todo[] = [
  { id: '1', title: '첫 번째', completed: false, important: false, createdAt: '2026-04-09' },
  { id: '2', title: '두 번째', completed: true, important: false, createdAt: '2026-04-09' },
]

const defaultProps = {
  activeTimerId: null,
  getDisplayElapsed: () => 0,
  onToggleComplete: vi.fn(),
  onToggleImportant: vi.fn(),
  onDelete: vi.fn(),
  onUpdateDescription: vi.fn(),
  onUpdateDueDate: vi.fn(),
  onUpdateTags: vi.fn(),
  onToggleTimer: vi.fn(),
  onResetTimer: vi.fn(),
  onUpdatePriority: vi.fn(),
  onAddSubtask: vi.fn(),
  onToggleSubtask: vi.fn(),
  onDeleteSubtask: vi.fn(),
  onReorder: vi.fn(),
}

describe('TodoList', () => {
  it('renders all todos', () => {
    render(<TodoList todos={todos} {...defaultProps} />)
    expect(screen.getByText('첫 번째')).toBeInTheDocument()
    expect(screen.getByText('두 번째')).toBeInTheDocument()
  })

  it('renders empty state message when no todos', () => {
    render(<TodoList todos={[]} {...defaultProps} />)
    expect(screen.getByText('할 일이 없습니다')).toBeInTheDocument()
  })
})
