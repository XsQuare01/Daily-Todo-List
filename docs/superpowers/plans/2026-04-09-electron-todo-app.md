# Daily Todo List — Electron App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Daily Todo List desktop app using Electron + React + TypeScript + Vite + Tailwind CSS with local JSON file storage.

**Architecture:** electron-vite scaffolds Main/Preload/Renderer as separate processes. Main handles file I/O via IPC handlers, Preload exposes a safe API via contextBridge, and Renderer is a React SPA with a sidebar+list layout. State management lives in the `useTodos` hook.

**Tech Stack:** Electron 28+, electron-vite 2+, React 18, TypeScript 5, Vite 5, Tailwind CSS 3, Vitest, @testing-library/react

---

## File Map

| File | Responsibility |
|---|---|
| `src/main/index.ts` | Window creation, lifecycle, register IPC |
| `src/main/todos-store.ts` | Read/write `todos.json` via `app.getPath('userData')` |
| `src/preload/index.ts` | contextBridge — expose `window.api` |
| `src/renderer/src/types/todo.ts` | `Todo` interface, `FilterType` |
| `src/renderer/src/types/api.d.ts` | Global `window.api` TypeScript declaration |
| `src/renderer/src/hooks/useTodos.ts` | Load/save todos via IPC, CRUD operations |
| `src/renderer/src/components/Sidebar.tsx` | Filter navigation |
| `src/renderer/src/components/TodoList.tsx` | Render list of TodoItems or empty state |
| `src/renderer/src/components/TodoItem.tsx` | Single todo row with check/star/delete |
| `src/renderer/src/components/AddTodoInput.tsx` | Input for adding new todos |
| `src/renderer/src/App.tsx` | Root layout — wires sidebar + list + input |
| `src/renderer/src/index.css` | Tailwind base imports |
| `vitest.config.ts` | Vitest config (separate from electron-vite config) |
| `src/renderer/src/test-setup.ts` | jest-dom matchers setup |

---

### Task 1: Scaffold the Project

**Files:**
- Creates all project files via electron-vite CLI

- [ ] **Step 1: Scaffold electron-vite react-ts project**

Run inside `C:/Users/mystic6113/Daily-Todo-List`:
```bash
npm create @quick-start/electron@latest . -- --template react-ts
```
If prompted "Current directory is not empty. Remove existing files and continue?" — choose **Yes** (only `.git` and `docs/` exist, they won't be touched by npm create).

If `.` isn't accepted, scaffold to a temp name then merge:
```bash
npm create @quick-start/electron@latest tmp-app -- --template react-ts
cp -r tmp-app/. .
rm -rf tmp-app
```

- [ ] **Step 2: Install dependencies**
```bash
npm install
```

- [ ] **Step 3: Verify the scaffold runs**
```bash
npm run dev
```
Expected: Electron window opens showing the default template UI. Close it.

- [ ] **Step 4: Commit scaffold**
```bash
git add .
git commit -m "chore: scaffold electron-vite react-ts project"
```

---

### Task 2: Configure Tailwind CSS

**Files:**
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `src/renderer/src/index.css`
- Modify: `src/renderer/src/main.tsx` — add CSS import

- [ ] **Step 1: Install Tailwind CSS**
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 2: Replace `tailwind.config.js` content**
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 3: Create `src/renderer/src/index.css`**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Add CSS import to `src/renderer/src/main.tsx`**

Open `src/renderer/src/main.tsx`. Add this as the first import line (remove any existing CSS import):
```tsx
import './index.css'
```

- [ ] **Step 5: Verify Tailwind works**

Open `src/renderer/src/App.tsx` and replace whatever is there with:
```tsx
export default function App() {
  return <h1 className="text-3xl font-bold text-blue-500 p-8">Tailwind works!</h1>
}
```
Run `npm run dev` — text should be large, bold, and blue. Close the window.

- [ ] **Step 6: Commit**
```bash
git add tailwind.config.js postcss.config.js src/renderer/src/index.css src/renderer/src/main.tsx src/renderer/src/App.tsx
git commit -m "chore: configure Tailwind CSS"
```

---

### Task 3: Types and Vitest Setup

**Files:**
- Create: `src/renderer/src/types/todo.ts`
- Create: `src/renderer/src/types/todo.test.ts`
- Create: `src/renderer/src/test-setup.ts`
- Create: `vitest.config.ts`
- Modify: `package.json` — add test script

- [ ] **Step 1: Install Vitest and testing libraries**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 2: Create `vitest.config.ts`**
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/renderer/src/test-setup.ts'],
    include: ['src/renderer/src/**/*.test.{ts,tsx}'],
  },
})
```

- [ ] **Step 3: Create `src/renderer/src/test-setup.ts`**
```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Add test script to `package.json`**

