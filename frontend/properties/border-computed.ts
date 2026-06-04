import { borderComputedFromElementStyles } from "./element-styles-from-css";
import type { BorderComputedValues } from "./border-fields";

export function getBorderComputedValues(): BorderComputedValues {
  return borderComputedFromElementStyles();
}
