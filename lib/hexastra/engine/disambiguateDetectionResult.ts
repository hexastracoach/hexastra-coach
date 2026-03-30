import type { ScienceDetectionResult } from '@/lib/hexastra/engine/scienceQueryBuilder'
import {
  SCIENCE_SUBCATEGORY_INDEX,
  type Science,
} from '@/lib/hexastra/taxonomy/scienceTaxonomy'

export type DetectionDisambiguationContext = {
  hasBirthData?: boolean
  domainRoute?: string | null
  selectedScience?: string | null
  selectedSubCategory?: string | null
  previousScience?: string | null
  flowType?: string | null
}

export type DetectionAmbiguity = {
  term: string
  candidates: string[]
  resolvedTo: string | null
  reason: string
}

export type DisambiguatedDetectionResult = {
  prioritizedSciences: Science[]
  prioritizedSubCategories: string[]
  ambiguities: DetectionAmbiguity[]
  dominantScience: Science | null
  dominantSubCategory: string | null
  subCategoryBoosts: Record<string, number>
}

const AMBIGUOUS_SEED_SCORE = 2.2
const RESOLVED_TERM_BOOST = 3.2
const AMBIGUOUS_TERM_BOOST = 0.85
const CONTEXT_SCIENCE_BOOST = 1.6
const CONTEXT_SUBCATEGORY_BOOST = 2.4
const BIRTH_DATA_TIMING_BOOST = 0.45
const DOMINANT_SUBCATEGORY_MARGIN = 1.35
const DOMINANT_SCIENCE_MARGIN = 1.75

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function hasPhrase(query: string, phrase: string): boolean {
  return new RegExp(`(^|\\s)${escapeRegExp(phrase)}(?=\\s|$)`).test(query)
}

function hasAnyPhrase(query: string, phrases: readonly string[]): boolean {
  return phrases.some((phrase) => hasPhrase(query, phrase))
}

