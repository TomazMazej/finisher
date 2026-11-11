<script lang="ts">
  import { fuelPlan } from "@finisher/core/fuel";
  import { weeksUntil } from "@finisher/core/dates";
  import type { Lang } from "@finisher/core";
  import { T } from "../lib/i18n";
  import { fetchPreview } from "../lib/api";
  import { PREVIEW_WEEKS, type Preview } from "../lib/types";
  import Bib from "./Bib.svelte";
  import WeekCard from "./WeekCard.svelte";
  import VolumeBars from "./VolumeBars.svelte";
  import FuelLine from "./FuelLine.svelte";

  type DistKey = "10" | "21.0975" | "42.195";
  type Theme = "auto" | "light" | "dark";

  const isoLocal = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const today = isoLocal(new Date());
  const inWeeks = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n * 7);
    return isoLocal(d);
  };

  function initialLang(): Lang {
    try {
      const s = localStorage.getItem("lang");
      if (s === "sl" || s === "en") return s;
    } catch {}
    return navigator.language?.startsWith("sl") ? "sl" : navigator.language?.startsWith("en") ? "en" : "sl";
  }
  function initialTheme(): Theme {
    try {
      const s = localStorage.getItem("theme");
      if (s === "light" || s === "dark") return s;
    } catch {}
    return "auto";
  }

  let lang = $state<Lang>(initialLang());
  let theme = $state<Theme>(initialTheme());
  let dist = $state<DistKey>("42.195");
  let hours = $state(4);
  let minutes = $state(0);
  let raceDate = $state(inWeeks(16));
  let weeklyKm = $state(30);
  let days = $state(4);
  let carbs = $state(60);
  let gelCarbs = $state(25);
  let drink = $state(15);
  let firstGel = $state(30);

  const t = $derived(T[lang]);
  const distanceKm = $derived(Number(dist));
  const targetMinutes = $derived((Number(hours) || 0) * 60 + (Number(minutes) || 0));
  const weeks = $derived(raceDate ? weeksUntil(today, raceDate) : null);

  // Predogled izračuna strežnik. Ob spremembi vnosa počakamo 250 ms in prekinemo prejšnjo zahtevo.
  let plan = $state<Preview | null>(null);
  let loading = $state(false);
  let tracked = false;
  $effect(() => {
    const req = {
      distanceKm,
      targetMinutes,
      raceDate,
      today,
      weeklyKm: Number(weeklyKm),
      daysPerWeek: Number(days),
      lang,
    };
    if (!raceDate) {
      plan = null;
      return;
    }
    const ctrl = new AbortController();
    loading = true;
    const timer = setTimeout(async () => {
      try {
        const track = !tracked;
        const res = await fetchPreview({ ...req, track }, ctrl.signal);
        if (track && res.ok) tracked = true;
        plan = res;
      } catch {
        /* prekinjeno */
      } finally {
        if (!ctrl.signal.aborted) loading = false;
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  });
  const fuel = $derived(
    fuelPlan({
      distanceKm,
      targetMinutes,
      carbsPerHour: Number(carbs),
      gelCarbs: Number(gelCarbs),
      drinkPerHour: Number(drink),
      firstGelMin: Number(firstGel),
    }),
  );

  $effect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem("lang", lang);
    } catch {}
  });
  $effect(() => {
    const root = document.documentElement;
    if (theme === "auto") delete root.dataset.theme;
    else root.dataset.theme = theme;
    try {
      if (theme === "auto") localStorage.removeItem("theme");
      else localStorage.setItem("theme", theme);
    } catch {}
  });

  const DISTS: DistKey[] = ["10", "21.0975", "42.195"];
  const DAYS = [2, 3, 4, 5, 6];
  // Smiseln privzeti ciljni čas ob menjavi razdalje.
  const DEFAULT_TIME: Record<DistKey, [number, number]> = { "10": [0, 55], "21.0975": [2, 0], "42.195": [4, 0] };
  function pickDist(d: DistKey) {
    if (d === dist) return;
    dist = d;
    [hours, minutes] = DEFAULT_TIME[d];
  }
  const stepKm = (delta: number) => (weeklyKm = Math.min(150, Math.max(5, (Number(weeklyKm) || 0) + delta)));
</script>

