export type UserPlan = 'free' | 'essentiel' | 'premium' | 'praticien'

export type RenderFormat = 'concise' | 'enriched' | 'storytelling' | 'deep'

export type RenderTone = 'direct' | 'fluid' | 'premium' | 'practitioner'

export type RenderProfile = {
  format: RenderFormat
  tone: RenderTone
  maxSections: number
  includeNarrativeOpening: boolean
  includeDeepExplanation: boolean
  includeActionBlock: boolean
  includeKeyBlock: boolean
}

type ResponseModeBucket =
  | 'direct_answer'
  | 'fusion_general'
  | 'timing_strategic_response'
  | 'calculated_reading'
  | 'interpretive_reading'

const FORMAT_BY_BUCKET_AND_PLAN: Record<ResponseModeBucket, Record<UserPlan, RenderFormat>> = {
  direct_answer: {
    free: 'concise',
    essentiel: 'enriched',
    premium: 'enriched',
    praticien: 'deep',
  },
  fusion_general: {
    free: 'concise',
    essentiel: 'enriched',
    premium: 'storytelling',
    praticien: 'deep',
  },
  timing_strategic_response: {
    free: 'concise',
    essentiel: 'enriched',
    premium: 'storytelling',
    praticien: 'deep',
  },
  calculated_reading: {
    free: 'concise',
    essentiel: 'enriched',
    premium: 'storytelling',
    praticien: 'deep',
  },
  interpretive_reading: {
    free: 'enriched',
    essentiel: 'enriched',
    premium: 'storytelling',
    praticien: 'deep',
  },
}

const PROFILE_BY_FORMAT: Record<RenderFormat, RenderProfile> = {
  concise: {
    format: 'concise',
    tone: 'direct',
    maxSections: 4,
    includeNarrativeOpening: false,
    includeDeepExplanation: false,
    includeActionBlock: true,
    includeKeyBlock: true,
  },
  enriched: {
    format: 'enriched',
    tone: 'fluid',
    maxSections: 4,
    includeNarrativeOpening: true,
    includeDeepExplanation: false,
    includeActionBlock: true,
    includeKeyBlock: true,
  },
  storytelling: {
    format: 'storytelling',
    tone: 'premium',
    maxSections: 4,
    includeNarrativeOpening: true,
    includeDeepExplanation: true,
    includeActionBlock: true,
    includeKeyBlock: true,
  },
  deep: {
    format: 'deep',
    tone: 'practitioner',
    maxSections: 4,
    includeNarrativeOpening: true,
    includeDeepExplanation: true,
    includeActionBlock: true,
    includeKeyBlock: true,
  },
}

function normalizeResponseModeBucket(responseMode: string): ResponseModeBucket {
  switch (responseMode) {
    case 'direct_answer':
      return 'direct_answer'
    case 'timing_strategic_response':
      return 'timing_strategic_response'
    case 'calculated_reading':
      return 'calculated_reading'
    case 'interpretive_reading':
    case 'yearly_priority_answer':
    case 'career_fit_answer':
      return 'interpretive_reading'
    case 'fusion_general':
    case 'concise_fusion_answer':
    default:
      return 'fusion_general'
  }
}

export function selectRenderProfile(args: {
  responseMode: string
  userPlan: UserPlan
}): RenderProfile {
  const bucket = normalizeResponseModeBucket(args.responseMode)
  const format = FORMAT_BY_BUCKET_AND_PLAN[bucket][args.userPlan] ?? 'enriched'
  return PROFILE_BY_FORMAT[format]
}
