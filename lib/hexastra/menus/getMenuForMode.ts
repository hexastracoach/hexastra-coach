import type { HexastraMenuItem, HexastraMode } from '@/lib/hexastra/types'

/**
 * Science-first menu architecture.
 * Level 1 = 6 sciences. Level 2 = subcategories per science.
 * Same structure for all modes; prompt hints differ for praticien.
 */

const scienceMenu: HexastraMenuItem[] = [
  {
    key: 'science_astrologie',
    label: 'Astrologie',
    description: 'Cycles planétaires, maisons, aspects et timing astral.',
    contextType: 'timing',
    domainRoute: 'timing',
    promptHint: 'Lecture astrologique du cycle, des maisons, des aspects et du timing.',
    submenu: [
      { key: 'astro_signes', label: 'Signes / Zodiaque', description: 'Lecture du signe solaire et ses qualités.', contextType: 'general', domainRoute: 'science', promptHint: 'Analyser le signe solaire, ses forces, ses défis et sa vibration du moment.' },
      { key: 'astro_ascendant', label: 'Ascendant', description: 'Masque social, apparence et premier contact.', contextType: 'general', domainRoute: 'science', promptHint: 'Lire l ascendant et son interaction avec le signe solaire dans la situation actuelle.' },
      { key: 'astro_maisons', label: 'Maisons astrologiques', description: 'Les 12 domaines de vie activés en ce moment.', contextType: 'general', domainRoute: 'science', promptHint: 'Identifier les maisons actives et les domaines de vie concernés.' },
      { key: 'astro_planetes', label: 'Planètes', description: 'Planètes dominantes, leur force et leur message.', contextType: 'energy', domainRoute: 'science', promptHint: 'Lire les planètes dominantes dans la configuration actuelle.' },
      { key: 'astro_aspects', label: 'Aspects', description: 'Tensions et harmonies entre les planètes.', contextType: 'general', domainRoute: 'science', promptHint: 'Lire les aspects majeurs et leur tension ou synergie dans la situation.' },
      { key: 'astro_transits', label: 'Transits', description: 'Les mouvements planétaires actifs en ce moment.', contextType: 'timing', domainRoute: 'timing', promptHint: 'Analyser les transits actifs et leur effet sur la période actuelle.' },
      { key: 'astro_compatibilite', label: 'Compatibilité', description: 'Dynamique astrale entre deux personnes.', contextType: 'relationship', domainRoute: 'relationship', promptHint: 'Lire la compatibilité astrologique entre les deux profils.' },
      { key: 'astro_theme_natal', label: 'Thème natal', description: 'Lecture complète du thème de naissance.', contextType: 'hexastraReading', domainRoute: 'fusion', promptHint: 'Synthèse du thème natal complet avec dominantes et axes majeurs.' },
      { key: 'astro_vocation', label: 'Vocation', description: 'Potentiel et direction de vie astrologique.', contextType: 'general', domainRoute: 'science', promptHint: 'Lire le potentiel vocationnel et le chemin de vie inscrit dans le thème.' },
      { key: 'astro_amour', label: 'Amour', description: 'Vénus, maison 7 et dynamique relationnelle.', contextType: 'relationship', domainRoute: 'relationship', promptHint: 'Analyser la vie amoureuse à travers Vénus, la maison 7 et les aspects relationnels.' },
      { key: 'astro_travail', label: 'Travail / Carrière', description: 'Maison 10, Saturne et axe professionnel.', contextType: 'career', domainRoute: 'career', promptHint: 'Lire l axe professionnel via la maison 10 et les planètes associées.' },
      { key: 'astro_cycles', label: 'Cycles', description: 'Cycles de vie, retours solaires et phases majeures.', contextType: 'timing', domainRoute: 'timing', promptHint: 'Identifier les cycles actifs (retour solaire, progressions, transits lents).' },
    ],
  },
  {
    key: 'science_numerologie',
    label: 'Numérologie',
    description: 'Cycles personnels, vibrations et temporalité numérologique.',
    contextType: 'timing',
    domainRoute: 'timing',
    promptHint: 'Lecture numérologique du cycle dominant et de la temporalité.',
    submenu: [
      { key: 'num_chemin_vie', label: 'Chemin de vie', description: 'Le nombre fondamental qui structure l existence.', contextType: 'general', domainRoute: 'science', promptHint: 'Lire le chemin de vie et son expression dans la situation actuelle.' },
      { key: 'num_annee_perso', label: 'Année personnelle', description: 'Le thème et la vibration de l année en cours.', contextType: 'timing', domainRoute: 'timing', promptHint: 'Analyser l année personnelle en cours et ses implications stratégiques.' },
      { key: 'num_nom_prenom', label: 'Nom / Prénom', description: 'Les vibrations inscrites dans l identité.', contextType: 'general', domainRoute: 'science', promptHint: 'Lire les nombres d expression, d âme et de personnalité via le nom et le prénom.' },
      { key: 'num_compatibilite', label: 'Compatibilité', description: 'Résonance entre deux profils numériques.', contextType: 'relationship', domainRoute: 'relationship', promptHint: 'Analyser la compatibilité numérologique entre les deux profils.' },
      { key: 'num_cycles', label: 'Cycles numériques', description: 'Pinnacles, épreuves et périodes actives.', contextType: 'timing', domainRoute: 'timing', promptHint: 'Identifier le cycle actif (pinnacle, épreuve, période) et son enseignement.' },
      { key: 'num_vocation', label: 'Vocation', description: 'L orientation naturelle et le potentiel d expression.', contextType: 'general', domainRoute: 'science', promptHint: 'Lire la vocation et le potentiel d expression à travers les nombres clés.' },
      { key: 'num_decision', label: 'Décision', description: 'Aide à la décision par la vibration du moment.', contextType: 'decision', domainRoute: 'decision', promptHint: 'Utiliser la numérologie pour éclairer une décision en cours.' },
    ],
  },
  {
    key: 'science_human_design',
    label: 'Human Design',
    description: 'Fonctionnement naturel, centres, portes et décision.',
    contextType: 'energy',
    domainRoute: 'science',
    promptHint: 'Lecture Human Design centrée sur le fonctionnement naturel, les centres et la décision.',
    submenu: [
      { key: 'hd_type', label: 'Type', description: 'Générateur, Projecteur, Manifesteur ou Réflecteur.', contextType: 'energy', domainRoute: 'science', promptHint: 'Lire le type HD et sa stratégie naturelle dans la situation.' },
      { key: 'hd_strategie', label: 'Stratégie', description: 'La bonne façon d agir selon le type.', contextType: 'decision', domainRoute: 'science', promptHint: 'Appliquer la stratégie HD à la situation ou à la demande exprimée.' },
      { key: 'hd_autorite', label: 'Autorité intérieure', description: 'Comment ce profil prend ses décisions justes.', contextType: 'decision', domainRoute: 'science', promptHint: 'Lire l autorité intérieure et son application dans une décision.' },
      { key: 'hd_profil', label: 'Profil', description: 'Le rôle et la dynamique de vie (1/3, 2/4, etc.).', contextType: 'general', domainRoute: 'science', promptHint: 'Analyser le profil HD et son influence sur le rôle de vie actuel.' },
      { key: 'hd_centres', label: 'Centres', description: 'Centres définis et indéfinis — forces et vulnérabilités.', contextType: 'energy', domainRoute: 'neurokua', promptHint: 'Lire les centres HD définis et indéfinis et leurs implications concrètes.' },
      { key: 'hd_portes', label: 'Portes actives', description: 'Les fréquences et thèmes dominants du design.', contextType: 'energy', domainRoute: 'science', promptHint: 'Identifier les portes actives et leurs thèmes dominants.' },
      { key: 'hd_canaux', label: 'Canaux', description: 'Les connexions énergétiques complètes du profil.', contextType: 'energy', domainRoute: 'science', promptHint: 'Analyser les canaux définis et leur rôle dans le fonctionnement du profil.' },
      { key: 'hd_croix', label: 'Croix d\'incarnation', description: 'Le thème de vie majeur et la direction.', contextType: 'general', domainRoute: 'science', promptHint: 'Lire la croix d incarnation et son sens dans la trajectoire de vie actuelle.' },
      { key: 'hd_compatibilite', label: 'Compatibilité', description: 'Interaction entre deux designs.', contextType: 'relationship', domainRoute: 'relationship', promptHint: 'Analyser la dynamique entre deux designs HD.' },
      { key: 'hd_transits', label: 'Transits HD', description: 'Influences planétaires sur le design en ce moment.', contextType: 'timing', domainRoute: 'timing', promptHint: 'Lire les transits HD actifs et leur effet sur la configuration du moment.' },
    ],
  },
  {
    key: 'science_enneagramme',
    label: 'Ennéagramme',
    description: 'Types, mécanismes profonds et leviers de développement.',
    contextType: 'relationship',
    domainRoute: 'science',
    promptHint: 'Lecture archétypale des mécanismes, défenses et leviers selon l ennéagramme.',
    submenu: [
      { key: 'enn_type', label: 'Type de personnalité', description: 'Le type ennéagramme dominant (1 à 9).', contextType: 'general', domainRoute: 'science', promptHint: 'Identifier ou lire le type ennéagramme et ses dynamiques dans la situation.' },
      { key: 'enn_aile', label: 'Aile', description: 'La nuance du type par l aile adjacente.', contextType: 'general', domainRoute: 'science', promptHint: 'Intégrer l aile dans la lecture pour affiner le profil.' },
      { key: 'enn_centre', label: 'Centre', description: 'Centre instinctif, émotionnel ou mental.', contextType: 'energy', domainRoute: 'science', promptHint: 'Lire le centre dominant et son activation dans la situation actuelle.' },
      { key: 'enn_instinct', label: 'Instinct dominant', description: 'Conservation, social ou sexuel (transpersonnel).', contextType: 'energy', domainRoute: 'science', promptHint: 'Analyser l instinct dominant et sa manifestation dans la demande.' },
      { key: 'enn_niveau', label: 'Niveau d\'intégration', description: 'Niveau de santé psychologique actuel.', contextType: 'wellbeing', domainRoute: 'wellbeing', promptHint: 'Évaluer le niveau d intégration apparent et son influence sur la situation.' },
      { key: 'enn_relations', label: 'Relations', description: 'Dynamiques relationnelles typiques du profil.', contextType: 'relationship', domainRoute: 'relationship', promptHint: 'Lire les dynamiques relationnelles caractéristiques du type dans la situation.' },
      { key: 'enn_travail', label: 'Travail / Vocation', description: 'Expression professionnelle du type.', contextType: 'career', domainRoute: 'career', promptHint: 'Analyser l expression professionnelle et vocationnelle du type ennéagramme.' },
      { key: 'enn_evolution', label: 'Évolution', description: 'Piste de croissance et direction d intégration.', contextType: 'general', domainRoute: 'science', promptHint: 'Donner la piste d évolution et d intégration pour ce type dans ce contexte.' },
    ],
  },
  {
    key: 'science_kua',
    label: 'Kua',
    description: 'Orientation, directions favorables et positionnement optimal.',
    contextType: 'decision',
    domainRoute: 'gps_kua',
    promptHint: 'Lecture Kua de l orientation et du positionnement utile.',
    submenu: [
      { key: 'kua_nombre', label: 'Nombre Kua', description: 'Le nombre personnel et son groupe d appartenance.', contextType: 'general', domainRoute: 'gps_kua', promptHint: 'Calculer ou lire le nombre Kua et ses implications de base.' },
      { key: 'kua_directions', label: 'Directions favorables', description: 'Les 4 directions bénéfiques personnelles.', contextType: 'decision', domainRoute: 'gps_kua', promptHint: 'Identifier les 4 directions favorables et leur usage concret.' },
      { key: 'kua_habitat', label: 'Orientation habitat', description: 'Positionnement dans l espace de vie.', contextType: 'energy', domainRoute: 'gps_kua', promptHint: 'Lire le positionnement optimal dans l espace de vie selon le Kua.' },
      { key: 'kua_bureau', label: 'Orientation bureau', description: 'Direction de travail et de concentration.', contextType: 'career', domainRoute: 'gps_kua', promptHint: 'Donner la direction de travail et de bureau optimale selon le Kua.' },
      { key: 'kua_sommeil', label: 'Direction de sommeil', description: 'Tête du lit et récupération optimale.', contextType: 'wellbeing', domainRoute: 'gps_kua', promptHint: 'Lire la direction de sommeil optimale pour la récupération.' },
      { key: 'kua_gps_global', label: 'GPS Kua global', description: 'Synthèse de positionnement optimal complet.', contextType: 'decision', domainRoute: 'gps_kua', promptHint: 'Fournir une synthèse GPS complète du positionnement Kua dans toutes les zones.' },
    ],
  },
  {
    key: 'science_fusion',
    label: 'Fusion Hexastra',
    description: 'Lecture multi-sciences croisée — le niveau de synthèse le plus puissant.',
    contextType: 'hexastraReading',
    domainRoute: 'fusion',
    promptHint: 'Fusionner tous les signaux disponibles, résoudre les contradictions, extraire les dominantes.',
    submenu: [
      { key: 'fusion_generale', label: 'Lecture générale fusionnée', description: 'Synthèse complète multi-sciences du moment actuel.', contextType: 'hexastraReading', domainRoute: 'fusion', promptHint: 'Produire une lecture fusionnée complète avec croisement de toutes les sciences disponibles.' },
      { key: 'fusion_ultra_precise', label: 'Lecture ultra précise', description: 'Analyse approfondie avec maximum de signaux croisés.', contextType: 'hexastraReading', domainRoute: 'fusion', promptHint: 'Produire la lecture la plus précise possible en croisant tous les systèmes et en résolvant les contradictions.' },
      { key: 'fusion_compatibilite', label: 'Compatibilité fusionnée', description: 'Compatibilité multi-sciences entre deux personnes.', contextType: 'relationship', domainRoute: 'relationship', promptHint: 'Analyser la compatibilité en croisant astrologie, numérologie, Human Design et Ennéagramme.' },
      { key: 'fusion_decision', label: 'Décision fusionnée', description: 'Aide à la décision avec vue multi-sciences.', contextType: 'decision', domainRoute: 'decision', promptHint: 'Croiser tous les signaux disponibles pour éclairer une décision avec la meilleure précision possible.' },
      { key: 'fusion_timing', label: 'Timing fusionné', description: 'Lecture des cycles et fenêtres d action croisées.', contextType: 'timing', domainRoute: 'timing', promptHint: 'Croiser les cycles astrologiques, numériques et HD pour identifier les fenêtres d action optimales.' },
      { key: 'fusion_praticien', label: 'Lecture praticien', description: 'Synthèse structurée à usage professionnel.', contextType: 'practitioner', domainRoute: 'fusion', promptHint: 'Produire une lecture structurée selon le format praticien avec vocabulaire technique autorisé.' },
      { key: 'fusion_synthese_croisee', label: 'Synthèse croisée', description: 'Extraction des dominantes et leviers majeurs.', contextType: 'hexastraReading', domainRoute: 'fusion', promptHint: 'Extraire les dominantes communes et les leviers d action prioritaires en croisant tous les systèmes.' },
    ],
  },
]

/**
 * Free plan gets the same science menu but without Fusion Hexastra.
 * Each science limited to a single request at a time with lighter depth.
 */
const freeMenu: HexastraMenuItem[] = scienceMenu.filter(
  (item) => item.key !== 'science_fusion',
)

export function getMenuForMode(mode: HexastraMode, plan?: string): HexastraMenuItem[] {
  if (plan === 'free') return freeMenu
  return scienceMenu
}

export function findMenuItem(items: HexastraMenuItem[], key?: string | null): HexastraMenuItem | null {
  if (!key || !Array.isArray(items)) return null
  for (const item of items) {
    if (item.key === key) return item
    const sub = item.submenu?.find((child) => child.key === key)
    if (sub) return sub
  }
  return null
}
