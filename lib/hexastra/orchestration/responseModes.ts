/**
 * Response Modes — Hexastra Coach
 *
 * 4 universal response modes that drive the render strategy.
 *
 * calculated_reading      → données calculées et fiables (Railway + isReliable=true)
 * interpretive_reading    → données partielles ou non fiables, lecture interprétative
 * guided_exploration      → pas de données exactes ou plan contraint → exploration guidée
 * pedagogical_explanation → question conceptuelle / pédagogique sans données personnelles
 */

import type { RequestKind } from './requestKinds'

// ── Types ──────────────────────────────────────────────────────────────────────

export type ResponseMode =
  | 'calculated_reading'      // données calculées + fiables → liste/carte factuelle
  | 'interpretive_reading'    // données partielles ou non fiables → lecture interprétative
  | 'guided_exploration'      // pas de données exactes ou plan contraint
  | 'pedagogical_explanation' // question conceptuelle / pédagogique sans données perso

export type ResponseModeInput = {
  requestKind: RequestKind
  subcategory: string | null
  plan: 'free' | 'essential' | 'premium' | 'practitioner'
  /** True when approaching OpenAI timeout budget */
  isTimeoutRisk?: boolean
  /** True when Railway returned a non-empty raw payload */
  exactDataResolved?: boolean
  /** True when isReliableExactData() validates field completeness */
  exactDataReliable?: boolean
  /** True when the request is conceptual/pedagogical with no personal data needed */
  isPedagogical?: boolean
}

// ── Mode selector ──────────────────────────────────────────────────────────────

/**
 * Select the appropriate response mode for this request.
 *
 * Priority:
 *   1. Pedagogical / clarification → pedagogical_explanation
 *   2. Timeout risk or free+exact  → guided_exploration (compact fallback)
 *   3. exact_fact/profile + data resolved + reliable → calculated_reading
 *   4. exact_fact/profile + data resolved + not reliable → interpretive_reading
 *   5. exact_fact/profile + no data → guided_exploration (cannot hallucinate)
 *   6. synthesis / interpretation / mixed → interpretive_reading
 *   7. guidance → guided_exploration
 *   8. Fallback: resolved+reliable → calculated_reading, else guided_exploration
 */
export function selectResponseMode(input: ResponseModeInput): ResponseMode {
  const { requestKind, plan, isTimeoutRisk, exactDataResolved, exactDataReliable, isPedagogical } = input

  // Pedagogical / conceptual question — explain the concept, no personal data
  if (isPedagogical || requestKind === 'clarification') {
    return 'pedagogical_explanation'
  }

  // Timeout risk or free plan with exact query → compact guided fallback
  if (
    isTimeoutRisk ||
    (plan === 'free' && (requestKind === 'exact_fact' || requestKind === 'exact_profile'))
  ) {
    return 'guided_exploration'
  }

  // Exact data requests — branch on resolution + reliability
  if (requestKind === 'exact_fact' || requestKind === 'exact_profile') {
    if (exactDataResolved && exactDataReliable !== false) return 'calculated_reading'
    if (exactDataResolved && exactDataReliable === false) return 'interpretive_reading'
    return 'guided_exploration' // no data — cannot hallucinate, guide instead
  }

  // Interpretive requests — always rich reading regardless of data presence
  if (
    requestKind === 'synthesis' ||
    requestKind === 'interpretation' ||
    requestKind === 'mixed'
  ) {
    return 'interpretive_reading'
  }

  // Guidance — open-ended, no exact data needed
  if (requestKind === 'guidance') {
    return 'guided_exploration'
  }

  // Fallback — use data presence + reliability as signal
  if (exactDataResolved && exactDataReliable !== false) return 'calculated_reading'
  return exactDataResolved ? 'interpretive_reading' : 'guided_exploration'
}

// ── Prompt directive builder ───────────────────────────────────────────────────

/**
 * Build a terse directive to inject into the system prompt.
 * Steers the LLM's output format before it generates a response.
 */
export function buildResponseModeDirective(mode: ResponseMode): string {
  switch (mode) {
    case 'calculated_reading':
      return [
        'MODE DE RÉPONSE: LECTURE CALCULÉE',
        '- Les données ci-dessous sont calculées et fiables. Utilise-les comme source de vérité absolue.',
        '- Commence par les valeurs exactes (une valeur par ligne pour les listes).',
        '- Format suggéré: "● [Donnée] : [valeur exacte calculée]"',
        "- N'invente aucune valeur. Si une valeur est absente du bloc de données, écris \"non disponible\".",
        "- L'interprétation vient APRÈS les valeurs, seulement si pertinente et brève.",
      ].join('\n')

    case 'interpretive_reading':
      return [
        'MODE DE RÉPONSE: LECTURE INTERPRÉTATIVE',
        "- L'utilisateur veut du sens, une lecture vivante et contextualisée.",
        '- Fonde-toi exclusivement sur les données présentes dans le bloc de données exact.',
        "- N'invente pas de placements, profils ou valeurs absents du bloc.",
        '- Si des données manquent, construis ta lecture sur ce qui est disponible sans combler les trous.',
      ].join('\n')

    case 'guided_exploration':
      return [
        'MODE DE RÉPONSE: EXPLORATION GUIDÉE',
        "- Guide l'utilisateur à partir des données disponibles, sans inventer.",
        '- Réponse concise: 4-8 lignes maximum.',
        '- Si des données exactes manquent, propose des pistes sans halluciner de valeurs.',
        "- Évite les introductions longues et les conclusions génériques.",
      ].join('\n')

    case 'pedagogical_explanation':
      return [
        'MODE DE RÉPONSE: EXPLICATION PÉDAGOGIQUE',
        "- L'utilisateur pose une question conceptuelle, pas une demande de données personnelles.",
        "- Explique le concept clairement, sans référence aux données personnelles de l'utilisateur.",
        '- Ton: accessible, direct, sans jargon inutile.',
        "- N'invente pas de données personnelles. Réponds à la question conceptuelle uniquement.",
      ].join('\n')
  }
}
