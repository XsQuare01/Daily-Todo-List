import { app, ipcMain, BrowserWindow } from 'electron'
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

export function getAllTags(): string[] {
  try {
    const todos = JSON.parse(readTodos()) as Array<{ tags?: string[] }>
    const set = new Set<string>()
    todos.forEach((t) => t.tags?.forEach((tag) => set.add(tag)))
    return Array.from(set).sort()
  } catch {
    return []
  }
}

export function registerTodosIpc(onSave?: () => void): void {
  ipcMain.handle('todos:get', () => readTodos())
  ipcMain.handle('todos:save', (_event, json: string) => {
    writeTodos(json)
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('todos:updated', json)
    }
    onSave?.()
  })
}
