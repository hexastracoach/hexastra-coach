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
  | 'direct_answer'            // réponse factuelle immédiate — données brutes, liste, aucun refus
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
  const { requestKind, exactDataResolved, exactDataReliable, isPedagogical, isFusionIntent } = input

  // Conceptual question — never inject personal data
  if (isPedagogical || requestKind === 'clarification') {
    return 'pedagogical_explanation'
  }

  // Fusion intents (relational, emotional, decisional, situational) → 3-block concise
  if (isFusionIntent) {
    return 'concise_fusion_answer'
  }

  // Exact fact with reliable calculated data → show the number/value directly
  if (
    (requestKind === 'exact_fact' || requestKind === 'exact_profile') &&
    exactDataResolved &&
    exactDataReliable !== false
  ) {
    return 'calculated_reading'
  }

  // Everything else → concise 3-block fusion answer.
  // interpretive_reading and guided_exploration are both removed as defaults
  // because they produce long, diluted output. The sentinel enforces 3 blocks.
  return 'concise_fusion_answer'
}

export function buildResponseModeDirective(mode: ResponseMode): string {
  switch (mode) {
    case 'direct_answer':
      return [
        'MODE: RÉPONSE DIRECTE FACTUELLE',
        "- Les données ci-dessous sont calculées et vérifiées. Utilise-les comme source de vérité absolue.",
        "- Commence DIRECTEMENT par les valeurs. Aucune introduction, aucun préambule.",
        '- Format obligatoire : liste à puces "●" pour chaque valeur.',
        "- Si une valeur est présente dans les données : l'afficher exactement, telle quelle.",
        "- Si une valeur est absente : écrire \"non disponible\".",
        "- Une courte explication (1-2 phrases max) est permise UNIQUEMENT après avoir affiché toutes les valeurs.",
        "INTERDICTIONS ABSOLUES :",
        '- "je ne peux pas", "il m\'est difficile de", "en tant qu\'IA", "je n\'ai pas accès"',
        '- Toute réponse vague, contournement ou reformulation évasive',
        '- Introduction narrative avant les données',
        '- Inventer ou estimer une valeur absente',
      ].join('\n')

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
        '# CONCISE_FUSION_ANSWER_MODE — STRUCTURE DE LECTURE DÉVELOPPÉE',
        '',
        'Cette règle définit la structure et la densité obligatoires. Elle annule tout format concurrent.',
        '',
        'STRUCTURE OBLIGATOIRE — 4 BLOCS DANS CET ORDRE EXACT :',
        '',
        '→ Ce qui se passe',
        '[3 à 6 phrases. Lecture de la situation réelle, ancrée dans le profil énergétique fusionné. Ce qui se passe concrètement, pas ce que la personne "ressent peut-être".]',
        '',
        '→ Pourquoi',
        '[4 à 7 phrases. Le mécanisme interne précis. Le décalage entre le fonctionnement interne et la réalité extérieure. La cause réelle, pas le symptôme visible.]',
        '',
        '→ Ce que ça crée',
        '[2 à 4 phrases. Les conséquences concrètes dans la vie réelle. Ce que ce mécanisme produit au quotidien.]',
        '',
        '→ Ce que tu peux faire',
        '[2 à 4 phrases. Actions directement applicables, adaptées au profil. Pas de conseil générique. Pas de liste. Des étapes concrètes.]',
        '',
        'RÈGLE DE DENSITÉ — OBLIGATOIRE :',
        'Chaque phrase doit apporter UNE information nouvelle, OU préciser un mécanisme, OU décrire une conséquence.',
        'Toute phrase qui ne remplit pas cette condition doit être supprimée.',
        '',
        'ARBITRAGE INTERNE (invisible — ne jamais afficher) :',
        'Avant de rédiger, identifier silencieusement :',
        '1. la dynamique dominante dans le profil fusionné',
        '2. le décalage principal entre interne et externe',
        '3. le mécanisme qui génère la situation décrite',
        '4. la conséquence la plus visible',
        '5. l\'action prioritaire adaptée au profil',
        'Ne développer QU\'UNE dynamique principale. Interdire d\'empiler plusieurs causes ou angles.',
        '',
        'INTERDICTIONS ABSOLUES :',
        '- Aucune introduction avant → Ce qui se passe',
        '- Aucune conclusion après → Ce que tu peux faire',
        '- Aucun 5e bloc ou section supplémentaire',
        '- Aucune phrase applicable à n\'importe qui',
        '- Aucune mention des sciences ou modules internes',
        '- Aucune formule molle : "tu ressens peut-être", "cela peut indiquer", "il est possible que"',
        '- Aucune répétition entre les blocs',
        '- Aucune spiritualité floue, aucune psychologie vague',
        '',
        'RÈGLE DE VALIDATION :',
        'La réponse est valide si l\'utilisateur peut répondre oui aux 3 questions :',
        '1. Est-ce que je comprends mieux ce que je vis ?',
        '2. Est-ce que le mécanisme est clair ?',
        '3. Est-ce que je sais quoi faire ensuite ?',
        'Si non → réécrire plus précis, plus développé, plus incarné.',
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
