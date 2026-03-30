/**
 * scienceQueryBuilder — Hexastra Coach
 *
 * Construit des requêtes enrichies pour le vector store, ciblées par science
 * selon l'intent utilisateur.
 *
 * USAGE :
 *   - buildEnrichedRetrievalQuery() — enrichit la requête existante sans appel supplémentaire
 *   - buildScienceQuerySet()        — produit un set de requêtes par science (pour future expansion)
 *
 * Aucun appel API supplémentaire — enrichissement du querySuffix uniquement.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type ScienceKey = 'astrology' | 'human_design' | 'numerology' | 'enneagram' | 'kua'

export type ScienceQuerySet = Partial<Record<ScienceKey, string>> & {
  ks_fusion: string
}

// ── Termes de base par science ────────────────────────────────────────────────

const SCIENCE_BASE_TERMS: Record<ScienceKey, string> = {
  astrology:    'astrologie cycles transits thème natal phases planétaires fenêtres temporelles',
  human_design: 'human design type autorité stratégie centres canaux portes décision',
  numerology:   'numérologie chemin de vie année personnelle mois personnel cycle',
  enneagram:    'ennéagramme type mécanisme pattern comportemental aile déclencheur',
  kua:          'kua directions favorables feng shui orientation nombre énergie',
}

// ── Enrichissement par intent ─────────────────────────────────────────────────

const INTENT_ENRICHMENT: Record<string, Partial<Record<ScienceKey, string>>> = {
  timing_decision: {
    astrology:    'fenêtre astrologicale timing période favorable transits action planètes cycle actuel',
    human_design: 'timing autorité sacrale attendre répondre générateur signal corporel décision',
    numerology:   'année 5 changement rupture cycle transition timing libération mobilité',
    enneagram:    'résistance décision peur mécanisme de blocage changement hésitation',
  },
  behavior_change: {
    human_design: 'conditionnement déconditionnement non-soi autorité type stratégie pattern',
    enneagram:    'déclencheur comportemental rechute pattern automatique addiction habitude type',
    astrology:    'Saturne habitudes Lune comportement cycles récurrents résistance',
    numerology:   'cycle 4 fondation 7 introspection 9 libération levier changement',
    kua:          'environnement direction habitat stabilisation énergie recharge',
  },
  relationship: {
    astrology:    'synastrie Vénus Mars 7e maison 5e maison relations dynamiques attractivité',
    human_design: 'profil type relation autorité émotionnelle réceptivité interaction',
    enneagram:    'dynamiques relationnelles type compatibilité mécanisme interpersonnel couple',
  },
  love: {
    astrology:    'Vénus synastrie 5e maison 7e maison relations amoureuses attirance',
    human_design: 'autorité émotionnelle profil réceptivité relation type',
    enneagram:    'besoins relationnels type peur amour dépendance attachement',
  },
  decision: {
    human_design: 'autorité décision type stratégie attendre répondre trancher',
    astrology:    'transits Mercure périodes favorables décision Jupiter Saturn timing',
    numerology:   'cycle décision période propice chemin de vie levier',
  },
  work_money: {
    astrology:    'Saturne 2e maison 10e maison carrière argent cycles vocation Soleil',
    human_design: 'type profil travail stratégie vocation canaux manifestation',
    numerology:   'expression chemin de vie vocation argent cycles travail 8 abondance',
  },
  career_guidance: {
    astrology:    'metier vocation milieu du ciel maison 10 maison 6 mercure mars saturne orientation professionnelle',
    human_design: 'type profil strategie autorite travail compatible contribution environnement professionnel centres definis',
    numerology:   'chemin de vie expression annee personnelle voie professionnelle vocation metier compatible',
    enneagram:    'type de travail style professionnel peur de l echec posture au travail',
    kua:          'element kua directions favorables bureau environnement professionnel',
  },
  inner_state: {
    human_design: 'non-soi autorité intérieure type fonctionnement centres ouverts conditioning',
    enneagram:    'type état intérieur motivation peur désir profond intégration',
    astrology:    'Lune Soleil Saturne état émotionnel cycles intérieurs introspection',
  },
  blocage: {
    human_design: 'non-soi conditionnement pattern résistance centres ouverts stratégie',
    enneagram:    'pattern mécanisme peur blocage type 4 5 6 résistance automatique',
    astrology:    'Saturne aspects difficiles opposition carrés blocage karma',
    numerology:   'chemin de vie défis cycles tension karmes',
  },
  identity: {
    human_design: 'type profil croix incarnation centres définis identité vie',
    enneagram:    'type core essence identité profonde désir peur motivation',
    astrology:    'Soleil Maison 1 ascendant identité expression Lune',
    numerology:   'chemin de vie expression identité vocation',
  },
}

// ── API publique ──────────────────────────────────────────────────────────────

/**
 * Enrichit une requête de base avec les termes scientifiques pertinents
 * pour l'intent détecté.
 *
 * N'ajoute PAS d'appel API supplémentaire — améliore uniquement le querySuffix
 * passé à multiLayerRetrieval.
 */
