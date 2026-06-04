import { spacingComputedFromElementStyles } from "./element-styles-from-css";
import type { SpacingComputedValues } from "./spacing-fields";

export function getSpacingComputedValues(): SpacingComputedValues {
  return spacingComputedFromElementStyles();
}
