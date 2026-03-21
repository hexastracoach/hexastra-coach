/**
 * HexAstra — Ennéagramme 12 sphères — Schéma TypeScript
 *
 * Structure identique au schéma Human Design (HDSphereDefinition-compatible).
 * Données sources remplacées par les données Ennéagramme.
 *
 * Source : docs/hexastra/enneagramme-12-spheres-framework.md
 * Aligné avec ENNEA_SUBCATS de universalClassification.ts
 *
 * Types ajoutés vs HD :
 * - EnneaDataNature  — structure / dynamique / evolutif / relationnel / cyclique
 * - EnneaDataKey     — 17 identifiants des données Ennéagramme
 * - EnneaType / EnneaWing / EnneaCenter / EnneaSubtype — helpers de typage
 * - buildEnneaStructureBlock() / buildEnneaReadingSystemPrompt()
 * - validateEnneaOutput()
 */

// ── Types identifiants ──────────────────────────────────────────────────────────

export type SphereId =
  | 'sphere_1'  | 'sphere_2'  | 'sphere_3'  | 'sphere_4'
  | 'sphere_5'  | 'sphere_6'  | 'sphere_7'  | 'sphere_8'
  | 'sphere_9'  | 'sphere_10' | 'sphere_11' | 'sphere_12'

export type HouseNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

/**
 * Identifiants des données Ennéagramme.
 * Tier 1–5 alignés avec le framework Ennéagramme.
 */
export type EnneaDataKey =
  // Tier 1 — structure (toujours présentes)
  | 'type_enneagramme'      // Type Ennéagramme — 1 à 9
  | 'aile'                  // Aile — ex : 4w3, 4w5
  | 'centre_intelligence'   // Centre d'intelligence — Corps / Cœur / Tête
  // Tier 2 — dynamique centrale (toujours sauf lecture évolutive)
  | 'passion_dominante'     // Passion dominante — Colère, Orgueil, Mensonge, Envie, Avarice, Peur, Gourmandise, Luxure, Paresse
  | 'fixation_mentale'      // Fixation mentale — filtre cognitif récurrent du type
  | 'peur_fondamentale'     // Peur fondamentale — moteur de la structure défensive
  | 'desir_fondamental'     // Désir fondamental — ce que le type cherche à obtenir ou à être
  // Tier 3 — protection (lectures défensif, transformatrice, deep)
  | 'mecanisme_defense'     // Mécanisme de défense principal — intellectualisation, répression, projection, etc.
  | 'blessure_centrale'     // Blessure centrale — douleur originelle sous-jacente à la structure
  // Tier 4 — évolutif (lectures vocationnelle, transformatrice, évolutive)
  | 'fleche_desintegration' // Flèche de désintégration — direction de chute sous stress
  | 'fleche_integration'    // Flèche d'intégration — direction de croissance consciente
  | 'vertu'                 // Vertu — transformation naturelle de la passion quand la peur est consciente
  | 'idee_sacree'           // Idée sacrée — aspiration profonde au plus haut niveau de santé
  // Tier 5 — relationnel/cyclique (selon type de lecture)
  | 'sous_type'             // Sous-type instinctuel dominant — Conservation (SP), Social (SO), Sexuel (SX)
  | 'style_relationnel'     // Style relationnel — mode d'attachement et de lien interpersonnel
  | 'niveaux_sante'         // Niveaux de santé — 1 à 9 ou bas/moyen/élevé
  | 'tri_type'              // Tri-type — combinaison des trois types dominants (ex : 4-9-2)

/** Nature d'une donnée Ennéagramme */
export type EnneaDataNature = 'structure' | 'dynamique' | 'evolutif' | 'relationnel' | 'cyclique'

/** Types de lecture Ennéagramme */
export type EnneaReadingType =
  | 'general'
  | 'identitaire'
  | 'relationnelle'
  | 'emotionnelle'
  | 'vocationnelle'
  | 'transformatrice'
  | 'defensif'
  | 'evolutive'

export type ReadingDepth = 'standard' | 'approfondie' | 'deep'
export type ReadingRender = 'synthesis' | 'structured' | 'narrative'
export type SphereRole = 'primary' | 'secondary' | 'contextual'

// ── Types helper Ennéagramme ────────────────────────────────────────────────────

/** Les 9 types Ennéagramme */
export type EnneaType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/** Aile — ex : '4w3', '4w5', '9w1', '9w8' */
export type EnneaWing = string

/** Centre d'intelligence */
export type EnneaCenter = 'Corps' | 'Cœur' | 'Tête'

