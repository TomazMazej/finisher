import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { json } from "../../../lib/server/http";
import { safeEqual, signToken } from "../../../lib/server/token";

export const prerender = false;

/**
 * Skrbniški pregled naročil (stran /skrbnik). Dostop samo z glavo
 * "Authorization: Bearer <ADMIN_KEY>"; brez nastavljene skrivnosti ADMIN_KEY je izklopljen.
 * ?q= išče po delu emaila ali ID naročila; vrne tudi prodajo po kodah ustvarjalcev.
 */
export const GET: APIRoute = async ({ request, url }) => {
  const key = env.ADMIN_KEY ?? "";
  if (key.length < 16) return json({ ok: false, error: "ADMIN_DISABLED" }, 503);
  const auth = request.headers.get("authorization") ?? "";
  if (!safeEqual(auth, `Bearer ${key}`)) return json({ ok: false, error: "UNAUTHORIZED" }, 401);

  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase().slice(0, 100);
  const like = `%${q.replace(/[%_]/g, "")}%`;
  const rows = await env.DB.prepare(
    `SELECT id, status, provider, email, lang, input_json, ref_code, amount_cents, currency, created_at, paid_at
       FROM orders
      WHERE (?1 = '' OR lower(email) LIKE ?2 OR id LIKE ?2)
      ORDER BY created_at DESC
      LIMIT 50`,
  )
    .bind(q, like)
    .all<{
      id: string;
      status: string;
      provider: string | null;
      email: string | null;
      lang: string;
      input_json: string;
      ref_code: string | null;
      amount_cents: number | null;
      currency: string | null;
      created_at: string;
      paid_at: string | null;
    }>();

  const orders = await Promise.all(
    (rows.results ?? []).map(async (r) => {
      let distanceKm: number | null = null;
      let raceDate: string | null = null;
      try {
        const i = JSON.parse(r.input_json) as { distanceKm?: number; raceDate?: string };
        distanceKm = i.distanceKm ?? null;
        raceDate = i.raceDate ?? null;
      } catch {}
      const token = await signToken(r.id, env.TOKEN_SECRET);
      const { input_json: _, ...rest } = r;
      return { ...rest, distanceKm, raceDate, url: `${url.origin}/moj-nacrt?t=${encodeURIComponent(token)}` };
    }),
  );

  const byRef = await env.DB.prepare(
    `SELECT ref_code, COUNT(*) AS sales, COALESCE(SUM(amount_cents), 0) AS cents
       FROM orders
      WHERE status = 'paid' AND provider = 'stripe' AND ref_code IS NOT NULL
      GROUP BY ref_code
      ORDER BY sales DESC`,
  ).all<{ ref_code: string; sales: number; cents: number }>();

  return json({ ok: true, orders, refs: byRef.results ?? [] });
};
