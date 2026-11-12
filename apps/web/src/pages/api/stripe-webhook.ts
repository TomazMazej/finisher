import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { verifyStripeSignature, type CheckoutSession } from "../../lib/server/stripe";
import { getOrder, logEvent, parseInput } from "../../lib/server/orders";
import { json } from "../../lib/server/http";

export const prerender = false;

/**
 * Stripe sporoči zaključen nakup. Samo tu se naročilo označi kot plačano.
 * Dogodki: checkout.session.completed in checkout.session.async_payment_succeeded.
 */
export const POST: APIRoute = async ({ request }) => {
  const raw = await request.text();
  if (raw.length > 256_000) return json({ ok: false }, 413);
  const ok = await verifyStripeSignature(raw, request.headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET ?? "");
  if (!ok) return json({ ok: false, error: "BAD_SIGNATURE" }, 400);

  let event: { type?: string; data?: { object?: CheckoutSession } };
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ ok: false }, 400);
  }
  const type = event.type ?? "";
  if (type !== "checkout.session.completed" && type !== "checkout.session.async_payment_succeeded") {
    return json({ ok: true, ignored: type });
  }
  const s = event.data?.object;
  if (!s || s.payment_status !== "paid" || !s.client_reference_id) return json({ ok: true, ignored: "unpaid" });

  const order = await getOrder(env.DB, s.client_reference_id);
  if (!order) return json({ ok: true, ignored: "unknown_order" });
  if (order.status === "paid") return json({ ok: true, duplicate: true });

  await env.DB.prepare(
    `UPDATE orders
        SET status = 'paid',
            paid_at = strftime('%Y-%m-%dT%H:%M:%fZ','now'),
            email = ?, amount_cents = ?, currency = ?, provider = 'stripe', provider_id = ?
      WHERE id = ? AND status = 'pending'`,
  )
    .bind(s.customer_details?.email ?? null, s.amount_total ?? null, s.currency ?? null, s.id, order.id)
    .run();
  const input = parseInput(order);
  await logEvent(env.DB, "paid", order.lang, input ? String(input.distanceKm) : undefined);
  return json({ ok: true });
};
