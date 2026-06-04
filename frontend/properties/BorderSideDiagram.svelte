<script lang="ts">
  import "./properties-theme.css";
  import { ACCENT_COLOR } from "$settings/storage";
  import BorderDimensionInput from "./BorderDimensionInput.svelte";
  import BorderLinkToggle from "./BorderLinkToggle.svelte";
  import PropSelect from "./PropSelect.svelte";
  import TypographyColorInput from "./TypographyColorInput.svelte";
  import {
    BORDER_SIDES,
    BORDER_STYLE_OPTIONS,
    BORDER_WIDTH_UNITS,
    type BorderDraft,
    type BorderSide,
  } from "./border-fields";

  type Props = {
    draft: BorderDraft;
    activeSide: BorderSide | null;
    linkedStyle?: boolean;
    linkedWidth?: boolean;
    linkedColor?: boolean;
    onActiveSideChange: (side: BorderSide | null) => void;
    onPatch: (patch: Partial<BorderDraft>) => void;
  };

  let {
    draft,
    activeSide,
    linkedStyle = $bindable(false),
    linkedWidth = $bindable(false),
    linkedColor = $bindable(false),
    onActiveSideChange,
    onPatch,
  }: Props = $props();

  let rootEl: HTMLDivElement | undefined = $state();

  const activeMeta = $derived(BORDER_SIDES.find((s) => s.key === activeSide) ?? null);

  const STYLE_KEYS = ["styleTop", "styleRight", "styleBottom", "styleLeft"] as const;
  const WIDTH_KEYS = ["widthTop", "widthRight", "widthBottom", "widthLeft"] as const;
  const COLOR_KEYS = ["colorTop", "colorRight", "colorBottom", "colorLeft"] as const;

  function toggleSide(side: BorderSide) {
    onActiveSideChange(activeSide === side ? null : side);
  }

  function setLinked(
    keys: readonly (keyof BorderDraft)[],
    value: string,
    linked: boolean,
    sourceKey: keyof BorderDraft,
  ) {
    if (linked) {
      const patch: Partial<BorderDraft> = {};
      for (const key of keys) {
        patch[key] = value;
      }
      onPatch(patch);
      return;
    }
    onPatch({ [sourceKey]: value });
  }

  function onStyleChange(value: string) {
    if (!activeMeta) return;
    setLinked(STYLE_KEYS, value, linkedStyle, activeMeta.styleKey);
  }

  function onWidthChange(value: string) {
    if (!activeMeta) return;
    setLinked(WIDTH_KEYS, value, linkedWidth, activeMeta.widthKey);
  }

  function onColorChange(value: string) {
    if (!activeMeta) return;
    setLinked(COLOR_KEYS, value, linkedColor, activeMeta.colorKey);
  }

  $effect(() => {
    if (!activeSide) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (target && rootEl?.contains(target)) return;
      onActiveSideChange(null);
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  });
</script>

<div class="border-diagram-column">
  <div class="border-diagram-wrap" bind:this={rootEl} style:--border-accent={ACCENT_COLOR}>
    <div class="border-diagram">
      <button
        type="button"
        class="border-side-hit border-side-top"
        class:active={activeSide === "top"}
        aria-pressed={activeSide === "top"}
        aria-label="Edit top border"
        onclick={() => toggleSide("top")}
      ></button>

      <div class="border-diagram-middle">
        <button
          type="button"
          class="border-side-hit border-side-left"
          class:active={activeSide === "left"}
          aria-pressed={activeSide === "left"}
          aria-label="Edit left border"
          onclick={() => toggleSide("left")}
        ></button>

        <div class="border-diagram-element" aria-hidden="true">ELEMENT</div>

        <button
          type="button"
          class="border-side-hit border-side-right"
          class:active={activeSide === "right"}
          aria-pressed={activeSide === "right"}
          aria-label="Edit right border"
          onclick={() => toggleSide("right")}
        ></button>
      </div>

      <button
        type="button"
        class="border-side-hit border-side-bottom"
        class:active={activeSide === "bottom"}
        aria-pressed={activeSide === "bottom"}
        aria-label="Edit bottom border"
        onclick={() => toggleSide("bottom")}
      ></button>

      {#if activeSide && activeMeta}
        <div class="border-popover border-popover-side border-popover-{activeSide}" role="dialog">
          <span class="border-popover-title">{activeMeta.label}</span>
          <div class="border-popover-fields">
            <label class="border-popover-field">
              <span class="border-popover-label">Style</span>
              <PropSelect
                options={BORDER_STYLE_OPTIONS}
                value={draft[activeMeta.styleKey]}
                allowEmpty={false}
                onValueChange={onStyleChange}
              />
            </label>
            <label class="border-popover-field">
              <span class="border-popover-label">Width</span>
              <BorderDimensionInput
                value={draft[activeMeta.widthKey]}
                units={BORDER_WIDTH_UNITS}
                defaultUnit="px"
                listboxId={`border-side-width-${activeSide}`}
                onValueChange={onWidthChange}
              />
            </label>
            <label class="border-popover-field">
              <span class="border-popover-label">Color</span>
              <TypographyColorInput
                value={draft[activeMeta.colorKey]}
                onValueChange={onColorChange}
              />
            </label>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <div class="border-diagram-links" aria-label="Border link toggles">
    <BorderLinkToggle
      bind:linked={linkedStyle}
      toggleLabel="STYLE"
      label="Link border style on all sides"
    />
    <BorderLinkToggle
      bind:linked={linkedWidth}
      toggleLabel="WIDTH"
      label="Link border width on all sides"
    />
    <BorderLinkToggle
      bind:linked={linkedColor}
      toggleLabel="COLOR"
      label="Link border color on all sides"
    />
  </div>
</div>
