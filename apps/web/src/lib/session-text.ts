// Besedilo ene seanse, skupno za spletno stran, koledar in PDF.
import { formatPace } from "@finisher/core/format";
import type { Session } from "@finisher/core";
import type { T } from "./i18n";

type Dict = (typeof T)["sl"];

export function sessionDetail(t: Dict, s: Session): string[] {
  const range = (p: Session["pace"]) => (p.min === p.max ? formatPace(p.min) : `${formatPace(p.min)}–${formatPace(p.max)}`);
  const lines: string[] = [];
  const main =
    s.type === "tempo" && s.qualityKm
      ? t.tempoDetail(s.qualityKm, formatPace(s.pace.min)) + t.perKm
      : s.type === "intervals" && s.reps
        ? `${t.intervalDetail(s.reps, formatPace(s.pace.min))}${t.perKm}, ${t.jogDetail}`
        : null;
  if (main === null) lines.push(range(s.pace) + t.perKm);
  else if (s.warmKm && s.coolKm && s.easyPace) {
    // Ogrevanje, glavni del in ohlajanje, da je jasno, kam gredo vsi kilometri.
    lines.push(t.warmDetail(s.warmKm, range(s.easyPace)) + t.perKm, main, t.coolDetail(s.coolKm));
  } else lines.push(main);
  if (s.strides) lines.push(t.stridesDetail(s.strides));
  if (s.racePaceKm && s.racePace) lines.push(t.racePaceDetail(s.racePaceKm, formatPace(s.racePace)) + t.perKm);
  return lines;
}
