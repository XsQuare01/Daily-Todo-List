import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WidgetView from './WidgetView'

const mockGetTodos = vi.fn()
const mockSaveTodos = vi.fn()
const mockGetNetworkDate = vi.fn()
const mockOnTodosUpdated = vi.fn()
const mockOnFocusAdd = vi.fn()
const mockOpenDesktopApp = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()

  mockGetTodos.mockResolvedValue(
    JSON.stringify([
      { id: '1', title: '작업 A', completed: false, important: false, createdAt: '2026-04-18' },
    ])
  )
  mockSaveTodos.mockResolvedValue(undefined)
  mockGetNetworkDate.mockResolvedValue('2026-04-18')
  mockOnTodosUpdated.mockImplementation(() => () => {})
  mockOnFocusAdd.mockImplementation(() => () => {})

  Object.defineProperty(window, 'api', {
    value: {
      getTodos: mockGetTodos,
      saveTodos: mockSaveTodos,
      hideWindow: vi.fn(),
      openDesktopApp: mockOpenDesktopApp,
      getNetworkDate: mockGetNetworkDate,
      onTodosUpdated: mockOnTodosUpdated,
      onFocusAdd: mockOnFocusAdd,
    },
    writable: true,
  })
})

describe('WidgetView', () => {
  it('uses the smaller basic widget as the default mode', async () => {
    render(<WidgetView />)

    expect(await screen.findByText('작업 A')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('빠른 추가... (#태그)')).not.toBeInTheDocument()
  })

  it('opens the desktop app when the header button is clicked', async () => {
    const user = userEvent.setup()
    render(<WidgetView />)

    await screen.findByText('작업 A')
    await user.click(screen.getByRole('button', { name: '데스크톱 앱 열기' }))

    await waitFor(() => {
      expect(mockOpenDesktopApp).toHaveBeenCalledOnce()
    })
  })
})