/** Sous-type instinctuel */
export type EnneaSubtype = 'Conservation' | 'Social' | 'Sexuel'

// ── Interfaces ──────────────────────────────────────────────────────────────────

/** Définition complète d'une sphère Ennéagramme — format compatible HDSphereDefinition */
export interface EnneaSphereDefinition {
  readonly id: SphereId
  readonly house: HouseNumber
  readonly name: string
  readonly primaryData: readonly EnneaDataKey[]
  readonly dataNature: EnneaDataNature       // nature des données primaires
  readonly axis: string                      // thème de vie central
  readonly reveals: string
  readonly imbalance: string
  readonly potential: string
  readonly keyUnderstanding: string
  readonly keyAction: string
  readonly mirrorQuestion?: string
}

export interface EnneaReadingTypeDefinition {
  readonly id: EnneaReadingType
  readonly name: string
  readonly objective: string
  readonly prioritySpheres: readonly HouseNumber[]
  readonly priorityData: readonly EnneaDataKey[]
  readonly answers: string
  readonly depth: ReadingDepth
  readonly render: ReadingRender
}

export interface EnneaDataMapping {
  readonly key: EnneaDataKey
  readonly nature: EnneaDataNature
  readonly primarySphere: SphereId
  readonly secondarySpheres: readonly SphereId[]
}

export interface EnneaScienceFramework {
  readonly scienceKey: 'enneagramme'
  readonly version: string
  readonly spheres: readonly EnneaSphereDefinition[]
  readonly readingTypes: readonly EnneaReadingTypeDefinition[]
  readonly dataMapping: readonly EnneaDataMapping[]
}

// ── Les 12 sphères ─────────────────────────────────────────────────────────────

