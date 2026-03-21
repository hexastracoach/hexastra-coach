/**
 * Tests — Fallback Policy
 *
 * Validates resolveFallbackMode() for all plan-differentiated fallback branches:
 * - quota_notice  when quotaState = hard_limit
 * - menu_redirect when out_of_scope, plan incompatible with menu, or planInsufficient
 * - soft_text     when birth data missing (free/essential) or clarification needed
 * - none          when all conditions are nominal
 */

import { describe, it, expect } from 'vitest'
import { resolveFallbackMode } from '@/lib/hexastra/orchestration/fallbackPolicy'
import type { NormalizedInput, InferenceResult, MenuContract } from '@/lib/hexastra/orchestration/types'
import { PLAN_CONTRACTS } from '@/lib/hexastra/orchestration/planContracts'

// ── Factories ─────────────────────────────────────────────────────────────────

function makeNormalized(overrides: Partial<NormalizedInput> = {}): NormalizedInput {
  return {
    requestType: 'chat',
    selectedMenu: null,
    selectedSubmenu: null,
    userMessage: 'test',
    normalizedUserMessage: 'test',
    plan: 'premium',
    quotaState: 'ok',
    hasBirthData: true,
    birthDataCompleteness: 'complete',
    sessionState: 'active',
    language: 'fr',
    memoryAvailable: true,
    uiAction: null,
    contextType: 'general',
    practitionerUsage: 'self',
    conversationId: null,
    hasExplicitGuidance: false,
    journeyEnabled: false,
    birthData: null,
    messages: [],
    selectedScience: null,
    selectedSubcategory: null,
    analysisMode: null,
    renderMode: null,
    practitionerContext: null,
    ...overrides,
  } as NormalizedInput
}

function makeInference(overrides: Partial<InferenceResult> = {}): InferenceResult {
  return {
    explicitIntent: 'analysis',
    implicitIntent: '',
    dominantDomain: 'science',
    urgencyLevel: 'low',
    depthRequested: 'deep',
    timeHorizon: 'present',
    needsBirthData: false,
    needsAnalysisEngine: true,
    needsExternalCalculation: false,
    clarificationNeeded: false,
    scopeAllowed: true,
    isContextSelectionOnly: false,
    ...overrides,
  }
}

function makeMenuContract(planCompatibility: Array<'free' | 'essential' | 'premium' | 'practitioner'>): MenuContract {
  return {
    id: 'test_menu',
    parentId: null,
    role: 'analysis',
    contextType: 'general',
    route: 'science',
    maxDepth: 'deep',
    dataRequirement: 'birth_basic',
    outputStructure: null,
    contextFrame: null,
    clarificationQuestion: null,
    promptHint: null,
    planCompatibility,
    fallbackBehavior: ['menu_redirect'],
  }
}

// ── quota_notice ──────────────────────────────────────────────────────────────

describe('resolveFallbackMode — quota_notice', () => {
  it('returns quota_notice when quotaState = hard_limit (free plan)', () => {
    expect(resolveFallbackMode({
      normalized: makeNormalized({ plan: 'free', quotaState: 'hard_limit' }),
      inference: makeInference(),
      planContract: PLAN_CONTRACTS.free,
      menuContract: null,
    })).toBe('quota_notice')
  })

  it('returns quota_notice when quotaState = hard_limit (essential plan)', () => {
    expect(resolveFallbackMode({
      normalized: makeNormalized({ plan: 'essential', quotaState: 'hard_limit' }),
      inference: makeInference(),
      planContract: PLAN_CONTRACTS.essential,
      menuContract: null,
    })).toBe('quota_notice')
  })

  it('does NOT return quota_notice at soft_limit', () => {
    const result = resolveFallbackMode({
      normalized: makeNormalized({ plan: 'free', quotaState: 'soft_limit' }),
      inference: makeInference(),
      planContract: PLAN_CONTRACTS.free,
      menuContract: null,
    })
    expect(result).not.toBe('quota_notice')
  })
})

// ── menu_redirect — out_of_scope ──────────────────────────────────────────────

describe('resolveFallbackMode — out_of_scope → menu_redirect', () => {
  it('returns menu_redirect when explicitIntent = out_of_scope', () => {
    expect(resolveFallbackMode({
      normalized: makeNormalized(),
      inference: makeInference({ explicitIntent: 'out_of_scope' }),
      planContract: PLAN_CONTRACTS.premium,
      menuContract: null,
    })).toBe('menu_redirect')
  })
})

// ── soft_text — missing birth data ────────────────────────────────────────────

