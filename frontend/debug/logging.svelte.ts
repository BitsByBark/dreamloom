import { appendSessionLog } from "$debug/log-file";
import { settings } from "$settings/settings.svelte";

export type LogLevel = "good" | "warn" | "perf" | "error";

export type LogEntry = {
  id: number;
  time: number;
  level: LogLevel;
  message: string;
};

export const logState = $state({
  entries: [] as LogEntry[],
});

const MAX_ENTRIES = 500;
let nextId = 0;

function write(level: LogLevel, message: string, force = false): void {
  const time = Date.now();
  appendSessionLog(level, message, time);

  if (!force && !settings.debugMode) {
    return;
  }

  const entry: LogEntry = {
    id: nextId++,
    time,
    level,
    message,
  };

  logState.entries = [...logState.entries, entry].slice(-MAX_ENTRIES);
}

export function formatLogTime(time: number): string {
  return new Date(time).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function logDirectoryOpened(path: string): void {
  write("good", `opened directory: ${path}`);
}

export function logRepoRootLoaded(count: number): void {
  write("good", `repo root loaded: ${count} entries`);
}

export function logRepoRootFailed(message: string): void {
  write("error", `repo root failed: ${message}`);
}

export function logFolderExpanded(name: string): void {
  write("good", `expanded folder: ${name}`);
}

export function logFolderCollapsed(name: string): void {
  write("good", `collapsed folder: ${name}`);
}

export function logFolderLoadFailed(name: string, message: string): void {
  write("warn", `folder read failed: ${name} — ${message}`);
}

export function logRepoCacheEvicted(name: string): void {
  write("perf", `repo cache evicted: ${name}`);
}

export function logTabOpened(name: string): void {
  write("good", `opened tab: ${name}`);
}

export function logTabFocused(name: string): void {
  write("good", `focused tab: ${name}`);
}

export function logTabClosed(name: string): void {
  write("good", `closed tab: ${name}`);
}

export function logTabEvicted(name: string): void {
  write("perf", `evicted tab content: ${name}`);
}

export function logFileOpenFailed(path: string, message: string): void {
  write("error", `failed to open file: ${path} — ${message}`);
}

export function logLeftTab(tab: string): void {
  write("good", `left tab: ${tab}`);
}

export function logRightTab(tab: string): void {
  write("good", `right tab: ${tab}`);
}

export function logPanelToggled(side: "left" | "right", collapsed: boolean): void {
  write("good", `${side} panel ${collapsed ? "collapsed" : "expanded"}`);
}

export function logDebugModeEnabled(): void {
  write("good", "debug mode enabled");
}

export function logDebugModeDisabled(): void {
  write("good", "debug mode disabled", true);
}

export function logSettingsSaved(): void {
  write("good", "settings saved");
}
