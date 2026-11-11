# Tekaška aplikacija: plan od ideje do prodaje

Tomaž, pripravljeno 10. 11. 2026. Delovno ime: Finisher.

## 1. Ideja

**Izdelek:** spletna aplikacija, kjer tekač vnese datum tekme, ciljni čas, trenutni tedenski obseg in dneve teka. Dobi:

- načrt treningov po tednih s tempom za vsako vrsto treninga,
- urnik prehrane med tekmo (geli, pijača),
- razdelek z vajami za raztezanje, moč in gibljivost,
- kontrolni seznam za dan pred tekmo in dan tekme,
- vse skupaj kot PDF s kljukicami in v koledarju (.ics).

**Kupec:** tekač, ki se pripravlja na eno tekmo (prvi maraton ali polmaraton), ne želi mesečne naročnine in rad bi imel vse na enem mestu, po možnosti v slovenščini.

**Razlikovanje od konkurence:** Runna stane v evrskem območju 19,99 € na mesec ali 119,99 € na leto (oktober 2026, vir: the5krunner.com). Aplikacija ponuja tudi sinhronizacijo z uro in prilagajanje načrta. Tvoja prednost ni boljša aplikacija, ampak enkratno plačilo (okoli 20 €) za en načrt z vključeno prehrano, brez naročnine in v slovenščini.

**Pošten pogled:** to je hipoteza, ne dokaz. Dokler nihče ne plača, ne vemo, ali ljudje to kupijo.

## 2. Izvedba po fazah

| Faza | Kaj | Trajanje | Končano, ko |
|---|---|---|---|
| 0. Dodelava prototipa | Tempo po vrsti treninga, vmesni časi za tekmo, vaje, kontrolni seznam, 2 do 6 dni teka | 1 do 2 tedna | Ti sam uporabljaš načrt za svojo pripravo in ti je všeč |
| 1. Pravi izdelek (Claude Code) | Lep vmesnik, strežnik, ki ustvari načrt šele po plačilu, plačilni posrednik, dostop prek emaila, PDF s kljukicami, izvoz .ics, slovenščina in angleščina, domena, pogoji in zasebnost | 2 do 3 tedne | Tujec lahko plača in prejme načrt brez tvoje pomoči |
| 2. Predprodaja | Enostavna stran z opisom, primerom načrta in gumbom za nakup ali čakalni seznam | 1 teden | Vsaj 10 ljudi plača ali se vpiše |
| 3. Lansiranje | Promocija prek influencerjev in skupnosti, zbiranje mnenj | 4 do 6 tednov | Imaš prvih 10 plačnikov in seznam izboljšav |

**Pravila gradnje:**

- Načrt temelji na pravilih in ne na AI ob vsakem obisku. Tako je brez stroškov, dosleden in preverljiv.
- Obseg se poveča za največ približno 10 % na teden, vsak četrti teden je lažji, pred tekmo sledi razbremenitev.
- Jasno opozorilo, da to ni zdravniški ali prehranski nasvet. Brez zdravstvenih trditev.
- Zaklep načrta mora biti na strežniku. V prototipu je vse v brskalniku, zato bi se dal zaobiti.
- Brez registracije: uporabnik vnese podatke, vidi predogled (npr. prva dva tedna in prehrano), za polni načrt in PDF plača, dostop prejme po emailu.
- Izgled in uporabnost morata biti na ravni plačljivega izdelka. PDF mora biti lep, s kljukicami za opravljene treninge in za kontrolni seznam pred tekmo.

**Dodelava prototipa (faza 0), seznam:**

- [x] Razpon tempa za vsako vrsto treninga (lahek, tempo, intervali, dolgi tek)
- [x] Vmesni časi po kilometrih za tekmo
- [x] Razdelek: raztezanje, moč, gibljivost (splošno in konservativno)
- [x] Kontrolni seznam za dan pred tekmo in tekmo
- [x] 2 do 6 dni teka na teden
- [ ] Izvoz načrta v koledar (.ics): v Claude Code
- [ ] Lep PDF paket s kljukicami: v Claude Code
- [ ] Tvoj 4-tedenski test: uporabljaj načrt sam in zapiši, kaj ti ne ustreza

## 3. Zaslužek

**Cena:** okoli 20 € enkrat. Prava cena se določi v predprodaji, ne vnaprej.

**Primer izračuna.** Posrednik plačil (npr. Lemon Squeezy ali Paddle) vzame provizijo in uredi DDV. Točne pogoje preveri. Za grobo oceno računam, da ti od 20 € ostane okoli 17 €.

| Prodanih načrtov | Približen neto prihodek |
|---|---|
| 10 | 170 € |
| 50 | 850 € |
| 200 | 3.400 € |

To so primeri za razumevanje, ne napoved.

**Stroški:** Claude naročnina, domena in gostovanje (nekaj evrov na mesec), posrednik plačil (provizija od prodaje). Začetni stroški so majhni, glavni strošek je tvoj čas.

**Kasnejše razširitve:**

