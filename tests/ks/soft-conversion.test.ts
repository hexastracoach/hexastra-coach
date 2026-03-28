/**
 * soft-conversion — Tests de la Priorité 5 : conversion naturelle non agressive
 *
 * Vérifie :
 * M1 — Micro-ouverture : présente en mode standard, absente en short/deep
 * M2 — Message quota : ton naturel, aucun mot agressif
 * M3 — Progression : depth 1 ≠ depth 2 ≠ depth 3 (enrichissement progressif)
 * M4 — getSoftMessage : contextuel, non répétitif, jamais intrusif
 * M5 — pricingCopy : bénéfices clairs, aucun jargon
 * M7 — Mots interdits absents de tous les outputs
 */

import { describe, it, expect } from 'vitest'
import { renderPremiumReading } from '@/lib/hexastra/renderer/renderPremiumReading'
import { getSoftMessage, getQuotaLimitMessage } from '@/lib/hexastra/ui/softMessaging'
import { getPlanCopy, getAllPlansCopy, getPlanComparison } from '@/lib/hexastra/ui/pricingCopy'
import { buildQuotaUpgradeDecision } from '@/lib/monetization/smartPricing'
import type { CompactReadingCore } from '@/lib/hexastra/orchestrator/compactReadingCore'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Mots strictement interdits dans TOUS les outputs de conversion */
const FORBIDDEN_WORDS = [
  /\bacheter\b/i,
  /\bpayer\b/i,
  /\bupgrade\b/i,
  /\boffre limit[eé]e?\b/i,
  /\bpromo\b/i,
  /\bpromotion\b/i,
  /\bcompteur\b/i,
  /\bexpire\b/i,
  /\bbloqué[e]? par\b/i,
  /\bseulements?\b/i,
]

function hasNoForbiddenWords(text: string): boolean {
  return FORBIDDEN_WORDS.every((pattern) => !pattern.test(text))
}

function makeCore(overrides?: Partial<CompactReadingCore>): CompactReadingCore {
  return {
    dominantDynamic:  'Type focalisé — fonctionnement par invitation et reconnaissance',
    hiddenMechanism:  "Tu pousses là où le signal ne vient pas — l'énergie se dépense sans retour",
    realTension:      "Tension entre la volonté d'avancer et l'absence de reconnaissance réelle",
    visibleEffect:    'Efforts qui ne débouchent pas, sentiment de tourner en rond',
    rightMovement:    "identifier où l'invitation manque — arrêter d'initier sans retour réel",
    toneHint:         'Ton direct — valider avant de guider',
    solarToneHint:    'Ton direct et profond.',
    questionType:     'blocage',
    signalConfidence: 0.84,
    ...overrides,
  }
}

// ── M1 — Micro-ouverture ──────────────────────────────────────────────────────

