/**
 * HexAstra — Kua 12 sphères — Schéma TypeScript
 *
 * Structure identique au schéma Ennéagramme (EnneaSphereDefinition-compatible).
 * Données sources remplacées par les données Kua (Feng Shui Ba Zhai).
 *
 * Source : docs/hexastra/kua-12-spheres-framework.md
 * Aligné avec KUA_SUBCATS de universalClassification.ts
 *
 * Types ajoutés vs Ennéagramme :
 * - KuaDataNature  — structure / directionnel / elementaire / spatial / cyclique
 * - KuaDataKey     — 17 identifiants des données Kua
 * - KuaNumber / KuaGroup / KuaElement / KuaTrigramme / CompassDirection — helpers de typage
 * - buildKuaStructureBlock() / buildKuaReadingSystemPrompt()
 * - validateKuaOutput()
 */

// ── Types identifiants ──────────────────────────────────────────────────────────

export type SphereId =
  | 'sphere_1'  | 'sphere_2'  | 'sphere_3'  | 'sphere_4'
  | 'sphere_5'  | 'sphere_6'  | 'sphere_7'  | 'sphere_8'
  | 'sphere_9'  | 'sphere_10' | 'sphere_11' | 'sphere_12'

export type HouseNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

/**
 * Identifiants des données Kua.
 * Tier 1–5 alignés avec le framework Kua.
 */
export type KuaDataKey =
  // Tier 1 — structure (toujours présentes)
  | 'nombre_kua'            // Nombre Kua — 1 à 9
  | 'groupe_kua'            // Groupe Kua — Est ou Ouest
  | 'element_kua'           // Élément Kua — Eau / Bois / Feu / Terre / Métal
  | 'trigramme'             // Trigramme — Kan, Kun, Zhen, Xun, Qian, Dui, Gen, Li
  // Tier 2 — directions favorables (lectures standard et au-dessus)
  | 'direction_sheng_chi'   // Sheng Chi 生氣 — direction d'abondance et de réussite maximale
  | 'direction_tien_yi'     // Tien Yi 天醫 — direction de santé et de récupération
  | 'direction_nien_yen'    // Nien Yen 延年 — direction de longévité relationnelle
  | 'direction_fu_wei'      // Fu Wei 伏位 — direction de développement personnel et de stabilité
  // Tier 3 — directions défavorables (lectures environnement et deep)
  | 'direction_ho_hai'      // Ho Hai 禍害 — obstacles mineurs récurrents
  | 'direction_wu_gui'      // Wu Gui 五鬼 — 5 fantômes, conflits et tensions
  | 'direction_liu_sha'     // Liu Sha 六殺 — 6 blessures, drainage progressif
  | 'direction_jue_ming'    // Jue Ming 絕命 — destin brisé, direction la plus défavorable
  // Tier 4 — spatial (lectures orientation, environnement, stratégique)
  | 'orientation_bureau'    // Orientation actuelle du bureau et de la chaise de travail
  | 'orientation_lit'       // Orientation actuelle de la tête du lit
  | 'secteur_maison'        // Secteur principal de la maison ou de l'espace de vie
  // Tier 5 — cyclique (lectures cyclique, décisionnelle)
  | 'etoile_annuelle'       // Étoile annuelle du cycle Lo Shu active pour l'année en cours
  | 'cycle_ki'              // Position dans le cycle Ki 9 étoiles (cycle de 9 ans)

/** Nature d'une donnée Kua */
export type KuaDataNature = 'structure' | 'directionnel' | 'elementaire' | 'spatial' | 'cyclique'

/** Types de lecture Kua */
export type KuaReadingType =
  | 'general'
  | 'identitaire'
  | 'relationnelle'
  | 'decisionnelle'
  | 'orientation'
  | 'environnement'
  | 'cyclique'
  | 'strategique'

export type ReadingDepth = 'standard' | 'approfondie' | 'deep'
export type ReadingRender = 'synthesis' | 'structured' | 'narrative'
export type SphereRole = 'primary' | 'secondary' | 'contextual'

// ── Types helper Kua ────────────────────────────────────────────────────────────

/** Les 9 nombres Kua possibles */
export type KuaNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/** Groupe énergétique Kua */
export type KuaGroup = 'Est' | 'Ouest'

/** Élément Kua — cycle des 5 éléments */
export type KuaElement = 'Eau' | 'Terre' | 'Bois' | 'Métal' | 'Feu'

/** Trigramme Ba Gua associé au nombre Kua */
export type KuaTrigramme = 'Kan' | 'Kun' | 'Zhen' | 'Xun' | 'Qian' | 'Dui' | 'Gen' | 'Li'

