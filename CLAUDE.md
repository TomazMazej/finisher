# Finisher: projektni kontekst za Claude Code

Delovno ime: **Finisher** (preveri domeno in blagovno znamko). Ta datoteka povzame pogovor, v katerem je nastal prototip. Poleg nje sta PLAN.md (poslovni načrt) in prototype/gel-kalkulator.html (delujoč prototip).

## 1. Kaj gradimo

Spletna aplikacija za tekače, ki se pripravljajo na eno tekmo (10 km, polmaraton, maraton). Uporabnik vnese razdaljo, ciljni čas, datum tekme, trenutni tedenski obseg in število dni teka na teden (2 do 6). Dobi:

- načrt treningov po tednih (lahek tek, tempo, intervali, dolgi tek) s tempom za vsako vrsto,
- urnik prehrane med tekmo (geli, pijača),
- vaje za moč, raztezanje in gibljivost,
- kontrolni seznam za dan pred tekmo in dan tekme,
- lep PDF s kljukicami.

**Kupec:** tekač z eno tekmo, ki noče mesečne naročnine. Konkurenca (Runna) stane okoli 19,99 € na mesec ali 119,99 € na leto. Razlikovanje: enkratno plačilo (okoli 20 €), prehrana vključena, slovenščina in angleščina.

**Uporabnik projekta** je programer in tekač, ki bo aplikacijo uporabljal tudi sam. Pogovor poteka v slovenščini, kratko in neposredno. Predlagaj arhitekturo in utemelji odločitve.

### Ozadje: AI Income Challenge (Iman Gadzhi)

Projekt se je rodil iz brezplačnega 5-dnevnega spletnega izziva Imana Gadzhija (soorganizator Mark Tilbury), ki je v štirih epizodah prodajal idejo stranskega posla z "AI digitalnimi izdelki" (sistem Develop, Distribute, Deliver). Cilj izziva je prodaja programa Monetise (1.995 $ ali obroki od 166 $ na mesec, 90-dnevni program z orodji Synthesise AI, ListKit in Whop, bonus za "prvih 888"). Uporabnik ničesar ni kupil.

**Kaj smo vzeli iz izziva:**

- Začni pri kupcu: ozka niša, kjer ima konkretna oseba konkreten problem.
- Veliko poceni poskusov namesto enega velikega.
- Distribucija prek manjših ustvarjalcev (10.000 do 100.000 sledilcev, še brez lastnega izdelka, poslovni email v profilu, povprečen doseg Reelov vsaj 10 % sledilcev) z delitvijo prihodka.
- Predprodaja, preden se vse zgradi.

**Česa nismo vzeli:**

- Programa Monetise, množičnega hladnega pošiljanja emailov, izdelkov brez strokovnega znanja in zdravstvenih vsebin, ki jih sestavi AI pod tujim imenom.
- Pritiskov "odloči se zdaj" in lažne redkosti.

**Kritični pogled na izziv (pomembno za marketing):**

- Gre za prodajni lijak. Številke o zaslužku (97 mio $, 155 mio $, povprečje 7.584 $ na osebo) so lastne trditve in niso neodvisno preverjene. Prikazane zgodbe so izbrani najboljši primeri.
- Imanov interes je povezan z izdelkom: je solastnik Whopa, ki dobi delež vsake transakcije, in investitor v Higgsfield. Markov demo (okoli 500 $ v tednu) je en primer in ne dokaz.
- Garancija "10x ali nadaljnje delo" ni vračilo denarja. Vračilo velja le 7 dni.

**Posledica za Finisher:** to ni "AI izdelek iz šablone". Izdelek temelji na resničnem znanju tekača in na jasnem razlikovanju (enkratno plačilo, prehrana, slovenščina). V marketingu ne obljubljaj zaslužka ali pasivnega dohodka, ne uporabljaj lažne redkosti in ne kopiraj nepreverjenih trditev iz izziva.

