/**
 * HexAstra — Astrologie 12 sphères — Schéma TypeScript
 *
 * Types réutilisables + tableau des 12 sphères + 7 types de lecture.
 * Compatible avec buildSystemPrompt, le moteur de rendu, et un futur front.
 *
 * Source de vérité : docs/hexastra/astrologie-12-spheres-framework.md
 * Science cible    : 'astrologie' (ScienceKey)
 * Ne pas importer depuis lib/hexastra/types.ts — ce module est autonome.
 */

// ── Identifiants stables ────────────────────────────────────────────────────────

/** Identifiant de chaque sphère — stable cross-science */
export type SphereId =
  | 'sphere_1'  | 'sphere_2'  | 'sphere_3'  | 'sphere_4'
  | 'sphere_5'  | 'sphere_6'  | 'sphere_7'  | 'sphere_8'
  | 'sphere_9'  | 'sphere_10' | 'sphere_11' | 'sphere_12'

/** Numéro de maison astrologique (I–XII) */
export type HouseNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

/** Planètes couvertes par le système */
export type Planet =
  | 'Soleil' | 'Lune' | 'Mercure' | 'Vénus' | 'Mars'
  | 'Jupiter' | 'Saturne' | 'Uranus' | 'Neptune' | 'Pluton'
  | 'Chiron' | 'Nœud Nord' | 'Nœud Sud' | 'MC' | 'ASC'

/**
 * Identifiants des sous-catégories astrologiques.
 * Alignés avec ASTRO_SUBCATS dans universalClassification.ts.
 */
export type AstroSubcat =
  | 'signe_solaire'    | 'signe_lunaire'    | 'ascendant'
  | 'planetes'         | 'theme_natal'      | 'maisons'
  | 'aspects'          | 'transits'         | 'retrograde'
  | 'cycle'            | 'vocation_astro'   | 'compatibilite_astro'

/** Types de lecture disponibles */
export type AstroReadingType =
  | 'general'
  | 'identitaire'
  | 'relationnelle'
  | 'vocationnelle'
  | 'karmique'
  | 'creative'
  | 'cyclique'

/** Niveau de profondeur d'une lecture */
export type ReadingDepth = 'standard' | 'approfondie' | 'deep'

/** Format de rendu attendu */
export type ReadingRender = 'synthesis' | 'structured' | 'narrative'

/** Rôle d'une sphère dans un type de lecture */
export type SphereRole = 'primary' | 'secondary' | 'contextual'

// ── Interface sphère ────────────────────────────────────────────────────────────

/** Définition complète d'une sphère — format standard réutilisable */
export interface SphereDefinition {
  readonly id: SphereId
  readonly house: HouseNumber
  readonly name: string              // ex: "Identité"
  readonly ruler: Planet[]           // planète(s) maîtresse(s)
  readonly axis: string              // thème de vie central (1 ligne)
  readonly reveals: string           // ce que cette sphère montre
  readonly astroInputs: AstroSubcat[]
  readonly imbalance: string         // manifestation basse
  readonly potential: string         // manifestation élevée
  readonly keyUnderstanding: string  // insight fondamental
  readonly keyAction: string         // direction pratique (impérative)
  readonly mirrorQuestion?: string   // optionnel
}

// ── Interface type de lecture ───────────────────────────────────────────────────

/** Mapping d'un type de lecture vers les sphères et données prioritaires */
export interface AstroReadingTypeDefinition {
  readonly id: AstroReadingType
  readonly name: string
  readonly objective: string
  readonly prioritySpheres: HouseNumber[]   // maisons correspondant aux sphères prioritaires
  readonly priorityData: AstroSubcat[]
  readonly answers: string                   // type de question à laquelle elle répond
  readonly depth: ReadingDepth
  readonly render: ReadingRender
}

// ── Interface mapping planète → sphère ─────────────────────────────────────────

export interface PlanetSphereMapping {
  readonly planet: Planet
  readonly primarySphere: SphereId
  readonly secondarySpheres: SphereId[]
}

// ── Interface framework complet ─────────────────────────────────────────────────

/** Conteneur du framework science — duplicable vers HD, Numérologie, Ennéagramme */
export interface ScienceFramework {
  readonly scienceKey: 'astrologie'
  readonly version: string
  readonly spheres: readonly SphereDefinition[]
  readonly readingTypes: readonly AstroReadingTypeDefinition[]
  readonly planetMapping: readonly PlanetSphereMapping[]
}

// ── Les 12 sphères ─────────────────────────────────────────────────────────────

