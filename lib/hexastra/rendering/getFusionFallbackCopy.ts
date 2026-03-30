import {
  FUSION_SUBCATEGORY_COPY_VARIANTS,
  getFusionSubcategoryCopy,
  type FusionFallbackMode,
  type FusionSubcategoryCopy,
} from '@/lib/hexastra/rendering/fusionSubcategoryCopy'

function normalizeFusionFallbackMode(responseMode: string | null | undefined): FusionFallbackMode {
  switch (responseMode) {
    case 'timing_strategic_response':
      return 'timing_strategic_response'
    case 'interpretive_reading':
      return 'interpretive_reading'
    case 'calculated_reading':
      return 'calculated_reading'
    case 'fusion_general':
    case 'concise_fusion_answer':
    default:
      return 'fusion_general'
  }
}

export function getFusionFallbackCopy(args: {
  subCategory: string | null | undefined
  responseMode: string | null | undefined
}): FusionSubcategoryCopy {
  const baseCopy = getFusionSubcategoryCopy(args.subCategory)
  const mode = normalizeFusionFallbackMode(args.responseMode)
  const variant = args.subCategory
    ? FUSION_SUBCATEGORY_COPY_VARIANTS[mode]?.[args.subCategory]
    : null

  if (!variant) {
    return baseCopy
  }

  return {
    opening: variant.opening ?? baseCopy.opening,
    explanation: variant.explanation ?? baseCopy.explanation,
  }
}
