<script lang="ts">
  import { openDirectory } from "$lib/open-directory";
  import SettingsModal from "$misc/SettingsModal.svelte";

  let fileMenuOpen = $state(false);
  let settingsMenuOpen = $state(false);
  let settingsModalOpen = $state(false);

  function toggleFileMenu(event: MouseEvent) {
    event.stopPropagation();
    settingsMenuOpen = false;
    fileMenuOpen = !fileMenuOpen;
  }

  function toggleSettingsMenu(event: MouseEvent) {
    event.stopPropagation();
    fileMenuOpen = false;
    settingsMenuOpen = !settingsMenuOpen;
  }

  function closeMenus() {
    fileMenuOpen = false;
    settingsMenuOpen = false;
  }

  async function handleOpenDirectory(event: MouseEvent) {
    event.stopPropagation();
    closeMenus();
    await openDirectory();
  }

  function handleOpenSettings(event: MouseEvent) {
    event.stopPropagation();
    closeMenus();
    settingsModalOpen = true;
  }

  function closeSettingsModal() {
    settingsModalOpen = false;
  }

  function onWindowClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest(".menu-root")) {
      closeMenus();
    }
  }
</script>

<svelte:window onclick={onWindowClick} />

<header class="menubar ui-chrome">
  <div class="menu-root">
    <button
      type="button"
      class="menu-trigger"
      aria-haspopup="menu"
      aria-expanded={fileMenuOpen}
      onclick={toggleFileMenu}
    >
      File
    </button>
    {#if fileMenuOpen}
      <div class="menu-dropdown" role="menu">
        <button type="button" role="menuitem" onclick={handleOpenDirectory}>
          Open Directory
        </button>
      </div>
    {/if}
  </div>

  <div class="menu-root">
    <button
      type="button"
      class="menu-trigger"
      aria-haspopup="menu"
      aria-expanded={settingsMenuOpen}
      onclick={toggleSettingsMenu}
    >
      Settings
    </button>
    {#if settingsMenuOpen}
      <div class="menu-dropdown" role="menu">
        <button type="button" role="menuitem" onclick={handleOpenSettings}>
          Settings…
        </button>
      </div>
    {/if}
  </div>
</header>

<SettingsModal open={settingsModalOpen} onclose={closeSettingsModal} />

<style>
  .menubar {
    display: flex;
    align-items: stretch;
    height: 28px;
    flex-shrink: 0;
    background: #0a0a0a;
    border-bottom: 1px solid var(--panel-border);
  }

  .menu-root {
    position: relative;
  }

  .menu-trigger {
    height: 100%;
    padding: 0 12px;
    border: none;
    background: transparent;
    color: var(--text);
    cursor: pointer;
    font: inherit;
  }

  .menu-trigger:hover,
  .menu-root:has(.menu-dropdown) .menu-trigger {
    background: #1c1c1c;
  }

  .menu-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 20;
    min-width: 160px;
    padding: 4px 0;
    background: #141414;
    border: 1px solid var(--panel-border);
  }

  .menu-dropdown button {
    display: block;
    width: 100%;
    padding: 6px 12px;
    border: none;
    background: transparent;
    color: var(--text);
    text-align: left;
    cursor: pointer;
    font: inherit;
  }

  .menu-dropdown button:hover {
    background: #1c1c1c;
  }
</style>
