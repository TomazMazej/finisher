// Predogled načrta v obliki, ki jo bo vračal POST /api/preview.
// ZAČASNO: izračun teče v brskalniku, da lahko razvijava vmesnik brez strežnika.
// Ko bo API, se ta funkcija zamenja s fetch in generator ne bo več v paketu za brskalnik.
import { generatePlan, type PlanInput, type Week, type Paces, type Warning, type PlanError } from "@finisher/core";

export const PREVIEW_WEEKS = 2;

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
  | { ok: false; error: PlanError };

export function preview(input: PlanInput): Preview {
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
  };
}
