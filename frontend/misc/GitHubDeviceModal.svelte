<script lang="ts">
  import { authStore, cancelGithubConnect, connectGithub } from "$auth/authStore.svelte";
  import { openUrl } from "@tauri-apps/plugin-opener";

  const flow = $derived(authStore.deviceFlow);

  async function copyCode() {
    if (!flow.userCode) return;
    try {
      await navigator.clipboard.writeText(flow.userCode);
    } catch {
      // ignore
    }
  }

  function openGithub() {
    if (flow.verificationUri) {
      void openUrl(flow.verificationUri);
    }
  }
</script>

{#if flow.active}
  <div class="github-modal-backdrop" role="presentation" onclick={cancelGithubConnect}></div>
  <div class="github-modal ui-chrome" role="dialog" aria-labelledby="github-modal-title">
    <h2 id="github-modal-title" class="github-modal-title">Connect GitHub</h2>

    {#if flow.error && !flow.userCode}
      <p class="github-modal-error">{flow.error}</p>
      <div class="github-modal-actions">
        <button type="button" class="github-modal-btn" onclick={cancelGithubConnect}>Close</button>
        <button type="button" class="github-modal-btn primary" onclick={connectGithub}>Retry</button>
      </div>
    {:else}
      <p class="github-modal-hint">Enter this code on GitHub:</p>
      <div class="github-modal-code-row">
        <code class="github-modal-code">{flow.userCode || "—"}</code>
        <button type="button" class="github-modal-btn" onclick={copyCode}>Copy</button>
      </div>
      <button type="button" class="github-modal-btn primary" onclick={openGithub}>Open GitHub</button>
      {#if flow.polling}
        <p class="github-modal-wait">Waiting for authorization…</p>
      {/if}
      {#if flow.error}
        <p class="github-modal-error">{flow.error}</p>
      {/if}
      <button type="button" class="github-modal-btn ghost" onclick={cancelGithubConnect}>Cancel</button>
    {/if}
  </div>
{/if}

<style>
  .github-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(0, 0, 0, 0.65);
  }

  .github-modal {
    position: fixed;
    z-index: 101;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(360px, calc(100vw - 32px));
    padding: 16px;
    background: #141414;
    border: 1px solid var(--panel-border);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .github-modal-title {
    margin: 0;
    font-size: 0.85em;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text);
  }

  .github-modal-hint {
    margin: 0;
    font-size: 0.8em;
    color: var(--text-muted);
  }

  .github-modal-code-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .github-modal-code {
    flex: 1;
    padding: 8px 10px;
    background: #0a0a0a;
    border: 1px solid var(--panel-border);
    font-size: 1.1em;
    letter-spacing: 0.12em;
    color: var(--text);
  }

  .github-modal-wait {
    margin: 0;
    font-size: 0.75em;
    color: var(--text-muted);
  }

  .github-modal-error {
    margin: 0;
    font-size: 0.75em;
    color: #e57373;
  }

  .github-modal-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .github-modal-btn {
    padding: 6px 12px;
    border: 1px solid var(--panel-border);
    background: #1c1c1c;
    color: var(--text);
    cursor: pointer;
    font: inherit;
    font-size: 0.8em;
  }

  .github-modal-btn.primary {
    border-color: var(--accent, #aacc00);
    color: var(--accent, #aacc00);
  }

  .github-modal-btn.ghost {
    background: transparent;
    color: var(--text-muted);
  }

  .github-modal-btn:hover {
    background: #242424;
  }
</style>
