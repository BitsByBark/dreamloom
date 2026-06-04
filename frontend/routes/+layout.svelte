<script lang="ts">
  import "@fontsource/ibm-plex-mono/400.css";
  import "../app.css";
  import { initSessionLogFile } from "$debug/log-file";
  import { appState } from "$lib/app-state.svelte";
  import GitModal from "$git/GitModal.svelte";
  import GitHubDeviceModal from "$misc/GitHubDeviceModal.svelte";
  import WelcomeModal from "$misc/WelcomeModal.svelte";
  import { hydrateAuth } from "$auth/authStore.svelte";
  import { initSettings, settings } from "$settings/settings.svelte";

  let { children } = $props();

  let ready = $state(false);

  $effect(() => {
    void initSettings().then(async () => {
      await initSessionLogFile();
      ready = true;
      void hydrateAuth();
    });
  });

  $effect(() => {
    document.documentElement.style.setProperty("--ui-zoom", String(settings.uiZoom));
    document.documentElement.style.setProperty("--text-zoom", String(settings.textZoom));
    document.documentElement.style.setProperty(
      "--log-font-size",
      `${settings.logFontSize}px`,
    );
  });
</script>

{#if ready && !appState.openDirectory}
  <WelcomeModal />
{/if}

<GitHubDeviceModal />
<GitModal />

{@render children()}
