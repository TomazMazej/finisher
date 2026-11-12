<script lang="ts">
  import type { Lang, Warning } from "@finisher/core";
  import { T } from "../lib/i18n";

  // Vsa opozorila načrta v enem okvirju, najpomembnejša prva (vrstni red ključev v prevodih).
  let { lang, warnings }: { lang: Lang; warnings: Warning[] } = $props();
  const t = $derived(T[lang]);
  const order = $derived(Object.keys(t.warnings));
  const sorted = $derived([...warnings].sort((a, b) => order.indexOf(a.code) - order.indexOf(b.code)));
</script>

{#if sorted.length}
  <aside class="notes" aria-label={t.notesTitle}>
    <h2>{t.notesTitle}</h2>
    <ul>
      {#each sorted as w}<li>{t.warnings[w.code](w.value, w.limit)}</li>{/each}
    </ul>
  </aside>
{/if}

<style>
  .notes {
    padding: 0.9rem 1rem;
    border-radius: var(--r-ui);
    background: var(--amber-bg);
    color: var(--amber);
  }
  h2 {
    font-size: 1.35rem;
    margin: 0 0 0.4rem;
    color: inherit;
  }
  ul {
    margin: 0;
    padding-left: 1.1rem;
  }
  li + li {
    margin-top: 0.35rem;
  }
</style>
