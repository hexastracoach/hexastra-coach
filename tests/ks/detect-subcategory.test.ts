/**
 * Tests de détection multi-sous-catégories — toutes sciences
 */
import { describe, it, expect } from 'vitest'
import { detectSubcategory } from '@/lib/hexastra/orchestration/detectSubcategory'
import { buildFusionContext } from '@/lib/hexastra/orchestration/fusionEngine'

// ─── Helpers ───────────────────────────────────────────────────────────────

function expectPrimary(text: string, expectedSubcat: string, expectedScience: string) {
  const result = detectSubcategory(text)
  expect(result.primary?.subcategory, `"${text}" → primary subcat`).toBe(expectedSubcat)
  expect(result.primary?.science, `"${text}" → primary science`).toBe(expectedScience)
}

function expectMulti(text: string, expectedSubcats: string[]) {
  const result = detectSubcategory(text)
  const found = result.matches.map((m) => m.subcategory)
  for (const sub of expectedSubcats) {
    expect(found, `"${text}" → should contain "${sub}"`).toContain(sub)
  }
  expect(result.analysisMode, `"${text}" → analysisMode`).toBe(expectedSubcats.length >= 2 ? 'multi' : 'single')
}

// ─── ASTROLOGIE ────────────────────────────────────────────────────────────

describe('Astrologie', () => {
  it('transits', () => expectPrimary('mes transits du jour', 'transits', 'astrology'))
  it('rétrograde', () => expectPrimary('mercure rétrograde en ce moment', 'retrograde', 'astrology'))
  it('ascendant', () => expectPrimary('quel est mon ascendant', 'ascendant', 'astrology'))
  it('thème natal', () => expectPrimary('mon thème natal complet', 'theme_natal', 'astrology'))
  it('maisons', () => expectPrimary('ma maison 7 en astrologie', 'maisons', 'astrology'))
  it('aspects du moment basculent vers les transits actuels', () => expectPrimary('mes aspects du jour trigone', 'transits', 'astrology'))
  it('planètes', () => expectPrimary('Vénus en Taureau que ça signifie', 'planetes', 'astrology'))
  it('lune natale', () => expectPrimary('mon signe lunaire', 'signe_lunaire', 'astrology'))
  it('synastrie', () => expectPrimary('synastrie avec mon partenaire', 'compatibilite_astro', 'astrology'))
  it('retour solaire', () => expectPrimary('mon retour solaire cette année', 'cycle', 'astrology'))
})

// ─── NUMÉROLOGIE ───────────────────────────────────────────────────────────

describe('Numérologie', () => {
  it('année personnelle', () => expectPrimary('mon année personnelle', 'annee_personnelle', 'numerology'))
  it('mois personnel', () => expectPrimary('quel est mon mois personnel', 'mois_personnel', 'numerology'))
  it('jour personnel', () => expectPrimary('vibration du jour', 'jour_personnel', 'numerology'))
  it('chemin de vie', () => expectPrimary('mon chemin de vie', 'chemin_de_vie', 'numerology'))
  it("nombre d'expression", () => expectPrimary("mon nombre d'expression", 'expression', 'numerology'))
  it("nombre d'âme", () => expectPrimary("mon nombre d'âme", 'ame', 'numerology'))
  it('personnalité num', () => expectPrimary('nombre de personnalité', 'personnalite_num', 'numerology'))
  it('cycle de vie num', () => expectPrimary('mon cycle de vie num', 'cycle_vie', 'numerology'))
})

// ─── HUMAN DESIGN ──────────────────────────────────────────────────────────

describe('Human Design', () => {
  it('type HD', () => expectPrimary('mon type human design', 'type_hd', 'human_design'))
  it('générateur', () => expectPrimary('je suis générateur HD', 'type_hd', 'human_design'))
  it('projecteur', () => expectPrimary('projecteur en human design', 'type_hd', 'human_design'))
  it('stratégie HD', () => expectPrimary('ma stratégie hd attendre la réponse', 'strategie_hd', 'human_design'))
  it('autorité HD', () => expectPrimary('mon autorité sacrale hd', 'autorite_hd', 'human_design'))
  it('profil HD', () => expectPrimary('mon profil hd 2/4', 'profil_hd', 'human_design'))
  it('centres HD', () => expectPrimary('mes centres définis hd', 'centres_hd', 'human_design'))
  it('portes HD', () => expectPrimary('porte 17 hd activée', 'portes_hd', 'human_design'))
  it('croix incarnation', () => expectPrimary('ma croix d\'incarnation', 'croix_incarnation', 'human_design'))
  it('transits HD', () => expectPrimary('transits human design aujourd\'hui', 'transits_hd', 'human_design'))
})

// ─── ENNÉAGRAMME ───────────────────────────────────────────────────────────

