<script lang="ts">
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
  import FileTreeNode from "$panels/FileTreeNode.svelte";

  let childrenByPath = $state(new Map<string, TreeNode[]>());
  let loadingPaths = $state(new Set<string>());
  let errorsByPath = $state(new Map<string, string>());
  let expanded = $state(new Set<string>());
  let rootLoading = $state(false);
  let rootError = $state<string | null>(null);

  $effect(() => {
    const root = appState.openDirectory;

    if (!root) {
      childrenByPath = new Map();
      loadingPaths = new Set();
      errorsByPath = new Map();
      expanded = new Set();
      rootLoading = false;
      rootError = null;
      return;
    }

    rootLoading = true;
    rootError = null;
    childrenByPath = new Map();
    loadingPaths = new Set();
    errorsByPath = new Map();
    expanded = new Set([root]);

    readDirectoryEntries(root)
      .then((entries) => {
        childrenByPath = new Map([[root, entries]]);
        rootLoading = false;
        logRepoRootLoaded(entries.length);
      })
      .catch((cause) => {
        const message = cause instanceof Error ? cause.message : "Failed to load directory";
        rootError = message;
        childrenByPath = new Map();
        rootLoading = false;
        logRepoRootFailed(message);
      });
  });

  async function expandFolder(path: string) {
    const nextExpanded = new Set(expanded);
    nextExpanded.add(path);
    expanded = nextExpanded;

    if (childrenByPath.has(path) || loadingPaths.has(path)) {
      return;
    }

    const nextLoading = new Set(loadingPaths);
    nextLoading.add(path);
    loadingPaths = nextLoading;

    try {
      const entries = await readDirectoryEntries(path);
      const nextCache = new Map(childrenByPath);
      nextCache.set(path, entries);
      childrenByPath = nextCache;

      const nextErrors = new Map(errorsByPath);
      nextErrors.delete(path);
      errorsByPath = nextErrors;

      const label = await basename(path);
      logFolderExpanded(label);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Failed to load directory";
      const nextErrors = new Map(errorsByPath);
      nextErrors.set(path, message);
      errorsByPath = nextErrors;

      const label = await basename(path);
      logFolderLoadFailed(label, message);
    } finally {
      const nextLoading = new Set(loadingPaths);
      nextLoading.delete(path);
      loadingPaths = nextLoading;
    }
  }

  async function collapseFolder(path: string) {
    const nextExpanded = new Set(expanded);
    for (const expandedPath of nextExpanded) {
      if (expandedPath === path || isDescendantPath(path, expandedPath)) {
        nextExpanded.delete(expandedPath);
      }
    }
    expanded = nextExpanded;

    const protectedPaths = await getProtectedDirectoryPaths(
      appState.openDirectory,
      appState.openFilePath,
    );

    const nextCache = new Map(childrenByPath);
    const evicted = evictDirectoryCache(nextCache, path, protectedPaths);
    childrenByPath = nextCache;

    const nextErrors = new Map(errorsByPath);
    evictPathKeys(nextErrors, path, protectedPaths);
    errorsByPath = nextErrors;

    const nextLoading = new Set(loadingPaths);
    evictPathKeysFromSet(nextLoading, path, protectedPaths);
    loadingPaths = nextLoading;

    const label = await basename(path);
    logFolderCollapsed(label);
    if (evicted) {
      logRepoCacheEvicted(label);
    }
  }

  function toggleExpanded(path: string) {
    if (expanded.has(path)) {
      void collapseFolder(path);
      return;
    }

    void expandFolder(path);
  }
</script>

<div class="file-tree">
  {#if !appState.openDirectory}
    <p class="hint">Open a directory from File → Open Directory</p>
  {:else if rootLoading}
    <p class="hint">Loading…</p>
  {:else if rootError}
    <p class="hint error">{rootError}</p>
  {:else if (childrenByPath.get(appState.openDirectory) ?? []).length === 0}
    <p class="hint">Directory is empty</p>
  {:else}
    {#each childrenByPath.get(appState.openDirectory) ?? [] as node (node.path)}
      <FileTreeNode
        {node}
        {expanded}
        {childrenByPath}
        {loadingPaths}
        {errorsByPath}
        onToggle={toggleExpanded}
      />
    {/each}
  {/if}
</div>

<style>
  .file-tree {
    min-height: 0;
  }

  .hint {
    margin: 0;
    padding: 8px;
    color: var(--text-muted);
    font-size: 12px;
  }

  .hint.error {
    color: #999999;
  }
</style>
