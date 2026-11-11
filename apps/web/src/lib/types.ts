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
