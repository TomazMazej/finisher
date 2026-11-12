// Stripe Checkout z Managed Payments (Stripe prek Link je prodajalec in uredi DDV).
// Brez SDK: dva klica REST API in preverjanje podpisa webhooka z Web Crypto.

const API = "https://api.stripe.com/v1";
const enc = new TextEncoder();

export interface StripeEnv {
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_ID?: string;
}

/** Plačila so vklopljena, ko so nastavljeni vsi trije ključi. */
export const stripeEnabled = (e: StripeEnv) => !!(e.STRIPE_SECRET_KEY && e.STRIPE_WEBHOOK_SECRET && e.STRIPE_PRICE_ID);

export interface CheckoutSession {
  id: string;
  url: string | null;
  client_reference_id: string | null;
  payment_status: "paid" | "unpaid" | "no_payment_required";
  amount_total: number | null;
  currency: string | null;
  customer_details: { email: string | null } | null;
}

export async function createCheckoutSession(
  e: StripeEnv,
  p: { orderId: string; lang: "sl" | "en"; successUrl: string; cancelUrl: string; promotionCodeId?: string },
): Promise<CheckoutSession> {
  const body = new URLSearchParams({
    mode: "payment",
    "line_items[0][price]": e.STRIPE_PRICE_ID!,
    "line_items[0][quantity]": "1",
    "managed_payments[enabled]": "true",
    client_reference_id: p.orderId,
    "metadata[order_id]": p.orderId,
    "payment_intent_data[metadata][order_id]": p.orderId,
    locale: p.lang === "sl" ? "sl" : "en",
    success_url: p.successUrl,
    cancel_url: p.cancelUrl,
  });
  if (p.promotionCodeId) body.set("discounts[0][promotion_code]", p.promotionCodeId);
  const res = await fetch(`${API}/checkout/sessions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${e.STRIPE_SECRET_KEY}`,
      "content-type": "application/x-www-form-urlencoded",
      // ponovni klic z istim naročilom ne ustvari druge seje
      "idempotency-key": `checkout-${p.orderId}`,
    },
    body,
  });
  const json = (await res.json()) as CheckoutSession & { error?: { message?: string } };
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${json.error?.message ?? "napaka"}`);
  return json;
}

/** Aktivna Stripe promocijska koda z istim imenom (popust), sicer null. */
export async function findPromotionCode(e: StripeEnv, code: string): Promise<string | null> {
  const q = new URLSearchParams({ code, active: "true", limit: "1" });
  const res = await fetch(`${API}/promotion_codes?${q}`, { headers: { authorization: `Bearer ${e.STRIPE_SECRET_KEY}` } });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: { id: string }[] };
  return json.data?.[0]?.id ?? null;
}

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

function equal(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/**
 * Preveri glavo Stripe-Signature (t=..., v1=...) nad surovim telesom zahteve.
 * Zavrne podpise, starejše od `toleranceSec`, da ponovljena zahteva ne gre skozi.
 */
export async function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  nowSec = Math.floor(Date.now() / 1000),
  toleranceSec = 300,
): Promise<boolean> {
  if (!header || !secret) return false;
  let t = "";
  const sigs: string[] = [];
  for (const part of header.split(",")) {
    const [k, v] = part.split("=", 2);
    if (k === "t" && v) t = v;
    else if (k === "v1" && v) sigs.push(v);
  }
  const ts = Number(t);
  if (!t || !Number.isFinite(ts) || !sigs.length) return false;
  if (Math.abs(nowSec - ts) > toleranceSec) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = hex(await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${rawBody}`)));
  return sigs.some((s) => equal(s, expected));
}
