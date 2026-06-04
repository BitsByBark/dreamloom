<script lang="ts">
  import { appState } from "$lib/app-state.svelte";
  import FileTreeNode from "./FileTreeNode.svelte";
  import { loadRoot, repoTree, toggleExpanded } from "./tree-state.svelte";

  $effect(() => {
    loadRoot(appState.openDirectory);
  });
</script>

<div class="file-tree">
  {#if !appState.openDirectory}
    <p class="hint">Open a directory from File → Open Directory</p>
  {:else if repoTree.rootLoading}
    <p class="hint">Loading…</p>
  {:else if repoTree.rootError}
    <p class="hint error">{repoTree.rootError}</p>
  {:else if (repoTree.childrenByPath.get(appState.openDirectory) ?? []).length === 0}
    <p class="hint">Directory is empty</p>
  {:else}
    {#each repoTree.childrenByPath.get(appState.openDirectory) ?? [] as node (node.path)}
      <FileTreeNode
        {node}
        expanded={repoTree.expanded}
        childrenByPath={repoTree.childrenByPath}
        loadingPaths={repoTree.loadingPaths}
        errorsByPath={repoTree.errorsByPath}
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
    font: inherit;
    color: var(--text-muted);
    line-height: 1.5;
  }

  .hint.error {
    color: #999999;
  }
</style>
