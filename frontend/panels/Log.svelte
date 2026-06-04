<script lang="ts">
  import { formatLogTime, logState, type LogLevel } from "$debug/logging.svelte";

  let logEnd: HTMLDivElement | undefined = $state();

  const levelClass: Record<LogLevel, string> = {
    good: "level-good",
    warn: "level-warn",
    perf: "level-perf",
    error: "level-error",
  };

  $effect(() => {
    logState.entries.length;
    queueMicrotask(() => logEnd?.scrollIntoView({ block: "end" }));
  });
</script>

<div class="log-panel">
  {#if logState.entries.length === 0}
    <p class="hint">No events yet</p>
  {:else}
    <ol class="log-list">
      {#each logState.entries as entry (entry.id)}
        <li class="log-line">
          <span class="time">{formatLogTime(entry.time)}</span>
          <span class="message {levelClass[entry.level]}">{entry.message}</span>
        </li>
      {/each}
    </ol>
    <div bind:this={logEnd} aria-hidden="true"></div>
  {/if}
</div>

<style>
  .log-panel {
    min-height: 0;
    height: 100%;
    overflow: auto;
    padding: 8px 0;
  }

  .hint {
    margin: 0;
    padding: 8px 12px;
    color: var(--text-muted);
    font-size: calc(var(--log-font-size, 12px) * 0.92);
  }

  .log-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .log-line {
    display: flex;
    gap: 10px;
    padding: 2px 12px;
    font-size: var(--log-font-size, 12px);
    line-height: 1.4;
  }

  .log-line:hover {
    background: #161616;
  }

  .time {
    flex-shrink: 0;
    color: var(--text-muted);
  }

  .message {
    word-break: break-word;
  }

  .level-good {
    color: #66bb66;
  }

  .level-warn {
    color: #cc9966;
  }

  .level-perf {
    color: #cccc88;
  }

  .level-error {
    color: #cc6666;
  }
</style>
