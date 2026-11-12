import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { verifyToken } from "../../lib/server/token";
import { getOrder, parseInput } from "../../lib/server/orders";
import { json } from "../../lib/server/http";
import { validEmail } from "../../lib/server/email";
import { sendPlanLink } from "../../lib/server/send-link";

export const prerender = false;

// Gumb "Pošlji povezavo na email" na strani "moj načrt". Samo za plačana naročila, omejeno število pošiljanj.
export const POST: APIRoute = async ({ request, url }) => {
  const id = await verifyToken(url.searchParams.get("t"), env.TOKEN_SECRET);
  if (!id) return json({ ok: false, error: "INVALID_TOKEN" }, 401);
  const order = await getOrder(env.DB, id);
  if (!order || order.status !== "paid") return json({ ok: false, error: "NOT_PAID" }, 402);

  let body: { email?: unknown };
  try {
    body = JSON.parse((await request.text()).slice(0, 1000));
  } catch {
    return json({ ok: false, error: "INVALID_EMAIL" }, 400);
  }
  const to = typeof body.email === "string" ? body.email.trim() : "";
  if (!validEmail(to)) return json({ ok: false, error: "INVALID_EMAIL" }, 400);

  const input = parseInput(order);
  const r = await sendPlanLink(env, {
    orderId: id,
    lang: order.lang,
    distanceKm: input?.distanceKm ?? 0,
    to,
    origin: url.origin,
  });
  if (r === "SENT") return json({ ok: true });
  const status = r === "EMAIL_DISABLED" ? 503 : r === "SEND_FAILED" ? 502 : 429;
  return json({ ok: false, error: r }, status);
};
