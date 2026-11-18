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
  import Notes from "./Notes.svelte";
  import { sessionDates } from "@finisher/core/schedule";
  import { download, planIcs } from "../lib/exports";
  import LegalLinks from "./LegalLinks.svelte";
  import { sessionDetail } from "../lib/session-text";

  type DistKey = "10" | "21.0975" | "42.195";
  type Loaded = Extract<FullPlanResponse, { ok: true }>;

  const token = new URLSearchParams(location.search).get("t") ?? "";

  let lang = $state<Lang>("sl");
  let data = $state<Loaded | null>(null);
  let error = $state<Exclude<FullPlanResponse, { ok: true }>["error"] | null>(null);
  let done = $state(new Set<string>());
  let saveError = $state(false);
  let busy = $state<"" | "ics" | "pdf">("");
  let exportError = $state(false);

  // Čista povezava do načrta (brez ?paid=1), ista v PDF, koledarju in polju za kopiranje.
  const planUrl = `${location.origin}${location.pathname}?t=${encodeURIComponent(token)}`;
  let copied = $state(false);
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(planUrl);
    } catch {
      const el = document.getElementById("plan-link") as HTMLInputElement | null;
      el?.select();
      document.execCommand?.("copy");
    }
    copied = true;
    setTimeout(() => (copied = false), 2500);
  }
  const orderId = token.split(".")[0] ?? "plan";
  const fileBase = () => `finisher-${data!.input.distanceKm}km-${data!.input.raceDate}`;

  async function exportIcs() {
    if (!data) return;
    exportError = false;
    try {
      download(planIcs(data, lang, orderId, planUrl), `${fileBase()}.ics`, "text/calendar;charset=utf-8");
    } catch {
      exportError = true;
    }
  }

  async function exportPdf() {
    if (!data || busy) return;
    busy = "pdf";
    exportError = false;
    try {
      const { buildPlanPdf } = await import("../lib/pdf");
      const bytes = await buildPlanPdf(data, lang, done, planUrl);
      download(bytes, `${fileBase()}.pdf`, "application/pdf");
    } catch (e) {
      console.error(e);
      exportError = true;
    } finally {
      busy = "";
    }
  }

  const t = $derived(T[lang]);

  // Pošlji povezavo do načrta na email (Resend; dokler ni vklopljen, strežnik vrne EMAIL_DISABLED).
  let sendTo = $state("");
  let sending = $state(false);
  let sendState = $state<"" | "SENT" | "INVALID_EMAIL" | "EMAIL_DISABLED" | "TOO_MANY" | "TOO_SOON" | "SEND_FAILED">("");
  async function sendLink() {
    if (sending || !sendTo.trim()) return;
    sending = true;
    sendState = "";
    try {
      const res = await fetch(`/api/send-link?t=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: sendTo.trim() }),
      });
      const body = (await res.json()) as { ok: boolean; error?: typeof sendState };
      sendState = body.ok ? "SENT" : (body.error ?? "SEND_FAILED");
    } catch {
      sendState = "SEND_FAILED";
    } finally {
      sending = false;
    }
  }

  // Po vrnitvi s Stripe lahko webhook zamudi nekaj sekund: počakaj do okoli 1 minute.
  const fromCheckout = new URLSearchParams(location.search).get("paid") === "1";
  let confirming = $state(false);
  let attempts = 0;

  async function load() {
    try {
      const res = await fetch(`/api/plan?t=${encodeURIComponent(token)}&open=1`, { cache: "no-store" });
      const body = (await res.json()) as FullPlanResponse;
      if (!body.ok) {
        if (body.error === "NOT_PAID" && fromCheckout && attempts++ < 30) {
          confirming = true;
          setTimeout(load, 2000);
          return;
        }
        confirming = false;
        error = body.error;
        return;
      }
      confirming = false;
      if (fromCheckout) history.replaceState(null, "", location.pathname + `?t=${encodeURIComponent(token)}`);
      data = body;
      done = new Set(body.done);
      if (body.email && !sendTo) sendTo = body.email;
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

  // Naslednji neopravljen trening od danes naprej (za kartico na vrhu).
  const todayIso = new Date(today).toISOString().slice(0, 10);
  const nextRun = $derived.by(() => {
    if (!data) return null;
    for (const w of data.weeks) {
      const ds = sessionDates(w, data.weeks.length, data.input.raceDate, data.planStart);
      for (let i = 0; i < w.sessions.length; i++) {
        const key = `w${w.number}s${i + 1}`;
        if (!done.has(key) && ds[i]! >= todayIso) return { key, week: w.number, s: w.sessions[i]!, date: ds[i]! };
      }
    }
    return null;
  });
  const longFmt = $derived(new Intl.DateTimeFormat(t.locale, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }));
  // Pri daljših načrtih so pretekli in oddaljeni tedni zaprti, odprta sta trenutni in naslednji.
  const isCollapsed = (k: number) => {
    if (!data || data.weeks.length <= 4) return false;
    const c = Math.max(0, currentWeek);
    return k < c || k > c + 1;
  };

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
    <p class="muted" aria-live="polite">{confirming ? t.my.confirming : t.my.loading}</p>
  {:else}
    <div class="layout">
      <aside class="left">
        <h1>{t.my.title}</h1>
        {#if fromCheckout}{@render keepBox()}{/if}
        <Bib
          {lang}
          dist={String(data.input.distanceKm) as DistKey}
          targetMinutes={data.input.targetMinutes}
          raceDate={data.input.raceDate}
          weeks={data.weeks.length - Math.max(0, currentWeek)}
          predicted={data.predictedMinutes}
        />
        {#if nextRun}
          {@const s = nextRun.s}
          <section class="next s-{s.type}" aria-labelledby="next-h">
            <p id="next-h" class="next-label">
              {nextRun.date === todayIso ? t.my.today : t.my.next}
              <span>{longFmt.format(new Date(nextRun.date + "T00:00:00Z"))}</span>
            </p>
            <div class="next-main">
              <div>
                <p class="next-name">{t.sessions[s.type]}</p>
                {#each sessionDetail(t, s) as line}<p class="next-detail">{line}</p>{/each}
              </div>
              <p class="next-km">{formatKm(s.km, lang)}<small> km</small></p>
            </div>
            <label class="next-done">
              <input type="checkbox" onchange={(e) => toggle(nextRun.key, (e.currentTarget as HTMLInputElement).checked)} />
              {t.my.markDoneShort}
            </label>
          </section>
        {:else if totalRuns && doneRuns === totalRuns}
          <p class="next all">{t.my.allDoneTitle}</p>
        {/if}
        <div class="progress" aria-live="polite">
          <div class="bar" style:--p="{totalRuns ? (doneRuns / totalRuns) * 100 : 0}%"></div>
          <p>{t.my.progress(doneRuns, totalRuns)}</p>
        </div>
        <div class="exports">
          <button type="button" class="btn" onclick={exportPdf} disabled={busy !== ""}>
            {busy === "pdf" ? t.my.preparing : t.my.pdf}
          </button>
          <button type="button" class="btn ghost" onclick={exportIcs}>{t.my.calendar}</button>
        </div>
        {#if exportError}<p class="msg" role="alert">{t.my.exportFailed}</p>{/if}
        <p class="muted small">{t.my.exportHint}</p>
        {#if !fromCheckout}{@render keepBox()}{/if}
        {#if data.emailEnabled}
        <form class="send" onsubmit={(e) => { e.preventDefault(); sendLink(); }}>
          <label class="small" for="send-to">{t.my.sendLabel}</label>
          <div class="send-row">
            <input id="send-to" type="email" autocomplete="email" bind:value={sendTo} />
            <button type="submit" class="btn ghost" disabled={sending || !sendTo.trim()}>{sending ? t.my.sending : t.my.send}</button>
          </div>
          {#if sendState}
            <p class={sendState === "SENT" ? "ok small" : "msg"} role="status">{t.my.sendResult[sendState]}</p>
          {/if}
        </form>
        {/if}
      </aside>

      <main class="right">
        {#if saveError}<p class="msg" role="alert">{t.my.saveFailed}</p>{/if}
        <Notes {lang} warnings={data.warnings} />

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
                collapsed={isCollapsed(k)}
                dates={sessionDates(week, data.weeks.length, data.input.raceDate, data.planStart)}
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
              <div class="fuel-wrap">
                <FuelLine {lang} gels={fuel.gels} distanceKm={data.input.distanceKm} targetMinutes={data.input.targetMinutes} />
              </div>
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
        <LegalLinks {lang} />
      </main>
    </div>
  {/if}
</div>

{#snippet keepBox()}
  <section class="keep" class:fresh={fromCheckout} aria-labelledby="keep-h">
    <h2 id="keep-h">{t.my.keepTitle}</h2>
    <p>{t.my.keepText}</p>
    <div class="keep-row">
      <input id="plan-link" type="text" readonly value={planUrl} onfocus={(e) => e.currentTarget.select()} aria-label={t.my.keepTitle} />
      <button type="button" class="btn" onclick={copyLink}>{copied ? t.my.copied : t.my.copy}</button>
    </div>
    <p class="small muted">{t.my.keepHelp}</p>
  </section>
{/snippet}

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
  .exports {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin-top: 1.25rem;
  }
  .btn {
    min-height: 48px;
    border: 2px solid var(--bib-blue);
    border-radius: var(--r-ui);
    background: var(--bib-blue);
    color: var(--bib-blue-ink);
    font: 700 1rem var(--text);
    cursor: pointer;
  }
  .btn.ghost {
    background: transparent;
    color: var(--ink);
  }
  .btn:disabled {
    opacity: 0.6;
    cursor: progress;
  }
  .exports + .msg {
    margin-top: 0.5rem;
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
  .send {
    display: grid;
    gap: 0.4rem;
    margin-top: 0.5rem;
  }
  .send-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.5rem;
  }
  .send-row input {
    min-height: 44px;
    min-width: 0;
    padding: 0 0.75rem;
    border: 2px solid var(--line);
    border-radius: var(--r-ui);
    background: var(--surface);
    color: var(--ink);
    font: inherit;
  }
  .send-row input:focus-visible {
    outline: 3px solid var(--bib-blue);
    outline-offset: 1px;
  }
  .ok {
    color: var(--ink);
    font-weight: 700;
  }
  .keep {
    margin: 0.75rem 0 1.25rem;
    padding: 1rem;
    border: 2px solid var(--line);
    border-radius: var(--r-ui);
    background: var(--surface);
  }
  .keep.fresh {
    border-color: var(--bib-blue);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--bib-blue) 18%, transparent);
  }
  .keep h2 {
    margin: 0 0 0.35rem;
    font-size: 1.1rem;
  }
  .keep p {
    margin: 0 0 0.6rem;
  }
  .keep-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .keep-row input {
    min-width: 0;
    min-height: 44px;
    padding: 0 0.6rem;
    border: 2px solid var(--line);
    border-radius: var(--r-ui);
    background: var(--mist);
    color: var(--ink);
    font: inherit;
    font-size: 0.85rem;
  }
  .next {
    margin-top: 1.25rem;
    padding: 0.9rem 1rem 0.8rem;
    background: var(--surface);
    border-radius: var(--r-ui);
    border-left: 6px solid var(--c, var(--bib-blue));
  }
  .next.all {
    font-weight: 700;
    --c: var(--s-race);
  }
  .next.s-easy {
    --c: var(--s-easy);
  }
  .next.s-tempo {
    --c: var(--s-tempo);
  }
  .next.s-intervals {
    --c: var(--s-intervals);
  }
  .next.s-long {
    --c: var(--s-long);
  }
  .next.s-race {
    --c: var(--s-race);
  }
  .next-label {
    margin: 0;
    font-weight: 700;
    color: var(--bib-blue);
  }
  .next-label span {
    display: block;
    font-weight: 400;
    color: var(--ink-2);
    font-size: 0.9rem;
  }
  .next-main {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin: 0.5rem 0 0.4rem;
  }
  .next-name {
    margin: 0;
    font: 800 1.5rem/1.1 var(--display);
  }
  .next-detail {
    margin: 0.15rem 0 0;
    font-size: 0.95rem;
  }
  .next-km {
    margin: 0;
    flex: none;
    font: 800 2.4rem/1 var(--display);
  }
  .next-km small {
    font-size: 1rem;
  }
  .next-done {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 44px;
    font-weight: 700;
    cursor: pointer;
  }
  .next-done input {
    width: 24px;
    height: 24px;
    margin: 0;
    accent-color: var(--bib-blue);
  }
  .fuel-wrap {
    max-width: 34rem;
  }
</style>
