/**
 * HexAstra — Fusion 12 sphères — Schéma TypeScript
 *
 * Orchestre 5 sciences (Astrologie, Numérologie, Human Design, Ennéagramme, Kua)
 * dans une matrice unique à 12 sphères.
 *
 * Source : docs/hexastra/fusion-12-spheres-framework.md
 *
 * Patterns :
 * - FusionSphereDefinition — sphère avec assignments multi-sciences
 * - FusionAvailableData    — données injectables par science
 * - buildFusionDataBlock() — formate les données multi-sciences
 * - buildFusionFullPrompt() — prompt complet orchestré
 * - PRIMARY_SPHERES_BY_READING — pondération publique par type de lecture
 * - detectDominantSpheres() — routing contextuel questions libres
 */

// ── Types identifiants ──────────────────────────────────────────────────────

export type SphereId =
  | 'sphere_1'  | 'sphere_2'  | 'sphere_3'  | 'sphere_4'
  | 'sphere_5'  | 'sphere_6'  | 'sphere_7'  | 'sphere_8'
  | 'sphere_9'  | 'sphere_10' | 'sphere_11' | 'sphere_12'

export type HouseNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export type ScienceKey = 'astrologie' | 'numerologie' | 'humandesign' | 'enneagramme' | 'kua'

export type ScienceRole = 'leading' | 'supporting' | 'contextual'

export type FusionReadingType =
  | 'general'
  | 'identitaire'
  | 'relationnelle'
  | 'vocationnelle'
  | 'decisionnelle'
  | 'energetique'
  | 'transformatrice'
  | 'cyclique'
  | 'contextuelle'

export type ReadingDepth = 'standard' | 'approfondie' | 'deep'
export type ReadingRender = 'synthesis' | 'structured' | 'narrative'

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface ScienceAssignment {
  readonly science: ScienceKey
  readonly role: ScienceRole
  /** Clés de données prioritaires depuis cette science pour cette sphère */
  readonly priorityData: readonly string[]
  /** Note d'arbitrage — quand cette science entre ou non */
  readonly note?: string
}

export interface FusionSphereDefinition {
  readonly id: SphereId
  readonly house: HouseNumber
  readonly name: string
  /** Fonction principale de la sphère */
  readonly function: string
  readonly reveals: string
  readonly scienceAssignments: readonly ScienceAssignment[]
  readonly imbalance: string
  readonly potential: string
  readonly keyUnderstanding: string
  readonly keyAction: string
  readonly mirrorQuestion?: string
  /** Règle anti-doublon spécifique à cette sphère */
  readonly antiDuplication?: string
}

export interface FusionReadingTypeDefinition {
  readonly id: FusionReadingType
  readonly name: string
  readonly objective: string
  readonly prioritySpheres: readonly HouseNumber[]
  readonly primarySciences: readonly ScienceKey[]
  readonly depth: ReadingDepth
  readonly render: ReadingRender
  /** Types de questions auxquelles ce type de lecture répond */
  readonly questionTypes: string
}

export interface FusionScienceFramework {
  readonly version: string
  readonly spheres: readonly FusionSphereDefinition[]
  readonly readingTypes: readonly FusionReadingTypeDefinition[]
}

// ── Les 12 sphères Fusion ───────────────────────────────────────────────────

