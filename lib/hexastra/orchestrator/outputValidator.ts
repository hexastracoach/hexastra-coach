/**
 * @module outputValidator
 *
 * Calibration tools for the KS.FUSION.V13 mission.
 *
 * This module is NOT part of the production response flow.
 * It is designed exclusively for test harnesses and calibration pipelines,
 * allowing quality measurement, arbiter alignment checks, and sentinel drift
 * detection on generated outputs before they are promoted to production.
 *
 * Functions:
 *  - validateFinalOutputQuality: scores a final response against a set of structural checks
 *  - compareArbiterToFinalOutput: measures alignment between KsArbiter decisions and final output
 *  - measureSentinelDrift: detects regression between a reference (pre) and a candidate (post) text
 */

import type { KsArbiterResult } from './ksArbiter'
import type { KsAnswerStrategy } from './fusionEngine'
import { detectVagueOutput } from '../guards/hallucinationGuard'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OutputValidationContext = {
  intent?: string
  answerStrategy?: KsAnswerStrategy
  responseMode?: string
  narrativeFocus?: string
}

export type OutputValidationResult = {
  valid: boolean
  score: number // 0-100
  checks: {
    hasAction: boolean
    hasTimingMarker: boolean | null // null when not required (non timing_strategic)
    noVaguePhrases: boolean
    hasDominantLine: boolean
    noStrategyContradiction: boolean
  }
  vaguePhrasesFound: string[]
  issues: string[]
  warnings: string[]
}

export type ArbiterAlignmentResult = {
  aligned: boolean
  alignmentScore: number // 0-100
  driftReasons: string[]
  suggestions: string[]
}

export type SentinelDriftResult = {
  driftDetected: boolean
  driftScore: number // 0-100 — 0 = no drift, 100 = total drift
  dimensions: {
    clarityLoss: boolean
    precisionLoss: boolean
    actionLoss: boolean
    expansionGain: boolean // unwanted LLM expansion
  }
  details: string[]
}

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

const ACTION_VERBS = [
  'agis',
  'décide',
  'décider',
  'commence',
  'commencer',
  'arrête',
  'arrêter',
  'pose',
  'poser',
  'identifie',
  'identifier',
  'observe',
  'observer',
  'attends',
  'fais',
  'prends',
  'évite',
  'éviter',
  'agir',
  'stopper',
  'choisir',
  'lancer',
  'initier',
  'engager',
  'confronter',
  'nommer',
]

const TIMING_MARKERS = [
  'maintenant',
  'dans les',
  'prochaine',
  'ce mois',
  'cette semaine',
  "d'ici",
  'avant le',
  'après le',
  'quand',
  'dès que',
  'le bon moment',
  'fenêtre',
  'cycle actuel',
  'phase actuelle',
]

const STOPWORDS = new Set([
  'le', 'la', 'les', 'de', 'du', 'des', 'et', 'ou', 'que',
  'qui', 'dans', 'pour', 'pas', 'une', 'un', 'sur', 'avec', 'par',
])

const UNCERTAINTY_WORDS = [
  'peut-être',
  'il est possible',
  'parfois',
  'éventuellement',
  'il se peut',
  'potentiellement',
  'possiblement',
  'en quelque sorte',
]

const DRIFT_ACTION_VERBS = [
  'agis',
  'décide',
  'commence',
  'arrête',
  'pose',
  'fais',
  'prends',
  'évite',
  'lancer',
  'initier',
]

const STRATEGY_KEYWORDS: Record<KsAnswerStrategy, string[]> = {
  action: ['agir', 'action', 'concrète', 'maintenant', 'décide', 'lancer', 'engager', 'fais'],
  prudence: ['prudence', 'attends', 'risque', 'précipiter', 'évite', 'danger', 'attention', 'piège'],
  observation: ['observer', 'clarifier', 'attendre', 'tension', 'contradictoire', 'voir venir', 'laisser'],
  stabilisation: ['ancrer', 'stabiliser', 'consolider', 'poser', 'base', 'fondation', 'maintenir'],
}