Open `package.json` and add to `"scripts"`:
```json
"test": "vitest run"
```

- [ ] **Step 5: Create `src/renderer/src/types/todo.ts`**
```ts
export interface Todo {
  id: string
  title: string
  completed: boolean
  important: boolean
  createdAt: string // ISO date string, e.g. "2026-04-09"
}

export type FilterType = 'today' | 'all' | 'important' | 'completed'
```

- [ ] **Step 6: Write type smoke test**

Create `src/renderer/src/types/todo.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import type { Todo, FilterType } from './todo'

describe('Todo type', () => {
  it('has correct shape', () => {
    const todo: Todo = {
      id: '1',
      title: 'Test',
      completed: false,
      important: false,
      createdAt: '2026-04-09',
    }
    expect(todo.id).toBe('1')
    expect(todo.completed).toBe(false)
  })

  it('FilterType accepts all four values', () => {
    const filters: FilterType[] = ['today', 'all', 'important', 'completed']
    expect(filters).toHaveLength(4)
  })
})
```

- [ ] **Step 7: Run tests**
```bash
npm test
```
Expected: 2 tests pass.

- [ ] **Step 8: Commit**
```bash
git add src/renderer/src/types/ src/renderer/src/test-setup.ts vitest.config.ts package.json
git commit -m "chore: add Todo types and Vitest setup"
```

---

### Task 4: Main Process — IPC File Handlers

**Files:**
- Create: `src/main/todos-store.ts`
- Modify: `src/main/index.ts`

- [ ] **Step 1: Create `src/main/todos-store.ts`**
```ts
import { app, ipcMain } from 'electron'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

function getTodosPath(): string {
  return join(app.getPath('userData'), 'todos.json')
}

export function readTodos(): string {
  const filePath = getTodosPath()
  if (!existsSync(filePath)) return '[]'
  return readFileSync(filePath, 'utf-8')
}

export function writeTodos(json: string): void {
  writeFileSync(getTodosPath(), json, 'utf-8')
}

export function registerTodosIpc(): void {
  ipcMain.handle('todos:get', () => readTodos())
  ipcMain.handle('todos:save', (_event, json: string) => {
    writeTodos(json)
  })
}
```

- [ ] **Step 2: Register IPC in `src/main/index.ts`**

Open `src/main/index.ts`. Add this import at the top:
```ts
import { registerTodosIpc } from './todos-store'
```

Then inside the `app.whenReady().then(...)` callback, add `registerTodosIpc()` as the first line:
```ts
app.whenReady().then(() => {
  registerTodosIpc()
  // ... rest of existing code
})
```

- [ ] **Step 3: Verify app still starts**
```bash
npm run dev
```
Expected: Electron window opens without console errors. Close it.

- [ ] **Step 4: Commit**
```bash
git add src/main/todos-store.ts src/main/index.ts
git commit -m "feat: add IPC handlers for todos file I/O"
```

---

### Task 5: Preload Script — contextBridge API

**Files:**
- Modify: `src/preload/index.ts`
- Create: `src/renderer/src/types/api.d.ts`

- [ ] **Step 1: Replace `src/preload/index.ts`**
```ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getTodos: (): Promise<string> => ipcRenderer.invoke('todos:get'),
  saveTodos: (json: string): Promise<void> => ipcRenderer.invoke('todos:save', json),
})
```

