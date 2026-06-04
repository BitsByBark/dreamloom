export type TypographyComputedValues = {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  fontVariant?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textAlign?: string;
  textDecoration?: string;
  textTransform?: string;
  color?: string;
  wordBreak?: string;
  whiteSpace?: string;
  textShadow?: string;
};

export type TypographyDraft = {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  fontStyle: string;
  fontVariant: string;
  lineHeight: string;
  letterSpacing: string;
  textAlign: string;
  textDecoration: string;
  textTransform: string;
  color: string;
  wordBreak: string;
  whiteSpace: string;
  textShadow: string;
};

export const FONT_SIZE_UNITS = ["px", "%", "rem", "em"] as const;
export type FontSizeUnit = (typeof FONT_SIZE_UNITS)[number];

export const LINE_HEIGHT_UNITS = ["px", "rem", "em", "normal"] as const;
export type LineHeightUnit = (typeof LINE_HEIGHT_UNITS)[number];

export const LETTER_SPACING_UNITS = ["px", "rem", "em"] as const;
export type LetterSpacingUnit = (typeof LETTER_SPACING_UNITS)[number];

export const FONT_WEIGHT_OPTIONS = [
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "bold",
  "bolder",
  "lighter",
] as const;

export const FONT_STYLE_OPTIONS = ["normal", "italic", "oblique"] as const;

/** Unicode glyphs for font-style toggle buttons. */
export const FONT_STYLE_TOGGLES = [
  { value: "normal", glyph: "A", label: "Normal" },
  { value: "italic", glyph: "𝘈", label: "Italic" },
  { value: "oblique", glyph: "𝘰", label: "Oblique" },
] as const satisfies ReadonlyArray<{
  value: (typeof FONT_STYLE_OPTIONS)[number];
  glyph: string;
  label: string;
}>;

export const FONT_VARIANT_OPTIONS = ["normal", "small-caps"] as const;

/** Unicode glyphs for font-variant toggle buttons. */
export const FONT_VARIANT_TOGGLES = [
  { value: "normal", glyph: "A", label: "Normal variant" },
  { value: "small-caps", glyph: "ᴬ", label: "Small caps" },
] as const satisfies ReadonlyArray<{
  value: (typeof FONT_VARIANT_OPTIONS)[number];
  glyph: string;
  label: string;
}>;
export const TEXT_ALIGN_OPTIONS = ["left", "center", "right", "justify"] as const;

/** Unicode glyphs for text-align toggle buttons (left → justify). */
export const TEXT_ALIGN_TOGGLES = [
  { value: "left", glyph: "◧", label: "Align left" },
  { value: "center", glyph: "▣", label: "Align center" },
  { value: "right", glyph: "◨", label: "Align right" },
  { value: "justify", glyph: "≡", label: "Justify" },
] as const satisfies ReadonlyArray<{ value: (typeof TEXT_ALIGN_OPTIONS)[number]; glyph: string; label: string }>;
export const TEXT_DECORATION_OPTIONS = ["none", "underline", "overline", "line-through"] as const;

/** Unicode glyphs for text-decoration toggle buttons. */
export const TEXT_DECORATION_TOGGLES = [
  { value: "none", glyph: "∅", label: "No decoration" },
  { value: "underline", glyph: "▁", label: "Underline" },
  { value: "overline", glyph: "▔", label: "Overline" },
  { value: "line-through", glyph: "▬", label: "Line through" },
] as const satisfies ReadonlyArray<{
  value: (typeof TEXT_DECORATION_OPTIONS)[number];
  glyph: string;
  label: string;
}>;
export const TEXT_TRANSFORM_OPTIONS = ["none", "uppercase", "lowercase", "capitalize"] as const;

/** Unicode glyphs for text-transform toggle buttons. */
export const TEXT_TRANSFORM_TOGGLES = [
  { value: "none", glyph: "—", label: "No transform" },
  { value: "uppercase", glyph: "AA", label: "Uppercase" },
  { value: "lowercase", glyph: "aa", label: "Lowercase" },
  { value: "capitalize", glyph: "Aa", label: "Capitalize" },
] as const satisfies ReadonlyArray<{
  value: (typeof TEXT_TRANSFORM_OPTIONS)[number];
  glyph: string;
  label: string;
}>;

export const WORD_BREAK_OPTIONS = ["normal", "break-all", "keep-all"] as const;

