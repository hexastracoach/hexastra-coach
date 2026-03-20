/**
 * Hexastra Subcategory Taxonomy
 * Comprehensive FR/EN keyword mapping for deterministic subcategory detection.
 * Rule: subcategory > science > intent > fallback
 */

export type SubcategoryScience =
  | 'astrology'
  | 'numerology'
  | 'human_design'
  | 'enneagram'
  | 'kua'
  | 'hexastra_fusion'

export type ResponseType = 'structured_data' | 'analysis' | 'fusion_reading'

export type SubcategoryEntry = {
  key: string
  science: SubcategoryScience
  responseType: ResponseType
  /** Weight: higher = detected first on ambiguous overlap */
  weight: number
  patterns: RegExp[]
}

/**
 * Full subcategory map.
 * Order within each science matters — more specific patterns first.
 */
export const SUBCATEGORY_ENTRIES: SubcategoryEntry[] = [
  // ─────────────────────────────────────────────
  // ASTROLOGY
  // ─────────────────────────────────────────────
  {
    key: 'transits',
    science: 'astrology',
    responseType: 'structured_data',
    weight: 9,
    patterns: [
      /\b(transit[s]?|en transit|transits du (jour|moment|mois)|actuels? transit[s]?)\b/i,
      /\b(planetary transit|current transit|transit today|mes transits)\b/i,
    ],
  },
  {
    key: 'retrograde',
    science: 'astrology',
    responseType: 'analysis',
    weight: 9,
    patterns: [
      /\b(r[eé]trograde?|retrograde|mercure r[eé]trograde?|r[eé]trogradation)\b/i,
    ],
  },
  {
    key: 'ascendant',
    science: 'astrology',
    responseType: 'analysis',
    weight: 8,
    patterns: [
      /\b(ascendant|mon ascendant|quel est mon ascendant|rising sign|my rising|ascendant en [a-z]+)\b/i,
    ],
  },
  {
    key: 'theme_natal',
    science: 'astrology',
    responseType: 'structured_data',
    weight: 8,
    patterns: [
      /\b(th[eè]me natal|th[eè]me astral|birth chart|natal chart|carte du ciel|carte natale)\b/i,
    ],
  },
  {
    key: 'maisons',
    science: 'astrology',
    responseType: 'analysis',
    weight: 7,
    patterns: [
      /\b(maison\s*([1-9]|1[0-2]|premi[eè]re|deuxi[eè]me|troisi[eè]me|quatri[eè]me|cinqui[eè]me|sixi[eè]me|septi[eè]me|huiti[eè]me|neuvi[eè]me|dixi[eè]me|onzi[eè]me|douzi[eè]me)|house\s*([1-9]|1[0-2]))\b/i,
      /\b([0-9]+([eè]?me|[eè]?r)?\s+maison|([0-9]+)(st|nd|rd|th)\s+house)\b/i,
      /\bmes maisons\b/i,
    ],
  },
  {
    key: 'aspects',
    science: 'astrology',
    responseType: 'analysis',
    weight: 7,
    patterns: [
      /\b(aspect[s]?|conjonction|opposition astrale?|trigone|carr[eé] astral|sextile|quinconce|aspects? du (jour|moment))\b/i,
    ],
  },
  {
    key: 'planetes',
    science: 'astrology',
    responseType: 'analysis',
    weight: 6,
    patterns: [
      /\b(plan[eè]te[s]?|v[eé]nus en|mars en|jupiter en|saturne en|mercure en|neptune en|uranus en|pluton en|sun in|moon in|venus in|mars in)\b/i,
      /\bplan[eè]te dominante\b/i,
    ],
  },
  {
    key: 'signe_lunaire',
    science: 'astrology',
    responseType: 'analysis',
    weight: 7,
    patterns: [
      /\b(signe lunaire|lune en [a-z]+|lune natale|moon sign|my moon|lune dans)\b/i,
    ],
  },
  {
    key: 'signe_solaire',
    science: 'astrology',
    responseType: 'analysis',
    weight: 6,
    patterns: [
      /\b(signe solaire|signe du soleil|mon signe astro|sun sign|my sun sign|je suis [a-z]+ (astrologique)?)\b/i,
    ],
  },
  {
    key: 'compatibilite_astro',
    science: 'astrology',
    responseType: 'analysis',
    weight: 6,
    patterns: [
      /\b(synastrie|synastry|compatibilit[eé] astrale?|carte composite|composite chart)\b/i,
    ],
  },
  {
    key: 'cycle',
    science: 'astrology',
    responseType: 'analysis',
    weight: 5,
    patterns: [
      /\b(retour solaire|progressions? secondaire|cycle[s]? astral|solar return|secondary progression)\b/i,
    ],
  },
  {
    key: 'vocation_astro',
    science: 'astrology',
    responseType: 'analysis',
    weight: 5,
    patterns: [
      /\b(maison 10|mc astral|midheaven|vocation astrologique|axe vocation|axe travail|medium coeli)\b/i,
    ],
  },

  // ─────────────────────────────────────────────
  // NUMEROLOGY
  // ─────────────────────────────────────────────
  {
    key: 'annee_personnelle',
    science: 'numerology',
    responseType: 'analysis',
    weight: 9,
    patterns: [
      /\b(ann[eé]e personnelle|personal year|mon ann[eé]e num[eé]rique|ann[eé]e num[eé]ro|vibration de l.ann[eé]e)\b/i,
    ],
  },
  {
    key: 'mois_personnel',
    science: 'numerology',
    responseType: 'analysis',
    weight: 9,
    patterns: [
      /\b(mois personnel|personal month|mon mois num[eé]rique|vibration du mois)\b/i,
    ],
  },
  {
    key: 'chemin_de_vie',
    science: 'numerology',
    responseType: 'analysis',
    weight: 8,
    patterns: [
      /\b(chemin de vie|life path|chemin de vie num[eé]ro|life path number|mon chemin de vie)\b/i,
    ],
  },
  {
    key: 'expression',
    science: 'numerology',
    responseType: 'analysis',
    weight: 7,
    patterns: [
      /\b(nombre d.expression|expression number|nombre expression|vibration d.expression)\b/i,
    ],
  },
  {
    key: 'ame',
    science: 'numerology',
    responseType: 'analysis',
    weight: 7,
    patterns: [
      /\b(nombre d.[aâ]me|soul urge|nombre de l.[aâ]me|soul number|num[eé]ro d.[aâ]me)\b/i,
    ],
  },
  {
    key: 'personnalite_num',
    science: 'numerology',
    responseType: 'analysis',
    weight: 7,
    patterns: [
      /\b(nombre de personnalit[eé]s?|personality number|num[eé]ro de personnalit[eé]s?)/i,
    ],
  },
  {
    key: 'cycle_vie',
    science: 'numerology',
    responseType: 'analysis',
    weight: 6,
    patterns: [
      /\b(cycle de vie num|pinnacle|[eé]preuve num[eé]rique|ann[eé]e universelle|cycle personnel)\b/i,
    ],
  },
  {
    key: 'nom_prenom',
    science: 'numerology',
    responseType: 'analysis',
    weight: 6,
    patterns: [
      /\b(num[eé]rologie (pr[eé]nom|nom)|vibration (pr[eé]nom|nom)|numerology (name|first name))\b/i,
    ],
  },
  {
    key: 'jour_personnel',
    science: 'numerology',
    responseType: 'analysis',
    weight: 8,
    patterns: [
      /\b(jour personnel|personal day|vibration du jour|num[eé]ro du jour)\b/i,
    ],
  },

  // ─────────────────────────────────────────────
  // HUMAN DESIGN
  // ─────────────────────────────────────────────
  {
    key: 'type_hd',
    science: 'human_design',
    responseType: 'analysis',
    weight: 9,
    patterns: [
      /\b(type (human design|hd)|mon type hd|g[eé]n[eé]rateur|projecteur|manifesteur|r[eé]flecteur|manifesting generator)\b/i,
      /\b(generator|projector|manifestor|reflector)\b/i,
    ],
  },
  {
    key: 'strategie_hd',
    science: 'human_design',
    responseType: 'analysis',
    weight: 8,
    patterns: [
      /\b(strat[eé]gie hd|strategy hd|attendre la r[eé]ponse|initier|inviter attendre|attendre la lune)\b/i,
    ],
  },
  {
    key: 'autorite_hd',
    science: 'human_design',
    responseType: 'analysis',
    weight: 8,
    patterns: [
      /\b(autorit[eé] (hd|int[eé]rieure|sacrale|[eé]motionnelle|[eé]go|mentale|spl[eé]nique)|inner authority|authority hd|autorit[eé] hd)\b/i,
    ],
  },
  {
    key: 'profil_hd',
    science: 'human_design',
    responseType: 'analysis',
    weight: 8,
    patterns: [
      /\b(profil (hd|\d\/\d)|profil human design|[1-6]\/[1-6] (profil|hd)|my profile hd)\b/i,
    ],
  },
  {
    key: 'centres_hd',
    science: 'human_design',
    responseType: 'analysis',
    weight: 7,
    patterns: [
      /\b(centres?[-\s]*(hd|d[eé]finis?|ind[eé]finis?)|center\s+(defined|undefined)|solar plexus|centre sacral|gorge hd|tete hd)/i,
    ],
  },
  {
    key: 'portes_hd',
    science: 'human_design',
    responseType: 'analysis',
    weight: 7,
    patterns: [
      /\b(porte[s]?\s*\d+|gate[s]?\s*\d+|portes? hd|gates? hd|porte activ[eé]e?)\b/i,
    ],
  },
  {
    key: 'canaux_hd',
    science: 'human_design',
    responseType: 'analysis',
    weight: 7,
    patterns: [
      /\b(canal[x]? hd|channel[s]? hd|canal d[eé]fini|defined channel)\b/i,
    ],
  },
  {
    key: 'croix_incarnation',
    science: 'human_design',
    responseType: 'analysis',
    weight: 8,
    patterns: [
      /\b(croix d.incarnation|incarnation cross|ma croix hd)\b/i,
    ],
  },
  {
    key: 'definition_hd',
    science: 'human_design',
    responseType: 'analysis',
    weight: 6,
    patterns: [
      /\b(d[eé]finition (simple|double|triple|triple split|quadruple)|split definition|single definition)\b/i,
    ],
  },
  {
    key: 'transits_hd',
    science: 'human_design',
    responseType: 'structured_data',
    weight: 10,
    patterns: [
      /\b(transit[s]? hd|transit[s]? human design|hd transit[s]?|neutrino stream)/i,
    ],
  },
  {
    key: 'compatibilite_hd',
    science: 'human_design',
    responseType: 'analysis',
    weight: 6,
    patterns: [
      /\b(compatibilit[eé] hd|compatibilit[eé] human design|comparison hd|connexion hd)\b/i,
    ],
  },
  {
    // Catch-all for generic HD chart requests: "design humain", "human design", "bodygraph", "mon hd"
    // French word order "design humain" ≠ "human design" — must be explicit here.
    // Does NOT match specific subcategories (profil_hd, type_hd, etc.) to preserve their weight priority.
    // Weight kept low (4) so any specific HD subcategory match always wins on score.
    key: 'human_design_exact',
    science: 'human_design',
    responseType: 'structured_data',
    weight: 4,
    patterns: [
      /\b(design humain|human design|bodygraph|mon hd complet|mon design humain|quel est mon design|hd complet)\b/i,
      /\b(mon hd|lecture (hd|human design))\b/i,
    ],
  },

  // ─────────────────────────────────────────────
  // ENNEAGRAM
  // ─────────────────────────────────────────────
  {
    key: 'type_enn',
    science: 'enneagram',
    responseType: 'analysis',
    weight: 9,
    patterns: [
      /\b(enn[eé]agramme? type|type enn[eé]a?|type\s+[1-9]\b.*enn[eé]|enn[eé].*type\s+[1-9]\b)\b/i,
      /\b(mon type enn[eé]|enn[eé]a type [1-9]|je suis (un|une) [1-9] enn[eé])\b/i,
    ],
  },
  {
    key: 'aile_enn',
    science: 'enneagram',
    responseType: 'analysis',
    weight: 8,
    patterns: [
      /\b(aile [1-9]|wing [1-9]|mon aile enn[eé]|[1-9]w[1-9])\b/i,
    ],
  },
  {
    key: 'instinct_enn',
    science: 'enneagram',
    responseType: 'analysis',
    weight: 8,
    patterns: [
      /\b(instinct (de )?conservation|instinct social|instinct sexuel|instinct transpersonnel|self[-\s]preservation|social subtype|sexual subtype|sp\/so|so\/sx|sx\/sp)\b/i,
    ],
  },
  {
    key: 'integration_enn',
    science: 'enneagram',
    responseType: 'analysis',
    weight: 7,
    patterns: [
      /\b(int[eé]gration enn[eé]|d[eé]sint[eé]gration enn[eé]|direction de croissance enn[eé]|niveau de sant[eé] enn[eé]|health level)\b/i,
    ],
  },
  {
    key: 'desintegration_enn',
    science: 'enneagram',
    responseType: 'analysis',
    weight: 7,
    patterns: [
      /\b(d[eé]sint[eé]gration|stress point|disintegration|m[eé]canisme de d[eé]fense enn[eé])\b/i,
    ],
  },
  {
    key: 'centre_enn',
    science: 'enneagram',
    responseType: 'analysis',
    weight: 6,
    patterns: [
      /\b(centre instinctif|centre [eé]motionnel|centre mental|triades?\s+(instinctif?|[eé]motionnel|mental)|gut triad|heart triad|head triad)/i,
    ],
  },

  // ─────────────────────────────────────────────
  // KUA
  // ─────────────────────────────────────────────
  {
    key: 'nombre_kua',
    science: 'kua',
    responseType: 'analysis',
    weight: 9,
    patterns: [
      /\b(nombre kua|kua number|mon kua|mon nombre kua|kua [1-9]|num[eé]ro kua)\b/i,
    ],
  },
  {
    key: 'direction_kua',
    science: 'kua',
    responseType: 'structured_data',
    weight: 9,
    patterns: [
      /\b(direction[s]? (favorable[s]?|kua|personnelle[s]?)|mes directions kua|best direction[s]? kua|kua direction)\b/i,
    ],
  },
  {
    key: 'orientation_habitat',
    science: 'kua',
    responseType: 'structured_data',
    weight: 8,
    patterns: [
      /\b(orientation (maison|habitat|salon|chambre|logement)|kua (maison|habitat)|positionnement habitat)\b/i,
    ],
  },
  {
    key: 'orientation_bureau',
    science: 'kua',
    responseType: 'structured_data',
    weight: 8,
    patterns: [
      /\b(orientation (bureau|travail|desk)|kua (bureau|travail)|direction de travail|face [aà] quelle direction)\b/i,
    ],
  },
  {
    key: 'direction_sommeil',
    science: 'kua',
    responseType: 'structured_data',
    weight: 8,
    patterns: [
      /\b(direction (de )?sommeil|t[eê]te du lit|sleeping direction|kua (lit|sommeil)|orientation lit)\b/i,
    ],
  },
  {
    key: 'feng_shui',
    science: 'kua',
    responseType: 'analysis',
    weight: 7,
    patterns: [
      /\b(feng shui|feng[-\s]shui|[eé]nergie kua|[eé]nergies? de l.espace|ba gua|bagua)\b/i,
    ],
  },
  {
    key: 'elements_kua',
    science: 'kua',
    responseType: 'analysis',
    weight: 6,
    patterns: [
      /\b([eé]l[eé]ment (kua|feng shui)|[eé]l[eé]ment (bois|feu|terre|m[eé]tal|eau) kua)\b/i,
    ],
  },

  // ─────────────────────────────────────────────
  // HEXASTRA FUSION
  // ─────────────────────────────────────────────
  {
    key: 'lecture_fusionnee',
    science: 'hexastra_fusion',
    responseType: 'fusion_reading',
    weight: 8,
    patterns: [
      /\b(lecture fusionn[eé]e|fusion hexastra|lecture multi[-\s]sciences?|analyse fusionn[eé]e|lecture (haut|ultra) pr[eé]cis[e]?)\b/i,
    ],
  },
  {
    key: 'compatibilite_fusion',
    science: 'hexastra_fusion',
    responseType: 'fusion_reading',
    weight: 7,
    patterns: [
      /\b(compatibilit[eé] fusionn[eé]e|multi[-\s]science compat|cross[-\s]science compat)\b/i,
    ],
  },
  {
    key: 'decision_fusion',
    science: 'hexastra_fusion',
    responseType: 'fusion_reading',
    weight: 6,
    patterns: [
      /\b(aide.+(moi|me).+(d[eé]cider|choisir)|je dois choisir|je dois d[eé]cider|decision fusionn[eé]e|m.aider [aà] trancher)\b/i,
    ],
  },
  {
    key: 'timing_fusion',
    science: 'hexastra_fusion',
    responseType: 'fusion_reading',
    weight: 6,
    patterns: [
      /\b(timing fusionn[eé]|fen[eê]tre d.action|quand (agir|bouger|lancer)|meilleur moment pour)\b/i,
    ],
  },
  {
    key: 'etat_emotionnel',
    science: 'hexastra_fusion',
    responseType: 'fusion_reading',
    weight: 4,
    patterns: [
      /\b(je (me sens|suis|vis|ressens)|je (bloque|n.avance pas|tourne en rond)|je (suis|me sens) (perdu|perdue|bloqu[eé]|perturb[eé]|confus[e]?|d[eé]pass[eé]|d[eé]bord[eé]|submerg[eé]))\b/i,
    ],
  },
  {
    key: 'lecture_generale',
    science: 'hexastra_fusion',
    responseType: 'fusion_reading',
    weight: 3,
    patterns: [
      /\b(lecture g[eé]n[eé]rale|analyse g[eé]n[eé]rale|vue d.ensemble|situation globale|lecture compl[eè]te)\b/i,
    ],
  },
]

/** Group entries by science for fast lookup */
export const SUBCATEGORY_BY_SCIENCE: Record<SubcategoryScience, SubcategoryEntry[]> = {
  astrology: SUBCATEGORY_ENTRIES.filter((e) => e.science === 'astrology'),
  numerology: SUBCATEGORY_ENTRIES.filter((e) => e.science === 'numerology'),
  human_design: SUBCATEGORY_ENTRIES.filter((e) => e.science === 'human_design'),
  enneagram: SUBCATEGORY_ENTRIES.filter((e) => e.science === 'enneagram'),
  kua: SUBCATEGORY_ENTRIES.filter((e) => e.science === 'kua'),
  hexastra_fusion: SUBCATEGORY_ENTRIES.filter((e) => e.science === 'hexastra_fusion'),
}