/** Direction cardinale ou inter-cardinale */
export type CompassDirection =
  | 'Nord' | 'Sud' | 'Est' | 'Ouest'
  | 'Nord-Est' | 'Nord-Ouest' | 'Sud-Est' | 'Sud-Ouest'

// ── Interfaces ──────────────────────────────────────────────────────────────────

/** Définition complète d'une sphère Kua — format compatible EnneaSphereDefinition */
export interface KuaSphereDefinition {
  readonly id: SphereId
  readonly house: HouseNumber
  readonly name: string
  readonly primaryData: readonly KuaDataKey[]
  readonly dataNature: KuaDataNature       // nature des données primaires
  readonly axis: string                    // thème de vie central
  readonly reveals: string
  readonly imbalance: string
  readonly potential: string
  readonly keyUnderstanding: string
  readonly keyAction: string
  readonly mirrorQuestion?: string
}

export interface KuaReadingTypeDefinition {
  readonly id: KuaReadingType
  readonly name: string
  readonly objective: string
  readonly prioritySpheres: readonly HouseNumber[]
  readonly priorityData: readonly KuaDataKey[]
  readonly answers: string
  readonly depth: ReadingDepth
  readonly render: ReadingRender
}

export interface KuaDataMapping {
  readonly key: KuaDataKey
  readonly nature: KuaDataNature
  readonly primarySphere: SphereId
  readonly secondarySpheres: readonly SphereId[]
}

export interface KuaScienceFramework {
  readonly scienceKey: 'kua'
  readonly version: string
  readonly spheres: readonly KuaSphereDefinition[]
  readonly readingTypes: readonly KuaReadingTypeDefinition[]
  readonly dataMapping: readonly KuaDataMapping[]
}

// ── Les 12 sphères ─────────────────────────────────────────────────────────────

