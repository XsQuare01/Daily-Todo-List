import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage, screen } from 'electron'
import { get as httpsGet } from 'https'
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

  function nodeGet(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      httpsGet(url, { rejectUnauthorized: false }, (res) => {
        const chunks: Buffer[] = []
        res.on('data', (c: Buffer) => chunks.push(c))
        res.on('end', () => resolve(Buffer.concat(chunks).toString()))
        res.on('error', reject)
      }).on('error', reject)
    })
  }

  ipcMain.handle('date:get-network', async () => {
    // Primary: worldtimeapi.org
    try {
      const body = await nodeGet('https://worldtimeapi.org/api/timezone/Asia/Seoul')
      const data = JSON.parse(body) as { datetime: string }
      return data.datetime.slice(0, 10)
    } catch { /* try fallback */ }

    // Fallback: timeapi.io
    try {
      const body = await nodeGet('https://timeapi.io/api/time/current/zone?timeZone=Asia/Seoul')
      const data = JSON.parse(body) as { year: number; month: number; day: number }
      const m = String(data.month).padStart(2, '0')
      const d = String(data.day).padStart(2, '0')
      return `${data.year}-${m}-${d}`
    } catch { /* fall through */ }

    return null
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
