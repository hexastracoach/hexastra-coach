/**
 * Hexastra Intent Context Map
 *
 * Maps the 5 user-facing sidebar intentions to their backend science routing.
 * Sciences are NEVER exposed in the sidebar — only human-need contexts are shown.
 *
 * Routing priority (enforced in runHexastraFlow):
 * 1. Explicit science request in user message
 * 2. Selected sidebar intent context (this file)
 * 3. General Hexastra Fusion (default)
 * 4. Clarification if critical data missing
 * 5. Graceful fallback
 */

export type UserIntentKey =
  | 'understand_situation'
  | 'make_decision'
  | 'relationships'
  | 'money_work'
  | 'inner_state'

export type PublicScienceId =
  | 'hexastra_fusion'
  | 'astrology'
  | 'numerology'
  | 'human_design'
  | 'enneagram'
  | 'kua'

export interface IntentContextConfig {
  /** Key used in payloads */
  key: UserIntentKey
  /** Label displayed in the sidebar */
  label: string
  /** English label */
  labelEn: string
  /** Sciences to activate first — ordered by relevance */
  primarySciences: PublicScienceId[]
  /** Sciences available as secondary support */
  secondarySciences: PublicScienceId[]
  /** Subcategory hints per science — injected in the system prompt */
  subcategoryHints: Partial<Record<PublicScienceId, string[]>>
  /** ContextType to use when this intent is active */
  contextType: 'analysis' | 'decision' | 'relationship' | 'career' | 'energy'
  /** Prompt framing injected in the system directive */
  promptFraming: { fr: string; en: string }
}

