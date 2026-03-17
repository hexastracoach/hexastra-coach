export type KSSourceLayer = 'cosmos' | 'human' | 'symbolic' | 'nature' | 'strategic'

export type KSPhaseHint = 'activation' | 'stabilisation' | 'transition'

export type KSZoneHint =
  | 'security'
  | 'relation'
  | 'identity'
  | 'direction'
  | 'expansion'
  | 'meaning'

export type KSSentinelStatus = 'validated' | 'degraded'

export type KSSignalEntry = {
  tag: string
  description: string
  intensity: number
  confidence: number
}

export type KSSignalEnvelope = {
  id: string
  timestamp: string
  module: string
  module_version: string
  source_layer: KSSourceLayer
  signals: KSSignalEntry[]
  phase_hint?: KSPhaseHint
  zone_hint?: KSZoneHint
  risk_flag: boolean
  opportunity_flag: boolean
  notes: string
  family: string
  dominant_signals: string[]
  contradictions: string[]
  fusion_score: number
  sentinel_status: KSSentinelStatus
  public_summary?: string
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value))
}

export function normalizeEnvelopeNumber(value: unknown, fallback: number) {
  return clamp(typeof value === 'number' && Number.isFinite(value) ? value : fallback)
}

export function normalizeSignalTag(value: string, fallback = 'signal_general') {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '_')
  return normalized || fallback
}

export function normalizeSignalEntry(input: Partial<KSSignalEntry> & { tag?: string }, fallbackTag: string): KSSignalEntry {
  return {
    tag: normalizeSignalTag(input.tag ?? fallbackTag, fallbackTag),
    description: typeof input.description === 'string' && input.description.trim()
      ? input.description.trim()
      : `Signal ${normalizeSignalTag(input.tag ?? fallbackTag, fallbackTag)}`,
    intensity: normalizeEnvelopeNumber(input.intensity, 0.72),
    confidence: normalizeEnvelopeNumber(input.confidence, 0.68),
  }
}
