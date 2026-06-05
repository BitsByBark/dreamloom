<script lang="ts">
  import { appState } from "$lib/app-state.svelte";
  import {
    addDraftVariable,
    cssVarsStore,
    DREAMLOOM_CSS_FILE,
    refreshCssVars,
    saveCssVarRow,
    deleteCssVarRow,
  } from "../cssVars/cssVarsStore.svelte";
  import VarRow from "./cssVars/VarRow.svelte";

  const busy = $derived(cssVarsStore.loading || cssVarsStore.saving);
  const disabled = $derived(!appState.openDirectory || busy);

  $effect(() => {
    appState.openDirectory;
    void refreshCssVars();
  });
</script>

<div class="css-vars-panel">
  <div class="toolbar">
    <button
      type="button"
      class="toolbar-btn primary"
      {disabled}
      onclick={() => addDraftVariable()}
    >
      + ADD VARIABLE
    </button>
    <button
      type="button"
      class="toolbar-btn"
      {disabled}
      onclick={() => void refreshCssVars()}
    >
      REFRESH
    </button>
  </div>

  {#if !appState.openDirectory}
    <p class="hint">Open a directory from File → Open Directory</p>
  {:else if cssVarsStore.loading && cssVarsStore.variables.length === 0}
    <p class="hint">Reading {DREAMLOOM_CSS_FILE}…</p>
  {:else}
    {#if cssVarsStore.error}
      <p class="hint error">{cssVarsStore.error}</p>
    {/if}

    {#if cssVarsStore.variables.length === 0 && !cssVarsStore.loading}
      <p class="hint">No variables in {DREAMLOOM_CSS_FILE}</p>
    {:else}
      <div class="var-list" role="list">
        {#each cssVarsStore.variables as entry (entry.id)}
          <VarRow
            {entry}
            {disabled}
            onSave={async (previousName, name, value) => {
              await saveCssVarRow(previousName, name, value);
            }}
            onDelete={async (name) => {
              await deleteCssVarRow(name);
            }}
          />
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .css-vars-panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
    background: #000000;
    color: var(--text);
    font: inherit;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 8px;
    border-bottom: 1px solid var(--panel-border);
    flex-shrink: 0;
  }

  .toolbar-btn {
    padding: 5px 10px;
    border: 1px solid #333333;
    border-radius: 2px;
    background: #141414;
    color: #a8a8a8;
    font: inherit;
    font-size: 0.75em;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    cursor: pointer;
  }

  .toolbar-btn:hover:not(:disabled) {
    border-color: #555555;
    color: #e0e0e0;
    background: #1a1a1a;
  }

  .toolbar-btn.primary {
    border-color: #444444;
    color: #c8c8c8;
  }

  .toolbar-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .hint {
    margin: 0;
    padding: 10px 12px;
    color: var(--text-muted);
    font-size: 0.85em;
  }

  .hint.error {
    color: #e57373;
  }

  .var-list {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
</style>