export const FUSION_SPHERES: readonly FusionSphereDefinition[] = [
  {
    id: 'sphere_1',
    house: 1,
    name: 'Identité',
    function: 'Ancrer qui on est structurellement',
    reveals: 'Nature fondamentale multi-couches — caractère, vibration, fréquence, persona sociale.',
    scienceAssignments: [
      {
        science: 'enneagramme',
        role: 'leading',
        priorityData: ['type_enneagramme', 'centre_intelligence', 'aile', 'peur_fondamentale'],
        note: 'Révèle la structure caractérielle — filtre de réalité et mécanisme central.',
      },
      {
        science: 'astrologie',
        role: 'leading',
        priorityData: ['soleil', 'ascendant'],
        note: 'Révèle l\'identité symbolique et la persona — couche différente de l\'Ennéagramme.',
      },
      {
        science: 'humandesign',
        role: 'supporting',
        priorityData: ['type_hd', 'profil'],
        note: 'Ajoute la stratégie et le rôle énergétique — sans redécrir le caractère.',
      },
      {
        science: 'numerologie',
        role: 'supporting',
        priorityData: ['chemin_de_vie'],
        note: 'Mention secondaire — CV analysé en profondeur en sphère 10.',
      },
      {
        science: 'kua',
        role: 'contextual',
        priorityData: ['nombre_kua', 'groupe_kua'],
        note: 'Mention de fréquence énergétique uniquement. Pas d\'analyse identitaire complète.',
      },
    ],
    imbalance: 'Confusion identitaire, masque social, identification au rôle plutôt qu\'à l\'essence.',
    potential: 'Cohérence entre essence profonde et expression quotidienne — liberté d\'être.',
    keyUnderstanding: 'Chaque science révèle une couche différente de l\'identité — aucune n\'est la vérité complète.',
    keyAction: 'Nommer ses motivations réelles au-delà des rôles et identifier la couche identitaire la plus active.',
    mirrorQuestion: 'En quoi mon identité vécue diffère-t-elle de mon essence profonde ?',
    antiDuplication: 'Soleil Astrologie = symbolique / Type Ennéagramme = caractère / CV Numérologie = sphère 10 uniquement.',
  },
  {
    id: 'sphere_2',
    house: 2,
    name: 'Ressources',
    function: 'Identifier ce qu\'on mobilise nativement',
    reveals: 'Énergie disponible, capacités natives, accès matériel et flux d\'abondance.',
    scienceAssignments: [
      {
        science: 'humandesign',
        role: 'leading',
        priorityData: ['centres_definis', 'definition_hd'],
        note: 'Les centres définis = ressources énergétiques fiables et constantes.',
      },
      {
        science: 'numerologie',
        role: 'leading',
        priorityData: ['expression', 'ame'],
        note: 'Le Nombre Expression = talents mobilisables. Âme = moteur interne.',
      },
      {
        science: 'kua',
        role: 'supporting',
        priorityData: ['direction_sheng_chi', 'orientation_bureau'],
        note: 'Sheng Chi = direction d\'abondance matérielle. Angle spatial uniquement.',
      },
      {
        science: 'astrologie',
        role: 'supporting',
        priorityData: ['maison2', 'venus'],
        note: 'Maison 2 = rapport aux ressources matérielles. Secondaire vs HD.',
      },
      {
        science: 'enneagramme',
        role: 'contextual',
        priorityData: ['desir_fondamental', 'sous_type_conservation'],
        note: 'Désir fondamental sain = orientation des ressources. Pas d\'analyse psychologique ici.',
      },
    ],
    imbalance: 'Gestion d\'énergie chaotique, sous-utilisation des capacités natives, rapport difficile au matériel.',
    potential: 'Activation de l\'énergie juste et durable — travailler avec ce qu\'on est, pas contre.',
    keyUnderstanding: 'Les ressources fiables sont celles inscrites dans la structure — pas celles conditionnées.',
    keyAction: 'Distinguer ce qu\'on mobilise naturellement de ce qu\'on force, et réallouer l\'énergie.',
    mirrorQuestion: 'Qu\'est-ce que je mobilise nativement versus ce que je compense ?',
  },
  {
    id: 'sphere_3',
    house: 3,
    name: 'Intelligence',
    function: 'Cartographier comment on traite l\'information',
    reveals: 'Mode cognitif dominant, biais mentaux, style de communication et filtre perceptif.',
    scienceAssignments: [
      {
        science: 'enneagramme',
        role: 'leading',
        priorityData: ['fixation_mentale', 'centre_intelligence', 'type_enneagramme'],
        note: 'Fixation mentale = boucle cognitive récurrente. Centre mental = traitement de l\'info.',
      },
      {
        science: 'astrologie',
        role: 'leading',
        priorityData: ['mercure', 'aspects_mercure'],
        note: 'Mercure = style de communication, mode d\'apprentissage, traitement cognitif.',
      },
      {
        science: 'humandesign',
        role: 'supporting',
        priorityData: ['variable_cognition', 'centre_ajna', 'centre_gorge'],
        note: 'Cognition HD (Variable) = style d\'absorption de l\'information. Secondaire.',
      },
      {
        science: 'numerologie',
        role: 'supporting',
        priorityData: ['ame'],
        note: 'Nombre Âme = motivation intérieure et voix interne. Angle complémentaire.',
      },
      {
        science: 'kua',
        role: 'contextual',
        priorityData: ['direction_fu_wei'],
        note: 'Fu Wei = direction de clarté mentale. Uniquement en lectures orientation ou environnement.',
      },
    ],
    imbalance: 'Surmenage mental, distorsion perceptive chronique, communication inadaptée.',
    potential: 'Clarté cognitive, communication alignée, décisions depuis la compréhension réelle.',
    keyUnderstanding: 'La fixation cognitive est un filtre — pas la réalité. La reconnaître est déjà de la liberté.',
    keyAction: 'Identifier sa fixation mentale dominante et observer combien de fois elle tourne dans une journée ordinaire.',
    mirrorQuestion: 'Quelle distorsion récurrente filtre ma perception de la réalité ?',
    antiDuplication: 'Fixation Ennéagramme (sphère 3) ≠ Passion Ennéagramme (sphère 6). Ne jamais intervertir.',
  },
  {
    id: 'sphere_4',
    house: 4,
    name: 'Racines',
    function: 'Exposer les patterns fondateurs',
    reveals: 'Peurs profondes, blessures héritées, base émotionnelle, ancrage élémentaire.',
    scienceAssignments: [
      {
        science: 'enneagramme',
        role: 'leading',
        priorityData: ['peur_fondamentale', 'blessure_centrale', 'mecanisme_defense'],
        note: 'Peur fondamentale = fondation de toute la structure défensive. Angle psychologique.',
      },
      {
        science: 'astrologie',
        role: 'leading',
        priorityData: ['lune', 'maison4', 'saturne'],
        note: 'Lune = mémoire émotionnelle. Maison 4 = racines familiales et sécurité intérieure.',
      },
      {
        science: 'numerologie',
        role: 'supporting',
        priorityData: ['dettes_karmiques', 'lecons_karmiques'],
        note: 'Dettes et leçons karmiques = patterns récurrents non résolus. Angle complémentaire.',
      },
      {
        science: 'kua',
        role: 'supporting',
        priorityData: ['trigramme', 'element_kua'],
        note: 'Trigramme + Élément = archétype énergétique profond. Couche élémentaire distincte.',
      },
      {
        science: 'humandesign',
        role: 'contextual',
        priorityData: ['autorite_interieure'],
        note: 'Autorité intérieure = comment s\'ancrer dans la décision. Mention secondaire.',
      },
    ],
    imbalance: 'Réactivité non consciente, conditionnements actifs, pattern émotionnel hérité dominant.',
    potential: 'Stabilité émotionnelle, ancrage solide, relation consciente aux peurs fondatrices.',
    keyUnderstanding: 'La blessure fondatrice oriente encore les réactions adultes — la reconnaître la désamorce.',
    keyAction: 'Formuler sa peur fondamentale en une phrase et identifier une décision récente prise pour l\'éviter.',
    mirrorQuestion: 'De quoi ai-je encore peur que la partie adulte en moi a en réalité dépassé ?',
    antiDuplication: 'Peur Ennéagramme (sphère 4) ≠ Passion Ennéagramme (sphère 6). Mécanisme de défense = profondeur deep only.',
  },
  {
    id: 'sphere_5',
    house: 5,
    name: 'Expression créative',
    function: 'Révéler comment on crée et rayonne',
    reveals: 'Canal d\'expression naturel, talent expressif, vitalité créatrice, plaisir d\'être.',
    scienceAssignments: [
      {
        science: 'astrologie',
        role: 'leading',
        priorityData: ['maison5', 'venus', 'soleil_maison5'],
        note: 'Maison 5 = créativité, enfant intérieur, expression de soi. Vénus = esthétique.',
      },
      {
        science: 'enneagramme',
        role: 'leading',
        priorityData: ['vertu', 'desir_fondamental'],
        note: 'La Vertu = ce qui émerge quand la passion se transforme. Expression depuis le centre.',
      },
      {
        science: 'kua',
        role: 'supporting',
        priorityData: ['element_kua_nourricier'],
        note: 'Élément nourricier = source d\'inspiration élémentaire. Angle spatial/environnemental.',
      },
      {
        science: 'humandesign',
        role: 'supporting',
        priorityData: ['canaux', 'centre_sacral', 'centre_gorge'],
        note: 'Canaux HD = expression définie. Sacral = force créatrice. Secondaire vs Astrologie.',
      },
      {
        science: 'numerologie',
        role: 'contextual',
        priorityData: ['personnalite'],
        note: 'Nombre Personnalité = expression sociale. Mention contextuelle uniquement.',
      },
    ],
    imbalance: 'Blocage créatif, expression forcée ou performée, vitalité creative bridée.',
    potential: 'Fluidité créative, joie d\'exprimer sans condition de résultat, rayonnement naturel.',
    keyUnderstanding: 'L\'expression authentique vient du centre, pas de la peur de mal faire.',
    keyAction: 'Identifier un espace ou format d\'expression qui appartient uniquement à soi — sans public.',
    mirrorQuestion: 'Quand est-ce que je crée pour moi seul(e), sans finalité externe ?',
  },
  {
    id: 'sphere_6',
    house: 6,
    name: 'Équilibre',
    function: 'Mesurer l\'état d\'équilibre fonctionnel',
    reveals: 'Santé, rythmes quotidiens, tensions internes récurrentes, cycle actif.',
    scienceAssignments: [
      {
        science: 'kua',
        role: 'leading',
        priorityData: ['direction_ho_hai', 'etoile_annuelle'],
        note: 'Ho Hai = friction légère gérable. Étoile annuelle = couleur énergétique du cycle.',
      },
      {
        science: 'enneagramme',
        role: 'leading',
        priorityData: ['passion_dominante', 'niveaux_sante'],
        note: 'Passion = pattern émotionnel récurrent. Niveau de santé = état actuel du système.',
      },
      {
        science: 'numerologie',
        role: 'supporting',
        priorityData: ['defis', 'annee_personnelle'],
        note: 'Défis numériques = tensions structurelles. AP = timing de l\'année en cours.',
      },
      {
        science: 'astrologie',
        role: 'supporting',
        priorityData: ['maison6', 'aspects_tendus', 'transits_defavorables'],
        note: 'Maison 6 = santé, routine, service. Transits = friction temporelle.',
      },
      {
        science: 'humandesign',
        role: 'contextual',
        priorityData: ['centres_ouverts'],
        note: 'Centres ouverts = sources de conditionnement. Outil de détection uniquement.',
      },
    ],
    imbalance: 'Épuisement chronique, boucles d\'insatisfaction, friction permanente non résolue.',
    potential: 'Santé durable, rythme soutenable, obstacles transformés en information utile.',
    keyUnderstanding: 'L\'équilibre n\'est pas l\'absence de tension — c\'est la capacité à gérer la friction avant qu\'elle devienne chronique.',
    keyAction: 'Identifier sa passion dominante et noter 3 situations cette semaine où elle était active sans y être invitée.',
    mirrorQuestion: 'Où est-ce que je compense au lieu d\'équilibrer ?',
    antiDuplication: 'Passion Ennéagramme (sphère 6) ≠ Fixation mentale (sphère 3). Ho Hai Kua ≠ directions défavorables majeures (sphère 8).',
  },
  {
    id: 'sphere_7',
    house: 7,
    name: 'Relations',
    function: 'Décoder les dynamiques relationnelles',
    reveals: 'Mode d\'attachement, besoins relationnels, patterns de couple, compatibilité naturelle.',
    scienceAssignments: [
      {
        science: 'astrologie',
        role: 'leading',
        priorityData: ['venus', 'maison7', 'lune_aspects'],
        note: 'Vénus = attraction et valeurs relationnelles. Maison 7 = partenariat.',
      },
      {
        science: 'enneagramme',
        role: 'leading',
        priorityData: ['style_relationnel', 'sous_type_sx', 'peur_fondamentale'],
        note: 'Style relationnel + sous-type SX = patterns d\'intimité. Peur = déclencheur relationnel.',
      },
      {
        science: 'kua',
        role: 'supporting',
        priorityData: ['direction_nien_yen', 'groupe_kua'],
        note: 'Nien Yen = direction de longévité relationnelle. Groupe = compatibilité Est/Ouest.',
      },
      {
        science: 'humandesign',
        role: 'supporting',
        priorityData: ['strategie', 'autorite_interieure', 'profil'],
        note: 'Stratégie HD = comment s\'engager correctement. Profil = rôle dans la relation.',
      },
      {
        science: 'numerologie',
        role: 'contextual',
        priorityData: ['compatibilite_vibratoire', 'chemin_de_vie'],
        note: 'Compatibilité vibratoire CV vs CV. Mention contextuelle uniquement.',
      },
    ],
    imbalance: 'Dépendance affective, évitement, conflits répétés non résolus, projection non consciente.',
    potential: 'Relationnel conscient, réciprocité nourrie, durabilité des liens choisis.',
    keyUnderstanding: 'Les relations reflètent les croyances sur soi — pas la réalité de l\'autre.',
    keyAction: 'Identifier un pattern relationnel récurrent et le relier à sa peur ou à sa passion active.',
    mirrorQuestion: 'Qu\'est-ce que je cherche réellement dans l\'autre — protection, validation, ou vraie rencontre ?',
  },
  {
    id: 'sphere_8',
    house: 8,
    name: 'Transformation',
    function: 'Cartographier les zones de mutation',
    reveals: 'Mécanismes de défense, zones d\'ombre, résistances actives, ressources cachées.',
    scienceAssignments: [
      {
        science: 'enneagramme',
        role: 'leading',
        priorityData: ['mecanisme_defense', 'fleche_desintegration', 'blessure_centrale'],
        note: 'Mécanisme de défense = zone d\'ombre principale. Flèche désintégration = comportement sous stress.',
      },
      {
        science: 'astrologie',
        role: 'leading',
        priorityData: ['pluton', 'maison8', 'aspects_pluton'],
        note: 'Pluton = puissance transformatrice. Maison 8 = mort symbolique, héritage, tabous.',
      },
      {
        science: 'humandesign',
        role: 'supporting',
        priorityData: ['non_soi', 'conditioning_centres'],
        note: 'Non-Soi HD = comportement conditionné sous pression. Angle de détection.',
      },
      {
        science: 'kua',
        role: 'supporting',
        priorityData: ['direction_jue_ming', 'direction_liu_sha', 'direction_wu_gui'],
        note: 'Directions défavorables = zones à neutraliser. Lecture environnement uniquement.',
      },
      {
        science: 'numerologie',
        role: 'contextual',
        priorityData: ['lecons_karmiques', 'dettes_karmiques'],
        note: 'Leçons karmiques = zones de croissance récurrentes. Mention contextuelle.',
      },
    ],
    imbalance: 'Résistance au changement, sabotage inconscient, mécanisme de défense activé en boucle.',
    potential: 'Puissance transformatrice consciente — la zone d\'ombre devient ressource.',
    keyUnderstanding: 'Le mécanisme de défense protège une douleur réelle — il s\'intègre par la conscience, pas par la volonté.',
    keyAction: 'Nommer son mécanisme de défense et identifier une situation récente où il s\'est activé sans y être invité.',
    mirrorQuestion: 'Où est-ce que je sabote pour ne pas avoir à transformer ?',
    antiDuplication: 'Mécanisme (sphère 8) ≠ Passion (sphère 6). Flèche désintégration (sphère 8) ≠ Flèche intégration (sphère 9).',
  },
  {
    id: 'sphere_9',
    house: 9,
    name: 'Vision',
    function: 'Orienter vers un sens et une direction',
    reveals: 'Croyances directrices, aspiration profonde, boussole de vie, récupération et santé.',
    scienceAssignments: [
      {
        science: 'astrologie',
        role: 'leading',
        priorityData: ['jupiter', 'maison9', 'aspects_jupiter'],
        note: 'Jupiter = expansion, philosophie, sens. Maison 9 = croyances, vision lointaine.',
      },
      {
        science: 'humandesign',
        role: 'leading',
        priorityData: ['croix_incarnation', 'profil'],
        note: 'Croix d\'Incarnation = thème de vie incarné. Profil = rôle évolutif.',
      },
      {
        science: 'kua',
        role: 'supporting',
        priorityData: ['direction_tien_yi', 'orientation_lit'],
        note: 'Tien Yi = direction de santé et récupération. Angle environnemental.',
      },
      {
        science: 'enneagramme',
        role: 'supporting',
        priorityData: ['fleche_integration', 'idee_sacree', 'vertu'],
        note: 'Flèche d\'intégration = direction naturelle de croissance. Idée sacrée = aspiration haute.',
      },
      {
        science: 'numerologie',
        role: 'contextual',
        priorityData: ['chemin_de_vie'],
        note: 'CV comme boussole directrice de fond. Analyse complète en sphère 10.',
      },
    ],
    imbalance: 'Nihilisme, perte de sens, dispersion vers des directions contradictoires.',
    potential: 'Sens clair, direction alignée, récupération nocturne et santé soutenues.',
    keyUnderstanding: 'La vision n\'est pas un objectif SMART — c\'est une boussole qui oriente sans rigidifier.',
    keyAction: 'Articuler sa direction de vie en une phrase et vérifier si les décisions actuelles y convergent.',
    mirrorQuestion: 'Quelle vision est-ce que j\'aurai regrettée de ne pas avoir suivie ?',
    antiDuplication: 'Flèche intégration Ennéagramme (sphère 9) ≠ Flèche désintégration (sphère 8). CV Numérologie en profondeur = sphère 10.',
  },
  {
    id: 'sphere_10',
    house: 10,
    name: 'Vocation',
    function: 'Définir la contribution dans le monde',
    reveals: 'Mission de vie, positionnement professionnel, autorité sociale, trajectoire.',
    scienceAssignments: [
      {
        science: 'numerologie',
        role: 'leading',
        priorityData: ['chemin_de_vie', 'expression', 'pinnacle_actif'],
        note: 'CV = direction de vie. Expression = capacités à contribution. Pinnacle = phase actuelle.',
      },
      {
        science: 'humandesign',
        role: 'leading',
        priorityData: ['type_hd', 'profil', 'strategie', 'croix_incarnation'],
        note: 'Type + Stratégie = comment contribuer. Profil = rôle reconnaissable dans le monde.',
      },
      {
        science: 'astrologie',
        role: 'supporting',
        priorityData: ['saturne', 'maison10', 'aspects_saturne'],
        note: 'Saturne = discipline et autorité acquise. Maison 10 = statut et mission publique.',
      },
      {
        science: 'kua',
        role: 'supporting',
        priorityData: ['direction_sheng_chi', 'groupe_kua'],
        note: 'Sheng Chi = angle d\'abondance matérielle de la vocation. Groupe = compatibilité professionnelle.',
      },
      {
        science: 'enneagramme',
        role: 'contextual',
        priorityData: ['desir_fondamental'],
        note: 'Désir fondamental sain = moteur vocationnel. Pas d\'analyse de type ici (sphère 1).',
      },
    ],
    imbalance: 'Vocation ignorée, positionnement professionnel faux, effort chronique sans résultat.',
    potential: 'Contribution maximale, reconnaissable, alignée avec la nature profonde.',
    keyUnderstanding: 'La vocation n\'est pas un secteur d\'activité — c\'est une qualité de présence apportée au monde.',
    keyAction: 'Identifier comment le CV numérologique et le Type HD se croisent dans la trajectoire actuelle.',
    mirrorQuestion: 'Comment est-ce que le monde bénéficie spécifiquement de ce que je fais ?',
    antiDuplication: 'Sheng Chi Kua en sphère 10 = angle matériel de la vocation. Pas redécrit comme direction vocationnelle profonde (→ Numérologie CV).',
  },
  {
    id: 'sphere_11',
    house: 11,
    name: 'Collectif',
    function: 'Situer dans un réseau et une époque',
    reveals: 'Rôle social, appartenance consciente, contribution collective, timing groupal.',
    scienceAssignments: [
      {
        science: 'humandesign',
        role: 'leading',
        priorityData: ['circuit_dominant', 'sous_type_so', 'centres_definis'],
        note: 'Circuit dominant = mode de contribution collective. SO HD = rôle dans les systèmes.',
      },
      {
        science: 'astrologie',
        role: 'leading',
        priorityData: ['maison11', 'uranus', 'aspects_uranus'],
        note: 'Maison 11 = réseau, groupes, idéaux collectifs. Uranus = originalité systémique.',
      },
      {
        science: 'enneagramme',
        role: 'supporting',
        priorityData: ['sous_type_so', 'style_relationnel'],
        note: 'Sous-type Social = mode de participation aux groupes. Distinct du SX (sphère 7).',
      },
      {
        science: 'kua',
        role: 'supporting',
        priorityData: ['groupe_kua', 'cycle_ki'],
        note: 'Groupe Est/Ouest = compatibilité collective. Cycle Ki = timing collectif.',
      },
      {
        science: 'numerologie',
        role: 'contextual',
        priorityData: ['annee_personnelle'],
        note: 'AP = timing annuel de contribution. Mention contextuelle.',
      },
    ],
    imbalance: 'Isolement, tribalism, contribution mal positionnée dans le temps.',
    potential: 'Impact collectif conscient, réseau choisi, contribution au bon groupe au bon moment.',
    keyUnderstanding: 'Appartenir ne signifie pas se dissoudre — la contribution juste vient de la présence distincte.',
    keyAction: 'Identifier le circuit HD dominant et observer si la contribution actuelle en est une expression.',
    mirrorQuestion: 'Qu\'est-ce que j\'apporte versus ce que je consomme dans les collectifs que je fréquente ?',
    antiDuplication: 'Sous-type SO Ennéagramme (sphère 11) ≠ Sous-type SX (sphère 7) ≠ Sous-type SP (sphère 2).',
  },
  {
    id: 'sphere_12',
    house: 12,
    name: 'Intégration',
    function: 'Synthétiser cycles et contexte global',
    reveals: 'Cycles actifs, timing de vie, intégration longitudinale, maison comme amplificateur.',
    scienceAssignments: [
      {
        science: 'numerologie',
        role: 'leading',
        priorityData: ['pinnacles', 'periodes_de_vie', 'annee_personnelle', 'mois_personnel'],
        note: 'Pinnacles + Périodes = cycles de vie longs. AP/MP = où on en est maintenant.',
      },
      {
        science: 'kua',
        role: 'leading',
        priorityData: ['secteur_maison', 'cycle_ki', 'etoile_annuelle'],
        note: 'Secteur maison = espace global. Cycle Ki = positionnement dans le cycle de 9 ans.',
      },
      {
        science: 'astrologie',
        role: 'supporting',
        priorityData: ['maison12', 'transits_actifs', 'progressions'],
        note: 'Maison 12 = dissolution, retraite, intégration. Transits = timing externe.',
      },
      {
        science: 'enneagramme',
        role: 'supporting',
        priorityData: ['tri_type', 'niveaux_sante'],
        note: 'Tri-type = synthèse caractérielle longitudinale. Niveau santé = état intégratif actuel.',
      },
      {
        science: 'humandesign',
        role: 'contextual',
        priorityData: ['variables', 'transits_hd'],
        note: 'Variables HD = contexte évolutif. Transits HD = porte d\'entrée temporelle.',
      },
    ],
    imbalance: 'Hors timing, résistance aux cycles, maison désalignée — drainage diffus.',
    potential: 'Alignement avec les cycles de vie — agir au bon moment, dans le bon espace.',
    keyUnderstanding: 'L\'intégration n\'est pas la fin du travail — c\'est la capacité à se situer dans le grand cycle.',
    keyAction: 'Identifier le Pinnacle actif, le cycle Ki et l\'étoile annuelle pour contextualiser la phase de vie.',
    mirrorQuestion: 'Qu\'est-ce qui doit se terminer pour que quelque chose puisse vraiment commencer ?',
  },
] as const

