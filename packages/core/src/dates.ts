// Datumi brez časovnih pasov: računamo v dnevih UTC iz nizov YYYY-MM-DD.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export function utcDay(s: string): number | null {
  if (!DATE_RE.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number) as [number, number, number];
  const t = Date.UTC(y, m - 1, d);
  const back = new Date(t);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== m - 1 || back.getUTCDate() !== d) return null;
  return t / 86_400_000;
}

/** Število tednov do tekme (zaokroženo navzgor). 0 ali manj pomeni, da je tekma danes ali mimo. */
export function weeksUntil(today: string, raceDate: string): number | null {
  const a = utcDay(today);
  const b = utcDay(raceDate);
  if (a === null || b === null) return null;
  return Math.ceil((b - a) / 7);
}


/** Dan (število dni od 1970-01-01, UTC) nazaj v niz YYYY-MM-DD. */
export function isoFromDay(day: number): string {
  return new Date(day * 86_400_000).toISOString().slice(0, 10);
}

/** Datum, premaknjen za n dni. */
export function addDaysIso(date: string, n: number): string {
  const d = utcDay(date);
  if (d === null) throw new Error(`Neveljaven datum: ${date}`);
  return isoFromDay(d + n);
}