## 2. Stanje: prototip

Datoteka `prototype/gel-kalkulator.html`: ena HTML stran, vanilla JS, vse v brskalniku, SL in EN prek slovarja `T`, tema svetla in temna prek CSS spremenljivk. Je samo prototip za preverjanje logike, ne končna oblika.

### Pravila generiranja načrta (funkcija `plan()`)

- Število tednov do tekme (največ 20 prikazanih). Za manj kot 4 tedne se prikaže opozorilo, načrt se vseeno ustvari. Če je datum mimo, sporočilo.
- Razbremenitev (taper): 2 tedna za maraton, 1 za krajše razdalje. Zadnji teden je tekma.
- Rast obsega: največ 10 % na teden, vsak četrti teden (indeks 3, 7, ...) je lažji (×0,8). Zgornja meja tedenskega obsega: 40 km (10 km), 55 km (polmaraton), 70 km (maraton).
- Razporeditev po dnevih (2 do 6 dni): dolgi tek ima težo 1,6, tempo 1,0, lahek 0,9. Dolgi tek je omejen na 14, 20 ali 32 km po razdalji in na največ 50 % tedna.
- Intervali: vsak drugi teden (lihi indeksi, ne v razbremenitvi) zamenjajo tempo trening. Ponovitve po 800 m, število = clamp(round(q × 0,4 / 0,8), 3, 6), vmes 2 min lahkega teka.
- Tempo (min/km), izpeljan iz ciljnega tempa: lahek 1,12 do 1,28 ×, tempo trening 0,94 × (maraton), 0,97 × (polmaraton), 1,06 × (10 km), intervali 0,88 × / 0,93 × / 0,97 ×. Pri tempo treningu je približno polovica kilometrov v tempu, ostalo ogrevanje in ohlajanje.
- Opozorila: povprečen tek nad 12 km pri vnosu, 2 dneva za maraton, tedenski obseg pod 20 km za maraton.

### Pravila prehrane (kalkulator)

- Cilj ogljikovih hidratov: privzeto 60 g/h (nastavljivo, nad 90 g/h opozorilo).
- Gel: privzeto 25 g, pijača: privzeto 15 g/h, prvi gel po 30 min.
- Razmik med geli (min) = g na gel / (cilj − pijača) × 60. Brez gela v zadnjih 15 minutah.
- Vmesni časi na 5 km pri enakomernem tempu.
- Tekočin in soli ne računamo. Vedno opozorilo: ni zdravniški ali prehranski nasvet.

### Znane omejitve prototipa

- Tempi so ocene iz ciljnega časa, načrt ni pregledal trener.
- Seanse niso vezane na dneve v tednu.
- Izvoz .ics ni narejen (prenos datotek ne deluje v objavljenem artifactu).
- Zaklep načrta bi bilo mogoče zaobiti, ker je vse v brskalniku.

### Stanje kode (11. 11. 2026)