// ── Types de lecture Fusion ─────────────────────────────────────────────────

export const FUSION_READING_TYPES: readonly FusionReadingTypeDefinition[] = [
  {
    id: 'general',
    name: 'Lecture Fusion générale',
    objective: 'Vue d\'ensemble de la configuration multi-sciences — identité, racines, relations, vocation.',
    prioritySpheres: [1, 4, 7, 10],
    primarySciences: ['enneagramme', 'astrologie', 'numerologie', 'humandesign'],
    depth: 'standard',
    render: 'synthesis',
    questionTypes: 'Qui suis-je ? Comment est-ce que je fonctionne ? Qu\'est-ce qui me définit ?',
  },
  {
    id: 'identitaire',
    name: 'Lecture identitaire',
    objective: 'Clarifier la structure identitaire en profondeur — caractère, racines, expression, intelligence.',
    prioritySpheres: [1, 4, 3, 5],
    primarySciences: ['enneagramme', 'astrologie'],
    depth: 'approfondie',
    render: 'structured',
    questionTypes: 'Quelle est ma nature profonde ? Pourquoi je réagis ainsi ? Comment je m\'exprime authentiquement ?',
  },
  {
    id: 'relationnelle',
    name: 'Lecture relationnelle',
    objective: 'Décoder les dynamiques relationnelles — patterns, besoins, compatibilité, collectif.',
    prioritySpheres: [7, 1, 4, 11],
    primarySciences: ['astrologie', 'enneagramme', 'humandesign'],
    depth: 'standard',
    render: 'structured',
    questionTypes: 'Pourquoi mes relations fonctionnent-elles ainsi ? Quel est mon pattern d\'attachement ?',
  },
  {
    id: 'vocationnelle',
    name: 'Lecture vocationnelle',
    objective: 'Aligner vocation, mission et ressources — direction, contribution, potentiel.',
    prioritySpheres: [10, 9, 2, 5],
    primarySciences: ['numerologie', 'humandesign', 'astrologie'],
    depth: 'approfondie',
    render: 'structured',
    questionTypes: 'Quelle est ma mission ? Comment contribuer aligné ? Quelle direction professionnelle ?',
  },
  {
    id: 'decisionnelle',
    name: 'Lecture décisionnelle',
    objective: 'Guider une décision importante avec clarté cognitive, ressources et timing.',
    prioritySpheres: [3, 2, 10, 6],
    primarySciences: ['humandesign', 'enneagramme', 'kua', 'numerologie'],
    depth: 'approfondie',
    render: 'structured',
    questionTypes: 'Comment décider ? Quelle est la bonne direction ? Est-ce le bon timing ?',
  },
  {
    id: 'energetique',
    name: 'Lecture énergétique',
    objective: 'Auditer l\'état d\'équilibre fonctionnel — énergie, rythme, santé, conditionnements.',
    prioritySpheres: [2, 6, 4, 8],
    primarySciences: ['humandesign', 'kua', 'enneagramme'],
    depth: 'standard',
    render: 'structured',
    questionTypes: 'Pourquoi suis-je épuisé(e) ? Qu\'est-ce qui me draine ? Comment retrouver l\'énergie ?',
  },
  {
    id: 'transformatrice',
    name: 'Lecture transformatrice',
    objective: 'Cartographier les zones d\'ombre et la trajectoire de croissance profonde.',
    prioritySpheres: [8, 12, 4, 9],
    primarySciences: ['enneagramme', 'astrologie', 'humandesign'],
    depth: 'deep',
    render: 'narrative',
    questionTypes: 'Qu\'est-ce que je dois transformer ? Où est-ce que je me bloque ? Quel est mon prochain niveau ?',
  },
  {
    id: 'cyclique',
    name: 'Lecture cyclique',
    objective: 'Lire le timing et les cycles actifs — étoile, Pinnacle, AP, transits, cycle Ki.',
    prioritySpheres: [6, 11, 12, 10],
    primarySciences: ['numerologie', 'kua', 'astrologie'],
    depth: 'standard',
    render: 'synthesis',
    questionTypes: 'Dans quel cycle suis-je ? Est-ce le bon timing ? Qu\'appelle cette période ?',
  },
  {
    id: 'contextuelle',
    name: 'Lecture contextuelle libre',
    objective: 'Décoder une situation spontanée ou émotionnelle — 1 à 4 sphères selon la nature de la question.',
    prioritySpheres: [1, 4, 6, 8],  // variable — détectées dynamiquement
    primarySciences: ['enneagramme', 'astrologie', 'humandesign'],
    depth: 'standard',
    render: 'synthesis',
    questionTypes: 'Je me sens pas bien / bloqué(e) / épuisé(e) / incompris(e) / en doute — questions libres.',
  },
] as const