describe('resolveFallbackMode — missing birth data → soft_text', () => {
  it('returns soft_text for free plan + needsBirthData=true + birthData=none', () => {
    expect(resolveFallbackMode({
      normalized: makeNormalized({ plan: 'free', birthDataCompleteness: 'none' }),
      inference: makeInference({ needsBirthData: true }),
      planContract: PLAN_CONTRACTS.free,
      menuContract: null,
    })).toBe('soft_text')
  })

  it('returns soft_text for essential plan + needsBirthData=true + birthData=none', () => {
    expect(resolveFallbackMode({
      normalized: makeNormalized({ plan: 'essential', birthDataCompleteness: 'none' }),
      inference: makeInference({ needsBirthData: true }),
      planContract: PLAN_CONTRACTS.essential,
      menuContract: null,
    })).toBe('soft_text')
  })

  it('does NOT return soft_text when birth data is present', () => {
    const result = resolveFallbackMode({
      normalized: makeNormalized({ plan: 'free', birthDataCompleteness: 'complete' }),
      inference: makeInference({ needsBirthData: true }),
      planContract: PLAN_CONTRACTS.free,
      menuContract: null,
    })
    expect(result).not.toBe('soft_text')
  })
})

// ── menu_redirect — plan incompatible with menu ───────────────────────────────

describe('resolveFallbackMode — plan incompatible with menu → menu_redirect', () => {
  it('returns menu_redirect when free plan tries a premium-only menu', () => {
    const premiumOnlyMenu = makeMenuContract(['premium', 'practitioner'])
    expect(resolveFallbackMode({
      normalized: makeNormalized({ plan: 'free' }),
      inference: makeInference(),
      planContract: PLAN_CONTRACTS.free,
      menuContract: premiumOnlyMenu,
    })).toBe('menu_redirect')
  })

  it('does NOT return menu_redirect when plan is in menu compatibility list', () => {
    const allPlansMenu = makeMenuContract(['free', 'essential', 'premium', 'practitioner'])
    const result = resolveFallbackMode({
      normalized: makeNormalized({ plan: 'free' }),
      inference: makeInference(),
      planContract: PLAN_CONTRACTS.free,
      menuContract: allPlansMenu,
    })
    expect(result).not.toBe('menu_redirect')
  })
})

// ── soft_text — clarification needed ─────────────────────────────────────────

describe('resolveFallbackMode — clarification needed → soft_text', () => {
  it('returns soft_text when clarificationNeeded=true (premium plan, no other blocker)', () => {
    expect(resolveFallbackMode({
      normalized: makeNormalized({ plan: 'premium' }),
      inference: makeInference({ clarificationNeeded: true }),
      planContract: PLAN_CONTRACTS.premium,
      menuContract: null,
    })).toBe('soft_text')
  })
})

// ── none — nominal cases ──────────────────────────────────────────────────────

describe('resolveFallbackMode — none (nominal)', () => {
  it('returns none for premium plan with complete birth data and no issues', () => {
    expect(resolveFallbackMode({
      normalized: makeNormalized({ plan: 'premium', birthDataCompleteness: 'complete' }),
      inference: makeInference(),
      planContract: PLAN_CONTRACTS.premium,
      menuContract: null,
    })).toBe('none')
  })

  it('returns none for practitioner plan with all conditions nominal', () => {
    expect(resolveFallbackMode({
      normalized: makeNormalized({ plan: 'practitioner', birthDataCompleteness: 'complete' }),
      inference: makeInference(),
      planContract: PLAN_CONTRACTS.practitioner,
      menuContract: null,
    })).toBe('none')
  })

  it('returns none when needsBirthData=false even if birthDataCompleteness=none', () => {
    expect(resolveFallbackMode({
      normalized: makeNormalized({ plan: 'free', birthDataCompleteness: 'none' }),
      inference: makeInference({ needsBirthData: false }),
      planContract: PLAN_CONTRACTS.free,
      menuContract: null,
    })).toBe('none')
  })
})

// ── Priority order ────────────────────────────────────────────────────────────

describe('resolveFallbackMode — priority order', () => {
  it('quota_notice takes priority over out_of_scope', () => {
    expect(resolveFallbackMode({
      normalized: makeNormalized({ plan: 'free', quotaState: 'hard_limit' }),
      inference: makeInference({ explicitIntent: 'out_of_scope' }),
      planContract: PLAN_CONTRACTS.free,
      menuContract: null,
    })).toBe('quota_notice')
  })

  it('out_of_scope takes priority over missing birth data', () => {
    expect(resolveFallbackMode({
      normalized: makeNormalized({ plan: 'free', birthDataCompleteness: 'none' }),
      inference: makeInference({ explicitIntent: 'out_of_scope', needsBirthData: true }),
      planContract: PLAN_CONTRACTS.free,
      menuContract: null,
    })).toBe('menu_redirect')
  })
})
