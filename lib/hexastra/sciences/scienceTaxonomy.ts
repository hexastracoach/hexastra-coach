/**
 * Hexastra Science Taxonomy
 * Defines the 6 sciences and their navigable subcategories.
 * Used by the menu system, scope detection, and orchestration backend.
 */

export type ScienceKey =
  | 'astrologie'
  | 'numerologie'
  | 'human_design'
  | 'enneagramme'
  | 'kua'
  | 'fusion_hexastra'

export type AnalysisMode = 'science_by_science' | 'hexastra_fusion'

export type RenderMode = 'simple' | 'approfondie' | 'praticien'

export type ScienceSubcategory = {
  key: string
  label: string
  description: string
  promptHint?: string
}

export type Science = {
  key: ScienceKey
  label: string
  description: string
  subcategories: ScienceSubcategory[]
}

export const SCIENCES: Science[] = [
  {
    key: 'astrologie',
    label: 'Astrologie',
    description: 'Cycles planétaires, maisons, aspects et timing astral.',
    subcategories: [
      { key: 'signes', label: 'Signes / Zodiaque', description: 'Lecture du signe solaire et ses qualités.', promptHint: 'Analyser le signe solaire, ses forces, ses défis et sa vibration du moment.' },
      { key: 'ascendant', label: 'Ascendant', description: 'Masque social, apparence et premier contact.', promptHint: 'Lire l ascendant et son interaction avec le signe solaire dans la situation actuelle.' },
      { key: 'maisons', label: 'Maisons astrologiques', description: 'Les 12 domaines de vie activés en ce moment.', promptHint: 'Identifier les maisons actives et les domaines de vie concernés.' },
      { key: 'planetes', label: 'Planètes', description: 'Planètes dominantes, leur force et leur message.', promptHint: 'Lire les planètes dominantes dans la configuration actuelle.' },
      { key: 'aspects', label: 'Aspects', description: 'Tensions et harmonies entre les planètes.', promptHint: 'Lire les aspects majeurs et leur tension ou synergie dans la situation.' },
      { key: 'transits', label: 'Transits', description: 'Les mouvements planétaires actifs en ce moment.', promptHint: 'Analyser les transits actifs et leur effet sur la période actuelle.' },
      { key: 'compatibilite', label: 'Compatibilité', description: 'Dynamique astrale entre deux personnes.', promptHint: 'Lire la compatibilité astrologique entre les deux profils.' },
      { key: 'theme_natal', label: 'Thème natal', description: 'Lecture complète du thème de naissance.', promptHint: 'Synthèse du thème natal complet avec dominantes et axes majeurs.' },
      { key: 'vocation', label: 'Vocation / Chemin de vie', description: 'Potentiel et direction de vie astrologique.', promptHint: 'Lire le potentiel vocationnel et le chemin de vie inscrit dans le thème.' },
      { key: 'amour_astro', label: 'Amour', description: 'Vénus, maison 7 et dynamique relationnelle.', promptHint: 'Analyser la vie amoureuse à travers Vénus, la maison 7 et les aspects relationnels.' },
      { key: 'travail_astro', label: 'Travail / Carrière', description: 'Maison 10, Saturne et axe professionnel.', promptHint: 'Lire l axe professionnel via la maison 10 et les planètes associées.' },
      { key: 'cycles_astro', label: 'Cycles', description: 'Cycles de vie, retours solaires et phases majeures.', promptHint: 'Identifier les cycles actifs (retour solaire, progressions, transits lents).' },
    ],
  },
  {
    key: 'numerologie',
    label: 'Numérologie',
    description: 'Cycles personnels, vibrations et temporalité numérologique.',
    subcategories: [
      { key: 'chemin_vie', label: 'Chemin de vie', description: 'Le nombre fondamental qui structure l existence.', promptHint: 'Lire le chemin de vie et son expression dans la situation actuelle.' },
      { key: 'annee_perso', label: 'Année personnelle', description: 'Le thème et la vibration de l année en cours.', promptHint: 'Analyser l année personnelle en cours et ses implications stratégiques.' },
      { key: 'nom_prenom', label: 'Nom / Prénom', description: 'Les vibrations inscrites dans l identité.', promptHint: 'Lire les nombres d expression, d âme et de personnalité via le nom et le prénom.' },
      { key: 'compatibilite_num', label: 'Compatibilité', description: 'Résonance entre deux profils numériques.', promptHint: 'Analyser la compatibilité numérologique entre les deux profils.' },
      { key: 'cycles_num', label: 'Cycles numériques', description: 'Pinnacles, épreuves et périodes actives.', promptHint: 'Identifier le cycle actif (pinnacle, épreuve, période) et son enseignement.' },
      { key: 'vocation_num', label: 'Vocation', description: 'L orientation naturelle et le potentiel d expression.', promptHint: 'Lire la vocation et le potentiel d expression à travers les nombres clés.' },
      { key: 'decision_num', label: 'Décision', description: 'Aide à la décision par la vibration du moment.', promptHint: 'Utiliser la numérologie pour éclairer une décision en cours.' },
    ],
  },
  {
    key: 'human_design',
    label: 'Human Design',
    description: 'Fonctionnement naturel, centres, portes et décision.',
    subcategories: [
      { key: 'type_hd', label: 'Type', description: 'Générateur, Projecteur, Manifesteur ou Réflecteur.', promptHint: 'Lire le type HD et sa stratégie naturelle dans la situation.' },
      { key: 'strategie_hd', label: 'Stratégie', description: 'La bonne façon d agir selon le type.', promptHint: 'Appliquer la stratégie HD à la situation ou à la demande exprimée.' },
      { key: 'autorite_hd', label: 'Autorité intérieure', description: 'Comment ce profil prend ses décisions justes.', promptHint: 'Lire l autorité intérieure et son application dans une décision.' },
      { key: 'profil_hd', label: 'Profil', description: 'Le rôle et la dynamique de vie (1/3, 2/4, etc.).', promptHint: 'Analyser le profil HD et son influence sur le rôle de vie actuel.' },
      { key: 'centres_hd', label: 'Centres', description: 'Centres définis et indéfinis — forces et vulnérabilités.', promptHint: 'Lire les centres HD définis et indéfinis et leurs implications concrètes.' },
      { key: 'portes_hd', label: 'Portes actives', description: 'Les fréquences et thèmes dominants du design.', promptHint: 'Identifier les portes actives et leurs thèmes dominants.' },
      { key: 'canaux_hd', label: 'Canaux', description: 'Les connexions énergétiques complètes du profil.', promptHint: 'Analyser les canaux définis et leur rôle dans le fonctionnement du profil.' },
      { key: 'croix_hd', label: 'Croix d\'incarnation', description: 'Le thème de vie majeur et la direction.', promptHint: 'Lire la croix d incarnation et son sens dans la trajectoire de vie actuelle.' },
      { key: 'compatibilite_hd', label: 'Compatibilité', description: 'Interaction entre deux designs.', promptHint: 'Analyser la dynamique entre deux designs HD.' },
      { key: 'transits_hd', label: 'Transits HD', description: 'Influences planétaires sur le design en ce moment.', promptHint: 'Lire les transits HD actifs et leur effet sur la configuration du moment.' },
    ],
  },
  {
    key: 'enneagramme',
    label: 'Ennéagramme',
    description: 'Types, mécanismes profonds et leviers de développement.',
    subcategories: [
      { key: 'type_enn', label: 'Type de personnalité', description: 'Le type ennéagramme dominant (1 à 9).', promptHint: 'Identifier ou lire le type ennéagramme et ses dynamiques dans la situation.' },
      { key: 'aile_enn', label: 'Aile', description: 'La nuance du type par l aile adjacente.', promptHint: 'Intégrer l aile dans la lecture pour affiner le profil.' },
      { key: 'centre_enn', label: 'Centre', description: 'Centre instinctif, émotionnel ou mental.', promptHint: 'Lire le centre dominant et son activation dans la situation actuelle.' },
      { key: 'instinct_enn', label: 'Instinct dominant', description: 'Conservation, social ou sexuel (transpersonnel).', promptHint: 'Analyser l instinct dominant et sa manifestation dans la demande.' },
      { key: 'niveau_enn', label: 'Niveau d\'intégration', description: 'Niveau de santé psychologique actuel.', promptHint: 'Évaluer le niveau d intégration apparent et son influence sur la situation.' },
      { key: 'relations_enn', label: 'Relations', description: 'Dynamiques relationnelles typiques du profil.', promptHint: 'Lire les dynamiques relationnelles caractéristiques du type dans la situation.' },
      { key: 'travail_enn', label: 'Travail / Vocation', description: 'Expression professionnelle du type.', promptHint: 'Analyser l expression professionnelle et vocationnelle du type ennéagramme.' },
      { key: 'evolution_enn', label: 'Évolution', description: 'Piste de croissance et direction d intégration.', promptHint: 'Donner la piste d évolution et d intégration pour ce type dans ce contexte.' },
    ],
  },
  {
    key: 'kua',
    label: 'Kua',
    description: 'Orientation, directions favorables et positionnement optimal.',
    subcategories: [
      { key: 'nombre_kua', label: 'Nombre Kua', description: 'Le nombre personnel et son groupe d appartenance.', promptHint: 'Calculer ou lire le nombre Kua et ses implications de base.' },
      { key: 'directions_fav', label: 'Directions favorables', description: 'Les 4 directions bénéfiques personnelles.', promptHint: 'Identifier les 4 directions favorables et leur usage concret.' },
      { key: 'orientation_habitat', label: 'Orientation habitat', description: 'Positionnement dans l espace de vie.', promptHint: 'Lire le positionnement optimal dans l espace de vie selon le Kua.' },
      { key: 'orientation_bureau', label: 'Orientation bureau', description: 'Direction de travail et de concentration.', promptHint: 'Donner la direction de travail et de bureau optimale selon le Kua.' },
      { key: 'direction_sommeil', label: 'Direction de sommeil', description: 'Tête du lit et récupération optimale.', promptHint: 'Lire la direction de sommeil optimale pour la récupération.' },
      { key: 'gps_kua', label: 'GPS Kua global', description: 'Synthèse de positionnement optimal complet.', promptHint: 'Fournir une synthèse GPS complète du positionnement Kua dans toutes les zones.' },
    ],
  },
  {
    key: 'fusion_hexastra',
    label: 'Fusion Hexastra',
    description: 'Lecture multi-sciences croisée — le niveau de synthèse le plus puissant.',
    subcategories: [
      { key: 'lecture_fusionnee', label: 'Lecture générale fusionnée', description: 'Synthèse complète multi-sciences du moment actuel.', promptHint: 'Produire une lecture fusionnée complète avec croisement de toutes les sciences disponibles.' },
      { key: 'lecture_ultra_precise', label: 'Lecture ultra précise', description: 'Analyse approfondie avec maximum de signaux croisés.', promptHint: 'Produire la lecture la plus précise possible en croisant tous les systèmes et en résolvant les contradictions.' },
      { key: 'compatibilite_fusionnee', label: 'Compatibilité fusionnée', description: 'Compatibilité multi-sciences entre deux personnes.', promptHint: 'Analyser la compatibilité en croisant astrologie, numérologie, Human Design et Ennéagramme.' },
      { key: 'decision_fusionnee', label: 'Décision fusionnée', description: 'Aide à la décision avec vue multi-sciences.', promptHint: 'Croiser tous les signaux disponibles pour éclairer une décision avec la meilleure précision possible.' },
      { key: 'timing_fusionne', label: 'Timing fusionné', description: 'Lecture des cycles et fenêtres d action croisées.', promptHint: 'Croiser les cycles astrologiques, numériques et HD pour identifier les fenêtres d action optimales.' },
      { key: 'lecture_praticien', label: 'Lecture praticien', description: 'Synthèse structurée à usage professionnel.', promptHint: 'Produire une lecture structurée selon le format praticien avec vocabulaire technique autorisé.' },
      { key: 'synthese_croisee', label: 'Synthèse croisée', description: 'Extraction des dominantes et leviers majeurs.', promptHint: 'Extraire les dominantes communes et les leviers d action prioritaires en croisant tous les systèmes.' },
    ],
  },
]

/** Find a science by key */
export function findScience(key: ScienceKey): Science | undefined {
  return SCIENCES.find((s) => s.key === key)
}

/** Find a subcategory across all sciences */
export function findSubcategory(subcategoryKey: string): { science: Science; sub: ScienceSubcategory } | undefined {
  for (const science of SCIENCES) {
    const sub = science.subcategories.find((s) => s.key === subcategoryKey)
    if (sub) return { science, sub }
  }
  return undefined
}

/** Get sciences available for a given plan (free = all but fusion_hexastra as main only) */
export function getSciencesForPlan(plan: string): Science[] {
  if (plan === 'free') {
    return SCIENCES.filter((s) => s.key !== 'fusion_hexastra')
  }
  return SCIENCES
}
