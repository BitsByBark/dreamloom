<script lang="ts">
  import "./properties-theme.css";
  import { editorBridge } from "$lib/bridge-selection.svelte";
  import { maybeCommitProperty } from "$injector";
  import { startBackgroundImagePick } from "../src/panels/assets/assetStore";
  import LayoutField from "./LayoutField.svelte";
  import PropSelect from "./PropSelect.svelte";
  import { selectionIdentity } from "./property-pseudo-state";
  import PropertySection from "./PropertySection.svelte";
  import BackgroundValueToggle from "./BackgroundValueToggle.svelte";
  import TypographyColorInput from "./TypographyColorInput.svelte";
  import { getBackgroundComputedValues } from "./background-computed";
  import {
    BACKGROUND_ATTACHMENT_OPTIONS,
    BACKGROUND_CLIP_OPTIONS,
    BACKGROUND_ORIGIN_OPTIONS,
    BACKGROUND_POSITION_TOGGLES,
    BACKGROUND_REPEAT_OPTIONS,
    BACKGROUND_SIZE_TOGGLES,
    backgroundDraftFromComputed,
    emptyBackgroundDraft,
  } from "./background-fields";

  const selectionKey = $derived(selectionIdentity(editorBridge.selection));

  let draft = $state(emptyBackgroundDraft());

  $effect(() => {
    selectionKey;
    draft = backgroundDraftFromComputed(getBackgroundComputedValues());
  });

  function chooseBackgroundImage() {
    startBackgroundImagePick((url) => {
      draft.backgroundImage = url;
      maybeCommitProperty("background-image", url);
    });
  }

  function onBackgroundImageInput(event: Event) {
    const next = (event.currentTarget as HTMLInputElement).value;
    maybeCommitProperty("background-image", next);
  }
</script>

<PropertySection title="BACKGROUNDS">
  <div class="prop-stack prop-background-section">
    <div class="prop-size-grid">
      <LayoutField label="BACKGROUND COLOR">
        <TypographyColorInput bind:value={draft.backgroundColor} cssProperty="background-color" />
      </LayoutField>

      <LayoutField label="BACKGROUND IMAGE">
        <div class="prop-image-row">
          <input
            type="text"
            class="prop-input"
            placeholder="url(…)"
            bind:value={draft.backgroundImage}
            oninput={onBackgroundImageInput}
          />
          <button type="button" class="prop-choose-btn" onclick={chooseBackgroundImage}>
            CHOOSE
          </button>
        </div>
      </LayoutField>
    </div>

    <div class="prop-size-grid">
      <LayoutField label="BACKGROUND SIZE">
        <BackgroundValueToggle
          options={BACKGROUND_SIZE_TOGGLES}
          bind:value={draft.backgroundSize}
          ariaLabel="Background size"
          cssProperty="background-size"
        />
      </LayoutField>

      <LayoutField label="BACKGROUND POSITION">
        <BackgroundValueToggle
          options={BACKGROUND_POSITION_TOGGLES}
          bind:value={draft.backgroundPosition}
          ariaLabel="Background position"
          cssProperty="background-position"
        />
      </LayoutField>
    </div>

    <div class="prop-size-grid">
      <LayoutField label="BACKGROUND REPEAT">
        <PropSelect
          options={BACKGROUND_REPEAT_OPTIONS}
          bind:value={draft.backgroundRepeat}
          cssProperty="background-repeat"
        />
      </LayoutField>

      <LayoutField label="BG ATTACHMENT">
        <PropSelect
          options={BACKGROUND_ATTACHMENT_OPTIONS}
          bind:value={draft.backgroundAttachment}
          cssProperty="background-attachment"
        />
      </LayoutField>
    </div>

    <div class="prop-size-grid">
      <LayoutField label="BACKGROUND ORIGIN">
        <PropSelect
          options={BACKGROUND_ORIGIN_OPTIONS}
          bind:value={draft.backgroundOrigin}
          cssProperty="background-origin"
        />
      </LayoutField>

      <LayoutField label="BACKGROUND CLIP">
        <PropSelect
          options={BACKGROUND_CLIP_OPTIONS}
          bind:value={draft.backgroundClip}
          cssProperty="background-clip"
        />
      </LayoutField>
    </div>
  </div>
</PropertySection>

<style>
  .prop-background-section {
    gap: 8px;
  }

  .prop-image-row {
    display: flex;
    align-items: stretch;
    gap: 6px;
    min-width: 0;
  }

  .prop-image-row .prop-input {
    flex: 1;
    min-width: 0;
  }

  .prop-choose-btn {
    flex-shrink: 0;
    padding: var(--prop-control-padding-y) var(--prop-control-padding-x);
    border: 1px solid var(--panel-border);
    background-color: var(--prop-control-bg);
    color: var(--prop-control-color);
    font: inherit;
    font-size: var(--prop-control-font-size);
    letter-spacing: 0.04em;
    cursor: pointer;
  }

  .prop-choose-btn:hover {
    color: var(--prop-control-color-active, #a8a8a8);
    background-color: #1c1c1c;
  }
</style>
