/**
 * HexAstra — Human Design 12 sphères — Schéma TypeScript
 *
 * Structure identique au schéma numérologie (SphereDefinition-compatible).
 * Données sources remplacées par les données Human Design.
 *
 * Source : docs/hexastra/humandesign-12-spheres-framework.md
 * Aligné avec HD_SUBCATS de universalClassification.ts
 *
 * Types ajoutés vs numérologie :
 * - HDDataNature  — structure / definition / incarnation / dynamique / cyclique
 * - HDDataKey     — 15 identifiants des données HD
 * - buildHDStructureBlock() / buildHDReadingSystemPrompt()
 * - validateHDOutput()
 */

// ── Types identifiants ──────────────────────────────────────────────────────────

export type SphereId =
  | 'sphere_1'  | 'sphere_2'  | 'sphere_3'  | 'sphere_4'
  | 'sphere_5'  | 'sphere_6'  | 'sphere_7'  | 'sphere_8'
  | 'sphere_9'  | 'sphere_10' | 'sphere_11' | 'sphere_12'

export type HouseNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

/**
 * Identifiants des données Human Design.
 * Tier 1–4 alignés avec le framework HD.
 * Tier 5 cyclique uniquement.
 */
export type HDDataKey =
  // Tier 1 — structure centrale (toujours présentes)
  | 'type_hd'               // Type HD — Générateur, Manifestant, Projecteur, Réflecteur, GM
  | 'strategie'             // Stratégie — Attendre de répondre / inviter / informer / cycle lunaire
  | 'autorite'              // Autorité intérieure — Émotionnelle, Sacrale, Splénique, Ego, etc.
  | 'profil'                // Profil — ligne 1 à 6, ex : 2/4, 5/1
  // Tier 2 — architecture énergétique
  | 'centres_definis'       // Centres définis — énergie fiable et constante
  | 'centres_ouverts'       // Centres non définis — zones d'amplification et de conditionnement
  | 'definition_hd'         // Définition — Simple, Double, Triple, Quadruple, Aucune
  | 'canaux'                // Canaux actifs — connexions entre centres
  // Tier 3 — incarnation
  | 'croix_incarnation'     // Croix d'Incarnation — 4 portes formant la Croix
  | 'portes_conscientes'    // Portes Personnalité (côté conscient — rouge/noir selon logiciel)
  | 'portes_inconscientes'  // Portes Design (côté inconscient — calculé ~88° avant naissance)
  // Tier 4 — expérientiel
  | 'signature'             // Signature — Satisfaction / Succès / Paix / Surprise
  | 'non_soi'               // Thème du Non-Soi — Frustration / Amertume / Colère / Déception
  | 'circuit_dominant'      // Circuit dominant — Individuel / Tribal / Collectif / Intégration
  // Tier 5 — cyclique
  | 'variables'             // Variables complètes — PRL/PRR/PLL/PLR (digestion, env., perspect., motiv.)
  | 'transits_actifs'       // Transits planétaires actifs sur le Design personnel

/** Nature d'une donnée Human Design */
export type HDDataNature = 'structure' | 'definition' | 'incarnation' | 'dynamique' | 'cyclique'

/** Types de lecture Human Design */
export type HDReadingType =
  | 'general'
  | 'identitaire'
  | 'relationnelle'
  | 'decisionnelle'
  | 'vocationnelle'
  | 'karmique'
  | 'energetique'
  | 'cyclique'

export type ReadingDepth = 'standard' | 'approfondie' | 'deep'
export type ReadingRender = 'synthesis' | 'structured' | 'narrative'
export type SphereRole = 'primary' | 'secondary' | 'contextual'

// ── Interfaces ──────────────────────────────────────────────────────────────────

/** Définition complète d'une sphère HD — format compatible SphereDefinition */
export interface HDSphereDefinition {
  readonly id: SphereId
  readonly house: HouseNumber
  readonly name: string
  readonly primaryData: readonly HDDataKey[]
  readonly dataNature: HDDataNature       // nature des données primaires
  readonly axis: string                   // thème de vie central
  readonly reveals: string
  readonly imbalance: string
  readonly potential: string
  readonly keyUnderstanding: string
  readonly keyAction: string
  readonly mirrorQuestion?: string
}

