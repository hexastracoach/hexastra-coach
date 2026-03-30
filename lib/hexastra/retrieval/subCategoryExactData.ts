import type {
  FusionExactDataDiagnostics,
  NormalizedFusionExactData,
  NormalizedFusionExactDataSection,
} from '@/lib/hexastra/api/normalizeFusionExactData'

type NormalizedExactPathCandidate = {
  section: NormalizedFusionExactDataSection
  path?: string
}

export type SubCategoryExactDataResolution =
  | {
      kind: 'resolved'
      section: NormalizedFusionExactDataSection
      value: unknown
    }
  | {
      kind: 'blocked'
      section: NormalizedFusionExactDataSection
    }
  | null

const SUBCATEGORY_TO_NORMALIZED_SECTIONS: Record<string, NormalizedExactPathCandidate[]> = {
  astro_transits_current: [{ section: 'transits' }],
  astro_transits_love: [{ section: 'transits' }],
  astro_transits_work: [{ section: 'transits' }],
  astro_transits_money: [{ section: 'transits' }],
  astro_transits_energy: [{ section: 'transits' }],
  astro_transits_relationships: [{ section: 'transits' }],
  astro_transits_timing: [{ section: 'transits' }],
  astro_retrogrades_current: [{ section: 'transits', path: 'retrogrades' }],
  astro_eclipses: [{ section: 'lunarReturn' }, { section: 'transits' }],
  astro_new_moon: [{ section: 'lunarReturn' }],
  astro_full_moon: [{ section: 'lunarReturn' }],
  astro_ingresses: [{ section: 'transits' }],
  astro_saturn_return: [{ section: 'solarReturn' }],
  astro_jupiter_return: [{ section: 'solarReturn' }],
  astro_nodal_return: [{ section: 'solarReturn' }],
  astro_uranus_opposition: [{ section: 'solarReturn' }],
  astro_midlife_transits: [{ section: 'transits' }],
  astro_progressions: [{ section: 'progressions' }],
  astro_secondary_progressions: [{ section: 'progressions', path: 'secondary_progressions' }],
  astro_solar_arc: [{ section: 'progressions', path: 'solar_arc' }],
  astro_solar_return: [{ section: 'solarReturn' }],
  astro_lunar_return: [{ section: 'lunarReturn' }],
  astro_annual_themes: [{ section: 'solarReturn' }],
  astro_monthly_cycles: [{ section: 'lunarReturn' }],
  hd_current_transits: [{ section: 'humanDesignTransits' }],
  hd_current_cycle: [{ section: 'humanDesignTransits' }],
  hd_lunar_cycle: [{ section: 'humanDesignTransits' }],
  hd_solar_cycle: [{ section: 'humanDesignTransits' }],
  hd_saturn_cycle: [{ section: 'humanDesignTransits' }],
  hd_uranus_cycle: [{ section: 'humanDesignTransits' }],
  hd_chiron_cycle: [{ section: 'humanDesignTransits' }],
  hd_return_reading: [{ section: 'humanDesignTransits' }],
  hd_variables: [{ section: 'humanDesignTransits' }],
  hd_arrows: [{ section: 'humanDesignTransits' }],
  hd_digestion: [{ section: 'humanDesignTransits' }],
  hd_environment: [{ section: 'humanDesignTransits' }],
  hd_perspective: [{ section: 'humanDesignTransits' }],
  hd_motivation: [{ section: 'humanDesignTransits' }],
  hd_cognition: [{ section: 'humanDesignTransits' }],
  hd_determination: [{ section: 'humanDesignTransits' }],
  num_personal_year: [{ section: 'numerologyCycles' }],
  num_personal_month: [{ section: 'numerologyCycles' }],
  num_personal_day: [{ section: 'numerologyCycles' }],
  num_pinnacles: [{ section: 'numerologyCycles' }],
  num_challenges: [{ section: 'numerologyCycles' }],
  num_essence: [{ section: 'numerologyCycles' }],
  num_transits: [{ section: 'numerologyCycles' }],
  num_period_cycles: [{ section: 'numerologyCycles' }],
  num_decision_timing: [{ section: 'numerologyCycles' }],
  kua_number: [{ section: 'kuaDirections' }],
  kua_favorable_directions: [{ section: 'kuaDirections' }],
  kua_unfavorable_directions: [{ section: 'kuaDirections' }],
  kua_bed_orientation: [{ section: 'kuaDirections' }],
  kua_desk_orientation: [{ section: 'kuaDirections' }],
  kua_front_door_orientation: [{ section: 'kuaDirections' }],
  kua_home_space_alignment: [{ section: 'kuaDirections' }],
}

