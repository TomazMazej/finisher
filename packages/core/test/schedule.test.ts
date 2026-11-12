import { describe, expect, it } from "vitest";
import { generatePlan } from "../src/plan";
import { sessionDates, weekRange } from "../src/schedule";
import { buildIcs, foldLine } from "../src/ics";
import { utcDay } from "../src/dates";

const TODAY = "2026-11-11";

describe("razpored po dnevih", () => {
  it("tedni se končajo na dan tekme in si sledijo brez lukenj", () => {
    expect(weekRange(16, 16, "2027-03-07")).toEqual({ start: "2027-03-01", end: "2027-03-07" });
    expect(weekRange(15, 16, "2027-03-07")).toEqual({ start: "2027-02-22", end: "2027-02-28" });
  });

  it("za vse kombinacije: datumi v tednu, različni, naraščajoči, dolgi tek in tekma zadnji dan", () => {
    for (const distanceKm of [10, 21.0975, 42.195])
      for (const daysPerWeek of [2, 3, 4, 5, 6])
        for (const weeklyKm of [8, 20, 40, 70])
          for (const raceDate of ["2026-11-29", "2027-01-10", "2027-03-07", "2027-06-20"]) {
            const r = generatePlan({ distanceKm, targetMinutes: distanceKm * 6, raceDate, today: TODAY, weeklyKm, daysPerWeek });
            if (!r.ok) throw new Error(r.error);
            for (const w of r.weeks) {
              const dates = sessionDates(w, r.weeks.length, raceDate);
              const { start, end } = weekRange(w.number, r.weeks.length, raceDate);
              expect(new Set(dates).size).toBe(dates.length);
              for (let i = 0; i < dates.length; i++) {
                expect(dates[i]! >= start && dates[i]! <= end).toBe(true);
                if (i > 0) expect(dates[i]! > dates[i - 1]!).toBe(true);
              }
              expect(dates.at(-1)).toBe(end);
              if (w.kind === "race") {
                expect(dates.at(-1)).toBe(raceDate);
                // dan pred tekmo je počitek
                const dayBefore = utcDay(raceDate)! - 1;
                expect(dates.some((d) => utcDay(d) === dayBefore)).toBe(false);
              }
            }
          }
  });
});

describe("razpored od datuma nakupa", () => {
  it("prvi teden: seanse niso pred datumom nakupa, če je dni dovolj", () => {
    const r = generatePlan({ distanceKm: 42.195, targetMinutes: 240, raceDate: "2027-03-07", today: "2026-11-12", weeklyKm: 30, daysPerWeek: 4 });
    if (!r.ok) throw new Error(r.error);
    const w1 = r.weeks[0]!;
    const dates = sessionDates(w1, r.weeks.length, "2027-03-07", "2026-11-12"); // teden 9. do 15. 11.
    expect(dates.every((d) => d >= "2026-11-12")).toBe(true);
    expect(new Set(dates).size).toBe(dates.length);
    expect(dates.at(-1)).toBe("2026-11-15");
    expect([...dates].sort()).toEqual(dates);
  });

  it("premalo dni: zadnje seanse na preostale dni, ostale ostanejo", () => {
    const r = generatePlan({ distanceKm: 42.195, targetMinutes: 240, raceDate: "2027-03-07", today: "2026-11-14", weeklyKm: 30, daysPerWeek: 4 });
    if (!r.ok) throw new Error(r.error);
    const dates = sessionDates(r.weeks[0]!, r.weeks.length, "2027-03-07", "2026-11-14");
    expect(dates.slice(-2)).toEqual(["2026-11-14", "2026-11-15"]);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it("drugi tedni se ne spremenijo", () => {
    const r = generatePlan({ distanceKm: 10, targetMinutes: 50, raceDate: "2027-03-07", today: "2026-11-12", weeklyKm: 25, daysPerWeek: 5 });
    if (!r.ok) throw new Error(r.error);
    const w = r.weeks[3]!;
    expect(sessionDates(w, r.weeks.length, "2027-03-07", "2026-11-12")).toEqual(sessionDates(w, r.weeks.length, "2027-03-07"));
  });
});

describe("iCalendar", () => {
  it("celodnevni dogodek, ubežni znaki, CRLF", () => {
    const ics = buildIcs(
      [{ uid: "abc-w1s1@finisher", date: "2026-11-16", summary: "Lahek tek, 6 km", description: "6:43–7:41/km\nzadnji km; hitro" }],
      "Finisher: 10 km",
      new Date("2026-11-12T07:00:00Z"),
    );
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART;VALUE=DATE:20261116\r\n");
    expect(ics).toContain("DTEND;VALUE=DATE:20261117\r\n");
    expect(ics).toContain("SUMMARY:Lahek tek\\, 6 km\r\n");
    expect(ics).toContain("DESCRIPTION:6:43–7:41/km\\nzadnji km\; hitro");
    expect(ics).toContain("DTSTAMP:20261112T070000Z");
    expect(ics.split("\r\n").every((l) => !l.includes("\n"))).toBe(true);
  });

  it("dolge vrstice prelomi na 75 bajtov, tudi s šumniki", () => {
    const line = "DESCRIPTION:" + "čšž".repeat(60);
    const folded = foldLine(line);
    for (const part of folded.split("\r\n")) expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
    expect(folded.split("\r\n").map((p, i) => (i ? p.slice(1) : p)).join("")).toBe(line);
  });

  it("prehod na naslednji mesec in leto", () => {
    const ics = buildIcs([{ uid: "x", date: "2026-12-31", summary: "Tekma" }], "x");
    expect(ics).toContain("DTEND;VALUE=DATE:20270101");
  });
});
