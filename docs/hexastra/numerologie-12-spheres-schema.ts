/**
 * HexAstra — Numérologie 12 sphères — Schéma TypeScript
 *
 * Structure identique au schéma astrologie (SphereDefinition-compatible).
 * Données sources remplacées par les données numériques.
 *
 * Source : docs/hexastra/numerologie-12-spheres-framework.md
 * Aligné avec NUMEROLOGY_SUBCATS de universalClassification.ts
 *
 * Types ajoutés vs astrologie :
 * - NumDataNature  — fixe / karmique / cyclique / variable
 * - NumDataKey     — identifiants des données numériques
 * - buildNumStructureBlock() / buildNumReadingSystemPrompt()
 * - validateNumOutput()
 */

// ── Types identifiants ──────────────────────────────────────────────────────────

export type SphereId =
  | 'sphere_1'  | 'sphere_2'  | 'sphere_3'  | 'sphere_4'
  | 'sphere_5'  | 'sphere_6'  | 'sphere_7'  | 'sphere_8'
  | 'sphere_9'  | 'sphere_10' | 'sphere_11' | 'sphere_12'

export type HouseNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

/**
 * Identifiants des données numériques.
 * Tier 1–2 alignés avec NUMEROLOGY_SUBCATS dans universalClassification.ts.
 * Tier 3–5 étendus pour couvrir le framework complet.
 */
export type NumDataKey =
  // Tier 1 — fondation (toujours présentes)
  | 'chemin_de_vie'      // CV — somme de la date de naissance complète
  | 'expression'         // nombre d'Expression — somme du nom complet
  // Tier 2 — identité complète
  | 'ame'                // nombre de l'Âme / Intime — voyelles du nom
  | 'personnalite_num'   // nombre de Personnalité — consonnes du nom
  | 'nom_prenom'         // calcul depuis nom + prénom (entrée brute)
  | 'naissance'          // nombre de Naissance — jour de naissance réduit
  | 'heritage'           // nombre d'Héritage — nom de famille de naissance
  // Tier 2b — maturation
  | 'maturite'           // CV + Expression — convergence de vie (~35-40 ans)
  // Tier 3 — karmique
  | 'dette_karmique'     // dettes karmiques : 13/4, 14/5, 16/7, 19/1
  | 'lecon_karmique'     // leçons karmiques : nombres absents dans le nom
  // Tier 4 — cyclique semi-fixe
  | 'defi'               // défis 1 à 4 calculés depuis la date de naissance
  | 'cycle_vie'          // cycles de vie 1 à 3 (prénom / prénom hérité / nom)
  | 'pinnacle'           // pinnacles 1 à 4 calculés depuis le CV
  // Tier 5 — temps court
  | 'annee_personnelle'  // CV + année en cours
  | 'mois_personnel'     // année perso + mois en cours
  | 'jour_personnel'     // mois perso + jour en cours

/** Nature temporelle d'une donnée numérique */
export type NumDataNature = 'fixe' | 'karmique' | 'cyclique' | 'variable'

/** Types de lecture numérologique */
export type NumReadingType =
  | 'general'
  | 'identitaire'
  | 'relationnelle'
  | 'vocationnelle'
  | 'karmique'
  | 'cyclique'
  | 'potentiel'

export type ReadingDepth = 'standard' | 'approfondie' | 'deep'
export type ReadingRender = 'synthesis' | 'structured' | 'narrative'
export type SphereRole = 'primary' | 'secondary' | 'contextual'

// ── Interfaces ──────────────────────────────────────────────────────────────────

/** Définition complète d'une sphère numérique — format compatible SphereDefinition */
export interface NumSphereDefinition {
  readonly id: SphereId
  readonly house: HouseNumber
  readonly name: string
  readonly primaryData: NumDataKey[]
  readonly dataNature: NumDataNature      // nature des données primaires
  readonly axis: string                   // thème de vie central
  readonly reveals: string
  readonly imbalance: string
  readonly potential: string
  readonly keyUnderstanding: string
  readonly keyAction: string
  readonly mirrorQuestion?: string
}

