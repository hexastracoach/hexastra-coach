import type { DomainRoute } from '@/lib/hexastra/types'

export interface KSSignal {
  module: string
  family: string
  signals: string[]
  dominantSignals: string[]
  contradictions: string[]
  intensity: number
  confidence: number
  fusionScore: number
  phase_hint?: string
  zone_hint?: string
  risk_flag?: boolean
  opportunity_flag?: boolean
  sentinel_status?: 'validated' | 'degraded'
  publicSummary?: string
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string')
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  return []
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value))
}

function inferDefaultSignal(module: string, domainRoute: DomainRoute): string {
  if (module.includes('GPS') || domainRoute === 'gps_kua') return 'orientation'
  if (module.includes('NeuroKua') || domainRoute === 'neurokua') return 'equilibre'
  if (domainRoute === 'career') return 'positionnement'
  if (domainRoute === 'relationship') return 'dynamique_relationnelle'
  if (domainRoute === 'decision') return 'levier_decision'
  if (domainRoute === 'timing') return 'timing'
  return 'signal_general'
}

function inferFamily(module: string, domainRoute: DomainRoute) {
  const normalizedModule = module.toLowerCase()

  if (normalizedModule.includes('neuro') || domainRoute === 'neurokua') return 'regulation'
  if (normalizedModule.includes('gps') || domainRoute === 'gps_kua') return 'orientation'
  if (normalizedModule.includes('astro') || domainRoute === 'timing') return 'timing'
  if (normalizedModule.includes('porteum') || normalizedModule.includes('incarnatio')) return 'incarnation'
  if (normalizedModule.includes('spirit') || normalizedModule.includes('totem')) return 'archetypal'
  if (normalizedModule.includes('triangle') || normalizedModule.includes('numeris')) return 'cycle'
  if (domainRoute === 'relationship') return 'relationship'
  if (domainRoute === 'career') return 'career'
  if (domainRoute === 'decision') return 'decision'
  if (domainRoute === 'wellbeing') return 'wellbeing'
  return 'fusion'
}

function inferContradictions(params: {
  signals: string[]
  phase?: string
  zone?: string
  risk: boolean
  opportunity: boolean
}) {
  const contradictions: string[] = []
  const joined = params.signals.join(' ').toLowerCase()

  if (params.risk && params.opportunity) contradictions.push('risk_vs_opportunity')
  if (joined.includes('agir') && joined.includes('repos')) contradictions.push('action_vs_recovery')
  if (joined.includes('expansion') && joined.includes('stabilisation')) contradictions.push('expansion_vs_stability')
  if (params.phase && params.zone && params.phase.toLowerCase().includes('transition') && params.zone.toLowerCase().includes('stabil')) {
    contradictions.push('transition_vs_stability')
  }

  return contradictions
}

export function buildSignalEnvelope(input: {
  module: string
  result: Record<string, unknown> | null | undefined
  domainRoute: DomainRoute
}): KSSignal {
  const result = input.result ?? {}
  const rawSignals = toStringArray(result.signals ?? result.signal ?? result.publicSummary).slice(0, 8)
  const signals = rawSignals.length ? rawSignals : [inferDefaultSignal(input.module, input.domainRoute)]
  const dominantSignals = toStringArray(result.dominantSignals ?? result.dominants ?? signals).slice(0, 3)
  const intensity = clamp(typeof result.intensity === 'number' ? result.intensity : 0.72)
  const confidence = clamp(typeof result.confidence === 'number' ? result.confidence : 0.68)
  const phaseHint =
    typeof result.phase_hint === 'string'
      ? result.phase_hint
      : typeof result.phase === 'string'
        ? result.phase
        : undefined
  const zoneHint =
    typeof result.zone_hint === 'string'
      ? result.zone_hint
      : typeof result.zone === 'string'
        ? result.zone
        : undefined
  const riskFlag = Boolean(result.risk_flag)
  const opportunityFlag = Boolean(result.opportunity_flag)
  const contradictions = toStringArray(result.contradictions).length
    ? toStringArray(result.contradictions).slice(0, 4)
    : inferContradictions({
        signals,
        phase: phaseHint,
        zone: zoneHint,
        risk: riskFlag,
        opportunity: opportunityFlag,
      })
  const fusionScore = Number((intensity * confidence).toFixed(3))

  return {
    module: input.module,
    family: inferFamily(input.module, input.domainRoute),
    signals,
    dominantSignals: dominantSignals.length ? dominantSignals : signals.slice(0, 2),
    contradictions,
    intensity,
    confidence,
    fusionScore,
    phase_hint: phaseHint,
    zone_hint: zoneHint,
    risk_flag: riskFlag,
    opportunity_flag: opportunityFlag,
    sentinel_status: contradictions.length > 2 ? 'degraded' : 'validated',
    publicSummary: typeof result.publicSummary === 'string' ? result.publicSummary : undefined,
  }
}
