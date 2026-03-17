import { randomUUID } from 'crypto'
import type { DomainRoute } from '@/lib/hexastra/types'
import type {
  KSPhaseHint,
  KSSignalEnvelope,
  KSSignalEntry,
  KSSourceLayer,
  KSZoneHint,
} from './ksEnvelopeSchema'
import {
  normalizeEnvelopeNumber,
  normalizeSignalEntry,
  normalizeSignalTag,
} from './ksEnvelopeSchema'

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
  envelope: KSSignalEnvelope
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
  }
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  return []
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

function inferSourceLayer(module: string, domainRoute: DomainRoute): KSSourceLayer {
  const normalizedModule = module.toLowerCase()

  if (normalizedModule.includes('astro') || normalizedModule.includes('planet') || domainRoute === 'timing') {
    return 'cosmos'
  }
  if (
    normalizedModule.includes('neuro') ||
    normalizedModule.includes('soma') ||
    normalizedModule.includes('state') ||
    normalizedModule.includes('innerstate') ||
    domainRoute === 'wellbeing' ||
    domainRoute === 'neurokua'
  ) {
    return 'human'
  }
  if (normalizedModule.includes('spirit') || normalizedModule.includes('totem') || normalizedModule.includes('symbol')) {
    return 'symbolic'
  }
  if (normalizedModule.includes('plant') || normalizedModule.includes('nature')) {
    return 'nature'
  }
  return 'strategic'
}

function inferPhaseHint(value: unknown): KSPhaseHint | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().toLowerCase()
  if (normalized.includes('activation')) return 'activation'
  if (normalized.includes('stabil')) return 'stabilisation'
  if (normalized.includes('transition')) return 'transition'
  return undefined
}

function inferZoneHint(value: unknown): KSZoneHint | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().toLowerCase()
  if (normalized.includes('secur')) return 'security'
  if (normalized.includes('relation')) return 'relation'
  if (normalized.includes('ident')) return 'identity'
  if (normalized.includes('direction')) return 'direction'
  if (normalized.includes('expansion')) return 'expansion'
  if (normalized.includes('meaning') || normalized.includes('sens')) return 'meaning'
  return undefined
}

function inferContradictions(params: {
  signalEntries: KSSignalEntry[]
  phase?: KSPhaseHint
  zone?: KSZoneHint
  risk: boolean
  opportunity: boolean
}) {
  const contradictions: string[] = []
  const joined = params.signalEntries
    .map((signal) => `${signal.tag} ${signal.description}`)
    .join(' ')
    .toLowerCase()

  if (params.risk && params.opportunity) contradictions.push('risk_vs_opportunity')
  if (joined.includes('agir') && joined.includes('repos')) contradictions.push('action_vs_recovery')
  if (joined.includes('expansion') && joined.includes('stabilisation')) contradictions.push('expansion_vs_stability')
  if (params.phase === 'transition' && params.zone === 'security') {
    contradictions.push('transition_vs_security')
  }

  return contradictions
}

function extractSignalEntries(
  result: Record<string, unknown>,
  fallbackSignal: string
): KSSignalEntry[] {
  const rawEntries = Array.isArray(result.signals) ? result.signals : []

  const structuredEntries = rawEntries
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const item = entry as Record<string, unknown>
      return normalizeSignalEntry(
        {
          tag: typeof item.tag === 'string' ? item.tag : typeof item.name === 'string' ? item.name : fallbackSignal,
          description:
            typeof item.description === 'string'
              ? item.description
              : typeof item.notes === 'string'
                ? item.notes
                : undefined,
          intensity: typeof item.intensity === 'number' ? item.intensity : undefined,
          confidence: typeof item.confidence === 'number' ? item.confidence : undefined,
        },
        fallbackSignal
      )
    })
    .filter((entry): entry is KSSignalEntry => Boolean(entry))

  if (structuredEntries.length) return structuredEntries.slice(0, 8)

  const plainSignals = [
    ...toStringArray(result.signal),
    ...toStringArray(result.publicSummary),
    ...toStringArray(result.dominantSignals),
    ...toStringArray(result.dominants),
  ]

  if (plainSignals.length) {
    return plainSignals.slice(0, 8).map((signal) =>
      normalizeSignalEntry(
        {
          tag: signal,
          description: signal,
        },
        fallbackSignal
      )
    )
  }

  return [normalizeSignalEntry({ tag: fallbackSignal }, fallbackSignal)]
}

