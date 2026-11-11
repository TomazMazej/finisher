// Generator načrta treningov. Čiste funkcije, brez DOM in brez Date.now():
// "today" pride kot vhod, zato je izhod ponovljiv in testljiv.

export type DistanceClass = "tenk" | "half" | "full";
export type DaysPerWeek = 2 | 3 | 4 | 5 | 6;
export type SessionType = "easy" | "tempo" | "intervals" | "long" | "race";
export type WeekKind = "build" | "recovery" | "taper" | "race";

export interface PlanInput {
  distanceKm: number;
  targetMinutes: number;
  /** YYYY-MM-DD */
  raceDate: string;
  /** YYYY-MM-DD, datum izračuna */
  today: string;
  weeklyKm: number;
  daysPerWeek: number;
}

/** Tempo v min/km. Pri enem samem tempu sta min in max enaka. */
export interface PaceRange {
  min: number;
  max: number;
}

export interface Session {
  type: SessionType;
  km: number;
  pace: PaceRange;
  /** tempo: km v tempu (ostalo ogrevanje in ohlajanje) */
  qualityKm?: number;
  /** intervali: število ponovitev */
  reps?: number;
  /** intervali: dolžina ponovitve v metrih */
  repM?: number;
}

export interface Week {
  /** 1 = prvi prikazani teden */
  number: number;
  kind: WeekKind;
  /** ciljni obseg po pravilih rasti */
  targetKm: number;
  /** dejanski seštevek seans */
  totalKm: number;
  sessions: Session[];
}

export type WarningCode =
  | "SHORT_PREP" // manj kot 4 tedne
  | "LONG_PREP" // več kot 20 tednov, prikazanih zadnjih 20
  | "LOW_VOLUME_MARATHON" // maraton in pod 20 km na teden
  | "HIGH_AVG_RUN" // povprečen tek nad 12 km
  | "TWO_DAYS_MARATHON"
  | "LOW_VOLUME_FOR_DAYS" // premalo km za izbrano število dni: v začetnih tednih je tekov manj
  | "LONG_RUN_SHORT"; // najdaljši tek v načrtu je precej krajši od tekme (value: km)

export interface Warning {
  code: WarningCode;
  value?: number;
}

export interface Paces {
  race: number;
  easy: PaceRange;
  tempo: number;
  interval: number;
}

export type PlanError = "INVALID_INPUT" | "RACE_PASSED";

export type PlanResult =
  | {
      ok: true;
      distanceClass: DistanceClass;
      weeksToRace: number;
      peakKm: number;
      paces: Paces;
      warnings: Warning[];
      weeks: Week[];
    }
  | { ok: false; error: PlanError };

export const RULES = {
  maxWeeksShown: 20,
  shortPrepWeeks: 4,
  growth: 1.1,
  recoveryEvery: 4, // indeks 3, 7, 11 ...
  recoveryFactor: 0.8,
  taperFactors: { full: [0.75, 0.5], half: [0.5], tenk: [0.5] } as Record<DistanceClass, number[]>,
  weeklyCap: { tenk: 40, half: 55, full: 70 } as Record<DistanceClass, number>,
  longCap: { tenk: 14, half: 20, full: 32 } as Record<DistanceClass, number>,
  /** Zgornja meja za tempo ali intervalni trening (km skupaj z ogrevanjem). */
  qualityCap: { tenk: 12, half: 16, full: 20 } as Record<DistanceClass, number>,
  longShareMax: 0.5,
  /** Pri samo dveh tekih na teden sme dolgi tek pokriti več tedna, sicer bi bila enako dolga. */
  longShareMaxTwoRuns: 0.6,
  /**
   * Dolgi tek raste s tedenskim obsegom do zgornje meje:
   * najmanj longCap × (obseg / weeklyCap) ^ longRampExp.
   * Tako pri maratonu v najvišjih tednih doseže 30 do 32 km tudi pri 4 do 6 dneh.
   */
  longRampExp: 1.5,
  /** Delež km v tempu pri tempo treningu (lažji teden ima manj). */
  tempoShare: { normal: 0.5, recovery: 0.33 },
  weights: { long: 1.6, tempo: 1.0, easy: 0.9 },
  minRunKm: 3,
  minWeeklyKm: 5,
  easyPace: [1.12, 1.28] as const,
  tempoPace: { tenk: 1.06, half: 0.97, full: 0.94 } as Record<DistanceClass, number>,
  intervalPace: { tenk: 0.97, half: 0.93, full: 0.88 } as Record<DistanceClass, number>,
  intervalRepM: 800,
  intervalReps: [3, 6] as const,
  raceWeekEasyShare: 0.12,
  highAvgRunKm: 12,
  lowVolumeMarathonKm: 20,
  /**
   * Povprečen tek v tednu je vsaj toliko km. Pri nizkem obsegu je tekov manj, kot jih je uporabnik izbral
   * (a vsaj 2), namesto da bi se obseg napihnil z minimalnimi teki.
   */
  lowVolumePerDayKm: 4,
  /** Tempo ali intervali šele od te dolžine (ogrevanje in ohlajanje); krajši je lahek tek. */
  minQualityKm: 5,
  /** Ogrevanje + ohlajanje pri tempu in intervalih (km). */
  warmCoolKm: 2,
  /** Lahki teki v tednu tekme skupaj največ toliko deleža najvišjega tedna. */
  raceWeekEasyMaxShare: 0.5,
  /** Opozorilo, če je najdaljši tek krajši od tega deleža razdalje tekme. */
  longRunVsRaceMin: 0.7,
} as const;

