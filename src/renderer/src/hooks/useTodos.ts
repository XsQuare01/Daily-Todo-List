import { useState, useEffect } from 'react'
import type { Todo } from '../types/todo'

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

  function addTodo(title: string) {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      title: title.trim(),
      completed: false,
      important: false,
      createdAt: today(),
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

  return { todos, addTodo, toggleComplete, toggleImportant, deleteTodo, updateDescription }
}
