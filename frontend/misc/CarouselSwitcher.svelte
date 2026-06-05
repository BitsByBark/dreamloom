<script lang="ts">
  export type CarouselOption = {
    id: string;
    label: string;
  };

  type Props = {
    options: readonly CarouselOption[];
    value: string;
    onchange: (id: string) => void;
    label?: string;
    note?: string;
  };

  let { options, value, onchange, label, note }: Props = $props();

  const activeIndex = $derived(Math.max(0, options.findIndex((o) => o.id === value)));
  const segmentCount = $derived(options.length);
</script>

<div class="carousel-field">
  {#if label}
    <span class="carousel-label">{label}</span>
  {/if}

  <div
    class="carousel-track"
    role="tablist"
    style="--segment-count: {segmentCount}; --active-index: {activeIndex}"
  >
    <div class="carousel-pill" aria-hidden="true"></div>
    {#each options as option (option.id)}
      <button
        type="button"
        role="tab"
        class="carousel-segment"
        class:active={value === option.id}
        aria-selected={value === option.id}
        onclick={() => onchange(option.id)}
      >
        {option.label}
      </button>
    {/each}
  </div>

  {#if note}
    <p class="carousel-note">{note}</p>
  {/if}
</div>

<style>
  .carousel-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 360px;
  }

  .carousel-label {
    color: var(--text-muted);
    font-size: 13px;
  }

  .carousel-track {
    position: relative;
    display: grid;
    grid-template-columns: repeat(var(--segment-count), 1fr);
    padding: 3px;
    border: 1px solid var(--panel-border);
    background: #141414;
  }

  .carousel-pill {
    position: absolute;
    top: 3px;
    bottom: 3px;
    left: 3px;
    width: calc((100% - 6px) / var(--segment-count));
    background: var(--accent, #aacc00);
    transition: transform 0.2s ease;
    transform: translateX(calc(var(--active-index) * 100%));
    pointer-events: none;
  }

  .carousel-segment {
    position: relative;
    z-index: 1;
    padding: 8px 10px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    text-align: center;
  }

  .carousel-segment:hover {
    color: var(--text);
  }

  .carousel-segment.active {
    color: #0a0a0a;
  }

  .carousel-note {
    margin: 0;
    color: var(--text-muted);
    font-size: 12px;
    line-height: 1.5;
  }
</style>
