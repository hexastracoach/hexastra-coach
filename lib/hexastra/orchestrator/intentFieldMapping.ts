/**
 * intentFieldMapping — Hexastra Coach
 *
 * MAPPING CENTRAL : intent → modules → champs API → poids
 *
 * Source de vérité unique qui pilote le moteur de lecture intelligent.
 * Chaque intent définit précisément :
 *   - quels modules activer
 *   - quels champs extraire de /chart/fusion
 *   - comment pondérer chaque module
 *   - quel module porte le signal dominant
 *
 * RÈGLE : La question détermine l'angle → l'angle détermine les champs → les champs sont arbitrés → la lecture est focalisée
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type IntentModule = 'astrology' | 'human_design' | 'numerology' | 'enneagram' | 'kua'

/** Poids par module (0–1, 1 = confiance/pertinence maximale) */
export type IntentModuleWeights = Record<IntentModule, number>

/** Champs prioritaires à extraire pour chaque module */
export type IntentPriorityFields = {
  astrology: string[]
  human_design: string[]
  numerology: string[]
  enneagram: string[]
  kua: string[]
}

export type IntentReadingDepth = 'focused' | 'balanced' | 'complete'

export type IntentFieldMap = {
  /** Clé de l'intent */
  intent: string
  /** Description courte de l'angle de lecture (FR) */
  readingAngleFr: string
  /** Description courte de l'angle de lecture (EN) */
  readingAngleEn: string
  /** Modules à activer, triés du plus au moins important */
  activeModules: IntentModule[]
  /** Poids de chaque module */
  moduleWeights: IntentModuleWeights
  /** Champs prioritaires à extraire pour chaque module */
  priorityFields: IntentPriorityFields
  /** Module qui porte le signal dominant pour cet intent */
  dominantModule: IntentModule
  /** Modules secondaires (importants mais pas dominants) */
  secondaryModules: IntentModule[]
  /** Profondeur de lecture */
  depth: IntentReadingDepth
  /** Question centrale que cette lecture répond */
  readingQuestion: string
}

// ── Presets de pondération ─────────────────────────────────────────────────────

const WEIGHTS_RELATIONSHIP: IntentModuleWeights = {
  astrology: 0.85,
  human_design: 0.90,
  numerology: 0.55,
  enneagram: 0.72,
  kua: 0.28,
}

const WEIGHTS_DECISION: IntentModuleWeights = {
  astrology: 0.80,
  human_design: 0.95,
  numerology: 0.72,
  enneagram: 0.45,
  kua: 0.32,
}

const WEIGHTS_INNER_STATE: IntentModuleWeights = {
  astrology: 0.90,
  human_design: 0.85,
  numerology: 0.62,
  enneagram: 0.70,
  kua: 0.30,
}

const WEIGHTS_FUSION_GENERAL: IntentModuleWeights = {
  astrology: 0.85,
  human_design: 0.85,
  numerology: 0.68,
  enneagram: 0.60,
  kua: 0.35,
}

const WEIGHTS_COMPLETE: IntentModuleWeights = {
  astrology: 0.92,
  human_design: 0.92,
  numerology: 0.75,
  enneagram: 0.70,
  kua: 0.45,
}

// ── Nouveaux presets ─────────────────────────────────────────────────────────

const WEIGHTS_LOVE: IntentModuleWeights = {
  astrology: 0.92,    // Vénus + Lune = signaux relationnels prioritaires
  human_design: 0.82,
  numerology: 0.48,
  enneagram: 0.72,
  kua: 0.25,
}

const WEIGHTS_WORK_MONEY: IntentModuleWeights = {
  astrology: 0.78,    // Saturne + Mars
  human_design: 0.90, // stratégie de vie
  numerology: 0.85,   // chemin de vie + année = contexte de mission
  enneagram: 0.50,
  kua: 0.38,          // directions favorables = support contextuel
}

const WEIGHTS_BLOCAGE: IntentModuleWeights = {
  astrology: 0.85,    // Lune + Saturne = mécanismes bloquants
  human_design: 0.92, // centres définis/ouverts = patterns répétitifs
  numerology: 0.62,
  enneagram: 0.75,    // peur centrale = source du blocage
  kua: 0.20,
}

const WEIGHTS_TIMING: IntentModuleWeights = {
  astrology: 0.80,    // cycles planétaires
  human_design: 0.72, // autorité = quand décider
  numerology: 0.92,   // année + mois personnel = contexte cyclique dominant
  enneagram: 0.30,
  kua: 0.55,          // directions temporelles
}

const WEIGHTS_IDENTITY: IntentModuleWeights = {
  astrology: 0.82,    // Soleil + Ascendant
  human_design: 0.95, // mécanisme le plus précis sur l'identité
  numerology: 0.82,   // chemin de vie + expression
  enneagram: 0.70,    // peur centrale = identité profonde
  kua: 0.30,
}

