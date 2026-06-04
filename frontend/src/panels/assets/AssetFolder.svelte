<script lang="ts">
  import type { AssetFolder as Folder, AssetFile } from "./assetStore";
  import {
    assetPickerStore,
    isPickableImage,
    pickAssetFile,
  } from "./assetStore";

  type Props = {
    folder: Folder;
  };

  let { folder }: Props = $props();
  let expanded = $state(true);

  const pickMode = $derived(
    $assetPickerStore.active && $assetPickerStore.purpose === "backgroundImage",
  );

  function onFileClick(file: AssetFile) {
    if (!pickMode || !isPickableImage(file.extension)) {
      return;
    }
    void pickAssetFile(folder.name, file.relativePath);
  }

  function extIcon(extension: string): string {
    const e = extension.toLowerCase();
    if (["png", "jpg", "jpeg", "webp", "gif", "svg", "avif"].includes(e)) return "▣";
    if (["woff", "woff2", "ttf", "otf"].includes(e)) return "𝓕";
    if (["mp4", "webm"].includes(e)) return "▶";
    if (["mp3", "wav", "ogg"].includes(e)) return "♪";
    if (["json", "csv"].includes(e)) return "{ }";
    return "•";
  }
</script>

<section class="asset-folder">
  <button
    type="button"
    class="asset-folder-header"
    aria-expanded={expanded}
    onclick={() => (expanded = !expanded)}
  >
    <span class="asset-folder-chevron" aria-hidden="true">{expanded ? "▼" : "▶"}</span>
    <span class="asset-folder-title">{folder.name.toUpperCase()}</span>
  </button>

  {#if expanded}
    <div class="asset-folder-body">
      {#if folder.files.length === 0}
        <p class="asset-empty">No files.</p>
      {:else}
        <ul class="asset-files">
          {#each folder.files as file (file.relativePath)}
            {@const pickable = pickMode && isPickableImage(file.extension)}
            <li class="asset-file" class:pickable class:pick-disabled={pickMode && !pickable}>
              {#if pickable}
                <button type="button" class="asset-file-btn" onclick={() => onFileClick(file)}>
                  <span class="asset-icon" aria-hidden="true">{extIcon(file.extension)}</span>
                  <span class="asset-name">{file.name}</span>
                </button>
              {:else}
                <span class="asset-icon" aria-hidden="true">{extIcon(file.extension)}</span>
                <span class="asset-name">{file.name}</span>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</section>

<style>
  .asset-folder {
    border-bottom: 1px solid var(--panel-border);
    flex-shrink: 0;
  }

  .asset-folder-header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border: 0;
    border-bottom: 1px solid var(--panel-border);
    background: #0a0a0a;
    color: var(--text-muted);
    cursor: pointer;
    font: inherit;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 0.82em;
    text-align: left;
  }

  .asset-folder-header:hover {
    background: #141414;
    color: var(--text);
  }

  .asset-folder-chevron {
    width: 10px;
    flex-shrink: 0;
    font-size: 0.75em;
  }

  .asset-folder-title {
    flex: 1;
    min-width: 0;
  }

  .asset-folder-body {
    padding: 6px 10px 10px;
    background: #000000;
  }

  .asset-empty {
    margin: 0;
    color: var(--text-muted);
    font: inherit;
  }

  .asset-files {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .asset-file {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    padding: 3px 0;
    color: var(--text-muted);
    font: inherit;
    font-size: 0.9em;
  }

  .asset-file.pickable {
    padding: 0;
  }

  .asset-file.pick-disabled {
    opacity: 0.35;
  }

  .asset-file-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
    padding: 3px 0;
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: inherit;
    text-align: left;
    cursor: pointer;
  }

  .asset-file-btn:hover {
    color: var(--text);
    background: #141414;
  }

  .asset-icon {
    width: 20px;
    flex-shrink: 0;
    color: #a8a8a8;
    text-align: center;
    font-size: 0.85em;
  }

  .asset-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