/** Vrstni red seans v tednu; dolgi tek je vedno zadnji. */
const LAYOUT: Record<DaysPerWeek, ("easy" | "tempo" | "long")[]> = {
  2: ["tempo", "long"],
  3: ["tempo", "easy", "long"],
  4: ["easy", "tempo", "easy", "long"],
  5: ["easy", "tempo", "easy", "easy", "long"],
  6: ["easy", "tempo", "easy", "easy", "easy", "long"],
};

export function distanceClass(km: number): DistanceClass {
  return km >= 30 ? "full" : km >= 15 ? "half" : "tenk";
}

import { weeksUntil } from "./dates";
export { weeksUntil };

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const fixed = (p: number): PaceRange => ({ min: p, max: p });

function validInput(i: PlanInput): boolean {
  return (
    Number.isFinite(i.distanceKm) &&
    i.distanceKm > 0 &&
    i.distanceKm <= 200 &&
    Number.isFinite(i.targetMinutes) &&
    i.targetMinutes > 0 &&
    Number.isFinite(i.weeklyKm) &&
    i.weeklyKm >= 0 &&
    Number.isInteger(i.daysPerWeek) &&
    i.daysPerWeek >= 2 &&
    i.daysPerWeek <= 6
  );
}

export function paces(distanceKm: number, targetMinutes: number): Paces {
  const dc = distanceClass(distanceKm);
  const race = targetMinutes / distanceKm;
  return {
    race,
    easy: { min: race * RULES.easyPace[0], max: race * RULES.easyPace[1] },
    tempo: race * RULES.tempoPace[dc],
    interval: race * RULES.intervalPace[dc],
  };
}

/** Ciljni tedenski obsegi (brez dnevne razporeditve). */
export function weeklyTargets(
  currentKm: number,
  weeks: number,
  dc: DistanceClass,
): { km: number; kind: WeekKind }[] {
  const n = Math.min(weeks, RULES.maxWeeksShown);
  const factors = RULES.taperFactors[dc];
  const taper = Math.min(factors.length, n);
  const build = n - taper;
  const cap = RULES.weeklyCap[dc];
  const out: { km: number; kind: WeekKind }[] = [];
  let base = Math.min(currentKm, cap);
  for (let i = 0; i < build; i++) {
    const recovery = i % RULES.recoveryEvery === RULES.recoveryEvery - 1;
    if (i > 0 && !recovery) base = Math.min(base * RULES.growth, cap);
    out.push({ km: recovery ? base * RULES.recoveryFactor : base, kind: recovery ? "recovery" : "build" });
  }
  const peak = base;
  // Pri zelo kratkem času do tekme vzamemo zadnje faktorje razbremenitve.
  factors.slice(factors.length - taper).forEach((f, j, arr) => {
    out.push({ km: peak * f, kind: j === arr.length - 1 ? "race" : "taper" });
  });
  return out;
}

/** Koliko tekov v tednu: izbrano število dni, pri nizkem obsegu manj (vsaj 2). */
export function runsForWeek(targetKm: number, days: DaysPerWeek): DaysPerWeek {
  return clamp(Math.floor(targetKm / RULES.lowVolumePerDayKm), 2, days) as DaysPerWeek;
}

function trainingWeek(
  targetKm: number,
  days: DaysPerWeek,
  dc: DistanceClass,
  p: Paces,
  intervals: boolean,
  recovery: boolean,
): Session[] {
  const runs = runsForWeek(targetKm, days);
  const layout = LAYOUT[runs];
  const W = RULES.weights;
  const wt = layout.reduce((a, ty) => a + W[ty], 0);
  const wr = wt - W.long;
  const proportional = (targetKm * W.long) / wt;
  const ramp = RULES.longCap[dc] * Math.pow(Math.min(1, targetKm / RULES.weeklyCap[dc]), RULES.longRampExp);
  const share = runs === 2 ? RULES.longShareMaxTwoRuns : RULES.longShareMax;
  const rawLong = Math.min(RULES.longCap[dc], targetKm * share, Math.max(proportional, ramp));
  const rest = targetKm - rawLong;
  const long = Math.max(RULES.minRunKm, Math.round(rawLong));
  // Nobena seansa ne sme biti daljša od dolgega teka.
  const quality = clamp(Math.round(rest / wr), RULES.minRunKm, Math.min(long, RULES.qualityCap[dc]));
  const easy = clamp(Math.round((rest * W.easy) / wr), RULES.minRunKm, long);

  return layout.map((ty): Session => {
    if (ty === "long") return { type: "long", km: long, pace: p.easy };
    // Prekratek trening za ogrevanje, del v tempu in ohlajanje je lahek tek.
    if (ty === "easy" || quality < RULES.minQualityKm) return { type: "easy", km: ty === "easy" ? easy : quality, pace: p.easy };
    const workKm = quality - RULES.warmCoolKm;
    if (intervals) {
      const [lo, hi] = RULES.intervalReps;
      const repKm = RULES.intervalRepM / 1000;
      // Ponovitve + 2 min lahkega teka vmes (okoli 0,3 km) morajo skupaj z ogrevanjem in ohlajanjem pasti v trening.
      const fit = Math.floor((workKm + 0.3) / (repKm + 0.3));
      const reps = clamp(Math.round((quality * 0.4) / repKm), lo, Math.max(lo, Math.min(hi, fit)));
      return { type: "intervals", km: quality, pace: fixed(p.interval), reps, repM: RULES.intervalRepM };
    }
    const tshare = recovery ? RULES.tempoShare.recovery : RULES.tempoShare.normal;
    const qualityKm = clamp(Math.round(quality * tshare), 1, workKm);
    return { type: "tempo", km: quality, pace: fixed(p.tempo), qualityKm };
  });
}

