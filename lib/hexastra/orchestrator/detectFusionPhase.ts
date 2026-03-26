/**
 * detectFusionPhase — Hexastra Coach
 *
 * Détecte la phase dominante de lecture :
 *   - activation    : période d'élan, nouveau cycle, énergie montante
 *   - stabilisation : période d'ancrage, consolidation, travail en profondeur
 *   - transition    : période de lâcher-prise, passage, clôture de cycle
 *
 * Basé sur :
 * - Cycles numériques (année/mois personnels)
 * - Dynamiques HD (type + autorité)
 * - Signaux normalisés (phase_hints agrégés)
 * - Éléments astrologiques dominants
 */

import type { FusionContext } from './buildFusionContext'
import type { NormalizedSignal } from './normalizeSignals'

// ── Types ──────────────────────────────────────────────────────────────────────

export type FusionPhaseType = 'activation' | 'stabilisation' | 'transition'

export type FusionPhase = {
  phase: FusionPhaseType
  phaseConfidence: number
  phaseReasoning: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function deaccent(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

const YEAR_PHASE: Record<number, FusionPhaseType> = {
  1: 'activation',
  2: 'stabilisation',
  3: 'transition',
  4: 'stabilisation',
  5: 'activation',
  6: 'transition',
  7: 'stabilisation',
  8: 'activation',
  9: 'transition',
  11: 'stabilisation',
  22: 'stabilisation',
  33: 'transition',
}

// ── Détection ──────────────────────────────────────────────────────────────────

/**
 * Détecte la phase dominante de lecture à partir du contexte de fusion
 * et des signaux normalisés.
 *
 * @param ctx     Contexte de fusion construit par buildFusionContext
 * @param signals Signaux normalisés produits par normalizeSignals
 */
export function detectFusionPhase(ctx: FusionContext, signals: NormalizedSignal[]): FusionPhase {
  const scores: Record<FusionPhaseType, number> = {
    activation: 0,
    stabilisation: 0,
    transition: 0,
  }
  const reasons: string[] = []

  // 1. Cycles numériques — poids fort (principal indicateur temporel)
  const numeFields = ctx.modules.numerology.fields
  const numeWeight = ctx.modules.numerology.weight

  if (numeWeight > 0) {
    const personalYear = numeFields['personalYear'] as string | number | null
    const personalMonth = numeFields['personalMonth'] as string | number | null

    if (personalYear !== null && personalYear !== undefined) {
      const yearNum = typeof personalYear === 'string' ? parseInt(personalYear, 10) : personalYear
      if (!isNaN(yearNum)) {
        const phase = YEAR_PHASE[yearNum]
        if (phase) {
          scores[phase] += numeWeight * 2.0
          reasons.push(`année personnelle ${personalYear} → ${phase}`)
        }
      }
    }

    if (personalMonth !== null && personalMonth !== undefined) {
      const monthNum = typeof personalMonth === 'string' ? parseInt(personalMonth, 10) : personalMonth
      if (!isNaN(monthNum)) {
        const phase = YEAR_PHASE[monthNum]
        if (phase) {
          scores[phase] += numeWeight * 0.8
          reasons.push(`mois personnel ${personalMonth} → ${phase}`)
        }
      }
    }
  }

  // 2. Type HD — indicateur de dynamique énergétique
  const hdFields = ctx.modules.human_design.fields
  const hdWeight = ctx.modules.human_design.weight

  if (hdWeight > 0) {
    const hdType = hdFields['hdType'] as string | null
    if (hdType) {
      const n = deaccent(hdType)
      const isManifestation =
        n.includes('manifesteur') ||
        n.includes('manifestor') ||
        n.includes('generateur manifestant') ||
        n.includes('manifesting generator')
      const isReceptive =
        n.includes('projecteur') ||
        n.includes('projector') ||
        n.includes('reflecteur') ||
        n.includes('reflector')

      if (isManifestation) {
        scores['activation'] += hdWeight * 1.2
        reasons.push(`type HD ${hdType} → activation`)
      } else if (isReceptive) {
        scores['stabilisation'] += hdWeight * 1.0
        reasons.push(`type HD ${hdType} → stabilisation`)
      } else {
        // Generator : neutre, léger biais vers activation (énergie de réponse)
        scores['activation'] += hdWeight * 0.5
        scores['stabilisation'] += hdWeight * 0.5
      }
    }
  }

  // 3. Phase hints des signaux normalisés — indicateurs convergents
  for (const signal of signals) {
    if (signal.phase_hint && signal.confidence > 0.3) {
      const w = signal.confidence * signal.intensity
      scores[signal.phase_hint] += w
    }
  }

  // 4. Éléments astrologiques dominants
  const astroFields = ctx.modules.astrology.fields
  const astroWeight = ctx.modules.astrology.weight

  if (astroWeight > 0) {
    const dominantElements = astroFields['dominantElements'] as string[] | null
    if (dominantElements?.length) {
      const dea = dominantElements.map(deaccent)
      const fireAirCount = dea.filter((n) => n === 'feu' || n === 'fire' || n === 'air').length
      const earthWaterCount = dea.filter(
        (n) => n === 'terre' || n === 'earth' || n === 'eau' || n === 'water',
      ).length
      if (fireAirCount > earthWaterCount) {
        scores['activation'] += astroWeight * 0.5
        reasons.push(`éléments dominants Feu/Air → activation`)
      } else if (earthWaterCount > fireAirCount) {
        scores['stabilisation'] += astroWeight * 0.5
        reasons.push(`éléments dominants Terre/Eau → stabilisation`)
      }
    }

    // Saturne en signes de fin de cycle → hint de transition
    const saturnSign = astroFields['saturnSign'] as string | null
    if (saturnSign) {
      const n = deaccent(saturnSign)
      if (
        n.includes('pisces') ||
        n.includes('poissons') ||
        n.includes('scorpio') ||
        n.includes('scorpion') ||
        n.includes('capricorn') ||
        n.includes('capricorne')
      ) {
        scores['transition'] += astroWeight * 0.4
        reasons.push(`Saturne ${saturnSign} → possible transition`)
      }
    }
  }

  // 5. Détermination de la phase dominante
  const total = scores.activation + scores.stabilisation + scores.transition

  let phase: FusionPhaseType = 'stabilisation'
  if (total > 0) {
    if (scores.activation >= scores.stabilisation && scores.activation >= scores.transition) {
      phase = 'activation'
    } else if (scores.transition > scores.stabilisation) {
      phase = 'transition'
    } else {
      phase = 'stabilisation'
    }
  }

  const phaseConfidence =
    total > 0 ? Math.round(Math.min(1, scores[phase] / total) * 100) / 100 : 0.33

  const phaseReasoning =
    reasons.length > 0
      ? reasons.join(' | ')
      : `Phase ${phase} par défaut (données cycliques insuffisantes)`

  return { phase, phaseConfidence, phaseReasoning }
}
