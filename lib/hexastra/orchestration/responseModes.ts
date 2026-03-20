/**
 * Response Modes — Hexastra Coach
 *
 * 4 universal response modes that drive the render strategy.
 *
 * exact_list           → structured list of values (planets, centers, gates, numbers)
 * exact_card           → one key fact + brief interpretation (ascendant, life path, type)
 * interpretive_reading → rich interpretation grounded in exact data
 * compact_timeout_safe → short, reliable output for tight timeout budgets
 */

import type { RequestKind } from './requestKinds'

// ── Types ──────────────────────────────────────────────────────────────────────

export type ResponseMode =
  | 'exact_list'
  | 'exact_card'
  | 'interpretive_reading'
  | 'compact_timeout_safe'

export type ResponseModeInput = {
  requestKind: RequestKind
  subcategory: string | null
  plan: 'free' | 'essential' | 'premium' | 'practitioner'
  /** True when approaching OpenAI timeout budget */
  isTimeoutRisk?: boolean
  /** True when Railway returned usable data */
  exactDataResolved?: boolean
}

// ── Subcategory → mode hints ───────────────────────────────────────────────────

/** Subcategories that naturally output a single card (one fact + brief meaning) */
const CARD_SUBCATEGORIES = new Set([
  'ascendant', 'signe_lunaire', 'signe_solaire',
  'chemin_de_vie', 'annee_personnelle', 'mois_personnel', 'jour_personnel',
  'type_hd', 'profil_hd', 'autorite_hd', 'strategie_hd', 'croix_incarnation', 'definition_hd',
  'nombre_kua', 'type_enn', 'aile_enn',
])

/** Subcategories that naturally output a structured list (multiple values) */
const LIST_SUBCATEGORIES = new Set([
  'planetes', 'maisons', 'aspects', 'transits', 'retrograde',
  'centres_hd', 'portes_hd', 'canaux_hd', 'transits_hd',
  'expression', 'ame', 'personnalite_num', 'cycle_vie',
  'direction_kua', 'orientation_habitat', 'orientation_bureau',
])

// ── Mode selector ──────────────────────────────────────────────────────────────

/**
 * Select the appropriate response mode for this request.
 *
 * Priority:
 *   1. Timeout risk or free+exact → compact_timeout_safe
 *   2. exact_fact + list subcategory → exact_list
 *   3. exact_fact + card subcategory → exact_card
 *   4. exact_profile → exact_card
 *   5. synthesis / interpretation / guidance / mixed → interpretive_reading
 *   6. Fallback: if data resolved → exact_card, else interpretive_reading
 */
export function selectResponseMode(input: ResponseModeInput): ResponseMode {
  const { requestKind, subcategory, plan, isTimeoutRisk, exactDataResolved } = input

  // Timeout-safe mode: forced when risk is detected OR free plan with exact query
  if (
    isTimeoutRisk ||
    (plan === 'free' && (requestKind === 'exact_fact' || requestKind === 'exact_profile'))
  ) {
    return 'compact_timeout_safe'
  }

  if (requestKind === 'exact_fact') {
    if (subcategory && LIST_SUBCATEGORIES.has(subcategory)) return 'exact_list'
    if (subcategory && CARD_SUBCATEGORIES.has(subcategory)) return 'exact_card'
    return 'exact_list' // default for "give me all my X" type requests
  }

  if (requestKind === 'exact_profile') {
    return 'exact_card'
  }

  if (
    requestKind === 'synthesis' ||
    requestKind === 'interpretation' ||
    requestKind === 'guidance' ||
    requestKind === 'mixed'
  ) {
    return 'interpretive_reading'
  }

  if (requestKind === 'clarification') {
    return 'interpretive_reading'
  }

  // Fallback
  return exactDataResolved ? 'exact_card' : 'interpretive_reading'
}

// ── Prompt directive builder ───────────────────────────────────────────────────

/**
 * Build a terse directive to inject into the system prompt.
 * Steers the LLM's output format before it generates a response.
 */
export function buildResponseModeDirective(mode: ResponseMode): string {
  switch (mode) {
    case 'exact_list':
      return [
        'MODE DE RÉPONSE: LISTE FACTUELLE',
        '- Commence par la liste structurée, chaque valeur sur sa propre ligne.',
        '- Format suggéré: "● [Donnée]: [valeur exacte calculée]"',
        '- N\'invente aucune valeur. Si une valeur est absente du bloc de données, écris "non disponible".',
        '- L\'interprétation vient APRÈS la liste, seulement si pertinente et brève.',
      ].join('\n')

    case 'exact_card':
      return [
        'MODE DE RÉPONSE: CARTE FACTUELLE',
        '- Commence par la valeur exacte (1-2 lignes maximum).',
        '- Ajoute une courte signification seulement si utile (3-4 lignes max).',
        '- N\'invente jamais la valeur. Si elle est absente du bloc de données, dis-le honnêtement.',
        '- Ne substitue pas une interprétation générale à une valeur demandée.',
      ].join('\n')

    case 'interpretive_reading':
      return [
        'MODE DE RÉPONSE: LECTURE INTERPRÉTATIVE',
        '- L\'utilisateur veut du sens, une lecture vivante et contextualisée.',
        '- Fonde-toi exclusivement sur les données présentes dans le bloc de données exact.',
        '- N\'invente pas de placements, profils ou valeurs absents du bloc.',
        '- Si des données manquent, construis ta lecture sur ce qui est disponible sans combler les trous.',
      ].join('\n')

    case 'compact_timeout_safe':
      return [
        'MODE DE RÉPONSE: COMPACT (OPTIMISÉ)',
        '- Réponse concise: 4-8 lignes maximum.',
        '- Donne d\'abord la donnée exacte demandée.',
        '- Évite les introductions longues et les conclusions génériques.',
        '- Ne devine pas, ne comble pas les données manquantes.',
      ].join('\n')
  }
}