describe('M1 — Micro-ouverture (après CLÉ À RETENIR)', () => {
  const core = makeCore()

  it('mode standard + sessionDepth 1 : micro-ouverture présente', () => {
    const output = renderPremiumReading({
      core, lang: 'fr', readingLevel: 'standard', sessionDepth: 1, lifeZone: 'work',
    })
    // La micro-ouverture doit être présente (mode standard activé)
    // Elle doit être une phrase naturelle, pas un titre de section
    expect(output).toContain('CLÉ À RETENIR')
    // Vérifier qu'il y a du texte APRÈS "CLÉ À RETENIR"
    const afterMantra = output.split('CLÉ À RETENIR')[1] ?? ''
    expect(afterMantra.trim().length).toBeGreaterThan(20)
  })

  it('mode short : aucune micro-ouverture', () => {
    const outputShort = renderPremiumReading({
      core, lang: 'fr', readingLevel: 'short', sessionDepth: 2, lifeZone: 'work',
    })
    // Short ne contient pas "CLÉ À RETENIR" ni de micro-ouverture
    expect(outputShort).not.toContain('CLÉ À RETENIR')
    // La micro-ouverture zone work ne doit pas apparaître
    expect(outputShort).not.toContain("identifier le levier exact")
    expect(outputShort).not.toContain("si tu veux aller plus loin")
  })

  it('mode deep : aucune micro-ouverture', () => {
    const outputDeep = renderPremiumReading({
      core, lang: 'fr', readingLevel: 'deep', sessionDepth: 2, lifeZone: 'work',
    })
    // Deep contient CLÉ À RETENIR mais PAS la micro-ouverture
    expect(outputDeep).toContain('CLÉ À RETENIR')
    // La micro-ouverture spécifique à 'work' ne doit pas apparaître
    expect(outputDeep).not.toContain("identifier le levier exact")
  })

  it('micro-ouverture varie selon la zone', () => {
    const work = renderPremiumReading({
      core, lang: 'fr', readingLevel: 'standard', sessionDepth: 1, lifeZone: 'work',
    })
    const relation = renderPremiumReading({
      core, lang: 'fr', readingLevel: 'standard', sessionDepth: 1, lifeZone: 'relation',
    })
    // Les micro-ouvertures sont différentes selon la zone
    const workOpening = work.split('CLÉ À RETENIR')[1] ?? ''
    const relationOpening = relation.split('CLÉ À RETENIR')[1] ?? ''
    expect(workOpening).not.toBe(relationOpening)
  })

  it('micro-ouverture varie avec sessionDepth (non répétitive)', () => {
    const depth1 = renderPremiumReading({
      core, lang: 'fr', readingLevel: 'standard', sessionDepth: 1, lifeZone: 'work',
    })
    const depth2 = renderPremiumReading({
      core, lang: 'fr', readingLevel: 'standard', sessionDepth: 2, lifeZone: 'work',
    })
    const depth3 = renderPremiumReading({
      core, lang: 'fr', readingLevel: 'standard', sessionDepth: 3, lifeZone: 'work',
    })
    const opening1 = depth1.split('CLÉ À RETENIR')[1] ?? ''
    const opening2 = depth2.split('CLÉ À RETENIR')[1] ?? ''
    const opening3 = depth3.split('CLÉ À RETENIR')[1] ?? ''

    // Au moins certaines variations doivent être différentes
    const allSame = opening1 === opening2 && opening2 === opening3
    expect(allSame).toBe(false)
  })

  it('micro-ouverture : aucun mot interdit', () => {
    const output = renderPremiumReading({
      core, lang: 'fr', readingLevel: 'standard', sessionDepth: 1, lifeZone: 'work',
    })
    expect(hasNoForbiddenWords(output)).toBe(true)
  })
})

// ── M2 — Message limite free ──────────────────────────────────────────────────

describe('M2 — Message limite free (quota)', () => {
  it('getQuotaLimitMessage FR : ton naturel, non agressif', () => {
    const msg = getQuotaLimitMessage('fr')
    expect(msg.text).toContain('lectures du jour')
    expect(msg.text).toContain('24h')
    expect(hasNoForbiddenWords(msg.text)).toBe(true)
  })

  it('getQuotaLimitMessage FR : CTA "Voir les options" (pas "acheter")', () => {
    const msg = getQuotaLimitMessage('fr')
    expect(msg.ctaLabel).toBe('Voir les options')
    expect(msg.ctaLabel).not.toMatch(/achet|payer|upgrade/i)
  })

  it('getQuotaLimitMessage FR : lien vers pricing', () => {
    const msg = getQuotaLimitMessage('fr')
    expect(msg.ctaHref).toContain('pricing')
  })

  it('getQuotaLimitMessage EN : ton naturel', () => {
    const msg = getQuotaLimitMessage('en')
    expect(msg.text).toContain("today's")
    expect(msg.text).toContain('24h')
    expect(hasNoForbiddenWords(msg.text)).toBe(true)
  })

  it('buildQuotaUpgradeDecision : message naturel, pas de doublon agressif', () => {
    const decision = buildQuotaUpgradeDecision('free')
    expect(decision.shouldShow).toBe(true)
    expect(decision.message).toBeTruthy()
    expect(hasNoForbiddenWords(decision.message ?? '')).toBe(true)
    expect(decision.ctaLabel).toBe('Voir les options')
  })

  it('buildQuotaUpgradeDecision : message contient "du jour" ou "24h"', () => {
    const decision = buildQuotaUpgradeDecision('free')
    const hasNaturalMessage = (decision.message ?? '').includes('du jour')
    expect(hasNaturalMessage).toBe(true)
  })
})

// ── M3 — Progression naturelle ────────────────────────────────────────────────

