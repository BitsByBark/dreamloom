<script lang="ts">
  import {
    logDebugModeDisabled,
    logDebugModeEnabled,
    logSettingsSaved,
  } from "$debug/logging.svelte";
  import { appState } from "$lib/app-state.svelte";
  import { resetPanelSizes } from "$lib/layout.svelte";
  import { rescheduleAllEvictions } from "$lib/center-tabs.svelte";
  import { persistSettings, settings } from "$settings/settings.svelte";
  import {
    clampLogFontSize,
    clampZoom,
    MIN_INACTIVE_EVICTION_DELAY_MS,
    MIN_LOG_FONT_SIZE,
    MAX_LOG_FONT_SIZE,
    MIN_ZOOM,
    MAX_ZOOM,
  } from "$settings/storage";

  type SettingsTab = "behavior" | "debug";

  type Props = {
    open: boolean;
    onclose: () => void;
  };

  let { open, onclose }: Props = $props();

  let dialogEl: HTMLDivElement | undefined = $state();
  let activeTab = $state<SettingsTab>("behavior");
  let debugModeOnOpen = false;

  async function closeAndSave() {
    settings.inactiveEvictionDelay = Math.max(
      MIN_INACTIVE_EVICTION_DELAY_MS,
      Math.round(settings.inactiveEvictionDelay),
    );
    settings.uiZoom = clampZoom(settings.uiZoom);
    settings.textZoom = clampZoom(settings.textZoom);
    settings.logFontSize = clampLogFontSize(settings.logFontSize);

    const debugChanged = debugModeOnOpen !== settings.debugMode;

    if (!settings.debugMode && appState.leftTab === "log") {
      appState.leftTab = "repo";
    }

    await persistSettings();
    rescheduleAllEvictions();
    logSettingsSaved();

    if (debugChanged) {
      if (settings.debugMode) {
        logDebugModeEnabled();
      } else {
        logDebugModeDisabled();
      }
    }

    onclose();
  }

  function handleFocusOut(event: FocusEvent) {
    const related = event.relatedTarget as Node | null;
    if (related && dialogEl?.contains(related)) {
      return;
    }

    void closeAndSave();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      void closeAndSave();
    }
  }

  $effect(() => {
    if (open) {
      activeTab = "behavior";
      debugModeOnOpen = settings.debugMode;
      queueMicrotask(() => dialogEl?.focus());
    }
  });
</script>

{#if open}
  <div class="overlay" role="presentation">
    <div
      bind:this={dialogEl}
      class="dialog ui-chrome"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      tabindex="-1"
      onfocusout={handleFocusOut}
      onkeydown={handleKeydown}
    >
      <h2 id="settings-title" class="title">Settings</h2>

      <div class="tab-bar" role="tablist" aria-label="Settings sections">
        <button
          type="button"
          role="tab"
          class="tab-btn"
          class:active={activeTab === "behavior"}
          aria-selected={activeTab === "behavior"}
          onclick={() => (activeTab = "behavior")}
        >
          Behavior
        </button>
        <button
          type="button"
          role="tab"
          class="tab-btn"
          class:active={activeTab === "debug"}
          aria-selected={activeTab === "debug"}
          onclick={() => (activeTab = "debug")}
        >
          Debug
        </button>
      </div>

      {#if activeTab === "behavior"}
        <div class="tab-panel" role="tabpanel" aria-label="Behavior">
          <label class="field">
            <span class="label">Inactive tab eviction delay (ms)</span>
            <input
              type="number"
              min={MIN_INACTIVE_EVICTION_DELAY_MS}
              step="1000"
              bind:value={settings.inactiveEvictionDelay}
            />
          </label>

          <label class="field">
            <span class="label">UI zoom — {settings.uiZoom.toFixed(1)}</span>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step="0.1"
              bind:value={settings.uiZoom}
            />
          </label>

          <label class="field">
            <span class="label">Text zoom — {settings.textZoom.toFixed(1)}</span>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step="0.1"
              bind:value={settings.textZoom}
            />
          </label>

          <div class="field">
            <button type="button" class="action-btn" onclick={resetPanelSizes}>
              Reset panel sizes
            </button>
          </div>
        </div>
      {:else}
        <div class="tab-panel" role="tabpanel" aria-label="Debug">
          <label class="field field-row">
            <input type="checkbox" bind:checked={settings.debugMode} />
            <span class="label">Debug mode</span>
          </label>

          <label class="field">
            <span class="label">Log font size (px) — {settings.logFontSize}</span>
            <input
              type="range"
              min={MIN_LOG_FONT_SIZE}
              max={MAX_LOG_FONT_SIZE}
              step="1"
              bind:value={settings.logFontSize}
            />
          </label>

          {#if !settings.debugMode}
            <p class="note">The Log tab is hidden while debug mode is off.</p>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.72);
  }

  .dialog {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 90vw;
    height: 90vh;
    padding: 24px;
    background: #0a0a0a;
    border: 1px solid var(--panel-border);
    outline: none;
  }

  .title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text);
  }

  .tab-bar {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--panel-border);
  }

  .tab-btn {
    padding: 8px 16px;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    font: inherit;
    font-size: 13px;
  }

  .tab-btn:hover {
    color: var(--text);
    background: #141414;
  }

  .tab-btn.active {
    color: var(--text);
    border-bottom-color: #666666;
  }

  .tab-panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 360px;
  }

  .field-row {
    flex-direction: row;
    align-items: center;
    gap: 10px;
  }

  .label {
    color: var(--text-muted);
    font-size: 13px;
  }

  .field input[type="number"] {
    padding: 8px 10px;
    border: 1px solid var(--panel-border);
    background: #141414;
    color: var(--text);
    font: inherit;
  }

  .field input[type="number"]:focus {
    outline: 1px solid #444444;
  }

  .field input[type="range"] {
    width: 100%;
    accent-color: #888888;
  }

  .field input[type="checkbox"] {
    width: 14px;
    height: 14px;
    accent-color: #888888;
  }

  .action-btn {
    align-self: flex-start;
    padding: 8px 14px;
    border: 1px solid var(--panel-border);
    background: #141414;
    color: var(--text);
    cursor: pointer;
    font: inherit;
    font-size: 13px;
  }

  .action-btn:hover {
    background: #1c1c1c;
  }

  .note {
    margin: 0;
    max-width: 360px;
    color: var(--text-muted);
    font-size: 12px;
    line-height: 1.5;
  }
</style>
