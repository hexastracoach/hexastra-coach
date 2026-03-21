/**
 * Direct Request Detection — Hexastra Coach
 *
 * Determines whether a user message is already a complete, actionable request
 * that should be executed directly — without an intermediate framing/cadrage step.
 *
 * RULE: if the user already stated a known science + a real intent,
 * the engine must execute immediately.
 * It must never ask them to rephrase something they already said clearly.
 *
 * Examples of direct requests (→ execute immediately):
 *   "fais moi mon profil human design"   → science=human_design, requestKind=exact_profile
 *   "quel est mon ascendant"             → science=astrology, requestKind=exact_fact
 *   "quelles sont les planètes de mon thème natal" → science=astrology, requestKind=exact_fact
 *   "donne moi mon chemin de vie"        → science=numerology, requestKind=exact_fact
 *   "explique mon profil 3/5"            → science=human_design, requestKind=interpretation
 *
 * Examples of NON-direct requests (→ framing allowed):
 *   "human design"    → only 2 words, no intent detected
 *   "astrologie"      → single keyword
 *   "analyse moi"     → science unknown, requestKind unknown
 *   "aide moi"        → no science, no intent
 */

import type { ClassificationResult } from './universalClassification'

// ── Constants ──────────────────────────────────────────────────────────────────

/**
 * Minimum word count for a message to be considered a real question.
 * Filters out single-keyword and two-keyword inputs like "human design" or "astrologie".
 */
const MIN_WORD_COUNT = 3

// ── Main function ──────────────────────────────────────────────────────────────

/**
 * Returns true if the user message is a complete, exploitable request.
 *
 * Conditions (ALL must be true):
 * 1. Message has ≥ 3 words — filters bare keywords like "human design", "astrologie"
 * 2. Science is specifically identified (not 'unknown' or 'general')
 * 3. RequestKind is not 'unknown' — the classifier found a real intent pattern
 *
 * When true → skip contextual framing, execute the reading directly.
 * When false → contextual framing is allowed if needed.
 */
export function isActionableDirectRequest(
  message: string,
  classif: ClassificationResult,
): boolean {
  const { science, requestKind } = classif

  // Word count check: rejects bare science keywords and two-word inputs
  const wordCount = message.trim().split(/\s+/).length
  if (wordCount < MIN_WORD_COUNT) return false

  // Science must be specifically known — not vague/general
  if (science === 'unknown' || science === 'general') return false

  // RequestKind must reflect a detected real intent
  if (requestKind === 'unknown') return false

  return true
}

/**
 * Reason string for structured logs when framing is skipped.
 */
export function directRequestSkipReason(
  message: string,
  classif: ClassificationResult,
): string {
  return `science=${classif.science} requestKind=${classif.requestKind} subcategory=${classif.subcategory ?? 'none'} words=${message.trim().split(/\s+/).length}`
}
