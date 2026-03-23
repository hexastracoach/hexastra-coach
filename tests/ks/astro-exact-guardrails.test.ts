import { describe, expect, it } from 'vitest'
import { detectContext } from '@/lib/hexastra/orchestration/detectContext'
import { resolveAstroFollowupRoutingState } from '@/lib/hexastra/orchestrator/runHexastraFlow'
import {
  buildCompactNatalReadingContext,
  buildValidatedAstroExactFallback,
  validateAstroExactRender,
  type CompactNatalContext,
} from '@/lib/hexastra/guards/exactDataGuard'
import { getNormalizationDiagnostics } from '@/app/api/chat/route'

describe('astro exact guardrails', () => {
  it('extracts Verseau for the tropical 1990-01-24 Sucy-en-Brie fixture', () => {
    const ctx = buildCompactNatalReadingContext({
      input: {
        birthDate: '1990-01-24',
        birthTime: '13:10',
        birthPlace: 'Sucy-en-Brie, France',
        zodiacMode: 'tropical',
      },
      tropical: {
        sun: { sign: 'Aquarius', degree: 4.1 },
        moon: { sign: 'Virgo', degree: 12.6 },
        ascendant: { sign: 'Gemini', degree: 18.4 },
      },
    })

    expect(ctx.sunSign).toBe('Verseau')
  })

  it('keeps astro follow-up on analysis/science instead of general', () => {
    const history = [
      { role: 'user' as const, content: 'Lis mon theme natal exact.' },
      { role: 'assistant' as const, content: 'Soleil: Verseau\nLune: Vierge\nAscendant: Gemeaux' },
      { role: 'user' as const, content: 'tu te trompes' },
    ]

    const semantic = detectContext('tu te trompes', history)
    const routing = resolveAstroFollowupRoutingState({
      semanticContextType: semantic.contextType,
      currentRoute: 'general',
      science: 'general',
    })

    expect(semantic.contextType).toBe('astro_followup')
    expect(routing.branch).toBe('analysis')
    expect(routing.route).toBe('science')
    expect(routing.science).toBe('astrology')
    expect(routing.isAstroExact).toBe(true)
    expect(routing.shouldUseApiBackbone).toBe(true)
    expect(routing.effectiveDomainForApi).toBe('science')
  })

  it('propagates usedLocalFallback=true when the exact local fallback was really used', () => {
    const diagnostics = getNormalizationDiagnostics({
      message: 'Voici les donnees astro exactes validees.',
      usedLocalFallback: true,
      fallbackType: 'astro_exact_local',
      metadata: {
        usedLocalFallback: true,
        fallbackType: 'astro_exact_local',
      },
    })

    expect(diagnostics.usedLocalFallback).toBe(true)
    expect(diagnostics.fallbackType).toBe('astro_exact_local')
  })

  it('never keeps a rendered "Soleil en X" when X is absent from the validated exact block', () => {
    const ctx: CompactNatalContext = {
      sunSign: null,
      sunDegree: null,
      moonSign: 'Vierge',
      moonDegree: 12.6,
      risingSign: null,
      risingDegree: null,
      mercurySign: null,
      venusSign: null,
      marsSign: null,
      jupiterSign: null,
      saturnSign: null,
      dominantSigns: [],
      dominantElements: [],
      dominantModalities: [],
      stelliums: [],
      keyAspects: [],
      dominantHouses: [],
      chartShape: null,
      natalSummarySeeds: [],
      fieldSources: {},
      missingFields: ['sun', 'ascendant'],
      compactDataBlock: 'SOLEIL: indisponible\nLUNE: Vierge',
    }

    const validation = validateAstroExactRender('Soleil en Capricorne. Lune en Vierge.', ctx)
    const fallback = buildValidatedAstroExactFallback(ctx, 'fr', null)

    expect(validation.valid).toBe(false)
    expect(validation.violations.some((violation) => violation.includes('sun'))).toBe(true)
    expect(fallback).toContain('Soleil: indisponible')
    expect(fallback).not.toContain('Soleil en Capricorne')
  })
})