/** Unicode glyphs for word-break toggle buttons. */
export const WORD_BREAK_TOGGLES = [
  { value: "normal", glyph: "—", label: "Normal break" },
  { value: "break-all", glyph: "⤬", label: "Break all" },
  { value: "keep-all", glyph: "字", label: "Keep all" },
] as const satisfies ReadonlyArray<{
  value: (typeof WORD_BREAK_OPTIONS)[number];
  glyph: string;
  label: string;
}>;

export const WHITE_SPACE_OPTIONS = ["normal", "nowrap", "pre", "pre-wrap", "pre-line"] as const;

/** Unicode glyphs for white-space toggle buttons. */
export const WHITE_SPACE_TOGGLES = [
  { value: "normal", glyph: "—", label: "Normal white space" },
  { value: "nowrap", glyph: "⊣", label: "No wrap" },
  { value: "pre", glyph: "␣", label: "Pre" },
  { value: "pre-wrap", glyph: "⤶", label: "Pre-wrap" },
  { value: "pre-line", glyph: "↵", label: "Pre-line" },
] as const satisfies ReadonlyArray<{
  value: (typeof WHITE_SPACE_OPTIONS)[number];
  glyph: string;
  label: string;
}>;

const LINE_HEIGHT_KEYWORDS = new Set<LineHeightUnit>(["normal"]);

export function emptyTypographyDraft(): TypographyDraft {
  return {
    fontFamily: "",
    fontSize: "",
    fontWeight: "",
    fontStyle: "",
    fontVariant: "",
    lineHeight: "",
    letterSpacing: "",
    textAlign: "",
    textDecoration: "",
    textTransform: "",
    color: "",
    wordBreak: "",
    whiteSpace: "",
    textShadow: "",
  };
}

export function typographyDraftFromComputed(values: TypographyComputedValues): TypographyDraft {
  const empty = emptyTypographyDraft();
  return {
    fontFamily: values.fontFamily ?? empty.fontFamily,
    fontSize: values.fontSize ?? empty.fontSize,
    fontWeight: values.fontWeight ?? empty.fontWeight,
    fontStyle: values.fontStyle ?? empty.fontStyle,
    fontVariant: values.fontVariant ?? empty.fontVariant,
    lineHeight: values.lineHeight ?? empty.lineHeight,
    letterSpacing: values.letterSpacing ?? empty.letterSpacing,
    textAlign: values.textAlign ?? empty.textAlign,
    textDecoration: values.textDecoration ?? empty.textDecoration,
    textTransform: values.textTransform ?? empty.textTransform,
    color: values.color ?? empty.color,
    wordBreak: values.wordBreak ?? empty.wordBreak,
    whiteSpace: values.whiteSpace ?? empty.whiteSpace,
    textShadow: values.textShadow ?? empty.textShadow,
  };
}

export function parseTypographyDimension<U extends string>(
  raw: string,
  units: readonly U[],
  keywordUnits: Set<U>,
  defaultUnit: U,
): { amount: string; unit: U } {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "—") {
    return { amount: "", unit: defaultUnit };
  }

  if (keywordUnits.has(trimmed as U)) {
    return { amount: "", unit: trimmed as U };
  }

  const unitPattern = units.filter((u) => !keywordUnits.has(u)).join("|");
  const match = trimmed.match(new RegExp(`^(-?[\\d.]+)\\s*(${unitPattern})$`, "i"));
  if (match) {
    const unit = match[2].toLowerCase() as U;
    return { amount: match[1], unit };
  }

  const bare = trimmed.match(/^(-?[\d.]+)$/);
  if (bare) {
    return { amount: bare[1], unit: defaultUnit };
  }

  return { amount: trimmed, unit: defaultUnit };
}

export function composeTypographyDimension<U extends string>(
  amount: string,
  unit: U,
  keywordUnits: Set<U>,
): string {
  if (keywordUnits.has(unit)) {
    return unit;
  }

  const n = amount.trim();
  if (n === "") {
    return "";
  }

  return `${n}${unit}`;
}

export function typographyAmountDisabled<U extends string>(unit: U, keywordUnits: Set<U>): boolean {
  return keywordUnits.has(unit);
}

export function lineHeightAmountDisabled(unit: LineHeightUnit): boolean {
  return typographyAmountDisabled(unit, LINE_HEIGHT_KEYWORDS);
}
