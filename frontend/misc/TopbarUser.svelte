<script lang="ts">
  import { authStore, connectGithub } from "$auth/authStore.svelte";
  import { settings } from "$settings/settings.svelte";

  const showTopbar = $derived(settings.topbarShowAvatar || settings.topbarShowUsername);
</script>

{#if authStore.status === "anonymous"}
  <div class="topbar-user">
    <button type="button" class="topbar-connect" onclick={connectGithub}>CONNECT GITHUB</button>
  </div>
{:else if authStore.status === "loading"}
  <div class="topbar-user">
    <span class="topbar-auth-loading">GITHUB...</span>
  </div>
{:else if authStore.status === "authenticated" && authStore.user && showTopbar}
  <div class="topbar-user">
    <div class="topbar-user-info">
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
    </div>
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

  .topbar-user-info {
    display: flex;
    align-items: center;
    gap: 28px;
    min-width: 0;
    font-size: 0.75em;
    padding-left: 8px;
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

  .topbar-connect {
    padding: 4px 8px;
    border: 1px solid var(--panel-border);
    background: transparent;
    color: var(--accent, #aacc00);
    cursor: pointer;
    font: inherit;
    font-size: 0.75em;
    font-weight: 600;
    letter-spacing: 0.06em;
  }

  .topbar-connect:hover {
    background: rgba(170, 204, 0, 0.08);
  }

  .topbar-auth-loading {
    color: var(--text-muted);
    font-size: 0.75em;
    letter-spacing: 0.06em;
  }
</style>
