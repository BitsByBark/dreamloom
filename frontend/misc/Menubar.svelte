<script lang="ts">
  import { openDirectory } from "$lib/open-directory";
  import SettingsModal from "$misc/SettingsModal.svelte";
  import TopbarUser from "$misc/TopbarUser.svelte";
  import WindowControls from "$misc/WindowControls.svelte";
  import { settings } from "$settings/settings.svelte";
  import wordmarkUrl from "$assets/images/Wordmark.png";

  const frameless = $derived(settings.windowDecorations !== "native");
  const showWindowControls = $derived(settings.windowDecorations === "dreamloom");

  let menuAnchor = $state<"logo" | "user" | null>(null);
  let settingsModalOpen = $state(false);

  function toggleLogoMenu(event: MouseEvent) {
    event.stopPropagation();
    menuAnchor = menuAnchor === "logo" ? null : "logo";
  }

  function toggleUserMenu(event: MouseEvent) {
    event.stopPropagation();
    menuAnchor = menuAnchor === "user" ? null : "user";
  }

  function closeMenus() {
    menuAnchor = null;
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
      class="menubar-brand"
      aria-haspopup="menu"
      aria-expanded={menuAnchor === "logo"}
      aria-label="Dreamloom menu"
      onclick={toggleLogoMenu}
    >
      <img class="menubar-wordmark" src={wordmarkUrl} alt="Dreamloom" />
    </button>
    {#if menuAnchor === "logo"}
      <div class="menu-dropdown" role="menu">
        <button type="button" role="menuitem" onclick={handleOpenDirectory}>
          Open Directory
        </button>
        <button type="button" role="menuitem" onclick={handleOpenSettings}>
          Settings…
        </button>
      </div>
    {/if}
  </div>

  <div
    class="menubar-spacer"
    aria-hidden="true"
    data-tauri-drag-region={frameless ? "" : undefined}
  ></div>
  <div class="menu-root menu-root-user">
    <TopbarUser menuOpen={menuAnchor === "user"} onmenu={toggleUserMenu} />
    {#if menuAnchor === "user"}
      <div class="menu-dropdown menu-dropdown-user" role="menu">
        <button type="button" role="menuitem" onclick={handleOpenDirectory}>
          Open Directory
        </button>
        <button type="button" role="menuitem" onclick={handleOpenSettings}>
          Settings…
        </button>
      </div>
    {/if}
  </div>
  {#if showWindowControls}
    <WindowControls />
  {/if}
</header>

<SettingsModal open={settingsModalOpen} onclose={closeSettingsModal} />

<style>
  .menubar {
    display: flex;
    align-items: center;
    width: 100%;
    height: 40px;
    flex-shrink: 0;
    background: #0a0a0a;
    border-bottom: 1px solid var(--panel-border);
  }

  .menubar-spacer {
    flex: 1;
    min-width: 8px;
  }

  .menubar-brand {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    height: 100%;
    padding: 5px 20px 5px 20px;
    border-right: 1px solid var(--panel-border);
    border-top: none;
    border-bottom: none;
    border-left: none;
    background: transparent;
    cursor: pointer;
  }

  .menubar-brand:hover,
  .menu-root:has(.menu-dropdown) .menubar-brand {
    background: #1c1c1c;
  }

  .menubar-wordmark {
    display: block;
    height: 50%;
    width: auto;
    max-height: 50px;
    max-width: auto;
    object-fit: contain;
    object-position: center;
  }

  .menu-root {
    align-self: stretch;
    position: relative;
  }

  .menu-root-user {
    display: flex;
    align-items: stretch;
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

  .menu-dropdown-user {
    right: 0;
    left: auto;
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