// ── Framework assemblé ──────────────────────────────────────────────────────

export const HEXASTRA_FUSION_FRAMEWORK: FusionScienceFramework = {
  version: '1.0',
  spheres: FUSION_SPHERES,
  readingTypes: FUSION_READING_TYPES,
}

// ── Pondération par type de lecture ────────────────────────────────────────

export const PRIMARY_SPHERES_BY_READING: Record<FusionReadingType, HouseNumber[]> = {
  general:        [1, 4, 7, 10],
  identitaire:    [1, 4, 3, 5],
  relationnelle:  [7, 1, 4, 11],
  vocationnelle:  [10, 9, 2, 5],
  decisionnelle:  [3, 2, 10, 6],
  energetique:    [2, 6, 4, 8],
  transformatrice:[8, 12, 4, 9],
  cyclique:       [6, 11, 12, 10],
  contextuelle:   [1, 4, 6, 8],  // sphères par défaut — override via detectDominantSpheres()
}

// ── Labels UI ───────────────────────────────────────────────────────────────

export const FUSION_SPHERE_UI_LABELS: Record<HouseNumber, string> = {
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

export const FUSION_READING_TYPE_LABELS: Record<FusionReadingType, string> = {
  general:        'Lecture Fusion générale',
  identitaire:    'Lecture identitaire',
  relationnelle:  'Lecture relationnelle',
  vocationnelle:  'Lecture vocationnelle',
  decisionnelle:  'Lecture décisionnelle',
  energetique:    'Lecture énergétique',
  transformatrice:'Lecture transformatrice',
  cyclique:       'Lecture cyclique',
  contextuelle:   'Lecture contextuelle libre',
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function getSphereByHouse(house: HouseNumber): FusionSphereDefinition | undefined {
  return FUSION_SPHERES.find((s) => s.house === house)
}

/** Retourne les sciences leads pour une sphère */
export function getLeadingSciencesForSphere(house: HouseNumber): ScienceKey[] {
  const sphere = getSphereByHouse(house)
  if (!sphere) return []
  return sphere.scienceAssignments
    .filter((a) => a.role === 'leading')
    .map((a) => a.science)
}

/** Retourne le rôle d'une science dans une sphère donnée */
export function getScienceRoleInSphere(house: HouseNumber, science: ScienceKey): ScienceRole | 'absent' {
  const sphere = getSphereByHouse(house)
  if (!sphere) return 'absent'
  const assignment = sphere.scienceAssignments.find((a) => a.science === science)
  return assignment?.role ?? 'absent'
}

/** Retourne les sphères prioritaires pour un type de lecture */
export function getPrioritySpheres(readingType: FusionReadingType): FusionSphereDefinition[] {
  return PRIMARY_SPHERES_BY_READING[readingType]
    .map((h) => getSphereByHouse(h))
    .filter((s): s is FusionSphereDefinition => s !== undefined)
}

// ── Détection contextuelle ──────────────────────────────────────────────────

/** Mots-clés → sphères probables pour le routing contextuel */
const CONTEXTUAL_KEYWORDS: Array<{ keywords: string[]; spheres: HouseNumber[]; sciences: ScienceKey[] }> = [
  {
    keywords: ['fatigue', 'épuisé', 'épuisement', 'vide', 'vidé', 'draine', 'draîne'],
    spheres: [2, 6, 4],
    sciences: ['humandesign', 'kua', 'enneagramme'],
  },
  {
    keywords: ['bloqué', 'bloquée', 'tourne en rond', 'avancer', 'stagne', 'stagnation'],
    spheres: [4, 8, 10],
    sciences: ['enneagramme', 'numerologie', 'humandesign'],
  },
  {
    keywords: ['doute', 'incertitude', 'sûr', 'décision', 'choisir', 'hésitation'],
    spheres: [3, 2, 10],
    sciences: ['humandesign', 'enneagramme', 'numerologie'],
  },
  {
    keywords: ['sens', 'direction', 'but', 'vocation', 'mission', 'perdu', 'perdue'],
    spheres: [9, 10, 1],
    sciences: ['numerologie', 'astrologie', 'humandesign'],
  },
  {
    keywords: ['relation', 'couple', 'conflit', 'incompris', 'incomprise', 'solitude', 'seul', 'seule'],
    spheres: [7, 1, 4],
    sciences: ['astrologie', 'enneagramme'],
  },
  {
    keywords: ['anxieux', 'anxieuse', 'peur', 'angoisse', 'inquiet', 'inquiète'],
    spheres: [4, 6, 8],
    sciences: ['enneagramme', 'astrologie'],
  },
  {
    keywords: ['identité', 'qui suis-je', 'qui je suis', 'me comprendre', 'compris'],
    spheres: [1, 3, 4],
    sciences: ['enneagramme', 'astrologie'],
  },
  {
    keywords: ['travail', 'carrière', 'professionnel', 'emploi', 'entreprise', 'positionnement'],
    spheres: [10, 2, 9],
    sciences: ['numerologie', 'humandesign', 'astrologie'],
  },
  {
    keywords: ['cycle', 'timing', 'période', 'phase', 'moment', 'année'],
    spheres: [12, 6, 11],
    sciences: ['numerologie', 'kua', 'astrologie'],
  },
  {
    keywords: ['transformer', 'changer', 'lâcher', 'recommencer', 'rupture'],
    spheres: [8, 12, 4],
    sciences: ['enneagramme', 'astrologie'],
  },
]

/**
 * Détecte les sphères dominantes et les sciences utiles pour une question libre.
 * Retourne un maximum de 3 sphères et 3 sciences.
 */
export function detectDominantSpheres(
  question: string,
): { spheres: HouseNumber[]; sciences: ScienceKey[] } {
  const lower = question.toLowerCase()

  const scores = new Map<HouseNumber, number>()
  const scienceScores = new Map<ScienceKey, number>()

  for (const entry of CONTEXTUAL_KEYWORDS) {
    const matches = entry.keywords.filter((kw) => lower.includes(kw)).length
    if (matches > 0) {
      for (const s of entry.spheres) {
        scores.set(s, (scores.get(s) ?? 0) + matches)
      }
      for (const sc of entry.sciences) {
        scienceScores.set(sc, (scienceScores.get(sc) ?? 0) + matches)
      }
    }
  }

  const topSpheres = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s]) => s)

  const topSciences = [...scienceScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s]) => s)

  // Fallback si aucun match
  if (topSpheres.length === 0) {
    return { spheres: [1, 4, 6], sciences: ['enneagramme', 'astrologie'] }
  }

  return { spheres: topSpheres, sciences: topSciences }
}

