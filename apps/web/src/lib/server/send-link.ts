// Pošlje povezavo do načrta na email. Skupno za webhook (po plačilu) in gumb na strani "moj načrt".
import { emailEnabled, planLinkEmail, sendEmail, type EmailEnv } from "./email";
import { signToken } from "./token";
import type { Lang } from "@finisher/core";

export const LINK_SEND_MAX = 5; // na naročilo
export const LINK_SEND_GAP_SEC = 60;

const RACE: Record<Lang, Record<string, string>> = {
  sl: { "10": "10 km", "21.0975": "polmaraton", "42.195": "maraton" },
  en: { "10": "10K", "21.0975": "half marathon", "42.195": "marathon" },
};

export type SendResult = "SENT" | "EMAIL_DISABLED" | "TOO_MANY" | "TOO_SOON" | "SEND_FAILED";

export async function sendPlanLink(
  env: EmailEnv & { DB: D1Database; TOKEN_SECRET: string },
  p: { orderId: string; lang: Lang; distanceKm: number; to: string; origin: string },
): Promise<SendResult> {
  if (!emailEnabled(env)) return "EMAIL_DISABLED";
  const row = await env.DB.prepare("SELECT link_sends, link_sent_at FROM orders WHERE id = ?")
    .bind(p.orderId)
    .first<{ link_sends: number; link_sent_at: string | null }>();
  if (!row) return "SEND_FAILED";
  if (row.link_sends >= LINK_SEND_MAX) return "TOO_MANY";
  if (row.link_sent_at && Date.now() - Date.parse(row.link_sent_at) < LINK_SEND_GAP_SEC * 1000) return "TOO_SOON";

  const token = await signToken(p.orderId, env.TOKEN_SECRET);
  const url = `${p.origin}/moj-nacrt?t=${encodeURIComponent(token)}`;
  const race = RACE[p.lang][String(p.distanceKm)] ?? `${p.distanceKm} km`;
  try {
    await sendEmail(env, p.to, planLinkEmail(p.lang, url, race));
  } catch (e) {
    console.error("send link", e);
    return "SEND_FAILED";
  }
  await env.DB.prepare(
    "UPDATE orders SET link_sends = link_sends + 1, link_sent_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?",
  )
    .bind(p.orderId)
    .run();
  return "SENT";
}
