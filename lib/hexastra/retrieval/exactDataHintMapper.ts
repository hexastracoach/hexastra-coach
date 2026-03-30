import type { RetrievalPlan } from './retrievalPlanBuilder'

export type ExactDataRequest = {
  includeTransits?: boolean
  includeProgressions?: boolean
  includeSolarReturn?: boolean
  includeLunarReturn?: boolean
  includeHumanDesignTransits?: boolean
  includeNumerologyCycles?: boolean
  includeKuaDirections?: boolean
}

function hasAny(items: string[], candidates: string[]) {
  return candidates.some((candidate) => items.includes(candidate))
}

function hasHint(hints: string[], candidate: string) {
  return hints.includes(candidate)
}

export function buildExactDataRequestFromRetrievalPlan(
  retrievalPlan: RetrievalPlan,
): ExactDataRequest {
  const subCategories = retrievalPlan.subCategories ?? []
  const exactDataHints = retrievalPlan.exactDataHints ?? []

  const includeTransits =
    subCategories.some((subCategory) => subCategory.startsWith('astro_transits_')) ||
    hasAny(subCategories, [
      'astro_retrogrades_current',
      'astro_eclipses',
      'astro_new_moon',
      'astro_full_moon',
      'astro_ingresses',
      'astro_saturn_return',
      'astro_jupiter_return',
      'astro_nodal_return',
      'astro_uranus_opposition',
      'astro_midlife_transits',
      'astro_annual_themes',
      'astro_monthly_cycles',
    ]) ||
    hasHint(exactDataHints, 'include_transits')

  const includeProgressions =
    hasAny(subCategories, [
      'astro_progressions',
      'astro_secondary_progressions',
      'astro_solar_arc',
    ]) || hasHint(exactDataHints, 'include_progressions')

  const includeSolarReturn =
    hasAny(subCategories, [
      'astro_solar_return',
      'astro_annual_themes',
      'astro_saturn_return',
      'astro_jupiter_return',
      'astro_nodal_return',
      'astro_uranus_opposition',
    ]) ||
    hasHint(exactDataHints, 'include_solar_return')

  const includeLunarReturn =
    hasAny(subCategories, [
      'astro_lunar_return',
      'astro_monthly_cycles',
      'astro_new_moon',
      'astro_full_moon',
      'astro_eclipses',
    ]) ||
    hasHint(exactDataHints, 'include_lunar_return')

  const includeHumanDesignTransits =
    hasAny(subCategories, [
      'hd_current_transits',
      'hd_current_cycle',
      'hd_lunar_cycle',
      'hd_solar_cycle',
      'hd_saturn_cycle',
      'hd_uranus_cycle',
      'hd_chiron_cycle',
      'hd_return_reading',
      'hd_variables',
      'hd_arrows',
      'hd_digestion',
      'hd_environment',
      'hd_perspective',
      'hd_motivation',
      'hd_cognition',
      'hd_determination',
      'hd_sleep_design',
      'hd_business_team',
      'hd_parent_child',
    ]) || hasHint(exactDataHints, 'include_human_design_transits')

  const includeNumerologyCycles =
    hasAny(subCategories, [
      'num_personal_year',
      'num_personal_month',
      'num_personal_day',
      'num_pinnacles',
      'num_challenges',
      'num_essence',
      'num_transits',
      'num_period_cycles',
      'num_decision_timing',
    ]) || hasHint(exactDataHints, 'include_numerology_cycles')

  const includeKuaDirections =
    hasAny(subCategories, [
      'kua_sheng_chi',
      'kua_tien_yi',
      'kua_nien_yen',
      'kua_fu_wei',
      'kua_ho_hai',
      'kua_wu_kuei',
      'kua_liu_sha',
      'kua_chueh_ming',
      'kua_favorable_directions',
      'kua_unfavorable_directions',
      'kua_bed_orientation',
      'kua_desk_orientation',
      'kua_front_door_orientation',
      'kua_sleep_axis',
      'kua_work_axis',
      'kua_home_space_alignment',
      'kua_decision_direction',
      'kua_move_location',
      'kua_geo_alignment',
    ]) || hasHint(exactDataHints, 'include_kua_directions')

  return {
    ...(includeTransits ? { includeTransits: true } : {}),
    ...(includeProgressions ? { includeProgressions: true } : {}),
    ...(includeSolarReturn ? { includeSolarReturn: true } : {}),
    ...(includeLunarReturn ? { includeLunarReturn: true } : {}),
    ...(includeHumanDesignTransits ? { includeHumanDesignTransits: true } : {}),
    ...(includeNumerologyCycles ? { includeNumerologyCycles: true } : {}),
    ...(includeKuaDirections ? { includeKuaDirections: true } : {}),
  }
}
