import type { KSSignal } from './signalEnvelope'

function round(value: number) {
  return Number(value.toFixed(2))
}

export function fusionEngine(signals: KSSignal[]) {
  const ordered = [...signals].sort((a, b) => b.fusionScore - a.fusionScore)
  const dominant = ordered[0]

  const groupedByFamily = ordered.reduce<Record<string, KSSignal[]>>((acc, signal) => {
    const family = signal.family || 'fusion'
    if (!acc[family]) acc[family] = []
    acc[family].push(signal)
    return acc
  }, {})

  const familyScores = Object.fromEntries(
    Object.entries(groupedByFamily).map(([family, familySignals]) => [
      family,
      round(familySignals.reduce((sum, signal) => sum + signal.fusionScore, 0)),
    ])
  )

  const topSignals = ordered.flatMap((signal) => signal.dominantSignals).filter(Boolean).slice(0, 5)
  const contradictions = Array.from(new Set(ordered.flatMap((signal) => signal.contradictions))).slice(0, 5)
  const validatedSignals = ordered.filter((signal) => signal.sentinel_status !== 'degraded')
  const degradedSignals = ordered.filter((signal) => signal.sentinel_status === 'degraded')
  const averageConfidence =
    ordered.length > 0
      ? round(ordered.reduce((sum, signal) => sum + signal.confidence, 0) / ordered.length)
      : 0
  const averageIntensity =
    ordered.length > 0
      ? round(ordered.reduce((sum, signal) => sum + signal.intensity, 0) / ordered.length)
      : 0
  const dominantFamilies = Object.entries(familyScores)
    .sort((a, b) => b[1] - a[1])
    .map(([family]) => family)
    .slice(0, 3)

  const narrativeParts = [
    dominant?.module ? `module dominant: ${dominant.module}` : null,
    dominant?.family ? `famille dominante: ${dominant.family}` : null,
    dominant?.dominantSignals?.[0] ? `signal principal: ${dominant.dominantSignals[0]}` : null,
    dominant?.phase_hint ? `phase: ${dominant.phase_hint}` : null,
    dominant?.zone_hint ? `zone: ${dominant.zone_hint}` : null,
    contradictions.length ? `contradictions: ${contradictions.join(', ')}` : null,
  ].filter(Boolean)

  return {
    dominantSignal: dominant?.dominantSignals?.[0] ?? dominant?.signals?.[0] ?? 'signal_general',
    phase: dominant?.phase_hint ?? null,
    zone: dominant?.zone_hint ?? null,
    risk_flag: ordered.some((signal) => signal.risk_flag),
    opportunity_flag: ordered.some((signal) => signal.opportunity_flag),
    modules: ordered.map((signal) => signal.module),
    primaryModule: dominant?.module ?? null,
    primaryFamily: dominant?.family ?? null,
    dominantFamilies,
    familyScores,
    topSignals,
    contradictions,
    validatedCount: validatedSignals.length,
    degradedCount: degradedSignals.length,
    confidenceScore: averageConfidence,
    intensityScore: averageIntensity,
    sentinelStatus: degradedSignals.length > validatedSignals.length ? 'degraded' : 'validated',
    narrativeBrief: narrativeParts.join(' | ') || 'lecture generale structuree',
  }
}
