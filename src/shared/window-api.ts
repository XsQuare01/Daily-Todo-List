export interface WindowApi {
  getTodos: () => Promise<string>
  saveTodos: (json: string) => Promise<void>
  hideWindow: () => void
  openDesktopApp: () => void
  getNetworkDate: () => Promise<string | null>
  onTodosUpdated: (callback: (json: string) => void) => () => void
  onFocusAdd: (callback: () => void) => () => void
}