export const ENNEA_SPHERES: readonly EnneaSphereDefinition[] = [
  {
    id: 'sphere_1',
    house: 1,
    name: 'Identité',
    primaryData: ['type_enneagramme', 'aile', 'centre_intelligence'],
    dataNature: 'structure',
    axis: 'Structure caractérielle fondamentale, filtre de réalité, mode d\'être',
    reveals: 'La structure de personnalité centrale — le type organise toute la perception, les décisions et les comportements autour d\'un axe invariant.',
    imbalance: 'Identification totale avec le type — confondre la structure avec l\'identité réelle, défendre le personnage contre toute remise en question.',
    potential: 'Conscience de sa structure sans s\'y identifier — voir le type comme un outil de lecture, pas comme une prison.',
    keyUnderstanding: 'Le type n\'est pas ce que l\'on est — c\'est la façon dont on filtre la réalité pour se protéger d\'une peur fondamentale.',
    keyAction: 'Nommer son type et identifier une situation récente où sa logique s\'est activée automatiquement, sans choix conscient.',
    mirrorQuestion: 'Est-ce que j\'habite vraiment ma vie, ou est-ce que mon type la pilote à ma place ?',
  },
  {
    id: 'sphere_2',
    house: 2,
    name: 'Ressources',
    primaryData: ['desir_fondamental', 'sous_type'],
    dataNature: 'dynamique',
    axis: 'Gestion des ressources vitales, rapport à l\'abondance, sous-type Conservation',
    reveals: 'Comment la personne gère ses ressources vitales (énergie, argent, temps, sécurité physique) — organisé par le sous-type Conservation et le désir fondamental.',
    imbalance: 'Accumulation compulsive ou négligence des besoins fondamentaux selon la passion — thésaurisation ou épuisement.',
    potential: 'Gestion juste des ressources, alignée avec le désir fondamental sain — ni peur du manque ni surcompensation.',
    keyUnderstanding: 'Le rapport aux ressources est filtré par la passion — il dit quelque chose de la peur, pas de la réalité matérielle.',
    keyAction: 'Observer comment son énergie a été gérée la semaine passée et identifier la passion à l\'œuvre dans ces choix.',
    mirrorQuestion: 'Est-ce que je gère mes ressources depuis la peur ou depuis la confiance en ce qui est disponible ?',
  },
  {
    id: 'sphere_3',
    house: 3,
    name: 'Intelligence',
    primaryData: ['fixation_mentale', 'centre_intelligence'],
    dataNature: 'dynamique',
    axis: 'Mode de traitement de l\'information, bruit mental, filtre cognitif',
    reveals: 'La fixation mentale qui colore la perception et génère le bruit intérieur récurrent — comment le centre d\'intelligence du type traite et distord l\'information.',
    imbalance: 'Mental en boucle sur la fixation, décisions prises depuis le filtre du type sans en avoir conscience.',
    potential: 'Pensée claire, observation sans distorsion — intelligence au service de la présence plutôt que de la protection.',
    keyUnderstanding: 'La fixation mentale n\'est pas la vérité — c\'est un filtre récurrent que l\'on peut apprendre à reconnaître sans s\'y identifier.',
    keyAction: 'Nommer sa fixation mentale et observer combien de fois elle tourne en boucle dans une journée ordinaire.',
    mirrorQuestion: 'Quand mon mental s\'emballe, quel est le film qu\'il rejoue systématiquement ?',
  },
  {
    id: 'sphere_4',
    house: 4,
    name: 'Racines',
    primaryData: ['peur_fondamentale', 'blessure_centrale'],
    dataNature: 'dynamique',
    axis: 'Blessure originelle, peur existentielle, fondation de la structure défensive',
    reveals: 'La peur fondamentale et la blessure centrale qui organisent toute la structure défensive — ce qui est perçu comme existentiellement menaçant.',
    imbalance: 'Vie organisée autour de l\'évitement de la peur fondamentale — décisions prises pour ne jamais la rencontrer, au prix de la liberté.',
    potential: 'Relation consciente à la peur — la reconnaître sans qu\'elle décide à la place, la traverser plutôt que la fuir.',
    keyUnderstanding: 'La peur fondamentale n\'est pas une faiblesse — c\'est le signal qui indique précisément où la croissance est possible.',
    keyAction: 'Formuler sa peur fondamentale en une phrase et identifier une décision récente prise pour l\'éviter.',
    mirrorQuestion: 'Si je n\'avais pas cette peur, qu\'est-ce que je ferais différemment en ce moment ?',
  },
  {
    id: 'sphere_5',
    house: 5,
    name: 'Expression créative',
    primaryData: ['vertu', 'desir_fondamental'],
    dataNature: 'evolutif',
    axis: 'Canal d\'expression authentique, vertu émergente, créativité depuis le centre',
    reveals: 'La vertu et le canal d\'expression naturel — ce qui émerge authentiquement quand la passion est transformée et le désir fondamental orienté vers la création plutôt que la protection.',
    imbalance: 'Expression bloquée par la passion ou sur-contrôlée par la fixation — créativité mise au service du mécanisme plutôt que de l\'être réel.',
    potential: 'Créativité fluide, expression depuis la vertu — l\'être exprimé sans la distorsion du mécanisme de défense.',
    keyUnderstanding: 'La vertu n\'est pas opposée à la passion — elle en est la transformation naturelle quand la peur est consciente.',
    keyAction: 'Identifier sa vertu et observer un domaine de vie où elle s\'exprime déjà, sans effort particulier.',
    mirrorQuestion: 'Quand est-ce que je crée ou exprime depuis mon centre plutôt que depuis mon mécanisme de protection ?',
  },
  {
    id: 'sphere_6',
    house: 6,
    name: 'Équilibre',
    primaryData: ['passion_dominante', 'niveaux_sante'],
    dataNature: 'cyclique',
    axis: 'Pattern émotionnel récurrent au quotidien, rythme, niveau de santé actuel',
    reveals: 'La passion dominante en action au quotidien — comment le pattern émotionnel central se manifeste dans le rythme ordinaire de vie et quel niveau de santé est actif.',
    imbalance: 'Passion non consciente qui colore chaque interaction, génère friction et épuisement chronique sans que la personne ne s\'en aperçoive.',
    potential: 'Passion reconnue et nommée — elle perd de sa force automatique quand elle est observée plutôt que subie.',
    keyUnderstanding: 'La passion n\'est pas un ennemi — c\'est l\'énergie du type cherchant une direction. La nommer est déjà une forme de liberté.',
    keyAction: 'Identifier la passion dominante et noter 3 situations de la semaine passée où elle était active sans y être invitée.',
    mirrorQuestion: 'Quel est le pattern émotionnel que je retrouve dans des contextes très différents de ma vie ?',
  },
  {
    id: 'sphere_7',
    house: 7,
    name: 'Relations',
    primaryData: ['style_relationnel', 'sous_type', 'aile'],
    dataNature: 'relationnel',
    axis: 'Patterns d\'attachement, dynamiques relationnelles, sous-type instinctuel',
    reveals: 'Le style relationnel, le pattern d\'attachement et les dynamiques interpersonnelles — filtrés par le type, l\'aile et le sous-type dominant.',
    imbalance: 'Relations organisées autour de la peur fondamentale — attirer ce qu\'on craint, rejouer la blessure dans des contextes différents.',
    potential: 'Relations nourries par la vertu — réciprocité, présence réelle, complémentarité sans projection ni fusion.',
    keyUnderstanding: 'On attire des relations qui correspondent à la croyance qu\'on a de soi — pas à la réalité de ce qu\'on est.',
    keyAction: 'Identifier le pattern relationnel récurrent et le relier à la peur fondamentale ou à la passion active.',
    mirrorQuestion: 'Dans mes relations actuelles, est-ce que je cherche à être protégé, validé, ou vraiment rencontré ?',
  },
  {
    id: 'sphere_8',
    house: 8,
    name: 'Transformation',
    primaryData: ['mecanisme_defense', 'fleche_desintegration'],
    dataNature: 'dynamique',
    axis: 'Zone d\'ombre, comportement sous stress, mécanique de résistance',
    reveals: 'Le mécanisme de défense principal et la flèche de désintégration — comment la personne réagit sous pression et ce qu\'elle fait pour éviter de rencontrer sa peur.',
    imbalance: 'Mécanisme activé à répétition — comportements automatiques sous stress qui aggravent la situation plutôt que de la résoudre.',
    potential: 'Mécanisme reconnu et nommé — l\'observer permet de choisir une réponse consciente plutôt que de réagir automatiquement.',
    keyUnderstanding: 'Le mécanisme de défense protège une douleur réelle — il ne disparaît pas par la volonté, il s\'intègre par la conscience.',
    keyAction: 'Nommer son mécanisme de défense principal et identifier une situation récente où il s\'est activé sans y être invité.',
    mirrorQuestion: 'Qu\'est-ce que je fais quand je me sens vraiment menacé — et qu\'est-ce que ce comportement protège réellement ?',
  },
  {
    id: 'sphere_9',
    house: 9,
    name: 'Vision',
    primaryData: ['fleche_integration', 'idee_sacree'],
    dataNature: 'evolutif',
    axis: 'Direction évolutive, aspiration profonde, flèche de croissance',
    reveals: 'La flèche d\'intégration et l\'idée sacrée — la direction naturelle de croissance du type et ce qu\'il aspire à incarner à son plus haut niveau de santé.',
    imbalance: 'Vision idéalisée sans ancrage — idée sacrée transformée en exigence de perfection plutôt qu\'en aspiration vivante.',
    potential: 'Direction évolutive vécue et incarnée — flèche d\'intégration activée consciemment, idée sacrée comme boussole non comme performance.',
    keyUnderstanding: 'La flèche d\'intégration n\'est pas un effort de volonté — c\'est une direction qui émerge naturellement quand le mécanisme de défense se relâche.',
    keyAction: 'Lire la flèche d\'intégration du type et identifier une qualité de ce type que l\'on commence déjà à incarner, même partiellement.',
    mirrorQuestion: 'Vers quoi est-ce que je me dirige naturellement quand je suis dans mon meilleur état ?',
  },
  {
    id: 'sphere_10',
    house: 10,
    name: 'Vocation',
    primaryData: ['type_enneagramme', 'centre_intelligence', 'desir_fondamental'],
    dataNature: 'structure',
    axis: 'Mission de vie, alignement professionnel, désir fondamental appliqué',
    reveals: 'La direction professionnelle naturelle — désir fondamental sain appliqué à la contribution, centre d\'intelligence comme moteur de la mission.',
    imbalance: 'Vocation filtrée par la peur — travail mis au service du mécanisme de défense plutôt que de la mission réelle.',
    potential: 'Carrière comme incarnation du désir fondamental sain — contribution alignée avec le centre d\'intelligence et la vertu du type.',
    keyUnderstanding: 'La vocation n\'est pas dans le titre ou le secteur — elle est dans la qualité de présence et de contribution que l\'on apporte.',
    keyAction: 'Identifier comment le désir fondamental sain se traduit en contribution professionnelle concrète et observable.',
    mirrorQuestion: 'Est-ce que mon travail actuel permet à mon désir fondamental de s\'exprimer, ou le contraint-il ?',
  },
  {
    id: 'sphere_11',
    house: 11,
    name: 'Collectif',
    primaryData: ['sous_type', 'style_relationnel'],
    dataNature: 'relationnel',
    axis: 'Impact collectif, rôle dans les systèmes, sous-type Social',
    reveals: 'L\'impact dans les groupes et les systèmes — le sous-type Social comme mode de participation collective, le centre d\'intelligence comme registre de contribution.',
    imbalance: 'Participation collective filtrée par la passion — chercher validation, pouvoir ou fusion dans le groupe plutôt que de contribuer.',
    potential: 'Contribution collective depuis la vertu — présence juste dans les systèmes, sans besoin de reconnaissance ni de contrôle.',
    keyUnderstanding: 'Le sous-type Social révèle comment on s\'inscrit dans les systèmes — pas seulement dans les relations individuelles.',
    keyAction: 'Observer son comportement dans les groupes cette semaine et identifier si la passion ou la vertu guide la participation.',
    mirrorQuestion: 'Dans les collectifs auxquels j\'appartiens, est-ce que j\'apporte quelque chose, ou est-ce que je cherche quelque chose ?',
  },
  {
    id: 'sphere_12',
    house: 12,
    name: 'Intégration',
    primaryData: ['tri_type', 'niveaux_sante', 'vertu'],
    dataNature: 'cyclique',
    axis: 'Maturité caractérielle, synthèse du parcours, sagesse intégrée',
    reveals: 'La synthèse du parcours d\'intégration — tri-type, niveaux de santé élevés et vertu intégrée comme vision de la maturité caractérielle possible.',
    imbalance: 'Intégration confondue avec performance ou guérison — vouloir éliminer le type plutôt que l\'habiter consciemment.',
    potential: 'Maturité caractérielle réelle — le type devient un outil au service de la présence, non une prison ni une carte d\'identité figée.',
    keyUnderstanding: 'L\'intégration n\'est pas l\'élimination du type — c\'est la capacité à choisir comment il s\'exprime en fonction du contexte.',
    keyAction: 'Identifier son tri-type si connu et observer comment les trois types interagissent concrètement dans sa vie actuelle.',
    mirrorQuestion: 'À quoi ressemblerait ma vie si mon type était un outil plutôt qu\'une contrainte — et qu\'est-ce que cela changerait concrètement ?',
  },
] as const

