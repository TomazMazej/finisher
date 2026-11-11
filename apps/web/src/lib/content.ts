// Vsebina celotnega načrta: vaje in kontrolni seznam. Splošno in konservativno, brez zdravstvenih trditev.
import type { Lang } from "@finisher/core";

export interface Exercise {
  name: string;
  dose: string;
}

export const EXERCISES: Record<Lang, { strength: Exercise[]; stretch: Exercise[]; note: string }> = {
  sl: {
    strength: [
      { name: "Počep s svojo težo", dose: "2 × 12" },
      { name: "Izpadni korak", dose: "2 × 10 na nogo" },
      { name: "Mostiček za zadnjico", dose: "2 × 15" },
      { name: "Plank", dose: "3 × 30 do 45 s" },
      { name: "Stoja na eni nogi", dose: "2 × 30 s na nogo" },
      { name: "Dvigi na prste", dose: "2 × 15" },
    ],
    stretch: [
      { name: "Zadnja stran stegna", dose: "30 s na stran" },
      { name: "Sprednja stran stegna", dose: "30 s na stran" },
      { name: "Mečne mišice", dose: "30 s na stran" },
      { name: "Upogibalke kolka", dose: "30 s na stran" },
      { name: "Zadnjica", dose: "30 s na stran" },
    ],
    note: "Moč 2- do 3-krat na teden po 15 minut, najbolje na dan lahkega teka ali počitka. Raztezaj po teku, ne pred njim. Če te kaj boli, nehaj in se posvetuj s strokovnjakom.",
  },
  en: {
    strength: [
      { name: "Bodyweight squat", dose: "2 × 12" },
      { name: "Lunge", dose: "2 × 10 per leg" },
      { name: "Glute bridge", dose: "2 × 15" },
      { name: "Plank", dose: "3 × 30 to 45 s" },
      { name: "Single-leg stand", dose: "2 × 30 s per leg" },
      { name: "Calf raises", dose: "2 × 15" },
    ],
    stretch: [
      { name: "Hamstrings", dose: "30 s per side" },
      { name: "Quads", dose: "30 s per side" },
      { name: "Calves", dose: "30 s per side" },
      { name: "Hip flexors", dose: "30 s per side" },
      { name: "Glutes", dose: "30 s per side" },
    ],
    note: "Strength 2 to 3 times a week for 15 minutes, ideally on an easy or rest day. Stretch after running, not before. If something hurts, stop and talk to a professional.",
  },
};

/** Kontrolni seznam. Indeks v ploskem seznamu je ključ kljukice: c0, c1, ... Vrstnega reda ne spreminjaj po objavi. */
export const CHECKLIST: Record<Lang, { title: string; items: string[] }[]> = {
  sl: [
    {
      title: "Dan pred tekmo",
      items: [
        "Lahek tek do 20 minut ali počitek",
        "Obroki z dovolj ogljikovih hidratov, nič novega",
        "Pripravi opremo, startno številko in zaponke",
        "Pripravi gele po urniku",
        "Preveri pot do štarta in uro štarta",
      ],
    },
    {
      title: "Jutro tekme",
      items: [
        "Zajtrk, ki si ga že preizkusil na treningu",
        "Nekaj tekočine, ne preveč naenkrat",
        "Mazilo proti drgnjenju na občutljiva mesta",
        "Geli v žepu ali pasu",
        "Na štartu vsaj 30 minut prej",
      ],
    },
    {
      title: "Na tekmi",
      items: [
        "Prvi kilometer malo počasneje od ciljnega tempa",
        "Geli po urniku, tudi če se počutiš dobro",
        "Pij na okrepčevalnicah",
        "V zadnji četrtini tempo prilagodi počutju",
      ],
    },
  ],
  en: [
    {
      title: "Day before",
      items: [
        "Easy run up to 20 minutes, or rest",
        "Meals with enough carbs, nothing new",
        "Lay out kit, race bib and pins",
        "Prepare gels for the schedule",
        "Check the route to the start and the start time",
      ],
    },
    {
      title: "Race morning",
      items: [
        "A breakfast you have already tried in training",
        "Some fluids, not too much at once",
        "Anti-chafe balm on sensitive spots",
        "Gels in your pocket or belt",
        "At the start at least 30 minutes early",
      ],
    },
    {
      title: "During the race",
      items: [
        "First kilometre slightly slower than goal pace",
        "Gels on schedule, even if you feel good",
        "Drink at aid stations",
        "In the last quarter, adjust your pace to how you feel",
      ],
    },
  ],
};
