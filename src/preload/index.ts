import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getTodos: (): Promise<string> => ipcRenderer.invoke('todos:get'),
  saveTodos: (json: string): Promise<void> => ipcRenderer.invoke('todos:save', json),
  hideWindow: (): void => ipcRenderer.send('window:hide'),
})
