// Pošiljanje emailov prek Resend (REST, brez SDK).
// Vklopi se, ko sta nastavljena RESEND_API_KEY (secret) in EMAIL_FROM (npr. "Finisher <nacrt@domena.si>").
import type { Lang } from "@finisher/core";

export interface EmailEnv {
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
}

export const emailEnabled = (e: EmailEnv) => !!(e.RESEND_API_KEY && e.EMAIL_FROM);

/** Preprosta preverba oblike naslova (strežnik ponudnika preveri še sam). */
export const validEmail = (s: string) => s.length <= 254 && /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[^\s@<>()",;]{2,}$/.test(s);

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function planLinkEmail(lang: Lang, url: string, raceLabel: string) {
  const sl = lang === "sl";
  const subject = sl ? `Tvoj Finisher načrt: ${raceLabel}` : `Your Finisher plan: ${raceLabel}`;
  const lines = sl
    ? [
        "Živijo,",
        "",
        `tukaj je povezava do tvojega načrta za ${raceLabel}:`,
        url,
        "",
        "Na tej strani so vsi treningi, kljukice, PDF in izvoz v koledar. Povezava je tvoj dostop, zato je ne deli javno.",
        "",
        "Lep tek!",
        "Finisher",
      ]
    : [
        "Hi,",
        "",
        `here is the link to your plan for ${raceLabel}:`,
        url,
        "",
        "The page has all your sessions, ticks, the PDF and calendar export. The link is your access, so don't share it publicly.",
        "",
        "Happy running!",
        "Finisher",
      ];
  const text = lines.join("\n");
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#14213d;line-height:1.5">
<p>${esc(lines[0]!)}</p>
<p>${esc(lines[2]!)}</p>
<p><a href="${esc(url)}" style="display:inline-block;background:#2346d8;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold">${sl ? "Odpri moj načrt" : "Open my plan"}</a></p>
<p style="color:#4a5873">${esc(lines[5]!)}</p>
<p>${esc(lines[7]!)}<br>Finisher</p>
</body></html>`;
  return { subject, text, html };
}

export async function sendEmail(e: EmailEnv, to: string, msg: { subject: string; text: string; html: string }): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${e.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: e.EMAIL_FROM, to: [to], subject: msg.subject, text: msg.text, html: msg.html }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}
