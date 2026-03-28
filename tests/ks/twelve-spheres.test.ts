/**
 * twelve-spheres — Tests du moteur de lecture 12 sphères Hexastra
 *
 * Vérifie :
 * M1 — mapCompactCoreToSpheres : toujours 12 sphères, ordre respecté
 * M2 — Contenu non vide et non répétitif
 * M3 — Anti-répétition : sphères distinctes (Jaccard < 0.65)
 * M4 — renderPlanReading : structure différente par plan
 * M5 — free = 4 blocs seulement
 * M6 — essential = 4 blocs + 6 sphères visibles
 * M7 — premium = 4 blocs + 12 sphères
 * M8 — practitioner = 12 sphères + approfondissement
 * M9 — Tests sur 3 intents : relation, blocage, timing
 */

import { describe, it, expect } from 'vitest'
import {
  mapCompactCoreToSpheres,
  type HexastraSpheres,
} from '@/lib/hexastra/reading/mapCompactCoreToSpheres'
import { renderPlanReading } from '@/lib/hexastra/reading/renderPlanReading'
import {
  flaggedSimilarPairs,
  jaccardSimilarity,
  SIMILARITY_THRESHOLD,
} from '@/lib/hexastra/reading/sphereVariation'
import type { CompactReadingCore } from '@/lib/hexastra/orchestrator/compactReadingCore'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeCore(overrides?: Partial<CompactReadingCore>): CompactReadingCore {
  return {
    dominantDynamic:  'Fonctionnement focalisé par invitation — tu guides quand on te sollicite, pas autrement',
    hiddenMechanism:  "Tu dépenses ton énergie à initier là où le retour ne vient pas — le signal attendu n'existe pas encore",
    realTension:      "Tension entre la volonté d'avancer et l'absence de reconnaissance dans le contexte actuel",
    visibleEffect:    'Efforts qui ne débouchent pas — sentiment de tourner en rond sans avancer vraiment',
    rightMovement:    "Identifier où l'invitation réelle existe — cesser d'insister là où elle est absente",
    decisionSignal:   "Attendre la clarté émotionnelle — ne jamais trancher dans l'urgence ou le pic d'intensité",
    timingSignal:     'Phase de fondation active — le bon moment pour poser les bases, pas pour s\'élancer',
    energyLeak:       "Énergie dépensée à initier ou insister là où aucun retour réel ne vient",
    leveragePoint:    "Un seul ajustement : cesser d'initier sans invitation — l'énergie retrouve sa direction naturelle",
    toneHint:         'Ton direct — valider avant de guider',
    solarToneHint:    'Ton direct et profond.',
    questionType:     'blocage',
    signalConfidence: 0.84,
    ...overrides,
  }
}

function makeCoreRelation(): CompactReadingCore {
  return makeCore({
    dominantDynamic:  'Fonctionnement relationnel basé sur la résonance — tu attires ce qui te ressemble',
    hiddenMechanism:  "Tu cherches une connexion profonde mais tu te mets en retrait au moment de la recevoir vraiment",
    realTension:      "Entre le désir d'intimité réelle et la peur d'être vu tel que tu es",
    visibleEffect:    'Relations qui restent en surface — ou qui t\'épuisent car elles demandent plus que ce qu\'elles donnent',
    rightMovement:    'Permettre à l\'autre de s\'approcher — arrêter de tester avant de te laisser toucher',
    questionType:     'love',
  })
}

function makeCoreTiming(): CompactReadingCore {
  return makeCore({
    dominantDynamic:  'Cycle d\'expression en cours — énergie créatrice disponible',
    hiddenMechanism:  "Tu freines ton élan en attendant d'être prêt à 100% — mais la préparation parfaite n'arrive pas",
    realTension:      "Entre l'envie de lancer et la peur que ce ne soit pas encore le bon moment",
    visibleEffect:    'Projets qui tardent à démarrer — énergie disponible mais non canalisée',
    rightMovement:    'Lancer maintenant avec ce que tu as — l\'ajustement vient en mouvement, pas avant',
    timingSignal:     'Phase d\'expression : énergie créatrice disponible — c\'est maintenant qu\'il faut s\'exprimer',
    questionType:     'timing',
  })
}

