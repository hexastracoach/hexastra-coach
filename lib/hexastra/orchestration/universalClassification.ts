/**
 * Universal Classification Module — Hexastra Coach
 *
 * Single entry point for classifying any user message.
 * Combines: domain route + semantic context + subcategory + request kind.
 *
 * Returns a structured ClassificationResult used throughout runHexastraFlow
 * and testable in isolation.
 */

import { classifyQuery } from '@/lib/hexastra/router/classifyQuery'
import { detectContext } from '@/lib/hexastra/orchestration/detectContext'
import { detectSubcategory } from '@/lib/hexastra/orchestration/detectSubcategory'
import {
  classifyRequestKind,
  requestKindNeedsExactData,
  requestKindNeedsInterpretation,
  requestKindAllowsVectorEnrichment,
} from './requestKinds'
import type { DomainRoute } from '@/lib/hexastra/types'
import type { SemanticContextType } from './detectContext'
import type { RequestKind } from './requestKinds'
import type { ChatMessage } from '@/lib/chat/chatPayloadBuilder'

// ── Science type ───────────────────────────────────────────────────────────────

export type Science =
  | 'astrology'
  | 'human_design'
  | 'numerology'
  | 'kua'
  | 'enneagram'
  | 'hexagram'
  | 'fusion'
  | 'timing'
  | 'general'
  | 'unknown'

// ── Classification result ──────────────────────────────────────────────────────

export type ClassificationResult = {
  /** Detected semantic intent */
  intent: SemanticContextType
  /** Primary science domain */
  science: Science
  /** Fine-grained subcategory (null if not detected) */
  subcategory: string | null
  /** Nature of the user request */
  requestKind: RequestKind
  /** Whether exact data from the engine is required */
  needsExactData: boolean
  /** Whether interpretive enrichment is appropriate */
  needsInterpretation: boolean
  /** Whether vector store enrichment is allowed */
  needsVectorEnrichment: boolean
  /** Legacy domain route (for backwards compatibility with existing flow) */
  domainRoute: DomainRoute
  /** Confidence 0–1 */
  confidence: number
}

// ── Subcategory → Science maps ─────────────────────────────────────────────────

const ASTRO_SUBCATS = new Set([
  'ascendant', 'signe_lunaire', 'signe_solaire', 'planetes', 'theme_natal',
  'maisons', 'aspects', 'transits', 'retrograde', 'cycle', 'vocation_astro',
  'compatibilite_astro',
])

const HD_SUBCATS = new Set([
  'type_hd', 'profil_hd', 'autorite_hd', 'strategie_hd', 'centres_hd',
  'portes_hd', 'canaux_hd', 'croix_incarnation', 'definition_hd',
  'transits_hd', 'human_design_exact',
])

const NUMEROLOGY_SUBCATS = new Set([
  'chemin_de_vie', 'expression', 'ame', 'personnalite_num',
  'annee_personnelle', 'mois_personnel', 'jour_personnel', 'cycle_vie', 'nom_prenom',
])

const KUA_SUBCATS = new Set([
  'nombre_kua', 'direction_kua', 'orientation_habitat', 'orientation_bureau',
  'direction_sommeil', 'feng_shui', 'elements_kua',
])

const ENNEAGRAM_SUBCATS = new Set([
  'type_enn', 'aile_enn', 'instinct_enn', 'integration_enn', 'desintegration_enn', 'centre_enn',
])

const HEXAGRAM_SUBCATS = new Set([
  'hexagram_exact', 'hexagram_interpretation',
])

const FUSION_SUBCATS = new Set([
  'lecture_fusionnee', 'compatibilite_fusion', 'decision_fusion', 'timing_fusion',
  'etat_emotionnel', 'lecture_generale',
])

// ── Explicit science override from last message ────────────────────────────────

/**
 * Patterns that signal the user explicitly named a specific science in their message.
 * Used to override the 'science' domain route default (which falls back to astrology)
 * when no subcategory was detected. Only applied when subcategory is null.
 */
