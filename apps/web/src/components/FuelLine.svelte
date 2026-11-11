<script lang="ts">
  import { formatDuration, formatKm } from "@finisher/core/format";
  import type { Lang, Gel } from "@finisher/core";
  import { T } from "../lib/i18n";

  let { lang, gels, distanceKm, targetMinutes }: { lang: Lang; gels: Gel[]; distanceKm: number; targetMinutes: number } =
    $props();
  const t = $derived(T[lang]);
  const W = 480;
  const PAD = 30;
  const x = (km: number) => PAD + (km / distanceKm) * (W - 2 * PAD);
</script>

<!-- Proga od štarta do cilja z geli. Pod sliko je ista vsebina kot seznam za bralnike zaslona. -->
<svg viewBox="0 0 {W} 170" class="course" aria-hidden="true">
  <line x1={PAD} y1="85" x2={W - PAD} y2="85" class="road" />
  <line x1={PAD} y1="85" x2={W - PAD} y2="85" class="lane" />
  <g class="end">
    <circle cx={PAD} cy="85" r="7" />
    <text x={PAD} y="120" text-anchor="middle">{t.start}</text>
  </g>
  <g class="end">
    <rect x={W - PAD - 7} y="72" width="14" height="26" rx="2" />
    <text x={W - PAD} y="120" text-anchor="middle">{t.finish}</text>
    <text x={W - PAD} y="140" text-anchor="middle" class="sub">{formatDuration(targetMinutes)}</text>
  </g>
  {#each gels as g, i}
    {@const up = i % 2 === 0}
    <g class="gel">
      <line x1={x(g.km)} y1="85" x2={x(g.km)} y2={up ? 52 : 118} class="tick" />
      <circle cx={x(g.km)} cy="85" r="9" />
      <text x={x(g.km)} y={up ? 22 : 142} text-anchor="middle">{formatDuration(g.minute)}</text>
      <text x={x(g.km)} y={up ? 42 : 162} text-anchor="middle" class="sub">{formatKm(g.km, lang)} km</text>
    </g>
  {/each}
</svg>
<ol class="visually-hidden">
  {#each gels as g}
    <li>{formatDuration(g.minute)}, {formatKm(g.km, lang)} km</li>
  {/each}
</ol>

<style>
  .course {
    width: 100%;
    height: auto;
    overflow: visible;
    font-family: var(--text);
  }
  .road {
    stroke: var(--ink);
    stroke-width: 10;
    stroke-linecap: round;
  }
  .lane {
    stroke: var(--mist);
    stroke-width: 1.5;
    stroke-dasharray: 8 8;
  }
  .end circle,
  .end rect {
    fill: var(--ink);
  }
  .tick {
    stroke: var(--s-race);
    stroke-width: 2;
  }
  .gel circle {
    fill: var(--s-race);
    stroke: var(--surface);
    stroke-width: 3;
  }
  text {
    fill: var(--ink);
    font-size: 19px;
    font-weight: 700;
  }
  text.sub {
    fill: var(--ink-2);
    font-weight: 400;
    font-size: 16px;
  }
</style>
