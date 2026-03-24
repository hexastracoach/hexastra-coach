/**
 * Tests - Classification + Reliability
 */

import { describe, it, expect } from 'vitest'
import { classifyMessage } from '@/lib/hexastra/orchestration/universalClassification'
import { inferRequest } from '@/lib/hexastra/orchestration/inferRequest'
import { selectResponseMode } from '@/lib/hexastra/orchestration/responseModes'
import { buildNormalizedInput } from '@/lib/hexastra/orchestration/normalizeInput'
import type { NormalizedInput, MenuContract } from '@/lib/hexastra/orchestration/types'

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

describe('classifyMessage - explicit science override', () => {
  it('detects numerology when user says "numerologie" (no subcategory)', () => {
    const result = classifyMessage('parle-moi de ma numerologie')
    expect(result.science).toBe('numerology')
  })

  it('detects astrology when user explicitly asks for a thème astrologique', () => {
    const result = classifyMessage('donne moi mon thème astrologique')
    expect(result.science).toBe('astrology')
  })

  it('detects human_design when user says "design humain"', () => {
    const result = classifyMessage('je veux explorer mon design humain')
    expect(result.science).toBe('human_design')
  })

  it('detects enneagram when user says "enneagramme"', () => {
    const result = classifyMessage("qu'est-ce que mon enneagramme dit de moi")
    expect(result.science).toBe('enneagram')
  })

  it('detects kua when user says "kua"', () => {
    const result = classifyMessage('explique-moi mon kua')
    expect(result.science).toBe('kua')
  })

  it('does not override when a precise subcategory is detected', () => {
    const result = classifyMessage('quel est mon ascendant')
    expect(result.science).toBe('astrology')
    expect(result.subcategory).toBe('ascendant')
  })
})

describe('buildNormalizedInput - accent handling', () => {
  it('keeps science keywords readable after accent normalization', () => {
    const normalized = buildNormalizedInput({
      requestType: 'chat',
      selectedMenuKey: null,
      selectedSubmenuKey: null,
      userMessage: 'donne moi mon thème astrologique',
      plan: 'free',
      quotaState: 'ok',
      birthData: null,
      language: 'fr',
      memoryAvailable: false,
      uiAction: 'send_message',
      contextType: 'general',
      practitionerUsage: null,
      conversationId: 'accent-test',
      hasExplicitGuidance: false,
      journeyEnabled: false,
      messages: [{ role: 'user', content: 'donne moi mon thème astrologique' }],
    })

    expect(normalized.normalizedUserMessage).toBe('donne moi mon theme astrologique')
  })
})

describe('inferRequest - frame-only detection', () => {
  const menuContract = makeMenuContract()

  it("detects frame-only phrasing like 'n'ouvre pas encore de lecture'", () => {
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

  it('does not flag a normal question as frame-only', () => {
    const result = inferRequest({
      normalized: makeNormalized('quel est mon ascendant ?'),
      menuContract,
    })
    expect(result.isContextSelectionOnly).toBe(false)
  })
})

describe('selectResponseMode - reliability degradation', () => {
  it('degrades to guided_exploration when data resolved but reliability=false', () => {
    expect(selectResponseMode({
      requestKind: 'exact_fact',
      subcategory: 'type_hd',
      plan: 'premium',
      exactDataResolved: true,
      exactDataReliable: false,
    })).toBe('guided_exploration')
  })

  it('returns calculated_reading when data resolved and reliable', () => {
    expect(selectResponseMode({
      requestKind: 'exact_fact',
      subcategory: 'type_hd',
      plan: 'premium',
      exactDataResolved: true,
      exactDataReliable: true,
    })).toBe('calculated_reading')
  })

  it('returns guided_exploration when data is not resolved for an exact request', () => {
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
