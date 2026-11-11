<script lang="ts">
  import { formatKm, formatPace } from "@finisher/core/format";
  import type { Lang, Week } from "@finisher/core";
  import { T } from "../lib/i18n";

  let { lang, week }: { lang: Lang; week: Week } = $props();
  const t = $derived(T[lang]);
  const range = (min: number, max: number) =>
    min === max ? formatPace(min) : `${formatPace(min)}–${formatPace(max)}`;
</script>

<article class="week">
  <header>
    <h3>{t.week(week.number)}</h3>
    <span class="kind">{t.kinds[week.kind]}</span>
    <span class="total">{formatKm(week.totalKm, lang)} km</span>
  </header>
  <ol>
    {#each week.sessions as s, i}
      <li class="s-{s.type}">
        <span class="n">{t.run(i + 1)}</span>
        <span class="name">{t.sessions[s.type]}</span>
        <span class="km">{formatKm(s.km, lang)}<small> km</small></span>
        <span class="detail">
          {#if s.type === "tempo" && s.qualityKm}
            {t.tempoDetail(s.qualityKm, formatPace(s.pace.min))}{t.perKm}
          {:else if s.type === "intervals" && s.reps}
            {t.intervalDetail(s.reps, formatPace(s.pace.min))}{t.perKm}
          {:else}
            {range(s.pace.min, s.pace.max)}{t.perKm}
          {/if}
        </span>
      </li>
    {/each}
  </ol>
</article>

<style>
  .week {
    background: var(--surface);
    border-radius: var(--r-ui);
    padding: 1rem 1rem 0.5rem;
  }
  header {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    margin-bottom: 0.4rem;
  }
  h3 {
    font-size: 1.6rem;
  }
  .kind {
    color: var(--ink-2);
  }
  .total {
    margin-left: auto;
    font: 700 1.3rem/1 var(--display);
  }
  ol {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "n km"
      "name km"
      "detail detail";
    column-gap: 1rem;
    padding: 0.65rem 0 0.65rem 0.85rem;
    border-top: 1px solid var(--line);
    border-left: 4px solid var(--c);
    margin-left: -1rem;
    padding-left: calc(1rem - 4px);
  }
  li:first-child {
    border-top: 0;
  }
  .s-easy {
    --c: var(--s-easy);
  }
  .s-tempo {
    --c: var(--s-tempo);
  }
  .s-intervals {
    --c: var(--s-intervals);
  }
  .s-long {
    --c: var(--s-long);
  }
  .s-race {
    --c: var(--s-race);
  }
  .n {
    grid-area: n;
    font-size: 0.85rem;
    color: var(--ink-2);
  }
  .name {
    grid-area: name;
    font-weight: 700;
  }
  .km {
    grid-area: km;
    align-self: center;
    font: 800 2rem/1 var(--display);
    font-variant-numeric: tabular-nums;
  }
  .km small {
    font-size: 1rem;
    font-weight: 700;
  }
  .detail {
    grid-area: detail;
    color: var(--ink-2);
    font-size: 0.95rem;
  }
</style>
