import type { NormalizedFusionExactData } from '@/lib/hexastra/api/normalizeFusionExactData'
import type { UserIntent } from '@/lib/hexastra/orchestration/intentClassifier'
import type { RequestKind } from '@/lib/hexastra/orchestration/requestKinds'
import {
  selectResponseMode as selectLegacyResponseMode,
  type ResponseMode,
} from '@/lib/hexastra/orchestration/responseModes'
import {
  hasCareerPathTerms,
  isCareerGuidanceQuery,
  isCareerOrientationPrompt,
} from '@/lib/hexastra/orchestration/careerGuidance'
import type { PrioritizedStructuredSignal } from '@/lib/hexastra/retrieval/prioritizeStructuredSignals'
import type { RetrievalPlan } from '@/lib/hexastra/retrieval/retrievalPlanBuilder'
import type { StructuredSignal } from '@/lib/hexastra/retrieval/structuredSignalBuilder'
import {
  selectOpeningSignal,
  type OpeningSignalSelection,
} from '@/lib/hexastra/orchestrator/selectOpeningSignal'

export type ResponseModeSelection = {
  responseMode: ResponseMode
  dominantOpeningSource: 'fusion' | 'exact_data' | 'retrieval'
  dominantOpeningScience?: string | null
  dominantOpeningSubCategory?: string | null
  reasoningTags?: string[]
  openingSelection?: OpeningSignalSelection | null
  openingSignal?: StructuredSignal | null
  orderedSignals?: StructuredSignal[]
}

function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasStableExactTimingData(exactData?: NormalizedFusionExactData): boolean {
  if (!exactData) return false

  return Boolean(
    exactData.transits ||
      exactData.progressions ||
      exactData.solarReturn ||
      exactData.lunarReturn ||
      exactData.humanDesignTransits ||
      exactData.numerologyCycles,
  )
}

function uniq(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}

function applyLegacyOverrides(args: {
  responseMode: ResponseMode
  isDirectKnowledge?: boolean
  isTimingStrategicIntent?: boolean
  isAstroFollowupExact?: boolean
  forceInterpretiveEnneagram?: boolean
}): { responseMode: ResponseMode; tags: string[] } {
  if (args.isDirectKnowledge) {
    return {
      responseMode: 'direct_answer',
      tags: ['direct_knowledge_override'],
    }
  }

  if (args.isTimingStrategicIntent) {
    return {
      responseMode: 'timing_strategic_response',
      tags: ['timing_strategic_override'],
    }
  }

  if (args.isAstroFollowupExact) {
    return {
      responseMode: 'calculated_reading',
      tags: ['astro_followup_override'],
    }
  }

  if (args.forceInterpretiveEnneagram && args.responseMode === 'calculated_reading') {
    return {
      responseMode: 'interpretive_reading',
      tags: ['enneagram_interpretive_override'],
    }
  }

  return {
    responseMode: args.responseMode,
    tags: [],
  }
}