export interface NumReadingTypeDefinition {
  readonly id: NumReadingType
  readonly name: string
  readonly objective: string
  readonly prioritySpheres: HouseNumber[]
  readonly priorityData: NumDataKey[]
  readonly answers: string
  readonly depth: ReadingDepth
  readonly render: ReadingRender
}

export interface NumDataMapping {
  readonly key: NumDataKey
  readonly nature: NumDataNature
  readonly primarySphere: SphereId
  readonly secondarySpheres: SphereId[]
}

export interface NumScienceFramework {
  readonly scienceKey: 'numerologie'
  readonly version: string
  readonly spheres: readonly NumSphereDefinition[]
  readonly readingTypes: readonly NumReadingTypeDefinition[]
  readonly dataMapping: readonly NumDataMapping[]
}

// ── Les 12 sphères ─────────────────────────────────────────────────────────────

export const NUM_SPHERES: readonly NumSphereDefinition[] = [
  {
    id: 'sphere_1',
    house: 1,
    name: 'Identité',
    primaryData: ['chemin_de_vie', 'naissance'],
    dataNature: 'fixe',
    axis: 'Moteur fondamental, nature profonde, façon d\'initier',
    reveals: 'La vibration centrale de la personne — ce qui la pousse à vivre, initier, exister.',
    imbalance: 'Vie vécue contre le CV — fatigue chronique, sentiment de fausseté permanent.',
    potential: 'Élan naturel, vie alignée avec la vibration de naissance.',
    keyUnderstanding: 'Le CV n\'est pas un rôle à jouer — c\'est la vibration naturelle de qui je suis.',
    keyAction: 'Identifier les domaines où je vis contre mon CV et choisir un ajustement.',
    mirrorQuestion: 'Suis-je en train de vivre ma vibration ou de la fuir ?',
  },
  {
    id: 'sphere_2',
    house: 2,
    name: 'Ressources',
    primaryData: ['pinnacle'],
    dataNature: 'cyclique',
    axis: 'Potentiel matériel, construction, talent à exprimer dans la première période',
    reveals: 'Ce que la personne peut bâtir — argent, compétences, actifs — selon l\'énergie du Pinnacle 1.',
    imbalance: 'Construction contre nature, accumulation par peur, énergie du Pinnacle ignorée.',
    potential: 'Manifestation alignée avec les capacités réelles, abondance construite juste.',
    keyUnderstanding: 'L\'Expression dit ce que je suis capable de construire — le Pinnacle 1 donne le timing.',
    keyAction: 'Activer le potentiel du Pinnacle actif avant sa fin de période.',
    mirrorQuestion: 'Est-ce que je construis depuis ma force ou depuis ma peur du manque ?',
  },
  {
    id: 'sphere_3',
    house: 3,
    name: 'Intelligence',
    primaryData: ['personnalite_num'],
    dataNature: 'fixe',
    axis: 'Style de présentation, façon de penser, d\'être reçu',
    reveals: 'Comment la personne est perçue à l\'arrivée — son image vibratoire naturelle, son filtre de communication.',
    imbalance: 'Masque sans substance, image figée qui ne correspond pas à l\'intérieur.',
    potential: 'Communication naturelle, impact authentique, cohérence entre présentation et contenu.',
    keyUnderstanding: 'La Personnalité est comment j\'arrive — l\'Expression est ce que je livre. Les deux doivent s\'aligner.',
    keyAction: 'Ajuster sa façon de se présenter pour qu\'elle reflète ce qu\'on est vraiment.',
    mirrorQuestion: 'Comment je veux être reçu, et comment j\'arrive réellement ?',
  },
  {
    id: 'sphere_4',
    house: 4,
    name: 'Racines',
    primaryData: ['ame', 'heritage'],
    dataNature: 'fixe',
    axis: 'Vérité intérieure, fondation émotionnelle, héritage familial',
    reveals: 'Ce que la personne ressent profondément — ses désirs vrais, son héritage vibratoire, son ancrage.',
    imbalance: 'Déni du ressenti profond, héritage non conscient qui gouverne sans être nommé.',
    potential: 'Ancrage dans sa propre vérité, transmission consciente de l\'héritage choisi.',
    keyUnderstanding: 'L\'Âme est ce que je ressens quand plus personne ne regarde.',
    keyAction: 'Valider ses désirs profonds avant de les justifier rationnellement.',
    mirrorQuestion: 'Qu\'est-ce que je veux vraiment, sous tout ce que je montre ?',
  },
  {
    id: 'sphere_5',
    house: 5,
    name: 'Expression créative',
    primaryData: ['ame'],
    dataNature: 'fixe',
    axis: 'Désir créatif, joie, canal entre intérieur et forme extérieure',
    reveals: 'Comment le désir de l\'Âme cherche à s\'exprimer — la tension créatrice entre intérieur et output.',
    imbalance: 'Création sans joie, désir bloqué par la peur du jugement ou de l\'échec.',
    potential: 'Créativité fluide — canal ouvert entre ce qu\'on veut profondément et ce qu\'on produit.',
    keyUnderstanding: 'La tension Âme / Expression est la tension entre désir et forme.',
    keyAction: 'Trouver le canal qui permet à l\'Âme de s\'exprimer via l\'Expression.',
    mirrorQuestion: 'Est-ce que je crée ce que je veux vraiment créer ?',
  },
  {
    id: 'sphere_6',
    house: 6,
    name: 'Équilibre',
    primaryData: ['defi', 'cycle_vie'],
    dataNature: 'cyclique',
    axis: 'Zones de friction récurrentes, rythme quotidien, défis à maîtriser',
    reveals: 'Les résistances que la vie ramène régulièrement — les zones où la maîtrise s\'acquiert par l\'expérience.',
    imbalance: 'Résistance chronique aux défis, surcompensation, rythme épuisant.',
    potential: 'Défis transformés en zones de maîtrise, rythme de vie juste et durable.',
    keyUnderstanding: 'Les Défis ne sont pas des faiblesses — ce sont des zones de maîtrise disponibles.',
    keyAction: 'Nommer le Défi actif et choisir une réponse consciente face à lui.',
    mirrorQuestion: 'Quel défi récurrent est en train de se rejouer dans ma vie en ce moment ?',
  },
  {
    id: 'sphere_7',
    house: 7,
    name: 'Relations',
    primaryData: ['ame'],
    dataNature: 'fixe',
    axis: 'Patterns relationnels, ce qu\'on attire, miroirs dans l\'autre',
    reveals: 'Le modèle d\'attraction et de relation — ce que l\'Âme cherche dans l\'autre, ce que la Personnalité attire.',
    imbalance: 'Séduction inconsciente, fusion, déception répétée par attentes non exprimées.',
    potential: 'Relations nourries par la complémentarité réelle — attirer consciemment.',
    keyUnderstanding: 'L\'Âme attire ce qu\'elle vibre — la Personnalité filtre ce qui reste.',
    keyAction: 'Observer ce que j\'attire et ce que je garde — les deux disent quelque chose de précis.',
    mirrorQuestion: 'Les relations que j\'ai maintenant sont-elles cohérentes avec ce que je veux vraiment ?',
  },
  {
    id: 'sphere_8',
    house: 8,
    name: 'Transformation',
    primaryData: ['dette_karmique', 'lecon_karmique'],
    dataNature: 'karmique',
    axis: 'Zones d\'ombre, patterns de résistance, croissance par intégration',
    reveals: 'Les dettes (marqueurs spécifiques de naissance) et leçons (absences dans le nom) — zones où la vie force la croissance.',
    imbalance: 'Répétition inconsciente des patterns, refus des leçons, résistance au changement profond.',
    potential: 'Alchimie des épreuves — puissance née de l\'intégration des zones d\'ombre.',
    keyUnderstanding: 'Les Dettes karmiques ne sont pas des punitions — ce sont des zones à maîtriser dans cette vie.',
    keyAction: 'Identifier la dette active et son mode d\'expression actuel dans sa vie.',
    mirrorQuestion: 'Quel schéma est-ce que je retrouve dans tous les contextes différents de ma vie ?',
  },
  {
    id: 'sphere_9',
    house: 9,
    name: 'Vision',
    primaryData: ['chemin_de_vie', 'cycle_vie'],
    dataNature: 'fixe',
    axis: 'Sens de vie, philosophie personnelle, capacité à transmettre',
    reveals: 'Le CV à son octave élevé — ce que la personne est censée transmettre, pas seulement vivre.',
    imbalance: 'Idéalisme sans ancrage, sens non incarné, transmission sans cohérence personnelle.',
    potential: 'Vision articulée, philosophie transmissible, sens intégré dans les actes quotidiens.',
    keyUnderstanding: 'Le CV à son octave élevé = ce que je dois transmettre, pas juste ce que je dois vivre.',
    keyAction: 'Articuler sa philosophie personnelle en une phrase transmissible et testable.',
    mirrorQuestion: 'Quel est le sens que je veux donner à ma vie, pas seulement à ma carrière ?',
  },
  {
    id: 'sphere_10',
    house: 10,
    name: 'Vocation',
    primaryData: ['expression', 'maturite'],
    dataNature: 'fixe',
    axis: 'Mission de vie, alignement carrière / vocation, convergence trajectoire',
    reveals: 'L\'Expression dit le potentiel complet — la Maturité (CV + Expression) dit vers quoi tout converge.',
    imbalance: 'Métier contre Expression, talent non exprimé, trajectoire sans sens.',
    potential: 'Carrière comme incarnation de la mission — travail comme lieu d\'expression naturelle.',
    keyUnderstanding: 'La Maturité est le nombre où CV et Expression convergent — ce qu\'on devient quand on est vraiment soi.',
    keyAction: 'Construire vers la Maturité maintenant, pas après avoir "réglé" le reste.',
    mirrorQuestion: 'Est-ce que ma trajectoire actuelle converge vers ma Maturité ?',
  },
  {
    id: 'sphere_11',
    house: 11,
    name: 'Collectif',
    primaryData: ['personnalite_num', 'annee_personnelle'],
    dataNature: 'variable',
    axis: 'Impact dans le groupe, timing collectif, réseau juste',
    reveals: 'Comment la Personnalité est reçue dans le collectif, et quel timing l\'Année personnelle impose.',
    imbalance: 'Inadaptation au cycle en cours, réseau construit par défaut, positionnement collectif incohérent.',
    potential: 'Contribution juste au bon moment — réseau aligné avec la vision.',
    keyUnderstanding: 'L\'Année personnelle donne le ton collectif — la Personnalité donne le rôle dans ce ton.',
    keyAction: 'Identifier l\'Année personnelle actuelle et ajuster son positionnement collectif.',
    mirrorQuestion: 'Est-ce que je suis dans le bon timing pour ce que j\'essaie de faire ?',
  },
  {
    id: 'sphere_12',
    house: 12,
    name: 'Intégration',
    primaryData: ['maturite', 'lecon_karmique'],
    dataNature: 'fixe',
    axis: 'Synthèse de vie, sagesse à intégrer, convergence CV + Expression',
    reveals: 'La Maturité comme nombre de synthèse — les Leçons encore actives comme zones d\'intégration finale.',
    imbalance: 'Répétition des leçons sans progression, refus de maturité, vie fragmentée.',
    potential: 'Cohérence profonde entre CV et Expression — sagesse intégrée disponible pour transmettre.',
    keyUnderstanding: 'Les Leçons karmiques sont les nombres absents dans le nom — la vie les ramène jusqu\'à intégration.',
    keyAction: 'Nommer les leçons encore actives et observer précisément où elles se manifestent.',
    mirrorQuestion: 'Quelle leçon revient encore et encore, dans des contextes différents de ma vie ?',
  },
] as const