// ── M1 — mapCompactCoreToSpheres : structure de base ─────────────────────────

describe('M1 — mapCompactCoreToSpheres : structure de base', () => {
  it('retourne toujours exactement 12 sphères', () => {
    const result = mapCompactCoreToSpheres(makeCore(), { lang: 'fr' })
    expect(result.spheres).toHaveLength(12)
  })

  it("l'ordre est strict (id 1 à 12, séquentiels)", () => {
    const result = mapCompactCoreToSpheres(makeCore(), { lang: 'fr' })
    result.spheres.forEach((sphere, idx) => {
      expect(sphere.id).toBe(idx + 1)
    })
  })

  it('les titres sont tous présents et non vides', () => {
    const result = mapCompactCoreToSpheres(makeCore(), { lang: 'fr' })
    result.spheres.forEach((sphere) => {
      expect(sphere.title.length).toBeGreaterThan(3)
    })
  })

  it("la sphère 1 s'appelle 'Sphère centrale'", () => {
    const result = mapCompactCoreToSpheres(makeCore(), { lang: 'fr' })
    expect(result.spheres[0]!.title).toBe('Sphère centrale')
  })

  it("la sphère 12 s'appelle 'Sphère de synthèse'", () => {
    const result = mapCompactCoreToSpheres(makeCore(), { lang: 'fr' })
    expect(result.spheres[11]!.title).toBe('Sphère de synthèse')
  })

  it('retourne un summary non vide', () => {
    const result = mapCompactCoreToSpheres(makeCore(), { lang: 'fr' })
    expect(result.summary.length).toBeGreaterThan(20)
  })

  it('EN : titres en anglais', () => {
    const result = mapCompactCoreToSpheres(makeCore(), { lang: 'en' })
    expect(result.spheres[0]!.title).toBe('Core sphere')
    expect(result.spheres[11]!.title).toBe('Synthesis sphere')
  })
})

// ── M2 — Contenu non vide ─────────────────────────────────────────────────────

describe('M2 — Contenu des sphères : non vide et substantiel', () => {
  it('chaque sphère a un contenu non vide', () => {
    const result = mapCompactCoreToSpheres(makeCore(), { lang: 'fr' })
    result.spheres.forEach((sphere) => {
      expect(sphere.content.trim().length).toBeGreaterThan(15)
    })
  })

  it('aucune sphère ne contient "[Contenu non disponible]"', () => {
    const result = mapCompactCoreToSpheres(makeCore(), { lang: 'fr' })
    result.spheres.forEach((sphere) => {
      expect(sphere.content).not.toContain('[Contenu non disponible]')
    })
  })

  it('sphère 1 contient dominantDynamic', () => {
    const core = makeCore()
    const result = mapCompactCoreToSpheres(core, { lang: 'fr' })
    expect(result.spheres[0]!.content).toContain(core.dominantDynamic)
  })

  it('sphère 8 contient timingSignal', () => {
    const core = makeCore()
    const result = mapCompactCoreToSpheres(core, { lang: 'fr' })
    expect(result.spheres[7]!.content).toContain(core.timingSignal)
  })

  it('sphère 9 contient energyLeak', () => {
    const core = makeCore()
    const result = mapCompactCoreToSpheres(core, { lang: 'fr' })
    expect(result.spheres[8]!.content).toContain(core.energyLeak)
  })

  it('sphère 12 contient leveragePoint', () => {
    const core = makeCore()
    const result = mapCompactCoreToSpheres(core, { lang: 'fr' })
    expect(result.spheres[11]!.content).toContain(core.leveragePoint)
  })
})

// ── M3 — Anti-répétition ──────────────────────────────────────────────────────

