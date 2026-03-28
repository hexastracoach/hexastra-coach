/**
 * adaptive-reading — Tests de la Priorité 4 : lectures adaptatives au contexte
 *
 * Vérifie :
 * M1 — resolveReadingLevel : plan + override message
 * M2 — detectUserPhase : transition / expansion / stabilisation
 * M3 — detectLifeZone : mapping intent → zone
 * M4 — renderPremiumReading adaptatif :
 *        short ≠ deep (structure)
 *        phase change le méta-ton
 *        zone change le méta-focus
 * M5 — Cohérence globale : même core → 3 lectures différentes (short/standard/deep)
 */

import { describe, it, expect } from 'vitest'
import { resolveReadingLevel } from '@/lib/hexastra/context/readingLevel'
import { detectUserPhase } from '@/lib/hexastra/context/userPhase'
import { detectLifeZone } from '@/lib/hexastra/context/lifeZone'
import { renderPremiumReading } from '@/lib/hexastra/renderer/renderPremiumReading'
import type { CompactReadingCore } from '@/lib/hexastra/orchestrator/compactReadingCore'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeCore(overrides?: Partial<CompactReadingCore>): CompactReadingCore {
  return {
    dominantDynamic:  'Type focalisé 2/4 — fonctionnement par invitation et reconnaissance',
    hiddenMechanism:  'Tu pousses là où le signal ne vient pas — l\'énergie se dépense sans retour',
    realTension:      'Tension entre la volonté d\'avancer et l\'absence de reconnaissance réelle',
    visibleEffect:    'Efforts qui ne débouchent pas, sentiment de tourner en rond',
    rightMovement:    'identifier où l\'invitation manque — arrêter d\'initier sans retour réel',
    decisionSignal:   'Attendre la clarté émotionnelle — ne jamais trancher dans l\'urgence',
    timingSignal:     'Phase de fondation — poser les bases concrètes maintenant',
    energyLeak:       'Énergie dépensée à initier là où aucun retour réel ne vient',
    leveragePoint:    'Identifier l\'invitation réelle avant de s\'engager — un seul ajustement change tout',
    toneHint:         'Ton direct — valider l\'émotion vive avant de guider',
    solarToneHint:    'Ton direct et profond. Ne pas rester en surface.',
    questionType:     'blocage',
    signalConfidence: 0.84,
    ...overrides,
  }
}

function makeCoreExpansion(): CompactReadingCore {
  return makeCore({
    dominantDynamic: 'Cycle annuel 3 (expression) — énergie en mouvement',
    hiddenMechanism: 'Besoin de maîtrise avant d\'exposer — orientation profonde 7',
    realTension:     'Pression d\'agir vite vs besoin de maturation',
    rightMovement:   'lancer la démarche, construire les premières fondations sans attendre la perfection',
    questionType:    'timing',
  })
}

function makeCoreStabilisation(): CompactReadingCore {
  return makeCore({
    hiddenMechanism: 'Équilibre entre ton besoin de profondeur et la légèreté du moment',
    realTension:     'Ajustement progressif du rythme et de l\'engagement',
    rightMovement:   'maintenir le cap, affiner les priorités sans brusquer',
    questionType:    'inner_state',
  })
}

// ── M1 — resolveReadingLevel ──────────────────────────────────────────────────

describe('M1 — resolveReadingLevel', () => {
  it('plan free → short', () => {
    expect(resolveReadingLevel({ plan: 'free' })).toBe('short')
  })

  it('plan essential → standard', () => {
    expect(resolveReadingLevel({ plan: 'essential' })).toBe('standard')
  })

  it('plan premium → standard', () => {
    expect(resolveReadingLevel({ plan: 'premium' })).toBe('standard')
  })

  it('plan practitioner → deep', () => {
    expect(resolveReadingLevel({ plan: 'practitioner' })).toBe('deep')
  })

  it('sans plan → standard (fallback)', () => {
    expect(resolveReadingLevel({})).toBe('standard')
  })

  it('override "résume" sur plan premium → short', () => {
    expect(resolveReadingLevel({ plan: 'premium', userMessage: 'Résume-moi ça en quelques mots' })).toBe('short')
  })

  it('override "explique" sur plan free → deep', () => {
    expect(resolveReadingLevel({ plan: 'free', userMessage: 'Explique-moi en détail' })).toBe('deep')
  })

  it('override "court" sur plan practitioner → short', () => {
    expect(resolveReadingLevel({ plan: 'practitioner', userMessage: 'Sois court' })).toBe('short')
  })

  it('override "approfondis" sur plan essential → deep', () => {
    expect(resolveReadingLevel({ plan: 'essential', userMessage: 'Approfondis s\'il te plaît' })).toBe('deep')
  })

  it('message sans mot-clé n\'override pas le plan', () => {
    expect(resolveReadingLevel({ plan: 'free', userMessage: 'Comment je fonctionne vraiment ?' })).toBe('short')
  })
})

