export type SizeComputedValues = {
  width?: string;
  height?: string;
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;
  overflowX?: string;
  overflowY?: string;
  aspectRatio?: string;
};

export type SizeDraft = {
  width: string;
  height: string;
  minWidth: string;
  maxWidth: string;
  minHeight: string;
  maxHeight: string;
  overflowX: string;
  overflowY: string;
  aspectW: string;
  aspectH: string;
};

export const SIZE_DIMENSION_UNITS = [
  "px",
  "%",
  "rem",
  "em",
  "auto",
  "fit-content",
  "min-content",
  "max-content",
] as const;

export type SizeDimensionUnit = (typeof SIZE_DIMENSION_UNITS)[number];

export const KEYWORD_SIZE_UNITS = new Set<SizeDimensionUnit>([
  "auto",
  "fit-content",
  "min-content",
  "max-content",
]);

export const OVERFLOW_OPTIONS = ["visible", "hidden", "scroll", "auto"] as const;

/** Units for aspect-ratio W / H slots (unitless uses "—"). */
export const ASPECT_RATIO_UNITS = ["—", "px", "%", "rem", "em", "vh", "vw"] as const;

export type AspectRatioUnit = (typeof ASPECT_RATIO_UNITS)[number];

export function emptySizeDraft(): SizeDraft {
  return {
    width: "",
    height: "",
    minWidth: "",
    maxWidth: "",
    minHeight: "",
    maxHeight: "",
    overflowX: "",
    overflowY: "",
    aspectW: "",
    aspectH: "",
  };
}

export function sizeDraftFromComputed(values: SizeComputedValues): SizeDraft {
  const empty = emptySizeDraft();
  return {
    width: values.width ?? empty.width,
    height: values.height ?? empty.height,
    minWidth: values.minWidth ?? empty.minWidth,
    maxWidth: values.maxWidth ?? empty.maxWidth,
    minHeight: values.minHeight ?? empty.minHeight,
    maxHeight: values.maxHeight ?? empty.maxHeight,
    overflowX: values.overflowX ?? empty.overflowX,
    overflowY: values.overflowY ?? empty.overflowY,
    ...splitAspectRatio(values.aspectRatio ?? ""),
  };
}

export function splitAspectRatio(raw: string): { aspectW: string; aspectH: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { aspectW: "", aspectH: "" };
  }

  const parts = trimmed.split(/\s*\/\s*/);
  return {
    aspectW: parts[0]?.trim() ?? "",
    aspectH: parts[1]?.trim() ?? "",
  };
}

/** CSS aspect-ratio value from W and H slot strings. */
export function composeAspectRatio(w: string, h: string): string {
  const left = w.trim();
  const right = h.trim();
  if (!left && !right) {
    return "";
  }
  if (!right) {
    return left;
  }
  if (!left) {
    return right;
  }
  return `${left} / ${right}`;
}

export function parseSizeValue(raw: string): { amount: string; unit: SizeDimensionUnit } {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "—") {
    return { amount: "", unit: "px" };
  }

  if (KEYWORD_SIZE_UNITS.has(trimmed as SizeDimensionUnit)) {
    return { amount: "", unit: trimmed as SizeDimensionUnit };
  }

  const match = trimmed.match(/^(-?[\d.]+)\s*(px|%|rem|em)$/i);
  if (match) {
    const unit = match[2].toLowerCase() as SizeDimensionUnit;
    return { amount: match[1], unit };
  }

  const bare = trimmed.match(/^(-?[\d.]+)$/);
  if (bare) {
    return { amount: bare[1], unit: "px" };
  }

  return { amount: trimmed, unit: "px" };
}

export function composeSizeValue(amount: string, unit: SizeDimensionUnit): string {
  if (KEYWORD_SIZE_UNITS.has(unit)) {
    return unit;
  }

  const n = amount.trim();
  if (n === "") {
    return "";
  }

  return `${n}${unit}`;
}

export function sizeAmountDisabled(unit: SizeDimensionUnit): boolean {
  return KEYWORD_SIZE_UNITS.has(unit);
}

export function parseAspectSlot(raw: string): { amount: string; unit: AspectRatioUnit } {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "—") {
    return { amount: "", unit: "—" };
  }

  const match = trimmed.match(/^(-?[\d.]+)\s*(px|%|rem|em|vh|vw)$/i);
  if (match) {
    const unit = match[2].toLowerCase() as AspectRatioUnit;
    return { amount: match[1], unit };
  }

  const bare = trimmed.match(/^(-?[\d.]+)$/);
  if (bare) {
    return { amount: bare[1], unit: "—" };
  }

  return { amount: trimmed, unit: "—" };
}

export function composeAspectSlot(amount: string, unit: AspectRatioUnit): string {
  const n = amount.trim();
  if (!n || unit === "—") {
    return n;
  }
  return `${n}${unit}`;
}

export function aspectAmountDisabled(unit: AspectRatioUnit): boolean {
  return unit === "—";
}
