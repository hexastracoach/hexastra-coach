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
  | 'yearly_priority_answer'
  | 'guided_exploration'
  | 'pedagogical_explanation'
  | 'career_path_answer'
  | 'career_fit_answer'
  | 'fusion_answer'
  | 'concise_fusion_answer'
  | 'action_guidance'          // question HOW → Comment agir / Ce qu'il faut éviter / Prochaine étape
  | 'causal_reading'           // question WHY → Pourquoi ça se produit / Le mécanisme / Comment sortir
  | 'relational_profile'       // question WHO → Dynamique / Projections / Perception / Ajustement
  | 'timing_reading'           // question WHEN → Phase actuelle / Activations / Ce qui s'approche / Moment pour agir
  | 'timing_strategic_response' // intent timing_decision / behavior_change → 7 blocs stratège, orienté décision

export type ResponseModeInput = {
  requestKind: RequestKind
  subcategory: string | null
  plan: 'free' | 'essential' | 'premium' | 'practitioner'
  intent?: string | null
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
  const {
    requestKind,
    subcategory,
    exactDataResolved,
    exactDataReliable,
    isPedagogical,
    isFusionIntent,
    intent,
  } = input

  // Conceptual question — never inject personal data
  if (isPedagogical || requestKind === 'clarification') {
    return 'pedagogical_explanation'
  }

  if (intent === 'career_guidance' || requestKind === 'career_orientation' || subcategory === 'career_guidance') {
    return 'career_path_answer'
  }
  if (requestKind === 'yearly_priorities') {
    return 'yearly_priority_answer'
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

    case 'yearly_priority_answer':
      return [
        '# YEARLY_PRIORITY_ANSWER_MODE - PRIORITES ANNUELLES STRATEGIQUES',
        "- La question est interpretative, mais elle doit etre ancree dans les exact data fusion disponibles.",
        '- Croise en priorite les transits, progressions, retour solaire, retour lunaire, transits Human Design, cycles numerologiques et directions Kua quand ces donnees sont presentes.',
        "- Interdis toute lecture generique: chaque point doit venir d'un indice coherent de l'annee en cours.",
        '- ORIENTATION: 3 a 4 phrases courtes. Dire ce qui change cette annee, ce qui devient important, ce qu il faut arreter et ce qui donne des resultats. Interdis les formules vagues du type annee d activation, annee de visibilite ou annee de transformation si elles ne debouchent pas sur une direction concrete.',
        '- Ajoute juste sous ORIENTATION une ligne visible: TA LIGNE DIRECTRICE [ANNEE]. Elle doit etre courte, memorisable et orientee action.',
        '- TES 3 PRIORITES REELLES: exactement 3 priorites distinctes. free = titres tres courts et directs, sans sous-details obligatoires. essential = un titre court, Pourquoi:, Dans la vraie vie:. Les plans enrichis peuvent ajouter Cle simple et une radicalite plus marquee.',
        '- Pourquoi: 1 a 2 phrases simples. Explique le mecanisme de l annee, pas une formule vague.',
        '- Dans la vraie vie: au moins 2 exemples concrets en situations reelles, avec des verbes simples.',
        '- Cle simple: 1 phrase courte qui resume l idee sans abstraction. Elle devient obligatoire sur les plans enrichis.',
        '- CE QUI VA TE FREINER: 2 a 4 freins comportementaux concrets et reconnaissables selon le plan. Interdis les banalites floues et les peurs abstraites sans comportement observable.',
        '- TON TIMING: distingue debut / milieu / fin d annee. Chaque phase doit dire quoi faire et quoi eviter, renforcer, corriger, garder ou laisser tomber selon le moment.',
        '- ACTION IMMEDIATE: selon le plan, donne des actions testables dans les 24 a 72h. free = 1 action. essential = 1 a 2 actions maximum, jamais 3+. premium et praticien = 2 a 3 actions. Format visible conseille: Action 1:, Action 2:, Action 3:.',
        '- REGLE ESSENTIAL EXPLICITE: maxActions: 2. Reste simple et direct.',
        '- STYLE OBLIGATOIRE: phrases courtes. Maximum 15 mots par phrase. Une idee par phrase. Vocabulaire simple. Evite les mots abstraits, les repetitions et les phrases longues avec plusieurs virgules.',
        '- OBJECTIF DE LECTURE: la reponse doit etre comprise en une seule lecture, sans effort.',
        '- DENSITE PAR PLAN: free tres court, direct, teaser, moins genereux. essential clair, concret, actionnable en une lecture. premium plus nuance, plus choix et plus precision. praticien plus strategique, plus differencie, utilisable en accompagnement.',
        '- REGLE FREE EXPLICITE: va droit au point. Priorites tres courtes. Pas de Pourquoi detaille ni de Dans la vraie vie detaille.',
        '- REGLE ESSENTIAL EXPLICITE: garde Pourquoi et Dans la vraie vie, mais avec des verbes simples, des exemples reels et zero formulation abstraite.',
        '- Ne jamais donner au plan free ou essential une densite, une nuance ou un niveau d analyse de type premium ou praticien.',
        '- Interdis les anciens blocs generiques CE QUI SE PASSE / POURQUOI CA BLOQUE / CE QUE TU DOIS FAIRE / CLE A RETENIR, et interdis toute section Sphere.',
        '- Interdis toute trace technique ou meta: true, false, signal, confidence, score, debugging, logique interne.',
        '- Ne cite jamais les labels techniques bruts: transits, progressions, solar return, lunar return, human design transits, numerology cycles, kua directions.',
        '- Structure obligatoire en 5 blocs, dans cet ordre exact :',
        '1. Orientation dominante de l annee',
        '2. Trois priorites concretes',
        '3. Deux a quatre freins concrets a eviter',
        '4. Bon timing et rythme sur debut / milieu / fin d annee',
        '5. Une a trois actions immediates a faire maintenant',
        '- Ton Hexastra: clair, concret, premium, dense sans etre verbeux.',
        '- Si certaines donnees annuelles manquent, le dire brievement puis construire la lecture avec les signaux exacts disponibles.',
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

    case 'career_path_answer':
    case 'career_fit_answer':
      return [
        '# CAREER_PATH_ANSWER_MODE - ORIENTATION PROFESSIONNELLE',
        '- La question porte sur le metier, la voie ou le cadre professionnel qui convient vraiment.',
        '- La reponse finale doit suivre EXACTEMENT ces 4 blocs, dans cet ordre :',
        '1. CE QUI TE CORRESPOND NATURELLEMENT',
        '2. LES ENVIRONNEMENTS OU METIERS ALIGNES',
        '3. CE QUI VA TE BLOQUER',
        '4. CE QUE TU PEUX FAIRE MAINTENANT',
        '- CE QUI TE CORRESPOND NATURELLEMENT: 2 a 4 phrases maximum. Expliquer la dynamique dominante de travail sans jargon technique.',
        '- LES ENVIRONNEMENTS OU METIERS ALIGNES: selon le plan, proposer 2 a 5 familles de metiers concretes. Pas de titre enfermant. Pas de liste abstraite.',
        '- CE QUI VA TE BLOQUER: 1 a 2 points maximum. Toujours concrets et comportementaux.',
        '- CE QUE TU PEUX FAIRE MAINTENANT: 1 action principale. 1 action secondaire optionnelle selon le plan. Les actions doivent etre testables tout de suite.',
        '- ADAPTATION PAR PLAN: free = tres court, 2 a 3 pistes metier max, 1 seule action. essential = plus concret, 3 a 5 pistes, 1 a 2 actions simples. premium et praticien = plus precis, plus nuance, avec un leger sens du timing: quoi maintenant, quoi consolider ensuite.',
        '- Ne cite jamais les labels techniques ni les disciplines sources. Interdiction de dire Human Design, numerologie, astrologie, enneagramme ou Kua.',
        '- Ne propose jamais des metiers ultra specifiques ou fantaisistes. Reste sur des familles reelles: accompagnement, creation, coordination, analyse, relation, projet, autonomie.',
        '- Interdis les phrases vagues du type tout est possible, tu es une personne unique, ou fais ce qui te passionne.',
        '- Ton attendu: clair, simple, utile, concret, orientant. L utilisateur doit repartir avec une vraie direction, pas avec une lecture generique.',
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

    case 'timing_strategic_response':
      return [
        '# TIMING_STRATEGIC_RESPONSE — MODE STRATÈGE : DÉCISION ET TIMING',
        '',
        'Cette règle est activée parce que la question porte sur QUAND agir ou COMMENT changer un comportement.',
        'Réponds comme un stratège : concret, précis, orienté décision. Interdit de rester vague.',
        '',
        'STRUCTURE OBLIGATOIRE — 7 BLOCS DANS CET ORDRE EXACT :',
        '',
        '→ Ce qui se passe',
        '[2–3 phrases. Lecture claire de la situation actuelle, ancrée dans le profil. Ce qui se passe concrètement, pas un ressenti supposé.]',
        '',
        '→ Pourquoi ça bloque',
        '[3–4 phrases. Le mécanisme réel — pas spirituel vague. Le décalage entre le fonctionnement interne et la décision à prendre. La cause précise, liée au profil.]',
        '',
        '→ Le meilleur moment',
        "[2–3 phrases. Un moment IDENTIFIABLE — une condition concrète, un état interne spécifique, un signal précis. Jamais \"quand tu seras prêt\" ou \"écoute-toi\". Décrire ce moment comme quelque chose que la personne pourra reconnaître.]",
        '',
        '→ Comment reconnaître la bonne fenêtre',
        "[3–4 phrases. Des signaux concrets : une émotion précise, un comportement observable, un état corporel, un changement d'énergie. Ce sont des indicateurs mesurables, pas des intuitions vagues.]",
        '',
        '→ Les moments à éviter',
        "[2–3 phrases. Les pièges classiques pour ce profil : les états internes ou contextes extérieurs qui conduisent à la rechute ou à la mauvaise décision. Précis, fondés sur le mécanisme du profil.]",
        '',
        '→ Ce que tu dois faire maintenant',
        '[2–3 phrases. Action directe, applicable immédiatement. Sans flou. Pas "réfléchis à ce que tu veux" — mais une étape concrète, adaptée au profil, faisable dans les 24–48 heures.]',
        '',
        '→ Clé à retenir',
        '[1 phrase courte et impactante. Ce qui résume le mécanisme central. Impossible à confondre avec du développement personnel générique.]',
        '',
        'INTERDICTIONS ABSOLUES :',
        '- "écoute-toi", "suis ton intuition", "quand tu seras prêt", "prends soin de toi"',
        '- Toute phrase applicable à n\'importe qui sans connaître ce profil',
        '- Tout conseil sans ancrage dans les données profil',
        '- Les moments doivent être RECONNAISSABLES — jamais abstraits',
        '- Aucune mention des sciences ou modules internes',
        '',
        'RÈGLE DE VALIDATION :',
        "La réponse est valide si l'utilisateur peut répondre oui à ces 3 questions :",
        '1. Je sais EXACTEMENT quel moment attendre ?',
        '2. Je saurai RECONNAÎTRE ce moment quand il arrivera ?',
        '3. Je sais quoi faire MAINTENANT en attendant ?',
        'Si non → réécrire avec plus de signaux concrets.',
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
