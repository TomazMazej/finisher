import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import cloudflare from "@astrojs/cloudflare";

// Strani so statične (prerender), na zahtevo tečejo samo /api/* z `export const prerender = false`.
export default defineConfig({
  adapter: cloudflare(),
  integrations: [svelte()],
});