export function buildEnrichedRetrievalQuery(input: {
  baseQuery: string
  intent: string
  flowType?: string
}): string {
  const enrichment = INTENT_ENRICHMENT[input.intent]
  if (!enrichment) return input.baseQuery

  // Prioriser les 3 sciences les plus pertinentes pour cet intent
  const topTerms = Object.values(enrichment)
    .slice(0, 3)
    .join(' ')
    .split(' ')
    .filter((t, i, arr) => arr.indexOf(t) === i) // dedupe
    .slice(0, 20)
    .join(' ')

  return `${input.baseQuery} ${topTerms}`.trim()
}

/**
 * Produit un set de requêtes ciblées par science.
 * Prévu pour une future expansion multi-appels (non utilisé actuellement).
 */
export function buildScienceQuerySet(input: {
  userMessage: string
  intent: string
  flowType?: 'timing_strategic' | 'behavior' | 'standard'
}): ScienceQuerySet {
  const { userMessage, intent } = input
  const enrichment = INTENT_ENRICHMENT[intent] ?? {}

  const result: Partial<Record<ScienceKey, string>> = {}

  for (const [science, baseTerms] of Object.entries(SCIENCE_BASE_TERMS) as [ScienceKey, string][]) {
    const extra = enrichment[science] ?? ''
    result[science] = `${userMessage} ${baseTerms}${extra ? ' ' + extra : ''}`.trim()
  }

  return {
    ...result,
    ks_fusion: `${userMessage} KS.FUSION.V13 ${intent} signaux fusion arbitrage pipeline`,
  }
}

/**
 * Retourne les sciences prioritaires pour un intent donné.
 * Utilisé pour informer l'extracteur de signaux sur quelles sciences valoriser.
 */
export function getPrioritySciencesForIntent(intent: string): ScienceKey[] {
  const PRIORITY_MAP: Record<string, ScienceKey[]> = {
    timing_decision:  ['astrology', 'human_design', 'numerology', 'enneagram'],
    behavior_change:  ['human_design', 'enneagram', 'astrology', 'numerology'],
    relationship:     ['astrology', 'human_design', 'enneagram'],
    love:             ['astrology', 'human_design', 'enneagram'],
    decision:         ['human_design', 'astrology', 'numerology'],
    career_guidance:  ['human_design', 'astrology', 'numerology', 'enneagram', 'kua'],
    work_money:       ['astrology', 'numerology', 'human_design'],
    inner_state:      ['human_design', 'enneagram', 'astrology'],
    blocage:          ['human_design', 'enneagram', 'astrology'],
    identity:         ['human_design', 'enneagram', 'astrology', 'numerology'],
    timing:           ['astrology', 'numerology', 'human_design'],
  }
  return PRIORITY_MAP[intent] ?? ['astrology', 'human_design', 'numerology']
}
