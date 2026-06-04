import { join } from "@tauri-apps/api/path";
import { readDir, readTextFile } from "@tauri-apps/plugin-fs";
import { activeFileContent } from "$lib/active-file-content";
import { appState } from "$lib/app-state.svelte";
import { centerTabs } from "$lib/center-tabs.svelte";
import { findElementLineRange, findIdLineRange } from "$lib/find-element-lines";

const SKIP_DIRS = new Set(["node_modules", ".git", ".svelte-kit", "build", "dist"]);
const MAX_PROJECT_READS = 200;

let cachedSveltePaths: { root: string; paths: string[] } | null = null;

export type ResolvedComponentSource = {
  path: string;
  range: { from: number; to: number };
};

function matchDlInContent(
  path: string,
  content: string,
  dlClass: string,
  occurrence: number,
): ResolvedComponentSource | null {
  if (!path.endsWith(".svelte")) {
    return null;
  }

  const range = findElementLineRange(content, dlClass, occurrence);
  if (!range) {
    return null;
  }

  return { path, range };
}

function matchIdInContent(path: string, content: string, id: string): ResolvedComponentSource | null {
  if (!path.endsWith(".svelte")) {
    return null;
  }

  const range = findIdLineRange(content, id);
  if (!range) {
    return null;
  }

  return { path, range };
}

function searchOpenTabsForDl(
  dlClass: string,
  occurrence: number,
  skipPath: string | null,
): ResolvedComponentSource | null {
  for (const tab of centerTabs.tabs) {
    if (tab.path === skipPath || tab.content === null) {
      continue;
    }

    const hit = matchDlInContent(tab.path, tab.content, dlClass, occurrence);
    if (hit) {
      return hit;
    }
  }

  return null;
}

function searchOpenTabsForId(id: string, skipPath: string | null): ResolvedComponentSource | null {
  for (const tab of centerTabs.tabs) {
    if (tab.path === skipPath || tab.content === null) {
      continue;
    }

    const hit = matchIdInContent(tab.path, tab.content, id);
    if (hit) {
      return hit;
    }
  }

  return null;
}

async function collectSveltePaths(dir: string, paths: string[]): Promise<void> {
  const entries = await readDir(dir);

  for (const entry of entries) {
    const path = await join(dir, entry.name);

    if (entry.isDirectory) {
      if (SKIP_DIRS.has(entry.name)) {
        continue;
      }

      await collectSveltePaths(path, paths);
      continue;
    }

    if (entry.name.endsWith(".svelte")) {
      paths.push(path);
    }
  }
}

async function getSveltePaths(root: string): Promise<string[]> {
  if (cachedSveltePaths?.root === root) {
    return cachedSveltePaths.paths;
  }

  const paths: string[] = [];
  await collectSveltePaths(root, paths);
  cachedSveltePaths = { root, paths };
  return paths;
}

function tabContentPaths(): Set<string> {
  const loaded = new Set<string>();
  for (const tab of centerTabs.tabs) {
    if (tab.content !== null) {
      loaded.add(tab.path);
    }
  }
  return loaded;
}

async function searchProjectForDl(
  dlClass: string,
  occurrence: number,
): Promise<ResolvedComponentSource | null> {
  const root = appState.openDirectory;
  if (!root) {
    return null;
  }

  const loadedTabs = tabContentPaths();
  const paths = await getSveltePaths(root);
  let reads = 0;

  for (const path of paths) {
    if (loadedTabs.has(path)) {
      continue;
    }

    if (reads >= MAX_PROJECT_READS) {
      break;
    }

    reads++;
    const content = await readTextFile(path);
    const hit = matchDlInContent(path, content, dlClass, occurrence);
    if (hit) {
      return hit;
    }
  }

  return null;
}

async function searchProjectForId(id: string): Promise<ResolvedComponentSource | null> {
  const root = appState.openDirectory;
  if (!root) {
    return null;
  }

  const loadedTabs = tabContentPaths();
  const paths = await getSveltePaths(root);
  let reads = 0;

  for (const path of paths) {
    if (loadedTabs.has(path)) {
      continue;
    }

    if (reads >= MAX_PROJECT_READS) {
      break;
    }

    reads++;
    const content = await readTextFile(path);
    const hit = matchIdInContent(path, content, id);
    if (hit) {
      return hit;
    }
  }

  return null;
}

export async function resolveDlClassSource(
  dlClass: string,
  occurrence = 0,
): Promise<ResolvedComponentSource | null> {
  const active = activeFileContent();
  if (active.path && active.content) {
    const hit = matchDlInContent(active.path, active.content, dlClass, occurrence);
    if (hit) {
      return hit;
    }
  }

  const inOpen = searchOpenTabsForDl(dlClass, occurrence, active.path);
  if (inOpen) {
    return inOpen;
  }

  return searchProjectForDl(dlClass, occurrence);
}

export async function resolveIdSource(id: string): Promise<ResolvedComponentSource | null> {
  const active = activeFileContent();
  if (active.path && active.content) {
    const hit = matchIdInContent(active.path, active.content, id);
    if (hit) {
      return hit;
    }
  }

  const inOpen = searchOpenTabsForId(id, active.path);
  if (inOpen) {
    return inOpen;
  }

  return searchProjectForId(id);
}