export interface HDReadingTypeDefinition {
  readonly id: HDReadingType
  readonly name: string
  readonly objective: string
  readonly prioritySpheres: readonly HouseNumber[]
  readonly priorityData: readonly HDDataKey[]
  readonly answers: string
  readonly depth: ReadingDepth
  readonly render: ReadingRender
}

export interface HDDataMapping {
  readonly key: HDDataKey
  readonly nature: HDDataNature
  readonly primarySphere: SphereId
  readonly secondarySpheres: readonly SphereId[]
}

export interface HDScienceFramework {
  readonly scienceKey: 'humandesign'
  readonly version: string
  readonly spheres: readonly HDSphereDefinition[]
  readonly readingTypes: readonly HDReadingTypeDefinition[]
  readonly dataMapping: readonly HDDataMapping[]
}

// ── Les 12 sphères ─────────────────────────────────────────────────────────────

export const HD_SPHERES: readonly HDSphereDefinition[] = [
  {
    id: 'sphere_1',
    house: 1,
    name: 'Identité',
    primaryData: ['type_hd', 'profil'],
    dataNature: 'structure',
    axis: 'Nature fondamentale, mode d\'être, façon d\'initier',
    reveals: 'La mécanique naturelle de la personne — son Type détermine sa stratégie d\'interaction et son Profil son rôle dans la vie.',
    imbalance: 'Agir contre sa Stratégie — frustration, amertume, colère ou déception chroniques selon le Type.',
    potential: 'Vie incarnée dans la mécanique naturelle du Type — Signature vécue régulièrement.',
    keyUnderstanding: 'Le Type n\'est pas une identité à performer — c\'est une mécanique à laisser opérer.',
    keyAction: 'Identifier sa Stratégie et observer une situation récente où elle n\'a pas été suivie.',
    mirrorQuestion: 'Est-ce que j\'agis depuis ma Stratégie ou depuis la pression de l\'extérieur ?',
  },
  {
    id: 'sphere_2',
    house: 2,
    name: 'Ressources',
    primaryData: ['centres_definis', 'definition_hd'],
    dataNature: 'definition',
    axis: 'Énergie fiable, capacité à construire, architecture d\'alimentation',
    reveals: 'Quels centres produisent une énergie constante et fiable — et comment la Définition conditionne le rapport aux autres.',
    imbalance: 'Dépenser au-delà des centres définis, attendre une énergie que l\'on n\'a pas de façon stable.',
    potential: 'Utilisation juste des ressources énergétiques naturelles — alignement entre capacité réelle et engagement.',
    keyUnderstanding: 'Seuls les centres définis produisent une énergie fiable. Les centres ouverts amplifient et libèrent.',
    keyAction: 'Lister les engagements actuels et identifier ceux qui dépensent de l\'énergie non disponible de façon fiable.',
    mirrorQuestion: 'Est-ce que je m\'engage depuis mon énergie réelle ou depuis ce que j\'imagine pouvoir faire ?',
  },
  {
    id: 'sphere_3',
    house: 3,
    name: 'Intelligence',
    primaryData: ['variables'],
    dataNature: 'definition',
    axis: 'Traitement de l\'information, style cognitif, gestion de la pression mentale',
    reveals: 'Comment la personne traite et communique l\'information — et si le Centre Tête est une source de pression ou de clarté.',
    imbalance: 'Utiliser le mental comme décideur, rester dans la pression des questions sans réponse.',
    potential: 'Mental comme outil de communication et de partage — non de décision.',
    keyUnderstanding: 'Le Centre Tête génère des questions. L\'Ajna traite. Aucun des deux ne décide.',
    keyAction: 'Identifier les décisions actuellement tranchées par le mental et les reposer à l\'Autorité.',
    mirrorQuestion: 'Quelles décisions suis-je en train de prendre depuis la tête plutôt que depuis mon Autorité ?',
  },
  {
    id: 'sphere_4',
    house: 4,
    name: 'Racines',
    primaryData: ['autorite'],
    dataNature: 'structure',
    axis: 'Mécanisme de vérité intérieure, fondation décisionnelle',
    reveals: 'Le mécanisme précis par lequel la personne sait ce qui est juste pour elle — son intelligence incarnée.',
    imbalance: 'Décisions prises depuis le mental ou la pression externe, ignorer l\'Autorité intérieure.',
    potential: 'Décisions alignées — moins de regret, plus de cohérence entre choix et résultat vécu.',
    keyUnderstanding: 'L\'Autorité n\'est pas une intuition abstraite — c\'est un mécanisme corporel précis à reconnaître.',
    keyAction: 'Décrire en une phrase comment son Autorité fonctionne et identifier la dernière décision prise depuis elle.',
    mirrorQuestion: 'Comment est-ce que je sais, dans mon corps, que quelque chose est juste pour moi ?',
  },
  {
    id: 'sphere_5',
    house: 5,
    name: 'Expression créative',
    primaryData: ['canaux', 'circuit_dominant'],
    dataNature: 'definition',
    axis: 'Mode de manifestation, créativité, expression authentique',
    reveals: 'Comment la personne exprime et manifeste — les canaux actifs indiquent les thèmes d\'expression naturels et les circuits leur registre.',
    imbalance: 'Forcer l\'expression, parler pour être entendu, créer sans connexion à l\'impulsion intérieure.',
    potential: 'Expression fluide et naturelle — ce qui sort sans effort porte la vraie signature énergétique.',
    keyUnderstanding: 'Le Centre Gorge ne décide pas ce qu\'il exprime — il transmet ce qui vient des centres connectés.',
    keyAction: 'Identifier un canal actif relié à la Gorge et observer comment il se manifeste déjà dans la vie quotidienne.',
    mirrorQuestion: 'Est-ce que j\'exprime depuis une impulsion authentique ou depuis le besoin d\'être reconnu ?',
  },
  {
    id: 'sphere_6',
    house: 6,
    name: 'Équilibre',
    primaryData: ['centres_definis', 'circuit_dominant'],
    dataNature: 'definition',
    axis: 'Gestion du stress, rythme quotidien, ressources tribales',
    reveals: 'Comment la personne gère la pression du quotidien et ses ressources tribales (nourriture, abri, famille, argent).',
    imbalance: 'Stress chronique, Centre Racine conditionné en urgence permanente, ressources tribales sacrifiées.',
    potential: 'Rythme juste, alimentation et environnement alignés avec les Variables — ressources tribales activées sainement.',
    keyUnderstanding: 'Le Centre Racine génère de la pression pour finir — pas pour démarrer. L\'urgence constante est du conditionnement.',
    keyAction: 'Identifier un pattern de stress récurrent et tracer sa source dans le design (centre, canal ou conditionnement).',
    mirrorQuestion: 'Quelle pression dans ma vie est réelle, et laquelle est conditionnée ?',
  },
  {
    id: 'sphere_7',
    house: 7,
    name: 'Relations',
    primaryData: ['centres_ouverts', 'profil'],
    dataNature: 'dynamique',
    axis: 'Conditionnement relationnel, patterns d\'attraction, sagesse des centres ouverts',
    reveals: 'Ce que la personne absorbe des autres via ses centres non définis et son rôle relationnel via son Profil.',
    imbalance: 'Fusion dans les centres ouverts, identifier à l\'énergie de l\'autre, répétition des patterns de conditionnement.',
    potential: 'Sagesse des centres ouverts — témoin de la diversité humaine sans en être captif.',
    keyUnderstanding: 'Les centres ouverts ne définissent pas qui l\'on est — ils montrent ce qu\'on amplifie chez les autres.',
    keyAction: 'Lister les centres non définis et identifier un comportement récurrent qui vient du conditionnement de chacun.',
    mirrorQuestion: 'Dans mes relations actuelles, qu\'est-ce qui vient de moi et qu\'est-ce qui vient du conditionnement ?',
  },
  {
    id: 'sphere_8',
    house: 8,
    name: 'Transformation',
    primaryData: ['non_soi', 'signature'],
    dataNature: 'dynamique',
    axis: 'Zones d\'ombre, thème du Non-Soi, patterns de résistance',
    reveals: 'Le signal d\'alarme émotionnel qui indique que la personne vit hors de son Design — et les patterns qui tournent en boucle.',
    imbalance: 'Vivre depuis le Non-Soi sans en avoir conscience, répéter les patterns sans voir l\'indicateur.',
    potential: 'Non-Soi comme boussole — chaque frustration / amertume / colère / déception devient une information de réalignement.',
    keyUnderstanding: 'Le thème du Non-Soi n\'est pas un défaut — c\'est un système d\'alerte conçu pour réorienter.',
    keyAction: 'Nommer son thème du Non-Soi et identifier une situation récente où il était actif.',
    mirrorQuestion: 'Quel signal émotionnel récurrent indique que je vis hors de mon Design ?',
  },
  {
    id: 'sphere_9',
    house: 9,
    name: 'Vision',
    primaryData: ['croix_incarnation', 'portes_conscientes'],
    dataNature: 'incarnation',
    axis: 'Sens de vie, thème d\'incarnation, ce que je transmets consciemment',
    reveals: 'Le thème de vie inscrit dans la Croix d\'Incarnation et les portes conscientes — ce que la personne est ici pour expérimenter et transmettre.',
    imbalance: 'Chercher son sens à l\'extérieur, résister la Croix, forcer une mission que l\'on s\'est inventée.',
    potential: 'Vivre la Croix sans la forcer — la transmission émerge naturellement de qui l\'on est.',
    keyUnderstanding: 'La Croix d\'Incarnation n\'est pas un destin figé — c\'est un thème à traverser pleinement.',
    keyAction: 'Lire le thème de sa Croix et identifier où ce thème se manifeste déjà dans la vie, sans effort.',
    mirrorQuestion: 'Quel thème revient dans ma vie dans différents contextes, comme si c\'était mon registre naturel ?',
  },
  {
    id: 'sphere_10',
    house: 10,
    name: 'Vocation',
    primaryData: ['strategie', 'signature'],
    dataNature: 'structure',
    axis: 'Direction de vie, alignement professionnel, mission vécue',
    reveals: 'La direction naturelle de vie et le signal d\'alignement — Signature vécue = trajectoire juste.',
    imbalance: 'Travail contre la Stratégie, poursuite sans attendre / inviter, Signature absente du quotidien.',
    potential: 'Carrière comme incarnation naturelle du Design — satisfaction / succès / paix / surprise comme indicateurs quotidiens.',
    keyUnderstanding: 'La vocation ne se choisit pas depuis le mental — elle émerge quand on suit sa Stratégie suffisamment longtemps.',
    keyAction: 'Évaluer sa trajectoire professionnelle actuelle à l\'aune de sa Signature : est-elle présente ou absente ?',
    mirrorQuestion: 'Est-ce que ma vie professionnelle génère régulièrement ma Signature ou mon Non-Soi ?',
  },
  {
    id: 'sphere_11',
    house: 11,
    name: 'Collectif',
    primaryData: ['circuit_dominant', 'variables'],
    dataNature: 'definition',
    axis: 'Impact collectif, contribution naturelle, timing d\'entrée dans le groupe',
    reveals: 'Le registre par lequel la personne contribue au collectif — logique (partage de solutions) ou abstrait (partage d\'expériences) — et ses besoins environnementaux.',
    imbalance: 'Contribution forcée, timing collectif ignoré, environnement non aligné avec les Variables.',
    potential: 'Impact naturel dans le bon format et le bon timing — les Variables respectées amplifient la contribution.',
    keyUnderstanding: 'Le Circuit Collectif ne fonctionne pas dans l\'urgence — il opère dans le partage et le retour d\'expérience.',
    keyAction: 'Identifier son circuit collectif dominant et observer si son format de contribution actuel y correspond.',
    mirrorQuestion: 'Est-ce que je contribue dans le format qui me vient naturellement ou dans celui que l\'on attend de moi ?',
  },
  {
    id: 'sphere_12',
    house: 12,
    name: 'Intégration',
    primaryData: ['portes_inconscientes', 'variables', 'definition_hd'],
    dataNature: 'incarnation',
    axis: 'Côté inconscient, maturité de Design, intégration corps-esprit',
    reveals: 'Les portes inconscientes (côté Design) et les Variables complètes — ce que le corps et l\'inconscient incarnent sans que la Personnalité le pilote.',
    imbalance: 'Suridentification au côté Personnalité, ignorer les signaux du corps, résister la Définition.',
    potential: 'Intégration progressive du côté Design — maturité de design qui émerge avec l\'expérience et le déconditionnement.',
    keyUnderstanding: 'Le côté Design (inconscient) est aussi réel que le côté Personnalité — et opère souvent à l\'insu de la personne.',
    keyAction: 'Identifier une qualité ou un pattern qu\'on ne se reconnaît pas mais que les autres voient — c\'est souvent le Design.',
    mirrorQuestion: 'Quelle partie de moi agit de façon constante mais que je ne revendique pas encore ?',
  },
] as const