// ── Interface données Fusion ────────────────────────────────────────────────

/** Données multi-sciences disponibles pour injection dans un prompt Fusion */
export interface FusionAvailableData {
  firstName: string

  astrologie?: {
    soleil?: string
    ascendant?: string
    lune?: string
    mercure?: string
    venus?: string
    jupiter?: string
    saturne?: string
    pluton?: string
    maison2?: string
    maison4?: string
    maison5?: string
    maison6?: string
    maison7?: string
    maison8?: string
    maison9?: string
    maison10?: string
    maison11?: string
    maison12?: string
    transitsActifs?: string[]
  }

  numerologie?: {
    cheminDeVie?: number
    expression?: number
    ame?: number
    personnalite?: number
    dettesKarmiques?: number[] | 'aucune'
    leconsKarmiques?: number[] | 'aucune'
    anneePersonnelle?: number
    moisPersonnel?: number
    pinnacleActif?: { numero: number; phase: string }
    periodeActuelle?: string
  }

  humandesign?: {
    type?: string
    profil?: string
    autorite?: string
    strategie?: string
    signature?: string
    nonSoi?: string
    centresDefinis?: string[]
    centresOuverts?: string[]
    croixIncarnation?: string
    circuitDominant?: string
    canaux?: string[]
    variable?: string
    transitsActifs?: string[]
  }

