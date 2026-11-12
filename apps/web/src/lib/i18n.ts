import type { Lang, SessionType, WarningCode, WeekKind, FuelWarning } from "@finisher/core";
import { formatDuration } from "@finisher/core/format";

type Dict = {
  tagline: string;
  intro: string;
  langLabel: string;
  themeLabel: string;
  themeAuto: string;
  themeLight: string;
  themeDark: string;
  raceSection: string;
  trainingSection: string;
  distance: string;
  distances: Record<"10" | "21.0975" | "42.195", string>;
  distanceShort: Record<"10" | "21.0975" | "42.195", string>;
  targetTime: string;
  hours: string;
  minutes: string;
  raceDate: string;
  weeklyKm: string;
  weeklyKmHint: string;
  days: string;
  daysHint: string;
  recentLabel: string;
  recentHint: string;
  recentNone: string;
  recentHour: string;
  recentHourLabel: string;
  recentMin: string;
  recentSec: string;
  bibPredicted: (time: string) => string;
  stridesDetail: (n: number) => string;
  racePaceDetail: (km: number, pace: string) => string;
  bibPace: string;
  bibWeeks: (n: number) => string;
  bibNoDate: string;
  previewTitle: string;
  previewIntro: string;
  week: (n: number) => string;
  run: (n: number) => string;
  kinds: Record<WeekKind, string>;
  sessions: Record<SessionType, string>;
  tempoDetail: (q: number, pace: string) => string;
  intervalDetail: (reps: number, pace: string) => string;
  warmDetail: (km: number, pace: string) => string;
  coolDetail: (km: number) => string;
  jogDetail: string;
  perKm: string;
  volumeTitle: string;
  volumeIntro: (n: number) => string;
  peak: (km: number) => string;
  lockedWeeks: (n: number) => string;
  fuelTitle: string;
  fuelIntro: string;
  fuelSettings: string;
  carbs: string;
  gelCarbs: string;
  drink: string;
  firstGel: string;
  gels: (n: number) => string;
  carbsTotal: (g: number) => string;
  every: (min: number) => string;
  start: string;
  finish: string;
  buyTitle: string;
  buyItems: string[];
  buyCta: string;
  buyNote: string;
  consent: { before: string; terms: string; after: string };
  promoCode: string;
  buyErrors: Record<"INVALID_CODE" | "INVALID_INPUT" | "NETWORK" | "PAYMENT_ERROR" | "PAYMENTS_DISABLED", string>;
  errors: Record<"INVALID_INPUT" | "RACE_PASSED" | "NO_DATE" | "NETWORK", string>;
  warnings: Record<WarningCode, (v?: number, limit?: number) => string>;
  notesTitle: string;
  fuelWarnings: Record<FuelWarning, string>;
  disclaimer: string;
  locale: string;
  my: {
    title: string;
    loading: string;
    progress: (done: number, total: number) => string;
    thisWeek: string;
    weeksTitle: string;
    weekRange: (from: string, to: string) => string;
    markDone: (what: string) => string;
    saveFailed: string;
    splits: string;
    strength: string;
    stretch: string;
    exercisesTitle: string;
    checklistTitle: string;
    keepLink: string;
    calendar: string;
    pdf: string;
    preparing: string;
    exportFailed: string;
    sendLabel: string;
    send: string;
    sending: string;
    sendResult: Record<"SENT" | "INVALID_EMAIL" | "EMAIL_DISABLED" | "TOO_MANY" | "TOO_SOON" | "SEND_FAILED", string>;
    exportHint: string;
    calName: (dist: string) => string;
    pdfTitle: (dist: string, time: string) => string;
    pdfMeta: (date: string, pace: string) => string;
    pdfPaces: string;
    pdfTickOnline: string;
    pdfGels: string;
    pdfPage: (n: number, of: number) => string;
    confirming: string;
    errors: Record<"INVALID_TOKEN" | "NOT_PAID" | "NOT_FOUND" | "PLAN_ERROR" | "NETWORK", string>;
  };
};