- Arhitektura: `docs/ARCHITECTURE.md`.
- `packages/core`: generator (`plan.ts`), prehrana in vmesni časi (`fuel.ts`), oblikovanje (`format.ts`). TypeScript, testi z Vitest (`npm test`, `npm run typecheck`). Vsa števila pravil so v `RULES`.
- Namestitev: `npm install --legacy-peer-deps` (npm 10 sicer pade pri peer odvisnostih Vitest).
- Popravki glede na prototip: nobena seansa ni daljša od dolgega teka (prej je pri 2 dneh tempo prerasel dolgi tek), tempo in intervali imajo zgornjo mejo (`qualityCap`), najkrajša seansa je 3 km, začetni obseg je omejen z zgornjo mejo razdalje, novo opozorilo `LOW_VOLUME_FOR_DAYS`.
- Odločitve uporabnika (11. 11.): dolgi tek raste z obsegom (`longRampExp`), zato pri maratonu v najvišjih tednih doseže 30 do 32 km tudi pri 4 do 6 dneh. Lažji tedni nimajo intervalov, ampak lažji tempo (`tempoShare.recovery`). Intervali se izmenjujejo s tempom samo v običajnih tednih gradnje.
- Opozorila in napake so kode (npr. `SHORT_PREP`), besedila pridejo iz prevodov v vmesniku.
- `apps/web`: Astro 7 + Svelte 5, ena stran (`src/pages/index.astro`, `components/Planner.svelte`). Zagon: `npm run dev -w @finisher/web`. Prevodi v `src/lib/i18n.ts` (slovenska množina prek `sl()`).
- Oblikovanje: osrednji element je papirnata startna številka, ki se izpolnjuje ob vnosu (ostane bela tudi v temni temi). Pisavi Big Shoulders Display (naslovi, številke) in Atkinson Hyperlegible (besedilo), gostovani lokalno prek @fontsource. Barve: megla #E8EDF2, črnilo #14213D, modra #2346D8, vrste treningov imajo svojo barvo poleg oznake.
- Gostovanje: Cloudflare Workers s statičnimi datotekami (`@astrojs/cloudflare` v14, `apps/web/wrangler.jsonc`). Strani so statične, `/api/*` teče na zahtevo (`export const prerender = false`). Vezave dobiš z `import { env } from "cloudflare:workers"`.
- Baza: D1 `finisher` (WEUR), vezava `DB`, migracije v `apps/web/migrations`. Lokalno: `npm run db:migrate:local -w @finisher/web`, produkcija: `db:migrate:remote`.
- `POST /api/preview` (`src/pages/api/preview.ts`, logika v `src/lib/server/preview.ts`): vrne prva dva tedna in seštevke tednov. Generator je samo v strežniškem paketu, odjemalec uvaža le `@finisher/core/fuel`, `/format`, `/dates` in tipe. Preverba: v `dist/client` ni nizov `longRampExp` ali `qualityCap`.
- Datum "danes" pošlje odjemalec, strežnik ga sprejme le, če je največ en dan od njegovega.
- Lijak: tabela `events` (brez IP in brez ID obiskovalca), predogled se zabeleži enkrat na obisk.
- Gumb za nakup brez plačil odpre polje za testno kodo (glej spodaj).
- Nizek obseg (11. 11., po uporabnikovem primeru 10 km v 1:00 z 8 km na teden): število tekov v tednu je `runsForWeek` = floor(obseg / 4), med 2 in izbranimi dnevi, da se obseg ne napihne z minimalnimi teki. Tempo in intervali šele od 5 km (`minQualityKm`), krajši je lahek tek. Pri dveh tekih sme dolgi tek pokriti 60 % tedna. Lahki teki v tednu tekme skupaj največ 50 % najvišjega tedna. Opozorilo `LONG_RUN_SHORT`, če je najdaljši tek pod 70 % razdalje tekme. Trenutni obseg je izhodišče: načrt od njega raste največ 10 % na teden.
- Stran "moj načrt" (`/moj-nacrt?t=<žeton>`, `components/MyPlan.svelte`): žeton `<orderId>.<HMAC-SHA256>` s skrivnim ključem `TOKEN_SECRET` (`src/lib/server/token.ts`). `GET /api/plan` vrne cel načrt samo za plačana naročila, izračunan od `plan_start` (tedni se ne premikajo). `PUT /api/progress` shrani kljukico (`w3s2` ali `c4`). Tedni so poravnani na dan tekme, trenutni teden je označen. Vsebina vaj in kontrolnega seznama je v `src/lib/content.ts` (vrstni red kontrolnega seznama po objavi ne spreminjaj, ključi so indeksi).
- Ocena forme (11. 11.): neobvezen nedavni rezultat (`recent`: razdalja + čas) → Riegel `predictMinutes` (eksponent 1,06). Tempi treningov izhajajo iz počasnejšega od cilja in ocene, tekma in odseki v tempu tekme iz cilja. Opozorilo `GOAL_AMBITIOUS`, če je cilj več kot 3 % hitrejši od ocene. `predictedMinutes` se pokaže na startni številki.
- Delo v tempu tekme (`addRacePaceWork`): v tednih gradnje brez tempa ali intervalov 4 × 20 s pospeškov na prvem lahkem teku in zadnji 1 do 2 km dolgega teka v tempu tekme. Zadnja dva običajna tedna gradnje: dolgi tek konča z 20 % v tempu tekme (največ 3/5/8 km). Teden tekme: pospeški na zadnjem lahkem teku. Lažji tedni in razbremenitev brez tega. Polja `strides`, `racePaceKm`, `racePace` na seansi.
- Besedilo `SHORT_PREP` pove, kaj je v manj kot 4 tednih realno (spočit na štart, začni počasneje, ciljni čas kot zgornja meja).
- Opozorila so v enem okvirju "Ocena cilja" (`components/Notes.svelte`), kratka besedila, najpomembnejša prva.
- Testni dostop (12. 11.): `POST /api/checkout` brez plačil sprejme samo testno kodo = prvih 12 znakov base64url(HMAC-SHA256(TOKEN_SECRET, "test-access-v1")) (`testAccessCode` v `token.ts`). Ustvari plačano naročilo s `provider = 'test'` in vrne povezavo do strani "moj načrt". Koda se shrani v brskalnik (`localStorage.testCode`), naslednjič gumb za nakup preusmeri takoj. Ob menjavi TOKEN_SECRET se koda spremeni. Testna naročila pri analitiki izloči po `provider = 'test'`.
- Razpored po dnevih (`core/schedule.ts`): tedni se končajo na dan tekme, dolgi tek je zadnji dan tedna, v tednu tekme je dan pred tekmo počitek. `sessionDates(..., notBefore)` prvi teden prestavi seanse za datum nakupa.
- Izvoz (stran "moj načrt"): koledar `.ics` (`core/ics.ts`, celodnevni dogodki, UID `<orderId>-w3s2@finisher`) in PDF (`lib/pdf.ts`, pdf-lib + fontkit, naloži se ob kliku, pisava Atkinson Hyperlegible TTF v `public/fonts` z OFL). PDF ima AcroForm potrditvena polja z istimi ključi kot splet in trenutno stanje kljukic. Kljukanje v Preview, Adobe, Chrome in iOS mora preveriti uporabnik.
- Lokalni ključ: `scripts/dev-vars.mjs` ustvari `apps/web/.dev.vars` (ni v gitu). Testno naročilo: `npm run order:test -w @finisher/web` (lokalno) ali `TOKEN_SECRET=... npm run order:test -w @finisher/web -- --remote`.
- Razvoj: uporabnikov MacBook (late 2015) ima macOS 12.6, workerd zahteva 13.5+, zato lokalni `astro dev` in lokalni D1 ne tečeta na Macu. Razvoj teče v GitHub Codespaces (`.devcontainer/devcontainer.json`), objava prek Cloudflare Workers Builds iz GitHuba.
- Produkcijska baza ima migracijo `0001_init.sql` že uveljavljeno (zapis v `d1_migrations`).
- Produkcija: https://finisher.raceplan.workers.dev (poddomena računa `raceplan`). Workers Builds (GitHub TomazMazej/finisher, veja main): root `apps/web`, build `cd ../.. && npm ci --legacy-peer-deps && npm run build -w @finisher/web`, deploy `npx wrangler deploy`, preview buildi izklopljeni. Vsak push na main objavi stran.

