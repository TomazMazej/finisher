// Oblika odgovora POST /api/preview. Samo tipi: odjemalec ne uvozi generatorja.
import type { Lang, Paces, PlanError, Warning, Week } from "@finisher/core";

export const PREVIEW_WEEKS = 2;

export interface PreviewRequest {
  distanceKm: number;
  targetMinutes: number;
  raceDate: string;
  weeklyKm: number;
  daysPerWeek: number;
  /** lokalni datum odjemalca YYYY-MM-DD; strežnik ga sprejme le, če je največ en dan od njegovega */
  today: string;
  lang: Lang;
  /** zabeleži korak lijaka (enkrat na obisk) */
  track?: boolean;
}

export type Preview =
  | {
      ok: true;
      weeksToRace: number;
      peakKm: number;
      paces: Paces;
      warnings: Warning[];
      /** podrobno samo prvi tedni */
      weeks: Week[];
      /** za graf obsega: samo vrsta in seštevek vsakega tedna */
      totals: Pick<Week, "number" | "kind" | "totalKm">[];
    }
  | { ok: false; error: PlanError | "NETWORK" };

/** Vhod, shranjen ob naročilu. Datum začetka načrta je plan_start v tabeli orders. */
export interface StoredInput {
  distanceKm: number;
  targetMinutes: number;
  raceDate: string;
  weeklyKm: number;
  daysPerWeek: number;
  fuel?: { carbsPerHour?: number; gelCarbs?: number; drinkPerHour?: number; firstGelMin?: number };
}

export type FullPlanResponse =
  | {
      ok: true;
      lang: Lang;
      planStart: string;
      input: StoredInput;
      weeksToRace: number;
      peakKm: number;
      paces: Paces;
      warnings: Warning[];
      weeks: Week[];
      /** opravljene postavke: "w3s2" (teden 3, tek 2) ali "c4" (kontrolni seznam, točka 4) */
      done: string[];
    }
  | { ok: false; error: "INVALID_TOKEN" | "NOT_PAID" | "NOT_FOUND" | "PLAN_ERROR" | "NETWORK" };

/** Oblika ključa za kljukico. */
export const PROGRESS_ITEM = /^(w\d{1,2}s\d|c\d{1,2})$/;
