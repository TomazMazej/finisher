// Podatki o ponudniku za pravne strani. Pred prodajo izpolni vse vrednosti v oglatih oklepajih.
export const SITE = {
  name: "Finisher",
  operator: "Mazej Development",
  email: "mazejdev@gmail.com",
  /** plačilni posrednik, ki je prodajalec (Merchant of Record) */
  paymentProvider: "[plačilni posrednik]",
  updated: "12. 11. 2026",
  updatedEn: "12 November 2026",
} as const;

export const LEGAL_PATHS = {
  sl: { terms: "/pogoji", privacy: "/zasebnost", health: "/zdravje", home: "/" },
  en: { terms: "/en/terms", privacy: "/en/privacy", health: "/en/health", home: "/" },
} as const;

/** Nasprotna jezikovna različica iste pravne strani. */
export const LEGAL_PAIRS: Record<string, string> = {
  "/pogoji": "/en/terms",
  "/zasebnost": "/en/privacy",
  "/zdravje": "/en/health",
  "/en/terms": "/pogoji",
  "/en/privacy": "/zasebnost",
  "/en/health": "/zdravje",
};
