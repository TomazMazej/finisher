<script lang="ts">
  import { formatKm } from "@finisher/core/format";
  import { sessionDetail } from "../lib/session-text";
  import type { Lang, Week } from "@finisher/core";
  import { T } from "../lib/i18n";

  let {
    lang,
    week,
    range = "",
    current = false,
    done = null,
    onToggle = undefined,
    dates = null,
    collapsed = false,
  }: {
    lang: Lang;
    week: Week;
    /** datumski razpon tedna, npr. "16. 11. do 22. 11." */
    range?: string;
    current?: boolean;
    /** opravljene postavke; null pomeni brez kljukic (predogled) */
    done?: Set<string> | null;
    onToggle?: (item: string, value: boolean) => void;
    /** datum vsake seanse (YYYY-MM-DD), če je razpored znan */
    dates?: string[] | null;
    /** začetno zaprt teden (na strani "moj načrt" pretekli in oddaljeni tedni) */
    collapsed?: boolean;
  } = $props();

  // svelte-ignore state_referenced_locally
  let open = $state(!collapsed);
  const doneCount = $derived(done ? week.sessions.filter((_, i) => done!.has(`w${week.number}s${i + 1}`)).length : 0);
  const allDone = $derived(!!done && doneCount === week.sessions.length);

  const t = $derived(T[lang]);
  const dayFmt = $derived(
    new Intl.DateTimeFormat(t.locale, { weekday: "short", day: "numeric", month: "numeric", timeZone: "UTC" }),
  );
  const day = (iso: string) => dayFmt.format(new Date(iso + "T00:00:00Z"));
  const itemKey = (i: number) => `w${week.number}s${i + 1}`;
</script>

<article class="week" class:current class:closed={!open} id="teden-{week.number}" aria-current={current ? "date" : undefined}>
  <header>
    <h3>
      {#if collapsed}
        <button type="button" class="toggle" aria-expanded={open} onclick={() => (open = !open)}>
          {t.week(week.number)}
          <svg class="chev" class:up={open} viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      {:else}
        {t.week(week.number)}
      {/if}
    </h3>
    <span class="kind">{t.kinds[week.kind]}</span>
    <span class="total">{formatKm(week.totalKm, lang)} km</span>
    {#if range}<span class="range">{current ? `${t.my.thisWeek}, ` : ""}{range}</span>{/if}
    {#if done && (open || doneCount > 0)}
      <span class="count" class:all={allDone}>{t.my.weekDone(doneCount, week.sessions.length)}</span>
    {/if}
  </header>
  {#if open}
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
          <span class="n">{dates?.[i] ? day(dates[i]!) : t.run(i + 1)}</span>
          <span class="name">{t.sessions[s.type]}</span>
          <span class="detail">
            {#each sessionDetail(t, s) as line, j}
              <span class:extra={j > 0}>{line}</span>
            {/each}
          </span>
        </label>
        <span class="km">{formatKm(s.km, lang)}<small> km</small></span>
      </li>
    {/each}
  </ol>
  {/if}
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
  .toggle {
    all: unset;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
    min-height: 44px;
  }
  .toggle:focus-visible {
    outline: 3px solid var(--bib-blue);
    outline-offset: 2px;
    border-radius: 4px;
  }
  .chev {
    transition: transform 0.15s ease;
  }
  .chev.up {
    transform: rotate(180deg);
  }
  @media (prefers-reduced-motion: reduce) {
    .chev {
      transition: none;
    }
  }
  .closed {
    padding-top: 0.35rem;
    padding-bottom: 0.35rem;
  }
  .closed header {
    margin-bottom: 0;
  }
  .closed h3 {
    font-size: 1.3rem;
  }
  .closed .total {
    font-size: 1.1rem;
  }
  .closed header {
    align-items: center;
  }
  .closed .kind {
    display: none;
  }
  .closed .range,
  .closed .count {
    flex-basis: auto;
    order: 1;
    font-size: 0.85rem;
  }
  .closed .total {
    order: 2;
  }
  .closed .count::before {
    content: "· ";
  }
  .count {
    flex-basis: 100%;
    font-size: 0.85rem;
    color: var(--ink-2);
  }
  .count.all {
    color: var(--ink);
    font-weight: 700;
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
  .detail span {
    display: block;
  }
  .detail .extra {
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
