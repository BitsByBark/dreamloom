import { invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import { exists, mkdir, open, readDir, remove, type FileHandle } from "@tauri-apps/plugin-fs";

export type SessionLogLevel = "good" | "warn" | "perf" | "error";

export const LOGS_SUBDIR = "runtime/logs";
export const MAX_LOG_FILES = 5;
const LOG_EXTENSION = ".log";

let sessionFile: FileHandle | undefined;
let initFailed = false;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatSessionLogTimestamp(time: number): string {
  const date = new Date(time);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function sessionLogFileName(time: number): string {
  const date = new Date(time);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}${LOG_EXTENSION}`;
}

function formatSessionLogLine(level: SessionLogLevel, message: string, time: number): string {
  return `${formatSessionLogTimestamp(time)} [${level}] ${message}\n`;
}

async function pruneOldLogs(logsDir: string): Promise<void> {
  const entries = await readDir(logsDir);
  const logFiles = entries
    .filter((entry) => entry.isFile && entry.name?.endsWith(LOG_EXTENSION))
    .map((entry) => entry.name as string)
    .sort((a, b) => b.localeCompare(a));

  while (logFiles.length >= MAX_LOG_FILES) {
    const oldest = logFiles.pop();
    if (!oldest) {
      break;
    }

    await remove(await join(logsDir, oldest));
  }
}

export async function initSessionLogFile(): Promise<void> {
  if (sessionFile || initFailed) {
    return;
  }

  try {
    const root = await invoke<string>("project_root");
    const logsDir = await join(root, LOGS_SUBDIR);

    if (!(await exists(logsDir))) {
      await mkdir(logsDir, { recursive: true });
    }

    await pruneOldLogs(logsDir);

    const startedAt = Date.now();
    const sessionPath = await join(logsDir, sessionLogFileName(startedAt));
    const file = await open(sessionPath, {
      write: true,
      create: true,
      append: false,
    });

    const header = `=== DreamLoom session started ${formatSessionLogTimestamp(startedAt)} ===\n`;
    await file.write(new TextEncoder().encode(header));
    sessionFile = file;
  } catch (error) {
    initFailed = true;
    console.error("Failed to initialize session log file", error);
  }
}

export function appendSessionLog(level: SessionLogLevel, message: string, time: number): void {
  if (!sessionFile) {
    return;
  }

  const file = sessionFile;
  const line = formatSessionLogLine(level, message, time);

  void file.write(new TextEncoder().encode(line)).catch((error) => {
    console.error("Failed to write session log", error);
  });
}
