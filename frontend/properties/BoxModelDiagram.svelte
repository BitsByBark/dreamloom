<script lang="ts">
  import "./properties-theme.css";
  import PropUnitSelect from "./PropUnitSelect.svelte";
  import {
    composeSpacingValue,
    formatSpacingDisplay,
    parseSpacingValue,
    spacingFieldKey,
    SPACING_UNITS,
    type SpacingDraft,
    type SpacingEditTarget,
    type SpacingFieldKey,
    type SpacingLayer,
    type SpacingSide,
    type SpacingUnit,
  } from "./spacing-fields";

  type Props = {
    draft: SpacingDraft;
    disabled?: boolean;
    onDraftChange: (key: SpacingFieldKey, value: string) => void;
  };

  let { draft, disabled = false, onDraftChange }: Props = $props();

  let editing = $state<SpacingEditTarget | null>(null);
  let editAmount = $state("");
  let editUnit = $state<SpacingUnit>("px");

  function valueFor(layer: SpacingLayer, side: SpacingSide): string {
    return draft[spacingFieldKey(layer, side)];
  }

  function isEditing(layer: SpacingLayer, side: SpacingSide): boolean {
    return editing?.layer === layer && editing?.side === side;
  }

  function liveLabel(layer: SpacingLayer, side: SpacingSide): string {
    if (isEditing(layer, side)) {
      return formatSpacingDisplay(composeSpacingValue(editAmount, editUnit));
    }
    return formatSpacingDisplay(valueFor(layer, side));
  }

  function startEdit(layer: SpacingLayer, side: SpacingSide) {
    if (disabled) {
      return;
    }
    const parsed = parseSpacingValue(valueFor(layer, side));
    editing = { layer, side };
    editAmount = parsed.amount;
    editUnit = parsed.unit;
  }

  function commitEdit() {
    if (!editing) {
      return;
    }
    onDraftChange(spacingFieldKey(editing.layer, editing.side), composeSpacingValue(editAmount, editUnit));
    editing = null;
  }

  function cancelEdit() {
    editing = null;
  }

  function onEditorKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitEdit();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancelEdit();
    }
  }

  function onUnitChange() {
    if (editUnit === "auto") {
      editAmount = "";
    }
  }
</script>

{#snippet sideControl(layer: SpacingLayer, side: SpacingSide)}
  {#if isEditing(layer, side)}
    <div class="box-value-editor">
      <input
        type="text"
        class="box-value-input"
        inputmode="decimal"
        bind:value={editAmount}
        disabled={editUnit === "auto"}
        aria-label="{layer} {side}"
        onkeydown={onEditorKeydown}
        onblur={commitEdit}
      />
      <PropUnitSelect
        options={SPACING_UNITS}
        bind:value={editUnit}
        listboxId="spacing-{layer}-{side}-unit"
        onchange={onUnitChange}
      />
    </div>
  {:else}
    <button
      type="button"
      class="box-value-btn"
      {disabled}
      onclick={() => startEdit(layer, side)}
    >
      {liveLabel(layer, side)}
    </button>
  {/if}
{/snippet}

<div class="box-model" class:box-model-disabled={disabled}>
  <div class="box-margin" aria-label="Parent">
    <div class="box-margin-labels">
      <span class="box-ring-label box-ring-label-parent">PARENT</span>
      <span class="box-ring-label box-ring-label-margin">MARGIN</span>
    </div>

    <div class="box-edge box-edge-top">
      {@render sideControl("margin", "top")}
    </div>

    <div class="box-margin-middle">
      <div class="box-edge box-edge-side">
        {@render sideControl("margin", "left")}
      </div>

      <div class="box-padding" aria-label="Element">
        <span class="box-ring-label box-ring-label-element">ELEMENT</span>

        <div class="box-edge box-edge-top">
          {@render sideControl("padding", "top")}
        </div>

        <div class="box-padding-middle">
          <div class="box-edge box-edge-side">
            {@render sideControl("padding", "left")}
          </div>

          <div class="box-element-wrap">
            <div class="box-element">
              <span class="box-element-label">CHILD</span>
            </div>
            <span class="box-ring-label box-ring-label-padding">PADDING</span>
          </div>

          <div class="box-edge box-edge-side">
            {@render sideControl("padding", "right")}
          </div>
        </div>

        <div class="box-edge box-edge-top">
          {@render sideControl("padding", "bottom")}
        </div>
      </div>

      <div class="box-edge box-edge-side">
        {@render sideControl("margin", "right")}
      </div>
    </div>

    <div class="box-edge box-edge-top">
      {@render sideControl("margin", "bottom")}
    </div>
  </div>
</div>
