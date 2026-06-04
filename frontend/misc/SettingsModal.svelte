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
    authStore,
    connectGithub,
    disconnectGithub,
  } from "$auth/authStore.svelte";
  import {
    clampLogFontSize,
    clampZoom,
    MIN_INACTIVE_EVICTION_DELAY_MS,
    MIN_LOG_FONT_SIZE,
    MAX_LOG_FONT_SIZE,
    MIN_ZOOM,
    MAX_ZOOM,
  } from "$settings/storage";

  type SettingsTab = "behavior" | "accounts" | "debug";

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
          class:active={activeTab === "accounts"}
          aria-selected={activeTab === "accounts"}
          onclick={() => (activeTab = "accounts")}
        >
          Accounts
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
      {:else if activeTab === "accounts"}
        <div class="tab-panel" role="tabpanel" aria-label="Accounts">
          <section class="accounts-section">
            <h3 class="accounts-heading">GitHub</h3>
            {#if authStore.status === "authenticated" && authStore.user}
              <div class="accounts-connected">
                <img
                  class="accounts-avatar"
                  src={authStore.user.avatarUrl}
                  alt=""
                  width="40"
                  height="40"
                />
                <div class="accounts-meta">
                  <span class="accounts-login">{authStore.user.login}</span>
                  <span class="accounts-status">Connected</span>
                </div>
              </div>
              <button type="button" class="action-btn" onclick={disconnectGithub}>
                Disconnect GitHub
              </button>
            {:else}
              <p class="note">
                Connect GitHub to show your profile and repo stats in the top bar.
              </p>
              <button
                type="button"
                class="action-btn action-btn-accent"
                disabled={authStore.status === "loading"}
                onclick={connectGithub}
              >
                {authStore.status === "loading" ? "Connecting…" : "Connect GitHub"}
              </button>
            {/if}
          </section>

          <section class="accounts-section">
            <h3 class="accounts-heading">Top bar</h3>
            <p class="note">Choose what shows on the right side of the menubar when signed in.</p>
            <label class="field field-row">
              <input type="checkbox" bind:checked={settings.topbarShowAvatar} />
              <span class="label">Profile photo</span>
            </label>
            <label class="field field-row">
              <input type="checkbox" bind:checked={settings.topbarShowUsername} />
              <span class="label">Username</span>
            </label>
            <label class="field field-row">
              <input type="checkbox" bind:checked={settings.topbarShowDiff} />
              <span class="label">Line diff (+added / removed−)</span>
            </label>
            <label class="field field-row">
              <input type="checkbox" bind:checked={settings.topbarShowFilesChanged} />
              <span class="label">Files changed</span>
            </label>
            <label class="field field-row">
              <input type="checkbox" bind:checked={settings.topbarShowBranch} />
              <span class="label">Branch name</span>
            </label>
          </section>
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

  .action-btn-accent {
    color: var(--accent, #aacc00);
    border-color: #3a4218;
  }

  .action-btn-accent:hover:not(:disabled) {
    background: #161a0c;
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .accounts-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 360px;
  }

  .accounts-heading {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .accounts-connected {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .accounts-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid var(--panel-border);
  }

  .accounts-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .accounts-login {
    color: var(--text);
    font-size: 14px;
    font-weight: 600;
  }

  .accounts-status {
    color: var(--text-muted);
    font-size: 12px;
  }

  .note {
    margin: 0;
    max-width: 360px;
    color: var(--text-muted);
    font-size: 12px;
    line-height: 1.5;
  }
</style>