## 3. Zahteve za pravo različico

**Izgled in uporabnost** (izdelek se prodaja, zato mora biti res dobro narejen):

- Lep, pregleden in prijazen vmesnik, najprej za telefon, svetla in temna tema, dostopnost (kontrast, tipkovnica, velike tipke).
- Jasen potek: vnos podatkov, predogled, plačilo, polni načrt.
- Prostor za oblikovanje, ki ga ni v prototipu: ikone, ilustracije, tipografija, animacije z mero.

**PDF paket:**

- Lep, natisljiv PDF z načrtom, prehrano, vajami in kontrolnim seznamom.
- Uporabnik lahko **kljuka opravljene treninge** in **kontrolni seznam pred maratonom**.
- Kljukice morajo delovati v običajnih bralnikih (Preview, Adobe, Chrome, iOS). Preizkusi AcroForm potrditvena polja. Če v katerem bralniku ne delujejo, uporabi rezervno rešitev: natisljivi kvadratki za kljukanje in spletna stran "moj načrt" s shranjenimi kljukicami prek email povezave.
- Izvoz v koledar (.ics).

**Brez registracije:**

- Uporabnik vnese podatke in vidi predogled (npr. prva dva tedna in urnik prehrane).
- Za polni načrt in PDF plača. Dostop prejme po emailu (povezava s podpisanim žetonom).

