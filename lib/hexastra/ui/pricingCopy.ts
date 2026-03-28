/**
 * pricingCopy — Hexastra Coach
 *
 * Copie de la page pricing orientée valeur utilisateur.
 *
 * PRINCIPE :
 * On ne vend pas des features.
 * On décrit ce que l'utilisateur va vivre.
 *
 * RÈGLES DE TON :
 * - Pas de jargon technique
 * - Pas de liste de features
 * - Pas de "illimité", "accès", "débloqué"
 * - Bénéfices clairs, en langage humain
 * - CTA naturels, pas pressants
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type PlanCopyKey = 'free' | 'essential' | 'premium' | 'practitioner'

export type PlanCopy = {
  /** Tagline courte — bénéfice principal en 5–7 mots */
  tagline: string
  /** Description — 1 phrase maximum, concrète */
  description: string
  /** Label du bouton d'action — neutre, pas pressant */
  cta: string
  /** Indicateur visuel de niveau (1–4) */
  level: 1 | 2 | 3 | 4
}

// ── Tables de copie ────────────────────────────────────────────────────────────

const PLANS_FR: Record<PlanCopyKey, PlanCopy> = {
  free: {
    tagline: 'Comprendre rapidement ta situation',
    description: 'Une lecture claire pour voir où tu en es et identifier ce qui se joue.',
    cta: 'Commencer',
    level: 1,
  },
  essential: {
    tagline: 'Voir plus clair et avancer',
    description: 'Des lectures plus précises, avec la phase actuelle et les leviers concrets.',
    cta: 'Continuer',
    level: 2,
  },
  premium: {
    tagline: 'Aller en profondeur sur tes décisions',
    description: 'Une analyse complète qui croise toutes les dimensions de ta situation.',
    cta: 'Approfondir',
    level: 3,
  },
  practitioner: {
    tagline: 'Utiliser Hexastra comme outil avancé',
    description: 'La lecture la plus dense, conçue pour accompagner les autres ou travailler en profondeur.',
    cta: 'Explorer',
    level: 4,
  },
}

const PLANS_EN: Record<PlanCopyKey, PlanCopy> = {
  free: {
    tagline: 'Quickly understand your situation',
    description: 'A clear reading to see where you are and what\'s really at play.',
    cta: 'Get started',
    level: 1,
  },
  essential: {
    tagline: 'See more clearly and move forward',
    description: 'More precise readings, with your current phase and concrete levers.',
    cta: 'Continue',
    level: 2,
  },
  premium: {
    tagline: 'Go deep on your decisions',
    description: 'A complete analysis that brings all dimensions of your situation together.',
    cta: 'Go deeper',
    level: 3,
  },
  practitioner: {
    tagline: 'Use Hexastra as an advanced tool',
    description: 'The richest reading, designed for accompanying others or working in depth.',
    cta: 'Explore',
    level: 4,
  },
}

// ── Comparaison de plans ───────────────────────────────────────────────────────

export type PlanComparison = {
  current: PlanCopyKey
  next: PlanCopyKey | null
  inviteText: string | null
}

const INVITE_TEXT_FR: Record<PlanCopyKey, string | null> = {
  free:         "Si tu veux aller plus loin, d'autres niveaux de lecture sont disponibles.",
  essential:    "Pour une analyse encore plus complète, il existe un niveau de lecture plus profond.",
  premium:      "Pour les lectures les plus avancées et l'accompagnement de groupe, un niveau praticien existe.",
  practitioner: null,
}

const INVITE_TEXT_EN: Record<PlanCopyKey, string | null> = {
  free:         'If you want to go further, deeper levels of reading are available.',
  essential:    'For an even more complete analysis, a deeper reading level exists.',
  premium:      'For the most advanced readings and group accompaniment, a practitioner level exists.',
  practitioner: null,
}

const NEXT_PLAN: Record<PlanCopyKey, PlanCopyKey | null> = {
  free:         'essential',
  essential:    'premium',
  premium:      'practitioner',
  practitioner: null,
}

// ── API publique ───────────────────────────────────────────────────────────────

/**
 * Retourne la copie de pricing pour un plan donné.
 *
 * @param plan  Plan à décrire
 * @param lang  'fr' | 'en'
 * @returns     PlanCopy (tagline + description + cta + level)
 *
 * @example
 * getPlanCopy('free', 'fr').tagline
 * // "Comprendre rapidement ta situation"
 *
 * getPlanCopy('premium', 'en').cta
 * // "Go deeper"
 */
export function getPlanCopy(plan: PlanCopyKey, lang = 'fr'): PlanCopy {
  const isFr = lang.slice(0, 2).toLowerCase() !== 'en'
  const table = isFr ? PLANS_FR : PLANS_EN
  return table[plan] ?? table.free
}

/**
 * Retourne toutes les copies de plans pour construire une page pricing complète.
 *
 * @param lang  'fr' | 'en'
 * @returns     Record des 4 plans avec leurs copies
 */
export function getAllPlansCopy(lang = 'fr'): Record<PlanCopyKey, PlanCopy> {
  const isFr = lang.slice(0, 2).toLowerCase() !== 'en'
  return isFr ? PLANS_FR : PLANS_EN
}

/**
 * Retourne la comparaison entre le plan actuel et le suivant,
 * avec un texte d'invitation naturel (jamais agressif).
 *
 * @param currentPlan  Plan actuel de l'utilisateur
 * @param lang         'fr' | 'en'
 * @returns            PlanComparison
 */
export function getPlanComparison(currentPlan: PlanCopyKey, lang = 'fr'): PlanComparison {
  const isFr = lang.slice(0, 2).toLowerCase() !== 'en'
  const inviteTable = isFr ? INVITE_TEXT_FR : INVITE_TEXT_EN
  const next = NEXT_PLAN[currentPlan]

  return {
    current: currentPlan,
    next,
    inviteText: inviteTable[currentPlan] ?? null,
  }
}