describe('Ennéagramme', () => {
  it('type ennéa', () => expectPrimary('mon type ennéagramme', 'type_enn', 'enneagram'))
  it('aile ennéa', () => expectPrimary('mon aile 4 ennéa', 'aile_enn', 'enneagram'))
  it('instinct conservation', () => expectPrimary('instinct de conservation', 'instinct_enn', 'enneagram'))
  it('instinct social', () => expectPrimary('sous-type social sp/so', 'instinct_enn', 'enneagram'))
  it('intégration ennéa', () => expectPrimary('direction de croissance ennéa', 'integration_enn', 'enneagram'))
  it('désintégration', () => expectPrimary('désintégration stress point', 'desintegration_enn', 'enneagram'))
  it('centre ennéa', () => expectPrimary('triades instinctif émotionnel mental', 'centre_enn', 'enneagram'))
})

// ─── KUA ───────────────────────────────────────────────────────────────────

describe('Kua', () => {
  it('nombre kua', () => expectPrimary('mon nombre kua', 'nombre_kua', 'kua'))
  it('directions kua', () => expectPrimary('mes directions favorables kua', 'direction_kua', 'kua'))
  it('orientation habitat', () => expectPrimary('orientation maison kua chambre', 'orientation_habitat', 'kua'))
  it('orientation bureau', () => expectPrimary('direction de travail kua bureau', 'orientation_bureau', 'kua'))
  it('sommeil kua', () => expectPrimary('tête du lit direction sommeil kua', 'direction_sommeil', 'kua'))
  it('feng shui', () => expectPrimary('feng shui de mon espace', 'feng_shui', 'kua'))
})

// ─── HEXASTRA FUSION ───────────────────────────────────────────────────────

describe('Hexastra Fusion', () => {
  it('priorites annuelles', () => expectPrimary('quelles sont mes priorites pour 2026 ?', 'annual_guidance', 'hexastra_fusion'))
  it('concentration annuelle', () => expectPrimary('sur quoi je dois me concentrer cette annee ?', 'annual_guidance', 'hexastra_fusion'))
  it('arret annuel', () => expectPrimary('qu est-ce que je dois arreter en 2026 ?', 'annual_guidance', 'hexastra_fusion'))
  it('axe strategique sans annee explicite', () => expectPrimary('quel axe choisir ?', 'annual_guidance', 'hexastra_fusion'))
  it('dispersion strategique sans annee explicite', () => expectPrimary('ou je perds mon energie ?', 'annual_guidance', 'hexastra_fusion'))
  it('lecture fusionnée', () => expectPrimary('lecture fusionnée hexastra', 'lecture_fusionnee', 'hexastra_fusion'))
  it('timing fusion', () => expectPrimary('meilleur moment pour lancer mon projet', 'timing_fusion', 'hexastra_fusion'))
  it('décision fusion', () => expectPrimary('aide-moi à décider entre deux options', 'decision_fusion', 'hexastra_fusion'))
  it('état émotionnel', () => expectPrimary('je me sens perdu et bloqué', 'etat_emotionnel', 'hexastra_fusion'))
  it('lecture générale', () => expectPrimary('lecture générale de ma situation', 'lecture_generale', 'hexastra_fusion'))
})

// ─── MULTI-DÉTECTION ───────────────────────────────────────────────────────

describe('Multi-détection', () => {
  it('ascendant + maison 1 → 2 matches astro', () =>
    expectMulti('mon ascendant et ma maison 1', ['ascendant', 'maisons']))

  it('année personnelle + transits → astro + numérologie', () =>
    expectMulti('année personnelle et transits du jour', ['annee_personnelle', 'transits']))

  it('type HD + stratégie HD → 2 matches HD', () =>
    expectMulti('mon type human design et ma stratégie hd', ['type_hd', 'strategie_hd']))

  it('thème natal + chemin de vie → astro + numérologie', () =>
    expectMulti('thème natal et chemin de vie', ['theme_natal', 'chemin_de_vie']))

  it('aile ennéa + autorité HD → ennéagramme + human design', () =>
    expectMulti('mon aile ennéa 5 et mon autorité sacrale hd', ['aile_enn', 'autorite_hd']))
})

// ─── FUSION ENGINE ─────────────────────────────────────────────────────────

describe('buildFusionContext', () => {
  it('même science → internal fusion', () => {
    const result = detectSubcategory('mon ascendant et ma maison 7')
    const fusion = buildFusionContext(result.matches, 'essential')
    expect(fusion.fusionType).toBe('internal')
    expect(fusion.analysisMode).toBe('fusion')
  })

  it('2 sciences différentes → inter_science', () => {
    const result = detectSubcategory('transits du jour et année personnelle')
    const fusion = buildFusionContext(result.matches, 'premium')
    expect(fusion.fusionType).toBe('inter_science')
    expect(fusion.analysisMode).toBe('fusion')
  })

  it('plan free → multi (pas fusion)', () => {
    const result = detectSubcategory('transits du jour et année personnelle')
    const fusion = buildFusionContext(result.matches, 'free')
    expect(fusion.analysisMode).toBe('multi')
  })

  it('hexastra_fusion explicite → hexastra', () => {
    const result = detectSubcategory('lecture fusionnée hexastra multi-sciences')
    const fusion = buildFusionContext(result.matches, 'premium')
    expect(fusion.fusionType).toBe('hexastra')
  })
})