export const ASTRO_SPHERES: readonly SphereDefinition[] = [
  {
    id: 'sphere_1',
    house: 1,
    name: 'Identité',
    ruler: ['Soleil', 'ASC'],
    axis: 'Soi, affirmation, présence au monde',
    reveals: 'Comment la personne se perçoit, se présente, initie et se distingue.',
    astroInputs: ['signe_solaire', 'ascendant', 'maisons'],
    imbalance: 'Identité floue ou excessive, dépendance aux regards extérieurs.',
    potential: 'Présence naturelle, leadership authentique, capacité à initier sans forcer.',
    keyUnderstanding: 'Soleil = qui je suis. Ascendant = comment j\'arrive. Maître ASC = par où passe mon énergie.',
    keyAction: 'Aligner la présentation extérieure avec la nature profonde.',
    mirrorQuestion: 'Comment je veux être perçu, et comment j\'arrive réellement ?',
  },
  {
    id: 'sphere_2',
    house: 2,
    name: 'Ressources',
    ruler: ['Vénus'],
    axis: 'Valeurs, possessions, rapport à l\'argent et à la sécurité',
    reveals: 'Comment la personne génère, valorise et sécurise — argent, énergie, confiance en soi.',
    astroInputs: ['maisons', 'planetes'],
    imbalance: 'Dépendance matérielle, dévalorisation de soi, rapport toxique à l\'argent.',
    potential: 'Stabilité construite, abondance alignée avec les valeurs, autonomie réelle.',
    keyUnderstanding: 'La Maison II n\'est pas que l\'argent — c\'est ce que je considère comme mien, y compris ma valeur propre.',
    keyAction: 'Identifier ce qui nourrit réellement et construire à partir de là.',
    mirrorQuestion: 'Est-ce que je crée depuis l\'abondance ou depuis la peur du manque ?',
  },
  {
    id: 'sphere_3',
    house: 3,
    name: 'Intelligence',
    ruler: ['Mercure'],
    axis: 'Pensée, communication, apprentissage, liens de proximité',
    reveals: 'Style de pensée, mode d\'apprentissage, rapport aux mots, à la fratrie, aux environnements proches.',
    astroInputs: ['planetes', 'retrograde', 'aspects'],
    imbalance: 'Surcharge mentale, incommunicabilité, pensée dispersée ou rigide.',
    potential: 'Pensée claire et adaptable, communication précise, curiosité productive.',
    keyUnderstanding: 'Mercure définit comment la personne pense, pas ce qu\'elle pense.',
    keyAction: 'Adapter le canal de communication au style naturel plutôt que le forcer.',
    mirrorQuestion: 'Ma façon de communiquer reflète-t-elle vraiment ce que je veux dire ?',
  },
  {
    id: 'sphere_4',
    house: 4,
    name: 'Racines',
    ruler: ['Lune'],
    axis: 'Fondations émotionnelles, appartenance, foyer intérieur',
    reveals: 'Structure familiale, héritage psychologique, rapport au foyer, capacité à s\'ancrer.',
    astroInputs: ['signe_lunaire', 'maisons', 'aspects'],
    imbalance: 'Insécurité émotionnelle, dépendance aux origines, incapacité à créer son propre foyer intérieur.',
    potential: 'Ancrage solide, transmission consciente, capacité à nourrir sans s\'effacer.',
    keyUnderstanding: 'La Lune dit d\'où je viens émotionnellement. La Maison IV dit où je me sens chez moi.',
    keyAction: 'Séparer l\'héritage subi de l\'héritage choisi.',
    mirrorQuestion: 'Qu\'est-ce que j\'appelle "chez moi" — et est-ce que j\'y suis vraiment ?',
  },
  {
    id: 'sphere_5',
    house: 5,
    name: 'Expression',
    ruler: ['Soleil', 'Vénus'],
    axis: 'Créativité, joie, amour romantique, projections créatives',
    reveals: 'Rapport au plaisir, à la créativité, à l\'enfant intérieur, aux relations amoureuses informelles.',
    astroInputs: ['signe_solaire', 'planetes', 'aspects'],
    imbalance: 'Blocage créatif, dépendance à la validation, amour conditionnel à la performance.',
    potential: 'Créativité fluide, joie de vivre incarnée, amour donné librement.',
    keyUnderstanding: 'La Maison V est ce que je crée pour la joie de créer, pas pour produire.',
    keyAction: 'Revenir à ce qui procure du plaisir sans justification.',
    mirrorQuestion: 'Quand est-ce que je crée ou j\'aime sans calculer le retour ?',
  },
  {
    id: 'sphere_6',
    house: 6,
    name: 'Équilibre',
    ruler: ['Mercure', 'Saturne'],
    axis: 'Santé, rythme quotidien, travail opérationnel, service',
    reveals: 'Habitudes, gestion de l\'énergie physique, rapport au corps, aux routines, au service rendu.',
    astroInputs: ['maisons', 'planetes', 'aspects'],
    imbalance: 'Perfectionnisme paralysant, négligence du corps, surcharge de service ou refus de servir.',
    potential: 'Efficacité naturelle, corps comme outil conscient, service aligné avec la vocation.',
    keyUnderstanding: 'La Maison VI n\'est pas la carrière — c\'est comment je fonctionne au quotidien.',
    keyAction: 'Ajuster les routines pour soutenir l\'énergie globale plutôt que la drainer.',
    mirrorQuestion: 'Mes habitudes quotidiennes me rapprochent-elles de qui je veux être ?',
  },
  {
    id: 'sphere_7',
    house: 7,
    name: 'Relations',
    ruler: ['Vénus', 'Mars'],
    axis: 'Partenariats durables, projections sur l\'Autre, contrats',
    reveals: 'Modèle de couple, attentes relationnelles, ce qu\'on cherche et fuit chez l\'autre, partenariats pro.',
    astroInputs: ['compatibilite_astro', 'maisons', 'aspects', 'planetes'],
    imbalance: 'Fusion, dépendance, relation miroir non consciente, peur de l\'engagement.',
    potential: 'Partenariat comme espace de croissance, complémentarité consciente, contrats équilibrés.',
    keyUnderstanding: 'La Maison VII révèle ce qu\'on projette sur l\'autre autant que ce qu\'on cherche.',
    keyAction: 'Identifier la part de soi que l\'autre incarne, intégrer plutôt que chercher.',
    mirrorQuestion: 'Qu\'est-ce que j\'attends de l\'autre, que je pourrais faire moi-même ?',
  },
  {
    id: 'sphere_8',
    house: 8,
    name: 'Transformation',
    ruler: ['Pluton', 'Mars'],
    axis: 'Crises, mort symbolique, renaissance, héritages, intimité profonde',
    reveals: 'Rapport au changement radical, à la perte, aux ressources partagées, à l\'intimité réelle.',
    astroInputs: ['planetes', 'maisons', 'aspects'],
    imbalance: 'Contrôle, manipulation, peur de la perte, résistance au changement.',
    potential: 'Alchimie personnelle, capacité à renaître, puissance née des épreuves.',
    keyUnderstanding: 'La Maison VIII est la capacité à mourir à une version de soi pour en devenir une autre.',
    keyAction: 'Identifier ce qui doit mourir pour que quelque chose de plus vrai émerge.',
    mirrorQuestion: 'Qu\'est-ce que je garde en vie par peur, alors que c\'est terminé ?',
  },
  {
    id: 'sphere_9',
    house: 9,
    name: 'Vision',
    ruler: ['Jupiter'],
    axis: 'Quête de sens, philosophie, expansion, enseignement',
    reveals: 'Systèmes de croyances, rapport à l\'étranger, capacité à enseigner, vision du monde.',
    astroInputs: ['planetes', 'maisons', 'aspects'],
    imbalance: 'Dogmatisme, dispersion idéologique, fuite dans l\'idéal, incapacité à atterrir.',
    potential: 'Vision articulée, foi productive, capacité à transmettre une perspective élargie.',
    keyUnderstanding: 'La Maison IX dit ce que je crois être vrai sur le monde et sur la vie.',
    keyAction: 'Articuler sa vision du monde de façon transmissible.',
    mirrorQuestion: 'Quelle est ma philosophie réelle — celle qui guide mes choix, pas celle que je revendique ?',
  },
  {
    id: 'sphere_10',
    house: 10,
    name: 'Vocation',
    ruler: ['Saturne', 'MC'],
    axis: 'Mission publique, réputation, trajectoire professionnelle, impact visible',
    reveals: 'Rapport à l\'autorité, à la réussite, à la contribution au monde, à l\'héritage construit.',
    astroInputs: ['vocation_astro', 'maisons', 'planetes', 'aspects'],
    imbalance: 'Ambition déconnectée du sens, besoin de reconnaissance, peur de la visibilité.',
    potential: 'Contribution alignée, autorité naturelle, construction d\'un héritage réel.',
    keyUnderstanding: 'Le MC n\'est pas le métier — c\'est la qualité que le monde reconnaît en toi.',
    keyAction: 'Construire vers ce qui laisse une trace, pas ce qui impressionne à court terme.',
    mirrorQuestion: 'Quelle est la contribution pour laquelle je veux être reconnu dans 20 ans ?',
  },
  {
    id: 'sphere_11',
    house: 11,
    name: 'Collectif',
    ruler: ['Uranus'],
    axis: 'Appartenance, idéaux partagés, innovation, réseaux, projets collectifs',
    reveals: 'Rapport aux causes, aux amis, aux communautés, aux utopies personnelles, à la disruption.',
    astroInputs: ['planetes', 'maisons', 'aspects'],
    imbalance: 'Individualisme excessif, conformisme, idéalisme sans ancrage, dispersion.',
    potential: 'Impact collectif réel, réseaux fertiles, innovation utile.',
    keyUnderstanding: 'La Maison XI dit avec qui et pour quoi je veux avancer, pas juste qui sont mes amis.',
    keyAction: 'Choisir ses appartenances consciemment, pas par défaut.',
    mirrorQuestion: 'Les gens que je fréquente tirent-ils ma vision vers le haut ou vers la moyenne ?',
  },
  {
    id: 'sphere_12',
    house: 12,
    name: 'Intégration',
    ruler: ['Neptune', 'Nœud Sud'],
    axis: 'Inconscient, karma, retraite intérieure, dissolution du moi',
    reveals: 'Peurs enfouies, schémas répétitifs invisibles, ressources cachées, rapport au transcendant.',
    astroInputs: ['maisons', 'planetes', 'aspects'],
    imbalance: 'Auto-sabotage, victimisation, fuite dans l\'addiction ou l\'idéal, peurs non nommées.',
    potential: 'Intuition profonde, guérison des schémas répétitifs, connexion au sens plus large.',
    keyUnderstanding: 'La Maison XII est ce qui agit en toi avant que tu aies conscience d\'agir.',
    keyAction: 'Rendre conscient un schéma qui tourne en boucle pour en sortir.',
    mirrorQuestion: 'Quel pattern est-ce que je retrouve dans tous les contextes de ma vie ?',
  },
] as const

