export type PrimitiveTemplateId =
  | "container"
  | "text"
  | "heading"
  | "button"
  | "image"
  | "link"
  | "input"
  | "span"
  | "section"
  | "list"
  | "progress"
  | "table"
  | "tabs"
  | "form"
  | "toggle";

/** Bare HTML snippets — one unique `dl-*` class per element via `nextClass`. */
export function renderPrimitiveTemplate(
  id: PrimitiveTemplateId,
  nextClass: () => string,
): string {
  switch (id) {
    case "container": {
      const c = nextClass();
      return `<div class="${c}"></div>`;
    }
    case "text": {
      const c = nextClass();
      return `<p class="${c}"></p>`;
    }
    case "heading": {
      const c = nextClass();
      return `<h1 class="${c}"></h1>`;
    }
    case "button": {
      const c = nextClass();
      return `<button type="button" class="${c}"></button>`;
    }
    case "image": {
      const c = nextClass();
      return `<img class="${c}" src="" alt="" />`;
    }
    case "link": {
      const c = nextClass();
      return `<a class="${c}" href="#"></a>`;
    }
    case "input": {
      const c = nextClass();
      return `<input class="${c}" type="text" />`;
    }
    case "span": {
      const c = nextClass();
      return `<span class="${c}"></span>`;
    }
    case "section": {
      const c = nextClass();
      return `<section class="${c}"></section>`;
    }
    case "list": {
      const ul = nextClass();
      const li = nextClass();
      return `<ul class="${ul}">\n  <li class="${li}"></li>\n</ul>`;
    }
    case "progress": {
      const c = nextClass();
      return `<progress class="${c}" value="0" max="100"></progress>`;
    }
    case "table": {
      const table = nextClass();
      const thead = nextClass();
      const tbody = nextClass();
      const trH = nextClass();
      const th = nextClass();
      const trB = nextClass();
      const td = nextClass();
      return `<table class="${table}">
  <thead class="${thead}">
    <tr class="${trH}">
      <th class="${th}"></th>
    </tr>
  </thead>
  <tbody class="${tbody}">
    <tr class="${trB}">
      <td class="${td}"></td>
    </tr>
  </tbody>
</table>`;
    }
    case "tabs": {
      const root = nextClass();
      const list = nextClass();
      const tabA = nextClass();
      const tabB = nextClass();
      const panel = nextClass();
      return `<div class="${root}">
  <div class="${list}" role="tablist">
    <button type="button" class="${tabA}" role="tab">Tab 1</button>
    <button type="button" class="${tabB}" role="tab">Tab 2</button>
  </div>
  <div class="${panel}" role="tabpanel"></div>
</div>`;
    }
    case "form": {
      const form = nextClass();
      const input = nextClass();
      const button = nextClass();
      return `<form class="${form}">
  <input class="${input}" type="text" />
  <button type="submit" class="${button}">Submit</button>
</form>`;
    }
    case "toggle": {
      const c = nextClass();
      return `<button
  type="button"
  class="${c}"
  aria-pressed="false"
  style="display: inline-flex; align-items: center; gap: 10px; padding: 0; border: none; background: transparent; color: currentColor; font-family: 'IBM Plex Mono', monospace; cursor: pointer;"
  onclick={(event) => {
    const button = event.currentTarget;
    const checked = button.getAttribute("aria-pressed") !== "true";
    button.setAttribute("aria-pressed", String(checked));
    const track = button.querySelector("[data-dl-toggle-track]");
    const thumb = button.querySelector("[data-dl-toggle-thumb]");
    if (track instanceof HTMLElement) {
      track.style.background = checked ? "var(--accent, #aacc00)" : "#1a1a1a";
    }
    if (thumb instanceof HTMLElement) {
      thumb.style.transform = checked ? "translateX(20px)" : "translateX(0)";
    }
    button.dispatchEvent(new CustomEvent("change", { detail: checked, bubbles: true }));
  }}
>
  <span data-dl-toggle-track aria-hidden="true" style="position: relative; display: block; width: 42px; height: 22px; background: #1a1a1a; transition: background-color 150ms ease;">
    <span data-dl-toggle-thumb style="position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; background: #000000; transition: transform 150ms ease;"></span>
  </span>
  <span style="font-family: 'IBM Plex Mono', monospace;">Toggle</span>
</button>`;
    }
  }
}