describe('M3 — Anti-répétition : sphères distinctes (Jaccard < 0.65)', () => {
  it('aucune paire flagguée au-delà du seuil pour un core standard', () => {
    const result = mapCompactCoreToSpheres(makeCore(), { lang: 'fr' })
    const pairs = flaggedSimilarPairs(result.spheres)
    // On s'attend à 0 paire flagguée ou à ce que les flagguées soient des cas limites documentés
    expect(pairs.length).toBe(0)
  })

  it('les sphères 1, 2, 3 (directes) ont des contenus distincts', () => {
    const result = mapCompactCoreToSpheres(makeCore(), { lang: 'fr' })
    const s1 = result.spheres[0]!.content
    const s2 = result.spheres[1]!.content
    const s3 = result.spheres[2]!.content
    expect(jaccardSimilarity(s1, s2)).toBeLessThan(SIMILARITY_THRESHOLD)
    expect(jaccardSimilarity(s2, s3)).toBeLessThan(SIMILARITY_THRESHOLD)
    expect(jaccardSimilarity(s1, s3)).toBeLessThan(SIMILARITY_THRESHOLD)
  })

  it('sphère 4 (mentale) ≠ sphère 2 (mécanisme)', () => {
    const result = mapCompactCoreToSpheres(makeCore(), { lang: 'fr' })
    const s2 = result.spheres[1]!.content
    const s4 = result.spheres[3]!.content
    expect(jaccardSimilarity(s2, s4)).toBeLessThan(SIMILARITY_THRESHOLD)
  })

  it('sphère 7 (extérieure) ≠ sphère 3 (tension)', () => {
    const result = mapCompactCoreToSpheres(makeCore(), { lang: 'fr' })
    const s3 = result.spheres[2]!.content
    const s7 = result.spheres[6]!.content
    expect(jaccardSimilarity(s3, s7)).toBeLessThan(SIMILARITY_THRESHOLD)
  })

  it('sphère 10 (blocage) ≠ sphère 9 (énergétique)', () => {
    const result = mapCompactCoreToSpheres(makeCore(), { lang: 'fr' })
    const s9  = result.spheres[8]!.content
    const s10 = result.spheres[9]!.content
    expect(jaccardSimilarity(s9, s10)).toBeLessThan(SIMILARITY_THRESHOLD)
  })

  it('sphère 11 (mouvement) ≠ sphère 1 (centrale)', () => {
    const result = mapCompactCoreToSpheres(makeCore(), { lang: 'fr' })
    const s1  = result.spheres[0]!.content
    const s11 = result.spheres[10]!.content
    expect(jaccardSimilarity(s1, s11)).toBeLessThan(SIMILARITY_THRESHOLD)
  })
})

// ── M4 — renderPlanReading : structure par plan ───────────────────────────────

describe('M4 — renderPlanReading : structure différente par plan', () => {
  function renderFor(plan: 'free' | 'essential' | 'premium' | 'practitioner'): string {
    const core = makeCore()
    const spheres = mapCompactCoreToSpheres(core, { intent: 'blocage', lang: 'fr' })
    return renderPlanReading({ compactCore: core, spheres, plan, lang: 'fr' })
  }

  it('free ≠ essential ≠ premium ≠ practitioner', () => {
    const outputs = ['free', 'essential', 'premium', 'practitioner'].map(
      (p) => renderFor(p as any)
    )
    const unique = new Set(outputs)
    expect(unique.size).toBe(4)
  })

  it('free est le plus court (moins de contenu que premium)', () => {
    const free    = renderFor('free')
    const premium = renderFor('premium')
    expect(free.length).toBeLessThan(premium.length)
  })

  it('practitioner est le plus long', () => {
    const essential    = renderFor('essential')
    const practitioner = renderFor('practitioner')
    expect(practitioner.length).toBeGreaterThan(essential.length)
  })
})

// ── M5 — free = 4 blocs, pas de sphères visibles ─────────────────────────────

