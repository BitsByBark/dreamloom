<script lang="ts">
  import { openUrl } from "@tauri-apps/plugin-opener";
  import { BUILD_STACK, fetchBuildInfo, formatSystemSpecs, type BuildInfo } from "$lib/build-info";
  import wordmarkUrl from "$assets/images/Wordmark.png";
  import taglines from "../src/taglines.json";

  const ABOUT_LINKS = [
    {
      label: "Discord",
      url: "https://discord.gg/Ec7pyQnbP4",
      icon: "discord",
    },
    {
      label: "GitHub",
      url: "https://github.com/BitsByBark/dreamloom",
      icon: "github",
    },
    {
      label: "Website",
      url: "https://madebybark.com",
      icon: "website",
    },
  ] as const;
  const tagline = taglines[Math.floor(Math.random() * taglines.length)] ?? "";

  type Props = {
    open: boolean;
    onclose: () => void;
  };

  let { open, onclose }: Props = $props();

  let info = $state<BuildInfo | null>(null);
  let loadError = $state("");

  $effect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    info = null;
    loadError = "";

    void fetchBuildInfo()
      .then((result) => {
        if (!cancelled) {
          info = result;
        }
      })
      .catch(() => {
        if (!cancelled) {
          loadError = "Could not load build info.";
        }
      });

    return () => {
      cancelled = true;
    };
  });

  function handleBackdropClick() {
    onclose();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!open || event.key !== "Escape") {
      return;
    }
    event.preventDefault();
    onclose();
  }

  function openAboutLink(event: MouseEvent, url: string) {
    event.preventDefault();
    void openUrl(url);
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div
    class="version-modal-backdrop"
    role="presentation"
    onclick={handleBackdropClick}
  ></div>
  <div
    class="version-modal ui-chrome"
    role="dialog"
    aria-modal="true"
    aria-labelledby="version-modal-title"
  >
    <div class="version-modal-brand">
      <img
        id="version-modal-title"
        class="version-modal-wordmark"
        src={wordmarkUrl}
        alt="Dreamloom"
      />
      {#if tagline}
        <p class="version-modal-tagline">{tagline}</p>
      {/if}
    </div>

    {#if loadError}
      <p class="version-modal-error">{loadError}</p>
    {:else if info}
      <section class="version-modal-section">
        <h3 class="version-modal-heading">Version</h3>
        <p class="version-modal-value">{info.appVersion}</p>
      </section>

      <section class="version-modal-section">
        <h3 class="version-modal-heading">System</h3>
        <p class="version-modal-value version-modal-specs">{formatSystemSpecs(info)}</p>
      </section>

      <section class="version-modal-section">
        <h3 class="version-modal-heading">Build stack</h3>
        <ul class="version-modal-stack">
          {#each BUILD_STACK as item}
            <li>{item}</li>
          {/each}
        </ul>
      </section>
    {:else}
      <p class="version-modal-wait">Loading…</p>
    {/if}

    <div class="version-modal-links" aria-label="Dreamloom links">
      {#each ABOUT_LINKS as link}
        <a
          class="version-modal-link-button"
          href={link.url}
          onclick={(event) => openAboutLink(event, link.url)}
        >
          {#if link.icon === "discord"}
            <svg class="version-modal-link-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M20.3 4.4A16.7 16.7 0 0 0 16.1 3l-.2.4c-.2.4-.4.8-.5 1.2a15.6 15.6 0 0 0-4.8 0 9 9 0 0 0-.7-1.6 16.5 16.5 0 0 0-4.2 1.4C3.1 8.4 2.4 12.2 2.8 16c1.8 1.3 3.5 2.1 5.2 2.7.4-.6.8-1.2 1.1-1.9-.6-.2-1.1-.5-1.6-.8l.4-.3c3.1 1.4 6.4 1.4 9.4 0l.4.3c-.5.3-1 .6-1.6.8.3.7.7 1.3 1.1 1.9 1.7-.5 3.5-1.4 5.2-2.7.5-4.4-.8-8.1-2.1-11.6ZM8.7 13.8c-.9 0-1.7-.9-1.7-2s.8-2 1.7-2c1 0 1.8.9 1.7 2 0 1.1-.8 2-1.7 2Zm6.6 0c-.9 0-1.7-.9-1.7-2s.8-2 1.7-2c1 0 1.8.9 1.7 2 0 1.1-.7 2-1.7 2Z"
              />
            </svg>
          {:else if link.icon === "github"}
            <svg class="version-modal-link-icon" viewBox="0 0 16 16" aria-hidden="true">
              <path
                fill="currentColor"
                d="M8 0C3.6 0 0 3.6 0 8c0 3.5 2.3 6.5 5.5 7.6.4.1.5-.2.5-.4v-1.4c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.1-.9-1.1-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.2 1.8.8 2.3.6.1-.5.3-.8.5-1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8a7.5 7.5 0 0 1 4 0c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3.1-1.9 3.7-3.6 4 .3.2.5.7.5 1.5v2.2c0 .2.1.5.5.4A8 8 0 0 0 8 0Z"
              />
            </svg>
          {:else}
            <svg class="version-modal-link-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 9h-3.3a15.4 15.4 0 0 0-1.1-5 8.1 8.1 0 0 1 4.4 5ZM12 4c.7 1 1.4 2.6 1.7 5h-3.4C10.6 6.6 11.3 5 12 4ZM4.3 13h3.1c.1 1.7.5 3.3 1.1 5a8 8 0 0 1-4.2-5Zm3.1-2H4.3a8 8 0 0 1 4.2-5c-.6 1.7-1 3.3-1.1 5Zm4.6 9c-.7-1-1.4-2.6-1.7-5h3.4c-.3 2.4-1 4-1.7 5Zm2-7h-4v-2h4v2Zm1.5 5c.6-1.7 1-3.3 1.1-5h3.1a8 8 0 0 1-4.2 5Zm1.1-7c-.1-1.7-.5-3.3-1.1-5a8 8 0 0 1 4.2 5h-3.1Z"
              />
            </svg>
          {/if}
          <span>{link.label}</span>
        </a>
      {/each}
    </div>

  </div>
{/if}

<style>
  .version-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 110;
    background: rgba(0, 0, 0, 0.65);
  }

  .version-modal {
    position: fixed;
    z-index: 111;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    box-sizing: border-box;
    width: max-content;
    max-width: calc(100vw - 100px);
    height: max-content;
    max-height: calc(100vh - 100px);
    overflow-y: auto;
    padding: 50px;
    background: #141414;
    border: 1px solid var(--panel-border);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 18px;
  }

  .version-modal-brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .version-modal-wordmark {
    display: block;
    width: auto;
    max-width: min(320px, calc(100vw - 100px));
    height: auto;
  }

  .version-modal-tagline {
    margin: 8px 0 0;
    max-width: 34rem;
    color: var(--text-muted);
    font: inherit;
    font-size: 0.8rem;
    letter-spacing: 0.02em;
    text-align: center;
  }

  .version-modal-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: max-content;
    max-width: 100%;
  }

  .version-modal-heading {
    margin: 0;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .version-modal-value {
    margin: 0;
    max-width: 100%;
    font-size: 0.85rem;
    color: var(--text);
    font-variant-numeric: tabular-nums;
    line-height: 1.45;
    word-break: break-word;
  }

  .version-modal-specs {
    white-space: pre-line;
  }

  .version-modal-stack {
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--text);
    font-size: 0.85rem;
    line-height: 1.55;
  }

  .version-modal-stack li + li {
    margin-top: 2px;
  }

  .version-modal-links {
    display: flex;
    gap: 8px;
    margin-top: 2px;
  }

  .version-modal-link-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    background: #0a0a0a;
    color: var(--text);
    cursor: pointer;
    font: inherit;
    font-size: 0.8rem;
    text-decoration: none;
  }

  .version-modal-link-button:hover {
    background: #1c1c1c;
  }

  .version-modal-link-icon {
    width: 14px;
    height: 14px;
    flex: 0 0 auto;
  }

  .version-modal-wait,
  .version-modal-error {
    margin: 0;
    text-align: center;
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .version-modal-error {
    color: #f87171;
  }
</style>