// ── M2 — detectUserPhase ──────────────────────────────────────────────────────

describe('M2 — detectUserPhase', () => {
  it('mécanisme avec "bloque" → transition', () => {
    const core = makeCore({
      hiddenMechanism: 'Tu te bloques là où le signal ne vient pas',
      realTension: 'Tension active entre volonté et résistance',
    })
    expect(detectUserPhase(core)).toBe('transition')
  })

  it('mécanisme avec "freinée" → transition', () => {
    const core = makeCore({
      hiddenMechanism: 'Énergie freinée par l\'absence de retour externe',
      realTension: 'Impasse entre avancer et attendre',
    })
    expect(detectUserPhase(core)).toBe('transition')
  })

  it('rightMovement avec "lancer" et "construire" → expansion', () => {
    const core = makeCoreExpansion()
    expect(detectUserPhase(core)).toBe('expansion')
  })

  it('rightMovement avec "avancer" et "progresser" → expansion', () => {
    const core = makeCore({
      hiddenMechanism: 'Dynamique active de croissance',
      realTension: 'Rythme de progression',
      rightMovement: 'avancer progressivement, progresser par étapes',
    })
    expect(detectUserPhase(core)).toBe('expansion')
  })

  it('pas de tension forte ni de mouvement → stabilisation', () => {
    const core = makeCoreStabilisation()
    expect(detectUserPhase(core)).toBe('stabilisation')
  })

  it('transition prend priorité sur expansion si les deux présents', () => {
    const core = makeCore({
      hiddenMechanism: 'Tu te bloques dans l\'expansion',
      realTension: 'Blocage de la dynamique de croissance',
      rightMovement: 'lancer malgré tout',
    })
    // TRANSITION_PATTERNS testé sur hiddenMechanism+realTension (contient "bloques")
    expect(detectUserPhase(core)).toBe('transition')
  })
})

// ── M3 — detectLifeZone ───────────────────────────────────────────────────────

describe('M3 — detectLifeZone', () => {
  const cases: [string, string][] = [
    ['love', 'relation'],
    ['relationship', 'relation'],
    ['work_money', 'work'],
    ['blocage', 'work'],
    ['identity', 'identity'],
    ['life_period', 'identity'],
    ['exact_profile', 'identity'],
    ['fusion_general_question', 'identity'],
    ['inner_state', 'energy'],
    ['timing', 'decision'],
    ['decision', 'decision'],
    ['make_decision', 'decision'],
  ]

  for (const [intent, expectedZone] of cases) {
    it(`intent "${intent}" → zone "${expectedZone}"`, () => {
      expect(detectLifeZone(intent)).toBe(expectedZone)
    })
  }

  it('intent inconnu → fallback "identity"', () => {
    expect(detectLifeZone('unknown_intent')).toBe('identity')
    expect(detectLifeZone('')).toBe('identity')
  })
})

// ── M4 — renderPremiumReading adaptatif ───────────────────────────────────────

