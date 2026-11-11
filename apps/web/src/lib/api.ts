import type { Preview, PreviewRequest } from "./types";

export async function fetchPreview(req: PreviewRequest, signal?: AbortSignal): Promise<Preview> {
  try {
    const res = await fetch("/api/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
      signal,
    });
    const data = (await res.json()) as Preview;
    return data;
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    return { ok: false, error: "NETWORK" };
  }
}
