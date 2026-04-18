import { getKSTToday } from './date'
import type { Todo } from '../types/todo'

export function parseTodosJson(json: string): Todo[] {
  try {
    return JSON.parse(json) as Todo[]
  } catch {
    return []
  }
}

export async function loadTodos(): Promise<Todo[]> {
  const json = await window.api.getTodos()
  return parseTodosJson(json)
}

export function subscribeTodos(callback: (todos: Todo[]) => void): () => void {
  return window.api.onTodosUpdated((json) => {
    callback(parseTodosJson(json))
  })
}

export function persistTodos(todos: Todo[]): Promise<void> {
  return window.api.saveTodos(JSON.stringify(todos))
}

export function createTodo(title: string, date = getKSTToday(), tags?: string[]): Todo {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    completed: false,
    important: false,
    createdAt: date,
    ...(tags && tags.length > 0 ? { tags } : {}),
  }
}
