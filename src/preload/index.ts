import { contextBridge, ipcRenderer } from 'electron'
import type { WindowApi } from '../shared/window-api'

const api: WindowApi = {
  getTodos: (): Promise<string> => ipcRenderer.invoke('todos:get'),
  saveTodos: (json: string): Promise<void> => ipcRenderer.invoke('todos:save', json),
  hideWindow: (): void => ipcRenderer.send('window:hide'),
  openDesktopApp: (): void => ipcRenderer.send('desktop:open'),
  getNetworkDate: (): Promise<string | null> => ipcRenderer.invoke('date:get-network'),
  onTodosUpdated: (callback: (json: string) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, json: string): void => callback(json)
    ipcRenderer.on('todos:updated', listener)
    return () => ipcRenderer.removeListener('todos:updated', listener)
  },
  onFocusAdd: (callback: () => void): (() => void) => {
    const listener = (): void => callback()
    ipcRenderer.on('app:focus-add', listener)
    return () => ipcRenderer.removeListener('app:focus-add', listener)
  },
}

contextBridge.exposeInMainWorld('api', api)
