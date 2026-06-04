<script lang="ts">
  import "./properties-theme.css";
  import { currentBridgeDlClass, editorBridge } from "$lib/bridge-selection.svelte";
  import { getLayoutComputedValues } from "./layout-computed";
  import {
    ALIGN_CONTENT_OPTIONS,
    ALIGN_ITEMS_OPTIONS,
    CLEAR_OPTIONS,
    DISPLAY_OPTIONS,
    emptyLayoutDraft,
    FLEX_DIRECTION_OPTIONS,
    FLEX_WRAP_OPTIONS,
    FLOAT_OPTIONS,
    GRID_AUTO_FLOW_OPTIONS,
    isFlexDisplay,
    isGridDisplay,
    JUSTIFY_CONTENT_OPTIONS,
    layoutDraftFromComputed,
    POSITION_OPTIONS,
    showsPositionOffsets,
  } from "./layout-fields";
  import LayoutField from "./LayoutField.svelte";
  import PropSearchSelect from "./PropSearchSelect.svelte";
  import { selectionIdentity } from "./property-pseudo-state";
  import PropertySection from "./PropertySection.svelte";

  const hasSelection = $derived(
    currentBridgeDlClass() !== null && editorBridge.selection !== null,
  );

  const selectionKey = $derived(selectionIdentity(editorBridge.selection));

  let draft = $state(emptyLayoutDraft());

  $effect(() => {
    selectionKey;
    draft = layoutDraftFromComputed(getLayoutComputedValues());
  });

  const showFlex = $derived(isFlexDisplay(draft.display));
  const showGrid = $derived(isGridDisplay(draft.display));
  const showInsets = $derived(showsPositionOffsets(draft.position));
</script>

<PropertySection title="Layout" startExpanded={true}>
  <div class="prop-stack">
    <LayoutField label="DISPLAY">
      <PropSearchSelect
        listboxId="layout-display"
        options={DISPLAY_OPTIONS}
        bind:value={draft.display}
        disabled={!hasSelection}
        placeholder="Search display…"
      />
    </LayoutField>

    {#if showFlex}
      <div class="prop-subsection">
        <LayoutField label="FLEX DIRECTION">
          <PropSearchSelect
            listboxId="layout-flex-direction"
            options={FLEX_DIRECTION_OPTIONS}
            bind:value={draft.flexDirection}
            disabled={!hasSelection}
            placeholder="Search flex-direction…"
          />
        </LayoutField>

        <LayoutField label="FLEX WRAP">
          <PropSearchSelect
            listboxId="layout-flex-wrap"
            options={FLEX_WRAP_OPTIONS}
            bind:value={draft.flexWrap}
            disabled={!hasSelection}
            placeholder="Search flex-wrap…"
          />
        </LayoutField>

        <LayoutField label="JUSTIFY CONTENT">
          <PropSearchSelect
            listboxId="layout-justify-content"
            options={JUSTIFY_CONTENT_OPTIONS}
            bind:value={draft.justifyContent}
            disabled={!hasSelection}
            placeholder="Search justify-content…"
          />
        </LayoutField>

        <LayoutField label="ALIGN ITEMS">
          <PropSearchSelect
            listboxId="layout-align-items"
            options={ALIGN_ITEMS_OPTIONS}
            bind:value={draft.alignItems}
            disabled={!hasSelection}
            placeholder="Search align-items…"
          />
        </LayoutField>

        <LayoutField label="ALIGN CONTENT">
          <PropSearchSelect
            listboxId="layout-align-content"
            options={ALIGN_CONTENT_OPTIONS}
            bind:value={draft.alignContent}
            disabled={!hasSelection}
            placeholder="Search align-content…"
          />
        </LayoutField>

        <LayoutField label="GAP">
          <input
            type="text"
            class="prop-input"
            disabled={!hasSelection}
            bind:value={draft.gap}
            placeholder="—"
          />
        </LayoutField>
      </div>
    {/if}

    {#if showGrid}
      <div class="prop-subsection">
        <LayoutField label="GRID TEMPLATE COLUMNS">
          <input
            type="text"
            class="prop-input"
            disabled={!hasSelection}
            bind:value={draft.gridTemplateColumns}
            placeholder="—"
          />
        </LayoutField>

        <LayoutField label="GRID TEMPLATE ROWS">
          <input
            type="text"
            class="prop-input"
            disabled={!hasSelection}
            bind:value={draft.gridTemplateRows}
            placeholder="—"
          />
        </LayoutField>

        <LayoutField label="GAP">
          <input
            type="text"
            class="prop-input"
            disabled={!hasSelection}
            bind:value={draft.gap}
            placeholder="—"
          />
        </LayoutField>

        <LayoutField label="AUTO FLOW">
          <PropSearchSelect
            listboxId="layout-grid-auto-flow"
            options={GRID_AUTO_FLOW_OPTIONS}
            bind:value={draft.gridAutoFlow}
            disabled={!hasSelection}
            placeholder="Search auto-flow…"
          />
        </LayoutField>
      </div>
    {/if}

    <LayoutField label="POSITION">
      <PropSearchSelect
        listboxId="layout-position"
        options={POSITION_OPTIONS}
        bind:value={draft.position}
        disabled={!hasSelection}
        placeholder="Search position…"
      />
    </LayoutField>

    {#if showInsets}
      <div class="prop-subsection prop-layout-insets">
        <LayoutField label="TOP">
          <input
            type="text"
            class="prop-input"
            disabled={!hasSelection}
            bind:value={draft.top}
            placeholder="—"
          />
        </LayoutField>

        <LayoutField label="RIGHT">
          <input
            type="text"
            class="prop-input"
            disabled={!hasSelection}
            bind:value={draft.right}
            placeholder="—"
          />
        </LayoutField>

        <LayoutField label="BOTTOM">
          <input
            type="text"
            class="prop-input"
            disabled={!hasSelection}
            bind:value={draft.bottom}
            placeholder="—"
          />
        </LayoutField>

        <LayoutField label="LEFT">
          <input
            type="text"
            class="prop-input"
            disabled={!hasSelection}
            bind:value={draft.left}
            placeholder="—"
          />
        </LayoutField>

        <LayoutField class="prop-field-span" label="Z-INDEX">
          <input
            type="text"
            class="prop-input"
            disabled={!hasSelection}
            bind:value={draft.zIndex}
            placeholder="—"
          />
        </LayoutField>
      </div>
    {/if}

    <LayoutField label="FLOAT">
      <PropSearchSelect
        listboxId="layout-float"
        options={FLOAT_OPTIONS}
        bind:value={draft.float}
        disabled={!hasSelection}
        placeholder="Search float…"
      />
    </LayoutField>

    <LayoutField label="CLEAR">
      <PropSearchSelect
        listboxId="layout-clear"
        options={CLEAR_OPTIONS}
        bind:value={draft.clear}
        disabled={!hasSelection}
        placeholder="Search clear…"
      />
    </LayoutField>
  </div>
</PropertySection>
