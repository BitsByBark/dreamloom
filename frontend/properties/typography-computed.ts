import { typographyComputedFromElementStyles } from "./element-styles-from-css";
import type { TypographyComputedValues } from "./typography-fields";

export function getTypographyComputedValues(): TypographyComputedValues {
  return typographyComputedFromElementStyles();
}
