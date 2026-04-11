export interface Todo {
  id: string
  title: string
  description?: string
  completed: boolean
  important: boolean
  createdAt: string // ISO date string, e.g. "2026-04-09"
  dueDate?: string    // ISO date string, e.g. "2026-04-15"
  tags?: string[]     // e.g. ["work", "urgent"]
  elapsedMs?: number  // total elapsed milliseconds from stopwatch
}

export type FilterType = 'today' | 'all' | 'important' | 'completed' | 'tag'