// ── Types de lecture ────────────────────────────────────────────────────────────

export const ASTRO_READING_TYPES: readonly AstroReadingTypeDefinition[] = [
  {
    id: 'general',
    name: 'Lecture générale',
    objective: 'Vue d\'ensemble natale, potentiels et dynamiques dominantes.',
    prioritySpheres: [1, 4, 7, 10],
    priorityData: ['signe_solaire', 'signe_lunaire', 'ascendant', 'theme_natal'],
    answers: 'Qui suis-je ? Quelles sont mes forces et défis fondamentaux ?',
    depth: 'standard',
    render: 'synthesis',
  },
  {
    id: 'identitaire',
    name: 'Lecture identitaire',
    objective: 'Clarifier l\'identité profonde, la présence, les ressources personnelles.',
    prioritySpheres: [1, 2, 5, 9],
    priorityData: ['signe_solaire', 'ascendant', 'planetes'],
    answers: 'Qui je suis vraiment ? Comment m\'affirmer sans me trahir ?',
    depth: 'approfondie',
    render: 'structured',
  },
  {
    id: 'relationnelle',
    name: 'Lecture relationnelle',
    objective: 'Dynamiques relationnelles, modèle de couple, projections, compatibilité.',
    prioritySpheres: [7, 5, 4, 8],
    priorityData: ['compatibilite_astro', 'planetes', 'aspects', 'maisons'],
    answers: 'Comment j\'aime ? Quels patterns relationnels me définissent ?',
    depth: 'standard',
    render: 'structured',
  },
  {
    id: 'vocationnelle',
    name: 'Lecture vocationnelle',
    objective: 'Identifier la mission, le chemin de carrière aligné, les ressources professionnelles.',
    prioritySpheres: [10, 6, 2, 9],
    priorityData: ['vocation_astro', 'planetes', 'maisons', 'aspects'],
    answers: 'Quelle est ma mission ? Vers quoi construire ? Comment utiliser mes talents ?',
    depth: 'approfondie',
    render: 'structured',
  },
  {
    id: 'karmique',
    name: 'Lecture karmique / transformatrice',
    objective: 'Patterns répétitifs, blessures fondatrices, axes de croissance profonde.',
    prioritySpheres: [8, 12, 4, 1],
    priorityData: ['planetes', 'maisons', 'aspects'],
    answers: 'D\'où viennent mes blocages ? Quels schémas tournent en boucle ?',
    depth: 'deep',
    render: 'narrative',
  },
  {
    id: 'creative',
    name: 'Lecture créative',
    objective: 'Potentiel créatif, expression authentique, rapport au plaisir et à la joie.',
    prioritySpheres: [5, 3, 9, 11],
    priorityData: ['signe_solaire', 'planetes', 'aspects', 'maisons'],
    answers: 'Comment je crée ? Qu\'est-ce qui me donne de la joie ? Quel est mon style ?',
    depth: 'standard',
    render: 'narrative',
  },
  {
    id: 'cyclique',
    name: 'Lecture cyclique',
    objective: 'Évaluer la période actuelle, opportunités et tensions du moment.',
    prioritySpheres: [1, 4, 7, 10], // variable selon sphères transitées
    priorityData: ['transits', 'cycle', 'retrograde'],
    answers: 'Où en suis-je dans mon cycle ? Que fait le ciel sur mon thème maintenant ?',
    depth: 'standard',
    render: 'synthesis',
  },
] as const

