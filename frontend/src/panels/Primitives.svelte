<script lang="ts">
  import { activeFileContent } from "$lib/active-file-content";
  import { editorBridge } from "$lib/bridge-selection.svelte";
  import { saveSvelteSource } from "$lib/source-file";
  import { appendUndo } from "$git/undoStore";
  import {
    EXTENDED_PRIMITIVES,
    insertPrimitiveIntoSource,
    PRIMAL_PRIMITIVES,
    type PrimitiveTemplateId,
  } from "../primitives/index";

  let primalOpen = $state(true);
  let extendedOpen = $state(true);

  const activeFile = $derived(activeFileContent());
  const canInsert = $derived(Boolean(activeFile.path?.endsWith(".svelte") && activeFile.content));

  async function insertPrimitive(id: PrimitiveTemplateId) {
    const path = activeFile.path;
    const content = activeFile.content;
    if (!path?.endsWith(".svelte") || content === null) {
      return;
    }

    const next = insertPrimitiveIntoSource(content, editorBridge.selection, id);
    if (next === content) {
      return;
    }

    await saveSvelteSource(path, next);

    const label =
      [...PRIMAL_PRIMITIVES, ...EXTENDED_PRIMITIVES].find((item) => item.id === id)?.label ?? id;
    const fileName = path.split(/[/\\]/).pop() ?? path;
    appendUndo(`${fileName}: inserted ${label} primitive`);
  }
</script>

<div class="primitives-panel">
  <section class="primitives-section">
    <button
      type="button"
      class="primitives-section-toggle"
      aria-expanded={primalOpen}
      onclick={() => (primalOpen = !primalOpen)}
    >
      <span class="primitives-chevron" aria-hidden="true">{primalOpen ? "▼" : "▶"}</span>
      <span class="primitives-section-title">PRIMAL</span>
    </button>

    {#if primalOpen}
      <div class="primitives-grid" role="group" aria-label="Primal primitives">
        {#each PRIMAL_PRIMITIVES as item (item.id)}
          <button
            type="button"
            class="primitive-btn"
            disabled={!canInsert}
            onclick={() => insertPrimitive(item.id)}
          >
            {item.label}
          </button>
        {/each}
      </div>
    {/if}
  </section>

  <section class="primitives-section">
    <button
      type="button"
      class="primitives-section-toggle"
      aria-expanded={extendedOpen}
      onclick={() => (extendedOpen = !extendedOpen)}
    >
      <span class="primitives-chevron" aria-hidden="true">{extendedOpen ? "▼" : "▶"}</span>
      <span class="primitives-section-title">EXTENDED</span>
    </button>

    {#if extendedOpen}
      <div class="primitives-grid" role="group" aria-label="Extended primitives">
        {#each EXTENDED_PRIMITIVES as item (item.id)}
          <button
            type="button"
            class="primitive-btn"
            disabled={!canInsert}
            onclick={() => insertPrimitive(item.id)}
          >
            {item.label}
          </button>
        {/each}
      </div>
    {/if}
  </section>

  {#if !canInsert}
    <p class="primitives-hint">Open a `.svelte` file in the editor to insert primitives.</p>
  {/if}
</div>

<style>
  .primitives-panel {
    display: flex;
    flex-direction: column;
    gap: 0;
    min-height: 0;
    height: 100%;
    overflow: auto;
    padding: 0 0 8px;
  }

  .primitives-section {
    border-bottom: 1px solid var(--panel-border);
  }

  .primitives-section-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 8px 10px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font: inherit;
    font-size: 0.75em;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-align: left;
    cursor: pointer;
  }

  .primitives-section-toggle:hover {
    background: #161616;
    color: var(--text);
  }

  .primitives-chevron {
    flex-shrink: 0;
    font-size: 0.65em;
  }

  .primitives-section-title {
    text-transform: uppercase;
  }

  .primitives-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
    padding: 6px 8px 10px;
  }

  .primitive-btn {
    min-height: 28px;
    padding: 4px 8px;
    border: 1px solid #333333;
    border-radius: 2px;
    background: #111111;
    color: var(--text);
    font: inherit;
    font-size: 0.72em;
    text-align: left;
    cursor: pointer;
  }

  .primitive-btn:hover:not(:disabled) {
    border-color: #444444;
    background: #1a1a1a;
  }

  .primitive-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .primitives-hint {
    margin: 0;
    padding: 8px 10px;
    color: var(--text-muted);
    font-size: 0.72em;
  }
</style>