function uniq<T>(values: T[]): T[] {
  return [...new Set(values)]
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function normalizeScience(value: string | null | undefined): Science | null {
  switch (value) {
    case 'astro':
    case 'numerology':
    case 'human_design':
    case 'enneagram':
    case 'kua':
    case 'fusion':
      return value
    case 'gps_kua':
      return 'kua'
    default:
      return null
  }
}

function getSubCategoryScience(subCategory: string): Science | null {
  return SCIENCE_SUBCATEGORY_INDEX[subCategory]?.science ?? null
}

function getDirectMatchScore(detection: ScienceDetectionResult, subCategory: string): number {
  return detection.matches.find((match) => match.subCategory === subCategory)?.score ?? 0
}

function seedSubCategoryScore(
  scoreMap: Map<string, number>,
  detection: ScienceDetectionResult,
  subCategory: string,
  seed = AMBIGUOUS_SEED_SCORE,
): void {
  const directScore = getDirectMatchScore(detection, subCategory)
  const candidateScore =
    directScore > 0
      ? directScore
      : detection.subCategories.includes(subCategory)
        ? seed + 0.35
        : seed

  scoreMap.set(subCategory, Math.max(scoreMap.get(subCategory) ?? 0, candidateScore))
}

function addSubCategoryBoost(
  scoreMap: Map<string, number>,
  boostMap: Record<string, number>,
  detection: ScienceDetectionResult,
  subCategory: string,
  boost: number,
): void {
  seedSubCategoryScore(scoreMap, detection, subCategory)
  scoreMap.set(subCategory, (scoreMap.get(subCategory) ?? 0) + boost)
  boostMap[subCategory] = Number(((boostMap[subCategory] ?? 0) + boost).toFixed(2))
}

function resolveTopCandidate(scoreMap: Map<string, number>, candidates: readonly string[]): string | null {
  const ranked = candidates
    .map((candidate) => ({
      candidate,
      score: scoreMap.get(candidate) ?? 0,
    }))
    .sort((a, b) => b.score - a.score)

  if (!ranked[0] || ranked[0].score <= 0) {
    return null
  }

  if (!ranked[1] || ranked[0].score >= ranked[1].score + DOMINANT_SUBCATEGORY_MARGIN) {
    return ranked[0].candidate
  }

  return null
}

type AmbiguityRuleParams = {
  detection: ScienceDetectionResult
  scoreMap: Map<string, number>
  boostMap: Record<string, number>
  ambiguities: DetectionAmbiguity[]
  contextScience: Science | null
  contextSubCategory: string | null
  markers: ReturnType<typeof buildMarkerSet>
}

function registerAmbiguity(params: {
  term: string
  candidates: string[]
  resolvedTo: string | null
  reason: string
  ambiguities: DetectionAmbiguity[]
}): void {
  params.ambiguities.push({
    term: params.term,
    candidates: uniq(params.candidates),
    resolvedTo: params.resolvedTo,
    reason: params.reason,
  })
}

function buildMarkerSet(query: string) {
  return {
    type: hasPhrase(query, 'type'),
    profil: hasAnyPhrase(query, ['profil', 'profile']),
    cycle: hasPhrase(query, 'cycle'),
    energie: hasPhrase(query, 'energie'),
    direction: hasAnyPhrase(query, ['direction', 'directions', 'orientation']),
    retour: hasAnyPhrase(query, ['retour', 'return']),
    compatibilite: hasPhrase(query, 'compatibilite'),
    now: hasAnyPhrase(query, ['en ce moment', 'maintenant', 'actuel', 'actuelle']),
    genericSituation: hasAnyPhrase(query, [
      'que se passe t il',
      'que se passe',
      'ce que je traverse',
      'pour moi en ce moment',
    ]),
    hd: hasAnyPhrase(query, [
      'hd',
      'human design',
      'bodygraph',
      'autorite',
      'strategie',
      'canaux',
      'gates',
      'portes',
      'sacral',
      'projecteur',
      'generateur',
      'reflecteur',
      'manifesteur',
    ]),
    ennea: hasAnyPhrase(query, [
      'enneagramme',
      'ennea',
      'aile',
      'wing',
      'instinct',
    ]),
    astro: hasAnyPhrase(query, [
      'astro',
      'astrologie',
      'theme natal',
      'signe',
      'ascendant',
      'transit',
      'transits',
      'solaire',
      'lunaire',
      'saturne',
      'jupiter',
      'nodal',
      'progression',
      'progressions',
    ]),
    numerology: hasAnyPhrase(query, [
      'numerologie',
      'annee perso',
      'annee personnelle',
      'mois perso',
      'jour perso',
      'chemin de vie',
      'cycle de vie',
    ]),
    kua: hasAnyPhrase(query, [
      'kua',
      'feng shui',
      'direction favorable',
      'directions favorables',
      'orientation',
      'lit',
      'bureau',
      'habitat',
      'maison',
      'porte',
    ]),
    relationship: hasAnyPhrase(query, [
      'compatibilite',
      'relation',
      'relations',
      'couple',
      'amour',
      'ensemble',
      'nos',
    ]),
    decision: hasAnyPhrase(query, [
      'decision',
      'choix',
      'dois je',
      'que faire',
      'quelle direction',
    ]),
    favorableDirection: hasAnyPhrase(query, [
      'direction favorable',
      'directions favorables',
      'bonne direction',
      'orientation favorable',
    ]),
  }
}

function applyContextPreference(params: AmbiguityRuleParams): void {
  if (params.contextScience) {
    for (const subCategory of params.detection.subCategories) {
      if (getSubCategoryScience(subCategory) === params.contextScience) {
        addSubCategoryBoost(
          params.scoreMap,
          params.boostMap,
          params.detection,
          subCategory,
          CONTEXT_SCIENCE_BOOST,
        )
      }
    }
  }

  if (params.contextSubCategory) {
    addSubCategoryBoost(
      params.scoreMap,
      params.boostMap,
      params.detection,
      params.contextSubCategory,
      CONTEXT_SUBCATEGORY_BOOST,
    )
  }
}

function applyTypeRule(params: AmbiguityRuleParams): void {
  if (!params.markers.type) return

  const candidates = ['hd_type', 'ennea_type_core']
  let resolvedTo: string | null = null
  let reason = 'Type generique sans marqueur de science fort.'

  if (params.markers.hd || params.contextScience === 'human_design' || params.contextSubCategory === 'hd_type') {
    resolvedTo = 'hd_type'
    reason = 'Marqueur Human Design explicite ou contexte deja oriente HD.'
  } else if (params.markers.ennea || params.contextScience === 'enneagram') {
    resolvedTo = 'ennea_type_core'
    reason = 'Marqueur ennea explicite dans la requete.'
  }

  for (const candidate of candidates) {
    addSubCategoryBoost(
      params.scoreMap,
      params.boostMap,
      params.detection,
      candidate,
      candidate === resolvedTo ? RESOLVED_TERM_BOOST : AMBIGUOUS_TERM_BOOST,
    )
  }

  registerAmbiguity({
    term: 'type',
    candidates,
    resolvedTo,
    reason,
    ambiguities: params.ambiguities,
  })
}

function applyProfileRule(params: AmbiguityRuleParams): void {
  if (!params.markers.profil) return

  const candidates = ['hd_profile', 'num_core_profile', 'kua_profile']
  let resolvedTo: string | null = null
  let reason = 'Profil generique pouvant renvoyer a plusieurs sciences.'

  if (params.markers.hd || params.contextScience === 'human_design') {
    resolvedTo = 'hd_profile'
    reason = 'Profil explicite Human Design.'
  } else if (params.markers.numerology || params.contextScience === 'numerology') {
    resolvedTo = 'num_core_profile'
    reason = 'Profil explicite numerologie.'
  } else if (params.markers.kua || params.contextScience === 'kua') {
    resolvedTo = 'kua_profile'
    reason = 'Profil explicite Kua / feng shui.'
  }

  for (const candidate of candidates) {
    addSubCategoryBoost(
      params.scoreMap,
      params.boostMap,
      params.detection,
      candidate,
      candidate === resolvedTo ? RESOLVED_TERM_BOOST : AMBIGUOUS_TERM_BOOST,
    )
  }

  registerAmbiguity({
    term: 'profil',
    candidates,
    resolvedTo,
    reason,
    ambiguities: params.ambiguities,
  })
}

function applyCycleRule(params: AmbiguityRuleParams): void {
  if (!params.markers.cycle) return

  let candidates = ['fusion_timing', 'astro_transits_current', 'num_personal_year', 'hd_current_cycle']
  let resolvedTo: string | null = null
  let reason = 'Cycle / periode du moment sans science explicite.'

  if (params.markers.astro || params.markers.retour) {
    resolvedTo = hasAnyPhrase(params.detection.normalizedQuery, ['retour solaire', 'solar return'])
      ? 'astro_solar_return'
      : hasAnyPhrase(params.detection.normalizedQuery, ['retour lunaire', 'lunar return'])
        ? 'astro_lunar_return'
        : hasAnyPhrase(params.detection.normalizedQuery, ['retour de saturne', 'saturn return'])
          ? 'astro_saturn_return'
          : 'astro_transits_current'
    candidates = uniq([...candidates, resolvedTo])
    reason = 'Le vocabulaire astrologique oriente le cycle vers un signal astro.'
  } else if (params.markers.hd || params.contextScience === 'human_design') {
    resolvedTo = 'hd_current_cycle'
    reason = 'Le vocabulaire Human Design oriente vers le cycle HD.'
  } else if (params.markers.numerology || params.contextScience === 'numerology') {
    resolvedTo = 'num_personal_year'
    reason = 'Le vocabulaire numerologique oriente vers les cycles numerologiques.'
  }

  for (const candidate of candidates) {
    addSubCategoryBoost(
      params.scoreMap,
      params.boostMap,
      params.detection,
      candidate,
      candidate === resolvedTo ? RESOLVED_TERM_BOOST : AMBIGUOUS_TERM_BOOST,
    )
  }

  registerAmbiguity({
    term: 'cycle',
    candidates,
    resolvedTo,
    reason,
    ambiguities: params.ambiguities,
  })
}

function applyDirectionRule(params: AmbiguityRuleParams): void {
  if (!params.markers.direction) return

  let candidates = ['fusion_decision', 'kua_favorable_directions']
  let resolvedTo: string | null = null
  let reason = 'Direction peut etre spatiale (Kua) ou decisionnelle.'

  if (params.markers.favorableDirection || params.markers.kua || params.contextScience === 'kua') {
    resolvedTo =
      hasAnyPhrase(params.detection.normalizedQuery, ['lit', 'orientation du lit', 'direction du lit'])
        ? 'kua_bed_orientation'
        : hasAnyPhrase(params.detection.normalizedQuery, ['bureau', 'orientation du bureau', 'direction bureau'])
          ? 'kua_desk_orientation'
          : 'kua_favorable_directions'
    candidates = uniq([...candidates, resolvedTo])
    reason = 'Le vocabulaire spatial oriente vers une lecture Kua.'
  } else if (params.markers.decision) {
    resolvedTo = 'fusion_decision'
    reason = 'Le vocabulaire de choix oriente vers une direction de decision.'
  }

  for (const candidate of candidates) {
    addSubCategoryBoost(
      params.scoreMap,
      params.boostMap,
      params.detection,
      candidate,
      candidate === resolvedTo ? RESOLVED_TERM_BOOST : AMBIGUOUS_TERM_BOOST,
    )
  }

  registerAmbiguity({
    term: 'direction',
    candidates,
    resolvedTo,
    reason,
    ambiguities: params.ambiguities,
  })
}

function applyReturnRule(params: AmbiguityRuleParams): void {
  if (!params.markers.retour) return

  let candidates = ['astro_solar_return', 'astro_lunar_return', 'astro_saturn_return', 'hd_return_reading']
  let resolvedTo: string | null = null
  let reason = 'Retour peut renvoyer a plusieurs familles de cycles.'

  if (params.markers.hd || params.contextScience === 'human_design') {
    resolvedTo = 'hd_return_reading'
    reason = 'Le contexte Human Design oriente vers les grands retours HD.'
  } else if (hasAnyPhrase(params.detection.normalizedQuery, ['saturne', 'saturn'])) {
    resolvedTo = 'astro_saturn_return'
    reason = 'Retour specifie par Saturne.'
  } else if (hasAnyPhrase(params.detection.normalizedQuery, ['solaire', 'solar'])) {
    resolvedTo = 'astro_solar_return'
    reason = 'Retour specifie comme solaire.'
  } else if (hasAnyPhrase(params.detection.normalizedQuery, ['lunaire', 'lunar'])) {
    resolvedTo = 'astro_lunar_return'
    reason = 'Retour specifie comme lunaire.'
  }

  for (const candidate of candidates) {
    addSubCategoryBoost(
      params.scoreMap,
      params.boostMap,
      params.detection,
      candidate,
      candidate === resolvedTo ? RESOLVED_TERM_BOOST : AMBIGUOUS_TERM_BOOST,
    )
  }

  registerAmbiguity({
    term: 'retour',
    candidates,
    resolvedTo,
    reason,
    ambiguities: params.ambiguities,
  })
}

function applyCompatibilityRule(params: AmbiguityRuleParams): void {
  if (!params.markers.compatibilite) return

  const candidates = [
    'astro_synastry',
    'hd_connection_dynamics',
    'num_relationship_compatibility',
    'ennea_relationship_dynamics',
    'kua_relationship_match',
  ]
  let resolvedTo: string | null = null
  let reason = 'Compatibilite relationnelle sans science explicite.'

  if (params.markers.astro || params.contextScience === 'astro') {
    resolvedTo = 'astro_synastry'
    reason = 'Compatibilite avec vocabulaire astro.'
  } else if (params.markers.hd || params.contextScience === 'human_design') {
    resolvedTo = 'hd_connection_dynamics'
    reason = 'Compatibilite avec vocabulaire Human Design.'
  } else if (params.markers.numerology || params.contextScience === 'numerology') {
    resolvedTo = 'num_relationship_compatibility'
    reason = 'Compatibilite avec vocabulaire numerologique.'
  } else if (params.markers.ennea || params.contextScience === 'enneagram') {
    resolvedTo = 'ennea_relationship_dynamics'
    reason = 'Compatibilite avec vocabulaire ennea.'
  } else if (params.markers.kua || params.contextScience === 'kua') {
    resolvedTo = 'kua_relationship_match'
    reason = 'Compatibilite avec vocabulaire Kua.'
  }

  for (const candidate of candidates) {
    addSubCategoryBoost(
      params.scoreMap,
      params.boostMap,
      params.detection,
      candidate,
      candidate === resolvedTo ? RESOLVED_TERM_BOOST : AMBIGUOUS_TERM_BOOST,
    )
  }

  registerAmbiguity({
    term: 'compatibilite',
    candidates,
    resolvedTo,
    reason,
    ambiguities: params.ambiguities,
  })
}

function applyEnergyRule(params: AmbiguityRuleParams): void {
  if (!params.markers.energie && !params.markers.genericSituation) return

  const candidates = ['fusion_energy_state', 'astro_transits_current', 'hd_current_transits']
  let resolvedTo: string | null = null

  if (params.markers.hd || params.contextScience === 'human_design') {
    resolvedTo = 'hd_current_transits'
  } else if (params.markers.astro || (params.markers.now && params.markers.genericSituation)) {
    resolvedTo = 'astro_transits_current'
  } else if (params.markers.energie) {
    resolvedTo = 'fusion_energy_state'
  }

  for (const candidate of candidates) {
    addSubCategoryBoost(
      params.scoreMap,
      params.boostMap,
      params.detection,
      candidate,
      candidate === resolvedTo ? RESOLVED_TERM_BOOST - 0.8 : AMBIGUOUS_TERM_BOOST - 0.2,
    )
  }
}

function applyPresentMomentRule(params: AmbiguityRuleParams): void {
  if (!params.markers.genericSituation && !params.markers.now) return

  addSubCategoryBoost(params.scoreMap, params.boostMap, params.detection, 'fusion_general', 1.8)
  addSubCategoryBoost(params.scoreMap, params.boostMap, params.detection, 'fusion_timing', 1.2)
  addSubCategoryBoost(params.scoreMap, params.boostMap, params.detection, 'astro_transits_current', 1)

  if (params.markers.now) {
    addSubCategoryBoost(params.scoreMap, params.boostMap, params.detection, 'num_personal_year', 0.65)
  }
}

function applyBirthDataTimingBoost(params: AmbiguityRuleParams): void {
  if (!params.markers.now && !params.markers.cycle && !params.markers.retour) {
    return
  }

  for (const subCategory of [
    'astro_transits_current',
    'astro_solar_return',
    'astro_lunar_return',
    'hd_current_cycle',
    'hd_return_reading',
    'num_personal_year',
  ]) {
    addSubCategoryBoost(
      params.scoreMap,
      params.boostMap,
      params.detection,
      subCategory,
      BIRTH_DATA_TIMING_BOOST,
    )
  }
}

function computeScienceScores(
  scoreMap: Map<string, number>,
  contextScience: Science | null,
): Map<Science, number> {
  const scienceScores = new Map<Science, number>()

  for (const [subCategory, score] of scoreMap.entries()) {
    const science = getSubCategoryScience(subCategory)
    if (!science) continue
    scienceScores.set(science, (scienceScores.get(science) ?? 0) + score)
  }

  if (contextScience) {
    scienceScores.set(
      contextScience,
      (scienceScores.get(contextScience) ?? 0) + CONTEXT_SCIENCE_BOOST,
    )
  }

  return scienceScores
}

function toRankedValues<T extends string>(
  entries: Array<{ value: T; score: number }>,
): T[] {
  return entries
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.value)
}

