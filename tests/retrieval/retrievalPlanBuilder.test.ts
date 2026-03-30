import { describe, expect, it } from 'vitest'
import {
  resolveSubCategoryRetrievalConfig,
  SUBCATEGORY_RETRIEVAL_MAP,
} from '@/lib/hexastra/retrieval/subCategoryRetrievalMap'
import { buildRetrievalPlanFromQuery } from '@/lib/hexastra/retrieval/retrievalPlanBuilder'

describe('subCategoryRetrievalMap', () => {
  it('maps a covered subCategory to an explicit retrieval config', () => {
    const config = resolveSubCategoryRetrievalConfig('hd_channels')

    expect(SUBCATEGORY_RETRIEVAL_MAP.hd_channels).toBeDefined()
    expect(config.science).toBe('human_design')
    expect(config.vectorNamespaces).toContain('human_design/canaux')
    expect(config.scienceTags).toContain('human_design')
    expect(config.retrievalPriority).toBeGreaterThanOrEqual(80)
  })
})

describe('buildRetrievalPlanFromQuery', () => {
  it('builds an astrology retrieval plan for current transits', () => {
    const plan = buildRetrievalPlanFromQuery('mes transits actuels')

    expect(plan.sciences).toContain('astro')
    expect(plan.subCategories).toContain('astro_transits_current')
    expect(plan.vectorNamespaces).toContain('astrologie/transits')
    expect(plan.weightedMatches[0]?.subCategory).toBe('astro_transits_current')
    expect(plan.preferredTopK).toBeGreaterThanOrEqual(6)
  })

  it('builds a human design retrieval plan for type', () => {
    const plan = buildRetrievalPlanFromQuery('mon type hd')

    expect(plan.sciences).toContain('human_design')
    expect(plan.subCategories).toContain('hd_type')
    expect(plan.scienceTags).toContain('human_design')
    expect(plan.weightedMatches[0]?.subCategory).toBe('hd_type')
    expect(plan.dominantScience).toBe('human_design')
    expect(plan.dominantSubCategory).toBe('hd_type')
  })

  it('builds a human design retrieval plan for channels', () => {
    const plan = buildRetrievalPlanFromQuery('mes canaux')

    expect(plan.sciences).toContain('human_design')
    expect(plan.subCategories).toContain('hd_channels')
    expect(plan.vectorNamespaces).toContain('human_design/canaux')
    expect(plan.weightedMatches[0]?.subCategory).toBe('hd_channels')
  })

  it('builds a numerology retrieval plan for personal year', () => {
    const plan = buildRetrievalPlanFromQuery('mon année perso')

    expect(plan.sciences).toContain('numerology')
    expect(plan.subCategories).toContain('num_personal_year')
    expect(plan.scienceTags).toContain('numerologie')
    expect(plan.weightedMatches[0]?.subCategory).toBe('num_personal_year')
  })

  it('builds a kua retrieval plan for bed orientation', () => {
    const plan = buildRetrievalPlanFromQuery('orientation de mon lit')

    expect(plan.sciences).toContain('kua')
    expect(plan.subCategories).toContain('kua_bed_orientation')
    expect(plan.vectorNamespaces).toContain('kua/habitat')
    expect(plan.weightedMatches[0]?.subCategory).toBe('kua_bed_orientation')
  })

  it('enriches fusion-only decision phrasing through intent expansion', () => {
    const plan = buildRetrievalPlanFromQuery('que dois-je faire maintenant')

    expect(plan.sciences).toContain('fusion')
    expect(plan.sciences).toContain('human_design')
    expect(plan.sciences).toContain('astro')
    expect(plan.subCategories).toContain('fusion_decision')
    expect(plan.subCategories).toContain('hd_strategy')
    expect(plan.subCategories).toContain('num_decision_timing')
    expect(plan.subCategories).toContain('astro_transits_timing')
  })

  it('mutualizes same-science sources on multi-match queries', () => {
    const plan = buildRetrievalPlanFromQuery('mon type hd et mes canaux')

    expect(plan.sciences).toContain('human_design')
    expect(plan.subCategories).toContain('hd_type')
    expect(plan.subCategories).toContain('hd_channels')
    expect(
      plan.weightedMatches
        .filter((entry) => entry.science === 'human_design')
        .map((entry) => entry.subCategory),
    ).toEqual(expect.arrayContaining(['hd_type', 'hd_channels']))
    expect(plan.vectorNamespaces.filter((namespace) => namespace === 'human_design')).toHaveLength(1)
    expect(new Set(plan.scienceTags).size).toBe(plan.scienceTags.length)
  })

  it('falls back to fusion_general when no precise signal exists', () => {
    const plan = buildRetrievalPlanFromQuery('blorpt zarg nuqeta')

    expect(plan.fallbackUsed).toBe(true)
    expect(plan.subCategories).toEqual(['fusion_general'])
    expect(plan.sciences).toEqual(['fusion'])
    expect(plan.vectorNamespaces).toContain('ks_fusion_globaux')
  })

  it('keeps "mon type" multi-science when the query is truly ambiguous', () => {
    const plan = buildRetrievalPlanFromQuery('mon type')

    expect(plan.sciences).toEqual(expect.arrayContaining(['human_design', 'enneagram']))
    expect(plan.subCategories).toEqual(expect.arrayContaining(['hd_type', 'ennea_type_core']))
    expect(plan.dominantScience).toBeNull()
  })

  it('resolves "mon profil human design" to the HD profile even if the phrase is generic', () => {
    const plan = buildRetrievalPlanFromQuery('mon profil human design', { hasBirthData: true })

    expect(plan.dominantScience).toBe('human_design')
    expect(plan.dominantSubCategory).toBe('hd_profile')
    expect(plan.weightedMatches[0]?.subCategory).toBe('hd_profile')
  })

  it('resolves "mes directions favorables" to Kua with a dominant subcategory', () => {
    const plan = buildRetrievalPlanFromQuery('mes directions favorables')

    expect(plan.dominantScience).toBe('kua')
    expect(plan.dominantSubCategory).toBe('kua_favorable_directions')
    expect(plan.weightedMatches[0]?.subCategory).toBe('kua_favorable_directions')
  })

  it('resolves "compatibilite astrologique" to astrology synastry', () => {
    const plan = buildRetrievalPlanFromQuery('compatibilite astrologique')

    expect(plan.dominantScience).toBe('astro')
    expect(plan.dominantSubCategory).toBe('astro_synastry')
    expect(plan.weightedMatches[0]?.subCategory).toBe('astro_synastry')
  })

  it('keeps fusion dominant for a broad current-life question with birth data available', () => {
    const plan = buildRetrievalPlanFromQuery('que se passe-t-il pour moi en ce moment', {
      hasBirthData: true,
    })

    expect(plan.dominantScience).toBe('fusion')
    expect(plan.subCategories.slice(0, 4)).toEqual(
      expect.arrayContaining(['fusion_general', 'fusion_timing', 'astro_transits_current']),
    )
  })

  it('keeps a general direction question on the fusion decision track', () => {
    const plan = buildRetrievalPlanFromQuery('quelle direction prendre')

    expect(plan.dominantSubCategory).toBe('fusion_decision')
    expect(plan.weightedMatches[0]?.subCategory).toBe('fusion_decision')
    expect(plan.sciences[0]).toBe('fusion')
  })
})
