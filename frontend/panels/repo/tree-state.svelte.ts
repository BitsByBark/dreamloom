import { basename } from "@tauri-apps/api/path";
import {
  logFolderCollapsed,
  logFolderExpanded,
  logFolderLoadFailed,
  logRepoCacheEvicted,
  logRepoRootFailed,
  logRepoRootLoaded,
} from "$debug/logging.svelte";
import { appState } from "$lib/app-state.svelte";
import {
  evictDirectoryCache,
  evictPathKeys,
  evictPathKeysFromSet,
  getProtectedDirectoryPaths,
  isDescendantPath,
  readDirectoryEntries,
  type TreeNode,
} from "$lib/file-tree";

export const repoTree = $state({
  childrenByPath: new Map<string, TreeNode[]>(),
  loadingPaths: new Set<string>(),
  errorsByPath: new Map<string, string>(),
  expanded: new Set<string>(),
  rootLoading: false,
  rootError: null as string | null,
});

export function resetRepoTree(): void {
  repoTree.childrenByPath = new Map();
  repoTree.loadingPaths = new Set();
  repoTree.errorsByPath = new Map();
  repoTree.expanded = new Set();
  repoTree.rootLoading = false;
  repoTree.rootError = null;
}

export function loadRoot(root: string | null): void {
  if (!root) {
    resetRepoTree();
    return;
  }

  repoTree.rootLoading = true;
  repoTree.rootError = null;
  repoTree.childrenByPath = new Map();
  repoTree.loadingPaths = new Set();
  repoTree.errorsByPath = new Map();
  repoTree.expanded = new Set([root]);

  readDirectoryEntries(root)
    .then((entries) => {
      repoTree.childrenByPath = new Map([[root, entries]]);
      repoTree.rootLoading = false;
      logRepoRootLoaded(entries.length);
    })
    .catch((cause) => {
      const message = cause instanceof Error ? cause.message : "Failed to load directory";
      repoTree.rootError = message;
      repoTree.childrenByPath = new Map();
      repoTree.rootLoading = false;
      logRepoRootFailed(message);
    });
}

export async function expandFolder(path: string): Promise<void> {
  const nextExpanded = new Set(repoTree.expanded);
  nextExpanded.add(path);
  repoTree.expanded = nextExpanded;

  if (repoTree.childrenByPath.has(path) || repoTree.loadingPaths.has(path)) {
    return;
  }

  const nextLoading = new Set(repoTree.loadingPaths);
  nextLoading.add(path);
  repoTree.loadingPaths = nextLoading;

  try {
    const entries = await readDirectoryEntries(path);
    const nextCache = new Map(repoTree.childrenByPath);
    nextCache.set(path, entries);
    repoTree.childrenByPath = nextCache;

    const nextErrors = new Map(repoTree.errorsByPath);
    nextErrors.delete(path);
    repoTree.errorsByPath = nextErrors;

    const label = await basename(path);
    logFolderExpanded(label);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Failed to load directory";
    const nextErrors = new Map(repoTree.errorsByPath);
    nextErrors.set(path, message);
    repoTree.errorsByPath = nextErrors;

    const label = await basename(path);
    logFolderLoadFailed(label, message);
  } finally {
    const nextLoading = new Set(repoTree.loadingPaths);
    nextLoading.delete(path);
    repoTree.loadingPaths = nextLoading;
  }
}

export async function collapseFolder(path: string): Promise<void> {
  const nextExpanded = new Set(repoTree.expanded);
  for (const expandedPath of nextExpanded) {
    if (expandedPath === path || isDescendantPath(path, expandedPath)) {
      nextExpanded.delete(expandedPath);
    }
  }
  repoTree.expanded = nextExpanded;

  const protectedPaths = await getProtectedDirectoryPaths(
    appState.openDirectory,
    appState.openFilePath,
  );

  const nextCache = new Map(repoTree.childrenByPath);
  const evicted = evictDirectoryCache(nextCache, path, protectedPaths);
  repoTree.childrenByPath = nextCache;

  const nextErrors = new Map(repoTree.errorsByPath);
  evictPathKeys(nextErrors, path, protectedPaths);
  repoTree.errorsByPath = nextErrors;

  const nextLoading = new Set(repoTree.loadingPaths);
  evictPathKeysFromSet(nextLoading, path, protectedPaths);
  repoTree.loadingPaths = nextLoading;

  const label = await basename(path);
  logFolderCollapsed(label);
  if (evicted) {
    logRepoCacheEvicted(label);
  }
}

export function toggleExpanded(path: string): void {
  if (repoTree.expanded.has(path)) {
    void collapseFolder(path);
    return;
  }

  void expandFolder(path);
}
