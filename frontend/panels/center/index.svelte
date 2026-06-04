<script lang="ts">
  import { onMount } from "svelte";
  import { appState } from "$lib/app-state.svelte";
  import { centerTabs, closeCenterTab, selectCenterTab } from "$lib/center-tabs.svelte";
  import {
    handlePreviewClear,
    handlePreviewSelect,
    handlePreviewSelectElement,
  } from "$lib/bridge-selection.svelte";
  import { previewPageUrl } from "$lib/preview-url";
  import { ACCENT_COLOR } from "$settings/storage";
  import type { DreamloomPreviewMessage } from "./preview-bridge";
  import { filePathToRoute } from "./routes";

  const activeTab = $derived(
    centerTabs.tabs.find((tab) => tab.path === centerTabs.activePath) ?? null,
  );

  const previewRoute = $derived.by(() => {
    if (!activeTab || !appState.openDirectory) {
      return "/";
    }

    return filePathToRoute(activeTab.path, appState.openDirectory);
  });

  const previewUrl = $derived(
    appState.devServerStatus === "running" && appState.devServerPort !== null
      ? previewPageUrl(appState.devServerPort, previewRoute)
      : null,
  );

  let previewFrame: HTMLIFrameElement | undefined = $state();

  function postAccentConfig() {
    const win = previewFrame?.contentWindow;
    if (!win) {
      return;
    }

    win.postMessage(
      { type: "dreamloom:config", accentColor: ACCENT_COLOR } satisfies DreamloomPreviewMessage,
      "*",
    );
  }

  function onPreviewLoad() {
    postAccentConfig();
  }

  function onPreviewMessage(event: MessageEvent) {
    if (event.source !== previewFrame?.contentWindow) {
      return;
    }

    const data = event.data as DreamloomPreviewMessage | undefined;
    if (!data?.type) {
      return;
    }

    if (data.type === "dreamloom:clear") {
      handlePreviewClear(data);
      return;
    }

    if (data.type === "dreamloom:select" && data.dlClass) {
      void handlePreviewSelect(data);
      return;
    }

    if (data.type === "dreamloom:selectElement") {
      handlePreviewSelectElement(data);
    }
  }

  onMount(() => {
    window.addEventListener("message", onPreviewMessage);
    return () => window.removeEventListener("message", onPreviewMessage);
  });
</script>

<div class="center">
  {#if centerTabs.tabs.length > 0}
    <div class="tab-bar ui-chrome" role="tablist" aria-label="Open files">
      {#each centerTabs.tabs as tab (tab.path)}
        <div class="tab" class:active={centerTabs.activePath === tab.path}>
          <button
            type="button"
            role="tab"
            class="tab-label"
            aria-selected={centerTabs.activePath === tab.path}
            onclick={() => selectCenterTab(tab.path)}
          >
            {tab.filename}
          </button>
          <button
            type="button"
            class="tab-close"
            aria-label="Close {tab.filename}"
            onclick={(event) => {
              event.stopPropagation();
              closeCenterTab(tab.path);
            }}
          >
            ⤬
          </button>
        </div>
      {/each}
    </div>
  {/if}

  <div
    class="content text-zoom"
    class:preview={appState.devServerStatus === "running"}
    role="tabpanel"
  >
    {#if appState.devServerStatus === "idle"}
      <p class="placeholder">Open a project folder to start the dev server</p>
    {:else if appState.devServerStatus === "starting"}
      <div class="state">
        <div class="spinner" aria-hidden="true"></div>
        <p class="placeholder">Starting dev server…</p>
      </div>
    {:else if appState.devServerStatus === "error"}
      <div class="state error">
        <p class="placeholder">Dev server failed to start</p>
        {#if appState.devServerError}
          <p class="error-detail">{appState.devServerError}</p>
        {/if}
      </div>
    {:else if previewUrl}
      {#key previewUrl}
        <iframe
          bind:this={previewFrame}
          class="preview-frame"
          title="Preview"
          src={previewUrl}
          onload={onPreviewLoad}
        ></iframe>
      {/key}
    {/if}
  </div>
</div>

<style>
  .center {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .tab-bar {
    display: flex;
    flex-shrink: 0;
    gap: 0;
    min-height: 24px;
    overflow-x: auto;
    border-bottom: 1px solid var(--panel-border);
    background: #0a0a0a;
  }

  .tab {
    display: flex;
    align-items: stretch;
    flex-shrink: 0;
    border-right: 1px solid var(--panel-border);
    background: transparent;
  }

  .tab:hover {
    background: #161616;
  }

  .tab.active {
    background: #222222;
  }

  .tab-label {
    padding: 2px 10px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    font: inherit;
    font-size: 11px;
    line-height: 1.2;
    white-space: nowrap;
  }

  .tab:hover .tab-label,
  .tab.active .tab-label {
    color: var(--text);
  }

  .tab-close {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
    border: none;
    border-left: 1px solid var(--panel-border);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    font: inherit;
    font-size: 10px;
    line-height: 1;
  }

  .tab-close:hover {
    background: #2a2a2a;
    color: var(--text);
  }

  .content {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: auto;
    padding: 16px;
  }

  .content.preview {
    padding: 0;
    overflow: hidden;
  }

  .state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .state.error {
    max-width: 100%;
    text-align: center;
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--panel-border);
    border-top-color: var(--text);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .placeholder {
    margin: 0;
    color: var(--text-muted);
    font-size: 13px;
  }

  .error-detail {
    margin: 0;
    color: #e57373;
    font-size: 12px;
    word-break: break-word;
  }

  .preview-frame {
    flex: 1;
    width: 100%;
    height: 100%;
    min-height: 0;
    border: none;
    background: var(--bg);
  }
</style>
