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

export function registerTodosIpc(): void {
  ipcMain.handle('todos:get', () => readTodos())
  ipcMain.handle('todos:save', (_event, json: string) => {
    writeTodos(json)
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('todos:updated', json)
    }
  })
}