<div class="page">
  <header class="top">
    <span class="logo">Finisher</span>
    <div class="controls">
      <div class="seg small" role="group" aria-label={t.langLabel}>
        <button type="button" aria-pressed={lang === "sl"} onclick={() => (lang = "sl")}>SL</button>
        <button type="button" aria-pressed={lang === "en"} onclick={() => (lang = "en")}>EN</button>
      </div>
      <label class="visually-hidden" for="theme">{t.themeLabel}</label>
      <select id="theme" class="theme" bind:value={theme}>
        <option value="auto">{t.themeAuto}</option>
        <option value="light">{t.themeLight}</option>
        <option value="dark">{t.themeDark}</option>
      </select>
    </div>
  </header>

  <div class="layout">
    <div class="left">
      <section class="hero">
        <h1>{t.tagline}</h1>
        <p class="intro">{t.intro}</p>
        <Bib {lang} {dist} {targetMinutes} {raceDate} {weeks} />
      </section>

      <form class="form" onsubmit={(e) => e.preventDefault()}>
        <fieldset>
          <legend>{t.raceSection}</legend>

          <div class="field">
            <span class="label" id="dist-l">{t.distance}</span>
            <div class="seg" role="radiogroup" aria-labelledby="dist-l">
              {#each DISTS as d}
                <button type="button" role="radio" aria-checked={dist === d} onclick={() => pickDist(d)}>
                  {t.distances[d]}
                </button>
              {/each}
            </div>
          </div>

          <div class="field">
            <span class="label" id="time-l">{t.targetTime}</span>
            <div class="time" role="group" aria-labelledby="time-l">
              <label>
                <input type="number" inputmode="numeric" min="0" max="12" bind:value={hours} />
                <span>{t.hours}</span>
              </label>
              <label>
                <input type="number" inputmode="numeric" min="0" max="59" bind:value={minutes} />
                <span>{t.minutes}</span>
              </label>
            </div>
          </div>

          <div class="field">
            <label class="label" for="race-date">{t.raceDate}</label>
            <input id="race-date" type="date" min={today} bind:value={raceDate} />
          </div>
        </fieldset>

        <fieldset>
          <legend>{t.trainingSection}</legend>

          <div class="field">
            <label class="label" for="wk">{t.weeklyKm}</label>
            <div class="stepper">
              <button type="button" aria-label="−5 km" onclick={() => stepKm(-5)}>−</button>
              <input id="wk" type="number" inputmode="numeric" min="5" max="150" bind:value={weeklyKm} aria-describedby="wk-h" />
              <button type="button" aria-label="+5 km" onclick={() => stepKm(5)}>+</button>
            </div>
            <p class="hint" id="wk-h">{t.weeklyKmHint}</p>
          </div>

          <div class="field">
            <span class="label" id="days-l">{t.days}</span>
            <div class="seg" role="radiogroup" aria-labelledby="days-l" aria-describedby="days-h">
              {#each DAYS as d}
                <button type="button" role="radio" aria-checked={days === d} onclick={() => (days = d)}>{d}</button>
              {/each}
            </div>
            <p class="hint" id="days-h">{t.daysHint}</p>
          </div>
        </fieldset>
      </form>
    </div>

    <div class="right" aria-live="polite" aria-busy={loading}>
      {#if !raceDate}
        <p class="msg">{t.errors.NO_DATE}</p>
      {:else if !plan}
        <p class="loading">…</p>
      {:else if !plan.ok}
        <p class="msg">{t.errors[plan.error]}</p>
      {:else}
        {#each plan.warnings as w}
          <p class="msg">{t.warnings[w.code](w.value)}</p>
        {/each}

        <section aria-labelledby="pv-h">
          <h2 id="pv-h">{t.previewTitle}</h2>
          <p class="intro">{t.previewIntro}</p>
          <div class="weeks">
            {#each plan.weeks as week (week.number)}
              <WeekCard {lang} {week} />
            {/each}
          </div>
        </section>

        <VolumeBars {lang} weeks={plan.totals} peakKm={Math.round(plan.peakKm)} shown={PREVIEW_WEEKS} />
      {/if}

      {#if fuel.ok}
        <section aria-labelledby="fuel-h">
          <h2 id="fuel-h">{t.fuelTitle}</h2>
          <p class="intro">{t.fuelIntro}</p>
          {#each fuel.warnings as w}
            <p class="msg">{t.fuelWarnings[w]}</p>
          {/each}
          {#if fuel.gels.length}
            <p class="fuel-sum">
              <b>{t.gels(fuel.gels.length)}</b>
              {#if fuel.intervalMin}<span>{t.every(Math.round(fuel.intervalMin))}</span>{/if}
              <span>{t.carbsTotal(Math.round(fuel.totalCarbs))}</span>
            </p>
            <FuelLine {lang} gels={fuel.gels} {distanceKm} {targetMinutes} />
          {/if}
          <details class="fuel-set">
            <summary>{t.fuelSettings}</summary>
            <div class="grid">
              <label>{t.carbs}<input type="number" inputmode="numeric" min="0" max="120" step="5" bind:value={carbs} /></label>
              <label>{t.gelCarbs}<input type="number" inputmode="numeric" min="5" max="60" bind:value={gelCarbs} /></label>
              <label>{t.drink}<input type="number" inputmode="numeric" min="0" max="90" step="5" bind:value={drink} /></label>
              <label>{t.firstGel}<input type="number" inputmode="numeric" min="0" max="90" step="5" bind:value={firstGel} /></label>
            </div>
          </details>
        </section>
      {/if}

      <section class="buy" aria-labelledby="buy-h">
        <h2 id="buy-h">{t.buyTitle}</h2>
        <ul>
          {#each t.buyItems as item}<li>{item}</li>{/each}
        </ul>
        <button type="button" class="cta" disabled={!plan?.ok}>{t.buyCta}</button>
        <p class="hint">{t.buyNote}</p>
      </section>

      <p class="disc">{t.disclaimer}</p>
    </div>
  </div>
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
    gap: 1rem;
    margin-bottom: 1.25rem;
  }
  .logo {
    font: 800 1.6rem/1 var(--display);
  }
  .controls {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  .theme {
    width: auto;
    padding: 0.45rem 0.6rem;
  }

  .layout {
    display: grid;
    gap: 2.5rem;
  }
  @media (min-width: 960px) {
    .layout {
      grid-template-columns: minmax(360px, 440px) 1fr;
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

  .hero h1 {
    font-size: clamp(2.6rem, 9vw, 3.6rem);
  }
  .intro {
    margin: 0.5rem 0 1.25rem;
    color: var(--ink-2);
    max-width: 52ch;
  }
  h2 {
    font-size: 2rem;
  }

  .form {
    margin-top: 2rem;
    display: grid;
    gap: 1.5rem;
  }
  fieldset {
    border: 0;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 1.1rem;
  }
  legend {
    font: 800 1.5rem/1 var(--display);
    margin-bottom: 0.9rem;
    padding: 0;
  }
  .label,
  .grid label {
    display: block;
    font-weight: 700;
    margin-bottom: 0.35rem;
  }
  .hint {
    margin: 0.35rem 0 0;
    font-size: 0.92rem;
    color: var(--ink-2);
  }

  input,
  select {
    width: 100%;
    min-height: 48px;
    padding: 0.6rem 0.75rem;
    font: 700 1.1rem var(--text);
    color: var(--ink);
    background: var(--surface);
    border: 2px solid var(--line);
    border-radius: var(--r-ui);
  }
  input:focus-visible,
  select:focus-visible {
    border-color: var(--bib-blue);
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
    flex: 1;
    min-height: 44px;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: var(--ink);
    font: 700 1rem var(--text);
    cursor: pointer;
  }
  .seg button[aria-checked="true"],
  .seg button[aria-pressed="true"] {
    background: var(--bib-blue);
    color: var(--bib-blue-ink);
  }
  .seg.small button {
    min-height: 36px;
    padding: 0 0.7rem;
    font-size: 0.9rem;
  }

  .time {
    display: flex;
    gap: 0.75rem;
  }
  .time label {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .time span {
    color: var(--ink-2);
  }

  .stepper {
    display: grid;
    grid-template-columns: 52px 1fr 52px;
    gap: 0.5rem;
  }
  .stepper input {
    text-align: center;
  }
  .stepper button {
    min-height: 48px;
    border: 2px solid var(--line);
    border-radius: var(--r-ui);
    background: var(--surface);
    color: var(--ink);
    font: 700 1.4rem/1 var(--text);
    cursor: pointer;
  }

  .msg {
    margin: 0;
    padding: 0.75rem 0.9rem;
    border-radius: var(--r-ui);
    background: var(--amber-bg);
    color: var(--amber);
  }
  .right > .msg + .msg {
    margin-top: -2rem;
  }

  .right[aria-busy="true"] .weeks {
    opacity: 0.6;
    transition: opacity 150ms;
  }
  .loading {
    margin: 0;
    color: var(--ink-2);
  }
  .weeks {
    display: grid;
    gap: 1rem;
  }
  @media (min-width: 700px) {
    .weeks {
      grid-template-columns: 1fr 1fr;
    }
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
  .fuel-set {
    margin-top: 0.75rem;
  }
  .fuel-set summary {
    cursor: pointer;
    font-weight: 700;
    min-height: 44px;
    display: flex;
    align-items: center;
  }
  .grid {
    display: grid;
    gap: 1rem;
    margin-top: 0.5rem;
  }
  @media (min-width: 560px) {
    .grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  .buy {
    background: var(--surface);
    border: 2px solid var(--ink);
    border-radius: var(--r-ui);
    padding: 1.25rem;
  }
  .buy ul {
    margin: 0.75rem 0 1rem;
    padding-left: 1.2rem;
  }
  .buy li {
    margin: 0.3rem 0;
  }
  .cta {
    width: 100%;
    min-height: 56px;
    border: 0;
    border-radius: var(--r-ui);
    background: var(--bib-blue);
    color: var(--bib-blue-ink);
    font: 800 1.5rem/1 var(--display);
    cursor: pointer;
  }
  .cta:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .disc {
    margin: 0;
    font-size: 0.9rem;
    color: var(--ink-2);
    max-width: 70ch;
  }
</style>