const SUBCATEGORY_TO_LEGACY_EXACT_PATHS: Record<string, string[]> = {
  astro_transits_current: ['transits', 'current_transits'],
  astro_transits_love: ['transits', 'current_transits'],
  astro_transits_work: ['transits', 'current_transits'],
  astro_transits_money: ['transits', 'current_transits'],
  astro_transits_energy: ['transits', 'current_transits'],
  astro_transits_relationships: ['transits', 'current_transits'],
  astro_transits_timing: ['transits', 'current_transits'],
  astro_retrogrades_current: ['transits', 'current_transits'],
  astro_eclipses: ['lunar_return', 'lunarReturn', 'transits', 'current_transits'],
  astro_new_moon: ['lunar_return', 'lunarReturn'],
  astro_full_moon: ['lunar_return', 'lunarReturn'],
  astro_ingresses: ['transits', 'current_transits'],
  astro_saturn_return: ['solar_return', 'solarReturn'],
  astro_jupiter_return: ['solar_return', 'solarReturn'],
  astro_nodal_return: ['solar_return', 'solarReturn'],
  astro_uranus_opposition: ['solar_return', 'solarReturn'],
  astro_midlife_transits: ['transits', 'current_transits'],
  astro_progressions: ['progressions', 'secondary_progressions'],
  astro_secondary_progressions: ['progressions', 'secondary_progressions'],
  astro_solar_arc: ['progressions', 'secondary_progressions'],
  astro_solar_return: ['solar_return', 'solarReturn'],
  astro_lunar_return: ['lunar_return', 'lunarReturn'],
  astro_annual_themes: ['solar_return', 'solarReturn'],
  astro_monthly_cycles: ['lunar_return', 'lunarReturn'],
  hd_current_transits: ['human_design_transits', 'humanDesignTransits', 'hd_transits', 'hdTransits'],
  hd_current_cycle: ['human_design_transits', 'humanDesignTransits', 'hd_transits', 'hdTransits'],
  hd_lunar_cycle: ['human_design_transits', 'humanDesignTransits', 'hd_transits', 'hdTransits'],
  hd_solar_cycle: ['human_design_transits', 'humanDesignTransits', 'hd_transits', 'hdTransits'],
  hd_saturn_cycle: ['human_design_transits', 'humanDesignTransits', 'hd_transits', 'hdTransits'],
  hd_uranus_cycle: ['human_design_transits', 'humanDesignTransits', 'hd_transits', 'hdTransits'],
  hd_chiron_cycle: ['human_design_transits', 'humanDesignTransits', 'hd_transits', 'hdTransits'],
  hd_return_reading: ['human_design_transits', 'humanDesignTransits', 'hd_transits', 'hdTransits'],
  hd_variables: ['human_design_transits', 'humanDesignTransits', 'hd_transits', 'hdTransits'],
  hd_arrows: ['human_design_transits', 'humanDesignTransits', 'hd_transits', 'hdTransits'],
  hd_digestion: ['human_design_transits', 'humanDesignTransits', 'hd_transits', 'hdTransits'],
  hd_environment: ['human_design_transits', 'humanDesignTransits', 'hd_transits', 'hdTransits'],
  hd_perspective: ['human_design_transits', 'humanDesignTransits', 'hd_transits', 'hdTransits'],
  hd_motivation: ['human_design_transits', 'humanDesignTransits', 'hd_transits', 'hdTransits'],
  hd_cognition: ['human_design_transits', 'humanDesignTransits', 'hd_transits', 'hdTransits'],
  hd_determination: ['human_design_transits', 'humanDesignTransits', 'hd_transits', 'hdTransits'],
  hd_type: ['hdProfile', 'human_design', 'humanDesign'],
  hd_strategy: ['hdProfile', 'human_design', 'humanDesign'],
  hd_authority: ['hdProfile', 'human_design', 'humanDesign'],
  hd_centers_overview: ['hdProfile', 'human_design', 'humanDesign'],
  hd_gates: ['hdProfile', 'human_design', 'humanDesign'],
  hd_channels: ['hdProfile', 'human_design', 'humanDesign'],
  hd_incarnation_cross: ['hdProfile', 'human_design', 'humanDesign'],
  num_life_path: ['numerologyProfile', 'numerology', 'numerologie'],
  num_personal_year: ['numerologyProfile', 'numerology', 'numerologie'],
  num_personal_month: ['numerologyProfile', 'numerology', 'numerologie'],
  num_personal_day: ['numerologyProfile', 'numerology', 'numerologie'],
  num_pinnacles: ['numerology', 'numerologie'],
  num_challenges: ['numerology', 'numerologie'],
  num_essence: ['numerology', 'numerologie'],
  num_transits: ['numerology', 'numerologie'],
  num_period_cycles: ['numerology', 'numerologie'],
  num_decision_timing: ['numerology', 'numerologie'],
  kua_number: ['kua'],
  kua_favorable_directions: ['kua'],
  kua_unfavorable_directions: ['kua'],
  kua_bed_orientation: ['kua'],
  kua_desk_orientation: ['kua'],
  kua_front_door_orientation: ['kua'],
  kua_home_space_alignment: ['kua'],
  fusion_general: ['publicSummary', 'summary'],
  fusion_decision: ['publicSummary', 'summary'],
  fusion_relationships: ['publicSummary', 'summary'],
  fusion_timing: ['publicSummary', 'summary'],
}