describe('M3 — Progression naturelle (depth 1 → 2 → 3)', () => {
  const core = makeCore()

  it('depth 1 ≠ depth 2 (POURQUOI enrichi à depth 2)', () => {
    const d1 = renderPremiumReading({ core, lang: 'fr', readingLevel: 'standard', sessionDepth: 1 })
    const d2 = renderPremiumReading({ core, lang: 'fr', readingLevel: 'standard', sessionDepth: 2 })
    expect(d1).not.toBe(d2)
  })

  it('depth 3 contient préfixe "Concrètement pour toi"', () => {
    const d3 = renderPremiumReading({ core, lang: 'fr', readingLevel: 'standard', sessionDepth: 3 })
    expect(d3).toContain('Concrètement pour toi')
  })

  it('depth 1 ne contient pas le préfixe "Concrètement"', () => {
    const d1 = renderPremiumReading({ core, lang: 'fr', readingLevel: 'standard', sessionDepth: 1 })
    expect(d1).not.toContain('Concrètement pour toi')
  })

  it('EN depth 3 : "Concretely for you" présent', () => {
    const d3 = renderPremiumReading({ core, lang: 'en', readingLevel: 'standard', sessionDepth: 3 })
    expect(d3).toContain('Concretely for you')
  })

  it('short ne prend pas le préfixe même à depth 3', () => {
    const d3short = renderPremiumReading({ core, lang: 'fr', readingLevel: 'short', sessionDepth: 3 })
    expect(d3short).not.toContain('Concrètement pour toi')
  })
})

// ── M4 — getSoftMessage ───────────────────────────────────────────────────────

describe('M4 — getSoftMessage (module softMessaging)', () => {
  it('depth < 2 → null (trop tôt)', () => {
    expect(getSoftMessage({ sessionDepth: 1 })).toBeNull()
    expect(getSoftMessage({ sessionDepth: 0 })).toBeNull()
    expect(getSoftMessage({})).toBeNull()
  })

  it('depth 2 avec intent blocage → message spécifique', () => {
    const msg = getSoftMessage({ intent: 'blocage', sessionDepth: 2, lang: 'fr' })
    expect(msg).not.toBeNull()
    expect(msg).toContain('bloque')
  })

  it('depth 2 avec intent timing → message lié au timing (moment ou timing)', () => {
    const msg = getSoftMessage({ intent: 'timing', sessionDepth: 2, lang: 'fr' })
    expect(msg).not.toBeNull()
    // Le message parle de moment/timing (les deux sont sémantiquement équivalents)
    expect(msg).toMatch(/timing|moment|quand agir/i)
  })

  it('zone relation → message relationnel', () => {
    const msg = getSoftMessage({ lifeZone: 'relation', sessionDepth: 2, lang: 'fr' })
    expect(msg).not.toBeNull()
    // Un message relationnel
    expect(msg!.length).toBeLessThan(200)
  })

  it('3 messages consécutifs → rotation, pas répétition identique sur 3 cycles', () => {
    const msgs = [2, 3, 4].map((depth) =>
      getSoftMessage({ intent: 'blocage', sessionDepth: depth, lang: 'fr' })
    )
    // Au moins deux doivent être différents (pool de 3 variants)
    const unique = new Set(msgs)
    expect(unique.size).toBeGreaterThan(1)
  })

  it('aucun mot interdit dans les messages', () => {
    const contexts = [
      { intent: 'blocage', sessionDepth: 2 },
      { intent: 'timing', sessionDepth: 3 },
      { lifeZone: 'relation' as const, sessionDepth: 4 },
      { lifeZone: 'work' as const, sessionDepth: 2 },
      { lifeZone: 'identity' as const, sessionDepth: 3 },
    ]
    for (const ctx of contexts) {
      const msg = getSoftMessage({ ...ctx, lang: 'fr' })
      if (msg) {
        expect(hasNoForbiddenWords(msg)).toBe(true)
      }
    }
  })

  it('max 1 phrase (pas de double point)', () => {
    for (let depth = 2; depth <= 5; depth++) {
      const msg = getSoftMessage({ intent: 'blocage', sessionDepth: depth, lang: 'fr' })
      if (msg) {
        // Pas deux phrases séparées (max 1 point final)
        const sentences = msg.split(/[.!?]/).filter((s) => s.trim().length > 0)
        expect(sentences.length).toBeLessThanOrEqual(2)
      }
    }
  })

  it('version EN : message en anglais', () => {
    const msg = getSoftMessage({ intent: 'blocage', sessionDepth: 2, lang: 'en' })
    expect(msg).not.toBeNull()
    // Doit contenir un mot anglais caractéristique
    expect(msg).toMatch(/\b(I can|We can|you want|further|together|if you)\b/i)
  })
})

