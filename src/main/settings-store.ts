import { app } from 'electron'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

export interface WidgetBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface ExtraWidget {
  id: string
  tag: string
  bounds: WidgetBounds
}

export interface Settings {
  widget?: WidgetBounds
  extraWidgets?: ExtraWidget[]
  clickThrough?: boolean
}

function getSettingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

export function readSettings(): Settings {
  const filePath = getSettingsPath()
  if (!existsSync(filePath)) return {}
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8')) as Settings
  } catch {
    return {}
  }
}

export function writeSettings(settings: Settings): void {
  writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf-8')
}

export function updateSettings(patch: Partial<Settings>): Settings {
  const current = readSettings()
  const next = { ...current, ...patch }
  writeSettings(next)
  return next
}