// ── Types de lecture ────────────────────────────────────────────────────────────

export const ENNEA_READING_TYPES: readonly EnneaReadingTypeDefinition[] = [
  {
    id: 'general',
    name: 'Lecture générale',
    objective: 'Vue d\'ensemble de la configuration Ennéagramme — Type, Peur, Aile et style relationnel.',
    prioritySpheres: [1, 4, 7, 10],
    priorityData: ['type_enneagramme', 'peur_fondamentale', 'aile', 'style_relationnel'],
    answers: 'Qui suis-je selon mon type ? Quelle est ma structure caractérielle ? Comment ma peur fondamentale organise-t-elle ma vie ?',
    depth: 'standard',
    render: 'synthesis',
  },
  {
    id: 'identitaire',
    name: 'Lecture identitaire',
    objective: 'Clarifier l\'identité profonde via Type + Peur fondamentale + Vertu + Fixation mentale.',
    prioritySpheres: [1, 4, 5, 3],
    priorityData: ['type_enneagramme', 'peur_fondamentale', 'vertu', 'fixation_mentale'],
    answers: 'Qui je suis vraiment selon l\'Ennéagramme ? Y a-t-il cohérence entre mon vécu et ma structure caractérielle ?',
    depth: 'approfondie',
    render: 'structured',
  },
  {
    id: 'relationnelle',
    name: 'Lecture relationnelle',
    objective: 'Dynamiques d\'attachement, patterns relationnels via style relationnel, sous-type et aile.',
    prioritySpheres: [7, 1, 4, 11],
    priorityData: ['style_relationnel', 'sous_type', 'peur_fondamentale', 'aile'],
    answers: 'Comment est-ce que je me lie aux autres ? Quels patterns relationnels viennent de mon type ?',
    depth: 'standard',
    render: 'structured',
  },
  {
    id: 'emotionnelle',
    name: 'Lecture émotionnelle',
    objective: 'Cartographier la passion dominante, son impact sur l\'équilibre quotidien et le niveau de santé actif.',
    prioritySpheres: [6, 4, 8, 3],
    priorityData: ['passion_dominante', 'peur_fondamentale', 'mecanisme_defense', 'fixation_mentale'],
    answers: 'Quel est mon pattern émotionnel central ? Comment la passion colore-t-elle mes journées ? Quel niveau de santé est actif ?',
    depth: 'standard',
    render: 'structured',
  },
  {
    id: 'vocationnelle',
    name: 'Lecture vocationnelle',
    objective: 'Identifier la direction professionnelle naturelle via désir fondamental, flèche d\'intégration et vertu.',
    prioritySpheres: [10, 9, 2, 5],
    priorityData: ['type_enneagramme', 'fleche_integration', 'desir_fondamental', 'vertu'],
    answers: 'Quelle est ma mission naturelle ? Comment aligner carrière et désir fondamental sain ? Ma vertu est-elle exprimée dans mon travail ?',
    depth: 'approfondie',
    render: 'structured',
  },
  {
    id: 'transformatrice',
    name: 'Lecture transformatrice',
    objective: 'Cartographier le mécanisme de défense, la blessure centrale et le tri-type comme carte de transformation profonde.',
    prioritySpheres: [8, 12, 4, 9],
    priorityData: ['mecanisme_defense', 'tri_type', 'peur_fondamentale', 'fleche_integration'],
    answers: 'D\'où viennent mes blocages ? Comment ma flèche de désintégration se manifeste-t-elle sous stress ? Que protège mon mécanisme de défense ?',
    depth: 'deep',
    render: 'narrative',
  },
  {
    id: 'defensif',
    name: 'Lecture mécanismes de défense',
    objective: 'Approfondir le mécanisme de défense principal, la fixation mentale et la passion comme système de résistance.',
    prioritySpheres: [8, 3, 4, 6],
    priorityData: ['mecanisme_defense', 'fixation_mentale', 'peur_fondamentale', 'passion_dominante'],
    answers: 'Quel est mon mécanisme de défense précis ? Comment la fixation et la passion s\'alimentent-elles mutuellement ? Comment reconnaître l\'activation sans s\'y identifier ?',
    depth: 'approfondie',
    render: 'structured',
  },
  {
    id: 'evolutive',
    name: 'Lecture évolutive',
    objective: 'Activer la flèche d\'intégration, la vertu et l\'idée sacrée comme direction de croissance incarnée.',
    prioritySpheres: [9, 12, 5, 1],
    priorityData: ['fleche_integration', 'vertu', 'idee_sacree', 'type_enneagramme'],
    answers: 'Vers quoi suis-je naturellement en train de croître ? Comment incarner la vertu sans en faire une performance ? Quelle est mon idée sacrée comme boussole ?',
    depth: 'approfondie',
    render: 'structured',
  },
] as const

