/**
 * fusionEngine — Orchestrateur KS.FUSION.V13
 *
 * Expose l'API du spec KS.FUSION.V13 :
 *   mergeSignals        → pondère et trie les signaux par couche
 *   computeDominants    → extrait le signal/phase/zone dominants
 *   resolveContradictions → détecte les tensions inter-signaux
 *   buildFusionSummary  → produit la synthèse finale (source de vérité arbiter)
 *
 * Pondérations par couche (spec) :
 *   cosmos   = 0.25
 *   human    = 0.25
 *   symbolic = 0.15
 *   nature   = 0.10
 *   strategic = 0.25
 *
 * score = intensity × confidence × weight
 */

// ── Types publics ─────────────────────────────────────────────────────────────

export type KsSourceLayer = 'cosmos' | 'human' | 'symbolic' | 'nature' | 'strategic'

export type KsPhaseHint = 'activation' | 'stabilisation' | 'transition'

export type KsZoneHint =
  | 'security'
  | 'relation'
  | 'identity'
  | 'direction'
  | 'expansion'
  | 'meaning'

export type KsAnswerStrategy = 'action' | 'prudence' | 'observation' | 'stabilisation'

/** Format inter-modules — signal unifié pour le pipeline KS.FUSION.V13 */
export type KsSignal = {
  module: string
  sourceLayer?: KsSourceLayer
  signals: Array<{
    tag: string
    description?: string
    intensity: number
    confidence: number
  }>
  phaseHint?: KsPhaseHint | null
  zoneHint?: KsZoneHint | null
  riskFlag?: boolean
  opportunityFlag?: boolean
  notes?: string
}

export type FusionSummary = {
  dominantSignal: string
  dominantModule: string | null
  dominantPhase: KsPhaseHint | null
  dominantZone: KsZoneHint | null
  answerStrategy: KsAnswerStrategy
  contradictions: string[]
  confidenceScore: number
  sentinelStatus: 'validated' | 'degraded'
}

// ── Pondérations par couche ───────────────────────────────────────────────────

const LAYER_WEIGHTS: Record<KsSourceLayer, number> = {
  cosmos:   0.25,
  human:    0.25,
  symbolic: 0.15,
  nature:   0.10,
  strategic: 0.25,
}

// ── Helpers privés ────────────────────────────────────────────────────────────

function computeSignalScore(signal: KsSignal): number {
  if (signal.signals.length === 0) return 0
  const weight = LAYER_WEIGHTS[signal.sourceLayer ?? 'strategic']
  const avgIntensity = signal.signals.reduce((s, e) => s + e.intensity, 0) / signal.signals.length
  const avgConfidence = signal.signals.reduce((s, e) => s + e.confidence, 0) / signal.signals.length
  return avgIntensity * avgConfidence * weight
}

function dominant<T extends string>(votes: T[]): T | null {
  if (votes.length === 0) return null
  const counts = votes.reduce<Record<string, number>>((acc, v) => {
    acc[v] = (acc[v] ?? 0) + 1
    return acc
  }, {})
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]![0] as T
}

// ── API publique ──────────────────────────────────────────────────────────────

/**
 * Pondère et trie les signaux par score décroissant (intensity × confidence × layer_weight).
 */
export function mergeSignals(signals: KsSignal[]): KsSignal[] {
  return [...signals].sort((a, b) => computeSignalScore(b) - computeSignalScore(a))
}

/**
 * Extrait le signal dominant, la phase et la zone depuis le tableau de signaux pondérés.
 */
export function computeDominants(signals: KsSignal[]): {
  dominantSignal: string
  dominantModule: string | null
  dominantPhase: KsPhaseHint | null
  dominantZone: KsZoneHint | null
} {
  const sorted = mergeSignals(signals)
  const top = sorted[0]

  const phases = signals.map(s => s.phaseHint).filter((p): p is KsPhaseHint => Boolean(p))
  const zones = signals.map(s => s.zoneHint).filter((z): z is KsZoneHint => Boolean(z))

  return {
    dominantSignal: top?.signals[0]?.tag ?? 'signal_general',
    dominantModule: top?.module ?? null,
    dominantPhase: dominant(phases),
    dominantZone: dominant(zones),
  }
}

/**
 * Détecte les contradictions inter-signaux :
 *   risque + opportunité       → risk_vs_opportunity
 *   activation + stabilisation → activation_vs_stabilisation
 *   expansion + sécurité       → expansion_vs_security
 */
export function resolveContradictions(signals: KsSignal[]): string[] {
  const contradictions: string[] = []
  const hasRisk = signals.some(s => s.riskFlag)
  const hasOpportunity = signals.some(s => s.opportunityFlag)
  const hasActivation = signals.some(s => s.phaseHint === 'activation')
  const hasStabilisation = signals.some(s => s.phaseHint === 'stabilisation')
  const hasExpansion = signals.some(s => s.zoneHint === 'expansion')
  const hasSecurity = signals.some(s => s.zoneHint === 'security')

  if (hasRisk && hasOpportunity) contradictions.push('risk_vs_opportunity')
  if (hasActivation && hasStabilisation) contradictions.push('activation_vs_stabilisation')
  if (hasExpansion && hasSecurity) contradictions.push('expansion_vs_security')

  return contradictions
}

/**
 * Construit la synthèse de fusion complète.
 *
 * Arbitrage des contradictions :
 *   risque > opportunité  → prudence
 *   opportunité > risque  → action
 *   équilibre             → observation
 *   stabilisation seule   → stabilisation
 */
export function buildFusionSummary(signals: KsSignal[]): FusionSummary {
  if (signals.length === 0) {
    return {
      dominantSignal: 'signal_general',
      dominantModule: null,
      dominantPhase: null,
      dominantZone: null,
      answerStrategy: 'observation',
      contradictions: [],
      confidenceScore: 0.5,
      sentinelStatus: 'validated',
    }
  }

  const dominants = computeDominants(signals)
  const contradictions = resolveContradictions(signals)
  const hasRisk = signals.some(s => s.riskFlag)
  const hasOpportunity = signals.some(s => s.opportunityFlag)

  let answerStrategy: KsAnswerStrategy
  if (contradictions.includes('risk_vs_opportunity')) {
    answerStrategy = 'observation'
  } else if (hasRisk && !hasOpportunity) {
    answerStrategy = 'prudence'
  } else if (hasOpportunity && !hasRisk) {
    answerStrategy = 'action'
  } else if (dominants.dominantPhase === 'stabilisation') {
    answerStrategy = 'stabilisation'
  } else {
    answerStrategy = 'observation'
  }

  const totalScore = signals.reduce((sum, s) => sum + computeSignalScore(s), 0)
  const confidenceScore = Number(Math.min(1, totalScore / signals.length).toFixed(2))

  return {
    dominantSignal: dominants.dominantSignal,
    dominantModule: dominants.dominantModule,
    dominantPhase: dominants.dominantPhase,
    dominantZone: dominants.dominantZone,
    answerStrategy,
    contradictions,
    confidenceScore,
    sentinelStatus: contradictions.length > 2 ? 'degraded' : 'validated',
  }
}