  enneagramme?: {
    type?: number
    aile?: string
    centreIntelligence?: string
    peurFondamentale?: string
    desirFondamental?: string
    passionDominante?: string
    fixationMentale?: string
    mecanismeDefense?: string
    blessureCentrale?: string
    fleche_integration?: string
    fleche_desintegration?: string
    vertu?: string
    ideeSacree?: string
    sousType?: string
    niveauxSante?: 'elevé' | 'moyen' | 'bas'
    triType?: string
    dataSource?: 'test' | 'declared' | 'observed'
  }

  kua?: {
    nombreKua?: number
    groupeKua?: string
    elementKua?: string
    trigramme?: string
    directionShengChi?: string
    directionTienYi?: string
    directionNienYen?: string
    directionFuWei?: string
    directionHoHai?: string
    directionWuGui?: string
    directionLiuSha?: string
    directionJueMing?: string
    orientationBureau?: string
    orientationLit?: string
    secteurMaison?: string
    etoileAnnuelle?: number
    cycleKi?: string
  }
}

// ── Builders ────────────────────────────────────────────────────────────────

/**
 * Formate les données Fusion en BLOC DONNÉES multi-sciences prompt-ready.
 * N'inclut que les sections dont les données sont présentes.
 */
export function buildFusionDataBlock(
  data: FusionAvailableData,
  lang: 'fr' | 'en' = 'fr',
): string {
  const isFr = lang === 'fr'
  const lines: string[] = [
    isFr ? 'DONNÉES FUSION — SOURCE DE VÉRITÉ' : 'FUSION DATA — SOURCE OF TRUTH',
    isFr ? `Prénom : ${data.firstName}` : `First name: ${data.firstName}`,
  ]

  const sciencesDisponibles: string[] = []
  if (data.astrologie) sciencesDisponibles.push('Astrologie')
  if (data.numerologie) sciencesDisponibles.push('Numérologie')
  if (data.humandesign) sciencesDisponibles.push('Human Design')
  if (data.enneagramme) sciencesDisponibles.push('Ennéagramme')
  if (data.kua) sciencesDisponibles.push('Kua')

  lines.push(isFr
    ? `Sciences disponibles : ${sciencesDisponibles.join(', ')}`
    : `Available sciences: ${sciencesDisponibles.join(', ')}`)

  if (data.astrologie) {
    const a = data.astrologie
    lines.push('', isFr ? 'ASTROLOGIE :' : 'ASTROLOGY:')
    if (a.soleil)    lines.push(isFr ? `Soleil : ${a.soleil}` : `Sun: ${a.soleil}`)
    if (a.ascendant) lines.push(isFr ? `Ascendant : ${a.ascendant}` : `Ascendant: ${a.ascendant}`)
    if (a.lune)      lines.push(isFr ? `Lune : ${a.lune}` : `Moon: ${a.lune}`)
    if (a.mercure)   lines.push(isFr ? `Mercure : ${a.mercure}` : `Mercury: ${a.mercure}`)
    if (a.venus)     lines.push(isFr ? `Vénus : ${a.venus}` : `Venus: ${a.venus}`)
    if (a.jupiter)   lines.push(isFr ? `Jupiter : ${a.jupiter}` : `Jupiter: ${a.jupiter}`)
    if (a.saturne)   lines.push(isFr ? `Saturne : ${a.saturne}` : `Saturn: ${a.saturne}`)
    if (a.pluton)    lines.push(isFr ? `Pluton : ${a.pluton}` : `Pluto: ${a.pluton}`)
    if (a.maison2)   lines.push(isFr ? `Maison 2 : ${a.maison2}` : `House 2: ${a.maison2}`)
    if (a.maison4)   lines.push(isFr ? `Maison 4 : ${a.maison4}` : `House 4: ${a.maison4}`)
    if (a.maison5)   lines.push(isFr ? `Maison 5 : ${a.maison5}` : `House 5: ${a.maison5}`)
    if (a.maison7)   lines.push(isFr ? `Maison 7 : ${a.maison7}` : `House 7: ${a.maison7}`)
    if (a.maison8)   lines.push(isFr ? `Maison 8 : ${a.maison8}` : `House 8: ${a.maison8}`)
    if (a.maison9)   lines.push(isFr ? `Maison 9 : ${a.maison9}` : `House 9: ${a.maison9}`)
    if (a.maison10)  lines.push(isFr ? `Maison 10 : ${a.maison10}` : `House 10: ${a.maison10}`)
    if (a.maison11)  lines.push(isFr ? `Maison 11 : ${a.maison11}` : `House 11: ${a.maison11}`)
    if (a.maison12)  lines.push(isFr ? `Maison 12 : ${a.maison12}` : `House 12: ${a.maison12}`)
    if (a.transitsActifs?.length) {
      lines.push(isFr
        ? `Transits actifs : ${a.transitsActifs.join(' | ')}`
        : `Active transits: ${a.transitsActifs.join(' | ')}`)
    }
  }

  if (data.numerologie) {
    const n = data.numerologie
    lines.push('', isFr ? 'NUMÉROLOGIE :' : 'NUMEROLOGY:')
    if (n.cheminDeVie !== undefined) lines.push(isFr ? `Chemin de Vie : ${n.cheminDeVie}` : `Life Path: ${n.cheminDeVie}`)
    if (n.expression  !== undefined) lines.push(isFr ? `Expression : ${n.expression}` : `Expression: ${n.expression}`)
    if (n.ame         !== undefined) lines.push(isFr ? `Âme : ${n.ame}` : `Soul: ${n.ame}`)
    if (n.personnalite!== undefined) lines.push(isFr ? `Personnalité : ${n.personnalite}` : `Personality: ${n.personnalite}`)
    if (n.dettesKarmiques) {
      const val = Array.isArray(n.dettesKarmiques) ? n.dettesKarmiques.join(', ') : n.dettesKarmiques
      lines.push(isFr ? `Dettes karmiques : ${val}` : `Karmic debts: ${val}`)
    }
    if (n.leconsKarmiques) {
      const val = Array.isArray(n.leconsKarmiques) ? n.leconsKarmiques.join(', ') : n.leconsKarmiques
      lines.push(isFr ? `Leçons karmiques : ${val}` : `Karmic lessons: ${val}`)
    }
    if (n.anneePersonnelle !== undefined) lines.push(isFr ? `Année Personnelle : ${n.anneePersonnelle}` : `Personal Year: ${n.anneePersonnelle}`)
    if (n.moisPersonnel    !== undefined) lines.push(isFr ? `Mois Personnel : ${n.moisPersonnel}` : `Personal Month: ${n.moisPersonnel}`)
    if (n.pinnacleActif) lines.push(isFr ? `Pinnacle actif : ${n.pinnacleActif.numero} — ${n.pinnacleActif.phase}` : `Active pinnacle: ${n.pinnacleActif.numero} — ${n.pinnacleActif.phase}`)
    if (n.periodeActuelle) lines.push(isFr ? `Période de vie : ${n.periodeActuelle}` : `Life period: ${n.periodeActuelle}`)
  }

  if (data.humandesign) {
    const h = data.humandesign
    lines.push('', isFr ? 'HUMAN DESIGN :' : 'HUMAN DESIGN:')
    if (h.type)             lines.push(isFr ? `Type : ${h.type}` : `Type: ${h.type}`)
    if (h.profil)           lines.push(isFr ? `Profil : ${h.profil}` : `Profile: ${h.profil}`)
    if (h.autorite)         lines.push(isFr ? `Autorité : ${h.autorite}` : `Authority: ${h.autorite}`)
    if (h.strategie)        lines.push(isFr ? `Stratégie : ${h.strategie}` : `Strategy: ${h.strategie}`)
    if (h.signature)        lines.push(isFr ? `Signature : ${h.signature}` : `Signature: ${h.signature}`)
    if (h.nonSoi)           lines.push(isFr ? `Non-Soi : ${h.nonSoi}` : `Not-Self: ${h.nonSoi}`)
    if (h.centresDefinis?.length) {
      lines.push(isFr ? `Centres définis : ${h.centresDefinis.join(', ')}` : `Defined centers: ${h.centresDefinis.join(', ')}`)
    }
    if (h.centresOuverts?.length) {
      lines.push(isFr ? `Centres ouverts : ${h.centresOuverts.join(', ')}` : `Open centers: ${h.centresOuverts.join(', ')}`)
    }
    if (h.croixIncarnation)  lines.push(isFr ? `Croix d'Incarnation : ${h.croixIncarnation}` : `Incarnation Cross: ${h.croixIncarnation}`)
    if (h.circuitDominant)   lines.push(isFr ? `Circuit dominant : ${h.circuitDominant}` : `Dominant circuit: ${h.circuitDominant}`)
    if (h.canaux?.length) {
      lines.push(isFr ? `Canaux définis : ${h.canaux.join(', ')}` : `Defined channels: ${h.canaux.join(', ')}`)
    }
    if (h.variable)          lines.push(isFr ? `Variable : ${h.variable}` : `Variable: ${h.variable}`)
  }

  if (data.enneagramme) {
    const e = data.enneagramme
    lines.push('', isFr ? 'ENNÉAGRAMME :' : 'ENNEAGRAM:')
    if (e.dataSource) {
      const src: Record<string, string> = { test: 'test validé', declared: 'auto-déclaration', observed: 'observation' }
      lines.push(isFr ? `Source : ${src[e.dataSource] ?? e.dataSource}` : `Source: ${e.dataSource}`)
    }
    if (e.type              !== undefined) lines.push(isFr ? `Type : ${e.type}` : `Type: ${e.type}`)
    if (e.aile)              lines.push(isFr ? `Aile : ${e.aile}` : `Wing: ${e.aile}`)
    if (e.centreIntelligence)lines.push(isFr ? `Centre d'intelligence : ${e.centreIntelligence}` : `Intelligence center: ${e.centreIntelligence}`)
    if (e.peurFondamentale)  lines.push(isFr ? `Peur fondamentale : ${e.peurFondamentale}` : `Core fear: ${e.peurFondamentale}`)
    if (e.desirFondamental)  lines.push(isFr ? `Désir fondamental : ${e.desirFondamental}` : `Core desire: ${e.desirFondamental}`)
    if (e.passionDominante)  lines.push(isFr ? `Passion dominante : ${e.passionDominante}` : `Dominant passion: ${e.passionDominante}`)
    if (e.fixationMentale)   lines.push(isFr ? `Fixation mentale : ${e.fixationMentale}` : `Mental fixation: ${e.fixationMentale}`)
    if (e.mecanismeDefense)  lines.push(isFr ? `Mécanisme de défense : ${e.mecanismeDefense}` : `Defense mechanism: ${e.mecanismeDefense}`)
    if (e.blessureCentrale)  lines.push(isFr ? `Blessure centrale : ${e.blessureCentrale}` : `Core wound: ${e.blessureCentrale}`)
    if (e.fleche_desintegration) lines.push(isFr ? `Flèche désintégration : ${e.fleche_desintegration}` : `Disintegration arrow: ${e.fleche_desintegration}`)
    if (e.fleche_integration)    lines.push(isFr ? `Flèche intégration : ${e.fleche_integration}` : `Integration arrow: ${e.fleche_integration}`)
    if (e.vertu)             lines.push(isFr ? `Vertu : ${e.vertu}` : `Virtue: ${e.vertu}`)
    if (e.ideeSacree)        lines.push(isFr ? `Idée sacrée : ${e.ideeSacree}` : `Holy idea: ${e.ideeSacree}`)
    if (e.sousType)          lines.push(isFr ? `Sous-type : ${e.sousType}` : `Subtype: ${e.sousType}`)
    if (e.niveauxSante) {
      const lvl: Record<string, string> = { elevé: 'élevé (intégré)', moyen: 'moyen (automatique)', bas: 'bas (régression)' }
      lines.push(isFr ? `Niveau de santé : ${lvl[e.niveauxSante]}` : `Health level: ${e.niveauxSante}`)
    }
    if (e.triType)           lines.push(isFr ? `Tri-type : ${e.triType}` : `Tri-type: ${e.triType}`)
  }

  if (data.kua) {
    const k = data.kua
    lines.push('', isFr ? 'KUA :' : 'KUA:')
    if (k.nombreKua !== undefined) lines.push(isFr ? `Nombre Kua : ${k.nombreKua}` : `Kua Number: ${k.nombreKua}`)
    if (k.groupeKua)  lines.push(isFr ? `Groupe : ${k.groupeKua}` : `Group: ${k.groupeKua}`)
    if (k.elementKua) lines.push(isFr ? `Élément : ${k.elementKua}` : `Element: ${k.elementKua}`)
    if (k.trigramme)  lines.push(isFr ? `Trigramme : ${k.trigramme}` : `Trigram: ${k.trigramme}`)
    if (k.directionShengChi) lines.push(isFr ? `Sheng Chi : ${k.directionShengChi}` : `Sheng Chi: ${k.directionShengChi}`)
    if (k.directionTienYi)   lines.push(isFr ? `Tien Yi : ${k.directionTienYi}` : `Tien Yi: ${k.directionTienYi}`)
    if (k.directionNienYen)  lines.push(isFr ? `Nien Yen : ${k.directionNienYen}` : `Nien Yen: ${k.directionNienYen}`)
    if (k.directionFuWei)    lines.push(isFr ? `Fu Wei : ${k.directionFuWei}` : `Fu Wei: ${k.directionFuWei}`)
    if (k.directionHoHai)    lines.push(isFr ? `Ho Hai : ${k.directionHoHai}` : `Ho Hai: ${k.directionHoHai}`)
    if (k.directionJueMing)  lines.push(isFr ? `Jue Ming : ${k.directionJueMing}` : `Jue Ming: ${k.directionJueMing}`)
    if (k.orientationBureau) lines.push(isFr ? `Orientation bureau : ${k.orientationBureau}` : `Desk orientation: ${k.orientationBureau}`)
    if (k.orientationLit)    lines.push(isFr ? `Orientation lit : ${k.orientationLit}` : `Bed orientation: ${k.orientationLit}`)
    if (k.etoileAnnuelle !== undefined) lines.push(isFr ? `Étoile annuelle : ${k.etoileAnnuelle}` : `Annual star: ${k.etoileAnnuelle}`)
    if (k.cycleKi)           lines.push(isFr ? `Cycle Ki : ${k.cycleKi}` : `Ki cycle: ${k.cycleKi}`)
  }

  return lines.join('\n')
}

