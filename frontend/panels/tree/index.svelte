<script lang="ts">
  import { componentTree } from "$lib/component-tree.svelte";
  import DomTreeNode from "./DomTreeNode.svelte";
</script>

<div class="component-tree">
  {#if !componentTree.tree}
    <p class="hint">Click an element in the preview to inspect it.</p>
  {:else}
    <DomTreeNode node={componentTree.tree} path={[]} />
  {/if}
</div>

<style>
  .component-tree {
    min-height: 0;
    overflow: auto;
    height: 100%;
  }

  .hint {
    margin: 0;
    padding: 8px;
    color: var(--text-muted);
    font-size: 12px;
  }
</style>
