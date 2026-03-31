import { describe, expect, it } from 'vitest'
import { buildScienceDetectionResult } from '@/lib/hexastra/engine/scienceQueryBuilder'
import { disambiguateDetectionResult } from '@/lib/hexastra/engine/disambiguateDetectionResult'

function disambiguate(query: string, context?: Parameters<typeof disambiguateDetectionResult>[1]) {
  return disambiguateDetectionResult(buildScienceDetectionResult(query), context)
}

describe('disambiguateDetectionResult', () => {
  it('keeps "mon type" ambiguous between HD and enneagram', () => {
    const result = disambiguate('mon type')

    expect(result.prioritizedSubCategories).toEqual(
      expect.arrayContaining(['hd_type', 'ennea_type_core']),
    )
    expect(result.dominantScience).toBeNull()
    expect(result.ambiguities.some((entry) => entry.term === 'type' && entry.resolvedTo === null)).toBe(true)
  })

  it('keeps "mon profil" open across several profile sciences', () => {
    const result = disambiguate('mon profil')

    expect(result.prioritizedSubCategories).toEqual(
      expect.arrayContaining(['hd_profile', 'num_core_profile', 'kua_profile']),
    )
    expect(result.dominantScience).toBeNull()
  })

  it('expands "mon cycle actuel" into timing-oriented candidates without forcing one science', () => {
    const result = disambiguate('mon cycle actuel')

    expect(result.prioritizedSubCategories).toEqual(
      expect.arrayContaining(['fusion_timing', 'astro_transits_current', 'num_personal_year', 'hd_current_cycle']),
    )
    expect(result.dominantScience).toBeNull()
  })

  it('keeps "ma direction" ambiguous between decision and Kua', () => {
    const result = disambiguate('ma direction')

    expect(result.prioritizedSubCategories).toEqual(
      expect.arrayContaining(['fusion_decision', 'kua_favorable_directions']),
    )
    expect(result.dominantScience).toBeNull()
  })

  it('keeps "mon retour" open across return families', () => {
    const result = disambiguate('mon retour')

    expect(result.prioritizedSubCategories).toEqual(
      expect.arrayContaining(['astro_solar_return', 'astro_lunar_return', 'astro_saturn_return', 'hd_return_reading']),
    )
    expect(result.dominantScience).toBeNull()
  })

  it('keeps "ma compatibilité" open across relationship sciences', () => {
    const result = disambiguate('ma compatibilité')

    expect(result.prioritizedSubCategories).toEqual(
      expect.arrayContaining([
        'astro_synastry',
        'hd_connection_dynamics',
        'num_relationship_compatibility',
        'ennea_relationship_dynamics',
      ]),
    )
    expect(result.dominantScience).toBeNull()
  })

  it('picks fusion as dominant for a generic current-life question', () => {
    const result = disambiguate('que se passe-t-il pour moi en ce moment', { hasBirthData: true })

    expect(result.prioritizedSubCategories).toEqual(
      expect.arrayContaining(['fusion_general', 'fusion_timing', 'fusion_life_situation', 'astro_transits_current']),
    )
    expect(result.dominantScience).toBe('fusion')
  })

  it('resolves "compatibilite astrologique" to astro synastry', () => {
    const result = disambiguate('compatibilite astrologique')

    expect(result.dominantScience).toBe('astro')
    expect(result.dominantSubCategory).toBe('astro_synastry')
  })

  it('resolves "mon type hd" to Human Design', () => {
    const result = disambiguate('mon type hd', { hasBirthData: true })

    expect(result.dominantScience).toBe('human_design')
    expect(result.dominantSubCategory).toBe('hd_type')
  })

  it('resolves "mon profil human design" to the HD profile', () => {
    const result = disambiguate('mon profil human design', { hasBirthData: true })

    expect(result.dominantScience).toBe('human_design')
    expect(result.dominantSubCategory).toBe('hd_profile')
  })

  it('resolves "mon année perso" to numerology', () => {
    const result = disambiguate('mon année perso')

    expect(result.dominantScience).toBe('numerology')
    expect(result.dominantSubCategory).toBe('num_personal_year')
  })

  it('resolves "mes directions favorables" to Kua', () => {
    const result = disambiguate('mes directions favorables')

    expect(result.dominantScience).toBe('kua')
    expect(result.dominantSubCategory).toBe('kua_favorable_directions')
  })

  it('keeps "quelle direction prendre" on the fusion decision side when no spatial cue is present', () => {
    const result = disambiguate('quelle direction prendre')

    expect(result.prioritizedSubCategories[0]).toBe('fusion_decision')
    expect(result.dominantSubCategory).toBe('fusion_decision')
    expect(result.prioritizedSciences[0]).toBe('fusion')
  })

  it('prioritizes annual guidance for yearly strategic questions', () => {
    const result = disambiguate('sur quoi me concentrer cette annee ?')

    expect(result.prioritizedSubCategories).toEqual(
      expect.arrayContaining([
        'annual_guidance',
        'astro_annual_themes',
        'astro_solar_return',
        'astro_progressions',
        'num_personal_year',
        'hd_current_transits',
      ]),
    )
    expect(result.prioritizedSubCategories[0]).toBe('annual_guidance')
  })

  it.each([
    'qu est-ce que je dois arreter en 2026 ?',
    'quel axe choisir ?',
    'ou je perds mon energie ?',
  ])('prioritizes annual guidance for strategic variant: %s', (query) => {
    const result = disambiguate(query)

    expect(result.prioritizedSubCategories[0]).toBe('annual_guidance')
    expect(result.prioritizedSubCategories).toEqual(
      expect.arrayContaining([
        'annual_guidance',
        'astro_solar_return',
        'astro_progressions',
        'num_personal_year',
        'hd_current_transits',
      ]),
    )
  })
})