**Strežnik in plačila:**

- Polni načrt izda strežnik šele po potrjenem plačilu (webhook). Odjemalcu ne zaupaj. PDF in .ics se ustvarita v brskalniku na strani "moj načrt" iz že odklenjenega načrta (brezplačni Workers imajo 10 ms CPU na zahtevo).
- Plačilni posrednik, ki uredi tudi DDV (npr. Lemon Squeezy ali Paddle; preveri provizije in pogoje).
- Referenčne kode za influencerje (sledenje prodaje, delež od prodaje).
- Analitika brez piškotkov: Cloudflare Web Analytics (brezplačno), lijak (obisk, izračun, predogled, nakup) kot lastni dogodki v D1.
- Vse gostovanje in storitve na brezplačnih paketih (glej `docs/ARCHITECTURE.md`). Plača se le domena in provizija posrednika.

**Pravno in zdravje:**

- Pogoji uporabe, zasebnost (GDPR), jasno zdravstveno opozorilo.
- Brez zdravstvenih trditev in medicinskih nasvetov.
- Konservativna progresija obsega.

**Kakovost:** enotni testi za generator načrta, npr. dolgi tek je vedno najdaljši, rast do 10 % na teden, razbremenitev pred tekmo, delovanje za 2 do 6 dni in za kratke čase do tekme.

## 4. Sprejete odločitve

- Enkratno plačilo, okoli 20 €. Končno ceno določi predprodaja.
- Brez registracije.
- Slovenščina in angleščina.
- Načrt temelji na pravilih in ne na AI ob vsakem obisku (brez stroškov, dosleden, preverljiv).
- Marketing: ročno izbrani slovenski tekaški influencerji z deležem od prodaje, Instagram kot resnični tekač (ne izmišljena AI oseba), skupnosti in iskalniki. Brez množičnih hladnih emailov.

## 5. Opozorila

- Uporabnik ima pri delodajalcu konkurenčno klavzulo. Ne uporabljaj ničesar iz njegovega službenega dela in ne gradi izdelka na tem področju (zlasti ne Oracle APEX).
- Uporabnik naj preveri pogodbo glede postranske dejavnosti.
- Prodaja digitalnih izdelkov v EU: DDV po državi kupca, registrirana dejavnost. Davčnega ali pravnega svetovanja ne dajaj, napoti na računovodjo.

## 6. Prvi koraki v Claude Code

1. Preberi to datoteko, PLAN.md in prototip.
2. Predlagaj arhitekturo (statična stran in nekaj strežniških funkcij) z utemeljitvijo.
3. Prenesi logiko generatorja v ločen modul s testi.
4. Zgradi lep uporabniški vmesnik.
5. Zgradi PDF s kljukicami in preizkusi v več bralnikih.
6. Dodaj plačilo, webhook in dostop po emailu.
7. Pravne strani, analitika, referenčne kode.
