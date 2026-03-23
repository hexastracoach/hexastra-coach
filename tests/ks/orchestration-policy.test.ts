import { describe, expect, it } from 'vitest'
import { buildNormalizedInput } from '@/lib/hexastra/orchestration/normalizeInput'
import { resolveMenuContract } from '@/lib/hexastra/orchestration/menuContracts'
import { inferRequest } from '@/lib/hexastra/orchestration/inferRequest'
import { decidePolicy } from '@/lib/hexastra/orchestration/policyEngine'
import { buildExecutionPlan } from '@/lib/hexastra/orchestration/executionPlanner'
import { evaluateOrchestration } from '@/lib/hexastra/orchestration/evaluateOrchestration'
import { getPlanContract, getPlanQuotaLimit, getQuotaState } from '@/lib/hexastra/orchestration/planContracts'
import { detectScope } from '@/lib/hexastra/orchestration/detectScope'

describe('orchestration policy layer', () => {
  it('requires clarification when a submenu is selected without a real question', () => {
    const menuContract = resolveMenuContract({
      plan: 'premium',
      selectedMenuKey: 'science_human_design',
      selectedSubmenuKey: 'hd_portes',
    })

    const normalized = buildNormalizedInput({
      requestType: 'chat',
      selectedMenuKey: 'science_human_design',
      selectedSubmenuKey: 'hd_portes',
      userMessage: '3',
      plan: 'premium',
      quotaState: 'ok',
      birthData: null,
      language: 'fr',
      memoryAvailable: true,
      uiAction: 'select_submenu_item',
      contextType: 'science',
      practitionerUsage: null,
      conversationId: 'conv_1',
      hasExplicitGuidance: true,
      journeyEnabled: false,
      messages: [{ role: 'user', content: '3' }],
    })

    const inference = inferRequest({
      normalized,
      menuContract,
      legacyIntent: 'analysis',
    })
    const decision = decidePolicy({ normalized, inference, menuContract })
    const execution = buildExecutionPlan({ normalized, decision, menuContract })

    expect(inference.clarificationNeeded).toBe(true)
    expect(decision.branch).toBe('clarification')
    expect(decision.askClarification).toBe(true)
    expect(execution.callAnalysisEngine).toBe(true)
  })

  it('routes a real Human Design gates question to analysis', () => {
    const menuContract = resolveMenuContract({
      plan: 'premium',
      selectedMenuKey: 'science_human_design',
      selectedSubmenuKey: 'hd_portes',
    })

    const normalized = buildNormalizedInput({
      requestType: 'chat',
      selectedMenuKey: 'science_human_design',
      selectedSubmenuKey: 'hd_portes',
      userMessage: 'Quelles sont mes portes en HD ?',
      plan: 'premium',
      quotaState: 'ok',
      birthData: {
        firstName: 'Christopher',
        date: '1990-01-24',
        place: 'Sucy-en-Brie',
      },
      language: 'fr',
      memoryAvailable: true,
      uiAction: 'send_message',
      contextType: 'science',
      practitionerUsage: null,
      conversationId: 'conv_2',
      hasExplicitGuidance: true,
      journeyEnabled: false,
      messages: [{ role: 'user', content: 'Quelles sont mes portes en HD ?' }],
    })

    const inference = inferRequest({
      normalized,
      menuContract,
      legacyIntent: 'analysis',
    })
    const decision = decidePolicy({ normalized, inference, menuContract })

    expect(inference.clarificationNeeded).toBe(false)
    expect(inference.needsBirthData).toBe(true)
    expect(decision.branch).toBe('analysis')
    expect(decision.effectiveRoute).toBe('science')
  })

  it('redirects out-of-scope requests before execution', () => {
    const normalized = buildNormalizedInput({
      requestType: 'chat',
      selectedMenuKey: null,
      selectedSubmenuKey: null,
      userMessage: 'Aide moi a corriger une erreur TypeScript dans mon code',
      plan: 'free',
      quotaState: 'ok',
      birthData: null,
      language: 'fr',
      memoryAvailable: false,
      uiAction: 'send_message',
      contextType: 'general',
      practitionerUsage: null,
      conversationId: null,
      hasExplicitGuidance: false,
      journeyEnabled: false,
      messages: [{ role: 'user', content: 'Aide moi a corriger une erreur TypeScript dans mon code' }],
    })

    const scopeResult = detectScope(normalized.userMessage)
    const inference = inferRequest({
      normalized,
      menuContract: null,
      legacyIntent: 'conversation',
      scopeResult,
    })
    const decision = decidePolicy({ normalized, inference, menuContract: null, scopeResult })

    expect(inference.scopeAllowed).toBe(false)
    expect(decision.branch).toBe('out_of_scope')
    expect(decision.allowed).toBe(false)
  })

  it('turns hard quota into a quota branch', () => {
    const normalized = buildNormalizedInput({
      requestType: 'chat',
      selectedMenuKey: null,
      selectedSubmenuKey: null,
      userMessage: 'Donne moi mon theme natal',
      plan: 'free',
      quotaState: 'hard_limit',
      birthData: null,
      language: 'fr',
      memoryAvailable: false,
      uiAction: 'send_message',
      contextType: 'general',
      practitionerUsage: null,
      conversationId: 'conv_3',
      hasExplicitGuidance: false,
      journeyEnabled: false,
      messages: [{ role: 'user', content: 'Donne moi mon theme natal' }],
    })

    const inference = inferRequest({
      normalized,
      menuContract: null,
      legacyIntent: 'analysis',
    })
    const decision = decidePolicy({ normalized, inference, menuContract: null })

    expect(decision.branch).toBe('quota')
    expect(decision.fallbackMode).toBe('quota_notice')
  })

  it('exposes the server-side plan contract used by the policy engine', () => {
    expect(getPlanQuotaLimit('free')).toBe(10)
    expect(getPlanContract('practitioner').responseDepth).toBe('expert')
    expect(getQuotaState({ plan: 'free', blocked: false, remaining: 2 })).toBe('soft_limit')
  })

  it('builds a shared orchestration bundle with a single evaluation entry point', () => {
    const normalized = buildNormalizedInput({
      requestType: 'chat',
      selectedMenuKey: 'science_human_design',
      selectedSubmenuKey: 'hd_portes',
      userMessage: 'Quelles sont mes portes en HD ?',
      plan: 'premium',
      quotaState: 'ok',
      birthData: {
        firstName: 'Christopher',
        date: '1990-01-24',
        place: 'Sucy-en-Brie',
      },
      language: 'fr',
      memoryAvailable: true,
      uiAction: 'send_message',
      contextType: 'science',
      practitionerUsage: null,
      conversationId: 'conv_shared_bundle',
      hasExplicitGuidance: true,
      journeyEnabled: false,
      messages: [{ role: 'user', content: 'Quelles sont mes portes en HD ?' }],
    })

    const evaluation = evaluateOrchestration({
      normalized,
      legacyIntent: 'analysis',
    })

    expect(evaluation.menuContract?.id).toBe('hd_portes')
    expect(evaluation.policy.branch).toBe('analysis')
    expect(evaluation.execution.renderTemplate).toBe('guided_analysis')
    expect(evaluation.trace.policy.branch).toBe('analysis')
  })
})