- načrti za 10 km in polmaraton kot ločeni izdelki,
- paket za tekaške klube ali trenerje (manj kupcev, višja cena),
- sodelovanje s tekmami (npr. načrt priprave za določen maraton).

**Davki in pravila** (nisem davčni svetovalec ali pravnik, preveri z računovodjem):

- Prodaja digitalnih izdelkov kupcem v EU prinese pravila o DDV po državi kupca. Posrednik plačil to običajno uredi.
- Prodaja zahteva registrirano dejavnost (npr. s.p. ali d.o.o.).
- Preveri pogodbo z delodajalcem glede postranske dejavnosti, ker imaš konkurenčno klavzulo. Aplikacija za tekače najverjetneje ni konkurenca, a pogodbo preberi.

## 4. Marketing in prodaja

**Sporočilo:** en načrt za tvojo tekmo, treningi in prehrana skupaj, enkratno plačilo namesto naročnine.

| Kanal | Kaj narediti | Strošek | Opomba |
|---|---|---|---|
| Tvoje občinstvo | Povej znancem, tekaškim klubom, Strava skupinam in prosi za iskren odziv | 0 € | Prvih 20 do 50 uporabnikov |
| Slovenski tekaški influencerji | Ponudba brezplačnega načrta in deleža od prodaje | delež od prodaje | Glej spodaj |
| Instagram kot resnični tekač | Pokaži svojo pripravo, uporabi orodje, deli nasvete. AI orodja (npr. Higgsfield) uporabi za grafiko, ne kot izmišljeno osebo | čas | Viralnost je loterija, zaupanje gradi resnična oseba |
| Skupnosti | Reddit (r/running), slovenski forumi in Facebook skupine. Odgovarjaj na vprašanja, ne objavljaj samo povezav | 0 € | Preberi pravila skupin |
| Iskalniki | Strani za posamezne tekme (npr. Ljubljanski maraton) s kalkulatorjem in vzorčnim načrtom | čas | Počasno, a deluje dolgoročno |
| Organizatorji tekem | Predlagaj povezavo na načrt priprave | 0 € | Po prvih mnenjih |
| Plačani oglasi | Šele, ko poznaš ceno enega kupca | od 50 € za test | Meja: cena kupca pod približno 17 € |

### Program za influencerje

**Filtri za izbiro:**

- 10.000 do 100.000 sledilcev,
- ne prodajajo še lastnega izdelka,
- povprečen doseg Reelov vsaj približno 10 % sledilcev,
- poslovni email v profilu.

**Ponudba:** brezplačen dostop do načrta, da ga preizkusi, ter lastna koda in delež od vsake prodaje (npr. 20 do 30 %, določi sam). Sledenje s kodo.

**Pomembno:** pošlji osebna sporočila 10 do 20 izbranim tekačem, ne množičnih emailov. Vsak naj dobi razlog, zakaj ravno on, in dejanski primer načrta.

**Osnutek prvega sporočila:**

> Živjo [ime], tečem [tvoja izkušnja] in sem naredil aplikacijo, ki sestavi načrt treningov in prehrane za tekmo, enkratno plačilo brez naročnine. Rad bi ti ga podaril, da ga preizkusiš pred svojo naslednjo tekmo, in slišal tvoje mnenje. Če ti bo všeč, ti lahko ponudim tudi delež od prodaje prek tvoje kode. Ti pošljem povezavo?

**Cilj:** 3 sodelovanja iz 20 sporočil.

### Merjenje

| Korak | Metrika |
|---|---|
| Obiskovalec | število obiskov |
| Uporabnik | koliko jih izračuna načrt ali urnik |
| Predogled | koliko jih vidi predogled |
| Nakup | koliko plača (konverzijo ugotovimo v predprodaji) |

## 5. Tveganja

| Tveganje | Ukrep |
|---|---|
| Nihče ne plača | Predprodaja pred polno gradnjo, vprašaj 10 tekačev |
| Konkurenca (Runna, Garmin, brezplačni načrti) | Enkratno plačilo, prehrana, slovenščina, ožja ciljna skupina |
| Poškodbe zaradi načrta | Konservativna progresija, jasno opozorilo, brez zdravstvenih trditev |
| Davki in DDV | Posrednik plačil, svetovanje računovodje |
| Konkurenčna klavzula | Preberi pogodbo, svetuj se z odvetnikom, če je kaj nejasno |
| Preveč časa | Omejitev: 4 do 6 tednov za test, nato oceni, ali nadaljevati |

## 6. Naslednji koraki

- [ ] Naročnina na Claude in namestitev Claude Code
- [ ] Prenos projektnega konteksta v Claude Code (CLAUDE.md, PLAN.md, prototip)
- [ ] Uporaba načrta pri tvojem treningu in zapis opažanj
- [ ] Preveri pogodbo glede postranske dejavnosti in poišči računovodjo
- [ ] Izberi ime in domeno, preveri blagovno znamko
- [ ] Seznam 20 slovenskih tekaških ustvarjalcev po filtrih
- [ ] Pripravi stran za predprodajo z vzorčnim načrtom
- [ ] Določi cilj: 10 plačnikov v 6 do 8 tednih