// ── Mapping données → sphères ───────────────────────────────────────────────────

export const ENNEA_DATA_MAPPING: readonly EnneaDataMapping[] = [
  { key: 'type_enneagramme',    nature: 'structure',   primarySphere: 'sphere_1',  secondarySpheres: ['sphere_10', 'sphere_6'] },
  { key: 'aile',                nature: 'structure',   primarySphere: 'sphere_1',  secondarySpheres: ['sphere_7'] },
  { key: 'centre_intelligence', nature: 'structure',   primarySphere: 'sphere_3',  secondarySpheres: ['sphere_10', 'sphere_1'] },
  { key: 'passion_dominante',   nature: 'dynamique',   primarySphere: 'sphere_6',  secondarySpheres: ['sphere_8', 'sphere_4'] },
  { key: 'fixation_mentale',    nature: 'dynamique',   primarySphere: 'sphere_3',  secondarySpheres: ['sphere_6'] },
  { key: 'peur_fondamentale',   nature: 'dynamique',   primarySphere: 'sphere_4',  secondarySpheres: ['sphere_8', 'sphere_7'] },
  { key: 'desir_fondamental',   nature: 'dynamique',   primarySphere: 'sphere_2',  secondarySpheres: ['sphere_10', 'sphere_5'] },
  { key: 'mecanisme_defense',   nature: 'dynamique',   primarySphere: 'sphere_8',  secondarySpheres: ['sphere_4'] },
  { key: 'blessure_centrale',   nature: 'dynamique',   primarySphere: 'sphere_4',  secondarySpheres: ['sphere_8'] },
  { key: 'fleche_desintegration', nature: 'evolutif',  primarySphere: 'sphere_8',  secondarySpheres: ['sphere_6'] },
  { key: 'fleche_integration',  nature: 'evolutif',    primarySphere: 'sphere_9',  secondarySpheres: ['sphere_12'] },
  { key: 'vertu',               nature: 'evolutif',    primarySphere: 'sphere_5',  secondarySpheres: ['sphere_12', 'sphere_9'] },
  { key: 'idee_sacree',         nature: 'evolutif',    primarySphere: 'sphere_9',  secondarySpheres: ['sphere_12'] },
  { key: 'sous_type',           nature: 'relationnel', primarySphere: 'sphere_7',  secondarySpheres: ['sphere_2', 'sphere_11'] },
  { key: 'style_relationnel',   nature: 'relationnel', primarySphere: 'sphere_7',  secondarySpheres: ['sphere_11'] },
  { key: 'niveaux_sante',       nature: 'cyclique',    primarySphere: 'sphere_6',  secondarySpheres: ['sphere_12', 'sphere_9'] },
  { key: 'tri_type',            nature: 'cyclique',    primarySphere: 'sphere_12', secondarySpheres: ['sphere_1'] },
] as const

