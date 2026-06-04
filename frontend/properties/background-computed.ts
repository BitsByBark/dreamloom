import { backgroundComputedFromElementStyles } from "./element-styles-from-css";
import type { BackgroundComputedValues } from "./background-fields";

export function getBackgroundComputedValues(): BackgroundComputedValues {
  return backgroundComputedFromElementStyles();
}