function raceWeek(distanceKm: number, peakKm: number, days: DaysPerWeek, p: Paces): Session[] {
  const easyKm = Math.max(RULES.minRunKm, Math.round(peakKm * RULES.raceWeekEasyShare));
  // Lahki teki pred tekmo skupaj ne presežejo polovice najvišjega tedna.
  const count = clamp(Math.floor((peakKm * RULES.raceWeekEasyMaxShare) / easyKm), 0, days - 1);
  const s: Session[] = [];
  for (let i = 0; i < count; i++) s.push({ type: "easy", km: easyKm, pace: p.easy });
  s.push({ type: "race", km: distanceKm, pace: fixed(p.race) });
  return s;
}

const sum = (s: Session[]) => s.reduce((a, x) => a + x.km, 0);

export function generatePlan(input: PlanInput): PlanResult {
  if (!validInput(input)) return { ok: false, error: "INVALID_INPUT" };
  const weeksToRace = weeksUntil(input.today, input.raceDate);
  if (weeksToRace === null) return { ok: false, error: "INVALID_INPUT" };
  if (weeksToRace < 1) return { ok: false, error: "RACE_PASSED" };

  const days = input.daysPerWeek as DaysPerWeek;
  const dc = distanceClass(input.distanceKm);
  const cur = Math.max(input.weeklyKm, RULES.minWeeklyKm);
  const p = paces(input.distanceKm, input.targetMinutes);
  const targets = weeklyTargets(cur, weeksToRace, dc);

  const nonRace = targets.filter((t) => t.kind !== "race");
  const peakTarget = nonRace.length ? Math.max(...nonRace.map((t) => t.km)) : Math.min(cur, RULES.weeklyCap[dc]);

  // Intervali vsak drugi običajni teden gradnje. Lažji tedni in razbremenitev imajo tempo.
  let buildIndex = 0;
  const weeks: Week[] = targets.map((t, k) => {
    let sessions: Session[];
    if (t.kind === "race") {
      sessions = raceWeek(input.distanceKm, peakTarget, days, p);
    } else {
      const iv = t.kind === "build" && buildIndex % 2 === 1;
      sessions = trainingWeek(t.km, days, dc, p, iv, t.kind === "recovery");
    }
    if (t.kind === "build") buildIndex++;
    return { number: k + 1, kind: t.kind, targetKm: t.km, totalKm: sum(sessions), sessions };
  });

  const warnings: Warning[] = [];
  if (weeksToRace < RULES.shortPrepWeeks) warnings.push({ code: "SHORT_PREP" });
  if (weeksToRace > RULES.maxWeeksShown) warnings.push({ code: "LONG_PREP", value: weeksToRace - RULES.maxWeeksShown });
  if (dc === "full" && cur < RULES.lowVolumeMarathonKm) warnings.push({ code: "LOW_VOLUME_MARATHON" });
  if (cur / days > RULES.highAvgRunKm) warnings.push({ code: "HIGH_AVG_RUN", value: Math.round(cur / days) });
  if (days === 2 && dc === "full") warnings.push({ code: "TWO_DAYS_MARATHON" });
  if (cur < RULES.lowVolumePerDayKm * days) warnings.push({ code: "LOW_VOLUME_FOR_DAYS" });

  const longest = Math.max(0, ...weeks.flatMap((w) => w.sessions.filter((s) => s.type === "long").map((s) => s.km)));
  if (weeks.some((w) => w.kind !== "race") && longest < RULES.longRunVsRaceMin * input.distanceKm) {
    warnings.push({ code: "LONG_RUN_SHORT", value: longest });
  }

  const trainingTotals = weeks.filter((w) => w.kind !== "race").map((w) => w.totalKm);
  const peakKm = trainingTotals.length ? Math.max(...trainingTotals) : Math.round(peakTarget);

  return { ok: true, distanceClass: dc, weeksToRace, peakKm, paces: p, warnings, weeks };
}
