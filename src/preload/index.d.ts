import { ElectronAPI } from '@electron-toolkit/preload'
import type { WindowApi } from '../shared/window-api'

declare global {
  interface Window {
    electron: ElectronAPI
    api: WindowApi
  }
}
