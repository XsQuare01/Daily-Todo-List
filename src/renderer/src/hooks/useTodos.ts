import { useState, useEffect } from 'react'
import type { Todo, Priority, Subtask } from '../types/todo'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])

  useEffect(() => {
    window.api.getTodos().then((json) => {
      try {
        setTodos(JSON.parse(json))
      } catch {
        setTodos([])
      }
    })
  }, [])

  function save(updated: Todo[]) {
    setTodos(updated)
    window.api.saveTodos(JSON.stringify(updated))
  }

  function addTodo(title: string, date?: string, tags?: string[]) {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      title: title.trim(),
      completed: false,
      important: false,
      createdAt: date ?? today(),
      ...(tags && tags.length > 0 ? { tags } : {}),
    }
    save([...todos, newTodo])
  }

  function toggleComplete(id: string) {
    save(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
  }

  function toggleImportant(id: string) {
    save(todos.map((t) => (t.id === id ? { ...t, important: !t.important } : t)))
  }

  function deleteTodo(id: string) {
    save(todos.filter((t) => t.id !== id))
  }

  function updateDescription(id: string, description: string) {
    save(todos.map((t) => (t.id === id ? { ...t, description } : t)))
  }

  function updateDueDate(id: string, dueDate: string) {
    save(todos.map((t) => (t.id === id ? { ...t, dueDate: dueDate || undefined } : t)))
  }

  function updateTags(id: string, tags: string[]) {
    save(todos.map((t) => (t.id === id ? { ...t, tags: tags.length > 0 ? tags : undefined } : t)))
  }

  function updateElapsed(id: string, elapsedMs: number) {
    save(todos.map((t) => (t.id === id ? { ...t, elapsedMs: elapsedMs > 0 ? elapsedMs : undefined } : t)))
  }

  function updatePriority(id: string, priority: Priority | undefined) {
    save(todos.map((t) => (t.id === id ? { ...t, priority } : t)))
  }

  function addSubtask(id: string, title: string) {
    const sub: Subtask = { id: crypto.randomUUID(), title: title.trim(), completed: false }
    save(todos.map((t) => (t.id === id ? { ...t, subtasks: [...(t.subtasks ?? []), sub] } : t)))
  }

  function toggleSubtask(id: string, subtaskId: string) {
    save(
      todos.map((t) =>
        t.id === id
          ? { ...t, subtasks: t.subtasks?.map((s) => (s.id === subtaskId ? { ...s, completed: !s.completed } : s)) }
          : t
      )
    )
  }

  function deleteSubtask(id: string, subtaskId: string) {
    save(
      todos.map((t) => {
        if (t.id !== id) return t
        const filtered = t.subtasks?.filter((s) => s.id !== subtaskId)
        return { ...t, subtasks: filtered && filtered.length > 0 ? filtered : undefined }
      })
    )
  }

  function reorderTodos(activeId: string, overId: string) {
    const oldIndex = todos.findIndex((t) => t.id === activeId)
    const newIndex = todos.findIndex((t) => t.id === overId)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = [...todos]
    const [item] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, item)
    save(reordered)
  }

  return {
    todos,
    addTodo,
    toggleComplete,
    toggleImportant,
    deleteTodo,
    updateDescription,
    updateDueDate,
    updateTags,
    updateElapsed,
    updatePriority,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    reorderTodos,
  }
}
