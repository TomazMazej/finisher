// Oblikovanje števil za prikaz. Skupno za spletno stran, PDF in .ics.

export type Lang = "sl" | "en";

/** Tempo v min/km kot m:ss. */
export function formatPace(minPerKm: number): string {
  let m = Math.floor(minPerKm);
  let s = Math.round((minPerKm - m) * 60);
  if (s === 60) {
    m++;
    s = 0;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Čas v minutah kot h:mm ali h:mm:ss. */
export function formatDuration(minutes: number, withSeconds = false): string {
  const total = Math.round(minutes * (withSeconds ? 60 : 1));
  if (withSeconds) {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    return `${h}:${String(m).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Kilometri na eno decimalko, z decimalno vejico v slovenščini. */
export function formatKm(km: number, lang: Lang): string {
  const s = String(Math.round(km * 10) / 10);
  return lang === "sl" ? s.replace(".", ",") : s;
}
