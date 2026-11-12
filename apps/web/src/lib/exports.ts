// Izvoz celega načrta: koledar (.ics) in pomožne funkcije za prenos datotek. Teče v brskalniku.
import { buildIcs, type IcsEvent } from "@finisher/core/ics";
import { sessionDates } from "@finisher/core/schedule";
import { formatDuration, formatKm } from "@finisher/core/format";
import type { Lang } from "@finisher/core";
import { T } from "./i18n";
import { sessionDetail } from "./session-text";
import type { FullPlanResponse } from "./types";

export type FullPlan = Extract<FullPlanResponse, { ok: true }>;

export const distLabel = (lang: Lang, km: number) =>
  T[lang].distances[String(km) as "10" | "21.0975" | "42.195"] ?? `${formatKm(km, lang)} km`;

export function planIcs(plan: FullPlan, lang: Lang, orderId: string, planUrl: string): string {
  const t = T[lang];
  const events: IcsEvent[] = [];
  for (const w of plan.weeks) {
    const dates = sessionDates(w, plan.weeks.length, plan.input.raceDate, plan.planStart);
    w.sessions.forEach((s, i) => {
      const summary =
        s.type === "race"
          ? `${t.sessions.race}: ${distLabel(lang, plan.input.distanceKm)} (${formatDuration(plan.input.targetMinutes)})`
          : `${t.sessions[s.type]} ${formatKm(s.km, lang)} km`;
      events.push({
        uid: `${orderId}-w${w.number}s${i + 1}@finisher`,
        date: dates[i]!,
        summary,
        description: [...sessionDetail(t, s), "", `${t.week(w.number)}, ${t.kinds[w.kind]}`, planUrl].join("\n"),
      });
    });
  }
  return buildIcs(events, t.my.calName(distLabel(lang, plan.input.distanceKm)));
}

export function download(data: BlobPart, filename: string, type: string): void {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
