<script lang="ts">
  import "./properties-theme.css";
  import { activeFileContent } from "$lib/active-file-content";
  import { currentBridgeDlClass, editorBridge } from "$lib/bridge-selection.svelte";
  import { componentTree, nodeAtPath } from "$lib/component-tree.svelte";
  import { elementTypeLabel, tagFromSourceLine } from "./element-tag-label";

  const selection = $derived(editorBridge.selection);

  const tag = $derived.by(() => {
    if (!selection) {
      return null;
    }

    if (componentTree.tree) {
      const node = nodeAtPath(componentTree.tree, componentTree.selectedPath);
      if (node?.tagName) {
        return node.tagName.toLowerCase();
      }
    }

    const { content } = activeFileContent();
    if (content) {
      return tagFromSourceLine(content, selection.fromLine);
    }

    return null;
  });

  const label = $derived(tag ? elementTypeLabel(tag) : null);
  const activeDlClass = $derived(currentBridgeDlClass());
</script>

{#if selection && tag && label}
  <p class="element-info-bar">
    <span class="element-info-label">{label}</span>
    <span class="element-info-sep"> - </span>
    <span class="element-info-tag">{tag.toUpperCase()}</span>
    {#if activeDlClass}
      <span class="element-info-sep"> - </span>
      <span class="element-info-dl">{activeDlClass}</span>
    {/if}
  </p>
{/if}