export function disambiguateDetectionResult(
  detection: ScienceDetectionResult,
  context?: DetectionDisambiguationContext,
): DisambiguatedDetectionResult {
  const scoreMap = new Map<string, number>()
  const boostMap: Record<string, number> = {}
  const ambiguities: DetectionAmbiguity[] = []

  for (const match of detection.matches) {
    scoreMap.set(match.subCategory, match.score)
  }

  for (const subCategory of detection.subCategories) {
    seedSubCategoryScore(scoreMap, detection, subCategory, AMBIGUOUS_SEED_SCORE + 0.2)
  }

  const contextScience =
    normalizeScience(context?.selectedScience) ??
    normalizeScience(context?.previousScience) ??
    normalizeScience(context?.domainRoute) ??
    null
  const contextSubCategory = context?.selectedSubCategory ?? null
  const markers = buildMarkerSet(detection.normalizedQuery)

  const baseParams: AmbiguityRuleParams = {
    detection,
    scoreMap,
    boostMap,
    ambiguities,
    contextScience,
    contextSubCategory,
    markers,
  }

  applyContextPreference(baseParams)
  applyTypeRule(baseParams)
  applyProfileRule(baseParams)
  applyCycleRule(baseParams)
  applyDirectionRule(baseParams)
  applyReturnRule(baseParams)
  applyCompatibilityRule(baseParams)
  applyEnergyRule(baseParams)
  applyPresentMomentRule(baseParams)

  if (context?.hasBirthData) {
    applyBirthDataTimingBoost(baseParams)
  }

  const prioritizedSubCategories = toRankedValues(
    [...scoreMap.entries()].map(([value, score]) => ({ value, score })),
  ).slice(0, 12)

  const scienceScores = computeScienceScores(scoreMap, contextScience)
  const prioritizedSciences = toRankedValues(
    [...scienceScores.entries()].map(([value, score]) => ({ value, score })),
  )
  const hasUnresolvedAmbiguity = ambiguities.some((entry) => entry.resolvedTo === null)

  const dominantSubCategory = resolveTopCandidate(scoreMap, prioritizedSubCategories.slice(0, 5))
  const rankedSciences = [...scienceScores.entries()]
    .map(([science, score]) => ({ science, score }))
    .sort((a, b) => b.score - a.score)
  const dominantScience =
    !hasUnresolvedAmbiguity &&
    rankedSciences[0] &&
    (!rankedSciences[1] || rankedSciences[0].score >= rankedSciences[1].score + DOMINANT_SCIENCE_MARGIN)
      ? rankedSciences[0].science
      : null

  return {
    prioritizedSciences: prioritizedSciences.length > 0 ? prioritizedSciences : ['fusion'],
    prioritizedSubCategories:
      prioritizedSubCategories.length > 0 ? prioritizedSubCategories : ['fusion_general'],
    ambiguities,
    dominantScience,
    dominantSubCategory:
      !hasUnresolvedAmbiguity &&
      dominantSubCategory && prioritizedSubCategories.includes(dominantSubCategory)
        ? dominantSubCategory
        : null,
    subCategoryBoosts: Object.fromEntries(
      Object.entries(boostMap).map(([subCategory, boost]) => [
        subCategory,
        Number(clamp(boost, 0, 8).toFixed(2)),
      ]),
    ),
  }
}
