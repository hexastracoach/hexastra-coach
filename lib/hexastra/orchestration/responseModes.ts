/**
 * Response Modes - Hexastra Coach
 *
 * 4 universal response modes that drive the render strategy.
 *
 * calculated_reading      -> donnees calculees et fiables (Railway + isReliable=true)
 * interpretive_reading    -> lecture interpretable pour synthese / interpretation
 * guided_exploration      -> pas assez de donnees exactes fiables, ou plan contraint
 * pedagogical_explanation -> question conceptuelle / pedagogique sans donnees personnelles
 */

import type { RequestKind } from './requestKinds'

export type ResponseMode =
  | 'calculated_reading'
  | 'interpretive_reading'
  | 'guided_exploration'
  | 'pedagogical_explanation'

export type ResponseModeInput = {
  requestKind: RequestKind
  subcategory: string | null
  plan: 'free' | 'essential' | 'premium' | 'practitioner'
  isTimeoutRisk?: boolean
  exactDataResolved?: boolean
  exactDataReliable?: boolean
  isPedagogical?: boolean
}

/**
 * Priority:
 * 1. Pedagogical / clarification -> pedagogical_explanation
 * 2. Timeout risk -> guided_exploration
 * 3. exact_fact/profile + data resolved + reliable -> calculated_reading
 * 4. exact_fact/profile + data resolved + not reliable -> guided_exploration
 * 5. exact_fact/profile + no data -> guided_exploration
 * 6. synthesis / interpretation / mixed -> interpretive_reading
 * 7. guidance -> guided_exploration
 * 8. Fallback: resolved+reliable -> calculated_reading, else guided_exploration
 */
export function selectResponseMode(input: ResponseModeInput): ResponseMode {
  const { requestKind, isTimeoutRisk, exactDataResolved, exactDataReliable, isPedagogical } = input

  if (isPedagogical || requestKind === 'clarification') {
    return 'pedagogical_explanation'
  }

  if (isTimeoutRisk) {
    return 'guided_exploration'
  }

  if (requestKind === 'exact_fact' || requestKind === 'exact_profile') {
    if (exactDataResolved && exactDataReliable !== false) return 'calculated_reading'
    if (exactDataResolved && exactDataReliable === false) return 'guided_exploration'
    return 'guided_exploration'
  }

  if (
    requestKind === 'synthesis' ||
    requestKind === 'interpretation' ||
    requestKind === 'mixed'
  ) {
    return 'interpretive_reading'
  }

  if (requestKind === 'guidance') {
    return 'guided_exploration'
  }

  if (exactDataResolved && exactDataReliable !== false) return 'calculated_reading'
  return 'guided_exploration'
}

export function buildResponseModeDirective(mode: ResponseMode): string {
  switch (mode) {
    case 'calculated_reading':
      return [
        'MODE DE REPONSE: LECTURE CALCULEE',
        '- Les donnees ci-dessous sont calculees et fiables. Utilise-les comme source de verite absolue.',
        '- Commence par les valeurs exactes.',
        '- Format suggere: "● [Donnee] : [valeur exacte calculee]".',
        '- N invente aucune valeur. Si une valeur est absente du bloc de donnees, ecris "non disponible".',
        "- L interpretation vient apres les valeurs, seulement si elle reste breve.",
      ].join('\n')

    case 'interpretive_reading':
      return [
        'MODE DE REPONSE: LECTURE INTERPRETATIVE',
        "- L utilisateur veut du sens, une lecture vivante et contextualisee.",
        '- Fonde-toi exclusivement sur les donnees presentes dans le bloc de donnees exact.',
        "- N invente pas de placements, profils ou valeurs absents du bloc.",
        '- Si des donnees manquent, construis ta lecture sur ce qui est disponible sans combler les trous.',
      ].join('\n')

    case 'guided_exploration':
      return [
        'MODE DE REPONSE: EXPLORATION GUIDEE',
        "- Guide l utilisateur a partir des donnees disponibles, sans inventer.",
        '- Reponse concise: 4-8 lignes maximum.',
        '- Si des donnees exactes manquent ou sont insuffisantes, nomme la limite et propose la suite utile.',
        '- Evite les introductions longues et les conclusions generiques.',
      ].join('\n')

    case 'pedagogical_explanation':
      return [
        'MODE DE REPONSE: EXPLICATION PEDAGOGIQUE',
        "- L utilisateur pose une question conceptuelle, pas une demande de donnees personnelles.",
        "- Explique le concept clairement, sans reference aux donnees personnelles de l utilisateur.",
        '- Ton: accessible, direct, sans jargon inutile.',
        "- N invente pas de donnees personnelles. Reponds a la question conceptuelle uniquement.",
      ].join('\n')
  }
}
