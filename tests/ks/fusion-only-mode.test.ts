import { describe, expect, it } from 'vitest'
import {
  FUSION_ONLY_ANALYSIS_MODE,
  canAccessScienceBreakdown,
  detectExplicitScienceIntent,
  getFusionOnlyMenu,
  isFusionFollowupRequest,
  isScienceBreakdownRequest,
  normalizeFusionOnlyAnalysisMode,
  resolvePublicScienceFromSelectionKey,
  resolveScienceSelectionKey,
  sanitizeFusionOnlySelectionKey,
} from '@/lib/hexastra/fusionOnly'
import { getInternalMenuForMode, getMenuForMode } from '@/lib/hexastra/menus/getMenuForMode'
import { buildSystemPrompt } from '@/lib/hexastra/prompts/buildSystemPrompt'
import { buildResponseModeDirective } from '@/lib/hexastra/orchestration/responseModes'

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

  it('normalizes legacy analysis mode and preserves active science selections for conversational continuity', () => {
    expect(normalizeFusionOnlyAnalysisMode('science_by_science')).toBe(FUSION_ONLY_ANALYSIS_MODE)
    expect(normalizeFusionOnlyAnalysisMode(null)).toBe(FUSION_ONLY_ANALYSIS_MODE)
    expect(sanitizeFusionOnlySelectionKey('science_human_design')).toBe('science_human_design')
    expect(sanitizeFusionOnlySelectionKey('hd_portes')).toBe('hd_portes')
    expect(sanitizeFusionOnlySelectionKey('hexastra_analysis')).toBe('hexastra_analysis')
  })

  it('keeps the future science breakdown unlock practitioner-only', () => {
    expect(canAccessScienceBreakdown('practitioner')).toBe(true)
    expect(canAccessScienceBreakdown('premium')).toBe(false)
    expect(canAccessScienceBreakdown('essential')).toBe(false)
  })

  it('detects explicit science asks without blocking generic fusion asks', () => {
    expect(isScienceBreakdownRequest('Montre moi mon Human Design')).toBe(true)
    expect(isScienceBreakdownRequest('Parle-moi de ma numerologie')).toBe(true)
    expect(isScienceBreakdownRequest('Je veux une analyse Hexastra claire de ma situation')).toBe(false)
  })

  it('maps explicit science asks to science-oriented internal selections', () => {
    expect(
      detectExplicitScienceIntent({
        message: 'je veux mon theme astrologique',
        scienceHint: 'astrology',
        subcategory: 'theme_natal',
      }),
    ).toEqual({
      science: 'astrology',
      label: 'Astrologie',
      selectionKey: 'science_astrolex_synthesis',
    })

    expect(
      detectExplicitScienceIntent({
        message: 'I want to understand my Human Design strategy',
        scienceHint: 'human_design',
        subcategory: 'strategie_hd',
      })?.selectionKey,
    ).toBe('science_porteum_authority')

    expect(resolveScienceSelectionKey('numerology', 'annee_personnelle')).toBe('science_triangle_year')
    expect(resolvePublicScienceFromSelectionKey('science_enneagram_synthesis')).toBe('enneagram')
    expect(resolvePublicScienceFromSelectionKey('science_kua_orientation')).toBe('kua')
  })

  it('keeps fusion-first voice rules in the main system prompt by default', () => {
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
      messages: [{ role: 'user', content: 'Je veux une analyse Hexastra claire de ma situation' }],
    })

    expect(prompt).toContain('Repondre comme une intelligence unifiee')
    expect(prompt).toContain("ne jamais dire \"selon l astrologie\"")
    expect(prompt).not.toContain('Il est permis de nommer publiquement Human Design')
  })

  it('allows a science-specific Hexastra framing when the science is explicitly requested', () => {
    const prompt = buildSystemPrompt({
      plan: 'premium',
      mode: 'libre_approfondi',
      language: 'fr',
      contextType: 'science',
      practitionerUsage: null,
      requestType: 'chat',
      domainRoute: 'science',
      flowStep: 'analysis',
      selectedScience: 'human_design',
      selectedSubcategory: 'profil_hd',
      messages: [{ role: 'user', content: 'Montre moi mon Human Design' }],
    })

    expect(prompt).toContain('Mode de lecture choisi: ANGLE HUMAN DESIGN SOUS CADRE HEXASTRA')
    expect(prompt).toContain('Il est permis de nommer publiquement Human Design')
    expect(prompt).toContain('Si tu veux, je peux ensuite croiser cela avec une lecture plus globale.')
    expect(prompt).not.toContain(
      'Redirige simplement avec: "Je peux te donner une reponse directe si tu me parles de ta situation."',
    )
  })

  it('detects explicit requests to return from a science angle to a broader fusion reading', () => {
    expect(isFusionFollowupRequest('Si tu veux, croise ensuite avec une lecture plus globale')).toBe(true)
    expect(isFusionFollowupRequest('Je veux une lecture Hexastra de ma situation')).toBe(false)
  })

  it('exposes the shared fusion-only menu helper directly', () => {
    const menu = getFusionOnlyMenu('praticien')

    expect(menu[0]?.label).toBe('Explorer votre situation')
    expect(menu[0]?.submenu?.some((item) => item.key === 'hexastra_analysis')).toBe(true)
  })

  it('isolates yearly priorities from fusion coaching and question-shape templates', () => {
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
      fusionOnlyExperience: true,
      responseModeDirective: buildResponseModeDirective('yearly_priority_answer'),
      questionShapeDirective: '# QUESTION_SHAPE: COMMENT -> ACTION_GUIDANCE',
      messages: [{ role: 'user', content: 'Sur quoi je dois me concentrer cette annee ?' }],
    })

    expect(prompt).toContain('# YEARLY_PRIORITY_ANSWER_MODE')
    expect(prompt).toContain('OUTPUT SENTINEL - STRUCTURE FINALE ANNUELLE OBLIGATOIRE')
    expect(prompt).toContain('Ne pas utiliser: CE QUI SE PASSE')
    expect(prompt).toContain('Debut d annee')
    expect(prompt).not.toContain('STRUCTURE DE SORTIE â€” PLAN PREMIUM')
    expect(prompt).not.toContain('◆ 1. Sphère centrale')
    expect(prompt).not.toContain('# QUESTION_SHAPE:')
  })
})