// ── Mapping planètes → sphères ──────────────────────────────────────────────────

export const PLANET_SPHERE_MAPPING: readonly PlanetSphereMapping[] = [
  { planet: 'Soleil',    primarySphere: 'sphere_1',  secondarySpheres: ['sphere_5', 'sphere_10'] },
  { planet: 'Lune',      primarySphere: 'sphere_4',  secondarySpheres: ['sphere_6', 'sphere_12'] },
  { planet: 'ASC',       primarySphere: 'sphere_1',  secondarySpheres: ['sphere_7'] },
  { planet: 'Mercure',   primarySphere: 'sphere_3',  secondarySpheres: ['sphere_6'] },
  { planet: 'Vénus',     primarySphere: 'sphere_2',  secondarySpheres: ['sphere_5', 'sphere_7'] },
  { planet: 'Mars',      primarySphere: 'sphere_8',  secondarySpheres: ['sphere_7', 'sphere_5'] },
  { planet: 'Jupiter',   primarySphere: 'sphere_9',  secondarySpheres: ['sphere_2'] },
  { planet: 'Saturne',   primarySphere: 'sphere_10', secondarySpheres: ['sphere_6', 'sphere_12'] },
  { planet: 'Uranus',    primarySphere: 'sphere_11', secondarySpheres: ['sphere_3'] },
  { planet: 'Neptune',   primarySphere: 'sphere_12', secondarySpheres: ['sphere_9'] },
  { planet: 'Pluton',    primarySphere: 'sphere_8',  secondarySpheres: ['sphere_1'] },
  { planet: 'Chiron',    primarySphere: 'sphere_12', secondarySpheres: [] },
  { planet: 'Nœud Nord', primarySphere: 'sphere_10', secondarySpheres: [] },
  { planet: 'Nœud Sud',  primarySphere: 'sphere_12', secondarySpheres: [] },
  { planet: 'MC',        primarySphere: 'sphere_10', secondarySpheres: ['sphere_4'] },
] as const

