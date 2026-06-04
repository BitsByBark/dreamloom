<script lang="ts">
  import "./properties-theme.css";
  import { editorBridge } from "$lib/bridge-selection.svelte";
  import BorderDimensionInput from "./BorderDimensionInput.svelte";
  import BorderRadiusDiagram from "./BorderRadiusDiagram.svelte";
  import BorderSideDiagram from "./BorderSideDiagram.svelte";
  import PropSelect from "./PropSelect.svelte";
  import PropertySection from "./PropertySection.svelte";
  import TypographyColorInput from "./TypographyColorInput.svelte";
  import { getBorderComputedValues } from "./border-computed";
  import {
    BORDER_STYLE_OPTIONS,
    BORDER_WIDTH_UNITS,
    borderDraftFromComputed,
    emptyBorderDraft,
    type BorderCorner,
    type BorderDraft,
    type BorderSide,
  } from "./border-fields";
  import { borderDraftKeyToCssProperty, commitDraftPatch } from "$injector";
  import { selectionIdentity } from "./property-pseudo-state";

  const selectionKey = $derived(selectionIdentity(editorBridge.selection));

  let draft = $state<BorderDraft>(emptyBorderDraft());
  let activeSide = $state<BorderSide | null>(null);
  let activeCorner = $state<BorderCorner | null>(null);
  let linkedStyle = $state(true);
  let linkedWidth = $state(true);
  let linkedColor = $state(true);
  let linkedRadius = $state(true);

  $effect(() => {
    selectionKey;
    draft = borderDraftFromComputed(getBorderComputedValues());
    activeSide = null;
    activeCorner = null;
  });

  function patchDraft(patch: Partial<BorderDraft>) {
    draft = { ...draft, ...patch };
    const stringPatch: Record<string, string> = {};
    for (const [key, val] of Object.entries(patch)) {
      if (typeof val === "string") {
        stringPatch[key] = val;
      }
    }
    void commitDraftPatch(stringPatch, borderDraftKeyToCssProperty);
  }
</script>

<PropertySection title="BORDERS">
  <div class="prop-stack prop-borders-section">
    <section class="prop-border-block" aria-labelledby="border-diagram-heading">
      <div class="prop-border-block-head" id="border-diagram-heading">
        <span class="prop-border-block-title">BORDER WIDTH</span>
      </div>
      <BorderSideDiagram
        {draft}
        {activeSide}
        bind:linkedStyle
        bind:linkedWidth
        bind:linkedColor
        onActiveSideChange={(side) => {
          activeSide = side;
          if (side) activeCorner = null;
        }}
        onPatch={patchDraft}
      />
    </section>

    <BorderRadiusDiagram
      {draft}
      {activeCorner}
      bind:linkedRadius
      onActiveCornerChange={(corner) => {
        activeCorner = corner;
        if (corner) activeSide = null;
      }}
      onPatch={patchDraft}
    />

    <section class="prop-border-block" aria-labelledby="outline-heading">
      <div class="prop-border-block-head" id="outline-heading">
        <span class="prop-border-block-title">OUTLINE</span>
      </div>
      <div class="prop-outline-row">
        <PropSelect
          options={BORDER_STYLE_OPTIONS}
          bind:value={draft.outlineStyle}
          cssProperty="outline-style"
        />
        <BorderDimensionInput
          bind:value={draft.outlineWidth}
          units={BORDER_WIDTH_UNITS}
          defaultUnit="px"
          listboxId="outline-width"
          cssProperty="outline-width"
        />
        <TypographyColorInput bind:value={draft.outlineColor} cssProperty="outline-color" />
      </div>
    </section>
  </div>
</PropertySection>
