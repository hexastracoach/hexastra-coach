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

// ── Science resolver ───────────────────────────────────────────────────────────

function resolveScience(
  domainRoute: DomainRoute,
  semanticContext: SemanticContextType,
  subcategory: string | null,
): Science {
  // Semantic context overrides everything for exact routes
  if (semanticContext === 'astro_exact' || semanticContext === 'astro_followup') return 'astrology'
  if (semanticContext === 'human_design_exact') return 'human_design'

  // Subcategory-based resolution (most precise)
  if (subcategory) {
    if (ASTRO_SUBCATS.has(subcategory)) return 'astrology'
    if (HD_SUBCATS.has(subcategory)) return 'human_design'
    if (NUMEROLOGY_SUBCATS.has(subcategory)) return 'numerology'
    if (KUA_SUBCATS.has(subcategory)) return 'kua'
    if (ENNEAGRAM_SUBCATS.has(subcategory)) return 'enneagram'
    if (HEXAGRAM_SUBCATS.has(subcategory)) return 'hexagram'
    if (FUSION_SUBCATS.has(subcategory)) return 'fusion'
  }

  // Domain route fallback
  switch (domainRoute) {
    case 'fusion':      return 'fusion'
    case 'science':     return 'astrology' // science without subcategory defaults to astrology
    case 'gps_kua':     return 'kua'
    case 'neurokua':    return 'fusion'
    case 'timing':      return 'timing'
    case 'career':      return 'fusion'
    case 'relationship':return 'fusion'
    case 'decision':    return 'fusion'
    case 'wellbeing':   return 'fusion'
    default:            return 'general'
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
  const science = resolveScience(domainRoute, semanticCtx.contextType, subcategory)

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