const SCIENCE_DEFAULT_LEGACY_PATHS: Record<string, string[]> = {
  astro: ['astroProfile', 'astro', 'transits', 'current_transits'],
  human_design: ['hdProfile', 'human_design', 'humanDesign'],
  numerology: ['numerologyProfile', 'numerology', 'numerologie'],
  enneagram: ['enneagram', 'enneagramme'],
  kua: ['kua'],
  fusion: ['publicSummary', 'summary'],
}

export function getByPath(source: unknown, path: string): unknown {
  if (!source || typeof source !== 'object') return null

  const parts = path.split('.')
  let current: unknown = source

  for (const part of parts) {
    if (!current || typeof current !== 'object') {
      return null
    }

    current = (current as Record<string, unknown>)[part]
  }

  return current ?? null
}

export function hasNormalizedExactSectionMapping(subCategory: string): boolean {
  return Boolean(SUBCATEGORY_TO_NORMALIZED_SECTIONS[subCategory]?.length)
}

export function resolveSubCategoryLegacyExactValue(
  exactData: unknown,
  science: string,
  subCategory: string,
): unknown {
  const explicitPaths = SUBCATEGORY_TO_LEGACY_EXACT_PATHS[subCategory] ?? []
  const candidatePaths =
    explicitPaths.length > 0
      ? explicitPaths
      : (SCIENCE_DEFAULT_LEGACY_PATHS[science] ?? [])

  for (const path of candidatePaths) {
    const value = getByPath(exactData, path)
    if (value !== null && value !== undefined) {
      return value
    }
  }

  return null
}

export function resolveSubCategoryNormalizedExactValue(params: {
  exactData: NormalizedFusionExactData
  diagnostics: FusionExactDataDiagnostics
  subCategory: string
}): SubCategoryExactDataResolution {
  const candidates = SUBCATEGORY_TO_NORMALIZED_SECTIONS[params.subCategory] ?? []

  for (const candidate of candidates) {
    const source = params.diagnostics.sourceBySection[candidate.section]
    if (source === 'none') {
      continue
    }

    const sectionValue = params.exactData[candidate.section]

    if (candidate.path) {
      const nestedValue = getByPath(sectionValue, candidate.path)
      if (nestedValue !== null && nestedValue !== undefined) {
        return {
          kind: 'resolved',
          section: candidate.section,
          value: nestedValue,
        }
      }
    }

    if (sectionValue !== null && sectionValue !== undefined) {
      return {
        kind: 'resolved',
        section: candidate.section,
        value: sectionValue,
      }
    }

    return {
      kind: 'blocked',
      section: candidate.section,
    }
  }

  return null
}
