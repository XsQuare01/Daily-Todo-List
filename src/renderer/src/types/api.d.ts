export {}

declare global {
  interface Window {
    api: {
      getTodos: () => Promise<string>
      saveTodos: (json: string) => Promise<void>
      hideWindow: () => void
      getNetworkDate: () => Promise<string | null>
      onTodosUpdated: (callback: (json: string) => void) => void
      onFocusAdd: (callback: () => void) => void
    }
  }
}
