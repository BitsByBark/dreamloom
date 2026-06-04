<script lang="ts">
  import "./properties-theme.css";
  import { editorBridge } from "$lib/bridge-selection.svelte";
  import LayoutField from "./LayoutField.svelte";
  import PropSearchSelect from "./PropSearchSelect.svelte";
  import { selectionIdentity } from "./property-pseudo-state";
  import PropertySection from "./PropertySection.svelte";
  import AspectRatioInput from "./AspectRatioInput.svelte";
  import SizeDimensionInput from "./SizeDimensionInput.svelte";
  import { getSizeComputedValues } from "./size-computed";
  import { commitPropertyChange } from "$injector";
  import {
    composeAspectRatio,
    emptySizeDraft,
    OVERFLOW_OPTIONS,
    sizeDraftFromComputed,
  } from "./size-fields";

  function commitAspectRatio() {
    void commitPropertyChange("aspect-ratio", composeAspectRatio(draft.aspectW, draft.aspectH));
  }

  const selectionKey = $derived(selectionIdentity(editorBridge.selection));

  let draft = $state(emptySizeDraft());

  $effect(() => {
    selectionKey;
    draft = sizeDraftFromComputed(getSizeComputedValues());
  });
</script>

<PropertySection title="Size">
  <div class="prop-stack prop-size-section">
    <div class="prop-size-grid">
      <div class="prop-size-col">
        <SizeDimensionInput label="WIDTH" bind:value={draft.width} cssProperty="width" />
        <SizeDimensionInput label="MIN-WIDTH" bind:value={draft.minWidth} cssProperty="min-width" />
        <SizeDimensionInput label="MAX-WIDTH" bind:value={draft.maxWidth} cssProperty="max-width" />
      </div>

      <div class="prop-size-col">
        <SizeDimensionInput label="HEIGHT" bind:value={draft.height} cssProperty="height" />
        <SizeDimensionInput
          label="MIN-HEIGHT"
          bind:value={draft.minHeight}
          cssProperty="min-height"
        />
        <SizeDimensionInput
          label="MAX-HEIGHT"
          bind:value={draft.maxHeight}
          cssProperty="max-height"
        />
      </div>
    </div>

    <div class="prop-size-grid">
      <LayoutField label="OVERFLOW X">
        <PropSearchSelect
          listboxId="size-overflow-x"
          options={OVERFLOW_OPTIONS}
          bind:value={draft.overflowX}
          placeholder="Search overflow-x…"
          cssProperty="overflow-x"
        />
      </LayoutField>

      <LayoutField label="OVERFLOW Y">
        <PropSearchSelect
          listboxId="size-overflow-y"
          options={OVERFLOW_OPTIONS}
          bind:value={draft.overflowY}
          placeholder="Search overflow-y…"
          cssProperty="overflow-y"
        />
      </LayoutField>
    </div>

    <div class="prop-size-grid">
      <AspectRatioInput label="RATIO W" bind:value={draft.aspectW} onCommit={commitAspectRatio} />
      <AspectRatioInput label="RATIO H" bind:value={draft.aspectH} onCommit={commitAspectRatio} />
    </div>
  </div>
</PropertySection>