// ── Types de lecture ────────────────────────────────────────────────────────────

export const HD_READING_TYPES: readonly HDReadingTypeDefinition[] = [
  {
    id: 'general',
    name: 'Lecture générale',
    objective: 'Vue d\'ensemble de la configuration HD — Type, Autorité, Profil et direction de vie.',
    prioritySpheres: [1, 4, 7, 10],
    priorityData: ['type_hd', 'autorite', 'profil', 'strategie'],
    answers: 'Qui suis-je selon mon Design ? Quelle est ma mécanique naturelle ? Comment dois-je prendre mes décisions ?',
    depth: 'standard',
    render: 'synthesis',
  },
  {
    id: 'identitaire',
    name: 'Lecture identitaire',
    objective: 'Clarifier l\'identité profonde via Type + Autorité + Croix d\'Incarnation + Portes conscientes.',
    prioritySpheres: [1, 4, 5, 9],
    priorityData: ['type_hd', 'autorite', 'croix_incarnation', 'portes_conscientes'],
    answers: 'Qui je suis vraiment selon mon Design ? Y a-t-il cohérence entre mon vécu et ma configuration ?',
    depth: 'approfondie',
    render: 'structured',
  },
  {
    id: 'relationnelle',
    name: 'Lecture relationnelle',
    objective: 'Dynamiques de conditionnement, patterns d\'attraction via centres ouverts et Profil.',
    prioritySpheres: [7, 1, 4, 8],
    priorityData: ['centres_ouverts', 'profil', 'non_soi', 'strategie'],
    answers: 'Comment je conditionne et suis conditionné ? Quels patterns relationnels viennent de mon Design ?',
    depth: 'standard',
    render: 'structured',
  },
  {
    id: 'decisionnelle',
    name: 'Lecture décisionnelle',
    objective: 'Approfondir le mécanisme d\'Autorité et la Stratégie comme système de décision incarné.',
    prioritySpheres: [4, 1, 10, 3],
    priorityData: ['autorite', 'type_hd', 'strategie', 'variables'],
    answers: 'Comment je décide juste ? Quelle est mon Autorité précise ? Comment la mettre en pratique ?',
    depth: 'approfondie',
    render: 'structured',
  },
  {
    id: 'vocationnelle',
    name: 'Lecture vocationnelle',
    objective: 'Identifier la direction de vie via Centre G, Stratégie, Signature et Croix d\'Incarnation.',
    prioritySpheres: [10, 9, 2, 5],
    priorityData: ['strategie', 'signature', 'croix_incarnation', 'canaux'],
    answers: 'Quelle est ma direction naturelle ? Comment aligner carrière et Design ? Ma Signature est-elle présente ?',
    depth: 'approfondie',
    render: 'structured',
  },
  {
    id: 'karmique',
    name: 'Lecture karmique / transformatrice',
    objective: 'Cartographier le Non-Soi, les portes inconscientes (Design) et les patterns de résistance.',
    prioritySpheres: [8, 12, 4, 1],
    priorityData: ['non_soi', 'portes_inconscientes', 'autorite', 'type_hd'],
    answers: 'D\'où viennent mes blocages ? Quel est mon thème du Non-Soi ? Qu\'est-ce que mon inconscient porte ?',
    depth: 'deep',
    render: 'narrative',
  },
  {
    id: 'energetique',
    name: 'Lecture dynamique énergétique',
    objective: 'Lire le BodyGraph comme système — flux des centres définis et ouverts, Définition, Variables.',
    prioritySpheres: [2, 6, 3, 11],
    priorityData: ['centres_definis', 'centres_ouverts', 'definition_hd', 'variables'],
    answers: 'Comment fonctionne mon énergie ? Qu\'est-ce qui est fiable ? Comment optimiser mon rythme ?',
    depth: 'standard',
    render: 'structured',
  },
  {
    id: 'cyclique',
    name: 'Lecture cyclique',
    objective: 'Situer dans les transits actifs et leur impact sur les centres et portes du Design personnel.',
    prioritySpheres: [1, 4, 7, 10],
    priorityData: ['transits_actifs', 'centres_definis', 'centres_ouverts', 'strategie'],
    answers: 'Quel transit est actif ? Comment interagit-il avec mon Design personnel ? Quel est le timing ?',
    depth: 'standard',
    render: 'synthesis',
  },
] as const

