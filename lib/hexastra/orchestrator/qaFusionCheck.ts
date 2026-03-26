/**
 * qaFusionCheck — Hexastra Coach
 *
 * Vérifie la cohérence globale du contexte de fusion AVANT la génération.
 *
 * Contrôles effectués :
 * 1. data_completeness   — proportion des champs attendus effectivement trouvés
 * 2. module_coverage     — nombre de modules actifs (min 2 pour multi-sciences)
 * 3. fusion_confidence   — score de confiance calculé dans buildFusionContext
 * 4. signal_consistency  — cohérence directionnelle des signaux (expansif vs contractif)
 * 5. arbitration_quality — arbitrage complet (dynamique + mécanisme + action + supports)
 * 6. phase_coherence     — phase détectée avec confiance suffisante
 * 7. zone_coherence      — zone dominante nettement identifiée
 *
 * Produit un coherenceScore global (0–1) et distingue warnings (soft) et blockers (hard).
 */

import type { FusionContext, FusionArbitration } from './buildFusionContext'
import type { NormalizedSignal } from './normalizeSignals'
import type { FusionPhase } from './detectFusionPhase'
import type { DominantZone } from './detectDominantZone'

// ── Types ──────────────────────────────────────────────────────────────────────

export type QACheckItem = {
  name: string
  /** Le check a-t-il passé son seuil minimal ? */
  passed: boolean
  /** Score normalisé (0–1) */
  score: number
  /** Détail lisible pour les logs */
  detail: string
}

export type QAResult = {
  /** Score de cohérence global (0–1) */
  coherenceScore: number
  /** Vrai si coherenceScore >= 0.55 et aucun blocker */
  passed: boolean
  /** Détail de chaque vérification */
  checks: QACheckItem[]
  /** Problèmes non-bloquants — la lecture peut continuer mais doit être nuancée */
  warnings: string[]
  /** Problèmes critiques — compromettent la fiabilité multi-sciences */
  blockers: string[]
}

// ── Seuil de passage global ───────────────────────────────────────────────────

const PASS_THRESHOLD = 0.55

// Poids de chaque check dans le score global
const CHECK_WEIGHTS: Record<string, number> = {
  data_completeness: 0.20,
  module_coverage: 0.20,
  fusion_confidence: 0.20,
  signal_consistency: 0.15,
  arbitration_quality: 0.15,
  phase_coherence: 0.05,
  zone_coherence: 0.05,
}

// ── Vérifications ─────────────────────────────────────────────────────────────

/**
 * Vérifie la cohérence globale de la lecture avant génération.
 *
 * @param ctx         Contexte de fusion
 * @param signals     Signaux normalisés
 * @param arbitration Résultat d'arbitrage
 * @param phase       Phase détectée
 * @param zone        Zone dominante détectée
 */