// ── Types de lecture ────────────────────────────────────────────────────────────

export const NUM_READING_TYPES: readonly NumReadingTypeDefinition[] = [
  {
    id: 'general',
    name: 'Lecture générale',
    objective: 'Vue d\'ensemble de la configuration numérique, potentiels et dynamiques dominantes.',
    prioritySpheres: [1, 4, 7, 10],
    priorityData: ['chemin_de_vie', 'expression', 'ame', 'personnalite_num'],
    answers: 'Qui suis-je selon les nombres ? Quelles sont mes forces et fragilités numériques ?',
    depth: 'standard',
    render: 'synthesis',
  },
  {
    id: 'identitaire',
    name: 'Lecture identitaire',
    objective: 'Clarifier l\'identité (CV), le ressenti (Âme) et la présentation (Personnalité).',
    prioritySpheres: [1, 4, 5, 3],
    priorityData: ['chemin_de_vie', 'ame', 'naissance', 'personnalite_num'],
    answers: 'Qui je suis vraiment ? Y a-t-il cohérence entre intérieur, extérieur et trajectoire ?',
    depth: 'approfondie',
    render: 'structured',
  },
  {
    id: 'relationnelle',
    name: 'Lecture relationnelle',
    objective: 'Dynamiques attractives, modèle relationnel, zones de compatibilité et friction.',
    prioritySpheres: [7, 4, 5, 8],
    priorityData: ['ame', 'personnalite_num', 'expression', 'dette_karmique'],
    answers: 'Comment j\'aime ? Qu\'est-ce que j\'attire ? Quels patterns relationnels reviennent ?',
    depth: 'standard',
    render: 'structured',
  },
  {
    id: 'vocationnelle',
    name: 'Lecture vocationnelle',
    objective: 'Identifier la mission via l\'Expression et la trajectoire via CV + Maturité + Pinnacles.',
    prioritySpheres: [10, 2, 9, 6],
    priorityData: ['expression', 'chemin_de_vie', 'maturite', 'pinnacle'],
    answers: 'Quelle est ma mission ? Comment construire une carrière alignée ? Où en suis-je dans mes Pinnacles ?',
    depth: 'approfondie',
    render: 'structured',
  },
  {
    id: 'karmique',
    name: 'Lecture karmique / transformatrice',
    objective: 'Cartographier les Dettes et Leçons actives, nommer les zones d\'ombre et de répétition.',
    prioritySpheres: [8, 12, 4, 1],
    priorityData: ['dette_karmique', 'lecon_karmique', 'ame', 'chemin_de_vie'],
    answers: 'D\'où viennent mes blocages ? Quels schémas tournent en boucle ? Quelle leçon dois-je intégrer ?',
    depth: 'deep',
    render: 'narrative',
  },
  {
    id: 'cyclique',
    name: 'Lecture cyclique',
    objective: 'Situer dans le cycle actuel (Année, Pinnacle, Cycle de vie) et lire le timing.',
    prioritySpheres: [11, 6, 9, 2],
    priorityData: ['annee_personnelle', 'cycle_vie', 'pinnacle', 'mois_personnel'],
    answers: 'Quelle est l\'énergie de l\'année actuelle ? Quel est le thème du cycle actif ?',
    depth: 'standard',
    render: 'synthesis',
  },
  {
    id: 'potentiel',
    name: 'Lecture de potentiel',
    objective: 'Lire ce qui est disponible mais non encore actualisé.',
    prioritySpheres: [10, 2, 12, 9],
    priorityData: ['expression', 'maturite', 'pinnacle', 'chemin_de_vie'],
    answers: 'Quel est mon potentiel complet ? Qu\'est-ce que je n\'ai pas encore exprimé ?',
    depth: 'approfondie',
    render: 'structured',
  },
] as const

