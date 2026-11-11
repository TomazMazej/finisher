# Finisher

Načrt treningov in urnik prehrane za eno tekmo (10 km, polmaraton, maraton). Tekač vpiše tekmo, ciljni čas, datum in trenutni obseg, dobi načrt po tednih s tempom za vsak trening, urnik gelov, vaje in kontrolni seznam. Enkratno plačilo, brez naročnine, v slovenščini in angleščini.

## Struktura

```
packages/core   generator načrta, prehrana, vmesni časi (TypeScript, testi)
apps/web        spletna stran (Astro + Svelte)
docs/           arhitektura
prototype/      prvi prototip v eni HTML datoteki
CLAUDE.md       kontekst za Claude Code: pravila, odločitve, stanje
PLAN.md         poslovni načrt
```

## Zagon

Potrebuješ Node 22 ali novejši.

```
npm install --legacy-peer-deps
npm test                       # testi generatorja
npm run dev -w @finisher/web   # stran na http://localhost:4321
npm run build -w @finisher/web # produkcijska gradnja v apps/web/dist
```

`--legacy-peer-deps` je potreben, ker npm sicer pade pri peer odvisnostih Vitesta.

## Generator

Vsa pravila (rast obsega, lažji tedni, razbremenitev, zgornje meje, tempi) so v `RULES` v `packages/core/src/plan.ts`. Testi preverijo invariante čez več kot 1.000 kombinacij vhodov: dolgi tek je vedno najdaljši, obseg raste največ 10 % na teden, pred tekmo je razbremenitev, načrt deluje za 2 do 6 dni in za 1 do 26 tednov do tekme.

## Stanje

- [x] Generator in kalkulator prehrane s testi
- [x] Vmesnik: vnos, startna številka, predogled dveh tednov, graf obsega, geli na progi, SL in EN, svetla in temna tema
- [ ] Strežnik: `/api/preview`, baza, generator samo na strežniku
- [ ] Stran "moj načrt" s kljukicami, PDF in .ics
- [ ] Plačila, email s povezavo, referenčne kode
- [ ] Pravne strani, analitika, objava

Podrobnosti v `CLAUDE.md` in `docs/ARCHITECTURE.md`.

## Opozorilo

Načrt je splošen in ni zdravniški ali prehranski nasvet.
