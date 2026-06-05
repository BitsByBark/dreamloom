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
export const DEFAULT_UNDO_STACK_DEPTH = 100;
export const MIN_UNDO_STACK_DEPTH = 10;
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 3.0;
export const MIN_LOG_FONT_SIZE = 8;
export const MAX_LOG_FONT_SIZE = 32;
/** Fixed app accent — not user-configurable. */
export const ACCENT_COLOR = "#AACC00";

export type WindowDecorationsMode = "native" | "none" | "dreamloom";

const WINDOW_DECORATION_MODES: WindowDecorationsMode[] = ["native", "none", "dreamloom"];

export function clampWindowDecorations(
  value: string | undefined,
): WindowDecorationsMode {
  if (value && WINDOW_DECORATION_MODES.includes(value as WindowDecorationsMode)) {
    return value as WindowDecorationsMode;
  }
  return "native";
}

export type AppSettings = {
  inactiveEvictionDelay: number;
  debugMode: boolean;
  uiZoom: number;
  textZoom: number;
  logFontSize: number;
  /** Max number of property-change undo entries kept before dropping oldest. */
  undoStackDepth: number;
  /** Parent directory whose immediate subfolders appear on the welcome screen. */
  workingFolder: string;
  topbarShowAvatar: boolean;
  topbarShowUsername: boolean;
  topbarShowDiff: boolean;
  topbarShowFilesChanged: boolean;
  topbarShowBranch: boolean;
  windowDecorations: WindowDecorationsMode;
};

export const defaultSettings: AppSettings = {
  inactiveEvictionDelay: DEFAULT_INACTIVE_EVICTION_DELAY_MS,
  debugMode: false,
  uiZoom: DEFAULT_UI_ZOOM,
  textZoom: DEFAULT_TEXT_ZOOM,
  logFontSize: DEFAULT_LOG_FONT_SIZE,
  undoStackDepth: DEFAULT_UNDO_STACK_DEPTH,
  workingFolder: "",
  topbarShowAvatar: true,
  topbarShowUsername: true,
  topbarShowDiff: true,
  topbarShowFilesChanged: true,
  topbarShowBranch: true,
  windowDecorations: "native",
};

export function clampZoom(value: number): number {
  const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
  return Math.round(clamped * 10) / 10;
}

export function clampLogFontSize(value: number): number {
  return Math.min(MAX_LOG_FONT_SIZE, Math.max(MIN_LOG_FONT_SIZE, Math.round(value)));
}

/** No upper bound; floor at MIN_UNDO_STACK_DEPTH. */
export function clampUndoStackDepth(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_UNDO_STACK_DEPTH;
  }
  return Math.max(MIN_UNDO_STACK_DEPTH, Math.round(value));
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

function normalizeWorkingFolder(path: string | undefined): string {
  if (typeof path !== "string") {
    return "";
  }

  return path.trim().replace(/\\/g, "/");
}

export function clampSettings(raw: Partial<AppSettings>): AppSettings {
  const delay = raw.inactiveEvictionDelay ?? DEFAULT_INACTIVE_EVICTION_DELAY_MS;
  return {
    inactiveEvictionDelay: Math.max(MIN_INACTIVE_EVICTION_DELAY_MS, Math.round(delay)),
    debugMode: raw.debugMode ?? false,
    uiZoom: clampZoom(raw.uiZoom ?? DEFAULT_UI_ZOOM),
    textZoom: clampZoom(raw.textZoom ?? DEFAULT_TEXT_ZOOM),
    logFontSize: clampLogFontSize(raw.logFontSize ?? DEFAULT_LOG_FONT_SIZE),
    undoStackDepth: clampUndoStackDepth(raw.undoStackDepth ?? DEFAULT_UNDO_STACK_DEPTH),
    workingFolder: normalizeWorkingFolder(raw.workingFolder),
    topbarShowAvatar: raw.topbarShowAvatar ?? true,
    topbarShowUsername: raw.topbarShowUsername ?? true,
    topbarShowDiff: raw.topbarShowDiff ?? true,
    topbarShowFilesChanged: raw.topbarShowFilesChanged ?? true,
    topbarShowBranch: raw.topbarShowBranch ?? true,
    windowDecorations: clampWindowDecorations(raw.windowDecorations),
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
