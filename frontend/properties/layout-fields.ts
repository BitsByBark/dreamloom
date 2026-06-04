export type LayoutComputedValues = {
  display?: string;
  flexDirection?: string;
  flexWrap?: string;
  justifyContent?: string;
  alignItems?: string;
  alignContent?: string;
  gap?: string;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridAutoFlow?: string;
  position?: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  zIndex?: string;
  float?: string;
  clear?: string;
};

export type LayoutDraft = {
  display: string;
  flexDirection: string;
  flexWrap: string;
  justifyContent: string;
  alignItems: string;
  alignContent: string;
  gap: string;
  gridTemplateColumns: string;
  gridTemplateRows: string;
  gridAutoFlow: string;
  position: string;
  top: string;
  right: string;
  bottom: string;
  left: string;
  zIndex: string;
  float: string;
  clear: string;
};

export function emptyLayoutDraft(): LayoutDraft {
  return {
    display: "",
    flexDirection: "",
    flexWrap: "",
    justifyContent: "",
    alignItems: "",
    alignContent: "",
    gap: "",
    gridTemplateColumns: "",
    gridTemplateRows: "",
    gridAutoFlow: "",
    position: "",
    top: "",
    right: "",
    bottom: "",
    left: "",
    zIndex: "",
    float: "",
    clear: "",
  };
}

export function layoutDraftFromComputed(values: LayoutComputedValues): LayoutDraft {
  const empty = emptyLayoutDraft();
  return {
    display: values.display ?? empty.display,
    flexDirection: values.flexDirection ?? empty.flexDirection,
    flexWrap: values.flexWrap ?? empty.flexWrap,
    justifyContent: values.justifyContent ?? empty.justifyContent,
    alignItems: values.alignItems ?? empty.alignItems,
    alignContent: values.alignContent ?? empty.alignContent,
    gap: values.gap ?? empty.gap,
    gridTemplateColumns: values.gridTemplateColumns ?? empty.gridTemplateColumns,
    gridTemplateRows: values.gridTemplateRows ?? empty.gridTemplateRows,
    gridAutoFlow: values.gridAutoFlow ?? empty.gridAutoFlow,
    position: values.position ?? empty.position,
    top: values.top ?? empty.top,
    right: values.right ?? empty.right,
    bottom: values.bottom ?? empty.bottom,
    left: values.left ?? empty.left,
    zIndex: values.zIndex ?? empty.zIndex,
    float: values.float ?? empty.float,
    clear: values.clear ?? empty.clear,
  };
}

export const DISPLAY_OPTIONS = [
  "block",
  "inline",
  "inline-block",
  "flex",
  "inline-flex",
  "grid",
  "inline-grid",
  "none",
] as const;

export const FLEX_DIRECTION_OPTIONS = [
  "row",
  "row-reverse",
  "column",
  "column-reverse",
] as const;

export const FLEX_WRAP_OPTIONS = ["nowrap", "wrap", "wrap-reverse"] as const;

export const JUSTIFY_CONTENT_OPTIONS = [
  "flex-start",
  "flex-end",
  "center",
  "space-between",
  "space-around",
  "space-evenly",
] as const;

export const ALIGN_ITEMS_OPTIONS = [
  "flex-start",
  "flex-end",
  "center",
  "stretch",
  "baseline",
] as const;

export const ALIGN_CONTENT_OPTIONS = [
  "flex-start",
  "flex-end",
  "center",
  "stretch",
  "space-between",
  "space-around",
] as const;

export const GRID_AUTO_FLOW_OPTIONS = [
  "row",
  "column",
  "dense",
  "row dense",
  "column dense",
] as const;

export const POSITION_OPTIONS = [
  "static",
  "relative",
  "absolute",
  "fixed",
  "sticky",
] as const;

export const FLOAT_OPTIONS = ["none", "left", "right"] as const;

export const CLEAR_OPTIONS = ["none", "left", "right", "both"] as const;

export function isFlexDisplay(display: string): boolean {
  return display === "flex" || display === "inline-flex";
}

export function isGridDisplay(display: string): boolean {
  return display === "grid" || display === "inline-grid";
}

export function showsPositionOffsets(position: string): boolean {
  return position !== "" && position !== "static";
}