export const INTENT_CONTEXT_MAP: Record<UserIntentKey, IntentContextConfig> = {
  understand_situation: {
    key: 'understand_situation',
    label: 'Comprendre une situation',
    labelEn: 'Understand a situation',
    primarySciences: ['hexastra_fusion', 'astrology', 'enneagram', 'numerology'],
    secondarySciences: ['human_design'],
    subcategoryHints: {
      astrology: ['transits', 'aspects', 'houses', 'current_climate'],
      numerology: ['personal_year', 'personal_month', 'life_cycles'],
      enneagram: ['core_fear', 'defense_mechanism', 'perception_bias'],
      human_design: ['strategy', 'authority', 'centers'],
    },
    contextType: 'analysis',
    promptFraming: {
      fr: "Contexte utilisateur: comprendre une situation. Objectif: clarifier ce qui se passe, nommer la dynamique en cours, identifier le levier principal. Croiser les signaux de timing (transits, cycles) avec le profil de fond (enneagramme, numerologie). Donner une lecture incarnee et orientee vers la comprehension avant l'action.",
      en: 'User context: understand a situation. Goal: clarify what is happening, name the dynamic, identify the main lever. Cross timing signals (transits, cycles) with the background profile (enneagram, numerology). Give a grounded reading oriented toward understanding before action.',
    },
  },

  make_decision: {
    key: 'make_decision',
    label: 'Prendre une décision',
    labelEn: 'Make a decision',
    primarySciences: ['human_design', 'hexastra_fusion', 'astrology', 'numerology'],
    secondarySciences: ['enneagram'],
    subcategoryHints: {
      human_design: ['authority', 'strategy', 'centers', 'decision_style'],
      astrology: ['timing', 'transits', 'current_climate'],
      numerology: ['personal_cycles', 'timing', 'decision_num'],
      enneagram: ['core_fear', 'self_sabotage', 'inner_conflict'],
    },
    contextType: 'decision',
    promptFraming: {
      fr: "Contexte utilisateur: aide a la decision. Objectif: cadrer l'enjeu, identifier les forces et les risques, donner une orientation claire. Privilégier l'autorité intérieure (HD), le timing cyclique (astrologie, numérologie), et identifier les biais de peur (ennéagramme) qui peuvent perturber le choix. Conclusion: une orientation nette, pas une liste de pour et contre.",
      en: 'User context: decision support. Goal: frame the stakes, identify strengths and risks, give clear orientation. Prioritize inner authority (HD), cyclical timing (astrology, numerology), and identify fear-based biases (enneagram) that may cloud the choice. Conclusion: one clear direction, not a pros/cons list.',
    },
  },

  relationships: {
    key: 'relationships',
    label: 'Relations',
    labelEn: 'Relationships',
    primarySciences: ['enneagram', 'astrology', 'human_design', 'hexastra_fusion'],
    secondarySciences: ['numerology'],
    subcategoryHints: {
      enneagram: ['types', 'wings', 'instincts', 'relational_pattern', 'relations_enn'],
      astrology: ['synastry', 'venus', 'mars', 'moon', 'house_7', 'compatibilite'],
      human_design: ['emotional_dynamics', 'centers', 'channels', 'strategy', 'compatibilite_hd'],
      numerology: ['relational_cycles', 'compatibility_tone', 'compatibilite_num'],
    },
    contextType: 'relationship',
    promptFraming: {
      fr: "Contexte utilisateur: dynamique relationnelle. Objectif: lire le profil relationnel dominant, identifier la tension ou la complementarite entre les personnes impliquees, donner une orientation utile pour la relation. Privilegier l'ennéagramme pour les mécanismes relationnels, l'astrologie pour la dynamique emotionnelle et cyclique, le Human Design pour la compatibilite energetique.",
      en: 'User context: relational dynamics. Goal: read the dominant relational profile, identify tension or complementarity between the people involved, give useful orientation for the relationship. Prioritize enneagram for relational mechanisms, astrology for emotional and cyclical dynamics, Human Design for energetic compatibility.',
    },
  },

  money_work: {
    key: 'money_work',
    label: 'Argent / travail',
    labelEn: 'Money / work',
    primarySciences: ['human_design', 'numerology', 'astrology', 'hexastra_fusion'],
    secondarySciences: ['kua', 'enneagram'],
    subcategoryHints: {
      human_design: ['energy_type', 'strategy', 'authority', 'work_style', 'type_hd', 'strategie_hd'],
      numerology: ['life_path', 'expression', 'career_cycles', 'vocation_num', 'chemin_vie', 'annee_perso'],
      astrology: ['house_2', 'house_6', 'house_10', 'saturn', 'jupiter', 'travail_astro', 'vocation'],
      kua: ['favorable_directions', 'work_environment', 'orientation_bureau', 'gps_kua'],
      enneagram: ['success_pattern', 'fear_of_failure', 'overadaptation', 'travail_enn'],
    },
    contextType: 'career',
    promptFraming: {
      fr: "Contexte utilisateur: argent et travail. Objectif: identifier le style energetique de travail (HD), les cycles de reussite et les potentiels (numerologie, astrologie maisons 2/10), les peurs ou blocages sous-jacents (enneagramme). Si le Kua est disponible, l'integrer pour le positionnement optimal. Donner une lecture orientee vers la strategie professionnelle et la gestion des ressources.",
      en: "User context: money and work. Goal: identify the energetic work style (HD), success cycles and potential (numerology, astrology houses 2/10), underlying fears or blocks (enneagram). If Kua is available, integrate it for optimal positioning. Give a reading oriented toward professional strategy and resource management.",
    },
  },

  inner_state: {
    key: 'inner_state',
    label: 'Énergie / état intérieur',
    labelEn: 'Energy / inner state',
    primarySciences: ['human_design', 'enneagram', 'astrology', 'hexastra_fusion'],
    secondarySciences: ['numerology'],
    subcategoryHints: {
      human_design: ['open_defined_centers', 'not_self', 'signature', 'centres_hd'],
      enneagram: ['stress_pattern', 'integration', 'disintegration', 'niveau_enn', 'evolution_enn'],
      astrology: ['moon', 'inner_climate', 'emotional_transits', 'cycles_astro'],
      numerology: ['current_vibration', 'cycle_tone', 'annee_perso'],
    },
    contextType: 'energy',
    promptFraming: {
      fr: "Contexte utilisateur: etat interieur et energie. Objectif: lire la dynamique energetique du moment, identifier ce qui surcharge ou vide, ce qui ressource. Privilegier les centres HD (ouverts/definis et leur not-self), les patterns de stress enneagramme, la Lune et les transits emotionnels. Donner une lecture stabilisante, non dramatisante, qui aide a comprendre pourquoi on ressent ce qu'on ressent.",
      en: "User context: inner state and energy. Goal: read the current energetic dynamic, identify what overloads or drains, what replenishes. Prioritize HD centers (open/defined and their not-self), enneagram stress patterns, the Moon and emotional transits. Give a stabilizing, non-dramatizing reading that helps understand why one feels what one feels.",
    },
  },
}

/** All intent items in sidebar display order */
export const SIDEBAR_INTENTS = Object.values(INTENT_CONTEXT_MAP)

/** Get intent config by key (null-safe) */
export function getIntentConfig(key?: UserIntentKey | null): IntentContextConfig | null {
  if (!key) return null
  return INTENT_CONTEXT_MAP[key] ?? null
}

/** Resolve the ContextType for a given intent key */
export function resolveContextTypeFromIntent(key?: UserIntentKey | null): string {
  return INTENT_CONTEXT_MAP[key ?? 'understand_situation']?.contextType ?? 'analysis'
}

/** Get the primary science for a given intent (first in list) */
export function resolvePrimaryScienceFromIntent(key?: UserIntentKey | null): PublicScienceId | null {
  if (!key) return null
  const config = INTENT_CONTEXT_MAP[key]
  return config?.primarySciences[0] ?? null
}
