<script lang="ts">
  import "./properties-theme.css";
  import { ACCENT_COLOR } from "$settings/storage";
  import BorderDimensionInput from "./BorderDimensionInput.svelte";
  import BorderLinkToggle from "./BorderLinkToggle.svelte";
  import {
    BORDER_CORNERS,
    BORDER_RADIUS_UNITS,
    type BorderCorner,
    type BorderDraft,
  } from "./border-fields";

  type Props = {
    draft: BorderDraft;
    activeCorner: BorderCorner | null;
    linkedRadius?: boolean;
    onActiveCornerChange: (corner: BorderCorner | null) => void;
    onPatch: (patch: Partial<BorderDraft>) => void;
  };

  let {
    draft,
    activeCorner,
    linkedRadius = $bindable(false),
    onActiveCornerChange,
    onPatch,
  }: Props = $props();

  let rootEl: HTMLDivElement | undefined = $state();

  const activeMeta = $derived(BORDER_CORNERS.find((c) => c.key === activeCorner) ?? null);

  const RADIUS_KEYS = [
    "radiusTopLeft",
    "radiusTopRight",
    "radiusBottomRight",
    "radiusBottomLeft",
  ] as const;

  function toggleCorner(corner: BorderCorner) {
    onActiveCornerChange(activeCorner === corner ? null : corner);
  }

  function onRadiusChange(value: string) {
    if (!activeMeta) return;
    if (linkedRadius) {
      const patch: Partial<BorderDraft> = {};
      for (const key of RADIUS_KEYS) {
        patch[key] = value;
      }
      onPatch(patch);
      return;
    }
    onPatch({ [activeMeta.draftKey]: value });
  }

  $effect(() => {
    if (!activeCorner) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (target && rootEl?.contains(target)) return;
      onActiveCornerChange(null);
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  });
</script>

<div class="border-radius-block">
  <div class="prop-border-block-head">
    <span class="prop-border-block-title">BORDER RADIUS</span>
  </div>

  <div class="border-diagram-column">
    <div class="border-diagram-wrap" bind:this={rootEl} style:--border-accent={ACCENT_COLOR}>
      <div class="border-radius-diagram">
        <div class="border-radius-box">
      <span class="border-radius-element-label" aria-hidden="true">ELEMENT</span>

      {#each BORDER_CORNERS as corner (corner.key)}
        <button
          type="button"
          class="border-corner-hit border-corner-{corner.hitClass}"
          class:active={activeCorner === corner.key}
          aria-pressed={activeCorner === corner.key}
          aria-label="Edit {corner.label} corner radius"
          onclick={() => toggleCorner(corner.key)}
        >
          <span class="border-corner-mark" aria-hidden="true"></span>
        </button>
      {/each}
    </div>

        {#if activeCorner && activeMeta}
          <div
            class="border-popover border-popover-corner border-popover-corner-{activeMeta.popoverClass}"
            role="dialog"
          >
            <span class="border-popover-title">{activeMeta.label}</span>
            <label class="border-popover-field">
              <span class="border-popover-label">Radius</span>
              <BorderDimensionInput
                value={draft[activeMeta.draftKey]}
                units={BORDER_RADIUS_UNITS}
                defaultUnit="px"
                listboxId={`border-radius-${activeCorner}`}
                onValueChange={onRadiusChange}
              />
            </label>
          </div>
        {/if}
      </div>
    </div>

  <div class="border-diagram-links" aria-label="Border radius link toggle">
    <BorderLinkToggle
      bind:linked={linkedRadius}
      toggleLabel="RADIUS"
      label="Link border radius on all corners"
    />
  </div>
  </div>
</div>
