<script lang="ts">
  import "./tab-rail.css";
  import { join } from "@tauri-apps/api/path";
  import { readTextFile } from "@tauri-apps/plugin-fs";
  import { logLeftTab } from "$debug/logging.svelte";
  import { appState, type LeftTab } from "$lib/app-state.svelte";
  import { settings } from "$settings/settings.svelte";
  import Assets from "$panels/assets/index.svelte";
  import Git from "$panels/git/index.svelte";
  import Log from "$panels/log/index.svelte";
  import Repo from "$panels/repo/index.svelte";
  import Tree from "$panels/tree/index.svelte";

  const tabs = $derived.by(() => {
    const items: { id: LeftTab; label: string }[] = [
      { id: "repo", label: "Repo" },
      { id: "assets", label: "ASSETS" },
      { id: "tree", label: "Component Tree" },
      { id: "git", label: "Git" },
    ];

    if (settings.debugMode) {
      items.push({ id: "log", label: "Log" });
    }

    return items;
  });

  const repoName = $derived.by(() => {
    const dir = appState.openDirectory;
    if (!dir) {
      return null;
    }
    const normalized = dir.replace(/\\/g, "/");
    const slash = normalized.lastIndexOf("/");
    return slash >= 0 ? normalized.slice(slash + 1) : normalized;
  });

  let projectVersion = $state<string | null>(null);

  $effect(() => {
    const dir = appState.openDirectory;
    if (!dir) {
      projectVersion = null;
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const raw = await readTextFile(await join(dir, "package.json"));
        const json = JSON.parse(raw) as { version?: unknown };
        const version = typeof json.version === "string" ? json.version : null;
        if (!cancelled) {
          projectVersion = version;
        }
      } catch {
        if (!cancelled) {
          projectVersion = null;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  });

  $effect(() => {
    if (!settings.debugMode && appState.leftTab === "log") {
      appState.leftTab = "repo";
    }
  });

  function selectTab(tab: LeftTab) {
    if (appState.leftTab === tab) {
      return;
    }

    appState.leftTab = tab;
    logLeftTab(tab);
  }
</script>

<div class="tabs">
  <nav class="tab-rail ui-chrome" aria-label="Left panel tabs">
    {#each tabs as tab}
      <button
        type="button"
        class="tab-btn"
        class:active={appState.leftTab === tab.id}
        aria-current={appState.leftTab === tab.id ? "page" : undefined}
        onclick={() => selectTab(tab.id)}
      >
        <span class="tab-label">{tab.label}</span>
      </button>
    {/each}
  </nav>

  <div class="left-panel">
    <div class="selection-bar text-zoom" aria-live="polite">
      {#if repoName}
        <span class="selection-bar-value">{repoName.toUpperCase()}</span>
        {#if projectVersion}
          <span class="selection-bar-sep"> - </span>
          <span class="selection-bar-version">{projectVersion}</span>
        {/if}
      {:else}
        <span class="selection-bar-empty">No project open.</span>
      {/if}
    </div>

    <div class="tab-content" class:text-zoom={appState.leftTab !== "log"}>
      {#if appState.leftTab === "repo"}
        <Repo />
      {:else if appState.leftTab === "assets"}
        <Assets />
      {:else if appState.leftTab === "tree"}
        <Tree />
      {:else if appState.leftTab === "git"}
        <Git />
      {:else}
        <Log />
      {/if}
    </div>
  </div>
</div>
