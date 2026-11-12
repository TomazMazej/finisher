// Razpored treningov po dnevih. Tedni so poravnani na dan tekme: zadnji dan zadnjega tedna je dan tekme,
// zato je dolgi tek vedno na isti dan v tednu kot tekma (običajno nedelja).
import type { Week } from "./plan";
import { addDaysIso } from "./dates";

/** Dnevi v tednu (0 = prvi dan, 6 = zadnji dan, dan dolgega teka) po številu tekov. Težji teki niso zaporedni. */
export const DAY_OFFSETS: Record<number, number[]> = {
  1: [6],
  2: [2, 6],
  3: [1, 3, 6],
  4: [0, 2, 4, 6],
  5: [0, 1, 3, 4, 6],
  6: [0, 1, 2, 3, 4, 6],
};

/** Teden tekme: lahki teki v tem vrstnem redu prednosti, dan pred tekmo (5) je počitek. */
const RACE_WEEK_EASY = [3, 1, 4, 0, 2];

export function weekRange(weekNumber: number, totalWeeks: number, raceDate: string): { start: string; end: string } {
  const end = addDaysIso(raceDate, -7 * (totalWeeks - weekNumber));
  return { start: addDaysIso(end, -6), end };
}

/**
 * Datum (YYYY-MM-DD) za vsako seanso v tednu, v enakem vrstnem redu kot week.sessions.
 * notBefore (npr. datum nakupa): seanse, ki bi padle pred ta dan, se razporedijo po preostalih dneh tedna.
 * Če dni ni dovolj, najzgodnejše seanse ostanejo na prvotnih (preteklih) dneh.
 */
export function sessionDates(week: Week, totalWeeks: number, raceDate: string, notBefore?: string): string[] {
  const { start } = weekRange(week.number, totalWeeks, raceDate);
  const n = week.sessions.length;
  let offsets: number[];
  if (week.kind === "race") {
    const easy = RACE_WEEK_EASY.slice(0, n - 1).sort((a, b) => a - b);
    offsets = [...easy, 6];
  } else {
    offsets = DAY_OFFSETS[n] ?? DAY_OFFSETS[6]!;
  }
  const dates = week.sessions.map((_, i) => addDaysIso(start, offsets[i]!));
  if (!notBefore || dates[0]! >= notBefore) return dates;

  const { end } = weekRange(week.number, totalWeeks, raceDate);
  const avail: string[] = [];
  for (let d = notBefore > start ? notBefore : start; d <= end; d = addDaysIso(d, 1)) avail.push(d);
  if (avail.length === 0) return dates;
  const k = Math.min(n, avail.length);
  for (let j = 0; j < k; j++) {
    const idx = k === 1 ? avail.length - 1 : Math.round((j * (avail.length - 1)) / (k - 1));
    dates[n - k + j] = avail[idx]!;
  }
  return dates;
}
