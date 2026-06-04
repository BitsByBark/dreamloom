<script lang="ts">
  import "./properties-theme.css";
  import { currentBridgeDlClass, editorBridge } from "$lib/bridge-selection.svelte";
  import LayoutField from "./LayoutField.svelte";
  import PropSearchSelect from "./PropSearchSelect.svelte";
  import { selectionIdentity } from "./property-pseudo-state";
  import PropertySection from "./PropertySection.svelte";
  import TypographyDimensionInput from "./TypographyDimensionInput.svelte";
  import { getTypographyComputedValues } from "./typography-computed";
  import {
    emptyTypographyDraft,
    FONT_SIZE_UNITS,
    FONT_STYLE_OPTIONS,
    FONT_VARIANT_OPTIONS,
    FONT_WEIGHT_OPTIONS,
    LETTER_SPACING_UNITS,
    LINE_HEIGHT_UNITS,
    TEXT_ALIGN_OPTIONS,
    TEXT_DECORATION_OPTIONS,
    TEXT_TRANSFORM_OPTIONS,
    typographyDraftFromComputed,
    WHITE_SPACE_OPTIONS,
    WORD_BREAK_OPTIONS,
  } from "./typography-fields";

  const LINE_HEIGHT_KEYWORDS = new Set(["normal"]);

  const hasSelection = $derived(
    currentBridgeDlClass() !== null && editorBridge.selection !== null,
  );

  const selectionKey = $derived(selectionIdentity(editorBridge.selection));

  let draft = $state(emptyTypographyDraft());

  $effect(() => {
    selectionKey;
    draft = typographyDraftFromComputed(getTypographyComputedValues());
  });

  function onColorInput(event: Event) {
    const el = event.currentTarget as HTMLInputElement;
    draft.color = el.value;
  }
</script>

<PropertySection title="Typography" startExpanded={true}>
  <div class="prop-stack prop-typography-section">
    <LayoutField label="FONT FAMILY">
      <input
        type="text"
        class="prop-input"
        placeholder="—"
        bind:value={draft.fontFamily}
        disabled={!hasSelection}
      />
    </LayoutField>

    <div class="prop-size-grid">
      <TypographyDimensionInput
        label="FONT SIZE"
        bind:value={draft.fontSize}
        units={FONT_SIZE_UNITS}
        defaultUnit="px"
        disabled={!hasSelection}
      />

      <LayoutField label="FONT WEIGHT">
        <PropSearchSelect
          listboxId="typography-font-weight"
          options={FONT_WEIGHT_OPTIONS}
          bind:value={draft.fontWeight}
          disabled={!hasSelection}
          placeholder="Search font-weight…"
        />
      </LayoutField>
    </div>

    <div class="prop-size-grid">
      <LayoutField label="FONT STYLE">
        <PropSearchSelect
          listboxId="typography-font-style"
          options={FONT_STYLE_OPTIONS}
          bind:value={draft.fontStyle}
          disabled={!hasSelection}
          placeholder="Search font-style…"
        />
      </LayoutField>

      <LayoutField label="FONT VARIANT">
        <PropSearchSelect
          listboxId="typography-font-variant"
          options={FONT_VARIANT_OPTIONS}
          bind:value={draft.fontVariant}
          disabled={!hasSelection}
          placeholder="Search font-variant…"
        />
      </LayoutField>
    </div>

    <div class="prop-size-grid">
      <TypographyDimensionInput
        label="LINE HEIGHT"
        bind:value={draft.lineHeight}
        units={LINE_HEIGHT_UNITS}
        keywordUnits={LINE_HEIGHT_KEYWORDS}
        defaultUnit="px"
        disabled={!hasSelection}
      />

      <TypographyDimensionInput
        label="LETTER SPACING"
        bind:value={draft.letterSpacing}
        units={LETTER_SPACING_UNITS}
        defaultUnit="px"
        disabled={!hasSelection}
      />
    </div>

    <LayoutField label="TEXT ALIGN">
      <PropSearchSelect
        listboxId="typography-text-align"
        options={TEXT_ALIGN_OPTIONS}
        bind:value={draft.textAlign}
        disabled={!hasSelection}
        placeholder="Search text-align…"
      />
    </LayoutField>

    <LayoutField label="TEXT DECORATION">
      <PropSearchSelect
        listboxId="typography-text-decoration"
        options={TEXT_DECORATION_OPTIONS}
        bind:value={draft.textDecoration}
        disabled={!hasSelection}
        placeholder="Search text-decoration…"
      />
    </LayoutField>

    <LayoutField label="TEXT TRANSFORM">
      <PropSearchSelect
        listboxId="typography-text-transform"
        options={TEXT_TRANSFORM_OPTIONS}
        bind:value={draft.textTransform}
        disabled={!hasSelection}
        placeholder="Search text-transform…"
      />
    </LayoutField>

    <LayoutField label="COLOR">
      <input
        type="color"
        class="prop-input prop-color-input"
        value={draft.color || "#808080"}
        disabled={!hasSelection}
        oninput={onColorInput}
      />
    </LayoutField>

    <LayoutField label="WORD BREAK">
      <PropSearchSelect
        listboxId="typography-word-break"
        options={WORD_BREAK_OPTIONS}
        bind:value={draft.wordBreak}
        disabled={!hasSelection}
        placeholder="Search word-break…"
      />
    </LayoutField>

    <LayoutField label="WHITE SPACE">
      <PropSearchSelect
        listboxId="typography-white-space"
        options={WHITE_SPACE_OPTIONS}
        bind:value={draft.whiteSpace}
        disabled={!hasSelection}
        placeholder="Search white-space…"
      />
    </LayoutField>

    <LayoutField label="TEXT SHADOW">
      <input
        type="text"
        class="prop-input"
        placeholder="—"
        bind:value={draft.textShadow}
        disabled={!hasSelection}
      />
    </LayoutField>
  </div>
</PropertySection>

<style>
  .prop-typography-section {
    gap: 8px;
  }

  .prop-color-input {
    box-sizing: border-box;
    min-height: var(--prop-control-min-height, 1.85em);
    padding: 0.2em;
    cursor: pointer;
  }

  .prop-color-input:disabled {
    cursor: not-allowed;
  }
</style>
