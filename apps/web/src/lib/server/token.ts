// Podpisan žeton za dostop brez registracije: "<orderId>.<hmac>".
// HMAC-SHA256 s skrivnim ključem TOKEN_SECRET. Ponarediti ga ni mogoče brez ključa.

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function unb64url(s: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(s)) return null;
  const pad = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  try {
    const bin = atob(pad);
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

async function key(secret: string, usage: KeyUsage): Promise<CryptoKey> {
  if (!secret || secret.length < 32) throw new Error("TOKEN_SECRET manjka ali je prekratek (vsaj 32 znakov)");
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [usage]);
}

/** Nov naključen ID naročila (16 bajtov, base64url). */
export function newOrderId(): string {
  return b64url(crypto.getRandomValues(new Uint8Array(16)));
}

export async function signToken(orderId: string, secret: string): Promise<string> {
  const sig = await crypto.subtle.sign("HMAC", await key(secret, "sign"), enc.encode(orderId));
  return `${orderId}.${b64url(sig)}`;
}

/** Vrne ID naročila, če je podpis pravilen, sicer null. Primerjava je v konstantnem času (subtle.verify). */
export async function verifyToken(token: string | null | undefined, secret: string): Promise<string | null> {
  if (!token || token.length > 200) return null;
  const [id, sig, extra] = token.split(".");
  if (!id || !sig || extra !== undefined || !/^[A-Za-z0-9_-]{16,64}$/.test(id)) return null;
  const sigBytes = unb64url(sig);
  if (!sigBytes) return null;
  const ok = await crypto.subtle.verify("HMAC", await key(secret, "verify"), sigBytes, enc.encode(id));
  return ok ? id : null;
}
