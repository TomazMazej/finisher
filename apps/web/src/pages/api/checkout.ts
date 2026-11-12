import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { generatePlan } from "@finisher/core";
import { buildPreview, effectiveToday, parseRequest } from "../../lib/server/preview";
import { isTestCode, newOrderId, signToken } from "../../lib/server/token";
import { json } from "../../lib/server/http";
import type { StoredInput } from "../../lib/types";

export const prerender = false;

const num = (x: unknown, lo: number, hi: number) => (typeof x === "number" && Number.isFinite(x) && x >= lo && x <= hi ? x : undefined);

/**
 * Začetek nakupa. Plačila še niso povezana, zato zdaj deluje samo s testno kodo:
 * ustvari plačano testno naročilo in vrne povezavo do strani "moj načrt".
 */
export const POST: APIRoute = async ({ request }) => {
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

  const code = typeof body.testCode === "string" ? body.testCode.trim() : "";
  if (!code) return json({ ok: false, error: "PAYMENTS_DISABLED" }, 403);
  if (!(await isTestCode(code, env.TOKEN_SECRET, env.TEST_CODE))) return json({ ok: false, error: "INVALID_CODE" }, 403);

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
  await env.DB.prepare(
    `INSERT INTO orders (id, status, lang, input_json, plan_start, provider, paid_at)
     VALUES (?, 'paid', ?, ?, ?, 'test', strftime('%Y-%m-%dT%H:%M:%fZ','now'))`,
  )
    .bind(id, req.lang, JSON.stringify(input), today)
    .run();

  const token = await signToken(id, env.TOKEN_SECRET);
  return json({ ok: true, url: `/moj-nacrt?t=${encodeURIComponent(token)}` });
};
