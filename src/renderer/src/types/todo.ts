export interface Todo {
  id: string
  title: string
  completed: boolean
  important: boolean
  createdAt: string // ISO date string, e.g. "2026-04-09"
}

export type FilterType = 'today' | 'all' | 'important' | 'completed'
