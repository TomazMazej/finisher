# Arhitektura (predlog)

## Pregled

```
packages/core     generator načrta, prehrana, vmesni časi (čist TypeScript, brez DOM, testi)
apps/web          Astro: statične strani + otoki (Svelte) za obrazec in predogled
apps/web/functions  strežniške funkcije (Cloudflare Pages Functions / Workers)
```

## Odločitve

| Področje | Izbira | Zakaj |
|---|---|---|
| Jezik | TypeScript povsod | En jezik za odjemalca in strežnik, isti `core` v obeh, tipi ujamejo napake v pravilih. |
| Spletna stran | Astro + Svelte otoki | Večina strani je statična (pristajalna, pravne, strani za tekme za iskalnike). Astro pošlje skoraj nič JS, interaktiven je le obrazec. Hitro na telefonu, dobro za SEO. |
| Gostovanje in funkcije | Cloudflare Pages + Functions | Statika in funkcije na enem mestu, brezplačni nivo zadošča za začetek, brez strežnika za vzdrževanje. |
| Baza | Cloudflare D1 (SQLite) | Naročila, vhodni podatki, kljukice "moj načrt", referenčne kode. Majhen obseg podatkov. |
| PDF | pdf-lib v brskalniku, na strani "moj načrt" | Brezplačni Workers imajo 10 ms CPU na zahtevo, kar za PDF s pisavami ne zadošča. Stran "moj načrt" dobi cel načrt šele po plačilu, zato je ustvarjanje PDF pri kupcu varno. |
| Plačila | Merchant of record (Lemon Squeezy ali Paddle) | Uredi DDV po državi kupca. Brez mesečne naročnine, le provizija na prodajo. |
| Email | Resend (brezplačno 3.000 na mesec, 100 na dan) | Ena vrsta emaila: povezava do načrta. |
| Dostop | HMAC podpisan žeton v povezavi | Brez registracije. Žeton nosi ID naročila, strežnik preveri podpis in stanje plačila. |
| Analitika | Cloudflare Web Analytics + lastni dogodki lijaka v D1 | Brezplačno in brez piškotkov. Ker Cloudflare nima dogodkov po meri, korake lijaka (izračun, predogled, nakup) beležimo sami. |
| Koledar | .ics v brskalniku, na strani "moj načrt" | Preprost besedilni format, ni potrebe po knjižnici. |

**Stroški:** gostovanje, baza, email in analitika so brezplačni. Plača se le domena (letno) in provizija posrednika ob prodaji. Ko bi promet presegel brezplačne meje, je naslednji korak Workers Paid za 5 $ na mesec.

## Zaklep načrta

Generator **ne gre v brskalnik**. Če bi ga poslali odjemalcu, bi si vsak lahko izračunal cel načrt.

- `POST /api/preview`: vrne prva dva tedna, tempe in opozorila.
- `POST /api/checkout`: shrani vhodne podatke, ustvari plačilo, vrne URL za plačilo.
- `POST /api/webhook`: preveri podpis posrednika, označi naročilo kot plačano, pošlje email s povezavo.
- `GET /api/plan?t=<žeton>`: cel načrt (JSON) za stran "moj načrt".
- `PUT /api/progress?t=...`: shrani kljukice.

Kalkulator prehrane je lahko v brskalniku (brezplačen, je vaba za obisk).

## Dnevi v tednu

Prototip seans ne veže na dneve. V pravi različici uporabnik izbere dan dolgega teka (privzeto nedelja), ostali dnevi se razporedijo s čim več počitka med napornimi treningi. To je potrebno za .ics.
