// Ustvari plačano testno naročilo (brez plačila) in izpiše povezavo do strani "moj načrt".
//
// Lokalno:     node scripts/test-order.mjs
// Produkcija:  TOKEN_SECRET=... node scripts/test-order.mjs --remote
//
// Možnosti: --distance 10 --time 60 --race 2026-11-29 --weekly 8 --days 4 --lang sl --start YYYY-MM-DD
// Lokalno vzame TOKEN_SECRET iz .dev.vars. Za --remote mora biti enak kot v Cloudflare (wrangler secret put TOKEN_SECRET).
import { createHmac, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const remote = args.includes("--remote");

let secret = process.env.TOKEN_SECRET;
if (!secret && !remote) {
  const vars = readFileSync(new URL("../.dev.vars", import.meta.url), "utf8");
  secret = vars.match(/^TOKEN_SECRET=(.+)$/m)?.[1]?.trim();
}
if (!secret) {
  console.error("Manjka TOKEN_SECRET.");
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const input = {
  distanceKm: Number(opt("distance", "10")),
  targetMinutes: Number(opt("time", "60")),
  raceDate: opt("race", "2026-11-29"),
  weeklyKm: Number(opt("weekly", "20")),
  daysPerWeek: Number(opt("days", "4")),
};
const lang = opt("lang", "sl");
const start = opt("start", today);

const id = randomBytes(16).toString("base64url");
const token = `${id}.${createHmac("sha256", secret).update(id).digest("base64url")}`;
const esc = (s) => String(s).replace(/'/g, "''");
const sql = `INSERT INTO orders (id, status, lang, input_json, plan_start, provider, paid_at)
VALUES ('${id}', 'paid', '${esc(lang)}', '${esc(JSON.stringify(input))}', '${esc(start)}', 'test', strftime('%Y-%m-%dT%H:%M:%fZ','now'));`;

execFileSync("npx", ["wrangler", "d1", "execute", "finisher", remote ? "--remote" : "--local", "--command", sql], {
  stdio: "inherit",
  cwd: new URL("..", import.meta.url),
});

const base = remote ? "https://finisher.raceplan.workers.dev" : "http://localhost:4321";
console.log(`\nTestno naročilo ${id}:\n${base}/moj-nacrt?t=${token}\n`);