- [ ] **Step 2: Create `src/renderer/src/types/api.d.ts`**
```ts
export {}

declare global {
  interface Window {
    api: {
      getTodos: () => Promise<string>
      saveTodos: (json: string) => Promise<void>
    }
  }
}
```

- [ ] **Step 3: Verify app still starts**
```bash
npm run dev
```
Expected: Electron window opens without errors. Close it.

- [ ] **Step 4: Commit**
```bash
git add src/preload/index.ts src/renderer/src/types/api.d.ts
git commit -m "feat: expose todos API via contextBridge"
```

---

### Task 6: useTodos Hook

**Files:**
- Create: `src/renderer/src/hooks/useTodos.ts`
- Create: `src/renderer/src/hooks/useTodos.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/renderer/src/hooks/useTodos.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTodos } from './useTodos'

const mockGetTodos = vi.fn()
const mockSaveTodos = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(window, 'api', {
    value: { getTodos: mockGetTodos, saveTodos: mockSaveTodos },
    writable: true,
  })
})

describe('useTodos', () => {
  it('loads todos from api on mount', async () => {
    const initial = [{ id: '1', title: 'Test', completed: false, important: false, createdAt: '2026-04-09' }]
    mockGetTodos.mockResolvedValue(JSON.stringify(initial))

    const { result } = renderHook(() => useTodos())
    await act(async () => {})

    expect(mockGetTodos).toHaveBeenCalledOnce()
    expect(result.current.todos).toHaveLength(1)
    expect(result.current.todos[0].title).toBe('Test')
  })

  it('addTodo creates a new todo and saves', async () => {
    mockGetTodos.mockResolvedValue('[]')
    mockSaveTodos.mockResolvedValue(undefined)

    const { result } = renderHook(() => useTodos())
    await act(async () => {})

    await act(async () => {
      result.current.addTodo('New task')
    })

    expect(result.current.todos).toHaveLength(1)
    expect(result.current.todos[0].title).toBe('New task')
    expect(result.current.todos[0].completed).toBe(false)
    expect(mockSaveTodos).toHaveBeenCalledOnce()
  })

  it('toggleComplete flips completed and saves', async () => {
    const initial = [{ id: '1', title: 'Test', completed: false, important: false, createdAt: '2026-04-09' }]
    mockGetTodos.mockResolvedValue(JSON.stringify(initial))
    mockSaveTodos.mockResolvedValue(undefined)

    const { result } = renderHook(() => useTodos())
    await act(async () => {})

    await act(async () => {
      result.current.toggleComplete('1')
    })

    expect(result.current.todos[0].completed).toBe(true)
    expect(mockSaveTodos).toHaveBeenCalledOnce()
  })

  it('toggleImportant flips important and saves', async () => {
    const initial = [{ id: '1', title: 'Test', completed: false, important: false, createdAt: '2026-04-09' }]
    mockGetTodos.mockResolvedValue(JSON.stringify(initial))
    mockSaveTodos.mockResolvedValue(undefined)

    const { result } = renderHook(() => useTodos())
    await act(async () => {})

    await act(async () => {
      result.current.toggleImportant('1')
    })

    expect(result.current.todos[0].important).toBe(true)
    expect(mockSaveTodos).toHaveBeenCalledOnce()
  })

  it('deleteTodo removes todo and saves', async () => {
    const initial = [{ id: '1', title: 'Test', completed: false, important: false, createdAt: '2026-04-09' }]
    mockGetTodos.mockResolvedValue(JSON.stringify(initial))
    mockSaveTodos.mockResolvedValue(undefined)

    const { result } = renderHook(() => useTodos())
    await act(async () => {})

    await act(async () => {
      result.current.deleteTodo('1')
    })

    expect(result.current.todos).toHaveLength(0)
    expect(mockSaveTodos).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**
```bash
npm test
```
Expected: FAIL — "useTodos" not found.

- [ ] **Step 3: Implement `src/renderer/src/hooks/useTodos.ts`**
```ts
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

  return { todos, addTodo, toggleComplete, toggleImportant, deleteTodo }
}
```

- [ ] **Step 4: Run tests**
```bash
npm test
```
Expected: All tests pass.

- [ ] **Step 5: Commit**
```bash
git add src/renderer/src/hooks/
git commit -m "feat: implement useTodos hook with IPC integration"
```

---

### Task 7: AddTodoInput Component

**Files:**
- Create: `src/renderer/src/components/AddTodoInput.tsx`
- Create: `src/renderer/src/components/AddTodoInput.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/renderer/src/components/AddTodoInput.test.tsx`:
```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**
```bash
npm test
```
Expected: FAIL — AddTodoInput not found.

