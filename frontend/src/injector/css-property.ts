export function camelToCssProperty(key: string): string {
  return key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

const BORDER_DRAFT_TO_CSS: Record<string, string> = {
  styleTop: "border-top-style",
  styleRight: "border-right-style",
  styleBottom: "border-bottom-style",
  styleLeft: "border-left-style",
  widthTop: "border-top-width",
  widthRight: "border-right-width",
  widthBottom: "border-bottom-width",
  widthLeft: "border-left-width",
  colorTop: "border-top-color",
  colorRight: "border-right-color",
  colorBottom: "border-bottom-color",
  colorLeft: "border-left-color",
  radiusTopLeft: "border-top-left-radius",
  radiusTopRight: "border-top-right-radius",
  radiusBottomRight: "border-bottom-right-radius",
  radiusBottomLeft: "border-bottom-left-radius",
  outlineStyle: "outline-style",
  outlineWidth: "outline-width",
  outlineColor: "outline-color",
};

export function borderDraftKeyToCssProperty(key: string): string {
  return BORDER_DRAFT_TO_CSS[key] ?? camelToCssProperty(key);
}
