import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTodos } from './useTodos'

const mockGetTodos = vi.fn()
const mockSaveTodos = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(window, 'api', {
    value: { getTodos: mockGetTodos, saveTodos: mockSaveTodos },
    writable: true,
  })
})

describe('useTodos', () => {
  it('loads todos from api on mount', async () => {
    const initial = [{ id: '1', title: 'Test', completed: false, important: false, createdAt: '2026-04-09' }]
    mockGetTodos.mockResolvedValue(JSON.stringify(initial))

    const { result } = renderHook(() => useTodos())
    await act(async () => {})

    expect(mockGetTodos).toHaveBeenCalledOnce()
    expect(result.current.todos).toHaveLength(1)
    expect(result.current.todos[0].title).toBe('Test')
  })

  it('addTodo creates a new todo and saves', async () => {
    mockGetTodos.mockResolvedValue('[]')
    mockSaveTodos.mockResolvedValue(undefined)

    const { result } = renderHook(() => useTodos())
    await act(async () => {})

    await act(async () => {
      result.current.addTodo('New task')
    })

    expect(result.current.todos).toHaveLength(1)
    expect(result.current.todos[0].title).toBe('New task')
    expect(result.current.todos[0].completed).toBe(false)
    expect(mockSaveTodos).toHaveBeenCalledOnce()
  })

  it('toggleComplete flips completed and saves', async () => {
    const initial = [{ id: '1', title: 'Test', completed: false, important: false, createdAt: '2026-04-09' }]
    mockGetTodos.mockResolvedValue(JSON.stringify(initial))
    mockSaveTodos.mockResolvedValue(undefined)

    const { result } = renderHook(() => useTodos())
    await act(async () => {})

    await act(async () => {
      result.current.toggleComplete('1')
    })

    expect(result.current.todos[0].completed).toBe(true)
    expect(mockSaveTodos).toHaveBeenCalledOnce()
  })

  it('toggleImportant flips important and saves', async () => {
    const initial = [{ id: '1', title: 'Test', completed: false, important: false, createdAt: '2026-04-09' }]
    mockGetTodos.mockResolvedValue(JSON.stringify(initial))
    mockSaveTodos.mockResolvedValue(undefined)

    const { result } = renderHook(() => useTodos())
    await act(async () => {})

    await act(async () => {
      result.current.toggleImportant('1')
    })

    expect(result.current.todos[0].important).toBe(true)
    expect(mockSaveTodos).toHaveBeenCalledOnce()
  })

  it('deleteTodo removes todo and saves', async () => {
    const initial = [{ id: '1', title: 'Test', completed: false, important: false, createdAt: '2026-04-09' }]
    mockGetTodos.mockResolvedValue(JSON.stringify(initial))
    mockSaveTodos.mockResolvedValue(undefined)

    const { result } = renderHook(() => useTodos())
    await act(async () => {})

    await act(async () => {
      result.current.deleteTodo('1')
    })

    expect(result.current.todos).toHaveLength(0)
    expect(mockSaveTodos).toHaveBeenCalledOnce()
  })
})