// ── Mapping données → sphères ───────────────────────────────────────────────────

export const HD_DATA_MAPPING: readonly HDDataMapping[] = [
  { key: 'type_hd',              nature: 'structure',   primarySphere: 'sphere_1',  secondarySpheres: ['sphere_10', 'sphere_8'] },
  { key: 'strategie',            nature: 'structure',   primarySphere: 'sphere_10', secondarySpheres: ['sphere_1'] },
  { key: 'autorite',             nature: 'structure',   primarySphere: 'sphere_4',  secondarySpheres: ['sphere_10'] },
  { key: 'profil',               nature: 'structure',   primarySphere: 'sphere_1',  secondarySpheres: ['sphere_7', 'sphere_9'] },
  { key: 'centres_definis',      nature: 'definition',  primarySphere: 'sphere_2',  secondarySpheres: ['sphere_5', 'sphere_6'] },
  { key: 'centres_ouverts',      nature: 'definition',  primarySphere: 'sphere_7',  secondarySpheres: ['sphere_3', 'sphere_8'] },
  { key: 'definition_hd',        nature: 'definition',  primarySphere: 'sphere_2',  secondarySpheres: ['sphere_12'] },
  { key: 'canaux',               nature: 'definition',  primarySphere: 'sphere_5',  secondarySpheres: ['sphere_2', 'sphere_11'] },
  { key: 'croix_incarnation',    nature: 'incarnation', primarySphere: 'sphere_9',  secondarySpheres: ['sphere_12'] },
  { key: 'portes_conscientes',   nature: 'incarnation', primarySphere: 'sphere_9',  secondarySpheres: ['sphere_5'] },
  { key: 'portes_inconscientes', nature: 'incarnation', primarySphere: 'sphere_12', secondarySpheres: ['sphere_9'] },
  { key: 'signature',            nature: 'dynamique',   primarySphere: 'sphere_10', secondarySpheres: ['sphere_8'] },
  { key: 'non_soi',              nature: 'dynamique',   primarySphere: 'sphere_8',  secondarySpheres: ['sphere_10'] },
  { key: 'circuit_dominant',     nature: 'definition',  primarySphere: 'sphere_5',  secondarySpheres: ['sphere_6', 'sphere_11'] },
  { key: 'variables',            nature: 'cyclique',    primarySphere: 'sphere_11', secondarySpheres: ['sphere_3', 'sphere_12'] },
  { key: 'transits_actifs',      nature: 'cyclique',    primarySphere: 'sphere_1',  secondarySpheres: [] },
] as const

