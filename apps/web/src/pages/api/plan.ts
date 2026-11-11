import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { generatePlan } from "@finisher/core";
import { verifyToken } from "../../lib/server/token";
import { getDone, getOrder, logEvent, parseInput } from "../../lib/server/orders";
import { json } from "../../lib/server/http";

export const prerender = false;

// Cel načrt za stran "moj načrt". Samo za plačana naročila s pravilnim žetonom.
export const GET: APIRoute = async ({ url }) => {
  const id = await verifyToken(url.searchParams.get("t"), env.TOKEN_SECRET);
  if (!id) return json({ ok: false, error: "INVALID_TOKEN" }, 401);

  const order = await getOrder(env.DB, id);
  if (!order) return json({ ok: false, error: "NOT_FOUND" }, 404);
  if (order.status !== "paid") return json({ ok: false, error: "NOT_PAID" }, 402);

  const input = parseInput(order);
  if (!input) return json({ ok: false, error: "PLAN_ERROR" }, 500);

  // Načrt se vedno izračuna od datuma nakupa, zato se tedni ne premikajo.
  const plan = generatePlan({ ...input, today: order.plan_start });
  if (!plan.ok) return json({ ok: false, error: "PLAN_ERROR" }, 500);

  const done = await getDone(env.DB, id);
  if (url.searchParams.get("open") === "1") await logEvent(env.DB, "plan_open", order.lang, String(input.distanceKm));

  return json({
    ok: true,
    lang: order.lang,
    planStart: order.plan_start,
    input,
    weeksToRace: plan.weeksToRace,
    peakKm: plan.peakKm,
    paces: plan.paces,
    warnings: plan.warnings,
    weeks: plan.weeks,
    done,
  });
};
