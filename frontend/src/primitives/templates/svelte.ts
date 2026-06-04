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
  | "form";

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
  }
}