export const KUA_SPHERES: readonly KuaSphereDefinition[] = [
  {
    id: 'sphere_1',
    house: 1,
    name: 'Identité',
    primaryData: ['nombre_kua', 'groupe_kua'],
    dataNature: 'structure',
    axis: 'Nature énergétique fondamentale, appartenance de groupe, vibration personnelle',
    reveals: 'Le nombre Kua et le groupe (Est ou Ouest) — la nature énergétique qui structure toute la lecture et détermine les directions compatibles avec la personne.',
    imbalance: 'Ignorer l\'appartenance de groupe, forcer des directions contraires à la nature Kua — dépense d\'énergie constante sans résultat.',
    potential: 'Alignement conscient avec sa nature Kua — chaque décision et chaque espace amplifient l\'énergie naturelle plutôt que de la contrarier.',
    keyUnderstanding: 'Le nombre Kua n\'est pas une étiquette — c\'est la fréquence énergétique naturelle à partir de laquelle tout s\'organise.',
    keyAction: 'Calculer son nombre Kua, identifier son groupe et noter les décisions majeures prises contre sa nature de groupe.',
    mirrorQuestion: 'Est-ce que mes choix principaux sont alignés avec mon groupe énergétique naturel ?',
  },
  {
    id: 'sphere_2',
    house: 2,
    name: 'Ressources',
    primaryData: ['direction_sheng_chi', 'orientation_bureau'],
    dataNature: 'directionnel',
    axis: 'Direction d\'abondance, orientation matérielle, flux de réussite',
    reveals: 'La direction Sheng Chi (生氣) — l\'axe le plus favorable pour générer succès, opportunités et abondance matérielle, appliqué à l\'espace de travail.',
    imbalance: 'Bureau orienté vers une direction défavorable, dos à la porte, secteur Sheng Chi bloqué ou encombré — énergie de réussite constamment freinée.',
    potential: 'Espace de travail aligné avec Sheng Chi — flux d\'opportunités amplifié, énergie de prospérité activée naturellement.',
    keyUnderstanding: 'Sheng Chi est la direction de plus forte potentialisation — s\'y orienter au bureau signifie travailler avec le flux énergétique, pas contre lui.',
    keyAction: 'Identifier la direction Sheng Chi personnelle et vérifier l\'orientation actuelle du bureau et de la chaise de travail.',
    mirrorQuestion: 'Mon espace de travail me soutient-il ou me fatigue-t-il énergétiquement ?',
  },
  {
    id: 'sphere_3',
    house: 3,
    name: 'Intelligence',
    primaryData: ['direction_fu_wei', 'element_kua'],
    dataNature: 'directionnel',
    axis: 'Direction de développement personnel, clarté mentale, croissance intérieure',
    reveals: 'La direction Fu Wei (伏位) — l\'axe qui soutient la clarté mentale, l\'introspection, la concentration et le développement personnel stable.',
    imbalance: 'Espace d\'étude ou de réflexion orienté vers une direction défavorable — pensée confuse, décisions brouillées, apprentissage ralenti.',
    potential: 'Concentration amplifiée, clarté dans les choix, croissance personnelle soutenue par l\'alignement spatial — apprendre et décider depuis un ancrage énergétique solide.',
    keyUnderstanding: 'Fu Wei est la direction de stabilité et de croissance douce — idéale pour étudier, réfléchir et construire à long terme sans épuisement.',
    keyAction: 'Identifier la direction Fu Wei et aligner le bureau d\'étude, la chaise de méditation ou l\'espace de lecture.',
    mirrorQuestion: 'Est-ce que j\'ai un espace physique qui soutient vraiment ma clarté mentale ?',
  },
  {
    id: 'sphere_4',
    house: 4,
    name: 'Racines',
    primaryData: ['trigramme', 'element_kua'],
    dataNature: 'elementaire',
    axis: 'Archétype énergétique profond, nature fondamentale, cycles d\'éléments',
    reveals: 'Le trigramme et l\'élément Kua — la nature vibratoire profonde de la personne, ses cycles naturels de renforcement et ses besoins d\'ancrage élémentaire.',
    imbalance: 'Environnement saturé d\'éléments destructeurs de l\'élément personnel — affaiblissement chronique de l\'énergie vitale sans cause apparente.',
    potential: 'Environnement qui nourrit et renforce l\'élément personnel — vitalité naturelle, ancrage solide, cohérence entre nature interne et espace externe.',
    keyUnderstanding: 'Le trigramme révèle l\'archétype — l\'élément révèle la dynamique. Ensemble, ils donnent la clé de l\'équilibre intérieur.',
    keyAction: 'Identifier l\'élément nourricier de son élément Kua et introduire cet élément dans l\'espace de vie principal.',
    mirrorQuestion: 'Mon environnement immédiat renforce-t-il mon énergie ou la draine-t-il progressivement ?',
  },
  {
    id: 'sphere_5',
    house: 5,
    name: 'Expression créative',
    primaryData: ['element_kua'],
    dataNature: 'elementaire',
    axis: 'Cycle créatif, élément nourricier, canal d\'expression naturel',
    reveals: 'L\'élément qui génère l\'élément Kua dans le cycle de production (水木火土金) — source d\'inspiration et d\'énergie créatrice naturelle.',
    imbalance: 'Espace de création dominé par l\'élément destructeur — créativité constamment freinée, expression laborieuse, énergie créative épuisée.',
    potential: 'Espace de création aligné avec l\'élément nourricier — expression fluide, inspiration naturelle, projets créatifs portés par l\'énergie de génération.',
    keyUnderstanding: 'Chaque élément est nourri par un autre — travailler avec cet élément nourricier amplifie naturellement la capacité d\'expression.',
    keyAction: 'Identifier l\'élément qui nourrit son élément Kua et l\'intégrer dans l\'espace créatif (couleurs, matières, formes).',
    mirrorQuestion: 'Mon espace créatif me ressource-t-il ou m\'épuise-t-il esthétiquement ?',
  },
  {
    id: 'sphere_6',
    house: 6,
    name: 'Équilibre',
    primaryData: ['direction_ho_hai', 'etoile_annuelle'],
    dataNature: 'cyclique',
    axis: 'Zone de friction légère, obstacles mineurs, rythme du cycle actuel',
    reveals: 'La direction Ho Hai (禍害) — zone d\'obstacles mineurs à gérer — et l\'étoile annuelle active qui colore le rythme quotidien de l\'année en cours.',
    imbalance: 'Secteur Ho Hai activé sans neutralisation, étoile annuelle défavorable ignorée — accumulation d\'obstacles mineurs qui épuisent sur la durée.',
    potential: 'Obstacles transformés en apprentissages — Ho Hai neutralisé, cycle annuel intégré dans le rythme de vie pour agir au bon moment.',
    keyUnderstanding: 'Ho Hai est la direction la moins défavorable — traitable par des ajustements simples. L\'ignorer transforme les petits obstacles en friction chronique.',
    keyAction: 'Identifier le secteur Ho Hai de sa maison ou de son bureau et appliquer un correctif élémentaire (couleur, plante, cristal selon l\'élément).',
    mirrorQuestion: 'Quels obstacles récurrents pourraient venir d\'un secteur énergétique mal géré dans mon espace ?',
  },
  {
    id: 'sphere_7',
    house: 7,
    name: 'Relations',
    primaryData: ['direction_nien_yen', 'groupe_kua'],
    dataNature: 'directionnel',
    axis: 'Direction de longévité relationnelle, harmonie, compatibilité de groupe',
    reveals: 'La direction Nien Yen (延年) — l\'axe qui favorise les relations durables, la romance, le mariage et l\'harmonie familiale — et la compatibilité naturelle entre groupes Est/Ouest.',
    imbalance: 'Chambre ou espace de vie commun mal orienté, relations avec des personnes de groupe opposé sans conscience — tension relationnelle récurrente sans explication.',
    potential: 'Espace de vie aligné avec Nien Yen — relations harmonieuses, attraction naturelle de partenaires compatibles, longévité des liens.',
    keyUnderstanding: 'Nien Yen signifie "prolonger les années" — c\'est la direction qui donne de la durée et de la profondeur aux liens.',
    keyAction: 'Identifier la direction Nien Yen et vérifier l\'orientation de la chambre et du coin repas — principaux espaces relationnels.',
    mirrorQuestion: 'Mon espace de vie soutient-il les relations que je veux construire ?',
  },
  {
    id: 'sphere_8',
    house: 8,
    name: 'Transformation',
    primaryData: ['direction_jue_ming', 'direction_liu_sha', 'direction_wu_gui'],
    dataNature: 'directionnel',
    axis: 'Zones les plus défavorables, neutralisation active, protection énergétique',
    reveals: 'Les trois directions les plus défavorables — Jue Ming (絕命, destin brisé), Liu Sha (六殺, 6 blessures), Wu Gui (五鬼, 5 fantômes) — zones à identifier et neutraliser activement.',
    imbalance: 'Secteurs Jue Ming et Liu Sha actifs sans correction — drainage énergétique profond, obstacles majeurs répétés, santé fragilisée.',
    potential: 'Neutralisation consciente et stratégique des secteurs défavorables — transformation de la vulnérabilité en espace protégé et stable.',
    keyUnderstanding: 'Ces directions ne sont pas à fuir mais à neutraliser — un secteur défavorable géré est moins problématique qu\'un secteur favorable mal utilisé.',
    keyAction: 'Localiser les secteurs Jue Ming, Liu Sha et Wu Gui dans la maison et placer des éléments correctifs dans chacun (selon le cycle d\'éléments).',
    mirrorQuestion: 'Y a-t-il des zones dans mon espace de vie que j\'évite ou qui semblent systématiquement problématiques ?',
  },
  {
    id: 'sphere_9',
    house: 9,
    name: 'Vision',
    primaryData: ['direction_tien_yi', 'orientation_lit'],
    dataNature: 'directionnel',
    axis: 'Direction de santé et de bénédiction, vision long terme, récupération profonde',
    reveals: 'La direction Tien Yi (天醫, médecin du ciel) — l\'axe qui soutient la santé, la récupération profonde, l\'intuition et la vision à long terme.',
    imbalance: 'Lit orienté vers une direction défavorable, secteur Tien Yi bloqué — sommeil peu récupérateur, intuition voilée, santé sous-optimale.',
    potential: 'Sommeil profond et récupérateur, intuition aiguisée, santé naturellement soutenue — le repos aligne corps et trajectoire.',
    keyUnderstanding: 'Tien Yi est la direction du "médecin du ciel" — bien orienté pendant le sommeil, le corps se régénère dans son flux énergétique naturel.',
    keyAction: 'Identifier la direction Tien Yi et aligner la tête du lit dans cette direction pour activer la récupération nocturne.',
    mirrorQuestion: 'Mon espace de repos soutient-il vraiment ma récupération et ma santé ?',
  },
  {
    id: 'sphere_10',
    house: 10,
    name: 'Vocation',
    primaryData: ['direction_sheng_chi', 'groupe_kua', 'element_kua'],
    dataNature: 'structure',
    axis: 'Trajectoire professionnelle, alignement vocationnel, direction d\'opportunités',
    reveals: 'L\'alignement entre le groupe Kua, la direction Sheng Chi et l\'élément personnel — comment la nature énergétique oriente la mission de vie et les opportunités professionnelles.',
    imbalance: 'Carrière construite contre le groupe énergétique naturel, trajectoire ignorant la direction Sheng Chi — effort chronique sans résultat proportionnel.',
    potential: 'Mission de vie incarnée dans l\'énergie naturelle — réussite sans résistance, opportunités qui semblent venir naturellement.',
    keyUnderstanding: 'La vocation n\'est pas séparée de la nature énergétique — quand groupe, direction et élément s\'alignent, la contribution devient naturelle.',
    keyAction: 'Identifier comment son groupe Kua se manifeste dans sa trajectoire actuelle et si Sheng Chi est activé dans son espace professionnel.',
    mirrorQuestion: 'Est-ce que ma trajectoire professionnelle va dans le sens de mon énergie ou contre elle ?',
  },
  {
    id: 'sphere_11',
    house: 11,
    name: 'Collectif',
    primaryData: ['groupe_kua', 'cycle_ki'],
    dataNature: 'cyclique',
    axis: 'Compatibilité de groupe, dynamiques collectives, timing collectif',
    reveals: 'La compatibilité énergétique avec l\'environnement social et professionnel — groupe Est/Ouest dans les dynamiques collectives — et le cycle Ki pour le timing de contribution.',
    imbalance: 'Immersion durable dans des groupes de nature énergétique opposée sans conscience — friction collective chronique, contribution mal placée dans le temps.',
    potential: 'Contribution dans les bons groupes au bon timing cyclique — impact amplifié par l\'alignement de groupe et de cycle.',
    keyUnderstanding: 'Un groupe Est ne fonctionnera pas toujours harmonieusement avec un groupe Ouest sans conscience — mais la friction peut être transformée en complémentarité.',
    keyAction: 'Identifier le groupe Kua de ses partenaires principaux (associés, proches) et observer si les tensions correspondent à des incompatibilités de groupe.',
    mirrorQuestion: 'Est-ce que les groupes dans lesquels j\'évolue amplifient mon énergie ou la drainent ?',
  },
  {
    id: 'sphere_12',
    house: 12,
    name: 'Intégration',
    primaryData: ['secteur_maison', 'cycle_ki', 'etoile_annuelle'],
    dataNature: 'spatial',
    axis: 'Synthèse de l\'alignement spatial global, intégration des cycles, maison comme amplificateur',
    reveals: 'La maison dans sa globalité comme amplificateur de vie — comment l\'ensemble des secteurs, l\'étoile annuelle et le cycle Ki s\'intègrent en un système cohérent.',
    imbalance: 'Maison globalement désalignée — plusieurs secteurs défavorables actifs simultanément, cycles ignorés — drainage énergétique diffus et constant.',
    potential: 'Maison comme système vivant aligné — chaque secteur soutient une dimension de vie, les cycles informent le timing des actions.',
    keyUnderstanding: 'L\'intégration n\'est pas la perfection de tous les secteurs — c\'est la conscience de l\'ensemble et l\'ajustement progressif prioritaire.',
    keyAction: 'Faire un audit des 8 secteurs de la maison, identifier les 2-3 plus actifs et prioritaires, et planifier les ajustements dans l\'ordre d\'urgence.',
    mirrorQuestion: 'Est-ce que ma maison reflète et soutient la vie que je veux construire ?',
  },
] as const

