import { describe, expect, it } from 'vitest'
import {
  FUSION_ONLY_ANALYSIS_MODE,
  SCIENCE_BREAKDOWN_FALLBACK_MESSAGE,
  canAccessScienceBreakdown,
  getFusionOnlyMenu,
  isScienceBreakdownRequest,
  normalizeFusionOnlyAnalysisMode,
  sanitizeFusionOnlySelectionKey,
} from '@/lib/hexastra/fusionOnly'
import { getInternalMenuForMode, getMenuForMode } from '@/lib/hexastra/menus/getMenuForMode'
import { buildSystemPrompt } from '@/lib/hexastra/prompts/buildSystemPrompt'

describe('fusion-only mode', () => {
  it('exposes a fusion-only public menu while keeping internal science menus available', () => {
    const publicMenu = getMenuForMode('libre')
    const internalMenu = getInternalMenuForMode('libre')

    expect(publicMenu.map((item) => item.key)).toEqual(['hexastra_entry'])
    expect(publicMenu[0]?.label).toBe('Explorer votre situation')
    expect(publicMenu[0]?.submenu?.map((item) => item.label)).toContain('Analyse Hexastra')
    expect(publicMenu.flatMap((item) => [item.key, ...(item.submenu?.map((child) => child.key) ?? [])])).not.toContain(
      'science_human_design',
    )

    expect(internalMenu.map((item) => item.key)).toContain('science_human_design')
    expect(internalMenu.map((item) => item.key)).toContain('science_astrologie')
  })

  it('normalizes legacy analysis mode and strips science-first selections', () => {
    expect(normalizeFusionOnlyAnalysisMode('science_by_science')).toBe(FUSION_ONLY_ANALYSIS_MODE)
    expect(normalizeFusionOnlyAnalysisMode(null)).toBe(FUSION_ONLY_ANALYSIS_MODE)
    expect(sanitizeFusionOnlySelectionKey('science_human_design')).toBeNull()
    expect(sanitizeFusionOnlySelectionKey('hd_portes')).toBeNull()
    expect(sanitizeFusionOnlySelectionKey('hexastra_analysis')).toBe('hexastra_analysis')
  })

  it('keeps the future science breakdown unlock practitioner-only', () => {
    expect(canAccessScienceBreakdown('practitioner')).toBe(true)
    expect(canAccessScienceBreakdown('premium')).toBe(false)
    expect(canAccessScienceBreakdown('essential')).toBe(false)
  })

  it('detects explicit science-breakdown requests without blocking generic fusion asks', () => {
    expect(isScienceBreakdownRequest('Montre moi mon Human Design')).toBe(true)
    expect(isScienceBreakdownRequest('Parle-moi de ma numerologie')).toBe(true)
    expect(isScienceBreakdownRequest('Je veux une analyse Hexastra claire de ma situation')).toBe(false)
  })

  it('injects fusion-only voice rules in the main system prompt', () => {
    const prompt = buildSystemPrompt({
      plan: 'premium',
      mode: 'libre_approfondi',
      language: 'fr',
      contextType: 'general',
      practitionerUsage: null,
      requestType: 'chat',
      domainRoute: 'fusion',
      flowStep: 'analysis',
      analysisMode: 'hexastra_fusion',
      messages: [{ role: 'user', content: 'Montre moi mon Human Design' }],
    })

    expect(prompt).toContain('Repondre comme une intelligence unifiee')
    expect(prompt).toContain("ne jamais dire \"selon l astrologie\"")
    expect(prompt).not.toContain('Il est permis de nommer les sciences et sous-sciences publiques')
  })

  it('keeps the science-breakdown fallback copy stable', () => {
    expect(SCIENCE_BREAKDOWN_FALLBACK_MESSAGE).toBe(
      'Hexastra integre plusieurs systemes pour te donner une reponse claire et directe.',
    )
  })

  it('exposes the shared fusion-only menu helper directly', () => {
    const menu = getFusionOnlyMenu('praticien')

    expect(menu[0]?.label).toBe('Explorer votre situation')
    expect(menu[0]?.submenu?.some((item) => item.key === 'hexastra_analysis')).toBe(true)
  })
})
