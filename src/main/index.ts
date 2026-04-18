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
import { randomUUID } from 'crypto'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerTodosIpc, getAllTags } from './todos-store'
import { readSettings, updateSettings, type ExtraWidget, type WidgetBounds } from './settings-store'

let tray: Tray | null = null
let mainWindow: BrowserWindow | null = null
let desktopWindow: BrowserWindow | null = null
let widgetWindow: BrowserWindow | null = null
const extraWidgets = new Map<string, BrowserWindow>()

function getWindowPosition(width: number, height: number): { x: number; y: number } {
  const trayBounds = tray?.getBounds()
  const display = trayBounds
    ? screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y })
    : screen.getPrimaryDisplay()
  const { x: wx, y: wy, width: sw, height: sh } = display.workArea
  return { x: wx + sw - width - 16, y: wy + sh - height - 16 }
}

function buildTrayMenu(): Menu {
  const tags = getAllTags()
  const tagSubmenu: Electron.MenuItemConstructorOptions[] =
    tags.length > 0
      ? tags.map((tag) => ({
          label: `#${tag}`,
          click: () => spawnExtraWidgetForTag(tag),
        }))
      : [{ label: '(태그 없음)', enabled: false }]

  const openExtras: Electron.MenuItemConstructorOptions[] = Array.from(extraWidgets.entries()).map(
    ([id, win]) => {
      const cfg = readSettings().extraWidgets?.find((w) => w.id === id)
      return {
        label: `#${cfg?.tag ?? '?'} 닫기`,
        click: () => {
          if (!win.isDestroyed()) removeExtraWidget(id)
        },
      }
    }
  )

  return Menu.buildFromTemplate([
    {
      label: '열기',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      },
    },
    {
      label: '데스크톱 앱 열기',
      click: () => {
        openDesktopWindow()
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
      label: '태그 위젯 추가',
      submenu: tagSubmenu,
    },
    {
      label: '위젯 클릭 통과',
      type: 'checkbox',
      checked: readSettings().clickThrough ?? false,
      click: (item) => {
        updateSettings({ clickThrough: item.checked })
        applyClickThrough(item.checked)
      },
    },
    ...(openExtras.length > 0
      ? [
          { type: 'separator' as const },
          ...openExtras,
        ]
      : []),
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

const WIDGET_BASIC = { width: 260, height: 140 }
const WIDGET_MIN = { width: 240, height: 120 }
const WIDGET_MAX = { width: 800, height: 900 }
const WIDGET_DEFAULT = WIDGET_BASIC

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

const SNAP_THRESHOLD = 24
const SNAP_MARGIN = 12

function snapWidgetToEdges(): void {
  if (!widgetWindow) return
  const [x, y] = widgetWindow.getPosition()
  const [width, height] = widgetWindow.getSize()
  const display = screen.getDisplayNearestPoint({ x, y })
  const area = display.workArea

  let nextX = x
  let nextY = y

  const leftGap = x - area.x
  const rightGap = area.x + area.width - (x + width)
  const topGap = y - area.y
  const bottomGap = area.y + area.height - (y + height)

  if (leftGap < SNAP_THRESHOLD) nextX = area.x + SNAP_MARGIN
  else if (rightGap < SNAP_THRESHOLD) nextX = area.x + area.width - width - SNAP_MARGIN

  if (topGap < SNAP_THRESHOLD) nextY = area.y + SNAP_MARGIN
  else if (bottomGap < SNAP_THRESHOLD) nextY = area.y + area.height - height - SNAP_MARGIN

  if (nextX !== x || nextY !== y) {
    widgetWindow.setPosition(nextX, nextY, false)
  }
}

function persistWidgetBounds(): void {
  if (!widgetWindow) return
  const [x, y] = widgetWindow.getPosition()
  const [width, height] = widgetWindow.getSize()
  updateSettings({ widget: { x, y, width, height } })
}

function getDesktopWindowBounds(): { width: number; height: number; x: number; y: number } {
  const display = screen.getPrimaryDisplay()
  const area = display.workArea
  const width = Math.min(1920, Math.max(1280, area.width - 64))
  const height = Math.min(1080, Math.max(720, area.height - 64))
  const x = area.x + Math.round((area.width - width) / 2)
  const y = area.y + Math.round((area.height - height) / 2)
  return { width, height, x, y }
}

function createDesktopWindow(): void {
  if (desktopWindow && !desktopWindow.isDestroyed()) return

  const bounds = getDesktopWindowBounds()
  desktopWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 1280,
    minHeight: 720,
    frame: false,
    transparent: false,
    backgroundColor: '#0a0a0f',
    resizable: true,
    skipTaskbar: false,
    alwaysOnTop: false,
    title: 'Daily Todo Desktop',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  desktopWindow.on('close', (e) => {
    e.preventDefault()
    desktopWindow?.hide()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    desktopWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '?mode=desktop')
  } else {
    desktopWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      query: { mode: 'desktop' },
    })
  }
}

function openDesktopWindow(): void {
  if (!desktopWindow || desktopWindow.isDestroyed()) {
    createDesktopWindow()
  }

  desktopWindow?.show()
  desktopWindow?.focus()
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
    transparent: true,
    backgroundColor: '#00000000',
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

  // Snap to screen edges on move-end, then persist
  widgetWindow.on('moved', () => {
    snapWidgetToEdges()
    persistWidgetBounds()
  })
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

function applyClickThrough(enabled: boolean): void {
  const apply = (w: BrowserWindow | null): void => {
    if (w && !w.isDestroyed()) {
      w.setIgnoreMouseEvents(enabled, { forward: true })
    }
  }
  apply(widgetWindow)
  extraWidgets.forEach((w) => apply(w))
}

function persistExtraWidget(id: string): void {
  const win = extraWidgets.get(id)
  if (!win) return
  const [x, y] = win.getPosition()
  const [width, height] = win.getSize()
  const current = readSettings()
  const list = (current.extraWidgets ?? []).map((w) =>
    w.id === id ? { ...w, bounds: { x, y, width, height } } : w
  )
  updateSettings({ extraWidgets: list })
}

function removeExtraWidget(id: string): void {
  const win = extraWidgets.get(id)
  if (win && !win.isDestroyed()) {
    win.destroy()
  }
  extraWidgets.delete(id)
  const current = readSettings()
  updateSettings({
    extraWidgets: (current.extraWidgets ?? []).filter((w) => w.id !== id),
  })
  tray?.setContextMenu(buildTrayMenu())
}

function createExtraWidget(cfg: ExtraWidget): void {
  const bounds = clampWidgetBoundsToDisplay(cfg.bounds)

  const win = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: WIDGET_MIN.width,
    minHeight: WIDGET_MIN.height,
    maxWidth: WIDGET_MAX.width,
    maxHeight: WIDGET_MAX.height,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    title: `Todo #${cfg.tag}`,
    show: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  win.on('moved', () => persistExtraWidget(cfg.id))
  win.on('resized', () => persistExtraWidget(cfg.id))
  win.on('close', (e) => {
    e.preventDefault()
    removeExtraWidget(cfg.id)
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(
      `${process.env['ELECTRON_RENDERER_URL']}?mode=widget&tag=${encodeURIComponent(cfg.tag)}`
    )
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'), {
      query: { mode: 'widget', tag: cfg.tag },
    })
  }

  extraWidgets.set(cfg.id, win)
}

function spawnExtraWidgetForTag(tag: string): void {
  const display = screen.getPrimaryDisplay()
  const area = display.workArea
  const offset = extraWidgets.size * 28
  const bounds: WidgetBounds = {
    x: area.x + area.width - WIDGET_DEFAULT.width - 48 - offset,
    y: area.y + 80 + offset,
    width: WIDGET_DEFAULT.width,
    height: WIDGET_DEFAULT.height,
  }
  const cfg: ExtraWidget = { id: randomUUID(), tag, bounds }
  const current = readSettings()
  updateSettings({ extraWidgets: [...(current.extraWidgets ?? []), cfg] })
  createExtraWidget(cfg)
  applyClickThrough(readSettings().clickThrough ?? false)
  tray?.setContextMenu(buildTrayMenu())
}

function restoreExtraWidgets(): void {
  const saved = readSettings().extraWidgets ?? []
  saved.forEach((cfg) => createExtraWidget(cfg))
}

app.whenReady().then(() => {
  registerTodosIpc(() => {
    tray?.setContextMenu(buildTrayMenu())
  })

  electronApp.setAppUserModelId('com.dailytodo.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('window:hide', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.hide()
  })

  ipcMain.on('desktop:open', () => {
    openDesktopWindow()
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
  createDesktopWindow()
  createWidgetWindow()
  restoreExtraWidgets()
  applyClickThrough(readSettings().clickThrough ?? false)

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
