import { configDir, join } from "@tauri-apps/api/path";
import { exists, mkdir, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

export const SETTINGS_DIR_NAME = "dreamloom";
export const SETTINGS_FILE_NAME = "settings.json";
export const SESSION_LOGS_SUBDIR = "logs";
export const DEFAULT_INACTIVE_EVICTION_DELAY_MS = 60_000;
export const MIN_INACTIVE_EVICTION_DELAY_MS = 1000;
export const DEFAULT_UI_ZOOM = 1.0;
export const DEFAULT_TEXT_ZOOM = 1.0;
export const DEFAULT_LOG_FONT_SIZE = 12;
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 3.0;
export const MIN_LOG_FONT_SIZE = 8;
export const MAX_LOG_FONT_SIZE = 32;

export type AppSettings = {
  inactiveEvictionDelay: number;
  debugMode: boolean;
  uiZoom: number;
  textZoom: number;
  logFontSize: number;
};

export const defaultSettings: AppSettings = {
  inactiveEvictionDelay: DEFAULT_INACTIVE_EVICTION_DELAY_MS,
  debugMode: false,
  uiZoom: DEFAULT_UI_ZOOM,
  textZoom: DEFAULT_TEXT_ZOOM,
  logFontSize: DEFAULT_LOG_FONT_SIZE,
};

export function clampZoom(value: number): number {
  const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
  return Math.round(clamped * 10) / 10;
}

export function clampLogFontSize(value: number): number {
  return Math.min(MAX_LOG_FONT_SIZE, Math.max(MIN_LOG_FONT_SIZE, Math.round(value)));
}

/** Per-user app config directory (Tauri `configDir` + `dreamloom`), e.g. `~/.config/dreamloom` on Linux. */
export async function dreamloomConfigDir(): Promise<string> {
  return join(await configDir(), SETTINGS_DIR_NAME);
}

export async function settingsDirPath(): Promise<string> {
  return dreamloomConfigDir();
}

export async function sessionLogsDir(): Promise<string> {
  return join(await dreamloomConfigDir(), SESSION_LOGS_SUBDIR);
}

export async function settingsFilePath(): Promise<string> {
  return join(await dreamloomConfigDir(), SETTINGS_FILE_NAME);
}

async function ensureSettingsDir(): Promise<void> {
  const dir = await dreamloomConfigDir();
  if (!(await exists(dir))) {
    await mkdir(dir, { recursive: true });
  }
}

export function clampSettings(raw: Partial<AppSettings>): AppSettings {
  const delay = raw.inactiveEvictionDelay ?? DEFAULT_INACTIVE_EVICTION_DELAY_MS;
  return {
    inactiveEvictionDelay: Math.max(MIN_INACTIVE_EVICTION_DELAY_MS, Math.round(delay)),
    debugMode: raw.debugMode ?? false,
    uiZoom: clampZoom(raw.uiZoom ?? DEFAULT_UI_ZOOM),
    textZoom: clampZoom(raw.textZoom ?? DEFAULT_TEXT_ZOOM),
    logFontSize: clampLogFontSize(raw.logFontSize ?? DEFAULT_LOG_FONT_SIZE),
  };
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const path = await settingsFilePath();
    if (!(await exists(path))) {
      return { ...defaultSettings };
    }

    const raw = JSON.parse(await readTextFile(path)) as Partial<AppSettings>;
    return clampSettings(raw);
  } catch {
    return { ...defaultSettings };
  }
}

export async function saveSettings(next: AppSettings): Promise<void> {
  await ensureSettingsDir();
  const clamped = clampSettings(next);
  await writeTextFile(await settingsFilePath(), `${JSON.stringify(clamped, null, 2)}\n`);
}
