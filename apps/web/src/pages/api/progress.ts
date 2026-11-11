import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { verifyToken } from "../../lib/server/token";
import { getOrder, setDone } from "../../lib/server/orders";
import { json } from "../../lib/server/http";
import { PROGRESS_ITEM } from "../../lib/types";

export const prerender = false;

// Shrani eno kljukico. Telo: { item: "w3s2", done: true }.
export const PUT: APIRoute = async ({ url, request }) => {
  const id = await verifyToken(url.searchParams.get("t"), env.TOKEN_SECRET);
  if (!id) return json({ ok: false, error: "INVALID_TOKEN" }, 401);

  const text = await request.text();
  if (text.length > 200) return json({ ok: false, error: "INVALID_INPUT" }, 413);
  let body: { item?: unknown; done?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return json({ ok: false, error: "INVALID_INPUT" }, 400);
  }
  if (typeof body.item !== "string" || !PROGRESS_ITEM.test(body.item) || typeof body.done !== "boolean") {
    return json({ ok: false, error: "INVALID_INPUT" }, 400);
  }

  const order = await getOrder(env.DB, id);
  if (!order || order.status !== "paid") return json({ ok: false, error: "NOT_PAID" }, 402);

  await setDone(env.DB, id, body.item, body.done);
  return json({ ok: true });
};
