<script lang="ts">
  import "./properties-theme.css";
  import { editorBridge } from "$lib/bridge-selection.svelte";
  import { maybeCommitProperty } from "$injector";
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

  const selectionKey = $derived(selectionIdentity(editorBridge.selection));

  let draft = $state(emptyLayoutDraft());

  $effect(() => {
    selectionKey;
    draft = layoutDraftFromComputed(getLayoutComputedValues());
  });

  const showFlex = $derived(isFlexDisplay(draft.display));
  const showGrid = $derived(isGridDisplay(draft.display));
  const showInsets = $derived(showsPositionOffsets(draft.position));

  function onTextInput(cssProperty: string, event: Event) {
    const next = (event.currentTarget as HTMLInputElement).value;
    maybeCommitProperty(cssProperty, next);
  }
</script>

<PropertySection title="Layout">
  <div class="prop-stack">
    <LayoutField label="DISPLAY">
      <PropSearchSelect
        listboxId="layout-display"
        options={DISPLAY_OPTIONS}
        bind:value={draft.display}
        placeholder="Search display…"
        cssProperty="display"
      />
    </LayoutField>

    {#if showFlex}
      <div class="prop-subsection">
        <LayoutField label="FLEX DIRECTION">
          <PropSearchSelect
            listboxId="layout-flex-direction"
            options={FLEX_DIRECTION_OPTIONS}
            bind:value={draft.flexDirection}
            placeholder="Search flex-direction…"
            cssProperty="flex-direction"
          />
        </LayoutField>

        <LayoutField label="FLEX WRAP">
          <PropSearchSelect
            listboxId="layout-flex-wrap"
            options={FLEX_WRAP_OPTIONS}
            bind:value={draft.flexWrap}
            placeholder="Search flex-wrap…"
            cssProperty="flex-wrap"
          />
        </LayoutField>

        <LayoutField label="JUSTIFY CONTENT">
          <PropSearchSelect
            listboxId="layout-justify-content"
            options={JUSTIFY_CONTENT_OPTIONS}
            bind:value={draft.justifyContent}
            placeholder="Search justify-content…"
            cssProperty="justify-content"
          />
        </LayoutField>

        <LayoutField label="ALIGN ITEMS">
          <PropSearchSelect
            listboxId="layout-align-items"
            options={ALIGN_ITEMS_OPTIONS}
            bind:value={draft.alignItems}
            placeholder="Search align-items…"
            cssProperty="align-items"
          />
        </LayoutField>

        <LayoutField label="ALIGN CONTENT">
          <PropSearchSelect
            listboxId="layout-align-content"
            options={ALIGN_CONTENT_OPTIONS}
            bind:value={draft.alignContent}
            placeholder="Search align-content…"
            cssProperty="align-content"
          />
        </LayoutField>

        <LayoutField label="GAP">
          <input
            type="text"
            class="prop-input"
            bind:value={draft.gap}
            placeholder="—"
            oninput={(e) => onTextInput("gap", e)}
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
            bind:value={draft.gridTemplateColumns}
            placeholder="—"
            oninput={(e) => onTextInput("grid-template-columns", e)}
          />
        </LayoutField>

        <LayoutField label="GRID TEMPLATE ROWS">
          <input
            type="text"
            class="prop-input"
            bind:value={draft.gridTemplateRows}
            placeholder="—"
            oninput={(e) => onTextInput("grid-template-rows", e)}
          />
        </LayoutField>

        <LayoutField label="GAP">
          <input
            type="text"
            class="prop-input"
            bind:value={draft.gap}
            placeholder="—"
            oninput={(e) => onTextInput("gap", e)}
          />
        </LayoutField>

        <LayoutField label="AUTO FLOW">
          <PropSearchSelect
            listboxId="layout-grid-auto-flow"
            options={GRID_AUTO_FLOW_OPTIONS}
            bind:value={draft.gridAutoFlow}
            placeholder="Search auto-flow…"
            cssProperty="grid-auto-flow"
          />
        </LayoutField>
      </div>
    {/if}

    <LayoutField label="POSITION">
      <PropSearchSelect
        listboxId="layout-position"
        options={POSITION_OPTIONS}
        bind:value={draft.position}
        placeholder="Search position…"
        cssProperty="position"
      />
    </LayoutField>

    {#if showInsets}
      <div class="prop-subsection prop-layout-insets">
        <LayoutField label="TOP">
          <input
            type="text"
            class="prop-input"
            bind:value={draft.top}
            placeholder="—"
            oninput={(e) => onTextInput("top", e)}
          />
        </LayoutField>

        <LayoutField label="RIGHT">
          <input
            type="text"
            class="prop-input"
            bind:value={draft.right}
            placeholder="—"
            oninput={(e) => onTextInput("right", e)}
          />
        </LayoutField>

        <LayoutField label="BOTTOM">
          <input
            type="text"
            class="prop-input"
            bind:value={draft.bottom}
            placeholder="—"
            oninput={(e) => onTextInput("bottom", e)}
          />
        </LayoutField>

        <LayoutField label="LEFT">
          <input
            type="text"
            class="prop-input"
            bind:value={draft.left}
            placeholder="—"
            oninput={(e) => onTextInput("left", e)}
          />
        </LayoutField>

        <LayoutField class="prop-field-span" label="Z-INDEX">
          <input
            type="text"
            class="prop-input"
            bind:value={draft.zIndex}
            placeholder="—"
            oninput={(e) => onTextInput("z-index", e)}
          />
        </LayoutField>
      </div>
    {/if}

    <LayoutField label="FLOAT">
      <PropSearchSelect
        listboxId="layout-float"
        options={FLOAT_OPTIONS}
        bind:value={draft.float}
        placeholder="Search float…"
        cssProperty="float"
      />
    </LayoutField>

    <LayoutField label="CLEAR">
      <PropSearchSelect
        listboxId="layout-clear"
        options={CLEAR_OPTIONS}
        bind:value={draft.clear}
        placeholder="Search clear…"
        cssProperty="clear"
      />
    </LayoutField>
  </div>
</PropertySection>
