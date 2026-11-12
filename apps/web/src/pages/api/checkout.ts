import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { generatePlan } from "@finisher/core";
import { buildPreview, effectiveToday, parseRequest } from "../../lib/server/preview";
import { isTestCode, newOrderId, signToken } from "../../lib/server/token";
import { createCheckoutSession, findPromotionCode, stripeEnabled } from "../../lib/server/stripe";
import { logEvent } from "../../lib/server/orders";
import { json } from "../../lib/server/http";
import type { StoredInput } from "../../lib/types";

export const prerender = false;

const num = (x: unknown, lo: number, hi: number) => (typeof x === "number" && Number.isFinite(x) && x >= lo && x <= hi ? x : undefined);

/**
 * Začetek nakupa.
 * - Z veljavno testno kodo: takoj plačano testno naročilo in povezava do strani "moj načrt".
 * - Sicer, če je Stripe nastavljen: naročilo v čakanju in povezava do Stripe Checkout.
 *   Plačano ga označi šele webhook (/api/stripe-webhook).
 */
export const POST: APIRoute = async ({ request, url }) => {
  const text = await request.text();
  if (text.length > 2_000) return json({ ok: false, error: "INVALID_INPUT" }, 413);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ ok: false, error: "INVALID_INPUT" }, 400);
  }
  const req = parseRequest(body);
  if (!req) return json({ ok: false, error: "INVALID_INPUT" }, 400);
  if (!buildPreview(req).ok) return json({ ok: false, error: "INVALID_INPUT" }, 400);

  // Izrecno soglasje s pogoji in takojšnjo dostavo digitalne vsebine.
  if (body.consent !== true) return json({ ok: false, error: "CONSENT_REQUIRED" }, 400);

  // Promocijska koda (neobvezna): brezplačen dostop, koda ustvarjalca (ref_codes) ali Stripov popust.
  const raw = body.promoCode ?? body.testCode;
  const code = typeof raw === "string" ? raw.trim().slice(0, 40) : "";
  const isTest = code ? await isTestCode(code, env.TOKEN_SECRET, env.TEST_CODE) : false;
  const payments = stripeEnabled(env);
  let refCode: string | null = null;
  let promotionCodeId: string | undefined;
  if (code && !isTest) {
    const ref = await env.DB.prepare("SELECT code FROM ref_codes WHERE code = ? AND active = 1")
      .bind(code.toUpperCase())
      .first<{ code: string }>();
    refCode = ref?.code ?? null;
    if (payments) promotionCodeId = (await findPromotionCode(env, code)) ?? undefined;
    if (!refCode && !promotionCodeId) return json({ ok: false, error: "INVALID_CODE" }, 403);
  }
  if (!isTest && !payments) return json({ ok: false, error: "PAYMENTS_DISABLED" }, 403);

  const f = (body.fuel ?? {}) as Record<string, unknown>;
  const fuel = {
    carbsPerHour: num(f.carbsPerHour, 0, 150),
    gelCarbs: num(f.gelCarbs, 1, 100),
    drinkPerHour: num(f.drinkPerHour, 0, 150),
    firstGelMin: num(f.firstGelMin, 0, 180),
  };
  const today = effectiveToday(req.today);
  const input: StoredInput = {
    distanceKm: req.distanceKm,
    targetMinutes: req.targetMinutes,
    raceDate: req.raceDate,
    weeklyKm: req.weeklyKm,
    daysPerWeek: req.daysPerWeek,
    ...(req.recent ? { recent: req.recent } : {}),
    fuel,
  };
  // Preveri, da se načrt od datuma nakupa res ustvari.
  if (!generatePlan({ ...input, today }).ok) return json({ ok: false, error: "INVALID_INPUT" }, 400);

  const id = newOrderId();
  const token = await signToken(id, env.TOKEN_SECRET);
  const planPath = `/moj-nacrt?t=${encodeURIComponent(token)}`;

  if (isTest) {
    await env.DB.prepare(
      `INSERT INTO orders (id, status, lang, input_json, plan_start, provider, paid_at)
       VALUES (?, 'paid', ?, ?, ?, 'test', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
    )
      .bind(id, req.lang, JSON.stringify(input), today)
      .run();
    return json({ ok: true, url: planPath });
  }

  await env.DB.prepare(
    `INSERT INTO orders (id, status, lang, input_json, plan_start, provider, ref_code) VALUES (?, 'pending', ?, ?, ?, 'stripe', ?)`,
  )
    .bind(id, req.lang, JSON.stringify(input), today, refCode)
    .run();
  try {
    const session = await createCheckoutSession(env, {
      orderId: id,
      lang: req.lang,
      successUrl: `${url.origin}${planPath}&paid=1`,
      cancelUrl: `${url.origin}/?cancelled=1`,
      promotionCodeId,
    });
    if (!session.url) throw new Error("Stripe brez URL");
    await logEvent(env.DB, "checkout", req.lang, String(req.distanceKm));
    return json({ ok: true, url: session.url });
  } catch (e) {
    console.error("checkout", e);
    return json({ ok: false, error: "PAYMENT_ERROR" }, 502);
  }
};