/** Slovenska množina: 1 teden, 2 tedna, 3 in 4 tedni, 5+ tednov (po zadnjih dveh mestih). */
function sl(n: number, one: string, two: string, few: string, many: string): string {
  const m = n % 100;
  return m === 1 ? one : m === 2 ? two : m === 3 || m === 4 ? few : many;
}
const slWeeks = (n: number) => `${n} ${sl(n, "teden", "tedna", "tedni", "tednov")}`;

export const T: Record<Lang, Dict> = {
  sl: {
    tagline: "Načrt za tvojo tekmo",
    intro:
      "Vpiši tekmo in ciljni čas. Dobiš načrt treningov do dneva tekme, tempo za vsak trening in urnik gelov za tekmo. Enkratno plačilo, brez naročnine.",
    langLabel: "Jezik",
    themeLabel: "Tema",
    themeAuto: "Samodejno",
    themeLight: "Svetla",
    themeDark: "Temna",
    raceSection: "Tekma",
    trainingSection: "Tvoj tek zdaj",
    distance: "Razdalja",
    distances: { "10": "10 km", "21.0975": "Polmaraton", "42.195": "Maraton" },
    distanceShort: { "10": "10 km", "21.0975": "21,1 km", "42.195": "42,2 km" },
    targetTime: "Ciljni čas",
    hours: "ur",
    minutes: "minut",
    raceDate: "Datum tekme",
    weeklyKm: "Km na teden",
    weeklyKmHint: "Koliko zdaj povprečno pretečeš na teden.",
    days: "Dni teka na teden",
    daysHint: "Dolgi tek je vedno zadnji tek v tednu.",
    recentLabel: "Nedavni rezultat (neobvezno)",
    recentHint: "Tekma ali tek na polno v zadnjih 6 tednih. Iz njega ocenimo tvojo formo in tempe treningov.",
    recentNone: "Brez",
    recentHour: "h",
    recentHourLabel: "ure",
    recentMin: "min",
    recentSec: "s",
    bibPredicted: (t) => `Ocena po tvoji formi: ${t}`,
    stridesDetail: (n) => `na koncu ${n} × 20 s pospeškov`,
    racePaceDetail: (km, pace) => `zadnji ${km === 1 ? "kilometer" : `${km} km`} v tempu tekme ${pace}`,
    bibPace: "na km",
    bibWeeks: (n) => `${slWeeks(n)} do štarta`,
    bibNoDate: "izberi datum",
    previewTitle: "Prva dva tedna",
    previewIntro: "Tako se začne tvoj načrt. Cel načrt dobiš po nakupu.",
    week: (n) => `${n}. teden`,
    run: (n) => `${n}. tek`,
    kinds: { build: "Gradnja", recovery: "Lažji teden", taper: "Razbremenitev", race: "Teden tekme" },
    sessions: { easy: "Lahek tek", tempo: "Tempo", intervals: "Intervali", long: "Dolgi tek", race: "Tekma" },
    tempoDetail: (q, pace) => `${q} km v tempu ${pace}`,
    intervalDetail: (reps, pace) => `${reps} × 800 m v tempu ${pace}`,
    warmDetail: (km, pace) => `${km} km ogrevanja, lahko ${pace}`,
    coolDetail: (km) => `${km} km ohlajanja, lahko`,
    jogDetail: "vmes 2 min lahkega teka",
    perKm: "/km",
    volumeTitle: "Obseg do tekme",
    volumeIntro: (n) => `${slWeeks(n)} po tednih. Vsak četrti teden je lažji, pred tekmo se obseg zmanjša.`,
    peak: (km) => `Najvišji teden: ${km} km`,
    lockedWeeks: (n) => `Še ${slWeeks(n)} v celem načrtu`,
    fuelTitle: "Geli na tekmi",
    fuelIntro: "Kdaj vzeti gel pri enakomernem tempu.",
    fuelSettings: "Nastavi prehrano",
    carbs: "Ogljikovi hidrati na uro (g)",
    gelCarbs: "Ogljikovi hidrati v gelu (g)",
    drink: "Iz pijače na uro (g)",
    firstGel: "Prvi gel po (min)",
    gels: (n) => `${n} ${sl(n, "gel", "gela", "geli", "gelov")}`,
    carbsTotal: (g) => `${g} g ogljikovih hidratov skupaj`,
    every: (min) => `vsakih ${min} min`,
    start: "Štart",
    finish: "Cilj",
    buyTitle: "Cel načrt",
    buyItems: [
      "vsi tedni do tekme s tempom za vsak trening",
      "urnik gelov in vmesni časi",
      "vaje za moč in gibljivost",
      "kontrolni seznam za dan pred tekmo in dan tekme",
      "PDF za tisk in kljukanje ter izvoz v koledar",
    ],
    buyCta: "Kupi cel načrt",
    consent: {
      before: "Strinjam se s ",
      terms: "pogoji uporabe",
      after: " in želim dostop takoj. Vem, da s tem izgubim pravico do odstopa v 14 dneh.",
    },
    buyNote: "Enkratno plačilo prek Stripe, brez registracije. Po plačilu se odpre tvoj načrt.",
    promoCode: "Promocijska koda (neobvezno)",
    buyErrors: {
      INVALID_CODE: "Te promocijske kode ne poznamo. Preveri jo ali pusti polje prazno.",
      PAYMENTS_DISABLED: "Plačila še niso odprta. Z veljavno promocijsko kodo načrt odpreš že zdaj.",
      INVALID_INPUT: "Preveri podatke o tekmi zgoraj.",
      NETWORK: "Povezava ni uspela. Poskusi znova.",
      PAYMENT_ERROR: "Plačila trenutno ni mogoče začeti. Poskusi čez nekaj minut.",
    },
    errors: {
      INVALID_INPUT: "Preveri ciljni čas, km na teden in datum tekme.",
      RACE_PASSED: "Datum tekme je danes ali že mimo. Izberi poznejši datum.",
      NO_DATE: "Izberi datum tekme.",
      NETWORK: "Predogleda ni bilo mogoče naložiti. Preveri povezavo in poskusi znova.",
    },
    warnings: {
      GOAL_AMBITIOUS: (v, limit) =>
        `Zdaj zmoreš okoli ${formatDuration(v ?? 0)}. Z napredkom do tekme je realno okoli ${formatDuration(limit ?? v ?? 0)}, cilj je hitrejši od tega.`,
      LONG_RUN_SHORT: (v) => `Najdaljši tek bo ${v} km, precej manj od tekme, zato je cilj zahteven.`,
      SHORT_PREP: () => "Manj kot 4 tedne do tekme: forma se ne bo dosti spremenila. Pridi spočit, začni malo počasneje in ciljni čas vzemi kot zgornjo mejo.",
      LOW_VOLUME_MARATHON: () => "Manj kot 20 km na teden je za maraton malo.",
      TWO_DAYS_MARATHON: () => "Dva teka na teden sta za maraton malo.",
      HIGH_AVG_RUN: (v) => `Povprečen tek bi bil okoli ${v} km. Če zdaj ne tečeš toliko, zmanjšaj km na teden.`,
      LOW_VOLUME_FOR_DAYS: () => "Za toliko dni je km malo, zato je tekov sprva manj. Dodajajo se, ko obseg raste.",
      LONG_PREP: (v) => `Načrt pokrije zadnjih 20 tednov. Prej (${slWeeks(v ?? 0)}) teci lahke teke.`,
    },
    notesTitle: "Ocena cilja",
    fuelWarnings: {
      NO_GELS: "Pijača že pokrije cilj, gelov ne potrebuješ.",
      TIGHT_INTERVAL: "Geli so manj kot 15 minut narazen. Preveri, ali je cilj za tvoj želodec previsok.",
      HIGH_CARBS: "Več kot 90 g na uro zahteva vajo na dolgih tekih.",
    },
    disclaimer:
      "Načrt je splošen in ni zdravniški ali prehranski nasvet. Obseg raste največ okoli 10 % na teden. Gele in hrano preizkusi na treningih. Ob bolečini ali poškodbi se posvetuj z zdravnikom.",
    locale: "sl-SI",
    my: {
      title: "Moj načrt",
      loading: "Nalagam načrt …",
      confirming: "Potrjujem plačilo, načrt se odpre v nekaj sekundah …",
      progress: (d, n) => `${d} od ${n} treningov opravljenih`,
      thisWeek: "Ta teden",
      weeksTitle: "Treningi po tednih",
      weekRange: (a, b) => `${a} do ${b}`,
      markDone: (w) => `Označi kot opravljeno: ${w}`,
      saveFailed: "Kljukice ni bilo mogoče shraniti. Preveri povezavo in poskusi znova.",
      splits: "Vmesni časi",
      strength: "Moč",
      stretch: "Raztezanje po teku",
      exercisesTitle: "Vaje za moč in gibljivost",
      checklistTitle: "Kontrolni seznam za tekmo",
      keepLink: "Shrani to povezavo. Z njo prideš do načrta in kljukic na kateri koli napravi.",
      calendar: "Dodaj v koledar",
      pdf: "Prenesi PDF",
      preparing: "Pripravljam …",
      exportFailed: "Datoteke ni bilo mogoče pripraviti. Poskusi znova.",
      sendLabel: "Pošlji povezavo do načrta na email",
      send: "Pošlji",
      sending: "Pošiljam …",
      sendResult: {
        SENT: "Poslano. Preveri tudi mapo z neželeno pošto.",
        INVALID_EMAIL: "Preveri email naslov.",
        EMAIL_DISABLED: "Pošiljanje emailov še ni vklopljeno. Do takrat si to stran shrani med zaznamke.",
        TOO_MANY: "Povezava je bila poslana že večkrat. Za pomoč piši na mazejdev@gmail.com.",
        TOO_SOON: "Počakaj minuto in poskusi znova.",
        SEND_FAILED: "Pošiljanje ni uspelo. Poskusi znova kasneje.",
      },
      exportHint: "Koledar (.ics) uvoziš v Apple, Google ali Outlook koledar. PDF lahko natisneš ali kljukaš v bralniku PDF.",
      calName: (d) => `Finisher: ${d}`,
      pdfTitle: (d, time) => `${d} v ${time}`,
      pdfMeta: (date, pace) => `Tekma: ${date}   Ciljni tempo: ${pace}/km`,
      pdfPaces: "Tempi",
      pdfTickOnline: "Kljukice lahko shranjuješ tudi na spletu:",
      pdfGels: "Geli",
      pdfPage: (n, of) => `${n} / ${of}`,
      errors: {
        INVALID_TOKEN: "Povezava ni veljavna. Preveri, ali si jo kopiral v celoti iz emaila.",
        NOT_PAID: "Plačilo za ta načrt še ni potrjeno. Poskusi znova čez nekaj minut.",
        NOT_FOUND: "Načrta s to povezavo ni. Preveri povezavo iz emaila.",
        PLAN_ERROR: "Načrta ni bilo mogoče pripraviti. Piši nam, pa ga uredimo.",
        NETWORK: "Načrta ni bilo mogoče naložiti. Preveri povezavo in poskusi znova.",
      },
    },
  },
  en: {
    tagline: "A plan for your race",
    intro:
      "Enter your race and target time. Get a training plan to race day, a pace for every run and a gel schedule for the race. One payment, no subscription.",
    langLabel: "Language",
    themeLabel: "Theme",
    themeAuto: "Auto",
    themeLight: "Light",
    themeDark: "Dark",
    raceSection: "Race",
    trainingSection: "Your running now",
    distance: "Distance",
    distances: { "10": "10K", "21.0975": "Half marathon", "42.195": "Marathon" },
    distanceShort: { "10": "10 km", "21.0975": "21.1 km", "42.195": "42.2 km" },
    targetTime: "Target time",
    hours: "hours",
    minutes: "minutes",
    raceDate: "Race date",
    weeklyKm: "Km per week",
    weeklyKmHint: "How much you run per week on average now.",
    days: "Run days per week",
    daysHint: "The long run is always the last run of the week.",
    recentLabel: "Recent result (optional)",
    recentHint: "A race or all-out run in the last 6 weeks. We use it to estimate your fitness and training paces.",
    recentNone: "None",
    recentHour: "h",
    recentHourLabel: "hours",
    recentMin: "min",
    recentSec: "s",
    bibPredicted: (t) => `Estimate from your fitness: ${t}`,
    stridesDetail: (n) => `finish with ${n} × 20 s strides`,
    racePaceDetail: (km, pace) => `last ${km === 1 ? "kilometre" : `${km} km`} at race pace ${pace}`,
    bibPace: "per km",
    bibWeeks: (n) => (n === 1 ? "1 week to the start" : `${n} weeks to the start`),
    bibNoDate: "pick a date",
    previewTitle: "Your first two weeks",
    previewIntro: "This is how your plan starts. You get the full plan after purchase.",
    week: (n) => `Week ${n}`,
    run: (n) => `Run ${n}`,
    kinds: { build: "Build", recovery: "Easier week", taper: "Taper", race: "Race week" },
    sessions: { easy: "Easy run", tempo: "Tempo", intervals: "Intervals", long: "Long run", race: "Race" },
    tempoDetail: (q, pace) => `${q} km at ${pace}`,
    intervalDetail: (reps, pace) => `${reps} × 800 m at ${pace}`,
    warmDetail: (km, pace) => `${km} km warm-up, easy ${pace}`,
    coolDetail: (km) => `${km} km cool-down, easy`,
    jogDetail: "2 min easy jog between",
    perKm: "/km",
    volumeTitle: "Volume to race day",
    volumeIntro: (n) => `${n} weeks, week by week. Every fourth week is easier, and volume drops before the race.`,
    peak: (km) => `Peak week: ${km} km`,
    lockedWeeks: (n) => (n === 1 ? "1 more week in the full plan" : `${n} more weeks in the full plan`),
    fuelTitle: "Gels on race day",
    fuelIntro: "When to take a gel at an even pace.",
    fuelSettings: "Adjust fuelling",
    carbs: "Carbs per hour (g)",
    gelCarbs: "Carbs per gel (g)",
    drink: "From drink per hour (g)",
    firstGel: "First gel after (min)",
    gels: (n) => (n === 1 ? "1 gel" : `${n} gels`),
    carbsTotal: (g) => `${g} g of carbs in total`,
    every: (min) => `every ${min} min`,
    start: "Start",
    finish: "Finish",
    buyTitle: "Full plan",
    buyItems: [
      "every week to race day with a pace for each run",
      "gel schedule and splits",
      "strength and mobility exercises",
      "checklist for the day before and race day",
      "printable PDF with checkboxes and calendar export",
    ],
    buyCta: "Buy the full plan",
    consent: {
      before: "I agree to the ",
      terms: "terms of use",
      after: " and want access right away. I understand that I lose the 14-day right of withdrawal.",
    },
    buyNote: "One payment via Stripe, no account needed. Your plan opens after payment.",
    promoCode: "Promo code (optional)",
    buyErrors: {
      INVALID_CODE: "We don't recognise this promo code. Check it or leave the field empty.",
      PAYMENTS_DISABLED: "Payments are not open yet. A valid promo code opens your plan now.",
      INVALID_INPUT: "Check your race details above.",
      NETWORK: "The connection failed. Try again.",
      PAYMENT_ERROR: "Payment cannot start right now. Try again in a few minutes.",
    },
    errors: {
      INVALID_INPUT: "Check your target time, weekly km and race date.",
      RACE_PASSED: "The race date is today or has passed. Pick a later date.",
      NO_DATE: "Pick a race date.",
      NETWORK: "The preview could not be loaded. Check your connection and try again.",
    },
    warnings: {
      GOAL_AMBITIOUS: (v, limit) =>
        `You can run about ${formatDuration(v ?? 0)} now. With progress until race day, about ${formatDuration(limit ?? v ?? 0)} is realistic; your target is faster than that.`,
      LONG_RUN_SHORT: (v) => `Your longest run will be ${v} km, well short of the race, so the target is ambitious.`,
      SHORT_PREP: () => "Under 4 weeks to the race: fitness won't change much. Arrive fresh, start a little slower and treat the target as a ceiling.",
      LOW_VOLUME_MARATHON: () => "Under 20 km a week is low for a marathon.",
      TWO_DAYS_MARATHON: () => "Two runs a week is little for a marathon.",
      HIGH_AVG_RUN: (v) => `Your average run would be about ${v} km. If you don't run that much now, lower your weekly km.`,
      LOW_VOLUME_FOR_DAYS: () => "Your weekly km is low for this many days, so there are fewer runs at first. More are added as volume grows.",
      LONG_PREP: (v) => `The plan covers the last 20 weeks. Run easy for the ${v} ${v === 1 ? "week" : "weeks"} before.`,
    },
    notesTitle: "Goal check",
    fuelWarnings: {
      NO_GELS: "Your drink already covers the target, no gels needed.",
      TIGHT_INTERVAL: "Gels are less than 15 minutes apart. Check the target isn't too high for your stomach.",
      HIGH_CARBS: "More than 90 g per hour needs practice on long runs.",
    },
    disclaimer:
      "The plan is generic and is not medical or nutrition advice. Volume grows by about 10% a week at most. Test gels and food in training. If you feel pain or get injured, see a doctor.",
    locale: "en-GB",
    my: {
      title: "My plan",
      loading: "Loading your plan …",
      confirming: "Confirming your payment, your plan opens in a few seconds …",
      progress: (d, n) => `${d} of ${n} runs done`,
      thisWeek: "This week",
      weeksTitle: "Runs week by week",
      weekRange: (a, b) => `${a} to ${b}`,
      markDone: (w) => `Mark as done: ${w}`,
      saveFailed: "The tick could not be saved. Check your connection and try again.",
      splits: "Splits",
      strength: "Strength",
      stretch: "Stretch after running",
      exercisesTitle: "Strength and mobility",
      checklistTitle: "Race checklist",
      keepLink: "Keep this link. It opens your plan and ticks on any device.",
      calendar: "Add to calendar",
      pdf: "Download PDF",
      preparing: "Preparing …",
      exportFailed: "The file could not be prepared. Try again.",
      sendLabel: "Email me the link to my plan",
      send: "Send",
      sending: "Sending …",
      sendResult: {
        SENT: "Sent. Check your spam folder too.",
        INVALID_EMAIL: "Check the email address.",
        EMAIL_DISABLED: "Email sending is not switched on yet. Bookmark this page for now.",
        TOO_MANY: "The link has already been sent several times. For help, write to mazejdev@gmail.com.",
        TOO_SOON: "Wait a minute and try again.",
        SEND_FAILED: "Sending failed. Try again later.",
      },
      exportHint: "Import the calendar (.ics) into Apple, Google or Outlook calendar. Print the PDF or tick it in a PDF reader.",
      calName: (d) => `Finisher: ${d}`,
      pdfTitle: (d, time) => `${d} in ${time}`,
      pdfMeta: (date, pace) => `Race: ${date}   Goal pace: ${pace}/km`,
      pdfPaces: "Paces",
      pdfTickOnline: "You can also save ticks online:",
      pdfGels: "Gels",
      pdfPage: (n, of) => `${n} / ${of}`,
      errors: {
        INVALID_TOKEN: "This link is not valid. Check that you copied all of it from the email.",
        NOT_PAID: "Payment for this plan is not confirmed yet. Try again in a few minutes.",
        NOT_FOUND: "There is no plan for this link. Check the link in your email.",
        PLAN_ERROR: "The plan could not be prepared. Write to us and we will fix it.",
        NETWORK: "The plan could not be loaded. Check your connection and try again.",
      },
    },
  },
};
