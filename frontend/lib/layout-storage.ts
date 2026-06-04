export const LAYOUT_STORAGE_KEY = "dreamloom-layout";

export const RAIL_WIDTH = 40;
export const MIN_PANEL_WIDTH = 120;
export const DEFAULT_LEFT_WIDTH = 240;
export const DEFAULT_RIGHT_WIDTH = 240;

export type PanelLayout = {
  leftWidth: number;
  rightWidth: number;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
};

export const defaultLayout: PanelLayout = {
  leftWidth: DEFAULT_LEFT_WIDTH,
  rightWidth: DEFAULT_RIGHT_WIDTH,
  leftCollapsed: false,
  rightCollapsed: false,
};

export function loadLayout(): PanelLayout {
  if (typeof localStorage === "undefined") {
    return { ...defaultLayout };
  }

  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) {
      return { ...defaultLayout };
    }

    const parsed = JSON.parse(raw) as Partial<PanelLayout>;
    return {
      leftWidth: clampWidth(parsed.leftWidth ?? DEFAULT_LEFT_WIDTH),
      rightWidth: clampWidth(parsed.rightWidth ?? DEFAULT_RIGHT_WIDTH),
      leftCollapsed: parsed.leftCollapsed ?? false,
      rightCollapsed: parsed.rightCollapsed ?? false,
    };
  } catch {
    return { ...defaultLayout };
  }
}

export function saveLayout(layout: PanelLayout): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
}

function clampWidth(value: number): number {
  return Math.max(MIN_PANEL_WIDTH, Math.round(value));
}
