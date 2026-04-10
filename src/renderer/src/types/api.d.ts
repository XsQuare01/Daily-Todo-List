export {}

declare global {
  interface Window {
    api: {
      getTodos: () => Promise<string>
      saveTodos: (json: string) => Promise<void>
      hideWindow: () => void
    }
  }
}