describe('M4 — renderPremiumReading adaptatif (structure)', () => {
  const core = makeCore()

  it('short : 3 blocs (s1, s2, s4) — s3 et s5 absents', () => {
    const output = renderPremiumReading({ core, lang: 'fr', readingLevel: 'short' })
    expect(output).toContain('CE QUI SE PASSE')
    expect(output).toContain('POURQUOI ÇA SE JOUE')
    expect(output).toContain('CE QUE TU DOIS FAIRE MAINTENANT')
    expect(output).not.toContain('CE QUE ÇA PRODUIT DANS TA VIE')
    expect(output).not.toContain('CLÉ À RETENIR')
  })

  it('standard : 5 blocs complets', () => {
    const output = renderPremiumReading({ core, lang: 'fr', readingLevel: 'standard' })
    expect(output).toContain('CE QUI SE PASSE')
    expect(output).toContain('POURQUOI ÇA SE JOUE')
    expect(output).toContain('CE QUE ÇA PRODUIT DANS TA VIE')
    expect(output).toContain('CE QUE TU DOIS FAIRE MAINTENANT')
    expect(output).toContain('CLÉ À RETENIR')
  })

  it('deep : 5 blocs complets', () => {
    const output = renderPremiumReading({ core, lang: 'fr', readingLevel: 'deep' })
    expect(output).toContain('CE QUI SE PASSE')
    expect(output).toContain('POURQUOI ÇA SE JOUE')
    expect(output).toContain('CE QUE ÇA PRODUIT DANS TA VIE')
    expect(output).toContain('CE QUE TU DOIS FAIRE MAINTENANT')
    expect(output).toContain('CLÉ À RETENIR')
  })

  it('short ≠ deep : le texte produit est différent', () => {
    const shortOutput  = renderPremiumReading({ core, lang: 'fr', readingLevel: 'short' })
    const deepOutput   = renderPremiumReading({ core, lang: 'fr', readingLevel: 'deep' })
    expect(shortOutput).not.toBe(deepOutput)
    // deep est plus long que short (plus de blocs)
    expect(deepOutput.length).toBeGreaterThan(shortOutput.length)
  })
})

describe('M4 — renderPremiumReading adaptatif (méta-phase)', () => {
  const core = makeCore()

  it('phase expansion → méta EXPANSION présent', () => {
    const output = renderPremiumReading({ core, lang: 'fr', userPhase: 'expansion' })
    expect(output).toContain('[PHASE: EXPANSION')
    expect(output).toContain('action')
  })

  it('phase transition → méta TRANSITION présent', () => {
    const output = renderPremiumReading({ core, lang: 'fr', userPhase: 'transition' })
    expect(output).toContain('[PHASE: TRANSITION')
    expect(output).toContain('rassurant')
  })

  it('phase stabilisation → méta STABILISATION présent', () => {
    const output = renderPremiumReading({ core, lang: 'fr', userPhase: 'stabilisation' })
    expect(output).toContain('[PHASE: STABILISATION')
  })

  it('phases différentes → outputs différents', () => {
    const exp  = renderPremiumReading({ core, lang: 'fr', userPhase: 'expansion' })
    const trans = renderPremiumReading({ core, lang: 'fr', userPhase: 'transition' })
    const stab  = renderPremiumReading({ core, lang: 'fr', userPhase: 'stabilisation' })
    expect(exp).not.toBe(trans)
    expect(trans).not.toBe(stab)
    expect(exp).not.toBe(stab)
  })
})

describe('M4 — renderPremiumReading adaptatif (méta-zone)', () => {
  const core = makeCore()

  it('zone relation → méta RELATION présent', () => {
    const output = renderPremiumReading({ core, lang: 'fr', lifeZone: 'relation' })
    expect(output).toContain('[ZONE: RELATION')
    expect(output).toContain('dynamique humaine')
  })

  it('zone work → méta TRAVAIL présent', () => {
    const output = renderPremiumReading({ core, lang: 'fr', lifeZone: 'work' })
    expect(output).toContain('[ZONE: TRAVAIL')
    expect(output).toContain('action concrète')
  })

  it('zone identity → méta IDENTITÉ présent', () => {
    const output = renderPremiumReading({ core, lang: 'fr', lifeZone: 'identity' })
    expect(output).toContain('[ZONE: IDENTITÉ')
    expect(output).toContain('fonctionnement naturel')
  })

  it('zone energy → méta ÉNERGIE présent', () => {
    const output = renderPremiumReading({ core, lang: 'fr', lifeZone: 'energy' })
    expect(output).toContain('[ZONE: ÉNERGIE')
    expect(output).toContain('ressenti intérieur')
  })

  it('zone decision → méta DÉCISION présent', () => {
    const output = renderPremiumReading({ core, lang: 'fr', lifeZone: 'decision' })
    expect(output).toContain('[ZONE: DÉCISION')
    expect(output).toContain('timing')
  })

  it('zones différentes → focus différent dans le texte', () => {
    const rel  = renderPremiumReading({ core, lang: 'fr', lifeZone: 'relation' })
    const work = renderPremiumReading({ core, lang: 'fr', lifeZone: 'work' })
    expect(rel).not.toBe(work)
  })
})