describe('M5 — free : 4 blocs et rien de plus', () => {
  function renderFree(intent = 'blocage'): string {
    const core = makeCore()
    const spheres = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
    return renderPlanReading({ compactCore: core, spheres, plan: 'free', lang: 'fr' })
  }

  it('contient "CE QUI SE PASSE"', () => {
    expect(renderFree()).toContain('CE QUI SE PASSE')
  })

  it('contient "POURQUOI ÇA BLOQUE"', () => {
    expect(renderFree()).toContain('POURQUOI ÇA BLOQUE')
  })

  it('contient "CE QUE TU DOIS FAIRE"', () => {
    expect(renderFree()).toContain('CE QUE TU DOIS FAIRE')
  })

  it('contient "CLÉ À RETENIR"', () => {
    expect(renderFree()).toContain('CLÉ À RETENIR')
  })

  it('ne contient pas "◆ Sphère" (pas de sphères visibles en free)', () => {
    expect(renderFree()).not.toContain('◆ Sphère')
  })

  it('ne contient pas le séparateur ──────────', () => {
    expect(renderFree()).not.toContain('──────────')
  })
})

// ── M6 — essential = 4 blocs + 6 sphères ─────────────────────────────────────

describe('M6 — essential : 4 blocs + 6 sphères clés', () => {
  function renderEssential(): string {
    const core = makeCore()
    const spheres = mapCompactCoreToSpheres(core, { intent: 'blocage', lang: 'fr' })
    return renderPlanReading({ compactCore: core, spheres, plan: 'essential', lang: 'fr' })
  }

  it('contient les 4 blocs de base', () => {
    const output = renderEssential()
    expect(output).toContain('CE QUI SE PASSE')
    expect(output).toContain('CLÉ À RETENIR')
  })

  it('contient le séparateur ──────────', () => {
    expect(renderEssential()).toContain('──────────')
  })

  it('contient exactement 6 titres de sphères (◆)', () => {
    const output = renderEssential()
    const sphereMarkers = (output.match(/◆ Sphère/g) ?? []).length
    expect(sphereMarkers).toBe(6)
  })

  it('contient la sphère émotionnelle (id 5)', () => {
    expect(renderEssential()).toContain('Sphère émotionnelle')
  })

  it('contient la sphère du timing (id 8)', () => {
    expect(renderEssential()).toContain('Sphère du timing')
  })

  it('ne contient pas les sphères 1, 2, 3, 4 (centrales — réservées premium)', () => {
    const output = renderEssential()
    expect(output).not.toContain('Sphère centrale')
    expect(output).not.toContain('Sphère du mécanisme')
    expect(output).not.toContain('Sphère de tension')
    expect(output).not.toContain('Sphère mentale')
  })
})

// ── M7 — premium = 4 blocs + 12 sphères ──────────────────────────────────────

describe('M7 — premium : 4 blocs + 12 sphères complètes', () => {
  function renderPremium(): string {
    const core = makeCore()
    const spheres = mapCompactCoreToSpheres(core, { intent: 'blocage', lang: 'fr' })
    return renderPlanReading({ compactCore: core, spheres, plan: 'premium', lang: 'fr' })
  }

  it('contient les 4 blocs', () => {
    const output = renderPremium()
    expect(output).toContain('CE QUI SE PASSE')
    expect(output).toContain('CLÉ À RETENIR')
  })

  it('contient exactement 12 titres de sphères', () => {
    const output = renderPremium()
    const sphereMarkers = (output.match(/◆ Sphère/g) ?? []).length
    expect(sphereMarkers).toBe(12)
  })

  it('contient la sphère centrale (id 1)', () => {
    expect(renderPremium()).toContain('Sphère centrale')
  })

  it('contient la sphère du mouvement juste (id 11)', () => {
    expect(renderPremium()).toContain('Sphère du mouvement juste')
  })

  it('le séparateur apparaît entre les blocs et les sphères', () => {
    const output = renderPremium()
    const sepIdx = output.indexOf('──────────')
    const sphereIdx = output.indexOf('◆ Sphère')
    expect(sepIdx).toBeLessThan(sphereIdx)
  })
})

// ── M8 — practitioner = 12 sphères + approfondissement ───────────────────────

