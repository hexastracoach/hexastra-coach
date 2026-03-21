/**
 * Tests — Natal 12-Sphere Reading Detection
 *
 * Validates detectNatal12SpheresRequest() via buildSystemPrompt() integration:
 * - Detects natal + transits combined requests → triggers 12-sphere structure
 * - Does NOT trigger for pure ascendant / simple astro queries
 * - Does NOT trigger for horoscope requests
 */

import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from '@/lib/hexastra/prompts/buildSystemPrompt'
import type { BuildPromptInput } from '@/lib/hexastra/types'

function makeInput(userMessage: string, overrides: Partial<BuildPromptInput> = {}): BuildPromptInput {
  return {
    plan: 'premium',
    mode: 'libre_avance',
    language: 'fr',
    requestType: 'chat',
    flowStep: 'analysis',
    contextType: 'general',
    domainRoute: 'science',
    messages: [{ role: 'user', content: userMessage }],
    isHoroscopeRoute: false,
    isAstroExactCompact: false,
    ...overrides,
  } as BuildPromptInput
}

// ── Trigger cases (should produce 12-sphere structure) ────────────────────────

describe('natal 12-sphere detection — trigger cases', () => {
  it('triggers for "thème natal + transits"', () => {
    const prompt = buildSystemPrompt(makeInput('Je veux explorer mon thème natal et mes transits astrologiques'))
    expect(prompt).toContain('Sphère 1')
    expect(prompt).toContain('Sphère 12')
    expect(prompt).toContain('Synthèse finale')
  })

  it('triggers for "thème natal + transits" (variant phrasing)', () => {
    const prompt = buildSystemPrompt(makeInput('Analyse mon thème natal avec mes transits actuels'))
    expect(prompt).toContain('12 SPHÈRES')
    expect(prompt).toContain('CARTOGRAPHIE INTÉRIEURE')
  })

  it('triggers for explicit "12 sphères" mention with natal', () => {
    const prompt = buildSystemPrompt(makeInput('Fais une lecture de mon thème natal en 12 sphères'))
    expect(prompt).toContain('Sphère 1')
    expect(prompt).toContain('Sphère 10')
  })

  it('triggers for natal + transits in compact mode (isAstroExactCompact=true)', () => {
    const prompt = buildSystemPrompt(makeInput(
      'Je veux explorer mon thème natal et mes transits',
      { isAstroExactCompact: true, exactDataBlock: 'DONNÉES: Soleil Bélier, Lune Cancer' }
    ))
    expect(prompt).toContain('12 SPHÈRES')
    expect(prompt).toContain('Sphère 7')
  })

  it('triggers for English "natal chart + transits"', () => {
    const prompt = buildSystemPrompt(makeInput(
      'I want to explore my natal chart and transits',
      { language: 'en' }
    ))
    expect(prompt).toContain('Sphere 1')
    expect(prompt).toContain('Sphere 12')
    expect(prompt).toContain('Final Synthesis')
  })
})

// ── Non-trigger cases (should NOT produce 12-sphere structure) ────────────────

describe('natal 12-sphere detection — non-trigger cases', () => {
  it('does NOT trigger for a simple ascendant question', () => {
    const prompt = buildSystemPrompt(makeInput('Quel est mon ascendant ?'))
    expect(prompt).not.toContain('Sphère 1 — Identité')
    expect(prompt).not.toContain('12 SPHÈRES')
  })

  it('does NOT trigger for a transit-only question (no natal)', () => {
    const prompt = buildSystemPrompt(makeInput('Quels sont mes transits du moment ?'))
    expect(prompt).not.toContain('Sphère 1 — Identité')
  })

  it('does NOT trigger for a general conversation message', () => {
    const prompt = buildSystemPrompt(makeInput('Comment puis-je avancer dans ma situation ?'))
    expect(prompt).not.toContain('12 SPHÈRES')
  })

  it('does NOT trigger for horoscope (separate route)', () => {
    const prompt = buildSystemPrompt(makeInput(
      'Mon horoscope du jour',
      { isHoroscopeRoute: true }
    ))
    // Horoscope route uses its own template
    expect(prompt).not.toContain('Sphère 1 — Identité')
  })
})

// ── Structure integrity ───────────────────────────────────────────────────────

describe('natal 12-sphere structure integrity', () => {
  it('contains all 12 sphere labels', () => {
    const prompt = buildSystemPrompt(makeInput('Explore mon thème natal et ses transits'))
    for (let i = 1; i <= 12; i++) {
      expect(prompt).toContain(`Sphère ${i}`)
    }
  })

  it('contains Clé de compréhension + Clé de résolution instructions', () => {
    const prompt = buildSystemPrompt(makeInput('Thème natal et transits de cette période'))
    expect(prompt).toContain('Clé de compréhension')
    expect(prompt).toContain('Clé de résolution')
  })

  it('contains rendering rules against hallucination', () => {
    const prompt = buildSystemPrompt(makeInput('Explorer mon thème natal + mes transits'))
    expect(prompt).toContain('sans inventer')
  })
})