export function buildSignalEnvelope(input: {
  module: string
  result: Record<string, unknown> | null | undefined
  domainRoute: DomainRoute
}): KSSignal {
  const result = input.result ?? {}
  const fallbackSignal = inferDefaultSignal(input.module, input.domainRoute)
  const signalEntries = extractSignalEntries(result, fallbackSignal)
  const phaseHint = inferPhaseHint(result.phase_hint ?? result.phase)
  const zoneHint = inferZoneHint(result.zone_hint ?? result.zone)
  const riskFlag = Boolean(result.risk_flag)
  const opportunityFlag = Boolean(result.opportunity_flag)
  const contradictions = toStringArray(result.contradictions).length
    ? toStringArray(result.contradictions).map((item) => normalizeSignalTag(item)).slice(0, 4)
    : inferContradictions({
        signalEntries,
        phase: phaseHint,
        zone: zoneHint,
        risk: riskFlag,
        opportunity: opportunityFlag,
      })
  const dominantSignals = toStringArray(result.dominantSignals ?? result.dominants).length
    ? toStringArray(result.dominantSignals ?? result.dominants)
        .map((item) => normalizeSignalTag(item))
        .slice(0, 3)
    : signalEntries.map((signal) => signal.tag).slice(0, 3)
  const intensity = normalizeEnvelopeNumber(
    result.intensity,
    signalEntries.reduce((sum, signal) => sum + signal.intensity, 0) / signalEntries.length
  )
  const confidence = normalizeEnvelopeNumber(
    result.confidence,
    signalEntries.reduce((sum, signal) => sum + signal.confidence, 0) / signalEntries.length
  )
  const fusionScore = Number((intensity * confidence).toFixed(3))
  const family = inferFamily(input.module, input.domainRoute)
  const envelope: KSSignalEnvelope = {
    id: typeof result.id === 'string' && result.id.trim() ? result.id : randomUUID(),
    timestamp:
      typeof result.timestamp === 'string' && result.timestamp.trim()
        ? result.timestamp
        : new Date().toISOString(),
    module: input.module,
    module_version:
      typeof result.module_version === 'string' && result.module_version.trim()
        ? result.module_version
        : 'v1',
    source_layer: inferSourceLayer(input.module, input.domainRoute),
    signals: signalEntries,
    phase_hint: phaseHint,
    zone_hint: zoneHint,
    risk_flag: riskFlag,
    opportunity_flag: opportunityFlag,
    notes:
      typeof result.notes === 'string' && result.notes.trim()
        ? result.notes.trim()
        : typeof result.publicSummary === 'string' && result.publicSummary.trim()
          ? result.publicSummary.trim()
          : `Synthese ${family} issue de ${input.module}`,
    family,
    dominant_signals: dominantSignals,
    contradictions,
    fusion_score: fusionScore,
    sentinel_status: contradictions.length > 2 ? 'degraded' : 'validated',
    public_summary:
      typeof result.publicSummary === 'string' && result.publicSummary.trim()
        ? result.publicSummary.trim()
        : undefined,
  }

  return {
    module: envelope.module,
    family: envelope.family,
    signals: envelope.signals.map((signal) => signal.tag),
    dominantSignals: envelope.dominant_signals,
    contradictions: envelope.contradictions,
    intensity,
    confidence,
    fusionScore,
    phase_hint: envelope.phase_hint,
    zone_hint: envelope.zone_hint,
    risk_flag: envelope.risk_flag,
    opportunity_flag: envelope.opportunity_flag,
    sentinel_status: envelope.sentinel_status,
    publicSummary: envelope.public_summary,
    envelope,
  }
}