// ── Types de lecture ────────────────────────────────────────────────────────────

export const KUA_READING_TYPES: readonly KuaReadingTypeDefinition[] = [
  {
    id: 'general',
    name: 'Lecture générale',
    objective: 'Vue d\'ensemble de la configuration Kua — Nombre Kua, Groupe, Trigramme et direction relationnelle Nien Yen.',
    prioritySpheres: [1, 4, 7, 10],
    priorityData: ['nombre_kua', 'groupe_kua', 'trigramme', 'direction_nien_yen'],
    answers: 'Qui suis-je selon mon Kua ? Quelle est ma nature énergétique ? Quelles directions structurent ma vie ?',
    depth: 'standard',
    render: 'synthesis',
  },
  {
    id: 'identitaire',
    name: 'Lecture identitaire',
    objective: 'Clarifier l\'identité profonde via Nombre Kua + Trigramme + Élément + direction Fu Wei.',
    prioritySpheres: [1, 4, 5, 3],
    priorityData: ['nombre_kua', 'trigramme', 'element_kua', 'direction_fu_wei'],
    answers: 'Quelle est ma nature vibratoire fondamentale ? Comment l\'élément Kua se manifeste dans ma vie quotidienne ?',
    depth: 'approfondie',
    render: 'structured',
  },
  {
    id: 'relationnelle',
    name: 'Lecture relationnelle',
    objective: 'Dynamiques relationnelles via Nien Yen, compatibilité de groupe Est/Ouest et Tien Yi.',
    prioritySpheres: [7, 1, 4, 11],
    priorityData: ['direction_nien_yen', 'groupe_kua', 'direction_tien_yi', 'trigramme'],
    answers: 'Comment mon énergie naturelle influence mes relations ? Y a-t-il compatibilité de groupe avec mes proches ?',
    depth: 'standard',
    render: 'structured',
  },
  {
    id: 'decisionnelle',
    name: 'Lecture décisionnelle',
    objective: 'Aligner les décisions avec Fu Wei (clarté), Sheng Chi (opportunités), groupe et timing cyclique.',
    prioritySpheres: [3, 2, 10, 6],
    priorityData: ['direction_fu_wei', 'direction_sheng_chi', 'groupe_kua', 'etoile_annuelle'],
    answers: 'Dans quelle direction orienter mes décisions clés ? Le timing actuel (étoile annuelle) est-il favorable ?',
    depth: 'approfondie',
    render: 'structured',
  },
  {
    id: 'orientation',
    name: 'Lecture orientation de vie',
    objective: 'Cartographier l\'espace physique complet — Sheng Chi (travail), Tien Yi (santé), Fu Wei (étude), groupe (trajectoire).',
    prioritySpheres: [2, 9, 3, 10],
    priorityData: ['direction_sheng_chi', 'direction_tien_yi', 'direction_fu_wei', 'groupe_kua'],
    answers: 'Mes espaces physiques (bureau, chambre) soutiennent-ils mes objectifs de vie ? Comment les optimiser ?',
    depth: 'approfondie',
    render: 'structured',
  },
  {
    id: 'environnement',
    name: 'Lecture environnement',
    objective: 'Audit complet des directions favorables et défavorables dans l\'espace de vie — neutralisation des secteurs actifs.',
    prioritySpheres: [6, 8, 2, 9],
    priorityData: ['direction_ho_hai', 'direction_jue_ming', 'direction_liu_sha', 'direction_wu_gui'],
    answers: 'Quels secteurs de ma maison ou de mon bureau drainent mon énergie ? Comment neutraliser les zones défavorables ?',
    depth: 'standard',
    render: 'structured',
  },
  {
    id: 'cyclique',
    name: 'Lecture cyclique',
    objective: 'Lire le timing de vie à travers l\'étoile annuelle, le cycle Ki et le groupe Kua.',
    prioritySpheres: [6, 11, 10, 12],
    priorityData: ['etoile_annuelle', 'cycle_ki', 'groupe_kua', 'direction_sheng_chi'],
    answers: 'Quelle est l\'énergie de l\'année en cours pour mon Kua ? Quel est le bon timing pour agir, consolider ou me retirer ?',
    depth: 'standard',
    render: 'synthesis',
  },
  {
    id: 'strategique',
    name: 'Lecture alignement stratégique',
    objective: 'Aligner vocation (Sheng Chi), santé (Tien Yi) et relations (Nien Yen) et groupe pour une stratégie de vie cohérente.',
    prioritySpheres: [10, 2, 9, 7],
    priorityData: ['direction_sheng_chi', 'direction_tien_yi', 'direction_nien_yen', 'groupe_kua'],
    answers: 'Comment aligner ma trajectoire professionnelle, ma santé et mes relations dans une stratégie unifiée ?',
    depth: 'approfondie',
    render: 'structured',
  },
] as const

