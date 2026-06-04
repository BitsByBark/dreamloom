export type SpacingComputedValues = {
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
};

export type SpacingDraft = {
  marginTop: string;
  marginRight: string;
  marginBottom: string;
  marginLeft: string;
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
};

export type SpacingLayer = "margin" | "padding";
export type SpacingSide = "top" | "right" | "bottom" | "left";

export type SpacingFieldKey =
  | "marginTop"
  | "marginRight"
  | "marginBottom"
  | "marginLeft"
  | "paddingTop"
  | "paddingRight"
  | "paddingBottom"
  | "paddingLeft";

export type SpacingEditTarget = {
  layer: SpacingLayer;
  side: SpacingSide;
};

export const SPACING_UNITS = ["px", "rem", "em", "%", "auto"] as const;
export type SpacingUnit = (typeof SPACING_UNITS)[number];

export function spacingFieldKey(layer: SpacingLayer, side: SpacingSide): SpacingFieldKey {
  const cap = side.charAt(0).toUpperCase() + side.slice(1);
  return `${layer}${cap}` as SpacingFieldKey;
}

export function emptySpacingDraft(): SpacingDraft {
  return {
    marginTop: "",
    marginRight: "",
    marginBottom: "",
    marginLeft: "",
    paddingTop: "",
    paddingRight: "",
    paddingBottom: "",
    paddingLeft: "",
  };
}

export function spacingDraftFromComputed(values: SpacingComputedValues): SpacingDraft {
  const empty = emptySpacingDraft();
  return {
    marginTop: values.marginTop ?? empty.marginTop,
    marginRight: values.marginRight ?? empty.marginRight,
    marginBottom: values.marginBottom ?? empty.marginBottom,
    marginLeft: values.marginLeft ?? empty.marginLeft,
    paddingTop: values.paddingTop ?? empty.paddingTop,
    paddingRight: values.paddingRight ?? empty.paddingRight,
    paddingBottom: values.paddingBottom ?? empty.paddingBottom,
    paddingLeft: values.paddingLeft ?? empty.paddingLeft,
  };
}

export function formatSpacingDisplay(value: string): string {
  const trimmed = value.trim();
  return trimmed === "" ? "—" : trimmed;
}

export function parseSpacingValue(raw: string): { amount: string; unit: SpacingUnit } {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "—") {
    return { amount: "", unit: "px" };
  }
  if (trimmed === "auto") {
    return { amount: "", unit: "auto" };
  }

  const match = trimmed.match(/^(-?[\d.]+)\s*(px|rem|em|%)$/i);
  if (match) {
    const unit = match[2].toLowerCase() as SpacingUnit;
    return { amount: match[1], unit };
  }

  const bare = trimmed.match(/^(-?[\d.]+)$/);
  if (bare) {
    return { amount: bare[1], unit: "px" };
  }

  return { amount: trimmed, unit: "px" };
}

export function composeSpacingValue(amount: string, unit: SpacingUnit): string {
  if (unit === "auto") {
    return "auto";
  }
  const n = amount.trim();
  if (n === "") {
    return "";
  }
  return `${n}${unit}`;
}