- [ ] **Step 3: Implement `src/renderer/src/components/AddTodoInput.tsx`**
```tsx
import { useState, KeyboardEvent } from 'react'

interface Props {
  onAdd: (title: string) => void
}

export function AddTodoInput({ onAdd }: Props) {
  const [value, setValue] = useState('')

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && value.trim()) {
      onAdd(value.trim())
      setValue('')
    }
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-700">
      <span className="text-gray-500">+</span>
      <input
        className="flex-1 bg-transparent text-gray-300 placeholder-gray-600 outline-none text-sm"
        placeholder="할 일 추가..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run tests**
```bash
npm test
```
Expected: All tests pass.

- [ ] **Step 5: Commit**
```bash
git add src/renderer/src/components/AddTodoInput.tsx src/renderer/src/components/AddTodoInput.test.tsx
git commit -m "feat: add AddTodoInput component"
```

---

### Task 8: TodoItem Component

**Files:**
- Create: `src/renderer/src/components/TodoItem.tsx`
- Create: `src/renderer/src/components/TodoItem.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/renderer/src/components/TodoItem.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TodoItem } from './TodoItem'
import type { Todo } from '../types/todo'

const todo: Todo = {
  id: '1',
  title: '테스트 할 일',
  completed: false,
  important: false,
  createdAt: '2026-04-09',
}

