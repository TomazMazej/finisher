// PDF celega načrta s potrditvenimi polji (AcroForm). Naloži se šele ob kliku (pdf-lib je velik).
// Ključi polj so enaki kot na spletu (w3s2, c4), da se kljukice ob prenosu prenesejo.
import { PDFDocument, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { fuelPlan, splits } from "@finisher/core/fuel";
import { sessionDates, weekRange } from "@finisher/core/schedule";
import { formatDuration, formatKm, formatPace } from "@finisher/core/format";
import { weeksUntil } from "@finisher/core/dates";
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
const MIST = rgb(0.91, 0.929, 0.949); // #E8EDF2
const MIST_DARK = rgb(0.80, 0.84, 0.88);
const WHITE = rgb(1, 1, 1);
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
  const [regBytes, boldBytes, dispBytes] = await Promise.all([
    loadFont("/fonts/AtkinsonHyperlegible-Regular.ttf"),
    loadFont("/fonts/AtkinsonHyperlegible-Bold.ttf"),
    loadFont("/fonts/BigShouldersDisplay-ExtraBold-latin.woff"),
  ]);
  const reg = await doc.embedFont(regBytes, { subset: true });
  const bold = await doc.embedFont(boldBytes, { subset: true });
  const display = await doc.embedFont(dispBytes, { subset: true });
  // Pisava za številke ima samo osnovno latinico; za besedilo s šumniki uporabi krepko Atkinson.
  const dispChars = new Set(display.getCharacterSet());
  const df = (str: string) => ([...str].every((c) => dispChars.has(c.codePointAt(0)!)) ? display : bold);

  const form = doc.getForm();
  const input = plan.input;
  const dist = distLabel(lang, input.distanceKm);
  const distKey = String(input.distanceKm) as keyof typeof t.distanceShort;
  const goal = formatDuration(input.targetMinutes);
  const title = t.my.pdfTitle(dist, goal);
  doc.setTitle(`Finisher: ${title}`);
  doc.setLanguage(lang === "sl" ? "sl-SI" : "en-GB");

  const dateFmt = new Intl.DateTimeFormat(t.locale, { weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const dayFmt = new Intl.DateTimeFormat(t.locale, { weekday: "short", day: "numeric", month: "numeric", timeZone: "UTC" });
  const shortFmt = new Intl.DateTimeFormat(t.locale, { day: "numeric", month: "numeric", timeZone: "UTC" });
  const d = (iso: string) => new Date(iso + "T00:00:00Z");

  const [PW, PH] = A4;
  const W = PW - 2 * M;
  const TOP = PH - 64; // pod glavo strani
  const BOTTOM = M + 30; // nad nogo
  let page!: PDFPage;
  let y = 0;
  const newPage = () => {
    page = doc.addPage(A4);
    y = TOP;
  };
  const ensure = (h: number) => {
    if (y - h < BOTTOM) newPage();
  };
  const txt = (str: string, x: number, yy: number, size: number, font: PDFFont = reg, color: RGB = INK) =>
    page.drawText(str, { x, y: yy, size, font, color });
  const right = (str: string, xr: number, yy: number, size: number, font: PDFFont = reg, color: RGB = INK) =>
    txt(str, xr - font.widthOfTextAtSize(str, size), yy, size, font, color);
  const roundRect = (x: number, yTop: number, w: number, h: number, r: number, color: RGB, topOnly = false) => {
    const b = topOnly ? 0 : r;
    const path = `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - b} Q ${w} ${h} ${w - b} ${h} H ${b} Q 0 ${h} 0 ${h - b} V ${r} Q 0 0 ${r} 0 Z`;
    page.drawSvgPath(path, { x, y: yTop, color, borderWidth: 0 });
  };
  const checkbox = (name: string, x: number, yy: number, size = 12) => {
    const cb = form.createCheckBox(name);
    cb.addToPage(page, { x, y: yy, width: size, height: size, borderColor: INK, borderWidth: 1.2, backgroundColor: WHITE });
    if (done.has(name)) cb.check();
  };
  const heading = (str: string, need = 60) => {
    ensure(need + 46);
    y -= 26;
    txt(str, M, y, 22, df(str));
    y -= 10;
    page.drawRectangle({ x: M, y, width: 36, height: 3.5, color: BLUE });
    y -= 22;
  };

  // ---------- Naslovnica: startna številka ----------
  page = doc.addPage(A4);
  const mistH = 470;
  page.drawRectangle({ x: 0, y: PH - mistH, width: PW, height: mistH, color: MIST });

  const bx = M + 34;
  const bw = W - 68;
  const bTop = PH - 70;
  const stripH = 38;
  const bh = 310;
  roundRect(bx + 3, bTop - 5, bw, bh, 10, MIST_DARK); // senca
  roundRect(bx, bTop, bw, bh, 10, WHITE);
  roundRect(bx, bTop, bw, stripH, 10, BLUE, true);
  txt("FINISHER", bx + 20, bTop - 26, 20, display, WHITE);
  const short = t.distanceShort[distKey] ?? dist;
  right(short, bx + bw - 20, bTop - 26, 20, df(short), WHITE);
  for (const [px, py] of [
    [bx + 14, bTop - stripH - 14],
    [bx + bw - 14, bTop - stripH - 14],
    [bx + 14, bTop - bh + 14],
    [bx + bw - 14, bTop - bh + 14],
  ] as const) {
    page.drawCircle({ x: px, y: py, size: 5, color: MIST, borderColor: MIST_DARK, borderWidth: 0.8 });
  }
  const ix = bx + 34;
  const iw = bw - 68;
  let by = bTop - stripH - 44;
  txt(dist, ix, by, 26, df(dist), BLUE);
  // Čas čim večji, da zapolni širino številke.
  let ts = 128;
  while (display.widthOfTextAtSize(goal, ts) > iw && ts > 60) ts -= 4;
  by -= ts * 0.74 + 12;
  txt(goal, ix - 2, by, ts, display);
  by -= 30;
  const paceStr = formatPace(input.targetMinutes / input.distanceKm);
  txt(paceStr, ix, by, 18, display);
  txt(t.bibPace, ix + display.widthOfTextAtSize(paceStr, 18) + 6, by, 11, reg, MUTE);
  right(dateFmt.format(d(input.raceDate)), ix + iw, by, 11, reg, MUTE);
  by -= 18;
  page.drawLine({ start: { x: ix, y: by }, end: { x: ix + iw, y: by }, thickness: 1.5, color: LINE, dashArray: [5, 4] });
  by -= 22;
  const today = new Date().toISOString().slice(0, 10);
  const wk = weeksUntil(today, input.raceDate);
  if (wk && wk > 0) txt(t.bibWeeks(wk), ix, by, 12, bold);
  if (plan.predictedMinutes) right(t.bibPredicted(formatDuration(plan.predictedMinutes, true)), ix + iw, by, 10, reg, MUTE);

  // Tempi pod številko
  y = PH - mistH - 34;
  txt(t.my.pdfPaces, M, y, 12, bold);
  y -= 12;
  const pc = plan.paces;
  const chips: [string, string, RGB][] = [
    [t.sessions.easy, `${formatPace(pc.easy.min)}-${formatPace(pc.easy.max)}`, TYPE_COLOR.easy],
    [t.sessions.tempo, formatPace(pc.tempo), TYPE_COLOR.tempo],
    [t.sessions.intervals, formatPace(pc.interval), TYPE_COLOR.intervals],
    [t.sessions.race, paceStr, TYPE_COLOR.race],
  ];
  const gap = 10;
  const cw = (W - gap * (chips.length - 1)) / chips.length;
  chips.forEach(([label, val, col], i) => {
    const x = M + i * (cw + gap);
    page.drawRectangle({ x, y: y - 58, width: cw, height: 58, color: MIST });
    page.drawRectangle({ x, y: y - 4, width: cw, height: 4, color: col });
    txt(label, x + 10, y - 20, 9.5, reg, MUTE);
    txt(val, x + 10, y - 46, 22, df(val));
    right(t.perKm, x + cw - 8, y - 46, 9, reg, MUTE);
  });
  y -= 80;

  // Ocena cilja
  if (plan.warnings.length) {
    const order = Object.keys(t.warnings);
    const lines = [...plan.warnings]
      .sort((a, b) => order.indexOf(a.code) - order.indexOf(b.code))
      .flatMap((w) => wrap(`• ${t.warnings[w.code](w.value, w.limit)}`, reg, 10, W - 28));
    const h = 32 + lines.length * 14;
    const shown = lines.slice(0, Math.max(0, Math.floor((y - BOTTOM - 32) / 14)));
    const hh = 32 + shown.length * 14;
    page.drawRectangle({ x: M, y: y - hh, width: W, height: hh, color: AMBER_BG });
    page.drawRectangle({ x: M, y: y - hh, width: 4, height: hh, color: AMBER });
    let yy = y - 20;
    txt(t.notesTitle, M + 14, yy, 11.5, bold, AMBER);
    for (const l of shown) {
      yy -= 14;
      txt(l, M + 14, yy, 10, reg, AMBER);
    }
    y -= h;
  }

  // ---------- Tedni ----------
  newPage();
  y += 10;
  heading(t.my.weeksTitle);
  for (const w of plan.weeks) {
    const dates = sessionDates(w, plan.weeks.length, input.raceDate, plan.planStart);
    const range = weekRange(w.number, plan.weeks.length, input.raceDate);
    const rows = w.sessions.map((s) => sessionDetail(t, s));
    const rowH = (r: string[]) => 22 + r.length * 11.5;
    ensure(44 + rowH(rows[0] ?? []));
    // Pas tedna
    y -= 34;
    const isRace = w.kind === "race";
    page.drawRectangle({ x: M, y, width: W, height: 30, color: isRace ? BLUE : MIST });
    const fg = isRace ? WHITE : INK;
    const wl = t.week(w.number);
    txt(wl, M + 12, y + 9, 17, df(wl), fg);
    txt(t.kinds[w.kind], M + 12 + df(wl).widthOfTextAtSize(wl, 17) + 10, y + 10, 10, reg, isRace ? WHITE : MUTE);
    const tot = `${formatKm(w.totalKm, lang)} km`;
    right(tot, M + W - 12, y + 9, 17, df(tot), fg);
    const r2 = `${shortFmt.format(d(range.start))} - ${shortFmt.format(d(range.end))}`;
    right(r2, M + W - 24 - df(tot).widthOfTextAtSize(tot, 17), y + 10, 10, reg, isRace ? WHITE : MUTE);
    y -= 4;
    w.sessions.forEach((s, i) => {
      const detail = rows[i]!;
      const h = rowH(detail);
      ensure(h);
      const top = y;
      page.drawRectangle({ x: M, y: top - h + 3, width: 4, height: h - 6, color: TYPE_COLOR[s.type] });
      const ly = top - 17;
      checkbox(`w${w.number}s${i + 1}`, M + 14, ly - 2);
      txt(dayFmt.format(d(dates[i]!)), M + 34, ly, 9.5, reg, MUTE);
      txt(t.sessions[s.type], M + 108, ly, 11.5, bold);
      const km = formatKm(s.km, lang);
      const kmW = display.widthOfTextAtSize(km, 20);
      right("km", M + W - 4, ly, 9, reg, MUTE);
      txt(km, M + W - 4 - reg.widthOfTextAtSize("km", 9) - 4 - kmW, ly - 1, 20, df(km));
      let yy = ly;
      for (const line of detail) {
        for (const l of wrap(line, reg, 9.5, W - 108 - 70)) {
          yy -= 11.5;
          txt(l, M + 108, yy, 9.5, reg, MUTE);
        }
      }
      y = Math.min(top - h, yy - 8);
      page.drawLine({ start: { x: M + 14, y }, end: { x: M + W, y }, thickness: 0.5, color: LINE });
    });
  }

  // ---------- Prehrana na tekmi ----------
  const fuel = fuelPlan({ distanceKm: input.distanceKm, targetMinutes: input.targetMinutes, ...input.fuel });
  heading(t.fuelTitle, 140);
  if (fuel.ok) {
    if (fuel.gels.length) {
      const sum = `${t.gels(fuel.gels.length)}${fuel.intervalMin ? `, ${t.every(Math.round(fuel.intervalMin))}` : ""}, ${t.carbsTotal(Math.round(fuel.totalCarbs))}`;
      txt(sum, M, y, 11, reg);
      y -= 58;
      // Časovnica: štart, geli, cilj
      const lx = M + 8;
      const lw = W - 16;
      page.drawLine({ start: { x: lx, y }, end: { x: lx + lw, y }, thickness: 3, color: INK });
      const xAt = (km: number) => lx + (km / input.distanceKm) * lw;
      for (const [km, lab] of [
        [0, "0"],
        [input.distanceKm, formatKm(input.distanceKm, lang)],
      ] as const) {
        page.drawRectangle({ x: xAt(km) - 1.5, y: y - 8, width: 3, height: 16, color: INK });
        const s2 = `${lab} km`;
        txt(s2, xAt(km) - reg.widthOfTextAtSize(s2, 8.5) / 2, y - 22, 8.5, reg, MUTE);
      }
      for (const g of fuel.gels) {
        const x = xAt(g.km);
        page.drawCircle({ x, y, size: 6.5, color: BLUE, borderColor: WHITE, borderWidth: 2 });
        const tm = formatDuration(g.minute);
        txt(tm, x - display.widthOfTextAtSize(tm, 15) / 2, y + 14, 15, display);
        const kmS = `${formatKm(g.km, lang)} km`;
        txt(kmS, x - reg.widthOfTextAtSize(kmS, 8.5) / 2, y - 22, 8.5, reg, MUTE);
      }
      y -= 46;
    } else {
      for (const w of fuel.warnings) {
        txt(t.fuelWarnings[w], M, y, 10, reg, MUTE);
        y -= 14;
      }
    }
  }
  // Vmesni časi v mreži
  const sp = splits(input.distanceKm, input.targetMinutes);
  const cols = 5;
  const cellW = (W - (cols - 1) * 6) / cols;
  const cellH = 44;
  ensure(30 + Math.ceil(sp.length / cols) * (cellH + 6));
  y -= 6;
  txt(t.my.splits, M, y, 12, bold);
  y -= 12;
  sp.forEach((s2, i) => {
    const c = i % cols;
    if (c === 0 && i > 0) y -= cellH + 6;
    const x = M + c * (cellW + 6);
    page.drawRectangle({ x, y: y - cellH, width: cellW, height: cellH, color: MIST });
    txt(`${formatKm(s2.km, lang)} km`, x + 8, y - 15, 9, reg, MUTE);
    const tm = formatDuration(s2.minutes, true);
    txt(tm, x + 8, y - 36, 17, df(tm));
  });
  y -= cellH + 8;

  // ---------- Vaje ----------
  heading(t.my.exercisesTitle, 80);
  for (const [ttl, list] of [
    [t.my.strength, EXERCISES[lang].strength],
    [t.my.stretch, EXERCISES[lang].stretch],
  ] as const) {
    ensure(44);
    txt(ttl, M, y, 12.5, bold);
    y -= 8;
    for (const e of list) {
      ensure(20);
      y -= 16;
      txt(e.name, M + 4, y, 10.5, reg);
      right(e.dose, M + W, y, 10.5, bold);
      y -= 5;
      page.drawLine({ start: { x: M + 4, y }, end: { x: M + W, y }, thickness: 0.5, color: LINE });
    }
    y -= 18;
  }
  for (const l of wrap(EXERCISES[lang].note, reg, 9, W)) {
    ensure(12);
    txt(l, M, y, 9, reg, MUTE);
    y -= 12;
  }

  // ---------- Kontrolni seznam ----------
  heading(t.my.checklistTitle, 80);
  let ci = 0;
  for (const g of CHECKLIST[lang]) {
    ensure(46);
    page.drawRectangle({ x: M, y: y - 6, width: W, height: 22, color: MIST });
    txt(g.title, M + 10, y + 1, 11.5, bold);
    y -= 26;
    for (const item of g.items) {
      const lines = wrap(item, reg, 10.5, W - 34);
      ensure(lines.length * 13.5 + 8);
      checkbox(`c${ci++}`, M + 8, y - 2);
      for (const l of lines) {
        txt(l, M + 30, y, 10.5, reg);
        y -= 13.5;
      }
      y -= 6;
    }
    y -= 8;
  }

  // Opozorilo
  y -= 4;
  for (const l of wrap(t.disclaimer, reg, 8.5, W)) {
    ensure(11);
    txt(l, M, y, 8.5, reg, MUTE);
    y -= 11;
  }

  // Glava (razen naslovnice) in noga
  const pages = doc.getPages();
  pages.forEach((pg, i) => {
    if (i > 0) {
      pg.drawText("FINISHER", { x: M, y: PH - 40, size: 13, font: display, color: BLUE });
      const h = `${title}  |  ${dateFmt.format(d(input.raceDate))}`;
      pg.drawText(h, { x: PW - M - reg.widthOfTextAtSize(h, 9), y: PH - 39, size: 9, font: reg, color: MUTE });
      pg.drawLine({ start: { x: M, y: PH - 48 }, end: { x: PW - M, y: PH - 48 }, thickness: 0.5, color: LINE });
    }
    pg.drawText(t.my.pdfTickOnline, { x: M, y: 26, size: 7.5, font: reg, color: MUTE });
    pg.drawText(planUrl, { x: M, y: 16, size: 6.5, font: reg, color: BLUE });
    const n = t.my.pdfPage(i + 1, pages.length);
    pg.drawText(n, { x: PW - M - reg.widthOfTextAtSize(n, 8), y: 20, size: 8, font: reg, color: MUTE });
  });

  return doc.save();
}
