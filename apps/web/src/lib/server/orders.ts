// Dostop do naročil in kljukic v D1.
import type { Lang } from "@finisher/core";
import type { StoredInput } from "../types";

export interface OrderRow {
  id: string;
  status: "pending" | "paid" | "refunded";
  lang: Lang;
  input_json: string;
  plan_start: string;
}

export async function getOrder(db: D1Database, id: string): Promise<OrderRow | null> {
  return db
    .prepare("SELECT id, status, lang, input_json, plan_start FROM orders WHERE id = ?")
    .bind(id)
    .first<OrderRow>();
}

export function parseInput(row: OrderRow): StoredInput | null {
  try {
    return JSON.parse(row.input_json) as StoredInput;
  } catch {
    return null;
  }
}

export async function getDone(db: D1Database, orderId: string): Promise<string[]> {
  const r = await db.prepare("SELECT item FROM progress WHERE order_id = ? AND done = 1").bind(orderId).all<{ item: string }>();
  return r.results.map((x) => x.item);
}

export async function setDone(db: D1Database, orderId: string, item: string, done: boolean): Promise<void> {
  await db
    .prepare(
      `INSERT INTO progress (order_id, item, done) VALUES (?, ?, ?)
       ON CONFLICT (order_id, item) DO UPDATE SET done = excluded.done,
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
    )
    .bind(orderId, item, done ? 1 : 0)
    .run();
}

export async function logEvent(db: D1Database, name: "preview" | "checkout" | "paid" | "plan_open", lang?: string, distance?: string) {
  try {
    await db.prepare("INSERT INTO events (name, lang, distance) VALUES (?, ?, ?)").bind(name, lang ?? null, distance ?? null).run();
  } catch (e) {
    console.error("events insert failed", e);
  }
}
