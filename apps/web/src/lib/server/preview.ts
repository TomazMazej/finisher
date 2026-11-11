// Samo strežnik. Generator se uvozi le tukaj, zato ga ni v paketu za brskalnik.
import { generatePlan, utcDay, type PlanInput, type RecentResult } from "@finisher/core";
import { PREVIEW_WEEKS, type Preview, type PreviewRequest } from "../types";

const isNum = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const isStr = (x: unknown): x is string => typeof x === "string" && x.length <= 10;

/** Neobvezen nedavni rezultat: undefined, če ga ni, null, če je oblika napačna. */
function parseRecent(x: unknown): RecentResult | undefined | null {
  if (x === undefined || x === null) return undefined;
  if (typeof x !== "object") return null;
  const r = x as Record<string, unknown>;
  return isNum(r.distanceKm) && isNum(r.minutes) ? { distanceKm: r.distanceKm, minutes: r.minutes } : null;
}

/** Preveri telo zahteve. Vrne null, če oblika ni prava. */
export function parseRequest(body: unknown): PreviewRequest | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (
    !isNum(b.distanceKm) ||
    !isNum(b.targetMinutes) ||
    !isNum(b.weeklyKm) ||
    !isNum(b.daysPerWeek) ||
    !isStr(b.raceDate) ||
    !isStr(b.today) ||
    (b.lang !== "sl" && b.lang !== "en")
  ) {
    return null;
  }
  const recent = parseRecent(b.recent);
  if (recent === null) return null;
  return {
    distanceKm: b.distanceKm,
    targetMinutes: b.targetMinutes,
    weeklyKm: b.weeklyKm,
    daysPerWeek: b.daysPerWeek,
    raceDate: b.raceDate,
    today: b.today,
    lang: b.lang,
    track: b.track === true,
    ...(recent ? { recent } : {}),
  };
}

/** Datum odjemalca velja, če je največ en dan od strežniškega (časovni pasovi), sicer vzamemo strežniškega. */
export function effectiveToday(clientToday: string, now = new Date()): string {
  const server = now.toISOString().slice(0, 10);
  const a = utcDay(clientToday);
  const b = utcDay(server);
  return a !== null && b !== null && Math.abs(a - b) <= 1 ? clientToday : server;
}

export function buildPreview(req: PreviewRequest, now = new Date()): Preview {
  const input: PlanInput = {
    distanceKm: req.distanceKm,
    targetMinutes: req.targetMinutes,
    raceDate: req.raceDate,
    today: effectiveToday(req.today, now),
    weeklyKm: req.weeklyKm,
    daysPerWeek: req.daysPerWeek,
    ...(req.recent ? { recent: req.recent } : {}),
  };
  const r = generatePlan(input);
  if (!r.ok) return r;
  return {
    ok: true,
    weeksToRace: r.weeksToRace,
    peakKm: r.peakKm,
    paces: r.paces,
    warnings: r.warnings,
    weeks: r.weeks.slice(0, PREVIEW_WEEKS),
    totals: r.weeks.map(({ number, kind, totalKm }) => ({ number, kind, totalKm })),
    ...(r.predictedMinutes ? { predictedMinutes: r.predictedMinutes } : {}),
  };
}
