<script lang="ts">
  import { formatKm, formatPace } from "@finisher/core/format";
  import type { Lang, Week } from "@finisher/core";
  import { T } from "../lib/i18n";

  let {
    lang,
    week,
    range = "",
    current = false,
    done = null,
    onToggle = undefined,
  }: {
    lang: Lang;
    week: Week;
    /** datumski razpon tedna, npr. "16. 11. do 22. 11." */
    range?: string;
    current?: boolean;
    /** opravljene postavke; null pomeni brez kljukic (predogled) */
    done?: Set<string> | null;
    onToggle?: (item: string, value: boolean) => void;
  } = $props();

  const t = $derived(T[lang]);
  const rangeText = (min: number, max: number) =>
    min === max ? formatPace(min) : `${formatPace(min)}–${formatPace(max)}`;
  const itemKey = (i: number) => `w${week.number}s${i + 1}`;
</script>

<article class="week" class:current id="teden-{week.number}" aria-current={current ? "date" : undefined}>
  <header>
    <h3>{t.week(week.number)}</h3>
    <span class="kind">{t.kinds[week.kind]}</span>
    <span class="total">{formatKm(week.totalKm, lang)} km</span>
    {#if range}<span class="range">{current ? `${t.my.thisWeek}, ` : ""}{range}</span>{/if}
  </header>
  <ol>
    {#each week.sessions as s, i}
      {@const key = itemKey(i)}
      {@const checked = done?.has(key) ?? false}
      <li class="s-{s.type}" class:checked>
        {#if done}
          <input
            type="checkbox"
            id={key}
            {checked}
            onchange={(e) => onToggle?.(key, (e.currentTarget as HTMLInputElement).checked)}
            aria-label={t.my.markDone(`${t.week(week.number)}, ${t.run(i + 1)}, ${t.sessions[s.type]}`)}
          />
        {/if}
        <label class="body" for={done ? key : undefined}>
          <span class="n">{t.run(i + 1)}</span>
          <span class="name">{t.sessions[s.type]}</span>
          <span class="detail">
            {#if s.type === "tempo" && s.qualityKm}
              {t.tempoDetail(s.qualityKm, formatPace(s.pace.min))}{t.perKm}
            {:else if s.type === "intervals" && s.reps}
              {t.intervalDetail(s.reps, formatPace(s.pace.min))}{t.perKm}
            {:else}
              {rangeText(s.pace.min, s.pace.max)}{t.perKm}
            {/if}
            {#if s.strides}<span class="extra">{t.stridesDetail(s.strides)}</span>{/if}
            {#if s.racePaceKm && s.racePace}<span class="extra">{t.racePaceDetail(s.racePaceKm, formatPace(s.racePace))}{t.perKm}</span>{/if}
          </span>
        </label>
        <span class="km">{formatKm(s.km, lang)}<small> km</small></span>
      </li>
    {/each}
  </ol>
</article>

<style>
  .week {
    background: var(--surface);
    border-radius: var(--r-ui);
    padding: 1rem 1rem 0.5rem;
    scroll-margin-top: 1rem;
  }
  .week.current {
    outline: 3px solid var(--bib-blue);
  }
  header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.2rem 0.6rem;
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
  .range {
    flex-basis: 100%;
    color: var(--ink-2);
    font-size: 0.92rem;
  }
  .current .range {
    color: var(--bib-blue);
    font-weight: 700;
  }
  ol {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 0 0.65rem calc(1rem - 4px);
    margin-left: -1rem;
    border-top: 1px solid var(--line);
    border-left: 4px solid var(--c);
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
  input[type="checkbox"] {
    flex: none;
    width: 28px;
    height: 28px;
    margin: 0;
    accent-color: var(--bib-blue);
    cursor: pointer;
  }
  .body {
    flex: 1;
    min-width: 0;
    display: grid;
    cursor: inherit;
  }
  input + .body {
    cursor: pointer;
  }
  .n {
    font-size: 0.85rem;
    color: var(--ink-2);
  }
  .name {
    font-weight: 700;
  }
  .detail {
    color: var(--ink-2);
    font-size: 0.95rem;
  }
  .extra {
    display: block;
    color: var(--ink);
  }
  .km {
    flex: none;
    font: 800 2rem/1 var(--display);
    font-variant-numeric: tabular-nums;
  }
  .km small {
    font-size: 1rem;
    font-weight: 700;
  }
  .checked .name,
  .checked .km {
    color: var(--ink-2);
  }
  .checked .name {
    text-decoration: line-through;
    text-decoration-thickness: 2px;
  }
</style>
