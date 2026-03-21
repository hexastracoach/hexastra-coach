/**
 * Tests — Classification + Reliability
 *
 * Validates:
 * 1. Explicit last-message science override in classifyMessage()
 * 2. Text-based frame-only detection in inferRequest() (isContextSelectionOnly)
 * 3. Response mode degradation when reliability = false
 */

import { describe, it, expect } from 'vitest'
import { classifyMessage } from '@/lib/hexastra/orchestration/universalClassification'
import { inferRequest } from '@/lib/hexastra/orchestration/inferRequest'
import { selectResponseMode } from '@/lib/hexastra/orchestration/responseModes'
import type { NormalizedInput, MenuContract } from '@/lib/hexastra/orchestration/types'

// ── Helper ─────────────────────────────────────────────────────────────────────

function makeNormalized(msg: string, uiAction: NormalizedInput['uiAction'] = 'send_message'): NormalizedInput {
  return {
    requestType: 'chat',
    userMessage: msg,
    normalizedUserMessage: msg.toLowerCase().trim(),
    plan: 'premium',
    quotaState: 'ok',
    hasBirthData: true,
    birthDataCompleteness: 'complete',
    sessionState: 'active',
    birthData: null,
    language: 'fr',
    memoryAvailable: false,
    uiAction,
    contextType: 'general',
    practitionerUsage: null,
    practitionerContext: null,
    conversationId: 'test-conv',
    hasExplicitGuidance: false,
    journeyEnabled: false,
    messages: [],
    selectedMenu: null,
    selectedSubmenu: null,
    selectedScience: null,
    selectedSubcategory: null,
    analysisMode: null,
    renderMode: null,
  }
}

function makeMenuContract(): MenuContract {
  return {
    id: 'science',
    parentId: null,
    role: 'science_analysis',
    contextType: 'science',
    route: 'science',
    maxDepth: 'guided',
    dataRequirement: 'birth_basic',
    outputStructure: null,
    contextFrame: 'Analyse par science',
    clarificationQuestion: 'Choisis une science.',
    promptHint: null,
    planCompatibility: ['free', 'essential', 'premium', 'practitioner'],
    fallbackBehavior: ['soft_text'],
  }
}

// ── Part 1: Explicit science override ─────────────────────────────────────────

describe('classifyMessage — explicit science override', () => {
  it('detects numerology when user says "numérologie" (no subcategory)', () => {
    const result = classifyMessage('parle-moi de ma numérologie')
    expect(result.science).toBe('numerology')
  })

  it('detects human_design when user says "design humain"', () => {
    const result = classifyMessage('je veux explorer mon design humain')
    expect(result.science).toBe('human_design')
  })

  it('detects enneagram when user says "ennéagramme"', () => {
    const result = classifyMessage("qu'est-ce que mon ennéagramme dit de moi")
    expect(result.science).toBe('enneagram')
  })

  it('detects kua when user says "kua"', () => {
    const result = classifyMessage('explique-moi mon kua')
    expect(result.science).toBe('kua')
  })

  it('does NOT override when subcategory is detected (subcategory wins)', () => {
    const result = classifyMessage('quel est mon ascendant')
    expect(result.science).toBe('astrology')
    expect(result.subcategory).toBe('ascendant')
  })
})

// ── Part 2: Text-based frame-only detection ────────────────────────────────────

describe('inferRequest — isContextSelectionOnly text detection', () => {
  const menuContract = makeMenuContract()

  it('detects "n\'ouvre pas encore de lecture" as frame-only', () => {
    const result = inferRequest({
      normalized: makeNormalized("n'ouvre pas encore de lecture, montre-moi d'abord les options"),
      menuContract,
    })
    expect(result.isContextSelectionOnly).toBe(true)
    expect(result.clarificationNeeded).toBe(true)
  })

  it('detects "juste pour voir les options" as frame-only', () => {
    const result = inferRequest({
      normalized: makeNormalized('juste pour voir les options'),
      menuContract,
    })
    expect(result.isContextSelectionOnly).toBe(true)
  })

  it('detects "avant de poser ma question, montre-moi le cadre" as frame-only', () => {
    const result = inferRequest({
      normalized: makeNormalized('avant de poser ma question, montre-moi le cadre'),
      menuContract,
    })
    expect(result.isContextSelectionOnly).toBe(true)
  })

  it('does NOT flag a normal question as frame-only', () => {
    const result = inferRequest({
      normalized: makeNormalized('quel est mon ascendant ?'),
      menuContract,
    })
    expect(result.isContextSelectionOnly).toBe(false)
  })

  it('does NOT flag frame-only when no menuContract', () => {
    const result = inferRequest({
      normalized: makeNormalized("n'ouvre pas encore de lecture"),
      menuContract: null,
    })
    expect(result.isContextSelectionOnly).toBe(false)
  })
})

// ── Part 3: Reliability-based mode degradation ────────────────────────────────

describe('selectResponseMode — reliability degradation', () => {
  it('degrades to interpretive_reading when data resolved but reliability=false', () => {
    expect(selectResponseMode({
      requestKind: 'exact_fact',
      subcategory: 'type_hd',
      plan: 'premium',
      exactDataResolved: true,
      exactDataReliable: false,
    })).toBe('interpretive_reading')
  })

  it('returns calculated_reading when data resolved AND reliable', () => {
    expect(selectResponseMode({
      requestKind: 'exact_fact',
      subcategory: 'type_hd',
      plan: 'premium',
      exactDataResolved: true,
      exactDataReliable: true,
    })).toBe('calculated_reading')
  })

  it('returns guided_exploration when data not resolved (exact request)', () => {
    expect(selectResponseMode({
      requestKind: 'exact_fact',
      subcategory: 'nombre_kua',
      plan: 'essential',
      exactDataResolved: false,
    })).toBe('guided_exploration')
  })

  it('returns pedagogical_explanation for clarification kind', () => {
    expect(selectResponseMode({
      requestKind: 'clarification',
      subcategory: null,
      plan: 'premium',
      exactDataResolved: true,
      exactDataReliable: true,
    })).toBe('pedagogical_explanation')
  })

  it('returns interpretive_reading for synthesis without data', () => {
    expect(selectResponseMode({
      requestKind: 'synthesis',
      subcategory: null,
      plan: 'premium',
      exactDataResolved: false,
    })).toBe('interpretive_reading')
  })
})