const STRATEGY_CONTRADICTIONS: Partial<Record<KsAnswerStrategy, string[]>> = {
  action: ["ne pas agir", "ne décide pas", "attends encore", "patience absolue", "ne fonce pas"],
  prudence: ["fonce maintenant", "agis immédiatement", "n'attends pas une seconde", "sans attendre"],
  observation: ["agis tout de suite", "décide maintenant"],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractKeywords(text: string): string[] {
  return text
    .split(/\s+/)
    .map(w => w.toLowerCase().replace(/[^a-zàâäéèêëîïôùûüçœæ'-]/g, ''))
    .filter(w => w.length > 5 && !STOPWORDS.has(w))
}

function countUncertainty(text: string): number {
  const lower = text.toLowerCase()
  return UNCERTAINTY_WORDS.reduce((count, phrase) => {
    let pos = 0
    let found = 0
    while ((pos = lower.indexOf(phrase, pos)) !== -1) {
      found++
      pos += phrase.length
    }
    return count + found
  }, 0)
}

function countActionVerbs(text: string, verbs: string[]): number {
  const lower = text.toLowerCase()
  return verbs.reduce((count, verb) => {
    let pos = 0
    let found = 0
    while ((pos = lower.indexOf(verb, pos)) !== -1) {
      found++
      pos += verb.length
    }
    return count + found
  }, 0)
}

// ---------------------------------------------------------------------------
// validateFinalOutputQuality
// ---------------------------------------------------------------------------

export function validateFinalOutputQuality(
  text: string,
  context: OutputValidationContext,
): OutputValidationResult {
  const lower = text.toLowerCase()
  const issues: string[] = []
  const warnings: string[] = []

  // Check 1 — hasAction
  const hasAction = ACTION_VERBS.some(verb => lower.includes(verb))

  // Check 2 — hasTimingMarker (only relevant for timing context)
  const isTimingContext =
    context.responseMode === 'timing_strategic_response' ||
    context.intent === 'timing_decision'

  let hasTimingMarker: boolean | null = null
  if (isTimingContext) {
    hasTimingMarker = TIMING_MARKERS.some(marker => lower.includes(marker))
  }

  // Check 3 — noVaguePhrases
  const vaguePhrasesFound = detectVagueOutput(text)
  const noVaguePhrases = vaguePhrasesFound.length === 0

  // Check 4 — hasDominantLine
  const sentences = text
    .split(/[.!?\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  const hasDominantLine = sentences.some(
    sentence =>
      sentence.length >= 20 &&
      !sentence.toLowerCase().startsWith('peut-être') &&
      !sentence.toLowerCase().startsWith('il se peut') &&
      !sentence.toLowerCase().startsWith('parfois'),
  )

  // Check 5 — noStrategyContradiction
  let noStrategyContradiction = true
  if (context.answerStrategy !== undefined) {
    const contradictions = STRATEGY_CONTRADICTIONS[context.answerStrategy]
    if (contradictions !== undefined) {
      const hasContradiction = contradictions.some(phrase => lower.includes(phrase))
      noStrategyContradiction = !hasContradiction
    }
  }

  // Scoring
  let score = 100
  if (!hasAction) score -= 20
  if (hasTimingMarker === false) score -= 20
  if (!noVaguePhrases) score -= 25
  if (!hasDominantLine) score -= 15
  if (!noStrategyContradiction) score -= 20

  score = Math.max(0, score)

  // Issues
  if (!hasAction) {
    issues.push("Aucun verbe d\u2019action détecté dans la réponse")
  }
  if (hasTimingMarker === false) {
    issues.push('Aucun marqueur temporel détecté (timing_strategic requis)')
  }
  if (!noVaguePhrases) {
    issues.push(`Phrases vagues détectées : ${vaguePhrasesFound.join(', ')}`)
  }
  if (!hasDominantLine) {
    issues.push('Aucune ligne directrice dominante claire trouvée')
  }
  if (!noStrategyContradiction) {
    issues.push(`Contradiction avec la stratégie "${context.answerStrategy}" détectée`)
  }

  // Warnings
  if (score >= 60 && score < 70) {
    warnings.push('Score limite — qualité à renforcer')
  }
  if (text.length < 200) {
    warnings.push('Réponse courte — potentiellement incomplète')
  }
  if (text.length > 2000) {
    warnings.push("Réponse longue — risque d\u2019expansion non contrôlée")
  }

  return {
    valid: score >= 60,
    score,
    checks: {
      hasAction,
      hasTimingMarker,
      noVaguePhrases,
      hasDominantLine,
      noStrategyContradiction,
    },
    vaguePhrasesFound,
    issues,
    warnings,
  }
}

// ---------------------------------------------------------------------------
// compareArbiterToFinalOutput
// ---------------------------------------------------------------------------

export function compareArbiterToFinalOutput(input: {
  arbiter: KsArbiterResult
  finalOutput: string
}): ArbiterAlignmentResult {
  const { arbiter, finalOutput } = input
  const outputLower = finalOutput.toLowerCase()
  const driftReasons: string[] = []
  const suggestions: string[] = []

  // Step 1 — narrativeFocus alignment
  const focusKeywords = extractKeywords(arbiter.narrativeFocus)
  let focusScore: number
  if (focusKeywords.length > 0) {
    const foundFocus = focusKeywords.filter(kw => outputLower.includes(kw)).length
    focusScore = (foundFocus / focusKeywords.length) * 100
  } else {
    focusScore = 50
  }

  // Step 2 — answerStrategy alignment
  const strategyKws = STRATEGY_KEYWORDS[arbiter.answerStrategy]
  const strategyHits = strategyKws.filter(kw => outputLower.includes(kw)).length
  let strategyScore: number
  if (strategyHits >= 2) {
    strategyScore = 100
  } else if (strategyHits === 1) {
    strategyScore = 60
  } else {
    strategyScore = 0
  }

  // Step 3 — dominantDynamic alignment
  const dynamicKeywords = extractKeywords(arbiter.dominantDynamic)
  const foundDynamic = dynamicKeywords.filter(kw => outputLower.includes(kw)).length
  const dynamicScore =
    foundDynamic > 0
      ? Math.min((foundDynamic / Math.max(dynamicKeywords.length, 1)) * 100, 100)
      : 30

  const alignmentScore = Math.round(
    focusScore * 0.5 + strategyScore * 0.3 + dynamicScore * 0.2,
  )

  // Drift reasons
  if (focusScore < 40) {
    driftReasons.push('Focus narratif non reflété dans la réponse finale')
  }
  if (strategyScore === 0) {
    driftReasons.push(`Stratégie "${arbiter.answerStrategy}" absente de la réponse`)
  }
  if (dynamicScore < 30) {
    driftReasons.push('Dynamique dominante non traduite dans la réponse')
  }

  // Suggestions
  if (focusScore < 60) {
    suggestions.push(`Renforcer le focus sur : ${arbiter.narrativeFocus.slice(0, 80)}`)
  }
  if (strategyScore < 60) {
    suggestions.push(`Ajouter des marqueurs de stratégie "${arbiter.answerStrategy}"`)
  }
  if (dynamicScore < 50) {
    suggestions.push(`Refléter la dynamique : ${arbiter.dominantDynamic.slice(0, 60)}`)
  }

  return {
    aligned: alignmentScore >= 55,
    alignmentScore,
    driftReasons,
    suggestions,
  }
}

// ---------------------------------------------------------------------------
// measureSentinelDrift
// ---------------------------------------------------------------------------

export function measureSentinelDrift(pre: string, post: string): SentinelDriftResult {
  const details: string[] = []

  // Dimension 1 — clarityLoss
  const preUncertainty = countUncertainty(pre)
  const postUncertainty = countUncertainty(post)
  const clarityLoss = postUncertainty > preUncertainty + 1

  // Dimension 2 — precisionLoss
  const preWords = pre.split(/\s+/).length
  const postWords = post.split(/\s+/).length
  const precisionLoss = postWords > preWords * 1.5

  // Dimension 3 — actionLoss
  const preActionCount = countActionVerbs(pre, DRIFT_ACTION_VERBS)
  const postActionCount = countActionVerbs(post, DRIFT_ACTION_VERBS)
  const actionLoss = preActionCount > 0 && postActionCount < preActionCount

  // Dimension 4 — expansionGain
  const preLower = pre.toLowerCase()
  const postTokens = post
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.replace(/[^a-zàâäéèêëîïôùûüçœæ'-]/g, ''))
    .filter(w => w.length > 6)

  const uniqueNewWords = [...new Set(postTokens)].filter(
    w => !preLower.includes(w) && !STOPWORDS.has(w),
  )
  const expansionGain = uniqueNewWords.length > 8

  // driftScore
  let driftScore = 0
  if (clarityLoss) driftScore += 25
  if (precisionLoss) driftScore += 25
  if (actionLoss) driftScore += 25
  if (expansionGain) driftScore += 25

  // Details
  if (clarityLoss) {
    details.push('Perte de clarté : augmentation des formulations incertaines')
  }
  if (precisionLoss) {
    details.push(
      `Perte de précision : réponse ${Math.round((postWords / preWords - 1) * 100)}% plus longue`,
    )
  }
  if (actionLoss) {
    details.push(`Perte d\u2019action : ${preActionCount} verbes actifs → ${postActionCount}`)
  }
  if (expansionGain) {
    details.push(`Expansion non contrôlée : ${uniqueNewWords.length} nouveaux concepts introduits`)
  }

  return {
    driftDetected: driftScore >= 25,
    driftScore,
    dimensions: {
      clarityLoss,
      precisionLoss,
      actionLoss,
      expansionGain,
    },
    details,
  }
}
