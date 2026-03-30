import { describe, expect, it } from 'vitest'
import { normalizeFusionExactDataWithDiagnostics } from '@/lib/hexastra/api/normalizeFusionExactData'

describe('normalizeFusionExactData', () => {
  it('reads exactData.transits before legacy aliases', () => {
    const result = normalizeFusionExactDataWithDiagnostics({
      exactData: {
        transits: {
          saturn: 'exact',
        },
      },
      transits: {
        saturn: 'alias',
      },
    })

    expect(result.exactData.transits).toEqual({ saturn: 'exact' })
    expect(result.diagnostics.detectedSections).toContain('transits')
    expect(result.diagnostics.exactDataSections).toContain('transits')
    expect(result.diagnostics.aliasFallbackSections).not.toContain('transits')
  })

  it('falls back to top-level transits aliases when exactData is missing the section', () => {
    const result = normalizeFusionExactDataWithDiagnostics({
      transits: {
        saturn: 'alias',
      },
    })

    expect(result.exactData.transits).toEqual({ saturn: 'alias' })
    expect(result.diagnostics.aliasFallbackSections).toContain('transits')
    expect(result.diagnostics.exactDataSections).not.toContain('transits')
  })

  it('reads exactData.numerology_cycles canonically', () => {
    const result = normalizeFusionExactDataWithDiagnostics({
      exactData: {
        numerology_cycles: {
          yearly: {
            personalYearNumber: 6,
          },
        },
      },
    })

    expect(result.exactData.numerologyCycles).toEqual({
      yearly: {
        personalYearNumber: 6,
      },
    })
    expect(result.diagnostics.exactDataSections).toContain('numerologyCycles')
  })

  it('reads exactData.kua_directions canonically', () => {
    const result = normalizeFusionExactDataWithDiagnostics({
      exactData: {
        kua_directions: {
          favorable_directions: ['SE', 'E'],
        },
      },
    })

    expect(result.exactData.kuaDirections).toEqual({
      favorable_directions: ['SE', 'E'],
    })
    expect(result.diagnostics.exactDataSections).toContain('kuaDirections')
  })

  it('supports multiple exactData sections at the same time', () => {
    const result = normalizeFusionExactDataWithDiagnostics({
      exactData: {
        transits: { saturn: 'active' },
        progressions: { moon: 'progressed' },
        solar_return: { year: 2026 },
        lunar_return: { month: 'April' },
        human_design_transits: { gates: ['55'] },
        numerology_cycles: { yearly: { personalYearNumber: 4 } },
        kua_directions: { favorable_directions: ['North'] },
      },
    })

    expect(result.exactData).toEqual({
      transits: { saturn: 'active' },
      progressions: { moon: 'progressed' },
      solarReturn: { year: 2026 },
      lunarReturn: { month: 'April' },
      humanDesignTransits: { gates: ['55'] },
      numerologyCycles: { yearly: { personalYearNumber: 4 } },
      kuaDirections: { favorable_directions: ['North'] },
    })
    expect(result.diagnostics.missingSections).toHaveLength(0)
  })

  it('keeps null sections without crashing', () => {
    const result = normalizeFusionExactDataWithDiagnostics({
      exactData: {
        transits: null,
        numerology_cycles: null,
        kua_directions: {
          favorable_directions: ['West'],
        },
      },
      transits: {
        saturn: 'legacy should not win',
      },
    })

    expect(result.exactData.transits).toBeNull()
    expect(result.exactData.numerologyCycles).toBeNull()
    expect(result.exactData.kuaDirections).toEqual({
      favorable_directions: ['West'],
    })
    expect(result.diagnostics.exactDataSections).toContain('transits')
    expect(result.diagnostics.aliasFallbackSections).not.toContain('transits')
  })

  it('preserves available false sections as canonical exact data', () => {
    const result = normalizeFusionExactDataWithDiagnostics({
      exactData: {
        human_design_transits: {
          available: false,
        },
      },
      humanDesignTransits: {
        available: true,
      },
    })

    expect(result.exactData.humanDesignTransits).toEqual({
      available: false,
    })
    expect(result.diagnostics.exactDataSections).toContain('humanDesignTransits')
    expect(result.diagnostics.aliasFallbackSections).not.toContain('humanDesignTransits')
  })
})
