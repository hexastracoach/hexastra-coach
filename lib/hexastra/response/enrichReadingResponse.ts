import type { HexastraApiResponse } from '@/lib/hexastra/types'
import { getSolarSignFromDate, SOLAR_SIGN_CLOSURES, type SolarSign } from '@/lib/hexastra/utils/solarSign'
import { generateContextualSuggestions } from '@/lib/hexastra/response/contextualSuggestions'

type EnrichInput = {
  response: HexastraApiResponse
  plan: string
  birthDate?: string | null
  solarSign?: string | null
  contextType?: string | null
  domainRoute?: string | null
  selectedMenuKey?: string | null
  selectedSubmenuKey?: string | null
  explicitGuidance?: boolean
}

const TECH_STEPS = ['quota_limit', 'error', 'birthdata', 'practitioner_usage', 'loading', 'menu', 'clarification']
const READING_STEPS = ['analysis', 'decision', 'deep_reading', 'sensitive_support', 'micro_profile', 'micro_year', 'micro_month']

function shouldEnrich(response: HexastraApiResponse): boolean {
  if (!response?.reply && !response?.message) return false
  const step = response?.flowState?.step
  if (!step) return false
  if (TECH_STEPS.includes(step)) return false
  return READING_STEPS.includes(step)
}

function pickSign(birthDate?: string | null, solar?: string | null): SolarSign | 'Neutre' {
  const normalized = (solar ?? '').trim()
  if (normalized && SOLAR_SIGN_CLOSURES[normalized as SolarSign]) {
    return normalized as SolarSign
  }
  const fromDate = getSolarSignFromDate(birthDate)
  if (fromDate) return fromDate
  return 'Neutre'
}

export function enrichReadingResponse(input: EnrichInput): HexastraApiResponse {
  const { response, plan, birthDate, solarSign, contextType, domainRoute, selectedMenuKey, selectedSubmenuKey, explicitGuidance } = input
  if (!shouldEnrich(response)) return response
  if (explicitGuidance || selectedMenuKey || selectedSubmenuKey) return response

  const sign = pickSign(birthDate, solarSign)
  const closure = SOLAR_SIGN_CLOSURES[sign]

  const suggestions = generateContextualSuggestions({
    plan,
    contextType,
    domainRoute,
    selectedMenuKey,
    selectedSubmenuKey,
    lastUserMessage: response?.metadata?.lastUserMessage ?? undefined,
  })
  const text = response.reply || response.message || ''

  const alreadyHasClosure = text.includes(closure.slice(0, 22))
  const suggestionBlock = suggestions.length
    ? `\n────────────────────\nPour aller plus loin, tu peux :\n- ${suggestions.join('\n- ')}`
    : ''

  const enrichedText = alreadyHasClosure
    ? text
    : `${text}\n────────────────────\n${closure}${suggestionBlock}`

  return {
    ...response,
    reply: enrichedText,
    message: enrichedText,
  }
}
