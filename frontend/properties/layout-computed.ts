import { layoutComputedFromElementStyles } from "./element-styles-from-css";
import type { LayoutComputedValues } from "./layout-fields";

export function getLayoutComputedValues(): LayoutComputedValues {
  return layoutComputedFromElementStyles();
}
