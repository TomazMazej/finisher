// Urnik prehrane med tekmo in vmesni časi pri enakomernem tempu.

export interface FuelInput {
  distanceKm: number;
  targetMinutes: number;
  /** cilj ogljikovih hidratov, g/h */
  carbsPerHour?: number;
  /** g ogljikovih hidratov v enem gelu */
  gelCarbs?: number;
  /** g/h iz pijače */
  drinkPerHour?: number;
  /** prvi gel po toliko minutah */
  firstGelMin?: number;
}

export type FuelWarning = "NO_GELS" | "TIGHT_INTERVAL" | "HIGH_CARBS";

export interface Gel {
  n: number;
  minute: number;
  km: number;
}

export type FuelResult =
  | {
      ok: true;
      pace: number;
      intervalMin: number | null;
      gels: Gel[];
      gelCarbs: number;
      carbsFromGels: number;
      carbsFromDrink: number;
      totalCarbs: number;
      warnings: FuelWarning[];
    }
  | { ok: false; error: "INVALID_INPUT" };

export const FUEL_DEFAULTS = {
  carbsPerHour: 60,
  gelCarbs: 25,
  drinkPerHour: 15,
  firstGelMin: 30,
  noGelLastMin: 15,
  tightIntervalMin: 15,
  highCarbsPerHour: 90,
} as const;

export function fuelPlan(input: FuelInput): FuelResult {
  const D = FUEL_DEFAULTS;
  const { distanceKm, targetMinutes } = input;
  const carbs = input.carbsPerHour ?? D.carbsPerHour;
  const gelCarbs = input.gelCarbs ?? D.gelCarbs;
  const drink = input.drinkPerHour ?? D.drinkPerHour;
  const start = input.firstGelMin ?? D.firstGelMin;
  const nums = [distanceKm, targetMinutes, carbs, gelCarbs, drink, start];
  if (!nums.every(Number.isFinite) || !(distanceKm > 0) || !(targetMinutes > 0) || nums.some((x) => x < 0)) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  const pace = targetMinutes / distanceKm;
  const fromGelsPerHour = Math.max(0, carbs - drink);
  const warnings: FuelWarning[] = [];
  const gels: Gel[] = [];
  let intervalMin: number | null = null;

  if (fromGelsPerHour <= 0 || gelCarbs <= 0) {
    warnings.push("NO_GELS");
  } else {
    intervalMin = (gelCarbs / fromGelsPerHour) * 60;
    const last = targetMinutes - D.noGelLastMin;
    // Množenje namesto seštevanja, da se napaka plavajoče vejice ne nabira.
    for (let i = 0; start + i * intervalMin <= last + 1e-9; i++) {
      const minute = start + i * intervalMin;
      gels.push({ n: i + 1, minute, km: minute / pace });
    }
    if (intervalMin < D.tightIntervalMin) warnings.push("TIGHT_INTERVAL");
  }
  if (carbs > D.highCarbsPerHour) warnings.push("HIGH_CARBS");

  const carbsFromGels = gels.length * gelCarbs;
  const carbsFromDrink = (drink * Math.max(0, targetMinutes - start)) / 60;
  return {
    ok: true,
    pace,
    intervalMin,
    gels,
    gelCarbs,
    carbsFromGels,
    carbsFromDrink,
    totalCarbs: carbsFromGels + carbsFromDrink,
    warnings,
  };
}

export interface Split {
  km: number;
  minutes: number;
}

/** Vmesni časi vsakih `step` km in na cilju. */
export function splits(distanceKm: number, targetMinutes: number, step = 5): Split[] {
  if (!(distanceKm > 0) || !(targetMinutes > 0) || !(step > 0)) return [];
  const pace = targetMinutes / distanceKm;
  const out: Split[] = [];
  for (let km = step; km < distanceKm - 1e-9; km += step) out.push({ km, minutes: km * pace });
  out.push({ km: distanceKm, minutes: targetMinutes });
  return out;
}