describe('TodoItem', () => {
  it('renders the todo title', () => {
    render(<TodoItem todo={todo} onToggleComplete={vi.fn()} onToggleImportant={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('테스트 할 일')).toBeInTheDocument()
  })

  it('calls onToggleComplete when checkbox clicked', async () => {
    const onToggleComplete = vi.fn()
    render(<TodoItem todo={todo} onToggleComplete={onToggleComplete} onToggleImportant={vi.fn()} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onToggleComplete).toHaveBeenCalledWith('1')
  })

  it('shows line-through when completed', () => {
    render(<TodoItem todo={{ ...todo, completed: true }} onToggleComplete={vi.fn()} onToggleImportant={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('테스트 할 일')).toHaveClass('line-through')
  })

  it('calls onDelete when delete button clicked', async () => {
    const onDelete = vi.fn()
    render(<TodoItem todo={todo} onToggleComplete={vi.fn()} onToggleImportant={vi.fn()} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole('button', { name: /삭제/i }))
    expect(onDelete).toHaveBeenCalledWith('1')
  })

  it('calls onToggleImportant when star button clicked', async () => {
    const onToggleImportant = vi.fn()
    render(<TodoItem todo={todo} onToggleComplete={vi.fn()} onToggleImportant={onToggleImportant} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /중요/i }))
    expect(onToggleImportant).toHaveBeenCalledWith('1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**
```bash
npm test
```
Expected: FAIL — TodoItem not found.

- [ ] **Step 3: Implement `src/renderer/src/components/TodoItem.tsx`**
```tsx
import type { Todo } from '../types/todo'

interface Props {
  todo: Todo
  onToggleComplete: (id: string) => void
  onToggleImportant: (id: string) => void
  onDelete: (id: string) => void
}

export function TodoItem({ todo, onToggleComplete, onToggleImportant, onDelete }: Props) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700/50 group">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggleComplete(todo.id)}
        className="w-4 h-4 cursor-pointer accent-blue-500"
      />
      <span
        className={`flex-1 text-sm ${
          todo.completed ? 'line-through text-gray-500' : 'text-gray-200'
        }`}
      >
        {todo.title}
      </span>
      <button
        aria-label="중요"
        onClick={() => onToggleImportant(todo.id)}
        className={`text-sm px-1 transition-opacity ${
          todo.important
            ? 'text-yellow-400'
            : 'opacity-0 group-hover:opacity-100 text-gray-500'
        }`}
      >
        ★
      </button>
      <button
        aria-label="삭제"
        onClick={() => onDelete(todo.id)}
        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 text-sm px-1 transition-opacity"
      >
        ✕
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**
```bash
npm test
```
Expected: All tests pass.

- [ ] **Step 5: Commit**
```bash
git add src/renderer/src/components/TodoItem.tsx src/renderer/src/components/TodoItem.test.tsx
git commit -m "feat: add TodoItem component"
```

---

### Task 9: TodoList Component

**Files:**
- Create: `src/renderer/src/components/TodoList.tsx`
- Create: `src/renderer/src/components/TodoList.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/renderer/src/components/TodoList.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TodoList } from './TodoList'
import type { Todo } from '../types/todo'

const todos: Todo[] = [
  { id: '1', title: '첫 번째', completed: false, important: false, createdAt: '2026-04-09' },
  { id: '2', title: '두 번째', completed: true, important: false, createdAt: '2026-04-09' },
]

describe('TodoList', () => {
  it('renders all todos', () => {
    render(<TodoList todos={todos} onToggleComplete={vi.fn()} onToggleImportant={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('첫 번째')).toBeInTheDocument()
    expect(screen.getByText('두 번째')).toBeInTheDocument()
  })

  it('renders empty state message when no todos', () => {
    render(<TodoList todos={[]} onToggleComplete={vi.fn()} onToggleImportant={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('할 일이 없습니다')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**
```bash
npm test
```
Expected: FAIL — TodoList not found.

- [ ] **Step 3: Implement `src/renderer/src/components/TodoList.tsx`**
```tsx
import { TodoItem } from './TodoItem'
import type { Todo } from '../types/todo'

interface Props {
  todos: Todo[]
  onToggleComplete: (id: string) => void
  onToggleImportant: (id: string) => void
  onDelete: (id: string) => void
}

export function TodoList({ todos, onToggleComplete, onToggleImportant, onDelete }: Props) {
  if (todos.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
        할 일이 없습니다
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggleComplete={onToggleComplete}
          onToggleImportant={onToggleImportant}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run tests**
```bash
npm test
```
Expected: All tests pass.

- [ ] **Step 5: Commit**
```bash
git add src/renderer/src/components/TodoList.tsx src/renderer/src/components/TodoList.test.tsx
git commit -m "feat: add TodoList component"
```

---

### Task 10: Sidebar Component

**Files:**
- Create: `src/renderer/src/components/Sidebar.tsx`
- Create: `src/renderer/src/components/Sidebar.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/renderer/src/components/Sidebar.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sidebar } from './Sidebar'

describe('Sidebar', () => {
  it('renders all four filter labels', () => {
    render(<Sidebar activeFilter="today" onFilterChange={vi.fn()} />)
    expect(screen.getByText('오늘')).toBeInTheDocument()
    expect(screen.getByText('전체')).toBeInTheDocument()
    expect(screen.getByText('중요')).toBeInTheDocument()
    expect(screen.getByText('완료')).toBeInTheDocument()
  })

  it('highlights the active filter button', () => {
    render(<Sidebar activeFilter="all" onFilterChange={vi.fn()} />)
    expect(screen.getByText('전체').closest('button')).toHaveClass('bg-gray-700')
  })

  it('calls onFilterChange with the correct key when clicked', async () => {
    const onFilterChange = vi.fn()
    render(<Sidebar activeFilter="today" onFilterChange={onFilterChange} />)
    await userEvent.click(screen.getByText('중요'))
    expect(onFilterChange).toHaveBeenCalledWith('important')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**
```bash
npm test
```
Expected: FAIL — Sidebar not found.

- [ ] **Step 3: Implement `src/renderer/src/components/Sidebar.tsx`**
```tsx
import type { FilterType } from '../types/todo'

interface Props {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
}

const FILTERS: { key: FilterType; label: string; icon: string }[] = [
  { key: 'today', label: '오늘', icon: '📅' },
  { key: 'all', label: '전체', icon: '📋' },
  { key: 'important', label: '중요', icon: '⭐' },
  { key: 'completed', label: '완료', icon: '✅' },
]

export function Sidebar({ activeFilter, onFilterChange }: Props) {
  return (
    <aside className="w-48 bg-gray-800 border-r border-gray-700 flex flex-col p-3 gap-1">
      <div className="text-xs font-bold text-blue-400 uppercase tracking-widest px-2 py-2">
        TODAY
      </div>
      {FILTERS.map(({ key, label, icon }) => (
        <button
          key={key}
          onClick={() => onFilterChange(key)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
            activeFilter === key
              ? 'bg-gray-700 text-gray-100'
              : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
          }`}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </aside>
  )
}
```

- [ ] **Step 4: Run tests**
```bash
npm test
```
Expected: All tests pass.

- [ ] **Step 5: Commit**
```bash
git add src/renderer/src/components/Sidebar.tsx src/renderer/src/components/Sidebar.test.tsx
git commit -m "feat: add Sidebar component"
```

---

### Task 11: Wire Up App.tsx + Final Polish

**Files:**
- Modify: `src/renderer/src/App.tsx`
- Modify: `src/main/index.ts` — set window size and title

- [ ] **Step 1: Replace `src/renderer/src/App.tsx`**
```tsx
import { useState, useMemo } from 'react'
import { Sidebar } from './components/Sidebar'
import { TodoList } from './components/TodoList'
import { AddTodoInput } from './components/AddTodoInput'
import { useTodos } from './hooks/useTodos'
import type { FilterType } from './types/todo'

const FILTER_TITLES: Record<FilterType, string> = {
  today: '오늘의 할 일',
  all: '전체 할 일',
  important: '중요 할 일',
  completed: '완료된 할 일',
}

export default function App() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('today')
  const { todos, addTodo, toggleComplete, toggleImportant, deleteTodo } = useTodos()

  const today = new Date().toISOString().slice(0, 10)

  const filteredTodos = useMemo(() => {
    switch (activeFilter) {
      case 'today':
        return todos.filter((t) => t.createdAt === today && !t.completed)
      case 'all':
        return todos.filter((t) => !t.completed)
      case 'important':
        return todos.filter((t) => t.important && !t.completed)
      case 'completed':
        return todos.filter((t) => t.completed)
    }
  }, [todos, activeFilter, today])

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 select-none">
      <Sidebar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      <main className="flex flex-col flex-1 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h1 className="text-lg font-semibold text-gray-100">
            {FILTER_TITLES[activeFilter]}
          </h1>
        </div>
        <TodoList
          todos={filteredTodos}
          onToggleComplete={toggleComplete}
          onToggleImportant={toggleImportant}
          onDelete={deleteTodo}
        />
        {activeFilter !== 'completed' && <AddTodoInput onAdd={addTodo} />}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Set window size and title in `src/main/index.ts`**

Find the `new BrowserWindow({...})` call. Update the options to include:
```ts
const mainWindow = new BrowserWindow({
  width: 900,
  height: 650,
  minWidth: 600,
  minHeight: 400,
  title: 'Daily Todo List',
  // keep all existing options (webPreferences, etc.)
})
```

- [ ] **Step 3: Run all tests**
```bash
npm test
```
Expected: All tests pass.

- [ ] **Step 4: Run the app end-to-end**
```bash
npm run dev
```
Expected:
- Electron window opens at ~900×650 titled "Daily Todo List"
- Sidebar shows 오늘/전체/중요/완료 filters
- Can add a todo by typing in the input and pressing Enter
- Can check/uncheck, star, and delete todos
- Close and reopen the app — todos persist

- [ ] **Step 5: Final commit**
```bash
git add src/renderer/src/App.tsx src/main/index.ts
git commit -m "feat: wire up App layout and set window properties"
```
