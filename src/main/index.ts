import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage, screen, dialog } from 'electron'
import { get as httpsGet } from 'https'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerTodosIpc, readTodos, writeTodos } from './todos-store'

let tray: Tray | null = null
let mainWindow: BrowserWindow | null = null

function getWindowPosition(width: number, height: number): { x: number; y: number } {
  const trayBounds = tray?.getBounds()
  const display = trayBounds
    ? screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y })
    : screen.getPrimaryDisplay()
  const { x: wx, y: wy, width: sw, height: sh } = display.workArea
  return { x: wx + sw - width - 16, y: wy + sh - height - 16 }
}

function buildTrayMenu(): Menu {
  return Menu.buildFromTemplate([
    {
      label: '열기',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      },
    },
    { type: 'separator' },
    {
      label: '시작 시 자동 실행',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => {
        app.setLoginItemSettings({ openAtLogin: item.checked })
      },
    },
    { type: 'separator' },
    {
      label: '종료',
      click: () => app.quit(),
    },
  ])
}

function createTray(): void {
  const trayIcon = nativeImage.createFromPath(icon).resize({ width: 16, height: 16 })
  tray = new Tray(trayIcon)
  tray.setToolTip('Daily Todo List')
  tray.setContextMenu(buildTrayMenu())

  tray.on('click', () => {
    if (!mainWindow) return
    if (mainWindow.isVisible() && mainWindow.isFocused()) {
      mainWindow.hide()
    } else {
      const { x, y } = getWindowPosition(360, 560)
      mainWindow.setPosition(x, y)
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

function createWindow(): void {
  const width = 360
  const height = 560
  const { x, y } = getWindowPosition(width, height)

  mainWindow = new BrowserWindow({
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
    mainWindow?.show()
    mainWindow?.focus()
  })

  mainWindow.on('close', (e) => {
    e.preventDefault()
    mainWindow?.hide()
  })

  mainWindow.on('blur', () => {
    if (!is.dev) mainWindow?.hide()
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
}

app.whenReady().then(() => {
  registerTodosIpc()

  electronApp.setAppUserModelId('com.dailytodo.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('window:hide', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.hide()
  })

  ipcMain.handle('backup:export', async () => {
    const { filePath, canceled } = await dialog.showSaveDialog({
      defaultPath: `todos-backup-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    })
    if (canceled || !filePath) return false
    writeFileSync(filePath, readTodos(), 'utf-8')
    return true
  })

  ipcMain.handle('backup:import', async () => {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile'],
    })
    if (canceled || filePaths.length === 0) return null
    const json = readFileSync(filePaths[0], 'utf-8')
    JSON.parse(json) // validate — throws if invalid
    writeTodos(json)
    return json
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
    try {
      const body = await nodeGet('https://worldtimeapi.org/api/timezone/Asia/Seoul')
      const data = JSON.parse(body) as { datetime: string }
      return data.datetime.slice(0, 10)
    } catch { /* try fallback */ }

    try {
      const body = await nodeGet('https://timeapi.io/api/time/current/zone?timeZone=Asia/Seoul')
      const data = JSON.parse(body) as { year: number; month: number; day: number }
      const m = String(data.month).padStart(2, '0')
      const d = String(data.day).padStart(2, '0')
      return `${data.year}-${m}-${d}`
    } catch { /* fall through */ }

    return null
  })

  // Create tray first so getWindowPosition can use tray bounds (multi-monitor support)
  createTray()
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
