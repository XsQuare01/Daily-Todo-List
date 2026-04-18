import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sidebar } from './Sidebar'

describe('Sidebar', () => {
  it('renders all current filter labels', () => {
    render(<Sidebar activeFilter="today" onFilterChange={vi.fn()} />)
    expect(screen.getByText('날짜')).toBeInTheDocument()
    expect(screen.getByText('전체')).toBeInTheDocument()
    expect(screen.getByText('중요')).toBeInTheDocument()
    expect(screen.getByText('완료')).toBeInTheDocument()
    expect(screen.getByText('태그')).toBeInTheDocument()
  })

  it('highlights the active filter button', () => {
    render(<Sidebar activeFilter="all" onFilterChange={vi.fn()} />)
    expect(screen.getByText('전체').closest('button')).toHaveClass('bg-zinc-800')
  })

  it('calls onFilterChange with the correct key when clicked', async () => {
    const onFilterChange = vi.fn()
    render(<Sidebar activeFilter="today" onFilterChange={onFilterChange} />)
    await userEvent.click(screen.getByText('중요'))
    expect(onFilterChange).toHaveBeenCalledWith('important')
  })
})
