import { basename } from "@tauri-apps/api/path";
import { readTextFile } from "@tauri-apps/plugin-fs";
import {
  logTabClosed,
  logTabEvicted,
  logTabFocused,
  logTabOpened,
} from "$debug/logging.svelte";
import { clearEditorBridgeSelection } from "$lib/bridge-selection.svelte";
import { appState } from "$lib/app-state.svelte";
import { settings } from "$settings/settings.svelte";

export type CenterTab = {
  path: string;
  filename: string;
  content: string | null;
  evicted: boolean;
};

export const centerTabs = $state({
  tabs: [] as CenterTab[],
  activePath: null as string | null,
});

const evictionTimers = new Map<string, ReturnType<typeof setTimeout>>();

function clearEvictionTimer(path: string) {
  const timer = evictionTimers.get(path);
  if (timer) {
    clearTimeout(timer);
    evictionTimers.delete(path);
  }
}

function syncEditorFromActiveTab() {
  const tab = centerTabs.tabs.find((entry) => entry.path === centerTabs.activePath);
  appState.openFilePath = centerTabs.activePath;
  appState.openFileContent = tab?.content ?? null;
}

function syncEditorFromActiveTabOrClear() {
  if (centerTabs.activePath === null) {
    appState.openFilePath = null;
    appState.openFileContent = null;
    return;
  }

  syncEditorFromActiveTab();
}

function evictTab(path: string) {
  if (path === centerTabs.activePath) {
    return;
  }

  const tab = centerTabs.tabs.find((entry) => entry.path === path);
  if (!tab) {
    return;
  }

  tab.content = null;
  tab.evicted = true;
  clearEvictionTimer(path);
  logTabEvicted(tab.filename);
}

export function scheduleEviction(path: string) {
  clearEvictionTimer(path);

  if (path === centerTabs.activePath) {
    return;
  }

  const timer = setTimeout(() => {
    evictTab(path);
  }, settings.inactiveEvictionDelay);

  evictionTimers.set(path, timer);
}

export function rescheduleAllEvictions() {
  for (const tab of centerTabs.tabs) {
    if (tab.path !== centerTabs.activePath) {
      scheduleEviction(tab.path);
    }
  }
}

async function loadTabContent(tab: CenterTab): Promise<void> {
  tab.content = await readTextFile(tab.path);
  tab.evicted = false;

  if (centerTabs.activePath === tab.path) {
    syncEditorFromActiveTab();
  }
}

export type FocusCenterTabOptions = {
  preserveBridge?: boolean;
};

export async function focusCenterTab(
  path: string,
  options?: FocusCenterTabOptions,
): Promise<void> {
  const previous = centerTabs.activePath;

  if (previous && previous !== path) {
    scheduleEviction(previous);
  }

  clearEvictionTimer(path);
  if (previous !== path && !options?.preserveBridge) {
    clearEditorBridgeSelection();
  }
  centerTabs.activePath = path;
  appState.rightTab = "editor";

  const tab = centerTabs.tabs.find((entry) => entry.path === path);
  if (!tab) {
    return;
  }

  if (tab.evicted || tab.content === null) {
    await loadTabContent(tab);
  } else {
    syncEditorFromActiveTab();
  }

  logTabFocused(tab.filename);
}

export async function openCenterTab(
  path: string,
  options?: FocusCenterTabOptions,
): Promise<void> {
  const existing = centerTabs.tabs.find((entry) => entry.path === path);
  if (existing) {
    await focusCenterTab(path, options);
    return;
  }

  const filename = await basename(path);
  const tab: CenterTab = {
    path,
    filename,
    content: null,
    evicted: false,
  };

  await loadTabContent(tab);
  centerTabs.tabs = [...centerTabs.tabs, tab];
  logTabOpened(filename);
  await focusCenterTab(path, options);
}

export function selectCenterTab(path: string) {
  void focusCenterTab(path);
}

export function closeCenterTab(path: string) {
  clearEvictionTimer(path);

  const index = centerTabs.tabs.findIndex((entry) => entry.path === path);
  if (index === -1) {
    return;
  }

  const wasActive = centerTabs.activePath === path;
  const closedTab = centerTabs.tabs[index];
  centerTabs.tabs = centerTabs.tabs.filter((entry) => entry.path !== path);
  logTabClosed(closedTab.filename);

  if (!wasActive) {
    return;
  }

  if (centerTabs.tabs.length === 0) {
    centerTabs.activePath = null;
    syncEditorFromActiveTabOrClear();
    return;
  }

  const nextIndex = index < centerTabs.tabs.length ? index : centerTabs.tabs.length - 1;
  void focusCenterTab(centerTabs.tabs[nextIndex].path);
}