// ── Mapping données → sphères ───────────────────────────────────────────────────

export const KUA_DATA_MAPPING: readonly KuaDataMapping[] = [
  { key: 'nombre_kua',           nature: 'structure',    primarySphere: 'sphere_1',  secondarySpheres: ['sphere_10'] },
  { key: 'groupe_kua',           nature: 'structure',    primarySphere: 'sphere_1',  secondarySpheres: ['sphere_7', 'sphere_10', 'sphere_11'] },
  { key: 'element_kua',          nature: 'elementaire',  primarySphere: 'sphere_4',  secondarySpheres: ['sphere_5', 'sphere_10'] },
  { key: 'trigramme',            nature: 'structure',    primarySphere: 'sphere_4',  secondarySpheres: ['sphere_1'] },
  { key: 'direction_sheng_chi',  nature: 'directionnel', primarySphere: 'sphere_2',  secondarySpheres: ['sphere_10'] },
  { key: 'direction_tien_yi',    nature: 'directionnel', primarySphere: 'sphere_9',  secondarySpheres: ['sphere_7'] },
  { key: 'direction_nien_yen',   nature: 'directionnel', primarySphere: 'sphere_7',  secondarySpheres: ['sphere_9'] },
  { key: 'direction_fu_wei',     nature: 'directionnel', primarySphere: 'sphere_3',  secondarySpheres: ['sphere_12'] },
  { key: 'direction_ho_hai',     nature: 'directionnel', primarySphere: 'sphere_6',  secondarySpheres: ['sphere_8'] },
  { key: 'direction_wu_gui',     nature: 'directionnel', primarySphere: 'sphere_8',  secondarySpheres: ['sphere_6'] },
  { key: 'direction_liu_sha',    nature: 'directionnel', primarySphere: 'sphere_8',  secondarySpheres: [] },
  { key: 'direction_jue_ming',   nature: 'directionnel', primarySphere: 'sphere_8',  secondarySpheres: [] },
  { key: 'orientation_bureau',   nature: 'spatial',      primarySphere: 'sphere_2',  secondarySpheres: ['sphere_3'] },
  { key: 'orientation_lit',      nature: 'spatial',      primarySphere: 'sphere_9',  secondarySpheres: ['sphere_7'] },
  { key: 'secteur_maison',       nature: 'spatial',      primarySphere: 'sphere_12', secondarySpheres: [] },
  { key: 'etoile_annuelle',      nature: 'cyclique',     primarySphere: 'sphere_6',  secondarySpheres: ['sphere_12'] },
  { key: 'cycle_ki',             nature: 'cyclique',     primarySphere: 'sphere_11', secondarySpheres: ['sphere_12', 'sphere_6'] },
] as const