/**
 * Retourne le bloc de règles Fusion, injectable seul dans tout prompt.
 */
export function buildFusionRulesBlock(lang: 'fr' | 'en' = 'fr'): string {
  if (lang === 'en') {
    return `FUSION RULES:
- Spheres 1 and 4 always present in every reading.
- Each science analyzed only in its primary sphere — no repetition across spheres.
- Enneagram: Passion (sphere 6) ≠ Mental fixation (sphere 3). Never interchanged.
- Enneagram: Disintegration arrow (sphere 8) ≠ Integration arrow (sphere 9). Separate spheres.
- HD: Defined centers = reliable resources (sphere 2). Open centers = potential conditioning (sphere 6). Never mixed.
- Kua: Favorable directions (spheres 2/3/7/9/10) ≠ unfavorable (spheres 6/8). Never crossed.
- Astrology: Transits = timing only. Not identity sources.
- Anti-duplication: Numerology CV analyzed in depth in sphere 10. Mention only in sphere 1.
- Anti-duplication: Astrology Sun in sphere 1. Saturn/House 10 in sphere 10. Not inverted.
- Missing science: name the absence, do not invent data.
- Contextual mode: max 3 active spheres. Never deploy full matrix for a free question.
- Tone: direct, grounded, human. No mystical jargon without explicit request.`
  }

  return `RÈGLES FUSION :
- Sphères 1 et 4 toujours présentes dans tout rendu.
- Chaque science analysée uniquement dans sa sphère principale — pas de répétition entre sphères.
- Ennéagramme : Passion (sphère 6) ≠ Fixation mentale (sphère 3). Jamais interverties.
- Ennéagramme : Flèche désintégration (sphère 8) ≠ Flèche intégration (sphère 9). Sphères séparées.
- HD : Centres définis = ressources fiables (sphère 2). Centres ouverts = conditionnement potentiel (sphère 6). Jamais mélangés.
- Kua : Directions favorables (sphères 2/3/7/9/10) ≠ défavorables (sphères 6/8). Jamais croisées.
- Astrologie : Transits = timing uniquement. Pas sources d'identité.
- Anti-doublon : CV Numérologie analysé en profondeur en sphère 10. Mention uniquement en sphère 1.
- Anti-doublon : Soleil Astrologie en sphère 1. Saturne/Maison 10 en sphère 10. Pas inversé.
- Science absente : nommer l'absence, ne pas inventer les données.
- Mode contextuel : max 3 sphères actives. Ne jamais déployer la matrice complète pour une question libre.
- Ton : direct, incarné, humain. Pas de jargon ésotérique sans demande explicite.`
}

