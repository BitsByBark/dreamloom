<script lang="ts">
  import { authStore } from "$auth/authStore.svelte";
  import { settings } from "$settings/settings.svelte";

  type Props = {
    menuOpen: boolean;
    onmenu: (event: MouseEvent) => void;
  };

  let { menuOpen, onmenu }: Props = $props();

  const showTopbar = $derived(settings.topbarShowAvatar || settings.topbarShowUsername);
</script>

{#if authStore.status === "anonymous"}
  <div class="topbar-user">
    <button
      type="button"
      class="topbar-user-menu topbar-user-menu-icon"
      aria-haspopup="menu"
      aria-expanded={menuOpen}
      aria-label="Open Dreamloom menu"
      onclick={onmenu}
    >☰</button>
  </div>
{:else if authStore.status === "loading"}
  <div class="topbar-user">
    <button
      type="button"
      class="topbar-user-menu topbar-user-menu-icon"
      aria-haspopup="menu"
      aria-expanded={menuOpen}
      aria-label="Open Dreamloom menu"
      onclick={onmenu}
    >☰</button>
  </div>
{:else if authStore.status === "authenticated" && authStore.user && showTopbar}
  <div class="topbar-user">
    <button
      type="button"
      class="topbar-user-menu topbar-user-info"
      aria-haspopup="menu"
      aria-expanded={menuOpen}
      onclick={onmenu}
    >
      {#if settings.topbarShowUsername}
        <span class="topbar-user-name">{authStore.user.login}</span>
      {/if}
      {#if settings.topbarShowAvatar}
        <img
          class="topbar-user-avatar"
          src={authStore.user.avatarUrl}
          alt=""
          width="24"
          height="24"
        />
      {/if}
    </button>
  </div>
{:else}
  <div class="topbar-user">
    <button
      type="button"
      class="topbar-user-menu topbar-user-menu-icon"
      aria-haspopup="menu"
      aria-expanded={menuOpen}
      aria-label="Open Dreamloom menu"
      onclick={onmenu}
    >☰</button>
  </div>
{/if}

<style>
  .topbar-user {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    padding-right: 12px;
    min-width: 0;
  }

  .topbar-user-menu {
    border: none;
    background: transparent;
    color: var(--text);
    cursor: pointer;
    font: inherit;
  }

  .topbar-user-menu:hover,
  .topbar-user-menu[aria-expanded="true"] {
    background: #1c1c1c;
  }

  .topbar-user-info {
    display: flex;
    align-items: center;
    gap: 28px;
    min-width: 0;
    font-size: 0.75em;
    padding: 8px;
  }

  .topbar-user-menu-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid var(--panel-border);
    color: var(--text-muted);
    font-size: 18px;
    line-height: 1;
  }

  .topbar-user-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    flex-shrink: 0;
    object-fit: cover;
    border: 1px solid var(--panel-border);
  }

  .topbar-user-name {
    color: var(--text);
    font-weight: 600;
    flex-shrink: 0;
  }

</style>