// ── Framework assemblé ──────────────────────────────────────────────────────────

export const HEXASTRA_ASTRO_FRAMEWORK: ScienceFramework = {
  scienceKey: 'astrologie',
  version: '1.0',
  spheres: ASTRO_SPHERES,
  readingTypes: ASTRO_READING_TYPES,
  planetMapping: PLANET_SPHERE_MAPPING,
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

/** Retourne la définition d'une sphère par numéro de maison */
export function getSphereByHouse(house: HouseNumber): SphereDefinition | undefined {
  return ASTRO_SPHERES.find((s) => s.house === house)
}

/** Retourne la définition d'une sphère par id */
export function getSphereById(id: SphereId): SphereDefinition | undefined {
  return ASTRO_SPHERES.find((s) => s.id === id)
}

/** Retourne les sphères prioritaires pour un type de lecture */
export function getPrioritySpheres(readingType: AstroReadingType): SphereDefinition[] {
  const def = ASTRO_READING_TYPES.find((r) => r.id === readingType)
  if (!def) return []
  return def.prioritySpheres
    .map((h) => getSphereByHouse(h))
    .filter((s): s is SphereDefinition => s !== undefined)
}

/** Retourne la sphère principale d'une planète */
export function getPrimarySpherForPlanet(planet: Planet): SphereDefinition | undefined {
  const mapping = PLANET_SPHERE_MAPPING.find((m) => m.planet === planet)
  if (!mapping) return undefined
  return getSphereById(mapping.primarySphere)
}
