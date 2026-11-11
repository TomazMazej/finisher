import type { Lang, SessionType, WarningCode, WeekKind, FuelWarning } from "@finisher/core";

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
  errors: Record<"INVALID_INPUT" | "RACE_PASSED" | "NO_DATE", string>;
  warnings: Record<WarningCode, (v?: number) => string>;
  fuelWarnings: Record<FuelWarning, string>;
  disclaimer: string;
  locale: string;
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
    buyNote: "Enkratno plačilo. Povezavo do načrta dobiš po emailu, brez registracije.",
    errors: {
      INVALID_INPUT: "Preveri ciljni čas, km na teden in datum tekme.",
      RACE_PASSED: "Datum tekme je danes ali že mimo. Izberi poznejši datum.",
      NO_DATE: "Izberi datum tekme.",
    },
    warnings: {
      SHORT_PREP: () => "Do tekme je manj kot 4 tedne. Načrt je skrajšan. Ne poskušaj nadoknaditi zamujenega.",
      LONG_PREP: (v) => `Do tekme je več kot 20 tednov. Načrt pokrije zadnjih 20, prej (${slWeeks(v ?? 0)}) teci lahke teke.`,
      LOW_VOLUME_MARATHON: () => "Za maraton je manj kot 20 km na teden malo. Razmisli o daljši pripravi ali krajši razdalji.",
      HIGH_AVG_RUN: (v) => `Pri tem vnosu je povprečen tek okoli ${v} km. Če zdaj ne tečeš toliko, zmanjšaj km na teden.`,
      TWO_DAYS_MARATHON: () => "Dva teka na teden sta za maraton malo. Razmisli o več dneh ali krajši razdalji.",
      LOW_VOLUME_FOR_DAYS: () => "Za toliko dni je km na teden malo, zato so nekateri teki daljši od tvojega povprečja.",
    },
    fuelWarnings: {
      NO_GELS: "Pijača že pokrije cilj, gelov ne potrebuješ.",
      TIGHT_INTERVAL: "Geli so manj kot 15 minut narazen. Preveri, ali je cilj za tvoj želodec previsok.",
      HIGH_CARBS: "Več kot 90 g na uro zahteva vajo na dolgih tekih.",
    },
    disclaimer:
      "Načrt je splošen in ni zdravniški ali prehranski nasvet. Obseg raste največ okoli 10 % na teden. Gele in hrano preizkusi na treningih. Ob bolečini ali poškodbi se posvetuj z zdravnikom.",
    locale: "sl-SI",
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
    buyNote: "One payment. You get a link to your plan by email, no account needed.",
    errors: {
      INVALID_INPUT: "Check your target time, weekly km and race date.",
      RACE_PASSED: "The race date is today or has passed. Pick a later date.",
      NO_DATE: "Pick a race date.",
    },
    warnings: {
      SHORT_PREP: () => "The race is less than 4 weeks away. The plan is shortened. Do not try to catch up.",
      LONG_PREP: (v) => `The race is more than 20 weeks away. The plan covers the last 20; run easy for the ${v} ${v === 1 ? "week" : "weeks"} before.`,
      LOW_VOLUME_MARATHON: () => "Under 20 km a week is low for a marathon. Consider a longer build or a shorter race.",
      HIGH_AVG_RUN: (v) => `At this input your average run is about ${v} km. If you don't run that much now, lower your weekly km.`,
      TWO_DAYS_MARATHON: () => "Two runs a week is little for a marathon. Consider more days or a shorter race.",
      LOW_VOLUME_FOR_DAYS: () => "Your weekly km is low for this many days, so some runs are longer than your average.",
    },
    fuelWarnings: {
      NO_GELS: "Your drink already covers the target, no gels needed.",
      TIGHT_INTERVAL: "Gels are less than 15 minutes apart. Check the target isn't too high for your stomach.",
      HIGH_CARBS: "More than 90 g per hour needs practice on long runs.",
    },
    disclaimer:
      "The plan is generic and is not medical or nutrition advice. Volume grows by about 10% a week at most. Test gels and food in training. If you feel pain or get injured, see a doctor.",
    locale: "en-GB",
  },
};
