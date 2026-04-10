import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage, screen, net } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerTodosIpc } from './todos-store'

let tray: Tray | null = null

function getBottomRightPosition(width: number, height: number): { x: number; y: number } {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize
  return { x: sw - width - 16, y: sh - height - 16 }
}

function createTray(mainWindow: BrowserWindow): void {
  const trayIcon = nativeImage.createFromPath(icon).resize({ width: 16, height: 16 })
  tray = new Tray(trayIcon)
  tray.setToolTip('Daily Todo List')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '열기',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      },
    },
    { type: 'separator' },
    {
      label: '종료',
      click: () => {
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)

  // Single click to toggle popup
  tray.on('click', () => {
    if (mainWindow.isVisible() && mainWindow.isFocused()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

function createWindow(): void {
  const width = 360
  const height = 560
  const { x, y } = getBottomRightPosition(width, height)

  const mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: false,
    title: 'Daily Todo List',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  // Hide instead of close
  mainWindow.on('close', (e) => {
    e.preventDefault()
    mainWindow.hide()
  })

  // Hide when focus is lost (click outside)
  mainWindow.on('blur', () => {
    if (!is.dev) mainWindow.hide()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  createTray(mainWindow)
}

app.whenReady().then(() => {
  registerTodosIpc()

  electronApp.setAppUserModelId('com.dailytodolist.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('window:hide', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.hide()
  })

  ipcMain.handle('date:get-network', async () => {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 3000)
      const res = await net.fetch('https://worldtimeapi.org/api/timezone/Asia/Seoul', { signal: controller.signal })
      clearTimeout(timer)
      const data = await res.json() as { datetime: string }
      return (data.datetime as string).slice(0, 10)
    } catch {
      return null
    }
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
