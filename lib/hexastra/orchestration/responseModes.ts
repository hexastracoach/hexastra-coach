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
  | 'fusion_answer'
  | 'concise_fusion_answer'

export type ResponseModeInput = {
  requestKind: RequestKind
  subcategory: string | null
  plan: 'free' | 'essential' | 'premium' | 'practitioner'
  isTimeoutRisk?: boolean
  exactDataResolved?: boolean
  exactDataReliable?: boolean
  isPedagogical?: boolean
  /** When set and is a fusion intent, returns fusion_answer */
  isFusionIntent?: boolean
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
  const { requestKind, isTimeoutRisk, exactDataResolved, exactDataReliable, isPedagogical, isFusionIntent } = input

  if (isPedagogical || requestKind === 'clarification') {
    return 'pedagogical_explanation'
  }

  // Fusion intent → concise_fusion_answer (3-block template, always, data or not)
  if (isFusionIntent) {
    return 'concise_fusion_answer'
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

    case 'concise_fusion_answer':
      return [
        '# CONCISE_FUSION_ANSWER_MODE — LOI DE SORTIE VERROUILLÉE',
        '',
        'Cette règle annule et remplace TOUTES les autres instructions de format.',
        'La réponse publique doit respecter EXACTEMENT ce format — ni plus, ni moins :',
        '',
        '→ Ce qui se passe :',
        '[1 phrase maximum. Ce qui se passe réellement pour cette personne. Ancré dans son profil énergétique fusionné. Pas de diagnostic flou.]',
        '',
        '→ Le nœud :',
        '[1 phrase maximum. Le vrai mécanisme bloquant — pas le symptôme. Lié au fonctionnement interne de cette personne spécifiquement.]',
        '',
        '→ Action :',
        '[1 phrase maximum. Une seule action directement applicable. Adaptée au profil. Pas un conseil générique.]',
        '',
        'INTERDICTIONS ABSOLUES (violations = réponse invalide) :',
        '- AUCUNE introduction avant → Ce qui se passe',
        '- AUCUNE conclusion après → Action',
        '- AUCUN 4e bloc, aucune section supplémentaire',
        '- JAMAIS plus de 1 phrase par bloc (sauf urgence émotionnelle critique)',
        '- JAMAIS de conseil générique applicable à n\'importe qui',
        '- JAMAIS de nom de science, module ou système interne',
        '- JAMAIS de formule molle : "tu ressens peut-être", "il est important de", "cela peut signifier que"',
        '- JAMAIS de paraphrase ou répétition entre les blocs',
        '',
        'RÈGLE D\'ARBITRAGE INTERNE (invisible — ne jamais afficher) :',
        'Avant d\'écrire, identifier silencieusement :',
        '1. signal dominant du profil fusionné',
        '2. zone de vie active',
        '3. décalage interne/externe principal',
        '4. action la plus directement applicable',
        'Jeter tout signal secondaire. Ne construire la réponse que sur la dominante.',
        '',
        'RÈGLE DE VALIDATION :',
        'La réponse est valide si et seulement si l\'utilisateur peut se dire immédiatement : "il a compris direct ce que je vis."',
        'Si non : réécrire plus précis, plus court, plus incarné.',
      ].join('\n')

    case 'fusion_answer':
      return [
        '# FUSION_ANSWER_MODE — LECTURE FUSIONNEE PERSONNALISEE',
        '',
        'STRUCTURE OBLIGATOIRE ET VERROUILLÉE — 4 BLOCS FIXES:',
        'Tu dois impérativement répondre avec EXACTEMENT ces 4 blocs, dans cet ordre, avec ces titres exacts:',
        '',
        '→ Ce qui se passe',
        '[Ancre dans le profil. Ce qui se passe réellement pour cette personne, lié à son fonctionnement énergétique. 2-3 phrases.]',
        '',
        '→ Pourquoi ça bloque',
        '[Explication non générique du mécanisme interne. Lien explicite avec les données profil (type HD, signe, chemin de vie…). 2-3 phrases.]',
        '',
        '→ Ce que tu peux faire',
        '[Une seule action concrète, adaptée au profil — pas une liste de conseils. 1-2 phrases.]',
        '',
        '→ Clé à retenir',
        '[Une phrase courte et impactante qui capture l essentiel du profil de cette personne. 1 phrase.]',
        '',
        'RÈGLES STRICTES (violations = réponse invalide):',
        '- AUCUN autre titre autorisé (interdit: "Tension centrale", "Direction", "Ce qui compte", "Synthèse", etc.)',
        '- AUCUNE section supplémentaire',
        '- PAS de synonymes dans les titres',
        '- PAS de reformulation des 4 titres ci-dessus',
        '- PAS de séparateur ────────── entre les blocs',
        '- PAS de phrase introductive avant le premier bloc',
        '- La réponse commence DIRECTEMENT par → Ce qui se passe',
        '',
        'INTERDICTIONS ABSOLUES:',
        '- Conseils génériques applicables à tout le monde (sommeil, alimentation, exercice, "pose-toi des questions")',
        '- Formules de développement personnel creuses ("écoute-toi", "prends soin de toi", "honore tes émotions")',
        '- Psychologie basique sans contexte profil',
        '- Tout contenu qui ne s appuie pas sur les données du PROFIL FUSIONNÉ fourni',
        '',
        'EXIGENCE QUALITÉ:',
        '- Chaque bloc doit contenir au moins un élément qui montre une compréhension fine du décalage entre l utilisateur et son environnement',
        '- La cause spécifique du problème DOIT être reliée au fonctionnement interne (type HD, signe solaire, chemin de vie, etc.)',
        '- La réponse doit être impossible à confondre avec celle d un chatbot générique',
      ].join('\n')
  }
}