// ── Framework assemblé ──────────────────────────────────────────────────────────

export const HEXASTRA_KUA_FRAMEWORK: KuaScienceFramework = {
  scienceKey: 'kua',
  version: '1.0',
  spheres: KUA_SPHERES,
  readingTypes: KUA_READING_TYPES,
  dataMapping: KUA_DATA_MAPPING,
}

// ── Pondération par type de lecture ────────────────────────────────────────────

const PRIMARY_SPHERES_BY_READING: Record<KuaReadingType, HouseNumber[]> = {
  general:       [1, 4, 7, 10],
  identitaire:   [1, 4, 5, 3],
  relationnelle: [7, 1, 4, 11],
  decisionnelle: [3, 2, 10, 6],
  orientation:   [2, 9, 3, 10],
  environnement: [6, 8, 2, 9],
  cyclique:      [6, 11, 10, 12],
  strategique:   [10, 2, 9, 7],
}

/** Retourne le rôle d'une sphère dans un type de lecture */
export function getSphereWeight(house: HouseNumber, readingType: KuaReadingType): SphereRole {
  const primaries = PRIMARY_SPHERES_BY_READING[readingType]
  if (primaries.includes(house)) return 'primary'
  if (house === 1 || house === 4) return 'secondary' // Nombre Kua + Trigramme/Élément : Tier 1 obligatoire
  return 'contextual'
}

