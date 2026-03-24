import { describe, expect, it } from 'vitest'
import { resolveFinalFlowPresentation } from '@/lib/hexastra/orchestrator/runHexastraFlow'

describe('resolveFinalFlowPresentation', () => {
  it('keeps "je suis quel signe" after birth data save on analysis instead of restart_flow menu', () => {
    const result = resolveFinalFlowPresentation({
      branch: 'birth_update',
      flowStep: 'analysis',
      effectiveRequestType: 'chat',
      uiAction: 'restart_flow',
      isAstroExact: true,
      exactDataResolved: true,
      specializedResultHasResult: true,
      science: 'astrology',
      isHumanDesignExact: false,
      hdHasUsableFields: false,
    })

    expect(result.chosenFinalStep).toBe('analysis')
    expect(result.menuVisible).toBe(false)
    expect(result.astroExactMenuOverrideBlocked).toBe(true)
    expect(result.birthUpdateMenuOverrideBlocked).toBe(true)
  })

  it('forces analysis when an exact astrology result would otherwise fall back to flowStep=menu', () => {
    const result = resolveFinalFlowPresentation({
      branch: 'analysis',
      flowStep: 'menu',
      effectiveRequestType: 'chat',
      uiAction: 'send_message',
      isAstroExact: true,
      exactDataResolved: true,
      specializedResultHasResult: true,
      science: 'astrology',
      isHumanDesignExact: false,
      hdHasUsableFields: false,
    })

    expect(result.chosenFinalStep).toBe('analysis')
    expect(result.menuVisible).toBe(false)
    expect(result.astroExactMenuOverrideBlocked).toBe(true)
    expect(result.birthUpdateMenuOverrideBlocked).toBe(false)
  })

  it('still allows menu when exact astrology data is not resolved yet', () => {
    const result = resolveFinalFlowPresentation({
      branch: 'birth_update',
      flowStep: 'analysis',
      effectiveRequestType: 'chat',
      uiAction: 'restart_flow',
      isAstroExact: true,
      exactDataResolved: false,
      specializedResultHasResult: false,
      science: 'astrology',
      isHumanDesignExact: false,
      hdHasUsableFields: false,
    })

    expect(result.chosenFinalStep).toBe('menu')
    expect(result.menuVisible).toBe(true)
    expect(result.astroExactMenuOverrideBlocked).toBe(false)
    expect(result.birthUpdateMenuOverrideBlocked).toBe(false)
  })

  it('preserves the existing Human Design exact analysis override', () => {
    const result = resolveFinalFlowPresentation({
      branch: 'analysis',
      flowStep: 'clarification',
      effectiveRequestType: 'chat',
      uiAction: 'send_message',
      isAstroExact: false,
      exactDataResolved: true,
      specializedResultHasResult: true,
      science: 'human_design',
      isHumanDesignExact: true,
      hdHasUsableFields: true,
    })

    expect(result.chosenFinalStep).toBe('analysis')
    expect(result.menuVisible).toBe(false)
    expect(result.hdExactAnalysisOverride).toBe(true)
  })
})