// ── Framework assemblé ──────────────────────────────────────────────────────────

export const HEXASTRA_ENNEA_FRAMEWORK: EnneaScienceFramework = {
  scienceKey: 'enneagramme',
  version: '1.0',
  spheres: ENNEA_SPHERES,
  readingTypes: ENNEA_READING_TYPES,
  dataMapping: ENNEA_DATA_MAPPING,
}

// ── Pondération par type de lecture ────────────────────────────────────────────

const PRIMARY_SPHERES_BY_READING: Record<EnneaReadingType, HouseNumber[]> = {
  general:        [1, 4, 7, 10],
  identitaire:    [1, 4, 5, 3],
  relationnelle:  [7, 1, 4, 11],
  emotionnelle:   [6, 4, 8, 3],
  vocationnelle:  [10, 9, 2, 5],
  transformatrice:[8, 12, 4, 9],
  defensif:       [8, 3, 4, 6],
  evolutive:      [9, 12, 5, 1],
}

/** Retourne le rôle d'une sphère dans un type de lecture */
export function getSphereWeight(house: HouseNumber, readingType: EnneaReadingType): SphereRole {
  const primaries = PRIMARY_SPHERES_BY_READING[readingType]
  if (primaries.includes(house)) return 'primary'
  if (house === 1 || house === 4) return 'secondary' // Type + Peur fondamentale : Tier 1 obligatoire
  return 'contextual'
}

