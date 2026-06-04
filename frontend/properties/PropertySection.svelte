<script lang="ts">
  import "./properties-theme.css";
  import { untrack, type Snippet } from "svelte";

  type Props = {
    title: string;
    /** When true, section starts expanded (user can still collapse). */
    startExpanded?: boolean;
    children: Snippet;
  };

  let { title, startExpanded = true, children }: Props = $props();

  let expanded = $state(untrack(() => startExpanded));

  function toggle() {
    expanded = !expanded;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    }
  }
</script>

<section class="prop-section prop-root">
  <button
    type="button"
    class="prop-section-header"
    aria-expanded={expanded}
    onclick={toggle}
    onkeydown={handleKeydown}
  >
    <span class="prop-section-chevron" aria-hidden="true">{expanded ? "▼" : "▶"}</span>
    <span class="prop-section-title">{title}</span>
  </button>

  {#if expanded}
    <div class="prop-section-body">
      {@render children()}
    </div>
  {/if}
</section>

<style>
  .prop-section {
    flex-shrink: 0;
    border-bottom: 1px solid var(--panel-border);
  }

  .prop-section:last-child {
    border-bottom: none;
  }
</style>
