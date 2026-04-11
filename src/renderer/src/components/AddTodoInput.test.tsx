import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddTodoInput } from './AddTodoInput'

const PLACEHOLDER = '할 일 추가... (#태그)'

describe('AddTodoInput', () => {
  it('renders input placeholder', () => {
    render(<AddTodoInput onAdd={vi.fn()} />)
    expect(screen.getByPlaceholderText(PLACEHOLDER)).toBeInTheDocument()
  })

  it('calls onAdd with trimmed value on Enter', async () => {
    const onAdd = vi.fn()
    render(<AddTodoInput onAdd={onAdd} />)
    const input = screen.getByPlaceholderText(PLACEHOLDER)
    await userEvent.type(input, '  New Task  {Enter}')
    expect(onAdd).toHaveBeenCalledWith('New Task', undefined)
  })

  it('parses #hashtags into tags', async () => {
    const onAdd = vi.fn()
    render(<AddTodoInput onAdd={onAdd} />)
    const input = screen.getByPlaceholderText(PLACEHOLDER)
    await userEvent.type(input, '할 일 #업무 #중요{Enter}')
    expect(onAdd).toHaveBeenCalledWith('할 일', ['업무', '중요'])
  })

  it('does not call onAdd for whitespace-only input', async () => {
    const onAdd = vi.fn()
    render(<AddTodoInput onAdd={onAdd} />)
    const input = screen.getByPlaceholderText(PLACEHOLDER)
    await userEvent.type(input, '   {Enter}')
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('clears input after adding', async () => {
    const onAdd = vi.fn()
    render(<AddTodoInput onAdd={onAdd} />)
    const input = screen.getByPlaceholderText(PLACEHOLDER)
    await userEvent.type(input, 'Task{Enter}')
    expect(input).toHaveValue('')
  })

  it('calls onAdd when 추가 button is clicked', async () => {
    const onAdd = vi.fn()
    render(<AddTodoInput onAdd={onAdd} />)
    const input = screen.getByPlaceholderText(PLACEHOLDER)
    await userEvent.type(input, 'New Task')
    await userEvent.click(screen.getByRole('button', { name: '추가' }))
    expect(onAdd).toHaveBeenCalledWith('New Task', undefined)
  })

  it('button is disabled when input is empty', () => {
    render(<AddTodoInput onAdd={vi.fn()} />)
    expect(screen.getByRole('button', { name: '추가' })).toBeDisabled()
  })
})
