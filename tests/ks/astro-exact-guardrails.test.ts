import { describe, expect, it } from 'vitest'
import { detectContext } from '@/lib/hexastra/orchestration/detectContext'
import { classifyMessage } from '@/lib/hexastra/orchestration/universalClassification'
import { resolveAstroFollowupRoutingState } from '@/lib/hexastra/orchestrator/runHexastraFlow'
import {
  buildCompactNatalReadingContext,
  buildDeterministicAstroExactAnswer,
  enforceAstroExactRender,
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
    expect(routing.lockTrigger).toBe('astro_followup')
  })

  it('forces science route when astro exact stays ambiguous (subcategory=null, requestKind=unknown)', () => {
    const routing = resolveAstroFollowupRoutingState({
      semanticContextType: 'astro_exact',
      currentRoute: 'general',
      science: 'astrology',
      isAstroExact: true,
      hasBirthData: true,
      subcategory: null,
      requestKind: 'unknown',
    })

    expect(routing.route).toBe('science')
    expect(routing.effectiveDomainForApi).toBe('science')
    expect(routing.shouldUseApiBackbone).toBe(true)
    expect(routing.lockTrigger).toBe('astro_exact_with_birth_data')
    expect(routing.forcedWithoutSubcategory).toBe(true)
    expect(routing.forcedWithUnknownRequestKind).toBe(true)
  })

  it.each([
    'quel est mon signe astrologique',
    'quel est mon signe satrologique',
    'je suis quel signe',
    "c'est quoi mon signe solaire",
  ])(
    'forces science route for simple astro exact phrasing: $message',
    (message) => {
      const semantic = detectContext(message)
      const classification = classifyMessage(message)
      const routing = resolveAstroFollowupRoutingState({
        semanticContextType: semantic.contextType,
        currentRoute: 'general',
        science: classification.science,
        isAstroExact: semantic.contextType === 'astro_exact' || semantic.contextType === 'astro_followup',
        hasBirthData: true,
        subcategory: classification.subcategory,
        requestKind: classification.requestKind,
      })

      expect(semantic.contextType).toBe('astro_exact')
      expect(classification.science).toBe('astrology')
      expect(classification.needsExactData).toBe(true)
      expect(routing.route).toBe('science')
      expect(routing.effectiveDomainForApi).toBe('science')
      expect(routing.shouldUseApiBackbone).toBe(true)
      expect(routing.lockTrigger).toBe('astro_exact_with_birth_data')
      expect(routing.route).not.toBe('general')
      expect(routing.effectiveDomainForApi).not.toBe('general')
    },
  )

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

  it('rejects a rendered moon sign that contradicts the exact source', () => {
    const ctx: CompactNatalContext = {
      sunSign: 'Verseau',
      sunDegree: 4.1,
      moonSign: 'Capricorne',
      moonDegree: 12.6,
      risingSign: 'Gemeaux',
      risingDegree: 18.4,
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
      missingFields: [],
      compactDataBlock: 'SOLEIL: Verseau\nLUNE: Capricorne\nASCENDANT: Gemeaux',
    }

    const validation = validateAstroExactRender('Ta Lune est en Scorpion.', ctx)

    expect(validation.valid).toBe(false)
    expect(validation.violations).toContain('moon:expected_Capricorne:received_Scorpion')
  })

  it('rejects a rendered sun sign that contradicts the exact source', () => {
    const ctx: CompactNatalContext = {
      sunSign: 'Verseau',
      sunDegree: 4.1,
      moonSign: 'Capricorne',
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
      missingFields: [],
      compactDataBlock: 'SOLEIL: Verseau\nLUNE: Capricorne',
    }

    const validation = validateAstroExactRender('Ton signe solaire est Capricorne.', ctx)

    expect(validation.valid).toBe(false)
    expect(validation.violations).toContain('sun:expected_Verseau:received_Capricorne')
  })

  it('builds a short deterministic answer for simple sun-sign questions', () => {
    const ctx: CompactNatalContext = {
      sunSign: 'Verseau',
      sunDegree: 4.1,
      moonSign: 'Capricorne',
      moonDegree: 12.6,
      risingSign: 'Gemeaux',
      risingDegree: 18.4,
      mercurySign: null,
      venusSign: null,
      marsSign: null,
      jupiterSign: null,
      saturnSign: null,
      dominantSigns: [],
      dominantElements: [],
      dominantModalities: [],
      stelliums: [],
      keyAspects: ['Soleil trigone Lune'],
      dominantHouses: [],
      chartShape: null,
      natalSummarySeeds: [],
      fieldSources: {},
      missingFields: [],
      compactDataBlock: 'SOLEIL: Verseau\nLUNE: Capricorne\nASCENDANT: Gemeaux',
    }

    const answer = buildDeterministicAstroExactAnswer({
      message: 'je suis quel signe',
      ctx,
      language: 'fr',
      subcategory: 'signe_solaire',
      requestKind: 'exact_fact',
    })

    expect(answer).toBe('Ton signe solaire est Verseau.')
  })

  it('falls back to a deterministic exact answer instead of returning a wrong rendered sign', () => {
    const ctx: CompactNatalContext = {
      sunSign: 'Verseau',
      sunDegree: 4.1,
      moonSign: 'Capricorne',
      moonDegree: 12.6,
      risingSign: 'Gemeaux',
      risingDegree: 18.4,
      mercurySign: null,
      venusSign: null,
      marsSign: null,
      jupiterSign: null,
      saturnSign: null,
      dominantSigns: [],
      dominantElements: [],
      dominantModalities: [],
      stelliums: [],
      keyAspects: ['Soleil trigone Lune'],
      dominantHouses: [],
      chartShape: null,
      natalSummarySeeds: [],
      fieldSources: {},
      missingFields: [],
      compactDataBlock: 'SOLEIL: Verseau\nLUNE: Capricorne\nASCENDANT: Gemeaux',
    }

    const enforced = enforceAstroExactRender({
      message: 'Ton signe solaire est Capricorne. Ta Lune est en Scorpion.',
      ctx,
      language: 'fr',
      firstName: null,
      latestUserMessage: 'c est quoi mon signe solaire',
      subcategory: 'signe_solaire',
      requestKind: 'exact_fact',
    })

    expect(enforced.usedFallback).toBe(true)
    expect(enforced.fallbackType).toBe('astro_exact_simple_local')
    expect(enforced.message).toBe('Ton signe solaire est Verseau.')
    expect(enforced.message).not.toContain('Capricorne')
    expect(enforced.validation.violations).toContain('sun:expected_Verseau:received_Capricorne')
  })

  it('rejects aspects that are absent from the validated exact block', () => {
    const ctx: CompactNatalContext = {
      sunSign: 'Verseau',
      sunDegree: 4.1,
      moonSign: 'Capricorne',
      moonDegree: 12.6,
      risingSign: null,
      risingDegree: null,
      mercurySign: null,
      venusSign: null,
      marsSign: 'Belier',
      jupiterSign: null,
      saturnSign: null,
      dominantSigns: [],
      dominantElements: [],
      dominantModalities: [],
      stelliums: [],
      keyAspects: ['Soleil trigone Lune'],
      dominantHouses: [],
      chartShape: null,
      natalSummarySeeds: [],
      fieldSources: {},
      missingFields: [],
      compactDataBlock: 'SOLEIL: Verseau\nLUNE: Capricorne\nMARS: Belier\nASPECTS CLES: Soleil trigone Lune',
    }

    const validation = validateAstroExactRender('Soleil carre Mars.', ctx)

    expect(validation.valid).toBe(false)
    expect(validation.violations).toContain('aspect:rendered_without_validated_source:square:mars:sun')
  })
})
