import {
  LEGACY_KUA_KEYS,
  LEGACY_NUMEROLOGY_KEYS,
  mergeFusionExactSectionWithLegacy,
  normalizeFusionExactDataWithDiagnostics,
  toFusionRecord,
} from '@/lib/hexastra/api/normalizeFusionExactData'
import {
  hasNormalizedExactSectionMapping,
  resolveSubCategoryLegacyExactValue,
  resolveSubCategoryNormalizedExactValue,
} from '@/lib/hexastra/retrieval/subCategoryExactData'
import type { SubCategory } from '@/lib/hexastra/taxonomy/scienceTaxonomy'

/**
 * Structured signal extracted from /chart/fusion raw data, indexed by
 * science + subcategory.
 */
export type SubCategorySignal = {
  science: string
  category: string
  value: unknown
}

function hasKeys(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0)
}

function resolveAstroProfile(rawData: Record<string, unknown>): unknown {
  return rawData.astroProfile ?? rawData.astro ?? rawData.tropical ?? null
}

function resolveHumanDesignProfile(rawData: Record<string, unknown>): unknown {
  return rawData.hdProfile ?? rawData.human_design ?? rawData.humanDesign ?? null
}

function resolveNumerologyProfile(rawData: Record<string, unknown>): unknown {
  const profile = toFusionRecord(rawData.numerologyProfile)
  const mergedCycles = mergeFusionExactSectionWithLegacy(rawData, 'numerologyCycles', LEGACY_NUMEROLOGY_KEYS)

  if (profile && Object.keys(mergedCycles).length > 0) {
    return { ...profile, ...mergedCycles }
  }

  if (profile) {
    return profile
  }

  if (Object.keys(mergedCycles).length > 0) {
    return mergedCycles
  }

  return rawData.numerology ?? rawData.numerologie ?? null
}

function resolveKuaProfile(rawData: Record<string, unknown>): unknown {
  const mergedDirections = mergeFusionExactSectionWithLegacy(rawData, 'kuaDirections', LEGACY_KUA_KEYS)

  if (Object.keys(mergedDirections).length > 0) {
    return mergedDirections
  }

  return rawData.kua ?? null
}

function resolveFallbackProfileValue(
  category: SubCategory,
  rawData: Record<string, unknown>,
): unknown {
  if (category.key.startsWith('astro_')) {
    return resolveAstroProfile(rawData)
  }

  if (category.key.startsWith('hd_')) {
    return resolveHumanDesignProfile(rawData)
  }

  if (category.key.startsWith('num_')) {
    return resolveNumerologyProfile(rawData)
  }

  if (category.key.startsWith('kua_')) {
    return resolveKuaProfile(rawData)
  }

  if (category.science === 'enneagram') {
    return rawData.enneagram ?? rawData.enneagramme ?? null
  }

  if (category.science === 'fusion') {
    return rawData.publicSummary ?? rawData.summary ?? null
  }

  return rawData[category.key] ?? null
}

/**
 * Build structured signals from detected subcategories and the raw
 * /chart/fusion payload.
 *
 * Priority:
 * 1. Canonical exactData sections
 * 2. Legacy alias paths tied to the same subcategory
 * 3. Legacy profile blocks for non exact-data-backed categories
 */
export function buildSignals(
  subCategories: SubCategory[],
  rawData: Record<string, unknown> | null,
): SubCategorySignal[] {
  const source = toFusionRecord(rawData)

  if (!source) {
    return subCategories.map((category) => ({
      science: category.science,
      category: category.key,
      value: null,
    }))
  }

  const normalizedExactDataResult = normalizeFusionExactDataWithDiagnostics(source)

  return subCategories.map((category) => {
    const normalizedExactValue = resolveSubCategoryNormalizedExactValue({
      exactData: normalizedExactDataResult.exactData,
      diagnostics: normalizedExactDataResult.diagnostics,
      subCategory: category.key,
    })

    if (normalizedExactValue?.kind === 'resolved') {
      return {
        science: category.science,
        category: category.key,
        value: normalizedExactValue.value,
      }
    }

    if (normalizedExactValue?.kind !== 'blocked') {
      const legacyExactValue = resolveSubCategoryLegacyExactValue(
        source,
        category.science,
        category.key,
      )

      if (legacyExactValue !== null) {
        return {
          science: category.science,
          category: category.key,
          value: legacyExactValue,
        }
      }
    }

    const fallbackValue = hasNormalizedExactSectionMapping(category.key)
      ? null
      : resolveFallbackProfileValue(category, source)

    return {
      science: category.science,
      category: category.key,
      value: hasKeys(fallbackValue) || typeof fallbackValue === 'string' || typeof fallbackValue === 'number'
        ? fallbackValue
        : fallbackValue ?? null,
    }
  })
}