// ── Labels UI ───────────────────────────────────────────────────────────────────

export const KUA_SPHERE_UI_LABELS: Record<HouseNumber, string> = {
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

export const KUA_READING_TYPE_LABELS: Record<KuaReadingType, string> = {
  general:       'Lecture générale',
  identitaire:   'Lecture identitaire',
  relationnelle: 'Lecture relationnelle',
  decisionnelle: 'Lecture décisionnelle',
  orientation:   'Orientation de vie',
  environnement: 'Lecture environnement',
  cyclique:      'Lecture cyclique',
  strategique:   'Alignement stratégique',
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

export function getSphereByHouse(house: HouseNumber): KuaSphereDefinition | undefined {
  return KUA_SPHERES.find((s) => s.house === house)
}

export function getSphereById(id: SphereId): KuaSphereDefinition | undefined {
  return KUA_SPHERES.find((s) => s.id === id)
}

export function getPrioritySpheres(readingType: KuaReadingType): KuaSphereDefinition[] {
  return PRIMARY_SPHERES_BY_READING[readingType]
    .map((h) => getSphereByHouse(h))
    .filter((s): s is KuaSphereDefinition => s !== undefined)
}

/** Retourne les sphères avec leur rôle pour un type de lecture — feed UI */
export function getSpheresWithRoles(
  readingType: KuaReadingType,
): Array<{ sphere: KuaSphereDefinition; role: SphereRole }> {
  return KUA_SPHERES.map((sphere) => ({
    sphere,
    role: getSphereWeight(sphere.house, readingType),
  }))
}

/** Retourne la sphère principale d'une donnée Kua */
export function getPrimarySphereForData(key: KuaDataKey): KuaSphereDefinition | undefined {
  const mapping = KUA_DATA_MAPPING.find((m) => m.key === key)
  if (!mapping) return undefined
  return getSphereById(mapping.primarySphere)
}

// ── Builders de prompt ──────────────────────────────────────────────────────────

/**
 * Sérialise une sphère en bloc prompt-ready.
 * primary = contenu complet | secondary = condensé | contextual = omis
 */
export function buildSpherePromptBlock(
  sphere: KuaSphereDefinition,
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
export function buildKuaStructureBlock(
  readingType: KuaReadingType,
  lang: 'fr' | 'en' = 'fr',
): string {
  const blocks = KUA_SPHERES
    .map((sphere) => buildSpherePromptBlock(sphere, getSphereWeight(sphere.house, readingType), lang))
    .filter((b): b is string => b !== null)

  const header = lang === 'fr'
    ? `STRUCTURE HEXASTRA — LECTURE KUA ${readingType.toUpperCase()} — 12 SPHÈRES`
    : `HEXASTRA STRUCTURE — KUA ${readingType.toUpperCase()} READING — 12 SPHERES`

  return [header, '', ...blocks].join('\n')
}

/**
 * Prompt système complet pour une lecture Kua.
 * Utilisable directement dans buildSystemPrompt (analogue buildEnneaReadingSystemPrompt).
 */
export function buildKuaReadingSystemPrompt(
  readingType: KuaReadingType,
  lang: 'fr' | 'en' = 'fr',
  options?: { firstName?: string },
): string {
  const isFr = lang === 'fr'
  const def = KUA_READING_TYPES.find((r) => r.id === readingType)

  const role = isFr
    ? `Tu es HexAstra Kua, expert en lecture Kua structurée à 12 sphères.\nMission : produire une ${def?.name ?? 'lecture Kua'} complète à partir des données ci-dessous.\nStructure invariante. Aucune donnée analysée deux fois.`
    : `You are HexAstra Kua, expert in structured 12-sphere Kua reading.\nMission: produce a complete ${def?.name ?? 'Kua reading'} from the data below.\nInvariant structure. No data analyzed twice.`

  const identity = options?.firstName
    ? (isFr ? `Prénom : ${options.firstName}.` : `First name: ${options.firstName}.`)
    : ''

  const rules = isFr
    ? `RÈGLES :\n- Sphères 1 et 4 (Nombre Kua + Trigramme/Élément) toujours présentes.\n- Chaque donnée dans sa sphère principale uniquement.\n- Directions favorables (Sheng Chi, Tien Yi, Nien Yen, Fu Wei) uniquement en sphères 2/3/7/9/10 — jamais en sphère 8.\n- Directions défavorables (Ho Hai, Wu Gui, Liu Sha, Jue Ming) uniquement en sphères 6/8 — jamais en sphères 2/3/7/9.\n- Orientation bureau et lit uniquement en lectures orientation, environnement, stratégique.\n- Étoile annuelle et Cycle Ki uniquement en lectures cyclique, décisionnelle, stratégique.\n- Sheng Chi redécrit en sphère 10 : INTERDIT — sphère 10 = trajectoire vocationnelle globale (groupe + élément).\n- Ton : ancré dans l'espace physique, directif, non mystique. Chaque direction reliée à un usage concret.`
    : `RULES:\n- Spheres 1 and 4 (Kua Number + Trigram/Element) always present.\n- Each data in its primary sphere only.\n- Favorable directions (Sheng Chi, Tien Yi, Nien Yen, Fu Wei) only in spheres 2/3/7/9/10 — never in sphere 8.\n- Unfavorable directions (Ho Hai, Wu Gui, Liu Sha, Jue Ming) only in spheres 6/8 — never in spheres 2/3/7/9.\n- Bureau and bed orientation only in orientation, environment, strategic readings.\n- Annual star and Ki cycle only in cyclical, decisional, strategic readings.\n- Sheng Chi redescribed in sphere 10: FORBIDDEN — sphere 10 = global vocational trajectory (group + element).\n- Tone: grounded in physical space, directive, non-mystical. Every direction linked to a concrete use.`

  return [role, identity, buildKuaStructureBlock(readingType, lang), rules]
    .filter(Boolean)
    .join('\n\n')
}

// ── Validation post-render ──────────────────────────────────────────────────────

/** Blocs requis par type de lecture — analogie ENNEA_REQUIRED_BLOCKS_BY_TYPE */
export const KUA_REQUIRED_BLOCKS_BY_TYPE: Record<KuaReadingType, string[]> = {
  general:       ['IDENTITÉ', 'RACINES', 'RELATIONS', 'VOCATION'],
  identitaire:   ['IDENTITÉ', 'RACINES', 'EXPRESSION CRÉATIVE', 'INTELLIGENCE'],
  relationnelle: ['RELATIONS', 'IDENTITÉ', 'RACINES', 'COLLECTIF'],
  decisionnelle: ['INTELLIGENCE', 'RESSOURCES', 'VOCATION', 'ÉQUILIBRE'],
  orientation:   ['RESSOURCES', 'VISION', 'INTELLIGENCE', 'VOCATION'],
  environnement: ['ÉQUILIBRE', 'TRANSFORMATION', 'RESSOURCES', 'VISION'],
  cyclique:      ['ÉQUILIBRE', 'COLLECTIF', 'VOCATION', 'INTÉGRATION'],
  strategique:   ['VOCATION', 'RESSOURCES', 'VISION', 'RELATIONS'],
}

/** Valide qu'un rendu Kua contient les sphères requises */
export function validateKuaOutput(
  text: string,
  readingType: KuaReadingType,
): { valid: boolean; missingBlocks: string[] } {
  const upper = (text || '').toUpperCase()
  const required = KUA_REQUIRED_BLOCKS_BY_TYPE[readingType]
  const missingBlocks = required.filter((block) => !upper.includes(block))
  return { valid: missingBlocks.length === 0, missingBlocks }
}
