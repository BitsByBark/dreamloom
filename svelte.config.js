// Tauri doesn't have a Node.js server to do proper SSR
// so we use adapter-static with a fallback to index.html to put the site in SPA mode
// See: https://svelte.dev/docs/kit/single-page-apps
// See: https://v2.tauri.app/start/frontend/sveltekit/ for more info
import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    files: {
      routes: "frontend/routes",
      appTemplate: "frontend/app.html",
      lib: "frontend/lib",
    },
    alias: {
      $panels: "frontend/panels",
      $misc: "frontend/misc",
      $debug: "frontend/debug",
      $settings: "frontend/settings",
      $properties: "frontend/properties",
    },
    adapter: adapter({
      fallback: "index.html",
    }),
  },
};

export default config;
