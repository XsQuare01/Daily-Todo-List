import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  screen,
  globalShortcut,
} from 'electron'
import { get as httpsGet } from 'https'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerTodosIpc } from './todos-store'
import { readSettings, updateSettings } from './settings-store'

let tray: Tray | null = null
let mainWindow: BrowserWindow | null = null
let widgetWindow: BrowserWindow | null = null

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
      label: '위젯 표시',
      type: 'checkbox',
      checked: widgetWindow?.isVisible() ?? false,
      click: (item) => {
        if (item.checked) {
          widgetWindow?.show()
        } else {
          widgetWindow?.hide()
        }
      },
    },
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
      widgetWindow?.show()
    } else {
      widgetWindow?.hide()
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
    transparent: false,
    backgroundColor: '#0a0a0f',
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
    widgetWindow?.hide()
  })

  mainWindow.on('close', (e) => {
    e.preventDefault()
    mainWindow?.hide()
    widgetWindow?.show()
  })

  mainWindow.on('blur', () => {
    if (!is.dev) {
      mainWindow?.hide()
      widgetWindow?.show()
    }
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

const WIDGET_MIN = { width: 220, height: 160 }
const WIDGET_MAX = { width: 800, height: 900 }
const WIDGET_DEFAULT = { width: 320, height: 480 }

function clampWidgetBoundsToDisplay(b: { x: number; y: number; width: number; height: number }): {
  x: number
  y: number
  width: number
  height: number
} {
  const width = Math.min(WIDGET_MAX.width, Math.max(WIDGET_MIN.width, b.width))
  const height = Math.min(WIDGET_MAX.height, Math.max(WIDGET_MIN.height, b.height))
  const display = screen.getDisplayNearestPoint({ x: b.x, y: b.y })
  const area = display.workArea
  const x = Math.min(Math.max(b.x, area.x), area.x + area.width - width)
  const y = Math.min(Math.max(b.y, area.y), area.y + area.height - height)
  return { x, y, width, height }
}

function persistWidgetBounds(): void {
  if (!widgetWindow) return
  const [x, y] = widgetWindow.getPosition()
  const [width, height] = widgetWindow.getSize()
  updateSettings({ widget: { x, y, width, height } })
}

function createWidgetWindow(): void {
  const saved = readSettings().widget
  const fallbackDisplay = screen.getPrimaryDisplay()
  const { x: wx, y: wy, width: sw, height: sh } = fallbackDisplay.workArea
  const fallback = {
    x: wx + sw - WIDGET_DEFAULT.width - 16,
    y: wy + sh - WIDGET_DEFAULT.height - 80,
    ...WIDGET_DEFAULT,
  }
  const bounds = clampWidgetBoundsToDisplay(saved ?? fallback)

  widgetWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: WIDGET_MIN.width,
    minHeight: WIDGET_MIN.height,
    maxWidth: WIDGET_MAX.width,
    maxHeight: WIDGET_MAX.height,
    frame: false,
    transparent: false,
    backgroundColor: '#0a0a0f',
    resizable: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    title: 'Daily Todo Widget',
    show: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  // Persist position/size (debounced via 'moved'/'resized' end events)
  widgetWindow.on('moved', persistWidgetBounds)
  widgetWindow.on('resized', persistWidgetBounds)

  // Don't close, just hide
  widgetWindow.on('close', (e) => {
    e.preventDefault()
    widgetWindow?.hide()
    tray?.setContextMenu(buildTrayMenu())
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    widgetWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '?mode=widget')
  } else {
    widgetWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      query: { mode: 'widget' },
    })
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

  createTray()
  createWindow()
  createWidgetWindow()

  // Refresh tray menu after widget is created
  tray?.setContextMenu(buildTrayMenu())

  // Global shortcuts
  globalShortcut.register('Control+Shift+D', () => {
    if (!widgetWindow) return
    if (widgetWindow.isVisible()) {
      widgetWindow.hide()
    } else {
      widgetWindow.show()
    }
    tray?.setContextMenu(buildTrayMenu())
  })

  globalShortcut.register('Control+Shift+N', () => {
    if (!mainWindow) return
    widgetWindow?.hide()
    const { x, y } = getWindowPosition(360, 560)
    mainWindow.setPosition(x, y)
    mainWindow.show()
    mainWindow.focus()
    mainWindow.webContents.send('app:focus-add')
  })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
