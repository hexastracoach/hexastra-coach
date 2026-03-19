/**
 * Fusion Engine — Hexastra Coach
 *
 * Determines how to combine multiple detected subcategories
 * into a coherent analysis context.
 *
 * Fusion rules (by science combination):
 *   same science          → internal fusion
 *   2 different sciences  → inter-science fusion
 *   3+ sciences           → hexastra complete
 *   hexastra_fusion hit   → hexastra complete
 */

import type { SubcategoryMatch } from './detectSubcategory'
import type { SubcategoryScience } from './subcategoryTaxonomy'
import type { PlanKey } from '@/types/subscription'

export type FusionType =
  | 'internal'       // multiple subcats of same science (e.g. ascendant + maisons)
  | 'inter_science'  // 2 different sciences (e.g. astro + numerology)
  | 'hexastra'       // 3+ sciences or explicit hexastra_fusion

export type FusionResponseType = 'structured' | 'explanation' | 'fusion'

export type FusionAnalysisMode = 'single' | 'multi' | 'fusion'

export type FusionContext = {
  dominantScience: SubcategoryScience
  combinedSubcategories: string[]
  sciences: SubcategoryScience[]
  fusionType: FusionType
  responseType: FusionResponseType
  analysisMode: FusionAnalysisMode
}

/** Plans that can access fusion mode */
const FUSION_ELIGIBLE_PLANS: PlanKey[] = ['essential', 'premium', 'practitioner']

function isFusionEligible(plan: PlanKey): boolean {
  return FUSION_ELIGIBLE_PLANS.includes(plan)
}

function resolveFusionType(sciences: SubcategoryScience[]): FusionType {
  const uniqueSciences = [...new Set(sciences)]
  if (uniqueSciences.includes('hexastra_fusion')) return 'hexastra'
  if (uniqueSciences.length >= 3) return 'hexastra'
  if (uniqueSciences.length === 2) return 'inter_science'
  return 'internal'
}

function resolveFusionResponseType(fusionType: FusionType, matches: SubcategoryMatch[]): FusionResponseType {
  // Structured if primary match is structured_data and no inter-science complexity
  if (
    fusionType === 'internal' &&
    matches[0]?.responseType === 'structured_data' &&
    matches.every((m) => m.responseType === 'structured_data')
  ) {
    return 'structured'
  }
  if (fusionType === 'hexastra') return 'fusion'
  return 'explanation'
}

/**
 * Build fusion context from multiple detected matches.
 *
 * @param matches  All detected subcategory matches (sorted by score desc)
 * @param plan     User plan — determines whether fusion mode is unlocked
 */
export function buildFusionContext(matches: SubcategoryMatch[], plan: PlanKey): FusionContext {
  if (matches.length === 0) {
    // Fallback — should not happen in practice
    return {
      dominantScience: 'hexastra_fusion',
      combinedSubcategories: [],
      sciences: [],
      fusionType: 'hexastra',
      responseType: 'fusion',
      analysisMode: 'single',
    }
  }

  const sciences = matches.map((m) => m.science)
  const uniqueSciences = [...new Set(sciences)] as SubcategoryScience[]
  const dominantScience = matches[0].science
  const combinedSubcategories = matches.map((m) => m.subcategory)
  const fusionType = resolveFusionType(sciences)
  const responseType = resolveFusionResponseType(fusionType, matches)

  // analysisMode upgrade: multi → fusion if plan allows
  let analysisMode: FusionAnalysisMode = 'single'
  if (matches.length >= 2) {
    analysisMode = isFusionEligible(plan) ? 'fusion' : 'multi'
  }

  console.log(
    'FUSION CONTEXT:',
    `type=${fusionType}`,
    `mode=${analysisMode}`,
    `sciences=${uniqueSciences.join('+')}`,
    `subcats=${combinedSubcategories.join('+')}`,
  )

  return {
    dominantScience,
    combinedSubcategories,
    sciences: uniqueSciences,
    fusionType,
    responseType,
    analysisMode,
  }
}