// ── Mapping données → sphères ───────────────────────────────────────────────────

export const NUM_DATA_MAPPING: readonly NumDataMapping[] = [
  { key: 'chemin_de_vie',    nature: 'fixe',     primarySphere: 'sphere_1',  secondarySpheres: ['sphere_9', 'sphere_10'] },
  { key: 'naissance',        nature: 'fixe',     primarySphere: 'sphere_1',  secondarySpheres: [] },
  { key: 'expression',       nature: 'fixe',     primarySphere: 'sphere_10', secondarySpheres: ['sphere_2', 'sphere_3'] },
  { key: 'ame',              nature: 'fixe',     primarySphere: 'sphere_4',  secondarySpheres: ['sphere_5', 'sphere_7'] },
  { key: 'personnalite_num', nature: 'fixe',     primarySphere: 'sphere_3',  secondarySpheres: ['sphere_7', 'sphere_11'] },
  { key: 'heritage',         nature: 'fixe',     primarySphere: 'sphere_4',  secondarySpheres: [] },
  { key: 'nom_prenom',       nature: 'fixe',     primarySphere: 'sphere_3',  secondarySpheres: ['sphere_4'] },
  { key: 'maturite',         nature: 'fixe',     primarySphere: 'sphere_12', secondarySpheres: ['sphere_10'] },
  { key: 'dette_karmique',   nature: 'karmique', primarySphere: 'sphere_8',  secondarySpheres: ['sphere_12'] },
  { key: 'lecon_karmique',   nature: 'karmique', primarySphere: 'sphere_8',  secondarySpheres: ['sphere_12'] },
  { key: 'defi',             nature: 'cyclique', primarySphere: 'sphere_6',  secondarySpheres: ['sphere_8'] },
  { key: 'cycle_vie',        nature: 'cyclique', primarySphere: 'sphere_6',  secondarySpheres: ['sphere_9', 'sphere_12'] },
  { key: 'pinnacle',         nature: 'cyclique', primarySphere: 'sphere_2',  secondarySpheres: ['sphere_9', 'sphere_11', 'sphere_12'] },
  { key: 'annee_personnelle',nature: 'variable', primarySphere: 'sphere_11', secondarySpheres: ['sphere_6'] },
  { key: 'mois_personnel',   nature: 'variable', primarySphere: 'sphere_6',  secondarySpheres: ['sphere_11'] },
  { key: 'jour_personnel',   nature: 'variable', primarySphere: 'sphere_6',  secondarySpheres: [] },
] as const