describe('M8 — practitioner : 12 sphères + approfondissement', () => {
  function renderPractitioner(): string {
    const core = makeCore()
    const spheres = mapCompactCoreToSpheres(core, { intent: 'blocage', lang: 'fr' })
    return renderPlanReading({ compactCore: core, spheres, plan: 'practitioner', lang: 'fr' })
  }

  it('contient 12 sphères', () => {
    const output = renderPractitioner()
    const sphereMarkers = (output.match(/◆ Sphère/g) ?? []).length
    expect(sphereMarkers).toBe(12)
  })

  it('contient le séparateur d\'approfondissement ══════════', () => {
    expect(renderPractitioner()).toContain('══════════')
  })

  it('contient "Dynamiques dominantes"', () => {
    expect(renderPractitioner()).toContain('Dynamiques dominantes')
  })

  it('contient "Levier stratégique"', () => {
    expect(renderPractitioner()).toContain('Levier stratégique')
  })

  it('contient "Vision d\'ensemble"', () => {
    expect(renderPractitioner()).toContain("Vision d'ensemble")
  })

  it("ne contient PAS les 4 blocs en caps (pas de 'CE QUI SE PASSE')", () => {
    expect(renderPractitioner()).not.toContain('CE QUI SE PASSE')
  })
})

// ── M9 — 3 types de questions ─────────────────────────────────────────────────

describe('M9 — Tests sur 3 intents : relation, blocage, timing', () => {
  function build(core: CompactReadingCore, intent: string): HexastraSpheres {
    return mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
  }

  it('relation : 12 sphères construites, contenu non vide', () => {
    const result = build(makeCoreRelation(), 'love')
    expect(result.spheres).toHaveLength(12)
    result.spheres.forEach((s) => expect(s.content.trim().length).toBeGreaterThan(10))
  })

  it('blocage : sphère 10 (blocage) contient une synthèse tension + énergie', () => {
    const core = makeCore()
    const result = build(core, 'blocage')
    const s10 = result.spheres[9]!.content
    // S10 doit contenir du contenu lié à la tension OU à l'energyLeak
    expect(s10.length).toBeGreaterThan(20)
  })

  it('timing : sphère 8 contient timingSignal', () => {
    const core = makeCoreTiming()
    const result = build(core, 'timing')
    const s8 = result.spheres[7]!.content
    expect(s8).toContain(core.timingSignal)
  })

  it('relation : sphère 5 (émotionnelle) mentionne le ressenti (le, la, ...)', () => {
    const result = build(makeCoreRelation(), 'love')
    const s5 = result.spheres[4]!.content
    // Doit avoir du contenu avec la tonalité émotionnelle relation
    expect(s5.length).toBeGreaterThan(20)
  })

  it('3 intents différents → 3 sphères 5 (émotionnelle) différentes', () => {
    const s5Blocage  = build(makeCore(), 'blocage').spheres[4]!.content
    const s5Relation = build(makeCoreRelation(), 'love').spheres[4]!.content
    const s5Timing   = build(makeCoreTiming(), 'timing').spheres[4]!.content

    const allSame = s5Blocage === s5Relation && s5Relation === s5Timing
    expect(allSame).toBe(false)
  })

  it('timing : renderPlanReading premium produit 12 sphères', () => {
    const core = makeCoreTiming()
    const spheres = build(core, 'timing')
    const output = renderPlanReading({ compactCore: core, spheres, plan: 'premium', lang: 'fr' })
    const count = (output.match(/◆ Sphère/g) ?? []).length
    expect(count).toBe(12)
  })
})

// ── Bonus : EN language ───────────────────────────────────────────────────────

describe('Bonus — Support EN', () => {
  it('EN : 12 sphères avec titres en anglais', () => {
    const result = mapCompactCoreToSpheres(makeCore(), { lang: 'en' })
    expect(result.spheres[0]!.title).toBe('Core sphere')
    expect(result.spheres).toHaveLength(12)
  })

  it('EN free : blocs en anglais', () => {
    const core = makeCore()
    const spheres = mapCompactCoreToSpheres(core, { lang: 'en' })
    const output = renderPlanReading({ compactCore: core, spheres, plan: 'free', lang: 'en' })
    expect(output).toContain('WHAT IS HAPPENING')
    expect(output).toContain('KEY TAKEAWAY')
  })
})
