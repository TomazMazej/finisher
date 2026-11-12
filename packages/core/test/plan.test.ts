import { describe, expect, it } from "vitest";
import {
  RULES,
  distanceClass,
  generatePlan,
  predictMinutes,
  realisticImprovement,
  weeklyTargets,
  weeksUntil,
  type PlanInput,
} from "../src/plan";

const TODAY = "2026-11-11";

function addDays(date: string, days: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function input(over: Partial<PlanInput> & { weeks?: number } = {}): PlanInput {
  const { weeks = 16, ...rest } = over;
  return {
    distanceKm: 42.195,
    targetMinutes: 240,
    raceDate: addDays(TODAY, weeks * 7),
    today: TODAY,
    weeklyKm: 30,
    daysPerWeek: 4,
    ...rest,
  };
}

function ok(i: PlanInput) {
  const r = generatePlan(i);
  if (!r.ok) throw new Error("plan failed: " + r.error + " " + JSON.stringify(i));
  return r;
}

const DISTANCES = [10, 21.0975, 42.195];
const TIMES: Record<number, number> = { 10: 55, 21.0975: 120, 42.195: 240 };
const DAYS = [2, 3, 4, 5, 6];
const VOLUMES = [5, 12, 20, 30, 45, 60, 90, 150];
const WEEKS = [1, 2, 3, 4, 5, 8, 12, 16, 20, 26];

const GRID = DISTANCES.flatMap((distanceKm) =>
  DAYS.flatMap((daysPerWeek) =>
    VOLUMES.flatMap((weeklyKm) =>
      WEEKS.map((weeks) => input({ distanceKm, targetMinutes: TIMES[distanceKm]!, daysPerWeek, weeklyKm, weeks })),
    ),
  ),
);

describe("osnovno", () => {
  it("razvrsti razdalje", () => {
    expect(distanceClass(10)).toBe("tenk");
    expect(distanceClass(21.0975)).toBe("half");
    expect(distanceClass(42.195)).toBe("full");
  });

  it("šteje tedne do tekme navzgor", () => {
    expect(weeksUntil(TODAY, addDays(TODAY, 1))).toBe(1);
    expect(weeksUntil(TODAY, addDays(TODAY, 7))).toBe(1);
    expect(weeksUntil(TODAY, addDays(TODAY, 8))).toBe(2);
    expect(weeksUntil(TODAY, TODAY)).toBe(0);
  });

  it("zavrne tekmo danes ali v preteklosti", () => {
    expect(generatePlan(input({ raceDate: TODAY }))).toEqual({ ok: false, error: "RACE_PASSED" });
    expect(generatePlan(input({ raceDate: "2026-01-01" }))).toEqual({ ok: false, error: "RACE_PASSED" });
  });

  it("zavrne neveljaven vnos", () => {
    for (const bad of [
      { daysPerWeek: 1 },
      { daysPerWeek: 7 },
      { daysPerWeek: 3.5 },
      { distanceKm: 0 },
      { targetMinutes: 0 },
      { targetMinutes: NaN },
      { weeklyKm: -1 },
      { raceDate: "2027-02-30" },
      { raceDate: "1.3.2027" },
    ] as Partial<PlanInput>[]) {
      expect(generatePlan(input(bad))).toEqual({ ok: false, error: "INVALID_INPUT" });
    }
  });

  it("je determinističen", () => {
    expect(generatePlan(input())).toEqual(generatePlan(input()));
  });
});

describe("invariante čez vse kombinacije", () => {
  it(`deluje za vseh ${GRID.length} kombinacij`, () => {
    for (const i of GRID) ok(i);
  });

  it("ima pravo število tednov in seans", () => {
    for (const i of GRID) {
      const r = ok(i);
      expect(r.weeks.length).toBe(Math.min(r.weeksToRace, RULES.maxWeeksShown));
      for (const w of r.weeks) {
        // Pri nizkem obsegu je tekov manj od izbranih dni, a vsaj 2 (teden tekme: vsaj tekma).
        expect(w.sessions.length).toBeLessThanOrEqual(i.daysPerWeek);
        expect(w.sessions.length).toBeGreaterThanOrEqual(w.kind === "race" ? 1 : 2);
      }
    }
  });

  it("zadnji teden je tekma, tekma je zadnja seansa in edina", () => {
    for (const i of GRID) {
      const r = ok(i);
      const last = r.weeks.at(-1)!;
      expect(last.kind).toBe("race");
      expect(last.sessions.at(-1)!.type).toBe("race");
      expect(last.sessions.at(-1)!.km).toBe(i.distanceKm);
      const races = r.weeks.flatMap((w) => w.sessions).filter((s) => s.type === "race");
      expect(races.length).toBe(1);
    }
  });

  it("dolgi tek je vedno najdaljši v tednu", () => {
    for (const i of GRID) {
      for (const w of ok(i).weeks) {
        if (w.kind === "race") continue;
        const long = w.sessions.find((s) => s.type === "long")!;
        for (const s of w.sessions) expect(s.km).toBeLessThanOrEqual(long.km);
      }
    }
  });

  it("dolgi tek spoštuje zgornjo mejo in 50 % tedna (60 % pri dveh tekih)", () => {
    for (const i of GRID) {
      const r = ok(i);
      for (const w of r.weeks) {
        if (w.kind === "race") continue;
        const long = w.sessions.find((s) => s.type === "long")!.km;
        expect(long).toBeLessThanOrEqual(RULES.longCap[r.distanceClass]);
        const share = w.sessions.length === 2 ? RULES.longShareMaxTwoRuns : RULES.longShareMax;
        expect(long).toBeLessThanOrEqual(Math.max(RULES.minRunKm, Math.round(w.targetKm * share)));
      }
    }
  });

  it("noben trening ni krajši od minimuma", () => {
    for (const i of GRID) {
      for (const w of ok(i).weeks) for (const s of w.sessions) expect(s.km).toBeGreaterThanOrEqual(RULES.minRunKm);
    }
  });

  it("ciljni obseg raste največ 10 % glede na najvišji prejšnji teden", () => {
    for (const i of GRID) {
      const r = ok(i);
      let maxPrev = -Infinity;
      for (const w of r.weeks) {
        if (w.kind === "taper" || w.kind === "race") break;
        if (maxPrev > 0) expect(w.targetKm).toBeLessThanOrEqual(maxPrev * RULES.growth + 1e-9);
        maxPrev = Math.max(maxPrev, w.targetKm);
      }
    }
  });

  it("dejanski seštevek ne preseže cilja za več kot zaokroževanje (0,5 km na seanso)", () => {
    for (const i of GRID) {
      if (i.weeklyKm < RULES.lowVolumePerDayKm * i.daysPerWeek) continue; // tam veljajo minimumi
      for (const w of ok(i).weeks) {
        if (w.kind === "race") continue;
        expect(w.totalKm, JSON.stringify({ i, w })).toBeLessThanOrEqual(w.targetKm + 0.5 * i.daysPerWeek);
      }
    }
  });

  it("tedenski obseg ne preseže zgornje meje", () => {
    for (const i of GRID) {
      const r = ok(i);
      for (const w of r.weeks) {
        if (w.kind === "race") continue;
        expect(w.targetKm).toBeLessThanOrEqual(RULES.weeklyCap[r.distanceClass] + 1e-9);
        expect(w.totalKm).toBeLessThanOrEqual(RULES.weeklyCap[r.distanceClass] + 0.5 * i.daysPerWeek);
      }
    }
  });

  it("vsak četrti teden gradnje je lažji", () => {
    for (const i of GRID) {
      const r = ok(i);
      r.weeks.forEach((w, k) => {
        if (w.kind === "build" || w.kind === "recovery") {
          expect(w.kind).toBe(k % 4 === 3 ? "recovery" : "build");
          if (w.kind === "recovery") expect(w.targetKm).toBeLessThan(r.weeks[k - 1]!.targetKm);
        }
      });
    }
  });

  it("razbremenitev: tedni pred tekmo so lažji od vrha", () => {
    for (const i of GRID) {
      const r = ok(i);
      const build = r.weeks.filter((w) => w.kind === "build" || w.kind === "recovery");
      if (!build.length) continue;
      const peak = Math.max(...build.map((w) => w.targetKm));
      const taper = r.weeks.filter((w) => w.kind === "taper");
      for (const w of taper) expect(w.targetKm).toBeLessThan(peak);
      const raceWeek = r.weeks.at(-1)!;
      const easyKm = raceWeek.totalKm - i.distanceKm;
      expect(easyKm).toBeLessThan(Math.max(peak, RULES.minRunKm * i.daysPerWeek));
      if (r.distanceClass === "full" && r.weeks.length >= 3) expect(r.weeks.at(-2)!.kind).toBe("taper");
      // Lahki teki v tednu tekme skupaj največ pol najvišjega tedna.
      expect(easyKm).toBeLessThanOrEqual(Math.max(...build.map((w) => w.totalKm)) * RULES.raceWeekEasyMaxShare + 0.5);
    }
  });

  it("tempo in intervali: omejitve in pravila", () => {
    for (const i of GRID) {
      const r = ok(i);
      let buildIdx = 0;
      for (const w of r.weeks) {
        for (const s of w.sessions) {
          if (s.type === "tempo" || s.type === "intervals") {
            expect(s.km).toBeLessThanOrEqual(RULES.qualityCap[r.distanceClass]);
            expect(s.km).toBeGreaterThanOrEqual(RULES.minQualityKm);
          }
          if (s.type === "tempo") {
            expect(s.qualityKm).toBeGreaterThan(0);
            expect(s.qualityKm!).toBeLessThanOrEqual(s.km - RULES.warmCoolKm);
          }
          if (s.type === "intervals") {
            // ponovitve + odmori + ogrevanje in ohlajanje se ne smejo raztegniti čez dolžino treninga
            expect(s.reps! * 0.8 + (s.reps! - 1) * 0.3 + RULES.warmCoolKm).toBeLessThanOrEqual(s.km + 0.01);
          }
          if (s.type === "intervals") {
            expect(w.kind).toBe("build");
            expect(buildIdx % 2).toBe(1);
            expect(s.reps).toBeGreaterThanOrEqual(RULES.intervalReps[0]);
            expect(s.reps).toBeLessThanOrEqual(RULES.intervalReps[1]);
          }
        }
        if (w.kind === "recovery") expect(w.sessions.some((s) => s.type === "intervals")).toBe(false);
        if (w.kind === "build") buildIdx++;
      }
    }
  });

  it("tempi: intervali < tempo < tekma < lahek", () => {
    for (const d of DISTANCES) {
      const r = ok(input({ distanceKm: d, targetMinutes: TIMES[d]! }));
      const p = r.paces;
      expect(p.interval).toBeLessThan(p.easy.min);
      expect(p.easy.min).toBeLessThan(p.easy.max);
      expect(p.race).toBeLessThan(p.easy.min);
      if (r.distanceClass !== "tenk") {
        expect(p.interval).toBeLessThan(p.tempo);
        expect(p.tempo).toBeLessThan(p.race);
      }
    }
  });
});

describe("posebni primeri", () => {
  it("regresija: 2 dneva, maraton, visok obseg, tempo ni daljši od dolgega teka", () => {
    const r = ok(input({ daysPerWeek: 2, weeklyKm: 70 }));
    for (const w of r.weeks.filter((w) => w.kind !== "race")) {
      const [q, l] = w.sessions;
      expect(q!.km).toBeLessThanOrEqual(l!.km);
    }
  });

  it("maraton: dolgi tek v najvišjem tednu doseže vsaj 30 km pri 2 do 6 dneh", () => {
    for (const daysPerWeek of DAYS) {
      const r = ok(input({ daysPerWeek, weeklyKm: 30, weeks: 16 }));
      const longest = Math.max(...r.weeks.flatMap((w) => w.sessions.filter((s) => s.type === "long").map((s) => s.km)));
      expect(longest, `days=${daysPerWeek}`).toBeGreaterThanOrEqual(30);
      expect(longest).toBeLessThanOrEqual(RULES.longCap.full);
    }
  });

  it("lažji teden: tempo z manj km v tempu, brez intervalov", () => {
    const r = ok(input());
    const rec = r.weeks.filter((w) => w.kind === "recovery");
    expect(rec.length).toBeGreaterThan(0);
    for (const w of rec) {
      const t = w.sessions.find((s) => s.type === "tempo")!;
      expect(t.qualityKm!).toBeLessThanOrEqual(Math.max(RULES.minRunKm, Math.round(t.km * RULES.tempoShare.recovery)));
    }
  });

  it("intervali se izmenjujejo s tempom v običajnih tednih", () => {
    const builds = ok(input())
      .weeks.filter((w) => w.kind === "build")
      .map((w) => (w.sessions.some((s) => s.type === "intervals") ? "I" : "T"))
      .join("");
    expect(builds).toBe("TITITITITIT");
  });

  it("regresija: 10 km v 1:00, 8 km na teden, 18 dni do tekme", () => {
    for (const daysPerWeek of DAYS) {
      const r = ok(input({ distanceKm: 10, targetMinutes: 60, weeklyKm: 8, daysPerWeek, raceDate: addDays(TODAY, 18) }));
      const training = r.weeks.filter((w) => w.kind !== "race");
      for (const w of training) {
        // obseg se ne napihne zaradi minimalnih tekov
        expect(w.totalKm).toBeLessThanOrEqual(w.targetKm + 1);
        // pri tako nizkem obsegu ni tempa ali intervalov
        expect(w.sessions.every((s) => s.type === "easy" || s.type === "long")).toBe(true);
        const long = w.sessions.find((s) => s.type === "long")!.km;
        for (const s of w.sessions) if (s.type !== "long") expect(s.km).toBeLessThan(long);
      }
      const raceWeek = r.weeks.at(-1)!;
      expect(raceWeek.totalKm - 10).toBeLessThanOrEqual(5);
      expect(r.warnings.map((w) => w.code)).toContain("LONG_RUN_SHORT");
    }
  });

  it("dovolj obsega: brez opozorila LONG_RUN_SHORT", () => {
    expect(ok(input()).warnings.map((w) => w.code)).not.toContain("LONG_RUN_SHORT");
    expect(ok(input({ distanceKm: 10, targetMinutes: 50, weeklyKm: 25 })).warnings.map((w) => w.code)).not.toContain(
      "LONG_RUN_SHORT",
    );
  });

  it("ocena iz nedavnega časa (Riegel)", () => {
    expect(predictMinutes({ distanceKm: 5, minutes: 28.5 }, 10)).toBeCloseTo(28.5 * Math.pow(2, 1.06), 6);
    expect(predictMinutes({ distanceKm: 10, minutes: 60 }, 10)).toBe(60);
  });

  it("GOAL_AMBITIOUS glede na čas priprave", () => {
    const codes = (target: number, weeks: number, recent: { distanceKm: number; minutes: number }) =>
      ok(input({ distanceKm: 21.0975, targetMinutes: target, weeklyKm: 30, weeks, recent })).warnings.map((w) => w.code);
    const half110 = { distanceKm: 21.0975, minutes: 110 };
    // uporabnikov primer: zdaj 1:50, cilj 1:45 (4,5 %) v 16 tednih je realen
    expect(codes(105, 16, half110)).not.toContain("GOAL_AMBITIOUS");
    // isti cilj v 3 tednih je zahteven (dovoljeno 2 %)
    expect(codes(105, 3, half110)).toContain("GOAL_AMBITIOUS");
    // več kot 8 % tudi v dolgi pripravi
    expect(codes(100, 20, half110)).toContain("GOAL_AMBITIOUS");
    // počasnejši cilj od trenutne forme nikoli
    expect(codes(115, 2, half110)).not.toContain("GOAL_AMBITIOUS");
  });

  it("GOAL_AMBITIOUS vrne oceno in realno mejo", () => {
    const r = ok(input({ distanceKm: 21.0975, targetMinutes: 100, weeklyKm: 30, weeks: 16, recent: { distanceKm: 21.0975, minutes: 110 } }));
    const w = r.warnings.find((x) => x.code === "GOAL_AMBITIOUS")!;
    expect(w.value).toBe(110);
    expect(w.limit).toBe(Math.round(110 * (1 - realisticImprovement(16))));
    expect(realisticImprovement(1)).toBe(RULES.goalImproveMin);
    expect(realisticImprovement(40)).toBe(RULES.goalImproveMax);
  });

  it("tempi treningov iz počasnejšega od cilja in ocene, tekma v ciljnem tempu", () => {
    const base = ok(input({ distanceKm: 10, targetMinutes: 60, weeklyKm: 25 }));
    const slow = ok(input({ distanceKm: 10, targetMinutes: 60, weeklyKm: 25, recent: { distanceKm: 5, minutes: 33 } }));
    const fast = ok(input({ distanceKm: 10, targetMinutes: 60, weeklyKm: 25, recent: { distanceKm: 5, minutes: 25 } }));
    expect(slow.paces.easy.min).toBeGreaterThan(base.paces.easy.min);
    expect(slow.paces.tempo).toBeGreaterThan(base.paces.tempo);
    expect(fast.paces.easy.min).toBe(base.paces.easy.min); // hitrejša forma ne pospeši treningov
    for (const r of [base, slow, fast]) expect(r.paces.race).toBe(6);
  });

  it("neveljaven nedavni čas", () => {
    for (const recent of [
      { distanceKm: 0.5, minutes: 3 },
      { distanceKm: 5, minutes: 5 }, // 1:00/km
      { distanceKm: 5, minutes: 100 }, // 20:00/km
      { distanceKm: 5, minutes: NaN },
    ]) {
      expect(generatePlan(input({ recent }))).toEqual({ ok: false, error: "INVALID_INPUT" });
    }
  });

  it("delo v tempu tekme: pospeški in konec dolgega teka", () => {
    for (const i of GRID) {
      const r = ok(i);
      const builds = r.weeks.filter((w) => w.kind === "build");
      const last = new Set(builds.slice(-RULES.racePaceLastBuildWeeks).map((w) => w.number));
      for (const w of r.weeks) {
        const long = w.sessions.find((s) => s.type === "long");
        const quality = w.sessions.some((s) => s.type === "tempo" || s.type === "intervals");
        if (w.kind === "recovery" || w.kind === "taper") {
          expect(w.sessions.some((s) => s.strides || s.racePaceKm)).toBe(false);
        }
        if (w.kind === "build" && !quality) {
          expect(w.sessions.some((s) => s.type === "easy" && s.strides === RULES.strides) || !w.sessions.some((s) => s.type === "easy")).toBe(true);
        }
        if (long?.racePaceKm) {
          expect(long.racePace).toBe(r.paces.race);
          expect(long.racePaceKm).toBeGreaterThanOrEqual(1);
          expect(long.racePaceKm).toBeLessThan(long.km);
          expect(long.racePaceKm).toBeLessThanOrEqual(RULES.racePaceCap[r.distanceClass]);
        }
        if (w.kind === "build" && last.has(w.number) && long && long.km >= 3) expect(long.racePaceKm).toBeGreaterThan(0);
      }
      const rw = r.weeks.at(-1)!;
      if (rw.sessions.some((s) => s.type === "easy")) expect(rw.sessions.filter((s) => s.strides).length).toBe(1);
    }
  });

  it("tvoj primer: 10 km v 1:00 z 8 km na teden ima delo v ciljnem tempu", () => {
    const r = ok(input({ distanceKm: 10, targetMinutes: 60, weeklyKm: 8, raceDate: addDays(TODAY, 18) }));
    for (const w of r.weeks.filter((w) => w.kind === "build")) {
      const long = w.sessions.find((s) => s.type === "long")!;
      expect(long.racePaceKm).toBeGreaterThan(0);
      expect(long.racePace).toBe(6);
      expect(w.sessions.find((s) => s.type === "easy")!.strides).toBe(RULES.strides);
    }
  });

  it("1 teden do tekme: samo teden tekme in opozorilo", () => {
    const r = ok(input({ weeks: 1 }));
    expect(r.weeks.map((w) => w.kind)).toEqual(["race"]);
    expect(r.warnings.map((w) => w.code)).toContain("SHORT_PREP");
  });

  it("2 tedna do maratona: razbremenitev in tekma", () => {
    expect(ok(input({ weeks: 2 })).weeks.map((w) => w.kind)).toEqual(["taper", "race"]);
  });

  it("več kot 20 tednov: prikaže 20 in opozori", () => {
    const r = ok(input({ weeks: 26 }));
    expect(r.weeks.length).toBe(20);
    expect(r.warnings).toContainEqual({ code: "LONG_PREP", value: 6 });
  });

  it("opozorila iz prototipa", () => {
    const codes = (i: Partial<PlanInput>) => ok(input(i)).warnings.map((w) => w.code);
    expect(codes({ weeklyKm: 15 })).toContain("LOW_VOLUME_MARATHON");
    expect(codes({ weeklyKm: 60, daysPerWeek: 4 })).toContain("HIGH_AVG_RUN");
    expect(codes({ daysPerWeek: 2 })).toContain("TWO_DAYS_MARATHON");
    expect(codes({ weeklyKm: 10, daysPerWeek: 6 })).toContain("LOW_VOLUME_FOR_DAYS");
    expect(codes({})).toEqual([]);
  });

  it("ciljni obsegi za tipičen 16-tedenski maraton", () => {
    const t = weeklyTargets(30, 16, "full").map((x) => Math.round(x.km * 10) / 10);
    expect(t.slice(0, 5)).toEqual([30, 33, 36.3, 29, 39.9]);
    expect(t.length).toBe(16);
  });
});
