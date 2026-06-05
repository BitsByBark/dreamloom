<button
  type="button"
  class="__DL_CLASS__ dl-toggle"
  aria-pressed="false"
  onclick={(event) => {
    const button = event.currentTarget;
    const checked = button.getAttribute("aria-pressed") !== "true";
    button.setAttribute("aria-pressed", String(checked));
    button.dispatchEvent(new CustomEvent("change", { detail: checked, bubbles: true }));
  }}
>
  <span class="dl-toggle-track" aria-hidden="true">
    <span class="dl-toggle-thumb"></span>
  </span>
  <span class="dl-toggle-label">Toggle</span>
</button>

<style>
  .dl-toggle {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 0;
    border: none;
    background: transparent;
    color: currentColor;
    font-family: "IBM Plex Mono", monospace;
    cursor: pointer;
  }

  .dl-toggle-track {
    position: relative;
    display: block;
    width: 42px;
    height: 22px;
    background: #1a1a1a;
    transition: background-color 150ms ease;
  }

  .dl-toggle[aria-pressed="true"] .dl-toggle-track {
    background: var(--accent, #aacc00);
  }

  .dl-toggle-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 16px;
    height: 16px;
    background: #000000;
    transition: transform 150ms ease;
  }

  .dl-toggle[aria-pressed="true"] .dl-toggle-thumb {
    transform: translateX(20px);
  }

  .dl-toggle-label {
    font-family: "IBM Plex Mono", monospace;
  }
</style>
