export function arbiter(result: {
  risk_flag?: boolean
  opportunity_flag?: boolean
  dominantSignal?: string | null
  contradictions?: string[]
  sentinelStatus?: 'validated' | 'degraded'
  primaryFamily?: string | null
}) {
  if (result.sentinelStatus === 'degraded') return 'sentinel_guarded'
  if ((result.contradictions?.length ?? 0) >= 2) return 'contradiction_resolution'
  if (result.risk_flag && result.opportunity_flag) return 'balanced_priority'
  if (result.risk_flag) return 'risk'
  if (result.opportunity_flag) return 'opportunity'
  if (result.primaryFamily) return `family_${result.primaryFamily}`
  if (result.dominantSignal) return 'dominant_signal'
  return 'neutral'
}
