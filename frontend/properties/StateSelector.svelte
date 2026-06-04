<script lang="ts">
  import "./properties-theme.css";
  import { editorBridge } from "$lib/bridge-selection.svelte";
  import { ACCENT_COLOR } from "$settings/storage";
  import { PROPERTY_PSEUDO_OPTIONS, selectionIdentity } from "./property-pseudo-state";
  import {
    propertiesPseudo,
    resetPropertyPseudoState,
    setPropertyPseudoState,
    togglePropertyPseudoCollapsed,
  } from "./properties-pseudo.svelte";

  const hasBridgeSelection = $derived(editorBridge.selection !== null);

  const defaultOption = PROPERTY_PSEUDO_OPTIONS[0];
  const variantOptions = PROPERTY_PSEUDO_OPTIONS.slice(1);

  let prevSelectionIdentity: string | null | undefined = undefined;

  $effect(() => {
    const identity = selectionIdentity(editorBridge.selection);

    if (prevSelectionIdentity !== undefined && identity !== prevSelectionIdentity) {
      resetPropertyPseudoState();
    }

    prevSelectionIdentity = identity;
  });
</script>

<section class="state-selector prop-root">
  <button
    type="button"
    class="state-selector-toggle"
    aria-expanded={!propertiesPseudo.collapsed}
    onclick={togglePropertyPseudoCollapsed}
  >
    <span class="state-selector-chevron" aria-hidden="true">
      {propertiesPseudo.collapsed ? "▶" : "▼"}
    </span>
    <span class="state-selector-toggle-label">State</span>
  </button>

  {#if !propertiesPseudo.collapsed}
    <div class="state-selector-body" role="group" aria-label="CSS pseudo-class state">
      <button
        type="button"
        class="state-selector-btn state-selector-btn-default"
        class:active={propertiesPseudo.active === defaultOption.id}
        style:--state-accent={ACCENT_COLOR}
        disabled={!hasBridgeSelection}
        aria-pressed={propertiesPseudo.active === defaultOption.id}
        onclick={() => setPropertyPseudoState(defaultOption.id)}
      >
        {defaultOption.label}
      </button>

      <div class="state-selector-variants">
        {#each variantOptions as option (option.id)}
          <button
            type="button"
            class="state-selector-btn"
            class:active={propertiesPseudo.active === option.id}
            style:--state-accent={ACCENT_COLOR}
            disabled={!hasBridgeSelection}
            aria-pressed={propertiesPseudo.active === option.id}
            onclick={() => setPropertyPseudoState(option.id)}
          >
            {option.label}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</section>
