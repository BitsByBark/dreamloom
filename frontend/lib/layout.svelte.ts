import {
  DEFAULT_LEFT_WIDTH,
  DEFAULT_RIGHT_WIDTH,
  loadLayout,
  saveLayout,
  type PanelLayout,
} from "$lib/layout-storage";

export const layout = $state<PanelLayout>(loadLayout());

export function resetPanelSizes(): void {
  layout.leftWidth = DEFAULT_LEFT_WIDTH;
  layout.rightWidth = DEFAULT_RIGHT_WIDTH;
  saveLayout(layout);
}
