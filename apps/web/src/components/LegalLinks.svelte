<script lang="ts">
  import type { Lang } from "@finisher/core";
  import { LEGAL_PATHS } from "../lib/site";
  let { lang }: { lang: Lang } = $props();
  const p = $derived(LEGAL_PATHS[lang]);
  const L = $derived(
    lang === "sl"
      ? { terms: "Pogoji uporabe", privacy: "Zasebnost", health: "Zdravje in varnost" }
      : { terms: "Terms", privacy: "Privacy", health: "Health and safety" },
  );
</script>

<nav class="legal" aria-label={lang === "sl" ? "Pravne informacije" : "Legal"}>
  <a href={p.terms}>{L.terms}</a>
  <a href={p.privacy}>{L.privacy}</a>
  <a href={p.health}>{L.health}</a>
</nav>

<style>
  .legal {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1.2rem;
    margin-top: 0.75rem;
    font-size: 0.95rem;
  }
  a {
    color: var(--ink-2);
  }
  a:hover {
    color: var(--bib-blue);
  }
  a:focus-visible {
    outline: 3px solid var(--bib-blue);
    outline-offset: 2px;
  }
</style>
