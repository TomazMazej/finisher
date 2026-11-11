// Za lokalni razvoj ustvari .dev.vars z naključnim TOKEN_SECRET, če datoteke še ni.
// Produkcijski ključ je v Cloudflare (wrangler secret put TOKEN_SECRET) in ni v gitu.
import { existsSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const file = new URL("../.dev.vars", import.meta.url);
if (!existsSync(file)) {
  writeFileSync(file, `TOKEN_SECRET=${randomBytes(32).toString("base64url")}\n`);
  console.log("Ustvarjen apps/web/.dev.vars z lokalnim TOKEN_SECRET.");
}
