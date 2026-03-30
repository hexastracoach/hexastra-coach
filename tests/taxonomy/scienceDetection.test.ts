import { describe, expect, it } from 'vitest'

import {
  buildScienceDetectionResult,
  detectSciences,
  detectSubCategories,
  detectUserIntent,
  normalizeUserQuery,
  requiresTransits,
} from '@/lib/hexastra/engine/scienceQueryBuilder'
import {
  applySynonyms,
  normalizeText,
  prepareQuery,
} from '@/lib/hexastra/taxonomy/scienceSynonyms'
import {
  getSciencesForIntent,
  getSubCategoriesForIntent,
} from '@/lib/hexastra/taxonomy/intentScienceMap'

describe('taxonomy normalization', () => {
  it('normalizes accents, apostrophes and spaces', () => {
    expect(normalizeText("L'Ennéagramme   et l'ascendant")).toBe('l enneagramme et l ascendant')
  })

  it('applies expected synonyms', () => {
    expect(applySynonyms('mon hd actuel')).toContain('human design')
    expect(applySynonyms('annee perso 2026')).toContain('annee personnelle')
    expect(applySynonyms('mon wing enneagramme')).toContain('aile')
    expect(applySynonyms('feng shui perso maison')).toContain('kua')
  })

  it('keeps short synonyms boundary-safe', () => {
    expect(prepareQuery('mes aspects majeurs')).toContain('aspect')
    expect(prepareQuery('mon instinct sp en ennea')).toContain('instinct de conservation')
  })

  it('normalizes the full user query pipeline', () => {
    const query = normalizeUserQuery('Mon THÈME astral et mon Hd')
    expect(query).toContain('theme natal')
    expect(query).toContain('human design')
  })
})

describe('astro detection', () => {
  it('detects transits, ascendant and houses', () => {
    expect(detectSubCategories('mes transits actuels').map((item) => item.key)).toContain('astro_transits_current')
    expect(detectSubCategories('mon ascendant').map((item) => item.key)).toContain('astro_sign_rising')

    const houseKeys = detectSubCategories('saturne en maison 7').map((item) => item.key)
    expect(houseKeys).toContain('astro_planets_houses')
    expect(houseKeys).toContain('astro_house_1_to_12')
  })

  it('detects dignities and derived subcategories', () => {
    const keys = detectSubCategories('mes planètes en exil').map((item) => item.key)
    expect(keys).toContain('astro_dignities')
    expect(keys).toContain('astro_detriment')
  })

  it('detects saturn return and astrocartography', () => {
    expect(detectSubCategories('retour de saturne').map((item) => item.key)).toContain('astro_saturn_return')

    const keys = detectSubCategories('où vivre selon mon astro').map((item) => item.key)
    expect(keys).toContain('astro_astrocartography')
  })
})

describe('numerology detection', () => {
  it('detects life path, personal year and karmic debt', () => {
    expect(detectSubCategories('mon chemin de vie').map((item) => item.key)).toContain('num_life_path')
    expect(detectSubCategories('mon année perso 2026').map((item) => item.key)).toContain('num_personal_year')
    expect(detectSubCategories('ma dette karmique').map((item) => item.key)).toContain('num_karmic_debt')
  })

  it('detects name vibration, house number and repeating numbers', () => {
    const nameKeys = detectSubCategories('vibration de mon prénom').map((item) => item.key)
    expect(nameKeys).toContain('num_name_analysis')

    expect(detectSubCategories('numéro de maison').map((item) => item.key)).toContain('num_house_number')
    expect(detectSubCategories('je vois souvent 111 et 222').map((item) => item.key)).toContain('num_repeating_numbers')
  })
})

describe('human design detection', () => {
  it('detects type, strategy, centers and channels', () => {
    expect(detectSubCategories('mon type hd').map((item) => item.key)).toContain('hd_type')
    expect(detectSubCategories('ma stratégie').map((item) => item.key)).toContain('hd_strategy')

    const centerKeys = detectSubCategories('mes centres hd').map((item) => item.key)
    expect(centerKeys).toContain('hd_centers_overview')

    const openCenterKeys = detectSubCategories('mes centres ouverts hd').map((item) => item.key)
    expect(openCenterKeys).toContain('hd_open_centers')

    expect(detectSubCategories('mes canaux').map((item) => item.key)).toContain('hd_channels')
  })

  it('detects incarnation cross, gates and current transits', () => {
    expect(detectSubCategories("ma croix d'incarnation").map((item) => item.key)).toContain('hd_incarnation_cross')
    expect(detectSubCategories('mes gates hd').map((item) => item.key)).toContain('hd_gates')
    expect(detectSubCategories('mes transits human design').map((item) => item.key)).toContain('hd_current_transits')
  })

  it('detects advanced HD categories', () => {
    expect(detectSubCategories('bg5').map((item) => item.key)).toContain('hd_bg5')
  })
})

