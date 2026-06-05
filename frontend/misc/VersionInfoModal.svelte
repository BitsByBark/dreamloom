<script lang="ts">
  import { openUrl } from "@tauri-apps/plugin-opener";
  import { BUILD_STACK, fetchBuildInfo, formatSystemSpecs, type BuildInfo } from "$lib/build-info";
  import wordmarkUrl from "$assets/images/Wordmark.png";

  const MADE_BY_BARK_URL = "https://madebybark.com";

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

  function openMadeByBark(event: MouseEvent) {
    event.preventDefault();
    void openUrl(MADE_BY_BARK_URL);
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

    <a
      class="version-modal-link"
      href={MADE_BY_BARK_URL}
      onclick={openMadeByBark}
    >
      madebybark.com
    </a>

    <button type="button" class="version-modal-close" onclick={onclose}>Close</button>
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
    justify-content: center;
  }

  .version-modal-wordmark {
    display: block;
    width: auto;
    max-width: min(320px, calc(100vw - 100px));
    height: auto;
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

  .version-modal-link {
    margin-top: 2px;
    color: var(--accent, #aacc00);
    font-size: 0.85rem;
    text-decoration: none;
  }

  .version-modal-link:hover {
    text-decoration: underline;
  }

  .version-modal-close {
    margin-top: 6px;
    min-width: 5.5rem;
    padding: 8px 20px;
    border: 1px solid var(--panel-border);
    background: #0a0a0a;
    color: var(--text);
    cursor: pointer;
    font: inherit;
    font-size: 0.8rem;
  }

  .version-modal-close:hover {
    background: #1c1c1c;
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
