/**
 * Practitioner choice questions — deterministic text, no LLM needed.
 * Used by runHexastraFlow when routing to collect_* branches.
 */

type Lang = string

function tr(language: Lang, variants: Partial<Record<string, string>>, fallback = 'fr'): string {
  const code = language?.slice(0, 2).toLowerCase() || fallback
  return variants[code] ?? variants[fallback] ?? ''
}

/** Question asked when analysisMode is missing */
export function buildAnalysisModeQuestion(language: Lang): string {
  return tr(language, {
    fr: `Comment souhaitez-vous procéder pour cette analyse ?

**1 — Science par science**
Lecture focalisée sur une science à la fois. Vous choisissez l'angle, je creuse en profondeur.

**2 — Fusion HexAstra**
Lecture croisée multi-sciences. Je synthétise l'ensemble pour un éclairage global.`,

    en: `How would you like to approach this analysis?

**1 — Science by science**
Focused reading on one science at a time. You choose the angle, I go deep.

**2 — HexAstra Fusion**
Multi-science cross-reading. I synthesize everything for a global insight.`,
  })
}

/** Question asked when renderMode is missing (praticien plan) */
export function buildRenderModeQuestion(language: Lang): string {
  return tr(language, {
    fr: `Quel niveau de restitution souhaitez-vous pour cette lecture ?

**1 — Simple**
Lecture claire, accessible, sans jargon inutile.

**2 — Approfondie**
Analyse complète avec dynamiques, leviers et vocabulaire technique si utile.

**3 — Synthèse praticien**
Format professionnel structuré : Situation / Phase / Dynamique / Risques / Levier / Recommandation.`,

    en: `What level of output would you like for this reading?

**1 — Simple**
Clear, accessible reading, no unnecessary jargon.

**2 — In-depth**
Full analysis with dynamics, levers, and technical vocabulary where useful.

**3 — Practitioner synthesis**
Structured professional format: Situation / Phase / Dynamic / Risks / Lever / Recommendation.`,
  })
}

/** Question asked when practitionerContext is missing (practitioner plan) */
export function buildPractitionerContextQuestion(language: Lang): string {
  return tr(language, {
    fr: `Mode Praticien actif. Pour qui réalisez-vous cette analyse ?

**1 — Usage personnel**
Lecture pour vous-même.

**2 — Usage client**
Lecture pour un(e) client(e). Les données de naissance utilisées seront celles du client.

**3 — Lecture croisée**
Analyse de la dynamique entre deux personnes (vous + une autre personne, ou deux clients).`,

    en: `Practitioner mode active. Who is this analysis for?

**1 — Personal use**
Reading for yourself.

**2 — Client use**
Reading for a client. The birth data used will be the client's.

**3 — Crossed reading**
Analysis of the dynamic between two people (you + someone else, or two clients).`,
  })
}
