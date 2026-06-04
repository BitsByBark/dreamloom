import { getActiveCssProperties } from "./element-styles.svelte";
import type { BackgroundComputedValues } from "./background-fields";
import type { BorderComputedValues } from "./border-fields";
import type { LayoutComputedValues } from "./layout-fields";
import type { SizeComputedValues } from "./size-fields";
import type { SpacingComputedValues } from "./spacing-fields";
import type { TypographyComputedValues } from "./typography-fields";

function pick(name: string): string | undefined {
  const value = getActiveCssProperties()[name];
  return value?.trim() ? value : undefined;
}

export function layoutComputedFromElementStyles(): LayoutComputedValues {
  return {
    display: pick("display"),
    flexDirection: pick("flex-direction"),
    flexWrap: pick("flex-wrap"),
    justifyContent: pick("justify-content"),
    alignItems: pick("align-items"),
    alignContent: pick("align-content"),
    gap: pick("gap"),
    gridTemplateColumns: pick("grid-template-columns"),
    gridTemplateRows: pick("grid-template-rows"),
    gridAutoFlow: pick("grid-auto-flow"),
    position: pick("position"),
    top: pick("top"),
    right: pick("right"),
    bottom: pick("bottom"),
    left: pick("left"),
    zIndex: pick("z-index"),
    float: pick("float"),
    clear: pick("clear"),
  };
}

export function spacingComputedFromElementStyles(): SpacingComputedValues {
  return {
    marginTop: pick("margin-top"),
    marginRight: pick("margin-right"),
    marginBottom: pick("margin-bottom"),
    marginLeft: pick("margin-left"),
    paddingTop: pick("padding-top"),
    paddingRight: pick("padding-right"),
    paddingBottom: pick("padding-bottom"),
    paddingLeft: pick("padding-left"),
  };
}

export function sizeComputedFromElementStyles(): SizeComputedValues {
  return {
    width: pick("width"),
    height: pick("height"),
    minWidth: pick("min-width"),
    maxWidth: pick("max-width"),
    minHeight: pick("min-height"),
    maxHeight: pick("max-height"),
    overflowX: pick("overflow-x"),
    overflowY: pick("overflow-y"),
    aspectRatio: pick("aspect-ratio"),
  };
}

export function typographyComputedFromElementStyles(): TypographyComputedValues {
  return {
    fontFamily: pick("font-family"),
    fontSize: pick("font-size"),
    fontWeight: pick("font-weight"),
    fontStyle: pick("font-style"),
    fontVariant: pick("font-variant"),
    lineHeight: pick("line-height"),
    letterSpacing: pick("letter-spacing"),
    textAlign: pick("text-align"),
    textDecoration: pick("text-decoration"),
    textTransform: pick("text-transform"),
    color: pick("color"),
    wordBreak: pick("word-break"),
    whiteSpace: pick("white-space"),
    textShadow: pick("text-shadow"),
  };
}

export function backgroundComputedFromElementStyles(): BackgroundComputedValues {
  return {
    backgroundColor: pick("background-color"),
    backgroundImage: pick("background-image"),
    backgroundSize: pick("background-size"),
    backgroundPosition: pick("background-position"),
    backgroundRepeat: pick("background-repeat"),
    backgroundAttachment: pick("background-attachment"),
    backgroundOrigin: pick("background-origin"),
    backgroundClip: pick("background-clip"),
  };
}

export function borderComputedFromElementStyles(): BorderComputedValues {
  return {
    borderStyleTop: pick("border-top-style"),
    borderStyleRight: pick("border-right-style"),
    borderStyleBottom: pick("border-bottom-style"),
    borderStyleLeft: pick("border-left-style"),
    borderWidthTop: pick("border-top-width"),
    borderWidthRight: pick("border-right-width"),
    borderWidthBottom: pick("border-bottom-width"),
    borderWidthLeft: pick("border-left-width"),
    borderColorTop: pick("border-top-color"),
    borderColorRight: pick("border-right-color"),
    borderColorBottom: pick("border-bottom-color"),
    borderColorLeft: pick("border-left-color"),
    borderRadiusTopLeft: pick("border-top-left-radius"),
    borderRadiusTopRight: pick("border-top-right-radius"),
    borderRadiusBottomRight: pick("border-bottom-right-radius"),
    borderRadiusBottomLeft: pick("border-bottom-left-radius"),
    outlineStyle: pick("outline-style"),
    outlineWidth: pick("outline-width"),
    outlineColor: pick("outline-color"),
  };
}
