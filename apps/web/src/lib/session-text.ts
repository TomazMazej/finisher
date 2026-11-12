// Besedilo ene seanse, skupno za spletno stran, koledar in PDF.
import { formatPace } from "@finisher/core/format";
import type { Session } from "@finisher/core";
import type { T } from "./i18n";

type Dict = (typeof T)["sl"];

export function sessionDetail(t: Dict, s: Session): string[] {
  const range = s.pace.min === s.pace.max ? formatPace(s.pace.min) : `${formatPace(s.pace.min)}–${formatPace(s.pace.max)}`;
  const lines: string[] = [];
  if (s.type === "tempo" && s.qualityKm) lines.push(t.tempoDetail(s.qualityKm, formatPace(s.pace.min)) + t.perKm);
  else if (s.type === "intervals" && s.reps) lines.push(t.intervalDetail(s.reps, formatPace(s.pace.min)) + t.perKm);
  else lines.push(range + t.perKm);
  if (s.strides) lines.push(t.stridesDetail(s.strides));
  if (s.racePaceKm && s.racePace) lines.push(t.racePaceDetail(s.racePaceKm, formatPace(s.racePace)) + t.perKm);
  return lines;
}