export function selectResponseModeSelection(args: {
  userMessage: string
  requestKind: RequestKind
  subcategory: string | null
  plan: 'free' | 'essential' | 'premium' | 'practitioner'
  exactDataResolved?: boolean
  exactDataReliable?: boolean
  isPedagogical?: boolean
  isFusionIntent?: boolean
  isDirectKnowledge?: boolean
  isTimingStrategicIntent?: boolean
  isAstroFollowupExact?: boolean
  forceInterpretiveEnneagram?: boolean
  retrievalPlan: RetrievalPlan
  structuredSignals: StructuredSignal[]
  scoredSignals?: PrioritizedStructuredSignal[]
  normalizedExactData?: NormalizedFusionExactData
  intent?: UserIntent | string | null
}): ResponseModeSelection {
  const legacyMode = selectLegacyResponseMode({
    requestKind: args.requestKind,
    subcategory: args.subcategory,
    plan: args.plan,
    intent: args.intent ?? null,
    exactDataResolved: args.exactDataResolved,
    exactDataReliable: args.exactDataReliable,
    isPedagogical: args.isPedagogical,
    isFusionIntent: args.isFusionIntent,
  })

  const legacyOverride = applyLegacyOverrides({
    responseMode: legacyMode,
    isDirectKnowledge: args.isDirectKnowledge,
    isTimingStrategicIntent: args.isTimingStrategicIntent,
    isAstroFollowupExact: args.isAstroFollowupExact,
    forceInterpretiveEnneagram: args.forceInterpretiveEnneagram,
  })

  let responseMode = legacyOverride.responseMode
  const reasoningTags = [`legacy_mode:${legacyMode}`, ...legacyOverride.tags]
  const normalizedQuery = normalize(args.userMessage)
  const isAmbiguous =
    !args.retrievalPlan.dominantScience &&
    (args.retrievalPlan.ambiguities?.length ?? 0) > 0
  const isGlobalCurrent =
    /(fusion_general_question|inner_state|blocage|life_period|timing)/.test(
      (args.intent ?? '').toLowerCase(),
    ) &&
    /en ce moment|que se passe|qu'est-ce que je traverse|qu est-ce que je traverse|bonne periode|période actuelle|periode actuelle/.test(
      normalizedQuery,
    )

  if (args.requestKind === 'yearly_priorities') {
    responseMode = 'yearly_priority_answer'
    reasoningTags.push(
      'yearly_priority_override',
      args.exactDataResolved
        ? 'exact_data_backed_interpretive_query'
        : 'yearly_priority_waiting_for_exact_data',
    )
  }

  const normalizedIntent = normalize(args.intent ?? '')
  const hasCareerPromptSignal = isCareerOrientationPrompt(args.userMessage)
  const isCareerFallback =
    args.requestKind === 'career_orientation' ||
    args.subcategory === 'career_guidance' ||
    hasCareerPromptSignal ||
    ((normalizedIntent === 'work_money' || normalizedIntent === 'career_guidance') &&
      (isCareerGuidanceQuery(args.userMessage) || hasCareerPathTerms(args.userMessage)))

  if (
    isCareerFallback &&
    responseMode !== 'career_path_answer' &&
    responseMode !== 'career_fit_answer'
  ) {
    responseMode = 'career_path_answer'
    reasoningTags.push('career_path_fallback')
  }

  if (responseMode === 'concise_fusion_answer') {
    if (isGlobalCurrent) {
      reasoningTags.push('global_current_fusion_mode')
    }

    if (isAmbiguous) {
      reasoningTags.push('ambiguous_soft_mode')
    }

    if (
      args.retrievalPlan.dominantScience &&
      args.retrievalPlan.dominantScience !== 'fusion' &&
      hasStableExactTimingData(args.normalizedExactData)
    ) {
      reasoningTags.push('mono_science_exact_context_available')
    }
  }

  if (responseMode === 'career_fit_answer' || responseMode === 'career_path_answer') {
    reasoningTags.push('career_guidance_mode')
  }

  const openingSelection: OpeningSignalSelection = selectOpeningSignal({
    userMessage: args.userMessage,
    retrievalPlan: args.retrievalPlan,
    structuredSignals: args.structuredSignals,
    scoredSignals: args.scoredSignals,
    responseMode,
    intent: args.intent,
  })

  return {
    responseMode,
    dominantOpeningSource: openingSelection.dominantOpeningSource,
    dominantOpeningScience: openingSelection.dominantOpeningScience ?? null,
    dominantOpeningSubCategory: openingSelection.dominantOpeningSubCategory ?? null,
    reasoningTags: uniq([...reasoningTags, ...(openingSelection.reasoningTags ?? [])]),
    openingSelection,
    openingSignal: openingSelection.signal,
    orderedSignals: openingSelection.orderedSignals,
  }
}
