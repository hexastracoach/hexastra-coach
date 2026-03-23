/**
 * Deterministic multi-subcategory detector.
 * PRIORITY ABSOLUTE: subcategory > science > intent > fallback
 * No LLM — pure regex pattern matching with weight ranking.
 *
 * Supports multi-detection: all matching subcategories are returned,
 * ordered by score. Caller decides fusion vs single mode.
 */

import {
  SUBCATEGORY_ENTRIES,
  type SubcategoryEntry,
  type SubcategoryScience,
  type ResponseType,
} from './subcategoryTaxonomy'

/** A single detected subcategory match */
export type SubcategoryMatch = {
  science: SubcategoryScience
  subcategory: string
  responseType: ResponseType
  confidence: number
  score: number
}

export type DetectionAnalysisMode = 'single' | 'multi'

export type SubcategoryDetectionResult = {
  /** All matches above threshold, sorted by score descending */
  matches: SubcategoryMatch[]
  /** Highest-scoring match */
  primary: SubcategoryMatch | null
  /** All matches except primary */
  secondary: SubcategoryMatch[]
  /** 'single' if 1 match, 'multi' if 2+ — fusion upgrade happens at plan level */
  analysisMode: DetectionAnalysisMode

  // ── Backward-compat fields (alias to primary) ──
  science: SubcategoryScience | null
  subcategory: string | null
  responseType: ResponseType | null
  confidence: number
  candidates: Array<{ key: string; science: SubcategoryScience; score: number }>
}

/** Minimum confidence for a match to be included in results */
const MIN_CONFIDENCE = 0.15
const ENTRY_BY_KEY = new Map(SUBCATEGORY_ENTRIES.map((entry) => [entry.key, entry]))

function scoreEntry(entry: SubcategoryEntry, text: string): number {
  let patternHits = 0
  for (const pattern of entry.patterns) {
    if (pattern.test(text)) patternHits++
  }
  if (patternHits === 0) return 0
  return entry.weight * patternHits
}

function entryConfidence(entry: SubcategoryEntry, score: number): number {
  const maxPossibleScore = entry.weight * entry.patterns.length
  return Math.min(score / maxPossibleScore, 1)
}

function addSyntheticMatch(
  key: string,
  candidates: Array<{ key: string; science: SubcategoryScience; score: number }>,
  matchMap: Map<string, SubcategoryMatch>,
) {
  if (matchMap.has(key)) return

  const entry = ENTRY_BY_KEY.get(key)
  if (!entry) return

  const score = entry.weight
  candidates.push({ key: entry.key, science: entry.science, score })
  matchMap.set(entry.key, {
    science: entry.science,
    subcategory: entry.key,
    responseType: entry.responseType,
    confidence: entryConfidence(entry, score),
    score,
  })
}

const EMPTY_RESULT: SubcategoryDetectionResult = {
  matches: [],
  primary: null,
  secondary: [],
  analysisMode: 'single',
  science: null,
  subcategory: null,
  responseType: null,
  confidence: 0,
  candidates: [],
}

/**
 * Detect ALL subcategories present in the user's message.
 *
 * Examples:
 *   "mon ascendant et ma maison 1"  → [ascendant, maisons]
 *   "année personnelle + transits"   → [annee_personnelle, transits]
 *   "je me sens bloqué"             → [etat_emotionnel]
 */
export function detectSubcategory(text: string): SubcategoryDetectionResult {
  if (!text || !text.trim()) return EMPTY_RESULT

  const candidates: Array<{ key: string; science: SubcategoryScience; score: number }> = []
  const matchMap = new Map<string, SubcategoryMatch>()
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  const mentionsHumanDesign = /\b(human design|design humain|hd)\b/.test(normalized)
  if (mentionsHumanDesign && /\b(strategie|strategy)\b/.test(normalized)) {
    addSyntheticMatch('strategie_hd', candidates, matchMap)
  }

  const mentionsEnneagram = /\b(enneagramme|enneagram|ennea)\b/.test(normalized)
  if (mentionsEnneagram && /\bprofil\b/.test(normalized)) {
    addSyntheticMatch('type_enn', candidates, matchMap)
  }
  if (mentionsEnneagram && /\baile\b/.test(normalized)) {
    addSyntheticMatch('aile_enn', candidates, matchMap)
  }

  for (const entry of SUBCATEGORY_ENTRIES) {
    const score = scoreEntry(entry, text)
    if (score === 0) continue

    const confidence = entryConfidence(entry, score)
    if (confidence < MIN_CONFIDENCE) continue

    candidates.push({ key: entry.key, science: entry.science, score })
    matchMap.set(entry.key, {
      science: entry.science,
      subcategory: entry.key,
      responseType: entry.responseType,
      confidence,
      score,
    })
  }

  if (candidates.length === 0) return EMPTY_RESULT

  // Sort by score desc, then by entry weight as tie-breaker
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    const wa = SUBCATEGORY_ENTRIES.find((e) => e.key === a.key)?.weight ?? 0
    const wb = SUBCATEGORY_ENTRIES.find((e) => e.key === b.key)?.weight ?? 0
    return wb - wa
  })

  const matches = candidates.map((c) => matchMap.get(c.key)!)
  const [primary, ...secondary] = matches

  if (matches.length > 1) {
    console.log(
      'SUBCATEGORY MULTI DETECTED:',
      matches.map((m) => `${m.subcategory}(${m.science}, conf=${m.confidence.toFixed(2)})`).join(' | '),
    )
  } else {
    console.log(
      'SUBCATEGORY DETECTED:',
      primary.subcategory,
      '| science:',
      primary.science,
      '| score:',
      primary.score,
      '| confidence:',
      primary.confidence.toFixed(2),
    )
  }

  return {
    matches,
    primary,
    secondary,
    analysisMode: matches.length >= 2 ? 'multi' : 'single',
    // backward-compat
    science: primary.science,
    subcategory: primary.subcategory,
    responseType: primary.responseType,
    confidence: primary.confidence,
    candidates,
  }
}

/**
 * Detect only the dominant science (not subcategory).
 * Lightweight helper for fallback paths.
 */
export function detectScienceFromText(text: string): SubcategoryScience | null {
  const result = detectSubcategory(text)
  if (!result.primary || result.primary.confidence < 0.2) return null
  console.log('SCIENCE DETECTED:', result.primary.science)
  return result.primary.science
}
