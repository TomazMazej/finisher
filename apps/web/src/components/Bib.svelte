<script lang="ts">
  import { formatDuration, formatPace } from "@finisher/core/format";
  import type { Lang } from "@finisher/core";
  import { T } from "../lib/i18n";

  type DistKey = "10" | "21.0975" | "42.195";
  let {
    lang,
    dist,
    targetMinutes,
    raceDate,
    weeks,
    predicted = undefined,
  }: {
    lang: Lang;
    dist: DistKey;
    targetMinutes: number;
    raceDate: string;
    weeks: number | null;
    predicted?: number;
  } = $props();

  const t = $derived(T[lang]);
  const pace = $derived(targetMinutes > 0 ? formatPace(targetMinutes / Number(dist)) : "–");
  const time = $derived(targetMinutes > 0 ? formatDuration(targetMinutes) : "–:––");
  const dateText = $derived.by(() => {
    if (!raceDate) return t.bibNoDate;
    const d = new Date(raceDate + "T12:00:00");
    if (isNaN(d.getTime())) return t.bibNoDate;
    return new Intl.DateTimeFormat(t.locale, { weekday: "short", day: "numeric", month: "long", year: "numeric" }).format(d);
  });
</script>

<figure class="bib" aria-label={`${t.distances[dist]}, ${time}`}>
  <div class="strip">
    <span class="brand">Finisher</span>
    <span>{t.distanceShort[dist]}</span>
  </div>
  <div class="body">
    <span class="pin tl" aria-hidden="true"></span>
    <span class="pin tr" aria-hidden="true"></span>
    <span class="pin bl" aria-hidden="true"></span>
    <span class="pin br" aria-hidden="true"></span>
    <p class="race">{t.distances[dist]}</p>
    <p class="time">{time}</p>
    <div class="meta">
      <span><b>{pace}</b> {t.bibPace}</span>
      <span>{dateText}</span>
    </div>
    {#if weeks !== null && weeks > 0}
      <p class="weeks">{t.bibWeeks(weeks)}</p>
    {/if}
    {#if predicted}
      <p class="pred">{t.bibPredicted(formatDuration(predicted, true))}</p>
    {/if}
  </div>
</figure>

<style>
  .bib {
    margin: 0;
    background: var(--paper);
    color: var(--paper-ink);
    border-radius: var(--r-bib);
    box-shadow:
      0 1px 0 rgba(20, 33, 61, 0.08),
      0 14px 28px -18px rgba(20, 33, 61, 0.55);
    transform: rotate(-1.2deg);
    animation: pin-on 700ms cubic-bezier(0.2, 0.9, 0.25, 1.15) both;
    overflow: hidden;
  }
  @keyframes pin-on {
    from {
      transform: translateY(-14px) rotate(-5deg);
      opacity: 0;
    }
    to {
      transform: rotate(-1.2deg);
      opacity: 1;
    }
  }
  .strip {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    background: #2346d8;
    color: #fff;
    padding: 0.45rem 1.1rem;
    font: 700 1.05rem/1 var(--display);
    letter-spacing: 0.02em;
  }
  .brand {
    font-weight: 800;
  }
  .body {
    position: relative;
    padding: 1rem 1.6rem 1.2rem;
  }
  .pin {
    position: absolute;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--mist);
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.35);
  }
  .tl {
    top: 10px;
    left: 10px;
  }
  .tr {
    top: 10px;
    right: 10px;
  }
  .bl {
    bottom: 10px;
    left: 10px;
  }
  .br {
    bottom: 10px;
    right: 10px;
  }
  .race {
    margin: 0;
    font: 700 1.25rem/1 var(--display);
    color: #2346d8;
  }
  .time {
    margin: 0.1rem 0 0.2rem;
    font: 800 clamp(5.5rem, 26vw, 8.5rem) / 0.9 var(--display);
    letter-spacing: -0.01em;
    font-variant-numeric: tabular-nums;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.25rem 1rem;
    color: #4a5873;
  }
  .meta b {
    color: #14213d;
  }
  .pred {
    margin: 0.3rem 0 0;
    color: #4a5873;
  }
  .weeks {
    margin: 0.6rem 0 0;
    padding-top: 0.6rem;
    border-top: 2px dashed #c9d2dd;
    font-weight: 700;
  }
</style>
