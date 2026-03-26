/**
 * detectDominantZone — Hexastra Coach
 *
 * Identifie la zone de vie dominante impactée par la question de l'utilisateur.
 *
 * Zones détectables :
 *   - relationnel  : liens, amour, communication, famille
 *   - décisionnel  : choix, stratégie, passage à l'action
 *   - émotionnel   : état intérieur, ressenti, humeur, bien-être
 *   - identitaire  : qui je suis, mission, sens, identité profonde
 *   - cyclique     : timing, moment du cycle, synchronicité temporelle
 *
 * Sources :
 * - Intent classifié (prime fort sur la zone)
 * - Zone hints des signaux normalisés (agrégés par confiance × intensité)
 * - Module dominant (biais de zone propre à chaque science)
 */

import type { FusionContext } from './buildFusionContext'
import type { NormalizedSignal, ZoneHint } from './normalizeSignals'

export type { ZoneHint }

// ── Types ──────────────────────────────────────────────────────────────────────

export type DominantZone = {
  /** Zone principale identifiée */
  zone: ZoneHint
  /** Force de la zone dominante (0–1, part du score total) */
  zoneScore: number
  /** Zones secondaires actives, triées par score */
  subZones: ZoneHint[]
  /** Raisonnement traçable pour les logs */
  zoneReasoning: string
}

// ── Mapping intent → zone prime ────────────────────────────────────────────────

const INTENT_ZONE_PRIME: Record<string, ZoneHint> = {
  relationship: 'relationnel',
  decision: 'décisionnel',
  inner_state: 'émotionnel',
  fusion_general_question: 'identitaire',
  exact_profile: 'identitaire',
}

// Biais de zone selon le module dominant (renforce sans écraser)
const MODULE_ZONE_BIAS: Partial<Record<string, ZoneHint>> = {
  astrology: 'émotionnel',
  human_design: 'identitaire',
  numerology: 'cyclique',
  enneagram: 'identitaire',
  kua: 'décisionnel',
}

// ── Détection ──────────────────────────────────────────────────────────────────

/**
 * Détecte la zone de vie dominante à partir de l'intent, des signaux normalisés
 * et du module dominant.
 *
 * @param ctx     Contexte de fusion construit par buildFusionContext
 * @param signals Signaux normalisés produits par normalizeSignals
 */
export function detectDominantZone(
  ctx: FusionContext,
  signals: NormalizedSignal[],
): DominantZone {
  const ALL_ZONES: ZoneHint[] = ['émotionnel', 'décisionnel', 'relationnel', 'identitaire', 'cyclique']
  const tally: Record<ZoneHint, number> = {
    émotionnel: 0,
    décisionnel: 0,
    relationnel: 0,
    identitaire: 0,
    cyclique: 0,
  }
  const reasons: string[] = []

  // 1. Intent prime — fort prior (poids 2.0 fixe)
  const intentPrime = INTENT_ZONE_PRIME[ctx.intent]
  if (intentPrime) {
    tally[intentPrime] += 2.0
    reasons.push(`intent ${ctx.intent} → ${intentPrime}`)
  }

  // 2. Signaux normalisés — zone_hint pondéré par confidence × intensity
  for (const signal of signals) {
    const w = signal.confidence * signal.intensity
    tally[signal.zone_hint] += w
  }

  // 3. Module dominant — biais additionnel (poids 0.5 × poids effectif du module)
  const domMod = ctx.dominantModule
  const modZone = MODULE_ZONE_BIAS[domMod]
  if (modZone) {
    const domWeight = (ctx.modules as Record<string, { weight: number }>)[domMod]?.weight ?? 0
    tally[modZone] += domWeight * 0.5
    reasons.push(`module dominant ${domMod} → ${modZone}`)
  }

  // 4. Tri et sélection
  const sorted = ALL_ZONES.map((z) => [z, tally[z]] as [ZoneHint, number]).sort(
    ([, a], [, b]) => b - a,
  )
  const total = sorted.reduce((s, [, v]) => s + v, 0)
  const [topZone, topScore] = sorted[0]
  const zoneScore = total > 0 ? Math.round(Math.min(1, topScore / total) * 100) / 100 : 0
  const subZones = sorted
    .slice(1)
    .filter(([, v]) => v > 0)
    .map(([z]) => z)

  return {
    zone: topZone,
    zoneScore,
    subZones,
    zoneReasoning: reasons.join(' | '),
  }
}
