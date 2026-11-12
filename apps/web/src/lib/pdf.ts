// PDF celega načrta s potrditvenimi polji (AcroForm). Naloži se šele ob kliku (pdf-lib je velik).
// Ključi polj so enaki kot na spletu (w3s2, c4), da se kljukice ob prenosu prenesejo.
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { fuelPlan, splits } from "@finisher/core/fuel";
import { sessionDates, weekRange } from "@finisher/core/schedule";
import { formatDuration, formatKm, formatPace } from "@finisher/core/format";
import type { Lang } from "@finisher/core";
import { T } from "./i18n";
import { CHECKLIST, EXERCISES } from "./content";
import { sessionDetail } from "./session-text";
import { distLabel, type FullPlan } from "./exports";

const A4: [number, number] = [595.28, 841.89];
const M = 42; // rob
const INK = rgb(0.078, 0.129, 0.239); // #14213D
const MUTE = rgb(0.29, 0.345, 0.45); // #4A5873
const BLUE = rgb(0.137, 0.275, 0.847); // #2346D8
const AMBER = rgb(0.54, 0.29, 0);
const AMBER_BG = rgb(0.99, 0.94, 0.85);
const LINE = rgb(0.79, 0.82, 0.87);
const TYPE_COLOR = {
  easy: rgb(0.55, 0.64, 0.77),
  tempo: BLUE,
  intervals: rgb(0.48, 0.25, 0.88),
  long: INK,
  race: rgb(0.85, 0.54, 0),
} as const;

async function loadFont(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`font ${url}: ${res.status}`);
  return res.arrayBuffer();
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) > width && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

