<script lang="ts">
  import { centerTabs, closeCenterTab, selectCenterTab } from "$lib/center-tabs.svelte";

  const activeTab = $derived(
    centerTabs.tabs.find((tab) => tab.path === centerTabs.activePath) ?? null,
  );
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

  <div class="content text-zoom" role="tabpanel">
    {#if !activeTab}
      <p class="placeholder">Click a .svelte file in the repo tree</p>
    {:else}
      <p class="placeholder filename">{activeTab.filename}</p>
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

  .placeholder {
    margin: 0;
    color: var(--text-muted);
    font-size: 13px;
  }

  .filename {
    color: var(--text);
    font-size: 15px;
  }
</style>