// ── Framework assemblé ──────────────────────────────────────────────────────────

export const HEXASTRA_HD_FRAMEWORK: HDScienceFramework = {
  scienceKey: 'humandesign',
  version: '1.0',
  spheres: HD_SPHERES,
  readingTypes: HD_READING_TYPES,
  dataMapping: HD_DATA_MAPPING,
}

// ── Pondération par type de lecture ────────────────────────────────────────────

const PRIMARY_SPHERES_BY_READING: Record<HDReadingType, HouseNumber[]> = {
  general:       [1, 4, 7, 10],
  identitaire:   [1, 4, 5, 9],
  relationnelle: [7, 1, 4, 8],
  decisionnelle: [4, 1, 10, 3],
  vocationnelle: [10, 9, 2, 5],
  karmique:      [8, 12, 4, 1],
  energetique:   [2, 6, 3, 11],
  cyclique:      [1, 4, 7, 10],
}

/** Retourne le rôle d'une sphère dans un type de lecture */
export function getSphereWeight(house: HouseNumber, readingType: HDReadingType): SphereRole {
  const primaries = PRIMARY_SPHERES_BY_READING[readingType]
  if (primaries.includes(house)) return 'primary'
  if (house === 1 || house === 4) return 'secondary' // Type + Autorité : Tier 1 obligatoire
  return 'contextual'
}