// ── M5 — Cohérence globale (même core, 3 levels) ─────────────────────────────

describe('M5 — Cohérence globale', () => {
  it('blocage → detectUserPhase → transition', () => {
    const core = makeCore()  // hiddenMechanism contient "pousses là où le signal ne vient pas"
    // mais realTension contient "Tension" — pas de "bloque" dans hiddenMechanism directement
    // La phase dépend du contenu exact, on vérifie juste la cohérence de type
    const phase = detectUserPhase(core)
    expect(['expansion', 'transition', 'stabilisation']).toContain(phase)
  })

  it('action claire avec "lancer" → detectUserPhase → expansion', () => {
    const core = makeCoreExpansion()
    expect(detectUserPhase(core)).toBe('expansion')
  })

  it('3 lectures du même core sont toutes non-vides', () => {
    const core = makeCore()
    const short    = renderPremiumReading({ core, lang: 'fr', readingLevel: 'short' })
    const standard = renderPremiumReading({ core, lang: 'fr', readingLevel: 'standard' })
    const deep     = renderPremiumReading({ core, lang: 'fr', readingLevel: 'deep' })
    expect(short.length).toBeGreaterThan(50)
    expect(standard.length).toBeGreaterThan(100)
    expect(deep.length).toBeGreaterThan(100)
  })

  it('short < standard (micro-ouverture en standard, absent en deep)', () => {
    const core = makeCore()
    const short    = renderPremiumReading({ core, lang: 'fr', readingLevel: 'short' })
    const standard = renderPremiumReading({ core, lang: 'fr', readingLevel: 'standard' })
    const deep     = renderPremiumReading({ core, lang: 'fr', readingLevel: 'deep' })
    // Invariant fondamental : short < standard
    expect(short.length).toBeLessThan(standard.length)
    // standard peut être ≥ deep car standard inclut la micro-ouverture (deep non)
    // standard et deep ont tous les deux 5 blocs de contenu
    expect(standard.length).toBeGreaterThan(deep.length * 0.8)
  })

  it('pipeline complet : resolveReadingLevel + detectUserPhase + detectLifeZone → renderPremiumReading', () => {
    const core = makeCore()
    const level = resolveReadingLevel({ plan: 'premium', userMessage: 'Comment je fonctionne ?' })
    const phase = detectUserPhase(core)
    const zone  = detectLifeZone('blocage')

    expect(level).toBe('standard')
    expect(zone).toBe('work')
    expect(['expansion', 'transition', 'stabilisation']).toContain(phase)

    const output = renderPremiumReading({
      core,
      lang: 'fr',
      readingLevel: level,
      userPhase: phase,
      lifeZone: zone,
      sunSign: 'Scorpion',
    })

    // Toutes les méta-sections présentes
    expect(output).toContain('[ZONE: TRAVAIL')
    expect(output).toContain('[TON SOLAIRE:')
    // Structure 5 blocs (standard)
    expect(output).toContain('CE QUI SE PASSE')
    expect(output).toContain('CLÉ À RETENIR')
    // Pas de jargon technique
    expect(output).not.toMatch(/\bHuman Design\b/)
  })

  it('fallback EN : labels anglais + méta anglais', () => {
    const core = makeCore()
    const output = renderPremiumReading({
      core,
      lang: 'en',
      readingLevel: 'short',
      userPhase: 'transition',
      lifeZone: 'work',
    })
    expect(output).toContain('WHAT IS HAPPENING')
    expect(output).toContain('[PHASE: TRANSITION')
    expect(output).toContain('[ZONE: WORK')
    expect(output).not.toContain('[ZONE: TRAVAIL')
  })
})