const EXPLICIT_SCIENCE_PATTERNS: Array<{ pattern: RegExp; science: Science }> = [
  { pattern: /\b(astrologie|astrology|theme astrologique|thème astrologique|theme astral|thème astral|theme natal|thème natal|carte du ciel|birth chart|natal chart|mon astro)\b/i, science: 'astrology' },
  { pattern: /\b(numerolog|numérolog|chemin de vie|nombre expression|nombre de vie|numéro de vie)/i, science: 'numerology' },
  { pattern: /\b(human design|design humain|bodygraph|mon hd\b|portes? hd|centres? hd|canaux hd)/i, science: 'human_design' },
  { pattern: /\b(enneagramme|ennéagramme|ennéa\b|mon ennea|mon type [1-9]\b)/i, science: 'enneagram' },
  { pattern: /\b(kua\b|feng.?shui|gps kua|neurokua|nombre kua|direction kua)/i, science: 'kua' },
  { pattern: /\b(fusion\b|multi.?science|hexastra fusion|toutes les sciences)/i, science: 'fusion' },
]

/**
 * Returns the science explicitly named in the message, or null if none detected.
 * Only called when subcategory detection returned null (to avoid conflicts).
 */
function resolveExplicitScienceOverride(message: string): Science | null {
  for (const { pattern, science } of EXPLICIT_SCIENCE_PATTERNS) {
    if (pattern.test(message)) return science
  }
  return null
}

// ── Science resolver ───────────────────────────────────────────────────────────

function resolveScience(
  domainRoute: DomainRoute,
  semanticContext: SemanticContextType,
  subcategory: string | null,
  explicitOverride: Science | null = null,
): Science {
  // Semantic context overrides everything for exact routes
  if (semanticContext === 'astro_exact' || semanticContext === 'astro_followup') return 'astrology'
  if (semanticContext === 'human_design_exact') return 'human_design'

  // Subcategory-based resolution (most precise — from current message)
  if (subcategory) {
    if (ASTRO_SUBCATS.has(subcategory)) return 'astrology'
    if (HD_SUBCATS.has(subcategory)) return 'human_design'
    if (NUMEROLOGY_SUBCATS.has(subcategory)) return 'numerology'
    if (KUA_SUBCATS.has(subcategory)) return 'kua'
    if (ENNEAGRAM_SUBCATS.has(subcategory)) return 'enneagram'
    if (HEXAGRAM_SUBCATS.has(subcategory)) return 'hexagram'
    if (FUSION_SUBCATS.has(subcategory)) return 'fusion'
  }

  // Domain route fallback — with explicit override for ambiguous routes ('science', default)
  switch (domainRoute) {
    case 'fusion':       return 'fusion'
    case 'science':      return explicitOverride ?? 'astrology' // explicit name wins over default astrology
    case 'gps_kua':      return 'kua'
    case 'neurokua':     return 'fusion'
    case 'timing':       return 'timing'
    case 'career':       return 'fusion'
    case 'relationship': return 'fusion'
    case 'decision':     return 'fusion'
    case 'wellbeing':    return 'fusion'
    default:             return explicitOverride ?? 'general' // also apply override on generic route
  }
}

// ── Main classifier ────────────────────────────────────────────────────────────

/**
 * Classify a user message into a full ClassificationResult.
 *
 * @param message  Current user message
 * @param history  Conversation history (enables astro follow-up detection)
 */
export function classifyMessage(message: string, history?: ChatMessage[]): ClassificationResult {
  const domainRoute = classifyQuery(message)
  const semanticCtx = detectContext(message, history)
  const subcatResult = detectSubcategory(message)
  const subcategory = subcatResult?.subcategory ?? null

  const requestKind = classifyRequestKind(message, subcategory)
  // Only compute explicit override when subcategory is null — avoids conflicts with precise detection
  const explicitScienceOverride = subcategory ? null : resolveExplicitScienceOverride(message)
  const science = resolveScience(domainRoute, semanticCtx.contextType, subcategory, explicitScienceOverride)

  // needsExactData: either requestKind signals it, or semantic context does
  const needsExactData =
    requestKindNeedsExactData(requestKind) ||
    semanticCtx.contextType === 'astro_exact' ||
    semanticCtx.contextType === 'astro_followup' ||
    semanticCtx.contextType === 'human_design_exact'

  const needsInterpretation = requestKindNeedsInterpretation(requestKind)
  const needsVectorEnrichment = requestKindAllowsVectorEnrichment(requestKind)

  // Confidence: combine signals
  let confidence = semanticCtx.confidence
  if (subcategory) confidence = Math.min(1, confidence + 0.1)
  if (requestKind !== 'unknown') confidence = Math.min(1, confidence + 0.05)

  return {
    intent: semanticCtx.contextType,
    science,
    subcategory,
    requestKind,
    needsExactData,
    needsInterpretation,
    needsVectorEnrichment,
    domainRoute,
    confidence,
  }
}
