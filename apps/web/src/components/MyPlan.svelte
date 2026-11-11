<script lang="ts">
  import { fuelPlan, splits } from "@finisher/core/fuel";
  import { formatDuration, formatKm } from "@finisher/core/format";
  import type { Lang } from "@finisher/core";
  import { T } from "../lib/i18n";
  import { CHECKLIST, EXERCISES } from "../lib/content";
  import type { FullPlanResponse } from "../lib/types";
  import Bib from "./Bib.svelte";
  import WeekCard from "./WeekCard.svelte";
  import FuelLine from "./FuelLine.svelte";

  type DistKey = "10" | "21.0975" | "42.195";
  type Loaded = Extract<FullPlanResponse, { ok: true }>;

  const token = new URLSearchParams(location.search).get("t") ?? "";

  let lang = $state<Lang>("sl");
  let data = $state<Loaded | null>(null);
  let error = $state<Exclude<FullPlanResponse, { ok: true }>["error"] | null>(null);
  let done = $state(new Set<string>());
  let saveError = $state(false);

  const t = $derived(T[lang]);

  async function load() {
    try {
      const res = await fetch(`/api/plan?t=${encodeURIComponent(token)}&open=1`, { cache: "no-store" });
      const body = (await res.json()) as FullPlanResponse;
      if (!body.ok) {
        error = body.error;
        return;
      }
      data = body;
      done = new Set(body.done);
      try {
        const saved = localStorage.getItem("lang");
        lang = saved === "sl" || saved === "en" ? saved : body.lang;
      } catch {
        lang = body.lang;
      }
    } catch {
      error = "NETWORK";
    }
  }
  load();

  $effect(() => {
    document.documentElement.lang = lang;
  });

  function setLang(l: Lang) {
    lang = l;
    try {
      localStorage.setItem("lang", l);
    } catch {}
  }

  // Kljukica se pokaže takoj, ob napaki pri shranjevanju se vrne nazaj.
  async function toggle(item: string, value: boolean) {
    const next = new Set(done);
    if (value) next.add(item);
    else next.delete(item);
    done = next;
    saveError = false;
    try {
      const res = await fetch(`/api/progress?t=${encodeURIComponent(token)}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ item, done: value }),
      });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      const back = new Set(done);
      if (value) back.delete(item);
      else back.add(item);
      done = back;
      saveError = true;
    }
  }

  // Tedni so poravnani na dan tekme: zadnji teden se konča na dan tekme.
  const DAY = 86_400_000;
  const utc = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
  const fmt = $derived(new Intl.DateTimeFormat(t.locale, { day: "numeric", month: "numeric", timeZone: "UTC" }));
  function weekSpan(n: number, total: number, race: string) {
    const end = utc(race) - 7 * (total - n) * DAY;
    return { start: end - 6 * DAY, end };
  }
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  const totalRuns = $derived(data ? data.weeks.reduce((a, w) => a + w.sessions.length, 0) : 0);
  const doneRuns = $derived([...done].filter((k) => k.startsWith("w")).length);
  const currentWeek = $derived.by(() => {
    if (!data) return -1;
    const n = data.weeks.length;
    return data.weeks.findIndex((w) => {
      const s = weekSpan(w.number, n, data!.input.raceDate);
      return today >= s.start && today <= s.end;
    });
  });

  const fuel = $derived(
    data ? fuelPlan({ distanceKm: data.input.distanceKm, targetMinutes: data.input.targetMinutes, ...data.input.fuel }) : null,
  );
  const splitRows = $derived(data ? splits(data.input.distanceKm, data.input.targetMinutes) : []);
  const checklist = $derived.by(() => {
    let i = 0;
    return CHECKLIST[lang].map((g) => ({ title: g.title, items: g.items.map((text) => ({ text, key: `c${i++}` })) }));
  });

  // Ob prvem nalaganju skoči na trenutni teden.
  let scrolled = false;
  $effect(() => {
    if (!scrolled && data && currentWeek > 0) {
      scrolled = true;
      requestAnimationFrame(() => document.getElementById(`teden-${data!.weeks[currentWeek]!.number}`)?.scrollIntoView());
    }
  });
</script>

<div class="page">
  <header class="top">
    <a class="logo" href="/">Finisher</a>
    <div class="seg" role="group" aria-label={t.langLabel}>
      <button type="button" aria-pressed={lang === "sl"} onclick={() => setLang("sl")}>SL</button>
      <button type="button" aria-pressed={lang === "en"} onclick={() => setLang("en")}>EN</button>
    </div>
  </header>

  {#if error}
    <p class="msg" role="alert">{t.my.errors[error]}</p>
  {:else if !data}
    <p class="muted" aria-live="polite">{t.my.loading}</p>
  {:else}
    <div class="layout">
      <aside class="left">
        <h1>{t.my.title}</h1>
        <Bib
          {lang}
          dist={String(data.input.distanceKm) as DistKey}
          targetMinutes={data.input.targetMinutes}
          raceDate={data.input.raceDate}
          weeks={data.weeks.length - Math.max(0, currentWeek)}
        />
        <div class="progress" aria-live="polite">
          <div class="bar" style:--p="{totalRuns ? (doneRuns / totalRuns) * 100 : 0}%"></div>
          <p>{t.my.progress(doneRuns, totalRuns)}</p>
        </div>
        <p class="muted small">{t.my.keepLink}</p>
      </aside>

      <main class="right">
        {#if saveError || data.warnings.length}
          <div class="msgs">
            {#if saveError}<p class="msg" role="alert">{t.my.saveFailed}</p>{/if}
            {#each data.warnings as w}
              <p class="msg">{t.warnings[w.code](w.value)}</p>
            {/each}
          </div>
        {/if}

        <section aria-labelledby="weeks-h">
          <h2 id="weeks-h">{t.my.weeksTitle}</h2>
          <div class="weeks">
            {#each data.weeks as week, k (week.number)}
              {@const span = weekSpan(week.number, data.weeks.length, data.input.raceDate)}
              <WeekCard
                {lang}
                {week}
                range={t.my.weekRange(fmt.format(span.start), fmt.format(span.end))}
                current={k === currentWeek}
                {done}
                onToggle={toggle}
              />
            {/each}
          </div>
        </section>

        {#if fuel?.ok}
          <section aria-labelledby="fuel-h">
            <h2 id="fuel-h">{t.fuelTitle}</h2>
            {#each fuel.warnings as w}<p class="msg">{t.fuelWarnings[w]}</p>{/each}
            {#if fuel.gels.length}
              <p class="fuel-sum">
                <b>{t.gels(fuel.gels.length)}</b>
                {#if fuel.intervalMin}<span>{t.every(Math.round(fuel.intervalMin))}</span>{/if}
                <span>{t.carbsTotal(Math.round(fuel.totalCarbs))}</span>
              </p>
              <FuelLine {lang} gels={fuel.gels} distanceKm={data.input.distanceKm} targetMinutes={data.input.targetMinutes} />
            {/if}
            <h3>{t.my.splits}</h3>
            <table class="splits">
              <tbody>
                {#each splitRows as s}
                  <tr><th scope="row">{formatKm(s.km, lang)} km</th><td>{formatDuration(s.minutes, true)}</td></tr>
                {/each}
              </tbody>
            </table>
          </section>
        {/if}

        <section aria-labelledby="ex-h">
          <h2 id="ex-h">{t.my.exercisesTitle}</h2>
          <div class="ex">
            <div>
              <h3>{t.my.strength}</h3>
              <ul>{#each EXERCISES[lang].strength as e}<li><span>{e.name}</span><b>{e.dose}</b></li>{/each}</ul>
            </div>
            <div>
              <h3>{t.my.stretch}</h3>
              <ul>{#each EXERCISES[lang].stretch as e}<li><span>{e.name}</span><b>{e.dose}</b></li>{/each}</ul>
            </div>
          </div>
          <p class="muted small">{EXERCISES[lang].note}</p>
        </section>

        <section aria-labelledby="cl-h">
          <h2 id="cl-h">{t.my.checklistTitle}</h2>
          {#each checklist as g}
            <h3>{g.title}</h3>
            <ul class="check">
              {#each g.items as it}
                <li class:checked={done.has(it.key)}>
                  <input
                    type="checkbox"
                    id={it.key}
                    checked={done.has(it.key)}
                    onchange={(e) => toggle(it.key, (e.currentTarget as HTMLInputElement).checked)}
                  />
                  <label for={it.key}>{it.text}</label>
                </li>
              {/each}
            </ul>
          {/each}
        </section>

        <p class="muted small">{t.disclaimer}</p>
      </main>
    </div>
  {/if}
</div>

<style>
  .page {
    max-width: 1120px;
    margin: 0 auto;
    padding: 0.75rem 1rem 3rem;
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
  }
  .logo {
    font: 800 1.6rem/1 var(--display);
    color: var(--ink);
    text-decoration: none;
  }
  .seg {
    display: flex;
    background: var(--surface);
    border: 2px solid var(--line);
    border-radius: var(--r-ui);
    padding: 3px;
    gap: 3px;
  }
  .seg button {
    min-height: 36px;
    padding: 0 0.7rem;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: var(--ink);
    font: 700 0.9rem var(--text);
    cursor: pointer;
  }
  .seg button[aria-pressed="true"] {
    background: var(--bib-blue);
    color: var(--bib-blue-ink);
  }
  .layout {
    display: grid;
    gap: 2.5rem;
  }
  @media (min-width: 960px) {
    .layout {
      grid-template-columns: minmax(340px, 400px) 1fr;
      gap: 3.5rem;
      align-items: start;
    }
    .left {
      position: sticky;
      top: 1rem;
    }
  }
  .right {
    display: grid;
    gap: 2.5rem;
    min-width: 0;
  }
  h1 {
    font-size: clamp(2.6rem, 9vw, 3.4rem);
    margin-bottom: 1rem;
  }
  h2 {
    font-size: 2rem;
    margin-bottom: 0.8rem;
  }
  h3 {
    font-size: 1.35rem;
    margin: 1.2rem 0 0.4rem;
  }
  .weeks {
    display: grid;
    gap: 1rem;
  }
  @media (min-width: 1200px) {
    .weeks {
      grid-template-columns: 1fr 1fr;
    }
  }
  .progress {
    margin-top: 1.5rem;
  }
  .progress .bar {
    height: 10px;
    border-radius: 5px;
    background: linear-gradient(to right, var(--bib-blue) var(--p), var(--line) var(--p));
  }
  .progress p {
    margin: 0.4rem 0 0;
    font-weight: 700;
  }
  .msgs {
    display: grid;
    gap: 0.5rem;
  }
  .msg {
    margin: 0;
    padding: 0.75rem 0.9rem;
    border-radius: var(--r-ui);
    background: var(--amber-bg);
    color: var(--amber);
  }
  .muted {
    color: var(--ink-2);
  }
  .small {
    font-size: 0.9rem;
    max-width: 70ch;
  }
  .fuel-sum {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1.25rem;
    margin: 0 0 0.5rem;
  }
  .fuel-sum span {
    color: var(--ink-2);
  }
  .splits {
    border-collapse: collapse;
    min-width: 220px;
  }
  .splits th,
  .splits td {
    padding: 0.35rem 1.5rem 0.35rem 0;
    border-bottom: 1px solid var(--line);
    text-align: left;
    font-variant-numeric: tabular-nums;
  }
  .splits th {
    font-weight: 400;
    color: var(--ink-2);
  }
  .ex {
    display: grid;
    gap: 0 2rem;
  }
  @media (min-width: 700px) {
    .ex {
      grid-template-columns: 1fr 1fr;
    }
  }
  .ex ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .ex li {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.45rem 0;
    border-bottom: 1px solid var(--line);
  }
  .ex b {
    white-space: nowrap;
  }
  .check {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .check li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--line);
  }
  .check input {
    flex: none;
    width: 26px;
    height: 26px;
    margin: 0;
    accent-color: var(--bib-blue);
    cursor: pointer;
  }
  .check label {
    cursor: pointer;
  }
  .check .checked label {
    color: var(--ink-2);
    text-decoration: line-through;
  }
</style>
