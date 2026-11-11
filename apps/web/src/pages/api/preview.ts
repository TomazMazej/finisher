import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { buildPreview, parseRequest } from "../../lib/server/preview";

export const prerender = false;

const MAX_BODY = 2_000;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

export const POST: APIRoute = async ({ request }) => {
  const text = await request.text();
  if (text.length > MAX_BODY) return json({ ok: false, error: "INVALID_INPUT" }, 413);

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ ok: false, error: "INVALID_INPUT" }, 400);
  }
  const req = parseRequest(body);
  if (!req) return json({ ok: false, error: "INVALID_INPUT" }, 400);

  const result = buildPreview(req);

  // Korak lijaka: brez IP in brez identifikatorja obiskovalca. Napaka pri zapisu ne sme ustaviti predogleda.
  if (req.track && result.ok) {
    try {
      await env.DB.prepare("INSERT INTO events (name, lang, distance) VALUES ('preview', ?, ?)")
        .bind(req.lang, String(req.distanceKm))
        .run();
    } catch (e) {
      console.error("events insert failed", e);
    }
  }

  return json(result);
};
