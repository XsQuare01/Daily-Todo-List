import { describe, it, expect } from 'vitest'
import type { Todo, FilterType } from './todo'

describe('Todo type', () => {
  it('has correct shape', () => {
    const todo: Todo = {
      id: '1',
      title: 'Test',
      completed: false,
      important: false,
      createdAt: '2026-04-09',
    }
    expect(todo.id).toBe('1')
    expect(todo.completed).toBe(false)
  })

  it('FilterType accepts all current values', () => {
    const filters: FilterType[] = ['today', 'all', 'important', 'completed', 'tag']
    expect(filters).toHaveLength(5)
  })
})