// ── Framework assemblé ──────────────────────────────────────────────────────────

export const HEXASTRA_NUM_FRAMEWORK: NumScienceFramework = {
  scienceKey: 'numerologie',
  version: '1.0',
  spheres: NUM_SPHERES,
  readingTypes: NUM_READING_TYPES,
  dataMapping: NUM_DATA_MAPPING,
}

// ── Pondération par type de lecture ────────────────────────────────────────────

const PRIMARY_SPHERES_BY_READING: Record<NumReadingType, HouseNumber[]> = {
  general:       [1, 4, 7, 10],
  identitaire:   [1, 4, 5, 3],
  relationnelle: [7, 4, 5, 8],
  vocationnelle: [10, 2, 9, 6],
  karmique:      [8, 12, 4, 1],
  cyclique:      [11, 6, 9, 2],
  potentiel:     [10, 2, 12, 9],
}

/** Retourne le rôle d'une sphère dans un type de lecture */
export function getSphereWeight(house: HouseNumber, readingType: NumReadingType): SphereRole {
  const primaries = PRIMARY_SPHERES_BY_READING[readingType]
  if (primaries.includes(house)) return 'primary'
  if (house === 1 || house === 10) return 'secondary' // CV + Expression : Tier 1 obligatoire
  return 'contextual'
}