const WEIGHTS_LIFE_PERIOD: IntentModuleWeights = {
  astrology: 0.80,    // Saturne + dominantes
  human_design: 0.78, // définition + stratégie = flux énergétique
  numerology: 0.88,   // cycle dominant
  enneagram: 0.62,
  kua: 0.40,
}

// ── Mappings par intent ────────────────────────────────────────────────────────

export const INTENT_FIELD_MAPS: Record<string, IntentFieldMap> = {

  /**
   * RELATIONSHIP
   * Angle : comment je fonctionne en relation avec les autres
   * Dominant : HD type (stratégie relationnelle) + Lune/Vénus (ancrage émotionnel)
   */
  relationship: {
    intent: 'relationship',
    readingAngleFr: 'Dynamique relationnelle — comment tu fonctionnes avec les autres',
    readingAngleEn: 'Relational dynamic — how you operate with others',
    activeModules: ['human_design', 'astrology', 'enneagram', 'numerology', 'kua'],
    moduleWeights: WEIGHTS_RELATIONSHIP,
    priorityFields: {
      astrology: ['moonSign', 'venusSign', 'mercurySign', 'sunSign', 'dominantElements'],
      human_design: ['hdType', 'hdProfile', 'hdAuthority', 'hdStrategy', 'hdDefinedCenters'],
      numerology: ['lifePath', 'expression'],
      enneagram: ['enneagramType', 'enneagramWing', 'instinct'],
      kua: ['kua', 'element'],
    },
    dominantModule: 'human_design',
    secondaryModules: ['astrology', 'enneagram'],
    depth: 'balanced',
    readingQuestion: 'Pourquoi les autres ne me reçoivent pas comme je suis ?',
  },

  /**
   * DECISION
   * Angle : comment accéder à ma meilleure intelligence décisionnelle
   * Dominant : HD autorité (mécanisme de décision fiable) + contexte cyclique numerologie
   */
  decision: {
    intent: 'decision',
    readingAngleFr: 'Prise de décision — comment accéder à ta meilleure intelligence',
    readingAngleEn: 'Decision-making — how to access your best intelligence',
    activeModules: ['human_design', 'astrology', 'numerology', 'enneagram', 'kua'],
    moduleWeights: WEIGHTS_DECISION,
    priorityFields: {
      astrology: ['saturnSign', 'marsSign', 'sunSign', 'dominantElements'],
      human_design: ['hdAuthority', 'hdStrategy', 'hdType', 'hdProfile', 'hdDefinition'],
      numerology: ['lifePath', 'personalYear', 'personalMonth'],
      enneagram: ['enneagramType', 'enneagramWing'],
      kua: ['directions', 'element'],
    },
    dominantModule: 'human_design',
    secondaryModules: ['astrology', 'numerology'],
    depth: 'focused',
    readingQuestion: 'Comment dois-je prendre cette décision selon mon fonctionnement réel ?',
  },

  /**
   * INNER STATE
   * Angle : comprendre ce que je vis / ressens en ce moment
   * Dominant : Lune (état émotionnel) + HD type (mécanisme énergétique)
   */
  inner_state: {
    intent: 'inner_state',
    readingAngleFr: 'État intérieur — comprendre ce que tu vis en ce moment',
    readingAngleEn: 'Inner state — understanding what you are going through right now',
    activeModules: ['astrology', 'human_design', 'enneagram', 'numerology', 'kua'],
    moduleWeights: WEIGHTS_INNER_STATE,
    priorityFields: {
      astrology: ['moonSign', 'dominantElements', 'sunSign', 'marsSign', 'dominantModalities'],
      human_design: ['hdType', 'hdDefinedCenters', 'hdAuthority', 'hdStrategy'],
      numerology: ['personalMonth', 'personalYear', 'lifePath'],
      enneagram: ['enneagramType', 'instinct', 'enneagramWing'],
      kua: ['element', 'kua'],
    },
    dominantModule: 'astrology',
    secondaryModules: ['human_design', 'enneagram'],
    depth: 'focused',
    readingQuestion: 'Pourquoi je me sens comme ça, et qu\'est-ce que ça dit de mon fonctionnement ?',
  },

  /**
   * FUSION GENERAL QUESTION
   * Angle : comprendre pourquoi je fonctionne ainsi / qu'est-ce qui se passe
   * Dominant : HD type + Soleil (identité centrale)
   */
  fusion_general_question: {
    intent: 'fusion_general_question',
    readingAngleFr: 'Fonctionnement global — pourquoi tu fonctionnes ainsi',
    readingAngleEn: 'Global functioning — why you operate the way you do',
    activeModules: ['human_design', 'astrology', 'numerology', 'enneagram', 'kua'],
    moduleWeights: WEIGHTS_FUSION_GENERAL,
    priorityFields: {
      astrology: ['sunSign', 'moonSign', 'risingSign', 'saturnSign', 'dominantElements', 'dominantModalities'],
      human_design: ['hdType', 'hdProfile', 'hdAuthority', 'hdStrategy', 'hdDefinition', 'hdIncarnationCross'],
      numerology: ['lifePath', 'expression', 'personalYear'],
      enneagram: ['enneagramType', 'enneagramWing', 'instinct'],
      kua: ['kua', 'element', 'directions'],
    },
    dominantModule: 'human_design',
    secondaryModules: ['astrology', 'numerology'],
    depth: 'balanced',
    readingQuestion: 'Qu\'est-ce qui explique ce que je vis ou ressens ?',
  },

  /**
   * EXACT PROFILE
   * Angle : lire toutes les dimensions du profil
   * Dominant : tous les modules à profondeur maximale
   */
  exact_profile: {
    intent: 'exact_profile',
    readingAngleFr: 'Profil complet — lecture de toutes les dimensions',
    readingAngleEn: 'Complete profile — reading all dimensions',
    activeModules: ['astrology', 'human_design', 'numerology', 'enneagram', 'kua'],
    moduleWeights: WEIGHTS_COMPLETE,
    priorityFields: {
      astrology: ['sunSign', 'moonSign', 'risingSign', 'mercurySign', 'venusSign', 'marsSign', 'saturnSign', 'dominantElements', 'dominantModalities', 'stelliums'],
      human_design: ['hdType', 'hdProfile', 'hdAuthority', 'hdStrategy', 'hdDefinition', 'hdIncarnationCross', 'hdDefinedCenters'],
      numerology: ['lifePath', 'expression', 'soul', 'personalYear', 'personalMonth'],
      enneagram: ['enneagramType', 'enneagramWing', 'instinct'],
      kua: ['kua', 'directions', 'element'],
    },
    dominantModule: 'human_design',
    secondaryModules: ['astrology', 'numerology', 'enneagram'],
    depth: 'complete',
    readingQuestion: 'Qui suis-je vraiment selon toutes mes dimensions ?',
  },

  /**
   * LOVE — amour, attirance, vie sentimentale
   * Distinct de relationship (liens en général) : ciblé romantique/intime
   * Dominant : Vénus + Lune (mode d'attraction et besoins émotionnels)
   */
  love: {
    intent: 'love',
    readingAngleFr: "Vie amoureuse — comment tu attires et vis l'intimité",
    readingAngleEn: 'Love life — how you attract and experience intimacy',
    activeModules: ['astrology', 'human_design', 'enneagram', 'numerology', 'kua'],
    moduleWeights: WEIGHTS_LOVE,
    priorityFields: {
      astrology: ['venusSign', 'moonSign', 'sunSign', 'risingSign', 'marsSign'],
      human_design: ['hdType', 'hdProfile', 'hdAuthority', 'hdStrategy'],
      numerology: ['lifePath', 'expression'],
      enneagram: ['enneagramType', 'enneagramWing', 'instinct'],
      kua: ['kua', 'element'],
    },
    dominantModule: 'astrology',
    secondaryModules: ['human_design', 'enneagram'],
    depth: 'focused',
    readingQuestion: 'Pourquoi j\'attire ce que j\'attire en amour, et comment changer ça ?',
  },

  /**
   * WORK_MONEY — travail, carrière, argent, mission
   * Dominant : HD (stratégie de vie) + numérologie (mission de fond)
   */
  work_money: {
    intent: 'work_money',
    readingAngleFr: 'Travail et argent — ta stratégie naturelle pour réussir',
    readingAngleEn: 'Work and money — your natural strategy for success',
    activeModules: ['human_design', 'numerology', 'astrology', 'enneagram', 'kua'],
    moduleWeights: WEIGHTS_WORK_MONEY,
    priorityFields: {
      astrology: ['saturnSign', 'marsSign', 'sunSign', 'dominantElements', 'dominantModalities'],
      human_design: ['hdType', 'hdAuthority', 'hdStrategy', 'hdProfile', 'hdDefinition'],
      numerology: ['lifePath', 'personalYear', 'expression'],
      enneagram: ['enneagramType'],
      kua: ['directions', 'element', 'kua'],
    },
    dominantModule: 'human_design',
    secondaryModules: ['numerology', 'astrology'],
    depth: 'focused',
    readingQuestion: 'Quelle est ma stratégie naturelle pour avancer dans ma vie professionnelle ?',
  },

  /**
   * BLOCAGE — blocage, confusion, obstacle interne, pattern répétitif
   * Dominant : HD centres (schémas conditionnés) + peur ennéagramme
   */
  blocage: {
    intent: 'blocage',
    readingAngleFr: 'Blocage intérieur — comprendre et défaire le pattern qui répète',
    readingAngleEn: 'Inner block — understanding and undoing the repeating pattern',
    activeModules: ['human_design', 'astrology', 'enneagram', 'numerology', 'kua'],
    moduleWeights: WEIGHTS_BLOCAGE,
    priorityFields: {
      astrology: ['moonSign', 'saturnSign', 'dominantElements', 'dominantModalities'],
      human_design: ['hdType', 'hdDefinedCenters', 'hdAuthority', 'hdStrategy'],
      numerology: ['personalYear', 'personalMonth', 'lifePath'],
      enneagram: ['enneagramType', 'enneagramWing', 'instinct'],
      kua: ['element'],
    },
    dominantModule: 'human_design',
    secondaryModules: ['enneagram', 'astrology'],
    depth: 'focused',
    readingQuestion: 'D\'où vient ce pattern qui se répète, et comment en sortir durablement ?',
  },

  /**
   * TIMING — quand agir, moment juste, cycles
   * Dominant : numérologie (cycles année/mois) + HD autorité (décision timing)
   */
  timing: {
    intent: 'timing',
    readingAngleFr: 'Timing — est-ce le bon moment pour agir ?',
    readingAngleEn: 'Timing — is this the right moment to act?',
    activeModules: ['numerology', 'astrology', 'human_design', 'kua', 'enneagram'],
    moduleWeights: WEIGHTS_TIMING,
    priorityFields: {
      astrology: ['saturnSign', 'marsSign', 'dominantElements'],
      human_design: ['hdAuthority', 'hdStrategy', 'hdType'],
      numerology: ['personalYear', 'personalMonth', 'lifePath'],
      enneagram: ['enneagramType'],
      kua: ['directions', 'element'],
    },
    dominantModule: 'numerology',
    secondaryModules: ['astrology', 'human_design'],
    depth: 'focused',
    readingQuestion: 'Est-ce le bon moment, et comment savoir quand agir selon mon profil ?',
  },

  /**
   * IDENTITY — qui je suis vraiment, fonctionnement naturel, nature profonde
   * Distinct de exact_profile (plus introspectif que descriptif)
   * Dominant : HD (mécanisme le plus précis) + chemin de vie
   */
  identity: {
    intent: 'identity',
    readingAngleFr: 'Identité — qui tu es vraiment et comment tu fonctionnes naturellement',
    readingAngleEn: 'Identity — who you truly are and how you naturally operate',
    activeModules: ['human_design', 'numerology', 'astrology', 'enneagram', 'kua'],
    moduleWeights: WEIGHTS_IDENTITY,
    priorityFields: {
      astrology: ['sunSign', 'risingSign', 'moonSign', 'dominantElements'],
      human_design: ['hdType', 'hdProfile', 'hdAuthority', 'hdStrategy', 'hdDefinition', 'hdIncarnationCross'],
      numerology: ['lifePath', 'expression'],
      enneagram: ['enneagramType', 'enneagramWing'],
      kua: ['element'],
    },
    dominantModule: 'human_design',
    secondaryModules: ['numerology', 'astrology', 'enneagram'],
    depth: 'balanced',
    readingQuestion: 'Qui suis-je vraiment, selon mon fonctionnement naturel et ma nature profonde ?',
  },

  /**
   * LIFE_PERIOD — période de vie, transition, dynamique globale
   * Dominant : numérologie cycles + HD définition (flux énergétique)
   */
  life_period: {
    intent: 'life_period',
    readingAngleFr: 'Période de vie — comprendre le passage que tu traverses',
    readingAngleEn: 'Life period — understanding the transition you are going through',
    activeModules: ['numerology', 'astrology', 'human_design', 'enneagram', 'kua'],
    moduleWeights: WEIGHTS_LIFE_PERIOD,
    priorityFields: {
      astrology: ['sunSign', 'saturnSign', 'dominantElements', 'dominantModalities'],
      human_design: ['hdType', 'hdDefinition', 'hdProfile', 'hdStrategy'],
      numerology: ['personalYear', 'personalMonth', 'lifePath', 'expression'],
      enneagram: ['enneagramType'],
      kua: ['element', 'kua'],
    },
    dominantModule: 'numerology',
    secondaryModules: ['astrology', 'human_design'],
    depth: 'balanced',
    readingQuestion: 'Quelle est la dynamique de cette période, et comment la traverser avec clarté ?',
  },
}

// ── Accessor ───────────────────────────────────────────────────────────────────

/**
 * Retourne le mapping de champs pour un intent donné.
 * Fallback sur fusion_general_question si l'intent est inconnu.
 */
export function getIntentFieldMap(intent: string): IntentFieldMap {
  return INTENT_FIELD_MAPS[intent] ?? INTENT_FIELD_MAPS['fusion_general_question']
}
