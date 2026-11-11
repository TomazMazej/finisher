<script lang="ts">
  import type { Lang, Week } from "@finisher/core";
  import { T } from "../lib/i18n";

  let { lang, weeks, peakKm, shown }: { lang: Lang; weeks: Pick<Week, "number" | "kind" | "totalKm">[]; peakKm: number; shown: number } = $props();
  const t = $derived(T[lang]);
  const max = $derived(Math.max(1, ...weeks.map((w) => w.totalKm)));
</script>

<section class="vol" aria-labelledby="vol-h">
  <h2 id="vol-h">{t.volumeTitle}</h2>
  <p class="intro">{t.volumeIntro(weeks.length)}</p>
  <div class="bars" role="img" aria-label={t.peak(peakKm)}>
    {#each weeks as w, i}
      <span
        class="bar k-{w.kind}"
        class:open={i < shown}
        style:height="{Math.max(6, (w.totalKm / max) * 100)}%"
        title="{t.week(w.number)}: {Math.round(w.totalKm)} km"
      ></span>
    {/each}
  </div>
  <div class="foot">
    <span>{t.peak(peakKm)}</span>
    {#if weeks.length > shown}<span class="locked">{t.lockedWeeks(weeks.length - shown)}</span>{/if}
  </div>
</section>

<style>
  .vol h2 {
    font-size: 2rem;
  }
  .intro {
    margin: 0.3rem 0 0.8rem;
    color: var(--ink-2);
    max-width: 60ch;
  }
  .bars {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 120px;
    border-bottom: 2px solid var(--ink);
  }
  .bar {
    flex: 1;
    border-radius: 3px 3px 0 0;
    background: var(--line);
  }
  .bar.open {
    background: var(--bib-blue);
  }
  .bar.k-race {
    background: var(--s-race);
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.25rem 1rem;
    margin-top: 0.5rem;
    font-weight: 700;
  }
  .locked {
    color: var(--ink-2);
    font-weight: 400;
  }
</style>