/**
 * Construit un prompt système Fusion complet.
 * Rôle + structure sphères prioritaires + données + règles.
 *
 * @example
 * const prompt = buildFusionFullPrompt('identitaire', {
 *   firstName: 'Sophie',
 *   enneagramme: { type: 4, centreIntelligence: 'Cœur', peurFondamentale: '...' },
 *   astrologie: { soleil: 'Scorpion', ascendant: 'Verseau', lune: 'Cancer' },
 * })
 */
export function buildFusionFullPrompt(
  readingType: FusionReadingType,
  data: FusionAvailableData,
  lang: 'fr' | 'en' = 'fr',
): string {
  const isFr = lang === 'fr'
  const def = FUSION_READING_TYPES.find((r) => r.id === readingType)

  const role = isFr
    ? `Tu es HexAstra Fusion, expert en lecture multi-sciences structurée à 12 sphères.\nMission : produire une ${def?.name ?? 'lecture Fusion'} complète à partir des données ci-dessous.\nStructure invariante. Aucune donnée analysée deux fois. Chaque science intervient uniquement là où elle apporte une valeur non redondante.`
    : `You are HexAstra Fusion, expert in multi-science structured 12-sphere reading.\nMission: produce a complete ${def?.name ?? 'Fusion reading'} from the data below.\nInvariant structure. No data analyzed twice. Each science appears only where it adds non-redundant value.`

  // Sphères prioritaires pour ce type de lecture
  const priorityHouses = PRIMARY_SPHERES_BY_READING[readingType]
  const sphereBlocks = priorityHouses
    .map((h) => getSphereByHouse(h))
    .filter((s): s is FusionSphereDefinition => s !== undefined)
    .map((s) => {
      const leadsForSphere = s.scienceAssignments
        .filter((a) => a.role === 'leading')
        .map((a) => `${a.science} (${a.priorityData.slice(0, 2).join(', ')})`)
        .join(' + ')
      return [
        `## ${s.house}. ${s.name}`,
        s.reveals,
        isFr ? `Sciences leads : ${leadsForSphere}` : `Leading sciences: ${leadsForSphere}`,
        isFr ? `Déséquilibre : ${s.imbalance}` : `Imbalance: ${s.imbalance}`,
        isFr ? `Potentiel : ${s.potential}` : `Potential: ${s.potential}`,
        isFr ? `Clé : ${s.keyUnderstanding}` : `Key: ${s.keyUnderstanding}`,
        isFr ? `Action : ${s.keyAction}` : `Action: ${s.keyAction}`,
      ].join('\n')
    })
    .join('\n\n')

  const structureHeader = isFr
    ? `STRUCTURE HEXASTRA FUSION — LECTURE ${readingType.toUpperCase()} — SPHÈRES PRIORITAIRES`
    : `HEXASTRA FUSION STRUCTURE — ${readingType.toUpperCase()} READING — PRIORITY SPHERES`

  const structureBlock = [structureHeader, '', sphereBlocks].join('\n')
  const dataBlock = buildFusionDataBlock(data, lang)
  const rulesBlock = buildFusionRulesBlock(lang)

  return [role, structureBlock, dataBlock, rulesBlock].join('\n\n')
}

// ── Validation post-render ──────────────────────────────────────────────────

/** Blocs requis par type de lecture Fusion */
export const FUSION_REQUIRED_BLOCKS_BY_TYPE: Record<FusionReadingType, string[]> = {
  general:        ['IDENTITÉ', 'RACINES', 'RELATIONS', 'VOCATION'],
  identitaire:    ['IDENTITÉ', 'RACINES', 'INTELLIGENCE', 'EXPRESSION'],
  relationnelle:  ['RELATIONS', 'IDENTITÉ', 'RACINES', 'COLLECTIF'],
  vocationnelle:  ['VOCATION', 'VISION', 'RESSOURCES', 'EXPRESSION'],
  decisionnelle:  ['INTELLIGENCE', 'RESSOURCES', 'VOCATION', 'ÉQUILIBRE'],
  energetique:    ['RESSOURCES', 'ÉQUILIBRE', 'RACINES', 'TRANSFORMATION'],
  transformatrice:['TRANSFORMATION', 'INTÉGRATION', 'RACINES', 'VISION'],
  cyclique:       ['ÉQUILIBRE', 'COLLECTIF', 'INTÉGRATION', 'VOCATION'],
  contextuelle:   ['IDENTITÉ'],  // minimal — varie selon la détection
}

/** Valide qu'un rendu Fusion contient les sphères requises */
export function validateFusionOutput(
  text: string,
  readingType: FusionReadingType,
): { valid: boolean; missingBlocks: string[] } {
  const upper = (text || '').toUpperCase()
  const required = FUSION_REQUIRED_BLOCKS_BY_TYPE[readingType]
  const missingBlocks = required.filter((block) => !upper.includes(block))
  return { valid: missingBlocks.length === 0, missingBlocks }
}