// ── Labels UI ───────────────────────────────────────────────────────────────────

export const ENNEA_SPHERE_UI_LABELS: Record<HouseNumber, string> = {
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

export const ENNEA_READING_TYPE_LABELS: Record<EnneaReadingType, string> = {
  general:        'Lecture générale',
  identitaire:    'Lecture identitaire',
  relationnelle:  'Lecture relationnelle',
  emotionnelle:   'Lecture émotionnelle',
  vocationnelle:  'Lecture vocationnelle',
  transformatrice:'Lecture transformatrice',
  defensif:       'Mécanismes de défense',
  evolutive:      'Lecture évolutive',
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

export function getSphereByHouse(house: HouseNumber): EnneaSphereDefinition | undefined {
  return ENNEA_SPHERES.find((s) => s.house === house)
}

export function getSphereById(id: SphereId): EnneaSphereDefinition | undefined {
  return ENNEA_SPHERES.find((s) => s.id === id)
}

export function getPrioritySpheres(readingType: EnneaReadingType): EnneaSphereDefinition[] {
  return PRIMARY_SPHERES_BY_READING[readingType]
    .map((h) => getSphereByHouse(h))
    .filter((s): s is EnneaSphereDefinition => s !== undefined)
}

/** Retourne les sphères avec leur rôle pour un type de lecture — feed UI */
export function getSpheresWithRoles(
  readingType: EnneaReadingType,
): Array<{ sphere: EnneaSphereDefinition; role: SphereRole }> {
  return ENNEA_SPHERES.map((sphere) => ({
    sphere,
    role: getSphereWeight(sphere.house, readingType),
  }))
}

/** Retourne la sphère principale d'une donnée Ennéagramme */
export function getPrimarySphereForData(key: EnneaDataKey): EnneaSphereDefinition | undefined {
  const mapping = ENNEA_DATA_MAPPING.find((m) => m.key === key)
  if (!mapping) return undefined
  return getSphereById(mapping.primarySphere)
}

// ── Builders de prompt ──────────────────────────────────────────────────────────

/**
 * Sérialise une sphère en bloc prompt-ready.
 * primary = contenu complet | secondary = condensé | contextual = omis
 */
export function buildSpherePromptBlock(
  sphere: EnneaSphereDefinition,
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
export function buildEnneaStructureBlock(
  readingType: EnneaReadingType,
  lang: 'fr' | 'en' = 'fr',
): string {
  const blocks = ENNEA_SPHERES
    .map((sphere) => buildSpherePromptBlock(sphere, getSphereWeight(sphere.house, readingType), lang))
    .filter((b): b is string => b !== null)

  const header = lang === 'fr'
    ? `STRUCTURE HEXASTRA — LECTURE ENNÉAGRAMME ${readingType.toUpperCase()} — 12 SPHÈRES`
    : `HEXASTRA STRUCTURE — ENNEAGRAM ${readingType.toUpperCase()} READING — 12 SPHERES`

  return [header, '', ...blocks].join('\n')
}

/**
 * Prompt système complet pour une lecture Ennéagramme.
 * Utilisable directement dans buildSystemPrompt (analogue buildHDReadingSystemPrompt).
 */
export function buildEnneaReadingSystemPrompt(
  readingType: EnneaReadingType,
  lang: 'fr' | 'en' = 'fr',
  options?: { firstName?: string },
): string {
  const isFr = lang === 'fr'
  const def = ENNEA_READING_TYPES.find((r) => r.id === readingType)

  const role = isFr
    ? `Tu es HexAstra Ennéagramme, expert en lecture Ennéagramme structurée à 12 sphères.\nMission : produire une ${def?.name ?? 'lecture Ennéagramme'} complète à partir des données ci-dessous.\nStructure invariante. Aucune donnée analysée deux fois.`
    : `You are HexAstra Enneagram, expert in structured 12-sphere Enneagram reading.\nMission: produce a complete ${def?.name ?? 'Enneagram reading'} from the data below.\nInvariant structure. No data analyzed twice.`

  const identity = options?.firstName
    ? (isFr ? `Prénom : ${options.firstName}.` : `First name: ${options.firstName}.`)
    : ''

  const rules = isFr
    ? `RÈGLES :\n- Sphères 1 et 4 (Type + Peur fondamentale) toujours présentes.\n- Chaque donnée dans sa sphère principale uniquement.\n- Passion (sphère 6) ≠ Fixation mentale (sphère 3) — jamais intervertis.\n- Mécanisme de défense approfondi uniquement en lecture défensif, transformatrice ou deep.\n- Flèche de désintégration (sphère 8) ≠ Flèche d'intégration (sphère 9) — jamais dans la même sphère.\n- Sous-types : SP → sphère 2, SO → sphère 11, SX → sphère 7. Un seul analysé par sphère.\n- Type redécrit en sphère 10 : INTERDIT — sphère 10 = désir fondamental sain appliqué à la mission.\n- Ton : incarné, psychologique, non mystique. Chaque affirmation ancrée dans la structure du type.`
    : `RULES:\n- Spheres 1 and 4 (Type + Core Fear) always present.\n- Each data in its primary sphere only.\n- Passion (sphere 6) ≠ Mental Fixation (sphere 3) — never swapped.\n- Defense mechanism in depth only in defensive, transformative or deep readings.\n- Disintegration arrow (sphere 8) ≠ Integration arrow (sphere 9) — never in the same sphere.\n- Subtypes: SP → sphere 2, SO → sphere 11, SX → sphere 7. Only one analyzed per sphere.\n- Type redescribed in sphere 10: FORBIDDEN — sphere 10 = core desire applied to mission.\n- Tone: grounded, psychological, non-mystical. Every statement anchored in the type structure.`

  return [role, identity, buildEnneaStructureBlock(readingType, lang), rules]
    .filter(Boolean)
    .join('\n\n')
}

// ── Validation post-render ──────────────────────────────────────────────────────

/** Blocs requis par type de lecture — analogie HD_REQUIRED_BLOCKS_BY_TYPE */
export const ENNEA_REQUIRED_BLOCKS_BY_TYPE: Record<EnneaReadingType, string[]> = {
  general:        ['IDENTITÉ', 'RACINES', 'RELATIONS', 'VOCATION'],
  identitaire:    ['IDENTITÉ', 'RACINES', 'EXPRESSION CRÉATIVE', 'INTELLIGENCE'],
  relationnelle:  ['RELATIONS', 'IDENTITÉ', 'RACINES', 'COLLECTIF'],
  emotionnelle:   ['ÉQUILIBRE', 'RACINES', 'TRANSFORMATION', 'INTELLIGENCE'],
  vocationnelle:  ['VOCATION', 'VISION', 'RESSOURCES', 'EXPRESSION CRÉATIVE'],
  transformatrice:['TRANSFORMATION', 'INTÉGRATION', 'RACINES', 'VISION'],
  defensif:       ['TRANSFORMATION', 'INTELLIGENCE', 'RACINES', 'ÉQUILIBRE'],
  evolutive:      ['VISION', 'INTÉGRATION', 'EXPRESSION CRÉATIVE', 'IDENTITÉ'],
}

/** Valide qu'un rendu Ennéagramme contient les sphères requises */
export function validateEnneaOutput(
  text: string,
  readingType: EnneaReadingType,
): { valid: boolean; missingBlocks: string[] } {
  const upper = (text || '').toUpperCase()
  const required = ENNEA_REQUIRED_BLOCKS_BY_TYPE[readingType]
  const missingBlocks = required.filter((block) => !upper.includes(block))
  return { valid: missingBlocks.length === 0, missingBlocks }
}
