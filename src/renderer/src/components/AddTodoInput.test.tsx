import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddTodoInput } from './AddTodoInput'

describe('AddTodoInput', () => {
  it('renders input placeholder', () => {
    render(<AddTodoInput onAdd={vi.fn()} />)
    expect(screen.getByPlaceholderText('할 일 추가...')).toBeInTheDocument()
  })

  it('calls onAdd with trimmed value on Enter', async () => {
    const onAdd = vi.fn()
    render(<AddTodoInput onAdd={onAdd} />)
    const input = screen.getByPlaceholderText('할 일 추가...')
    await userEvent.type(input, '  New Task  {Enter}')
    expect(onAdd).toHaveBeenCalledWith('New Task')
  })

  it('does not call onAdd for whitespace-only input', async () => {
    const onAdd = vi.fn()
    render(<AddTodoInput onAdd={onAdd} />)
    const input = screen.getByPlaceholderText('할 일 추가...')
    await userEvent.type(input, '   {Enter}')
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('clears input after adding', async () => {
    const onAdd = vi.fn()
    render(<AddTodoInput onAdd={onAdd} />)
    const input = screen.getByPlaceholderText('할 일 추가...')
    await userEvent.type(input, 'Task{Enter}')
    expect(input).toHaveValue('')
  })
})
