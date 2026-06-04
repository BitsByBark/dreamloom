<script lang="ts">
  import type { PreviewDomTreeNode } from "$panels/center/preview-bridge";
  import {
    componentTree,
    domNodeLabel,
    isExpanded,
    pathsEqual,
    toggleExpanded,
  } from "$lib/component-tree.svelte";
  import { selectComponentTreeNode } from "$lib/bridge-selection.svelte";
  import DomTreeNode from "./DomTreeNode.svelte";

  type Props = {
    node: PreviewDomTreeNode;
    path: number[];
    depth?: number;
  };

  let { node, path, depth = 0 }: Props = $props();

  const hasChildren = $derived(node.children.length > 0);
  const expanded = $derived(isExpanded(path));
  const active = $derived(pathsEqual(path, componentTree.selectedPath));

  function handleRowClick() {
    selectComponentTreeNode(path);
  }

  function handleChevronClick(event: MouseEvent) {
    event.stopPropagation();
    toggleExpanded(path);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleRowClick();
    }
  }
</script>

<div class="tree-node" style:--depth={depth}>
  <button
    type="button"
    class="tree-row"
    class:active
    onclick={handleRowClick}
    onkeydown={handleKeydown}
  >
    {#if hasChildren}
      <span
        class="chevron"
        role="presentation"
        aria-hidden="true"
        onclick={handleChevronClick}
        onkeydown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            toggleExpanded(path);
          }
        }}
      >
        {expanded ? "▼" : "▶"}
      </span>
    {:else}
      <span class="chevron spacer" aria-hidden="true"></span>
    {/if}
    <span class="name">{domNodeLabel(node)}</span>
  </button>

  {#if hasChildren && expanded}
    <div class="children">
      {#each node.children as child, index (pathKey(path, index))}
        <DomTreeNode node={child} path={[...path, index]} depth={depth + 1} />
      {/each}
    </div>
  {/if}
</div>

<script lang="ts" module>
  function pathKey(path: number[], index: number): string {
    return [...path, index].join(",");
  }
</script>

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
    font-size: 12px;
    line-height: 1.4;
  }

  .tree-row:hover {
    background: #161616;
    color: var(--text);
  }

  .tree-row.active {
    background: #222222;
    color: var(--text);
  }

  .chevron {
    width: 10px;
    flex-shrink: 0;
    font-size: 8px;
    color: var(--text-muted);
    cursor: pointer;
  }

  .chevron.spacer {
    visibility: hidden;
  }

  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
