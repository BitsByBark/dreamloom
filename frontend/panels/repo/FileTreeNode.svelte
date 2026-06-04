<script lang="ts">
  import type { TreeNode } from "$lib/file-tree";
  import { openSvelteFile } from "$lib/open-file";
  import FileTreeNode from "./FileTreeNode.svelte";

  type Props = {
    node: TreeNode;
    depth?: number;
    expanded: Set<string>;
    childrenByPath: Map<string, TreeNode[]>;
    loadingPaths: Set<string>;
    errorsByPath: Map<string, string>;
    onToggle: (path: string) => void;
  };

  let {
    node,
    depth = 0,
    expanded,
    childrenByPath,
    loadingPaths,
    errorsByPath,
    onToggle,
  }: Props = $props();

  const isExpanded = $derived(expanded.has(node.path));
  const isLoading = $derived(loadingPaths.has(node.path));
  const loadError = $derived(errorsByPath.get(node.path));
  const children = $derived(childrenByPath.get(node.path) ?? []);

  function handleClick() {
    if (node.isDirectory) {
      onToggle(node.path);
      return;
    }

    if (node.name.endsWith(".svelte")) {
      void openSvelteFile(node.path);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  }
</script>

<div class="tree-node" style:--depth={depth}>
  <button
    type="button"
    class="tree-row"
    class:directory={node.isDirectory}
    class:file={!node.isDirectory}
    class:svelte-file={node.name.endsWith(".svelte")}
    onclick={handleClick}
    onkeydown={handleKeydown}
  >
    {#if node.isDirectory}
      <span class="chevron" aria-hidden="true">{isExpanded ? "▼" : "▶"}</span>
      <span class="icon" aria-hidden="true">▪</span>
    {:else}
      <span class="chevron spacer" aria-hidden="true"></span>
      <span class="icon" aria-hidden="true">·</span>
    {/if}
    <span class="name">{node.name}</span>
  </button>

  {#if node.isDirectory && isExpanded}
    {#if isLoading}
      <p class="hint">Loading…</p>
    {:else if loadError}
      <p class="hint error">{loadError}</p>
    {:else}
      <div class="children">
        {#each children as child (child.path)}
          <FileTreeNode
            node={child}
            depth={depth + 1}
            {expanded}
            {childrenByPath}
            {loadingPaths}
            {errorsByPath}
            {onToggle}
          />
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .tree-row {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    padding: 2px 8px 2px calc(8px + var(--depth) * 12px);
    border: none;
    background: transparent;
    color: var(--text-muted);
    text-align: left;
    cursor: pointer;
    font: inherit;
    line-height: 1.4;
  }

  .tree-row:hover {
    background: #1c1c1c;
    color: var(--text);
  }

  .tree-row.svelte-file {
    color: var(--text);
  }

  .chevron {
    width: 10px;
    flex-shrink: 0;
    font-size: 8px;
    color: var(--text-muted);
  }

  .chevron.spacer {
    visibility: hidden;
  }

  .icon {
    width: 10px;
    flex-shrink: 0;
    text-align: center;
    color: var(--text-muted);
  }

  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .hint {
    margin: 0;
    padding: 2px 8px 2px calc(8px + (var(--depth) + 1) * 12px);
    color: var(--text-muted);
    font-size: 11px;
  }

  .hint.error {
    color: #999999;
  }
</style>