describe('enneagram detection', () => {
  it('detects core type, wings and instincts', () => {
    expect(detectSubCategories('je suis quel type ennéagramme').map((item) => item.key)).toContain('ennea_type_core')
    expect(detectSubCategories('mon aile').map((item) => item.key)).toContain('ennea_wings')
    expect(detectSubCategories('mon instinct dominant').map((item) => item.key)).toContain('ennea_instincts')
  })

  it('detects relationship and disintegration patterns', () => {
    const coupleKeys = detectSubCategories('mon style en couple').map((item) => item.key)
    expect(coupleKeys).toContain('ennea_relationship_dynamics')

    const disintegrationKeys = detectSubCategories('désintégration du type 6').map((item) => item.key)
    expect(disintegrationKeys).toContain('ennea_disintegration')
    expect(disintegrationKeys).toContain('ennea_type_6')
  })
})

describe('kua detection', () => {
  it('detects kua number, directions and orientation queries', () => {
    expect(detectSubCategories('mon nombre kua').map((item) => item.key)).toContain('kua_number')
    expect(detectSubCategories('mes directions favorables').map((item) => item.key)).toContain('kua_favorable_directions')
    expect(detectSubCategories('orientation de mon lit').map((item) => item.key)).toContain('kua_bed_orientation')
    expect(detectSubCategories('où placer mon bureau').map((item) => item.key)).toContain('kua_desk_orientation')
  })
})

describe('fusion detection and fallback', () => {
  it('detects fusion categories on general life questions', () => {
    expect(detectSubCategories('pourquoi je bloque en ce moment').map((item) => item.key)).toContain('fusion_blockage')
    expect(detectSubCategories('que dois-je faire maintenant').map((item) => item.key)).toContain('fusion_decision')
    expect(detectSubCategories("qu'est-ce que je traverse dans ma vie").map((item) => item.key)).toContain('fusion_life_situation')
  })

  it('falls back to fusion_general when nothing matches', () => {
    const subCategories = detectSubCategories('qvsdflkjsdflkj random text 123')
    expect(subCategories[0]?.key).toBe('fusion_general')

    const result = buildScienceDetectionResult('qwerty no match xyz')
    expect(result.fallbackUsed).toBe(true)
    expect(result.sciences).toContain('fusion')
    expect(result.subCategories).toContain('fusion_general')
  })
})

describe('science and intent resolution', () => {
  it('supports multi-science direct matching', () => {
    const sciences = detectSciences('mon année personnelle et mes transits actuels')
    expect(sciences).toContain('astro')
    expect(sciences).toContain('numerology')
  })

  it('supports multi-science broad matching', () => {
    const sciences = detectSciences('mon type hd, mon ascendant et mon ennéagramme')
    expect(sciences).toContain('human_design')
    expect(sciences).toContain('astro')
    expect(sciences).toContain('enneagram')
  })

  it('uses intent expansion for general decision prompts', () => {
    const result = buildScienceDetectionResult('que dois-je faire maintenant')
    expect(result.sciences).toContain('fusion')
    expect(result.sciences).toContain('astro')
    expect(result.sciences).toContain('human_design')
    expect(result.sciences).toContain('numerology')
    expect(result.subCategories).toContain('fusion_decision')
    expect(result.subCategories).toContain('hd_strategy')
    expect(result.subCategories).toContain('astro_transits_timing')
  })

  it('detects user intents', () => {
    expect(detectUserIntent('est-ce le bon moment pour agir')).toContain('timing')
    expect(detectUserIntent('je dois choisir entre deux options')).toContain('make_decision')
    expect(detectUserIntent('je bloque et rien ne change')).toContain('understand_block')
    expect(detectUserIntent('ma carrière et mes finances vont mal')).toContain('career_money')
    expect(detectUserIntent('comprendre mon couple')).toContain('understand_relationship')
    expect(detectUserIntent('qwerty xyz 999')).toContain('general')
  })
})

describe('intent mapping helpers', () => {
  it('returns mapped subcategories and sciences', () => {
    expect(getSubCategoriesForIntent('understand_period')).toContain('astro_transits_current')
    expect(getSubCategoriesForIntent('home_space')).toContain('kua_favorable_directions')
    expect(getSubCategoriesForIntent('general')).toContain('fusion_general')

    expect(getSciencesForIntent('make_decision')).toContain('human_design')
    expect(getSciencesForIntent('home_space')).toContain('kua')
  })
})

describe('result shape and retro-compatibility', () => {
  it('returns the complete detection result shape', () => {
    const result = buildScienceDetectionResult('retour de saturne')
    expect(result.normalizedQuery).toBeTruthy()
    expect(result.sciences).toContain('astro')
    expect(result.subCategories).toContain('astro_saturn_return')
    expect(result.intents.length).toBeGreaterThan(0)
    expect(result.matches.length).toBeGreaterThan(0)
    expect(result.fallbackUsed).toBe(false)
  })

  it('sorts matches by descending score', () => {
    const scores = buildScienceDetectionResult('mes transits actuels').matches.map((match) => match.score)
    for (let index = 0; index < scores.length - 1; index += 1) {
      expect(scores[index]).toBeGreaterThanOrEqual(scores[index + 1] ?? 0)
    }
  })

  it('keeps requiresTransits compatible with the routing layer', () => {
    expect(requiresTransits(detectSubCategories('mes transits actuels'))).toBe(true)
    expect(requiresTransits(detectSubCategories('mes transits human design'))).toBe(true)
    expect(requiresTransits(detectSubCategories('mon chemin de vie'))).toBe(false)
  })
})
