import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getTodos: (): Promise<string> => ipcRenderer.invoke('todos:get'),
  saveTodos: (json: string): Promise<void> => ipcRenderer.invoke('todos:save', json),
  hideWindow: (): void => ipcRenderer.send('window:hide'),
  getNetworkDate: (): Promise<string | null> => ipcRenderer.invoke('date:get-network'),
  onTodosUpdated: (callback: (json: string) => void): void => {
    ipcRenderer.on('todos:updated', (_event, json: string) => callback(json))
  },
  onFocusAdd: (callback: () => void): void => {
    ipcRenderer.on('app:focus-add', () => callback())
  },
})
