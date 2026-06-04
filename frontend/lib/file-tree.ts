import { invoke } from "@tauri-apps/api/core";
import { dirname, join } from "@tauri-apps/api/path";

export type TreeNode = {
  name: string;
  path: string;
  isDirectory: boolean;
};

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+$/, "");
}

export function isDescendantPath(parentPath: string, childPath: string): boolean {
  const parent = normalizePath(parentPath);
  const child = normalizePath(childPath);

  if (child === parent) {
    return true;
  }

  return child.startsWith(`${parent}/`);
}

type RawEntry = { name: string; isDirectory: boolean };

export async function readDirectoryEntries(dirPath: string): Promise<TreeNode[]> {
  const entries = await invoke<RawEntry[]>("list_directory", { path: dirPath });

  const sorted = [...entries].sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) {
      return a.isDirectory ? -1 : 1;
    }

    return a.name.localeCompare(b.name);
  });

  const nodes: TreeNode[] = [];

  for (const entry of sorted) {
    const path = await join(dirPath, entry.name);

    nodes.push({
      name: entry.name,
      path,
      isDirectory: entry.isDirectory,
    });
  }

  return nodes;
}

export async function getProtectedDirectoryPaths(
  openDirectory: string | null,
  openFilePath: string | null,
): Promise<Set<string>> {
  const protectedPaths = new Set<string>();

  if (!openDirectory || !openFilePath) {
    return protectedPaths;
  }

  let current = await dirname(openFilePath);

  while (true) {
    if (current !== openDirectory && !isDescendantPath(openDirectory, current)) {
      break;
    }

    protectedPaths.add(current);

    if (current === openDirectory) {
      break;
    }

    const parent = await dirname(current);
    if (parent === current) {
      break;
    }

    current = parent;
  }

  return protectedPaths;
}

export function evictDirectoryCache(
  cache: Map<string, TreeNode[]>,
  collapsedPath: string,
  protectedPaths: Set<string>,
): boolean {
  let evicted = false;

  for (const key of [...cache.keys()]) {
    if (protectedPaths.has(key)) {
      continue;
    }

    if (isDescendantPath(collapsedPath, key)) {
      cache.delete(key);
      evicted = true;
    }
  }

  return evicted;
}

export function evictPathKeys(
  map: Map<string, string>,
  collapsedPath: string,
  protectedPaths: Set<string>,
): void {
  for (const key of [...map.keys()]) {
    if (protectedPaths.has(key)) {
      continue;
    }

    if (isDescendantPath(collapsedPath, key)) {
      map.delete(key);
    }
  }
}

export function evictPathKeysFromSet(
  set: Set<string>,
  collapsedPath: string,
  protectedPaths: Set<string>,
): void {
  for (const key of [...set]) {
    if (protectedPaths.has(key)) {
      continue;
    }

    if (isDescendantPath(collapsedPath, key)) {
      set.delete(key);
    }
  }
}
