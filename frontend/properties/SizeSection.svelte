<script lang="ts">
  import "./properties-theme.css";
  import { currentBridgeDlClass, editorBridge } from "$lib/bridge-selection.svelte";
  import LayoutField from "./LayoutField.svelte";
  import PropSearchSelect from "./PropSearchSelect.svelte";
  import { selectionIdentity } from "./property-pseudo-state";
  import PropertySection from "./PropertySection.svelte";
  import AspectRatioInput from "./AspectRatioInput.svelte";
  import SizeDimensionInput from "./SizeDimensionInput.svelte";
  import { getSizeComputedValues } from "./size-computed";
  import { emptySizeDraft, OVERFLOW_OPTIONS, sizeDraftFromComputed } from "./size-fields";

  const hasSelection = $derived(
    currentBridgeDlClass() !== null && editorBridge.selection !== null,
  );

  const selectionKey = $derived(selectionIdentity(editorBridge.selection));

  let draft = $state(emptySizeDraft());

  $effect(() => {
    selectionKey;
    draft = sizeDraftFromComputed(getSizeComputedValues());
  });
</script>

<PropertySection title="Size" startExpanded={true}>
  <div class="prop-stack prop-size-section">
    <div class="prop-size-grid">
      <div class="prop-size-col">
        <SizeDimensionInput label="WIDTH" bind:value={draft.width} disabled={!hasSelection} />
        <SizeDimensionInput label="MIN-WIDTH" bind:value={draft.minWidth} disabled={!hasSelection} />
        <SizeDimensionInput label="MAX-WIDTH" bind:value={draft.maxWidth} disabled={!hasSelection} />
      </div>

      <div class="prop-size-col">
        <SizeDimensionInput label="HEIGHT" bind:value={draft.height} disabled={!hasSelection} />
        <SizeDimensionInput label="MIN-HEIGHT" bind:value={draft.minHeight} disabled={!hasSelection} />
        <SizeDimensionInput label="MAX-HEIGHT" bind:value={draft.maxHeight} disabled={!hasSelection} />
      </div>
    </div>

    <div class="prop-size-grid">
      <LayoutField label="OVERFLOW X">
        <PropSearchSelect
          listboxId="size-overflow-x"
          options={OVERFLOW_OPTIONS}
          bind:value={draft.overflowX}
          disabled={!hasSelection}
          placeholder="Search overflow-x…"
        />
      </LayoutField>

      <LayoutField label="OVERFLOW Y">
        <PropSearchSelect
          listboxId="size-overflow-y"
          options={OVERFLOW_OPTIONS}
          bind:value={draft.overflowY}
          disabled={!hasSelection}
          placeholder="Search overflow-y…"
        />
      </LayoutField>
    </div>

    <div class="prop-size-grid">
      <AspectRatioInput label="RATIO W" bind:value={draft.aspectW} disabled={!hasSelection} />
      <AspectRatioInput label="RATIO H" bind:value={draft.aspectH} disabled={!hasSelection} />
    </div>
  </div>
</PropertySection>