export async function buildPlanPdf(plan: FullPlan, lang: Lang, done: Set<string>, planUrl: string): Promise<Uint8Array> {
  const t = T[lang];
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const [regBytes, boldBytes] = await Promise.all([
    loadFont("/fonts/AtkinsonHyperlegible-Regular.ttf"),
    loadFont("/fonts/AtkinsonHyperlegible-Bold.ttf"),
  ]);
  const reg = await doc.embedFont(regBytes, { subset: true });
  const bold = await doc.embedFont(boldBytes, { subset: true });
  const form = doc.getForm();
  const dist = distLabel(lang, plan.input.distanceKm);
  doc.setTitle(`Finisher: ${t.my.pdfTitle(dist, formatDuration(plan.input.targetMinutes))}`);
  doc.setLanguage(lang === "sl" ? "sl-SI" : "en-GB");

  const dateFmt = new Intl.DateTimeFormat(t.locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const dayFmt = new Intl.DateTimeFormat(t.locale, { weekday: "short", day: "numeric", month: "numeric", timeZone: "UTC" });
  const shortFmt = new Intl.DateTimeFormat(t.locale, { day: "numeric", month: "numeric", timeZone: "UTC" });
  const d = (iso: string) => new Date(iso + "T00:00:00Z");

  let page!: PDFPage;
  let y = 0;
  const W = A4[0] - 2 * M;
  const newPage = () => {
    page = doc.addPage(A4);
    y = A4[1] - M;
  };
  const ensure = (h: number) => {
    if (y - h < M + 24) newPage();
  };
  const text = (s: string, x: number, size: number, font = reg, color = INK) => {
    page.drawText(s, { x, y, size, font, color });
  };
  const heading = (s: string, size = 18) => {
    ensure(size + 30);
    y -= size + 10;
    text(s, M, size, bold);
    y -= 22;
  };
  const checkbox = (name: string, x: number, yy: number, size = 11) => {
    const cb = form.createCheckBox(name);
    cb.addToPage(page, { x, y: yy, width: size, height: size, borderColor: INK, borderWidth: 1, backgroundColor: rgb(1, 1, 1) });
    if (done.has(name)) cb.check();
  };

  // Glava
  newPage();
  text("Finisher", M, 12, bold, BLUE);
  y -= 30;
  text(t.my.pdfTitle(dist, formatDuration(plan.input.targetMinutes)), M, 26, bold);
  y -= 18;
  text(t.my.pdfMeta(dateFmt.format(d(plan.input.raceDate)), formatPace(plan.input.targetMinutes / plan.input.distanceKm)), M, 11, reg, MUTE);
  y -= 16;
  const p = plan.paces;
  text(
    `${t.my.pdfPaces}: ${t.sessions.easy} ${formatPace(p.easy.min)}–${formatPace(p.easy.max)}   ${t.sessions.tempo} ${formatPace(p.tempo)}   ${t.sessions.intervals} ${formatPace(p.interval)}${t.perKm}`,
    M,
    10,
    reg,
    MUTE,
  );
  if (plan.predictedMinutes) {
    y -= 14;
    text(t.bibPredicted(formatDuration(plan.predictedMinutes, true)), M, 10, reg, MUTE);
  }
  y -= 10;

  // Ocena cilja
  if (plan.warnings.length) {
    const order = Object.keys(t.warnings);
    const lines = [...plan.warnings]
      .sort((a, b) => order.indexOf(a.code) - order.indexOf(b.code))
      .flatMap((w) => wrap(`• ${t.warnings[w.code](w.value, w.limit)}`, reg, 9.5, W - 20));
    const h = 26 + lines.length * 13;
    ensure(h + 10);
    y -= h;
    page.drawRectangle({ x: M, y, width: W, height: h, color: AMBER_BG });
    let yy = y + h - 18;
    page.drawText(t.notesTitle, { x: M + 10, y: yy, size: 11, font: bold, color: AMBER });
    for (const l of lines) {
      yy -= 13;
      page.drawText(l, { x: M + 10, y: yy, size: 9.5, font: reg, color: AMBER });
    }
  }

  // Tedni
  heading(t.my.weeksTitle);
  y += 14;
  for (const w of plan.weeks) {
    const dates = sessionDates(w, plan.weeks.length, plan.input.raceDate, plan.planStart);
    const range = weekRange(w.number, plan.weeks.length, plan.input.raceDate);
    const rows = w.sessions.map((s) => sessionDetail(t, s));
    const blockH = 30 + rows.reduce((a, r) => a + 16 + r.length * 11, 0);
    ensure(Math.min(blockH, 260));
    y -= 22;
    text(t.week(w.number), M, 13, bold);
    text(t.kinds[w.kind], M + bold.widthOfTextAtSize(t.week(w.number), 13) + 8, 10, reg, MUTE);
    const range2 = `${shortFmt.format(d(range.start))} – ${shortFmt.format(d(range.end))}`;
    const tot = `${formatKm(w.totalKm, lang)} km`;
    text(tot, M + W - bold.widthOfTextAtSize(tot, 12), 12, bold);
    text(range2, M + W - bold.widthOfTextAtSize(tot, 12) - 12 - reg.widthOfTextAtSize(range2, 9.5), 9.5, reg, MUTE);
    y -= 6;
    page.drawLine({ start: { x: M, y }, end: { x: M + W, y }, thickness: 1, color: INK });
    w.sessions.forEach((s, i) => {
      const detail = rows[i]!;
      const rowH = 16 + detail.length * 11;
      ensure(rowH + 4);
      const top = y;
      y -= 14;
      page.drawRectangle({ x: M, y: top - rowH, width: 3, height: rowH - 2, color: TYPE_COLOR[s.type] });
      checkbox(`w${w.number}s${i + 1}`, M + 10, y - 1);
      text(dayFmt.format(d(dates[i]!)), M + 28, 9.5, reg, MUTE);
      text(t.sessions[s.type], M + 100, 11, bold);
      const km = `${formatKm(s.km, lang)} km`;
      text(km, M + W - bold.widthOfTextAtSize(km, 12), 12, bold);
      for (const line of detail) {
        y -= 11;
        text(line, M + 100, 9, reg, MUTE);
      }
      y = top - rowH;
      page.drawLine({ start: { x: M + 10, y }, end: { x: M + W, y }, thickness: 0.5, color: LINE });
    });
  }

  // Geli in vmesni časi
  const fuel = fuelPlan({ distanceKm: plan.input.distanceKm, targetMinutes: plan.input.targetMinutes, ...plan.input.fuel });
  heading(t.fuelTitle);
  if (fuel.ok) {
    if (fuel.gels.length) {
      ensure(30);
      const sum = `${t.gels(fuel.gels.length)}${fuel.intervalMin ? `, ${t.every(Math.round(fuel.intervalMin))}` : ""}, ${t.carbsTotal(Math.round(fuel.totalCarbs))}`;
      text(sum, M, 10.5, reg);
      y -= 16;
      for (const g of fuel.gels) {
        ensure(14);
        text(`${g.n}.`, M + 10, 10, reg, MUTE);
        text(formatDuration(g.minute), M + 90, 10, bold);
        text(`${formatKm(g.km, lang)} km`, M + 150, 10, reg);
        y -= 14;
      }
    } else {
      for (const w of fuel.warnings) {
        text(t.fuelWarnings[w], M, 10, reg, MUTE);
        y -= 14;
      }
    }
  }
  heading(t.my.splits, 13);
  for (const s of splits(plan.input.distanceKm, plan.input.targetMinutes)) {
    ensure(14);
    text(`${formatKm(s.km, lang)} km`, M + 10, 10, reg, MUTE);
    text(formatDuration(s.minutes, true), M + 90, 10, bold);
    y -= 14;
  }

  // Vaje
  heading(t.my.exercisesTitle);
  for (const [title, list] of [
    [t.my.strength, EXERCISES[lang].strength],
    [t.my.stretch, EXERCISES[lang].stretch],
  ] as const) {
    ensure(40);
    y -= 4;
    text(title, M, 11.5, bold);
    y -= 16;
    for (const e of list) {
      ensure(14);
      text(e.name, M + 10, 10, reg);
      text(e.dose, M + 230, 10, bold);
      y -= 14;
    }
  }
  for (const l of wrap(EXERCISES[lang].note, reg, 9, W)) {
    ensure(12);
    text(l, M, 9, reg, MUTE);
    y -= 12;
  }

  // Kontrolni seznam
  heading(t.my.checklistTitle);
  let ci = 0;
  for (const g of CHECKLIST[lang]) {
    ensure(40);
    text(g.title, M, 11.5, bold);
    y -= 18;
    for (const item of g.items) {
      const lines = wrap(item, reg, 10.5, W - 30);
      ensure(lines.length * 13 + 6);
      checkbox(`c${ci++}`, M + 4, y - 1);
      for (const l of lines) {
        text(l, M + 24, 10.5, reg);
        y -= 13;
      }
      y -= 5;
    }
    y -= 6;
  }

  // Opozorilo
  y -= 6;
  for (const l of wrap(t.disclaimer, reg, 8.5, W)) {
    ensure(11);
    text(l, M, 8.5, reg, MUTE);
    y -= 11;
  }

  // Noga: povezava in številka strani
  const pages = doc.getPages();
  pages.forEach((pg, i) => {
    pg.drawText(t.my.pdfTickOnline, { x: M, y: 24, size: 7.5, font: reg, color: MUTE });
    pg.drawText(planUrl, { x: M, y: 14, size: 6.5, font: reg, color: BLUE });
    const n = t.my.pdfPage(i + 1, pages.length);
    pg.drawText(n, { x: A4[0] - M - reg.widthOfTextAtSize(n, 8), y: 18, size: 8, font: reg, color: MUTE });
  });

  return doc.save();
}
