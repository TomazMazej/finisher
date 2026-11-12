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
  /** Neobvezno: nedavni rezultat (tekma ali hiter tek na polno), iz katerega ocenimo trenutno formo. */
  recent?: RecentResult;
}

export interface RecentResult {
  distanceKm: number;
  minutes: number;
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
  /** lahek tek: na koncu toliko pospeškov po 20 s */
  strides?: number;
  /** dolgi tek: zadnji toliko km v ciljnem tempu tekme */
  racePaceKm?: number;
  /** ciljni tempo tekme (min/km) za racePaceKm */
  racePace?: number;
  /** tempo in intervali: km ogrevanja in ohlajanja v lahkem tempu */
  warmKm?: number;
  coolKm?: number;
  /** tempo in intervali: lahek tempo za ogrevanje, ohlajanje in odmore */
  easyPace?: PaceRange;
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
  | "LONG_RUN_SHORT" // najdaljši tek v načrtu je precej krajši od tekme (value: km)
  | "GOAL_AMBITIOUS"; // cilj je hitrejši od realnega napredka do tekme (value: ocena zdaj, limit: realna meja)

export interface Warning {
  code: WarningCode;
  value?: number;
  /** GOAL_AMBITIOUS: najhitrejši realen čas do tekme (minute) */
  limit?: number;
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
      /** ocenjen čas tekme iz nedavnega rezultata (minute), če je bil podan */
      predictedMinutes?: number;
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
  /** 2 min lahkega teka med ponovitvami je okoli 0,3 km */
  intervalJogKm: 0.3,
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
  /** Riegelov eksponent za oceno časa na drugi razdalji: T2 = T1 × (D2 / D1) ^ e. */
  riegelExp: 1.06,
  /**
   * Realen napredek do tekme glede na trenutno formo: okoli 0,5 % na teden priprave,
   * vsaj 2 % (dnevna oblika, taktika) in največ 8 %. Hitrejši cilj sproži GOAL_AMBITIOUS.
   */
  goalImprovePerWeek: 0.005,
  goalImproveMin: 0.02,
  goalImproveMax: 0.08,
  /** Pospeški (20 s) na lahkem teku v tednih brez tempa in intervalov ter v tednu tekme. */
  strides: 4,
  /** Zadnji km dolgega teka v tempu tekme: delež dolgega teka in zgornja meja po razdalji. */
  racePaceShare: 0.2,
  racePaceCap: { tenk: 3, half: 5, full: 8 } as Record<DistanceClass, number>,
  /** Koliko zadnjih običajnih tednov gradnje ima dolgi tek s koncem v tempu tekme. */
  racePaceLastBuildWeeks: 2,
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

/** Delež, za katerega se lahko čas realno izboljša v toliko tednih priprave. */
export function realisticImprovement(weeks: number): number {
  const w = Math.min(weeks, RULES.maxWeeksShown);
  return clamp(w * RULES.goalImprovePerWeek, RULES.goalImproveMin, RULES.goalImproveMax);
}

/** Oceni čas na razdalji iz nedavnega rezultata (Riegel). */
export function predictMinutes(recent: RecentResult, distanceKm: number): number {
  return recent.minutes * Math.pow(distanceKm / recent.distanceKm, RULES.riegelExp);
}

function validRecent(r: RecentResult | undefined): boolean {
  if (r === undefined) return true;
  if (!Number.isFinite(r.distanceKm) || !Number.isFinite(r.minutes)) return false;
  if (r.distanceKm < 1 || r.distanceKm > 50 || r.minutes <= 0) return false;
  const pace = r.minutes / r.distanceKm;
  return pace >= 2.5 && pace <= 15; // 2:30 do 15:00 min/km
}

function validInput(i: PlanInput): boolean {
  return (
    validRecent(i.recent) &&
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

/**
 * Tempi treningov. Če poznamo oceno forme, izhajajo iz počasnejšega od obeh (cilj ali ocena):
 * prezahteven cilj tako ne pospeši treningov, ciljni tempo ostane le za tekmo in odseke v tempu tekme.
 */
export function paces(distanceKm: number, targetMinutes: number, predictedMinutes?: number): Paces {
  const dc = distanceClass(distanceKm);
  const race = targetMinutes / distanceKm;
  const base = predictedMinutes ? Math.max(race, predictedMinutes / distanceKm) : race;
  return {
    race,
    easy: { min: base * RULES.easyPace[0], max: base * RULES.easyPace[1] },
    tempo: base * RULES.tempoPace[dc],
    interval: base * RULES.intervalPace[dc],
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
      const fit = Math.floor((workKm + RULES.intervalJogKm) / (repKm + RULES.intervalJogKm));
      const reps = clamp(Math.round((quality * 0.4) / repKm), lo, Math.max(lo, Math.min(hi, fit)));
      const restKm = quality - reps * repKm - (reps - 1) * RULES.intervalJogKm;
      return { type: "intervals", km: quality, pace: fixed(p.interval), reps, repM: RULES.intervalRepM, ...warmCool(restKm), easyPace: p.easy };
    }
    const tshare = recovery ? RULES.tempoShare.recovery : RULES.tempoShare.normal;
    const qualityKm = clamp(Math.round(quality * tshare), 1, workKm);
    return { type: "tempo", km: quality, pace: fixed(p.tempo), qualityKm, ...warmCool(quality - qualityKm), easyPace: p.easy };
  });
}

/** Razdeli lahke kilometre na ogrevanje (večji del) in ohlajanje, vsaj 1 km vsakega. */
function warmCool(restKm: number): { warmKm: number; coolKm: number } {
  const total = Math.max(2, Math.round(restKm));
  const warmKm = Math.ceil(total / 2);
  return { warmKm, coolKm: total - warmKm };
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

/**
 * Delo v tempu tekme, da telo tempo spozna tudi pri nizkem obsegu:
 * - teden brez tempa in intervalov: pospeški na prvem lahkem teku, dolgi tek konča s km v tempu tekme,
 * - zadnja dva običajna tedna gradnje: dolgi tek konča daljši odsek v tempu tekme,
 * - teden tekme: pospeški na zadnjem lahkem teku pred tekmo.
 * Lažji tedni in razbremenitev ostanejo brez tega.
 */
function addRacePaceWork(weeks: Week[], dc: DistanceClass, racePace: number): void {
  const builds = weeks.filter((w) => w.kind === "build");
  const lastBuilds = new Set(builds.slice(-RULES.racePaceLastBuildWeeks).map((w) => w.number));
  for (const w of weeks) {
    const easy = w.sessions.filter((s) => s.type === "easy");
    if (w.kind === "race") {
      const last = easy.at(-1);
      if (last) last.strides = RULES.strides;
      continue;
    }
    if (w.kind !== "build") continue;
    const long = w.sessions.find((s) => s.type === "long");
    const hasQuality = w.sessions.some((s) => s.type === "tempo" || s.type === "intervals");
    if (!hasQuality && easy[0]) easy[0].strides = RULES.strides;
    if (!long || long.km < 3) continue;
    if (lastBuilds.has(w.number)) {
      long.racePaceKm = clamp(Math.round(long.km * RULES.racePaceShare), 1, Math.min(RULES.racePaceCap[dc], long.km - 2));
      long.racePace = racePace;
    } else if (!hasQuality) {
      long.racePaceKm = clamp(Math.round(long.km * RULES.racePaceShare), 1, 2);
      long.racePace = racePace;
    }
  }
}

export function generatePlan(input: PlanInput): PlanResult {
  if (!validInput(input)) return { ok: false, error: "INVALID_INPUT" };
  const weeksToRace = weeksUntil(input.today, input.raceDate);
  if (weeksToRace === null) return { ok: false, error: "INVALID_INPUT" };
  if (weeksToRace < 1) return { ok: false, error: "RACE_PASSED" };

  const days = input.daysPerWeek as DaysPerWeek;
  const dc = distanceClass(input.distanceKm);
  const cur = Math.max(input.weeklyKm, RULES.minWeeklyKm);
  const predictedMinutes = input.recent ? predictMinutes(input.recent, input.distanceKm) : undefined;
  const p = paces(input.distanceKm, input.targetMinutes, predictedMinutes);
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
  addRacePaceWork(weeks, dc, p.race);

  const warnings: Warning[] = [];
  if (weeksToRace < RULES.shortPrepWeeks) warnings.push({ code: "SHORT_PREP" });
  if (weeksToRace > RULES.maxWeeksShown) warnings.push({ code: "LONG_PREP", value: weeksToRace - RULES.maxWeeksShown });
  if (dc === "full" && cur < RULES.lowVolumeMarathonKm) warnings.push({ code: "LOW_VOLUME_MARATHON" });
  if (cur / days > RULES.highAvgRunKm) warnings.push({ code: "HIGH_AVG_RUN", value: Math.round(cur / days) });
  if (days === 2 && dc === "full") warnings.push({ code: "TWO_DAYS_MARATHON" });
  if (cur < RULES.lowVolumePerDayKm * days) warnings.push({ code: "LOW_VOLUME_FOR_DAYS" });

  if (predictedMinutes) {
    const limit = predictedMinutes * (1 - realisticImprovement(weeksToRace));
    if (input.targetMinutes < limit) {
      warnings.push({ code: "GOAL_AMBITIOUS", value: Math.round(predictedMinutes), limit: Math.round(limit) });
    }
  }

  const longest = Math.max(0, ...weeks.flatMap((w) => w.sessions.filter((s) => s.type === "long").map((s) => s.km)));
  if (weeks.some((w) => w.kind !== "race") && longest < RULES.longRunVsRaceMin * input.distanceKm) {
    warnings.push({ code: "LONG_RUN_SHORT", value: longest });
  }

  const trainingTotals = weeks.filter((w) => w.kind !== "race").map((w) => w.totalKm);
  const peakKm = trainingTotals.length ? Math.max(...trainingTotals) : Math.round(peakTarget);

  return {
    ok: true,
    distanceClass: dc,
    weeksToRace,
    peakKm,
    paces: p,
    warnings,
    weeks,
    ...(predictedMinutes ? { predictedMinutes } : {}),
  };
}
