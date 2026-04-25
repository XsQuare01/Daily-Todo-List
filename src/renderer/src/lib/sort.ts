import type { Todo, SortType } from '../types/todo'

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const

export function sortTodos(todos: Todo[], sort: SortType): Todo[] {
  if (sort === 'manual') return todos
  return [...todos].sort((a, b) => {
    switch (sort) {
      case 'priority': {
        const pa = a.priority != null ? PRIORITY_ORDER[a.priority] : 3
        const pb = b.priority != null ? PRIORITY_ORDER[b.priority] : 3
        return pa - pb
      }
      case 'dueDate': {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return a.dueDate.localeCompare(b.dueDate)
      }
      case 'createdAt':
        return a.createdAt.localeCompare(b.createdAt)
      default:
        return 0
    }
  })
}

export const SORT_LABELS: Record<SortType, string> = {
  manual: '기본',
  priority: '우선순위',
  dueDate: '마감일',
  createdAt: '생성일',
}

export const SORT_CYCLE: SortType[] = ['manual', 'priority', 'dueDate', 'createdAt']
