import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from './App'

const mockGetTodos = vi.fn()
const mockSaveTodos = vi.fn()
const mockGetNetworkDate = vi.fn()
const mockOnTodosUpdated = vi.fn()
const mockOnFocusAdd = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()

  mockGetTodos.mockResolvedValue('[]')
  mockSaveTodos.mockResolvedValue(undefined)
  mockGetNetworkDate.mockResolvedValue('2026-04-18')
  mockOnTodosUpdated.mockImplementation(() => () => {})
  mockOnFocusAdd.mockImplementation(() => () => {})

  Object.defineProperty(window, 'api', {
    value: {
      getTodos: mockGetTodos,
      saveTodos: mockSaveTodos,
      hideWindow: vi.fn(),
      openDesktopApp: vi.fn(),
      getNetworkDate: mockGetNetworkDate,
      onTodosUpdated: mockOnTodosUpdated,
      onFocusAdd: mockOnFocusAdd,
    },
    writable: true,
  })
})

describe('App desktop mode', () => {
  it('renders the desktop management workspace shell', async () => {
    render(<App mode="desktop" />)

    expect(screen.getByText('Daily Todo 관리 화면')).toBeInTheDocument()
    expect(screen.getByText('Desktop Workspace')).toBeInTheDocument()
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Important').length).toBeGreaterThan(0)
    expect(screen.getByText('Pending Lane')).toBeInTheDocument()
    expect(screen.getByText('Important Lane')).toBeInTheDocument()
    expect(screen.queryByText('Completed')).not.toBeInTheDocument()
    expect(screen.queryByText('Tags')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(mockGetTodos).toHaveBeenCalled()
    })
  })
})
