export type BorderSide = "top" | "right" | "bottom" | "left";

export type BorderCorner = "topLeft" | "topRight" | "bottomRight" | "bottomLeft";

export type BorderComputedValues = {
  borderStyleTop?: string;
  borderStyleRight?: string;
  borderStyleBottom?: string;
  borderStyleLeft?: string;
  borderWidthTop?: string;
  borderWidthRight?: string;
  borderWidthBottom?: string;
  borderWidthLeft?: string;
  borderColorTop?: string;
  borderColorRight?: string;
  borderColorBottom?: string;
  borderColorLeft?: string;
  borderRadiusTopLeft?: string;
  borderRadiusTopRight?: string;
  borderRadiusBottomRight?: string;
  borderRadiusBottomLeft?: string;
  outlineStyle?: string;
  outlineWidth?: string;
  outlineColor?: string;
};

export type BorderDraft = {
  styleTop: string;
  styleRight: string;
  styleBottom: string;
  styleLeft: string;
  widthTop: string;
  widthRight: string;
  widthBottom: string;
  widthLeft: string;
  colorTop: string;
  colorRight: string;
  colorBottom: string;
  colorLeft: string;
  radiusTopLeft: string;
  radiusTopRight: string;
  radiusBottomRight: string;
  radiusBottomLeft: string;
  outlineStyle: string;
  outlineWidth: string;
  outlineColor: string;
};

export const BORDER_STYLE_OPTIONS = [
  "none",
  "solid",
  "dashed",
  "dotted",
  "double",
  "groove",
  "ridge",
  "inset",
  "outset",
] as const;

export const BORDER_WIDTH_UNITS = ["px", "rem", "em"] as const;
export const BORDER_RADIUS_UNITS = ["px", "rem", "%"] as const;

export type BorderWidthUnit = (typeof BORDER_WIDTH_UNITS)[number];
export type BorderRadiusUnit = (typeof BORDER_RADIUS_UNITS)[number];

export const BORDER_SIDES: { key: BorderSide; label: string; styleKey: keyof BorderDraft; widthKey: keyof BorderDraft; colorKey: keyof BorderDraft }[] = [
  { key: "top", label: "TOP", styleKey: "styleTop", widthKey: "widthTop", colorKey: "colorTop" },
  { key: "right", label: "RIGHT", styleKey: "styleRight", widthKey: "widthRight", colorKey: "colorRight" },
  { key: "bottom", label: "BOTTOM", styleKey: "styleBottom", widthKey: "widthBottom", colorKey: "colorBottom" },
  { key: "left", label: "LEFT", styleKey: "styleLeft", widthKey: "widthLeft", colorKey: "colorLeft" },
];

export const BORDER_CORNERS: {
  key: BorderCorner;
  label: string;
  draftKey: keyof BorderDraft;
  hitClass: string;
  popoverClass: string;
}[] = [
  { key: "topLeft", label: "TL", draftKey: "radiusTopLeft", hitClass: "tl", popoverClass: "tl" },
  { key: "topRight", label: "TR", draftKey: "radiusTopRight", hitClass: "tr", popoverClass: "tr" },
  {
    key: "bottomRight",
    label: "BR",
    draftKey: "radiusBottomRight",
    hitClass: "br",
    popoverClass: "br",
  },
  {
    key: "bottomLeft",
    label: "BL",
    draftKey: "radiusBottomLeft",
    hitClass: "bl",
    popoverClass: "bl",
  },
];

export function emptyBorderDraft(): BorderDraft {
  return {
    styleTop: "",
    styleRight: "",
    styleBottom: "",
    styleLeft: "",
    widthTop: "",
    widthRight: "",
    widthBottom: "",
    widthLeft: "",
    colorTop: "",
    colorRight: "",
    colorBottom: "",
    colorLeft: "",
    radiusTopLeft: "",
    radiusTopRight: "",
    radiusBottomRight: "",
    radiusBottomLeft: "",
    outlineStyle: "",
    outlineWidth: "",
    outlineColor: "",
  };
}

export function borderDraftFromComputed(values: BorderComputedValues): BorderDraft {
  const empty = emptyBorderDraft();
  return {
    styleTop: values.borderStyleTop ?? empty.styleTop,
    styleRight: values.borderStyleRight ?? empty.styleRight,
    styleBottom: values.borderStyleBottom ?? empty.styleBottom,
    styleLeft: values.borderStyleLeft ?? empty.styleLeft,
    widthTop: values.borderWidthTop ?? empty.widthTop,
    widthRight: values.borderWidthRight ?? empty.widthRight,
    widthBottom: values.borderWidthBottom ?? empty.widthBottom,
    widthLeft: values.borderWidthLeft ?? empty.widthLeft,
    colorTop: values.borderColorTop ?? empty.colorTop,
    colorRight: values.borderColorRight ?? empty.colorRight,
    colorBottom: values.borderColorBottom ?? empty.colorBottom,
    colorLeft: values.borderColorLeft ?? empty.colorLeft,
    radiusTopLeft: values.borderRadiusTopLeft ?? empty.radiusTopLeft,
    radiusTopRight: values.borderRadiusTopRight ?? empty.radiusTopRight,
    radiusBottomRight: values.borderRadiusBottomRight ?? empty.radiusBottomRight,
    radiusBottomLeft: values.borderRadiusBottomLeft ?? empty.radiusBottomLeft,
    outlineStyle: values.outlineStyle ?? empty.outlineStyle,
    outlineWidth: values.outlineWidth ?? empty.outlineWidth,
    outlineColor: values.outlineColor ?? empty.outlineColor,
  };
}

export function parseBorderDimension(
  raw: string,
  units: readonly string[],
  defaultUnit: string,
): { amount: string; unit: string } {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "—") {
    return { amount: "", unit: defaultUnit };
  }

  const unitPattern = units.join("|");
  const match = trimmed.match(new RegExp(`^(-?[\\d.]+)\\s*(${unitPattern})$`, "i"));
  if (match) {
    return { amount: match[1], unit: match[2].toLowerCase() };
  }

  const bare = trimmed.match(/^(-?[\d.]+)$/);
  if (bare) {
    return { amount: bare[1], unit: defaultUnit };
  }

  return { amount: trimmed, unit: defaultUnit };
}

export function composeBorderDimension(amount: string, unit: string): string {
  const a = amount.trim();
  if (!a) {
    return "";
  }
  return `${a}${unit}`;
}
