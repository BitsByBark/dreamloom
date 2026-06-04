import { sizeComputedFromElementStyles } from "./element-styles-from-css";
import type { SizeComputedValues } from "./size-fields";

export function getSizeComputedValues(): SizeComputedValues {
  return sizeComputedFromElementStyles();
}
