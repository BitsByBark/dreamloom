<script lang="ts">
  import "./properties-theme.css";
  import { editorBridge } from "$lib/bridge-selection.svelte";
  import { maybeCommitProperty } from "$injector";
  import LayoutField from "./LayoutField.svelte";
  import PropSearchSelect from "./PropSearchSelect.svelte";
  import { selectionIdentity } from "./property-pseudo-state";
  import PropertySection from "./PropertySection.svelte";
  import FontStyleToggle from "./FontStyleToggle.svelte";
  import FontVariantToggle from "./FontVariantToggle.svelte";
  import TextAlignToggle from "./TextAlignToggle.svelte";
  import TextDecorationToggle from "./TextDecorationToggle.svelte";
  import TextTransformToggle from "./TextTransformToggle.svelte";
  import WhiteSpaceToggle from "./WhiteSpaceToggle.svelte";
  import WordBreakToggle from "./WordBreakToggle.svelte";
  import TypographyColorInput from "./TypographyColorInput.svelte";
  import TypographyDimensionInput from "./TypographyDimensionInput.svelte";
  import { getTypographyComputedValues } from "./typography-computed";
  import {
    emptyTypographyDraft,
    FONT_SIZE_UNITS,
    FONT_WEIGHT_OPTIONS,
    LETTER_SPACING_UNITS,
    LINE_HEIGHT_UNITS,
    typographyDraftFromComputed,
  } from "./typography-fields";

  const LINE_HEIGHT_KEYWORDS = new Set(["normal"]);

  const selectionKey = $derived(selectionIdentity(editorBridge.selection));

  let draft = $state(emptyTypographyDraft());

  $effect(() => {
    selectionKey;
    draft = typographyDraftFromComputed(getTypographyComputedValues());
  });

  function onTextInput(cssProperty: string, event: Event) {
    const next = (event.currentTarget as HTMLInputElement).value;
    maybeCommitProperty(cssProperty, next);
  }
</script>

<PropertySection title="Typography">
  <div class="prop-stack prop-typography-section">
    <LayoutField label="FONT FAMILY">
      <input
        type="text"
        class="prop-input"
        placeholder="—"
        bind:value={draft.fontFamily}
        oninput={(e) => onTextInput("font-family", e)}
      />
    </LayoutField>

    <div class="prop-size-grid">
      <TypographyDimensionInput
        label="FONT SIZE"
        bind:value={draft.fontSize}
        units={FONT_SIZE_UNITS}
        defaultUnit="px"
        cssProperty="font-size"
      />

      <LayoutField label="FONT WEIGHT">
        <PropSearchSelect
          listboxId="typography-font-weight"
          options={FONT_WEIGHT_OPTIONS}
          bind:value={draft.fontWeight}
          placeholder="Search font-weight…"
          cssProperty="font-weight"
        />
      </LayoutField>
    </div>

    <div class="prop-size-grid">
      <LayoutField label="FONT STYLE">
        <FontStyleToggle bind:value={draft.fontStyle} cssProperty="font-style" />
      </LayoutField>

      <LayoutField label="FONT VARIANT">
        <FontVariantToggle bind:value={draft.fontVariant} cssProperty="font-variant" />
      </LayoutField>
    </div>

    <div class="prop-size-grid">
      <LayoutField label="COLOR">
        <TypographyColorInput bind:value={draft.color} cssProperty="color" />
      </LayoutField>

      <LayoutField label="TEXT SHADOW">
        <input
          type="text"
          class="prop-input"
          placeholder="—"
          bind:value={draft.textShadow}
          oninput={(e) => onTextInput("text-shadow", e)}
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
        cssProperty="line-height"
      />

      <TypographyDimensionInput
        label="LETTER SPACING"
        bind:value={draft.letterSpacing}
        units={LETTER_SPACING_UNITS}
        defaultUnit="px"
        cssProperty="letter-spacing"
      />
    </div>

    <div class="prop-size-grid">
      <LayoutField label="TEXT ALIGN">
        <TextAlignToggle bind:value={draft.textAlign} cssProperty="text-align" />
      </LayoutField>

      <LayoutField label="TEXT DECORATION">
        <TextDecorationToggle bind:value={draft.textDecoration} cssProperty="text-decoration" />
      </LayoutField>
    </div>

    <div class="prop-size-grid">
      <LayoutField label="TEXT TRANSFORM">
        <TextTransformToggle bind:value={draft.textTransform} cssProperty="text-transform" />
      </LayoutField>

      <LayoutField label="WORD BREAK">
        <WordBreakToggle bind:value={draft.wordBreak} cssProperty="word-break" />
      </LayoutField>
    </div>

    <LayoutField label="WHITE SPACE">
      <WhiteSpaceToggle bind:value={draft.whiteSpace} cssProperty="white-space" />
    </LayoutField>
  </div>
</PropertySection>

<style>
  .prop-typography-section {
    gap: 8px;
  }
</style>