export function qaFusionCheck(
  ctx: FusionContext,
  signals: NormalizedSignal[],
  arbitration: FusionArbitration,
  phase: FusionPhase,
  zone: DominantZone,
): QAResult {
  const checks: QACheckItem[] = []
  const warnings: string[] = []
  const blockers: string[] = []

  // ── 1. Data completeness ──────────────────────────────────────────────────
  const completenessScore = Math.min(1, ctx.completeness * 1.4)
  checks.push({
    name: 'data_completeness',
    passed: ctx.completeness >= 0.45,
    score: completenessScore,
    detail: `${Math.round(ctx.completeness * 100)}% des champs attendus trouvés`,
  })
  if (ctx.completeness < 0.45) {
    warnings.push(
      `Données partielles (${Math.round(ctx.completeness * 100)}%) — lecture moins précise`,
    )
  }

  // ── 2. Module coverage ────────────────────────────────────────────────────
  const activeCount = ctx.modulesActivated.length
  const coverageScore = Math.min(1, activeCount / 3)
  checks.push({
    name: 'module_coverage',
    passed: activeCount >= 2,
    score: coverageScore,
    detail: `${activeCount} module(s) actif(s): ${ctx.modulesActivated.join(', ')}`,
  })
  if (activeCount < 2) {
    blockers.push(
      `Couverture insuffisante: seulement ${activeCount} module actif — lecture multi-sciences compromise`,
    )
  }

  // ── 3. Fusion confidence ──────────────────────────────────────────────────
  checks.push({
    name: 'fusion_confidence',
    passed: ctx.fusionConfidence >= 0.4,
    score: ctx.fusionConfidence,
    detail: `Confiance de fusion: ${Math.round(ctx.fusionConfidence * 100)}%`,
  })
  if (ctx.fusionConfidence < 0.4) {
    warnings.push(
      `Confiance faible (${Math.round(ctx.fusionConfidence * 100)}%) — résultats à nuancer`,
    )
  }

  // ── 4. Signal consistency ─────────────────────────────────────────────────
  const dirCounts = { expansif: 0, contractif: 0, neutre: 0 }
  for (const s of signals) dirCounts[s.direction]++
  const total = signals.length
  const maxDir = Math.max(dirCounts.expansif, dirCounts.contractif, dirCounts.neutre)
  const consistencyScore = total > 0 ? Math.min(1, (maxDir / total) * 1.2) : 0.5
  const isTensionBalanced =
    dirCounts.expansif > 0 &&
    dirCounts.contractif > 0 &&
    Math.abs(dirCounts.expansif - dirCounts.contractif) <= 1
  checks.push({
    name: 'signal_consistency',
    passed: consistencyScore >= 0.4,
    score: consistencyScore,
    detail: `${dirCounts.expansif} expansif / ${dirCounts.contractif} contractif / ${dirCounts.neutre} neutre`,
  })
  if (isTensionBalanced) {
    warnings.push('Tension directionnelle: signaux expansifs et contractifs en équilibre — profil en friction active')
  }

  // ── 5. Arbitration quality ────────────────────────────────────────────────
  const arbScore =
    (arbitration.dominantDynamic ? 0.35 : 0) +
    (arbitration.mainBlock ? 0.30 : 0) +
    (arbitration.priorityAction ? 0.20 : 0) +
    (arbitration.supportPoints.length > 0 ? 0.15 : 0)
  checks.push({
    name: 'arbitration_quality',
    passed: arbScore >= 0.65,
    score: arbScore,
    detail: `dynamique=${!!arbitration.dominantDynamic} | mécanisme=${!!arbitration.mainBlock} | action=${!!arbitration.priorityAction} | supports=${arbitration.supportPoints.length}`,
  })
  if (arbScore < 0.65) {
    warnings.push('Arbitrage partiel — certains champs de lecture sont incomplets')
  }

  // ── 6. Phase coherence ────────────────────────────────────────────────────
  const phaseSigs = signals.filter((s) => s.phase_hint !== null)
  const phaseMatch = phaseSigs.filter((s) => s.phase_hint === phase.phase).length
  checks.push({
    name: 'phase_coherence',
    passed: phase.phaseConfidence >= 0.4,
    score: phase.phaseConfidence,
    detail: `phase ${phase.phase} (confiance ${Math.round(phase.phaseConfidence * 100)}%) — ${phaseMatch}/${phaseSigs.length} signaux alignés`,
  })
  if (phase.phaseConfidence < 0.4) {
    warnings.push(
      `Phase incertaine (${Math.round(phase.phaseConfidence * 100)}%) — plusieurs cycles en tension`,
    )
  }

  // ── 7. Zone coherence ─────────────────────────────────────────────────────
  checks.push({
    name: 'zone_coherence',
    passed: zone.zoneScore >= 0.3,
    score: zone.zoneScore,
    detail: `zone ${zone.zone} (${Math.round(zone.zoneScore * 100)}%)${zone.subZones.length > 0 ? ` — secondaires: ${zone.subZones.join(', ')}` : ''}`,
  })
  if (zone.zoneScore < 0.3) {
    warnings.push('Zone diffuse — la question touche plusieurs zones de vie simultanément')
  }

  // ── Score global ──────────────────────────────────────────────────────────
  let weightedSum = 0
  let weightSum = 0
  for (const check of checks) {
    const w = CHECK_WEIGHTS[check.name] ?? 0.1
    weightedSum += check.score * w
    weightSum += w
  }

  const coherenceScore =
    weightSum > 0 ? Math.round((weightedSum / weightSum) * 100) / 100 : 0
  const passed = coherenceScore >= PASS_THRESHOLD && blockers.length === 0

  if (!passed && blockers.length === 0 && coherenceScore < PASS_THRESHOLD) {
    warnings.push(
      `Score de cohérence sous le seuil (${Math.round(coherenceScore * 100)}% < ${Math.round(PASS_THRESHOLD * 100)}%) — vérifier la qualité des données`,
    )
  }

  return { coherenceScore, passed, checks, warnings, blockers }
}