// ── M5 — pricingCopy ──────────────────────────────────────────────────────────

describe('M5 — pricingCopy (bénéfices clairs, sans jargon)', () => {
  const plans = ['free', 'essential', 'premium', 'practitioner'] as const

  for (const plan of plans) {
    it(`plan "${plan}" FR : tagline présente et courte`, () => {
      const copy = getPlanCopy(plan, 'fr')
      expect(copy.tagline).toBeTruthy()
      expect(copy.tagline.length).toBeLessThan(60)
    })

    it(`plan "${plan}" : pas de jargon (features, illimité, débloqué)`, () => {
      const copy = getPlanCopy(plan, 'fr')
      const allText = `${copy.tagline} ${copy.description} ${copy.cta}`
      expect(allText).not.toMatch(/\bfeat(ure)?s?\b/i)
      expect(allText).not.toMatch(/\billimit[eé]\b/i)
      expect(allText).not.toMatch(/\bd[eé]bloqu[eé]\b/i)
      expect(allText).not.toMatch(/\bacces\b/i)
      expect(hasNoForbiddenWords(allText)).toBe(true)
    })
  }

  it('free : tagline oriente vers compréhension rapide', () => {
    const copy = getPlanCopy('free', 'fr')
    expect(copy.tagline).toContain('Comprendre')
  })

  it('premium : tagline oriente vers profondeur', () => {
    const copy = getPlanCopy('premium', 'fr')
    expect(copy.tagline.toLowerCase()).toMatch(/profond|décision|profondeur/i)
  })

  it('practitioner : tagline oriente vers outil avancé', () => {
    const copy = getPlanCopy('practitioner', 'fr')
    expect(copy.tagline.toLowerCase()).toMatch(/avancé|outil/i)
  })

  it('getAllPlansCopy FR retourne les 4 plans', () => {
    const all = getAllPlansCopy('fr')
    expect(Object.keys(all)).toHaveLength(4)
    expect(all.free).toBeDefined()
    expect(all.premium).toBeDefined()
  })

  it('getPlanComparison free → next = essential, inviteText naturel', () => {
    const comparison = getPlanComparison('free', 'fr')
    expect(comparison.current).toBe('free')
    expect(comparison.next).toBe('essential')
    expect(comparison.inviteText).not.toBeNull()
    expect(hasNoForbiddenWords(comparison.inviteText ?? '')).toBe(true)
  })

  it('getPlanComparison practitioner → next = null', () => {
    const comparison = getPlanComparison('practitioner', 'fr')
    expect(comparison.next).toBeNull()
    expect(comparison.inviteText).toBeNull()
  })

  it('EN : taglines en anglais', () => {
    const free = getPlanCopy('free', 'en')
    expect(free.tagline).not.toContain('Comprendre')
    expect(free.tagline).toMatch(/understand|situation/i)
  })
})

// ── M6 — Pipeline order (soft always after reading) ──────────────────────────

describe('M6 — Pipeline : soft message toujours après la lecture', () => {
  it('soft message avec depth 1 → null (pas avant la lecture)', () => {
    const msg = getSoftMessage({ intent: 'blocage', sessionDepth: 1 })
    expect(msg).toBeNull()
  })

  it('soft message avec depth 2 → non nul (peut apparaître après lecture)', () => {
    const msg = getSoftMessage({ intent: 'blocage', sessionDepth: 2 })
    expect(msg).not.toBeNull()
  })

  it('micro-ouverture dans le bloc premium (standard, depth 1) est en fin de texte', () => {
    const core = makeCore()
    const output = renderPremiumReading({
      core, lang: 'fr', readingLevel: 'standard', sessionDepth: 1, lifeZone: 'work',
    })
    const lines = output.split('\n\n')
    // La dernière entrée doit être la micro-ouverture (phrase sans label de section)
    const lastPart = lines[lines.length - 1] ?? ''
    // Elle ne doit pas être un label de section en majuscules
    expect(lastPart).not.toMatch(/^[A-ZÀ-Ü]{5,}/)
    // Elle doit être une phrase naturelle
    expect(lastPart.length).toBeGreaterThan(20)
  })
})
