/**
 * Vector Store Policy - Hexastra Coach
 *
 * Determines when to use / skip vector store retrieval.
 *
 * RULE: vector store enriches explanations and interpretations.
 *       It must NEVER be used as a primary source for calculated values.
 *
 * - exact_fact / exact_profile requests: skip when exact data is resolved
 * - interpretation / guidance / clarification: enrich
 * - synthesis: enrich only after exact data is resolved
 * - mixed: enrich if exact data resolved
 */

import type { RequestKind } from '@/lib/hexastra/orchestration/requestKinds'
import type { Science } from '@/lib/hexastra/orchestration/universalClassification'

// Types

export type VectorPolicyInput = {
  requestKind: RequestKind
  science: Science
  subcategory: string | null
  exactDataResolved: boolean
  userMessage?: string
}

export type VectorPolicyResult = {
  shouldEnrich: boolean
  /** Log-friendly reason (used in VECTOR_SEARCH_SKIPPED / VECTOR_ENRICHMENT_ENABLED logs) */
  reason: string
}

// Main policy

/**
 * Determine whether vector store retrieval should run for this request.
 *
 * @returns shouldEnrich=false -> skip retrieval entirely
 *          shouldEnrich=true  -> proceed with retrieval
 */
export function shouldUseVectorEnrichment(input: VectorPolicyInput): VectorPolicyResult {
  const { requestKind, exactDataResolved } = input

  // HARD SKIP: exact fact / profile when data is resolved.
  // The engine calculated the value; the LLM should cite it, not look it up.
  if ((requestKind === 'exact_fact' || requestKind === 'exact_profile') && exactDataResolved) {
    return {
      shouldEnrich: false,
      reason: 'VECTOR_SEARCH_SKIPPED_FOR_EXACT_QUERY: exact data resolved - engine data is sufficient',
    }
  }

  // HARD SKIP: exact fact / profile when data is NOT yet resolved.
  // Calculation must happen first; vector retrieval before exact data adds noise
  // and risks the LLM hallucinating from retrieved context instead.
  if ((requestKind === 'exact_fact' || requestKind === 'exact_profile') && !exactDataResolved) {
    return {
      shouldEnrich: false,
      reason: 'VECTOR_SEARCH_SKIPPED_FOR_EXACT_QUERY: exact data required first - calculation takes priority',
    }
  }

  // SYNTHESIS: enrich only after exact data resolved.
  if (requestKind === 'synthesis') {
    if (!exactDataResolved) {
      return {
        shouldEnrich: false,
        reason: 'VECTOR_SEARCH_SKIPPED: synthesis deferred - exact data not yet resolved',
      }
    }
    return {
      shouldEnrich: true,
      reason: 'VECTOR_ENRICHMENT_ENABLED: synthesis with exact data resolved',
    }
  }

  // INTERPRETATION / GUIDANCE / CLARIFICATION: always enrich.
  if (requestKind === 'yearly_priorities') {
    return {
      shouldEnrich: true,
      reason: 'VECTOR_ENRICHMENT_ENABLED: exact-data-backed interpretive query - yearly priorities',
    }
  }

  if (
    requestKind === 'career_orientation' ||
    requestKind === 'interpretation' ||
    requestKind === 'guidance' ||
    requestKind === 'clarification'
  ) {
    return {
      shouldEnrich: true,
      reason: `VECTOR_ENRICHMENT_ENABLED: ${requestKind} request - depth enrichment appropriate`,
    }
  }

  // MIXED: enrich if exact data resolved.
  if (requestKind === 'mixed') {
    return {
      shouldEnrich: exactDataResolved,
      reason: exactDataResolved
        ? 'VECTOR_ENRICHMENT_ENABLED: mixed request with exact data resolved'
        : 'VECTOR_SEARCH_SKIPPED: mixed request - defer until exact data resolved',
    }
  }

  // UNKNOWN: skip by default.
  return {
    shouldEnrich: false,
    reason: 'VECTOR_SEARCH_SKIPPED: unknown request kind - defaulting to skip',
  }
}

/**
 * Legacy-compatible skip flag for the existing inline check in runHexastraFlow.
 *
 * Replaces: `const skipVectorRetrieval = isAstroExact || isHumanDesignExact`
 *
 * @param isAstroExact         true when semantic context is astro_exact or astro_followup
 * @param isHumanDesignExact   true when semantic context is human_design_exact
 * @param requestKind          request kind from classifyMessage
 * @param exactDataResolved    whether the Railway API returned usable data
 */
export function resolveVectorSkip(
  isAstroExact: boolean,
  isHumanDesignExact: boolean,
  requestKind: RequestKind,
  exactDataResolved: boolean,
): boolean {
  // Preserve existing exact-route skips.
  if (isAstroExact || isHumanDesignExact) return true

  // Apply policy for other kinds.
  const policy = shouldUseVectorEnrichment({ requestKind, science: 'general', subcategory: null, exactDataResolved })
  return !policy.shouldEnrich
}