// ── Labels UI ───────────────────────────────────────────────────────────────────

export const NUM_SPHERE_UI_LABELS: Record<HouseNumber, string> = {
  1:  'Identité',
  2:  'Ressources',
  3:  'Intelligence',
  4:  'Racines',
  5:  'Expression créative',
  6:  'Équilibre',
  7:  'Relations',
  8:  'Transformation',
  9:  'Vision',
  10: 'Vocation',
  11: 'Collectif',
  12: 'Intégration',
}

export const NUM_READING_TYPE_LABELS: Record<NumReadingType, string> = {
  general:       'Lecture générale',
  identitaire:   'Lecture identitaire',
  relationnelle: 'Lecture relationnelle',
  vocationnelle: 'Lecture vocationnelle',
  karmique:      'Lecture karmique',
  cyclique:      'Lecture cyclique',
  potentiel:     'Lecture de potentiel',
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

export function getSphereByHouse(house: HouseNumber): NumSphereDefinition | undefined {
  return NUM_SPHERES.find((s) => s.house === house)
}

export function getSphereById(id: SphereId): NumSphereDefinition | undefined {
  return NUM_SPHERES.find((s) => s.id === id)
}

export function getPrioritySpheres(readingType: NumReadingType): NumSphereDefinition[] {
  return PRIMARY_SPHERES_BY_READING[readingType]
    .map((h) => getSphereByHouse(h))
    .filter((s): s is NumSphereDefinition => s !== undefined)
}

/** Retourne les sphères avec leur rôle pour un type de lecture — feed UI */
export function getSpheresWithRoles(
  readingType: NumReadingType,
): Array<{ sphere: NumSphereDefinition; role: SphereRole }> {
  return NUM_SPHERES.map((sphere) => ({
    sphere,
    role: getSphereWeight(sphere.house, readingType),
  }))
}

/** Retourne la sphère principale d'une donnée numérique */
export function getPrimarySphereForData(key: NumDataKey): NumSphereDefinition | undefined {
  const mapping = NUM_DATA_MAPPING.find((m) => m.key === key)
  if (!mapping) return undefined
  return getSphereById(mapping.primarySphere)
}

// ── Builders de prompt ──────────────────────────────────────────────────────────

/**
 * Sérialise une sphère en bloc prompt-ready.
 * primary = contenu complet | secondary = condensé | contextual = omis
 */
export function buildSpherePromptBlock(
  sphere: NumSphereDefinition,
  role: SphereRole = 'primary',
  lang: 'fr' | 'en' = 'fr',
): string | null {
  if (role === 'contextual') return null

  if (role === 'secondary') {
    return `## ${sphere.house}. ${sphere.name}\n${sphere.reveals}`
  }

  const isFr = lang === 'fr'
  return [
    `## ${sphere.house}. ${sphere.name}`,
    sphere.reveals,
    isFr ? `Déséquilibre : ${sphere.imbalance}` : `Imbalance: ${sphere.imbalance}`,
    isFr ? `Potentiel : ${sphere.potential}` : `Potential: ${sphere.potential}`,
    isFr ? `Clé : ${sphere.keyUnderstanding}` : `Key: ${sphere.keyUnderstanding}`,
    isFr ? `Action : ${sphere.keyAction}` : `Action: ${sphere.keyAction}`,
    sphere.mirrorQuestion
      ? (isFr ? `Question : ${sphere.mirrorQuestion}` : `Question: ${sphere.mirrorQuestion}`)
      : null,
  ].filter(Boolean).join('\n')
}

/**
 * Génère le bloc de structure pour injection dans buildSystemPrompt.
 * Adapte la profondeur selon le type de lecture.
 */
export function buildNumStructureBlock(
  readingType: NumReadingType,
  lang: 'fr' | 'en' = 'fr',
): string {
  const blocks = NUM_SPHERES
    .map((sphere) => buildSpherePromptBlock(sphere, getSphereWeight(sphere.house, readingType), lang))
    .filter((b): b is string => b !== null)

  const header = lang === 'fr'
    ? `STRUCTURE HEXASTRA — LECTURE NUMÉROLOGIQUE ${readingType.toUpperCase()} — 12 SPHÈRES`
    : `HEXASTRA STRUCTURE — NUMEROLOGICAL ${readingType.toUpperCase()} READING — 12 SPHERES`

  return [header, '', ...blocks].join('\n')
}

/**
 * Prompt système complet pour une lecture numérologique.
 * Utilisable directement dans buildSystemPrompt (analogue buildHoroscopeSystemPrompt).
 */
export function buildNumReadingSystemPrompt(
  readingType: NumReadingType,
  lang: 'fr' | 'en' = 'fr',
  options?: { firstName?: string; plan?: string },
): string {
  const isFr = lang === 'fr'
  const def = NUM_READING_TYPES.find((r) => r.id === readingType)

  const role = isFr
    ? `Tu es HexAstra Numérologie, expert en lecture numérologique structurée à 12 sphères.\nMission : produire une ${def?.name ?? 'lecture numérologique'} complète à partir des données ci-dessous.\nStructure invariante. Aucune donnée analysée deux fois.`
    : `You are HexAstra Numerology, expert in structured 12-sphere numerological reading.\nMission: produce a complete ${def?.name ?? 'numerological reading'} from the data below.\nInvariant structure. No data analyzed twice.`

  const identity = options?.firstName
    ? (isFr ? `Prénom : ${options.firstName}.` : `First name: ${options.firstName}.`)
    : ''

  const rules = isFr
    ? `RÈGLES :\n- Sphères 1 et 10 (CV + Expression) toujours présentes.\n- Chaque donnée dans sa sphère principale uniquement.\n- Dettes et Leçons : uniquement en lecture karmique ou deep.\n- Maturité : uniquement si CV et Expression sont tous deux calculés.\n- Ton : clair, incarné, stratégique. Pas de mystique sans ancrage concret.`
    : `RULES:\n- Spheres 1 and 10 (Life Path + Expression) always present.\n- Each data in its primary sphere only.\n- Debts and Lessons: only in karmic or deep readings.\n- Maturity: only if both Life Path and Expression are calculated.\n- Tone: clear, grounded, strategic. No mysticism without concrete grounding.`

  return [role, identity, buildNumStructureBlock(readingType, lang), rules]
    .filter(Boolean)
    .join('\n\n')
}

// ── Validation post-render ──────────────────────────────────────────────────────

/** Blocs requis par type de lecture — analogie DAILY_REQUIRED_BLOCKS */
export const NUM_REQUIRED_BLOCKS_BY_TYPE: Record<NumReadingType, string[]> = {
  general:       ['IDENTITÉ', 'RACINES', 'RELATIONS', 'VOCATION'],
  identitaire:   ['IDENTITÉ', 'RACINES', 'EXPRESSION CRÉATIVE', 'INTELLIGENCE'],
  relationnelle: ['RELATIONS', 'RACINES', 'EXPRESSION CRÉATIVE', 'TRANSFORMATION'],
  vocationnelle: ['VOCATION', 'RESSOURCES', 'VISION', 'ÉQUILIBRE'],
  karmique:      ['TRANSFORMATION', 'INTÉGRATION', 'RACINES', 'IDENTITÉ'],
  cyclique:      ['COLLECTIF', 'ÉQUILIBRE', 'VISION', 'RESSOURCES'],
  potentiel:     ['VOCATION', 'RESSOURCES', 'INTÉGRATION', 'VISION'],
}

/** Valide qu'un rendu numérologique contient les sphères requises */
export function validateNumOutput(
  text: string,
  readingType: NumReadingType,
): { valid: boolean; missingBlocks: string[] } {
  const upper = (text || '').toUpperCase()
  const required = NUM_REQUIRED_BLOCKS_BY_TYPE[readingType]
  const missingBlocks = required.filter((block) => !upper.includes(block))
  return { valid: missingBlocks.length === 0, missingBlocks }
}
