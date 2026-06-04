<script lang="ts">
  import { appState } from "$lib/app-state.svelte";
  import AssetFolder from "./AssetFolder.svelte";
  import {
    assetPickerStore,
    assetStore,
    cancelAssetPick,
    createAssetFolder,
    refreshAssetTree,
  } from "./assetStore";

  $effect(() => {
    appState.openDirectory;
    void refreshAssetTree();
  });
</script>

<div class="assets-panel">
  {#if $assetPickerStore.active && $assetPickerStore.purpose === "backgroundImage"}
    <div class="pick-banner">
      <span>Pick a background image — click an image file below</span>
      <button type="button" class="pick-cancel" onclick={cancelAssetPick}>Cancel</button>
    </div>
  {/if}

  {#if !appState.openDirectory}
    <p class="hint">Open a directory from File → Open Directory</p>
  {:else}
    <div class="toolbar">
      <button
        type="button"
        class="toolbar-btn"
        disabled={$assetStore.loading || $assetStore.creating}
        onclick={() => void refreshAssetTree()}
      >
        REFRESH
      </button>
    </div>

    {#if $assetStore.error}
      <p class="hint error">{$assetStore.error}</p>
    {:else if $assetStore.loading && !$assetStore.tree}
      <p class="hint">Loading assets…</p>
    {:else if !$assetStore.tree?.hasAssetsFolder}
      <div class="create-wrap">
        <button
          type="button"
          class="create-btn"
          disabled={$assetStore.creating}
          onclick={() => void createAssetFolder()}
        >
          {$assetStore.creating ? "CREATING…" : "CREATE ASSET FOLDER"}
        </button>
      </div>
    {:else}
      <div class="folders">
        {#if $assetStore.tree.folders.length === 0}
          <p class="hint">No subfolders in assets/.</p>
        {:else}
          {#each $assetStore.tree.folders as folder (folder.name)}
            <AssetFolder {folder} />
          {/each}
        {/if}
      </div>
    {/if}
  {/if}
</div>

<style>
  .assets-panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
    background: #000000;
    color: var(--text);
    font: inherit;
  }

  .pick-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-shrink: 0;
    padding: 8px 10px;
    border-bottom: 1px solid var(--panel-border);
    background: #1a1a12;
    color: var(--accent, #aacc00);
    font: inherit;
    font-size: 11px;
    line-height: 1.4;
  }

  .pick-cancel {
    flex-shrink: 0;
    padding: 4px 8px;
    border: 1px solid var(--panel-border);
    background: #141414;
    color: var(--text);
    font: inherit;
    font-size: 10px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    cursor: pointer;
  }

  .pick-cancel:hover {
    background: #1c1c1c;
  }

  .toolbar {
    padding: 8px 10px;
    border-bottom: 1px solid var(--panel-border);
    background: #0a0a0a;
    flex-shrink: 0;
  }

  .toolbar-btn,
  .create-btn {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    background: #141414;
    color: var(--text);
    cursor: pointer;
    font: inherit;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    text-align: left;
  }

  .toolbar-btn:hover:not(:disabled),
  .create-btn:hover:not(:disabled) {
    background: #1c1c1c;
  }

  .toolbar-btn:disabled,
  .create-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .create-wrap {
    padding: 10px;
  }

  .folders {
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1;
    overflow: auto;
  }

  .hint {
    margin: 0;
    padding: 10px;
    color: var(--text-muted);
    font: inherit;
    line-height: 1.5;
  }

  .hint.error {
    color: #999999;
  }
</style>
