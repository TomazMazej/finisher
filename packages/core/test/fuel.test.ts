import { describe, expect, it } from "vitest";
import { fuelPlan, splits } from "../src/fuel";
import { formatDuration, formatKm, formatPace } from "../src/format";

function ok(r: ReturnType<typeof fuelPlan>) {
  if (!r.ok) throw new Error(r.error);
  return r;
}

describe("prehrana", () => {
  it("privzete vrednosti, maraton 4:00", () => {
    const r = ok(fuelPlan({ distanceKm: 42.195, targetMinutes: 240 }));
    expect(r.intervalMin).toBeCloseTo((25 / 45) * 60);
    expect(r.gels[0]!.minute).toBe(30);
    expect(r.gels.length).toBe(6);
    expect(r.carbsFromGels).toBe(150);
    expect(r.carbsFromDrink).toBeCloseTo(52.5);
    expect(r.warnings).toEqual([]);
  });

  it("brez gela v zadnjih 15 minutah", () => {
    for (const t of [60, 95, 120, 180, 240, 300, 360]) {
      const r = ok(fuelPlan({ distanceKm: 42.195, targetMinutes: t }));
      for (const g of r.gels) expect(g.minute).toBeLessThanOrEqual(t - 15 + 1e-9);
    }
  });

  it("gel na točno meji se upošteva", () => {
    // razmik 30 min, cilj 75 min: geli pri 30 in 60 (60 = 75 − 15)
    const r = ok(fuelPlan({ distanceKm: 10, targetMinutes: 75, carbsPerHour: 65, drinkPerHour: 15 }));
    expect(r.gels.map((g) => g.minute)).toEqual([30, 60]);
  });

  it("km gela ustreza času pri enakomernem tempu", () => {
    const r = ok(fuelPlan({ distanceKm: 42.195, targetMinutes: 240 }));
    for (const g of r.gels) expect(g.km).toBeCloseTo(g.minute / (240 / 42.195));
  });

  it("opozorila", () => {
    expect(ok(fuelPlan({ distanceKm: 21.1, targetMinutes: 120, drinkPerHour: 60 })).warnings).toContain("NO_GELS");
    expect(ok(fuelPlan({ distanceKm: 42.2, targetMinutes: 240, carbsPerHour: 100 })).warnings).toContain("HIGH_CARBS");
    expect(ok(fuelPlan({ distanceKm: 42.2, targetMinutes: 240, carbsPerHour: 120, drinkPerHour: 0 })).warnings).toContain(
      "TIGHT_INTERVAL",
    );
  });

  it("kratka tekma brez gelov", () => {
    expect(ok(fuelPlan({ distanceKm: 5, targetMinutes: 25 })).gels).toEqual([]);
  });

  it("zavrne neveljaven vnos", () => {
    expect(fuelPlan({ distanceKm: 0, targetMinutes: 240 }).ok).toBe(false);
    expect(fuelPlan({ distanceKm: 42, targetMinutes: 240, gelCarbs: -1 }).ok).toBe(false);
  });
});

describe("vmesni časi", () => {
  it("maraton na 5 km in cilj", () => {
    const s = splits(42.195, 240);
    expect(s.map((x) => x.km)).toEqual([5, 10, 15, 20, 25, 30, 35, 40, 42.195]);
    expect(s.at(-1)!.minutes).toBe(240);
  });

  it("10 km: brez podvojenega cilja", () => {
    expect(splits(10, 50).map((x) => x.km)).toEqual([5, 10]);
  });
});

describe("oblikovanje", () => {
  it("tempo", () => {
    expect(formatPace(5.6875)).toBe("5:41");
    expect(formatPace(4.999)).toBe("5:00");
  });
  it("trajanje", () => {
    expect(formatDuration(125)).toBe("2:05");
    expect(formatDuration(240, true)).toBe("4:00:00");
  });
  it("km po jeziku", () => {
    expect(formatKm(21.0975, "sl")).toBe("21,1");
    expect(formatKm(21.0975, "en")).toBe("21.1");
  });
});
