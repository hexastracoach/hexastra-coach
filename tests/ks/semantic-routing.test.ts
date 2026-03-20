/**
 * Tests de routing sémantique — Hexastra Coach
 *
 * Vérifie que detectContext retourne le bon type sémantique
 * et que computeFlowStep bloque correctement micro_profile
 * pour les requêtes non-profile.
 */
import { describe, it, expect } from 'vitest'
import { detectContext } from '@/lib/hexastra/orchestration/detectContext'
import { computeFlowStep } from '@/lib/hexastra/session/sessionBrain'

// ─── detectContext ──────────────────────────────────────────────────────────

describe('detectContext', () => {
  it('détecte "current" pour "Analyser ma situation actuelle"', () => {
    const result = detectContext('Analyser ma situation actuelle')
    expect(result.contextType).toBe('current')
    expect(result.confidence).toBeGreaterThanOrEqual(0.8)
  })

  // "thème natal" → astro_exact (priorité sur 'profile' — c'est une lecture calculée, pas un profil générique)
  it('détecte "astro_exact" pour "Qui suis-je selon mon thème natal"', () => {
    const result = detectContext('Qui suis-je selon mon thème natal')
    expect(result.contextType).toBe('astro_exact')
    expect(result.confidence).toBeGreaterThanOrEqual(0.9)
  })

  // "transits" → astro_exact (priorité sur 'timing' — les transits sont un calcul astro exact)
  it('détecte "astro_exact" pour "Mes transits du moment"', () => {
    const result = detectContext('Mes transits du moment')
    expect(result.contextType).toBe('astro_exact')
    expect(result.confidence).toBeGreaterThanOrEqual(0.9)
  })

  it('détecte "decision" pour "Dois-je changer de travail ?"', () => {
    const result = detectContext('Dois-je changer de travail ?')
    expect(result.contextType).toBe('decision')
    expect(result.confidence).toBeGreaterThanOrEqual(0.8)
  })

  it('détecte "current" pour "Comment je me sens en ce moment"', () => {
    const result = detectContext('Comment je me sens en ce moment')
    expect(result.contextType).toBe('current')
    expect(result.confidence).toBeGreaterThanOrEqual(0.8)
  })

  it('détecte "compatibility" pour "Notre compatibilité de couple"', () => {
    const result = detectContext('Notre compatibilité de couple')
    expect(result.contextType).toBe('compatibility')
    expect(result.confidence).toBeGreaterThanOrEqual(0.8)
  })

  it('détecte "astro_exact" pour "Je veux mon thème natal"', () => {
    const result = detectContext('Je veux mon thème natal à partir de mes données de naissance')
    expect(result.contextType).toBe('astro_exact')
    expect(result.confidence).toBeGreaterThanOrEqual(0.9)
  })

  it('détecte "astro_exact" pour "Je veux explorer mes transits astrologiques"', () => {
    const result = detectContext('Je veux explorer mon thème natal et mes transits astrologiques')
    expect(result.contextType).toBe('astro_exact')
    expect(result.confidence).toBeGreaterThanOrEqual(0.9)
  })

  it('détecte "profile" pur pour "Qui suis-je" sans mention astro', () => {
    const result = detectContext('Qui suis-je ? Quels sont mes talents et mes forces ?')
    expect(result.contextType).toBe('profile')
    expect(result.confidence).toBeGreaterThanOrEqual(0.8)
  })

  it('retourne "unknown" pour une phrase sans signal clair', () => {
    const result = detectContext('Bonjour')
    expect(result.contextType).toBe('unknown')
    expect(result.confidence).toBe(0)
  })
})

// ─── computeFlowStep + blockMicroProfile ────────────────────────────────────

const BASE_ARGS = {
  requestType: 'chat' as const,
  uiAction: 'send_message' as const,
  hasBirthData: true,
  hasShownMicroReadings: false, // <-- normally triggers micro_profile
  practitionerNeedsUsage: false,
  emotionalState: 'neutral' as const,
  timing: 'exploration' as const,
  precision: 'medium' as const,
}

describe('computeFlowStep — blockMicroProfile', () => {
  it('retourne micro_profile sans blockMicroProfile (comportement normal)', () => {
    const step = computeFlowStep({
      ...BASE_ARGS,
      latestUserMessage: 'Bonjour',
      blockMicroProfile: false,
    })
    expect(step).toBe('micro_profile')
  })

  it('bloque micro_profile pour "Analyser ma situation actuelle"', () => {
    // precision='medium' + no submenu → clarification (non-profile routing correct)
    const step = computeFlowStep({
      ...BASE_ARGS,
      latestUserMessage: 'Analyser ma situation actuelle',
      blockMicroProfile: true,
    })
    expect(step).not.toBe('micro_profile')
  })

  it('bloque micro_profile pour "Dois-je changer de travail" → decision', () => {
    const step = computeFlowStep({
      ...BASE_ARGS,
      latestUserMessage: 'Dois-je changer de travail ?',
      blockMicroProfile: true,
    })
    expect(step).not.toBe('micro_profile')
  })

  it('ne bloque pas micro_profile si blockMicroProfile absent', () => {
    const step = computeFlowStep({
      ...BASE_ARGS,
      latestUserMessage: 'Mes transits du moment',
    })
    expect(step).toBe('micro_profile')
  })
})
