export type StyleDelta = {
  class: string;
  state: string;
  property: string;
  value: string;
};

function normalizeClass(className: string): string {
  return className.startsWith(".") ? className.slice(1) : className;
}

export function buildDelta(
  className: string,
  state: string,
  property: string,
  value: string,
): StyleDelta {
  const delta: StyleDelta = {
    class: normalizeClass(className),
    state,
    property,
    value,
  };
  console.log("[injector:delta]", delta);
  return delta;
}