// ── Labels UI ───────────────────────────────────────────────────────────────────

export const HD_SPHERE_UI_LABELS: Record<HouseNumber, string> = {
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

export const HD_READING_TYPE_LABELS: Record<HDReadingType, string> = {
  general:       'Lecture générale',
  identitaire:   'Lecture identitaire',
  relationnelle: 'Lecture relationnelle',
  decisionnelle: 'Lecture décisionnelle',
  vocationnelle: 'Lecture vocationnelle',
  karmique:      'Lecture karmique',
  energetique:   'Lecture énergétique',
  cyclique:      'Lecture cyclique',
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

export function getSphereByHouse(house: HouseNumber): HDSphereDefinition | undefined {
  return HD_SPHERES.find((s) => s.house === house)
}

export function getSphereById(id: SphereId): HDSphereDefinition | undefined {
  return HD_SPHERES.find((s) => s.id === id)
}

export function getPrioritySpheres(readingType: HDReadingType): HDSphereDefinition[] {
  return PRIMARY_SPHERES_BY_READING[readingType]
    .map((h) => getSphereByHouse(h))
    .filter((s): s is HDSphereDefinition => s !== undefined)
}

/** Retourne les sphères avec leur rôle pour un type de lecture — feed UI */
export function getSpheresWithRoles(
  readingType: HDReadingType,
): Array<{ sphere: HDSphereDefinition; role: SphereRole }> {
  return HD_SPHERES.map((sphere) => ({
    sphere,
    role: getSphereWeight(sphere.house, readingType),
  }))
}

/** Retourne la sphère principale d'une donnée HD */
export function getPrimarySphereForData(key: HDDataKey): HDSphereDefinition | undefined {
  const mapping = HD_DATA_MAPPING.find((m) => m.key === key)
  if (!mapping) return undefined
  return getSphereById(mapping.primarySphere)
}

// ── Builders de prompt ──────────────────────────────────────────────────────────

/**
 * Sérialise une sphère en bloc prompt-ready.
 * primary = contenu complet | secondary = condensé | contextual = omis
 */
export function buildSpherePromptBlock(
  sphere: HDSphereDefinition,
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
export function buildHDStructureBlock(
  readingType: HDReadingType,
  lang: 'fr' | 'en' = 'fr',
): string {
  const blocks = HD_SPHERES
    .map((sphere) => buildSpherePromptBlock(sphere, getSphereWeight(sphere.house, readingType), lang))
    .filter((b): b is string => b !== null)

  const header = lang === 'fr'
    ? `STRUCTURE HEXASTRA — LECTURE HUMAN DESIGN ${readingType.toUpperCase()} — 12 SPHÈRES`
    : `HEXASTRA STRUCTURE — HUMAN DESIGN ${readingType.toUpperCase()} READING — 12 SPHERES`

  return [header, '', ...blocks].join('\n')
}

/**
 * Prompt système complet pour une lecture Human Design.
 * Utilisable directement dans buildSystemPrompt (analogue buildHoroscopeSystemPrompt).
 */
export function buildHDReadingSystemPrompt(
  readingType: HDReadingType,
  lang: 'fr' | 'en' = 'fr',
  options?: { firstName?: string },
): string {
  const isFr = lang === 'fr'
  const def = HD_READING_TYPES.find((r) => r.id === readingType)

  const role = isFr
    ? `Tu es HexAstra Human Design, expert en lecture HD structurée à 12 sphères.\nMission : produire une ${def?.name ?? 'lecture Human Design'} complète à partir des données ci-dessous.\nStructure invariante. Aucune donnée analysée deux fois.`
    : `You are HexAstra Human Design, expert in structured 12-sphere HD reading.\nMission: produce a complete ${def?.name ?? 'Human Design reading'} from the data below.\nInvariant structure. No data analyzed twice.`

  const identity = options?.firstName
    ? (isFr ? `Prénom : ${options.firstName}.` : `First name: ${options.firstName}.`)
    : ''

  const rules = isFr
    ? `RÈGLES :\n- Sphères 1 et 4 (Type + Autorité) toujours présentes.\n- Chaque donnée dans sa sphère principale uniquement.\n- Non-Soi et portes inconscientes : uniquement en lecture karmique ou deep.\n- Variables : uniquement en lecture cyclique ou énergétique.\n- Centres ouverts (sphère 7) ≠ centres définis (sphère 2) — jamais mélangés.\n- Croix d\'Incarnation : sphère 9 uniquement — pas dupliquée en sphère 10.\n- Ton : incarné, mécanique, non mystique. Chaque affirmation ancrée dans le Design.`
    : `RULES:\n- Spheres 1 and 4 (Type + Authority) always present.\n- Each data in its primary sphere only.\n- Not-Self and unconscious gates: only in karmic or deep readings.\n- Variables: only in cyclical or energetic readings.\n- Open centers (sphere 7) ≠ defined centers (sphere 2) — never mixed.\n- Incarnation Cross: sphere 9 only — not duplicated in sphere 10.\n- Tone: grounded, mechanical, non-mystical. Every statement anchored in the Design.`

  return [role, identity, buildHDStructureBlock(readingType, lang), rules]
    .filter(Boolean)
    .join('\n\n')
}

// ── Validation post-render ──────────────────────────────────────────────────────

/** Blocs requis par type de lecture — analogie DAILY_REQUIRED_BLOCKS */
export const HD_REQUIRED_BLOCKS_BY_TYPE: Record<HDReadingType, string[]> = {
  general:       ['IDENTITÉ', 'RACINES', 'RELATIONS', 'VOCATION'],
  identitaire:   ['IDENTITÉ', 'RACINES', 'EXPRESSION CRÉATIVE', 'VISION'],
  relationnelle: ['RELATIONS', 'IDENTITÉ', 'RACINES', 'TRANSFORMATION'],
  decisionnelle: ['RACINES', 'IDENTITÉ', 'VOCATION', 'INTELLIGENCE'],
  vocationnelle: ['VOCATION', 'VISION', 'RESSOURCES', 'EXPRESSION CRÉATIVE'],
  karmique:      ['TRANSFORMATION', 'INTÉGRATION', 'RACINES', 'IDENTITÉ'],
  energetique:   ['RESSOURCES', 'ÉQUILIBRE', 'INTELLIGENCE', 'COLLECTIF'],
  cyclique:      ['IDENTITÉ', 'RACINES', 'RELATIONS', 'VOCATION'],
}

/** Valide qu'un rendu HD contient les sphères requises */
export function validateHDOutput(
  text: string,
  readingType: HDReadingType,
): { valid: boolean; missingBlocks: string[] } {
  const upper = (text || '').toUpperCase()
  const required = HD_REQUIRED_BLOCKS_BY_TYPE[readingType]
  const missingBlocks = required.filter((block) => !upper.includes(block))
  return { valid: missingBlocks.length === 0, missingBlocks }
}
