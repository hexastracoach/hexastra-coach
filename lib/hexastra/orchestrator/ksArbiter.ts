/**
 * KS Arbiter — KS.FUSION.V13
 *
 * Produit UNE ligne directrice principale pour la réponse LLM.
 *
 * L'arbitre synthétise :
 *   - la synthèse de fusion (signal dominant, phase, zone, contradictions)
 *   - le champ de priorité (le vrai enjeu du moment)
 *   - le flow type (timing_strategic vs behavior vs standard)
 *   - l'intent utilisateur
 *
 * Sortie :
 *   dominantDynamic   → la dynamique principale à lire
 *   supportingDynamic → dynamique secondaire (si contradictions)
 *   narrativeFocus    → LA directive pour le LLM (une seule, précise)
 *   answerStrategy    → action | prudence | observation | stabilisation
 */

import type { FusionSummary, KsAnswerStrategy } from './fusionEngine'
import type { PriorityFieldResult } from './priorityField'
import type { FlowType } from '../orchestration/queryRouter'
import type { UserIntent } from '../orchestration/intentClassifier'

// ── Types ─────────────────────────────────────────────────────────────────────

export type KsArbiterInput = {
  fusionSummary: FusionSummary
  priorityField: PriorityFieldResult
  flowType: FlowType
  intent: UserIntent
}

export type KsArbiterResult = {
  /** La dynamique principale extraite de la fusion */
  dominantDynamic: string
  /** Dynamique secondaire — présente uniquement si contradiction active */
  supportingDynamic?: string
  /** La directive narrative unique injectée dans le system prompt */
  narrativeFocus: string
  /** Stratégie de réponse recommandée */
  answerStrategy: KsAnswerStrategy
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ZONE_LABELS_FR: Record<string, string> = {
  security:  'la sécurité et la stabilité',
  relation:  'les dynamiques relationnelles',
  identity:  'l\'identité et le fonctionnement interne',
  direction: 'l\'orientation et la décision',
  expansion: 'la croissance et l\'avancement',
  meaning:   'le sens et la raison d\'être',
}

const PHASE_LABELS_FR: Record<string, string> = {
  activation:     'en phase d\'activation',
  stabilisation:  'en phase de stabilisation',
  transition:     'en phase de transition',
}

const STRATEGY_DIRECTIVES_FR: Record<KsAnswerStrategy, string> = {
  action:        'Orienter vers l\'action directe — le moment est propice, le signal est clair.',
  prudence:      'Orienter vers la prudence — des risques actifs, ne pas précipiter la décision.',
  observation:   'Orienter vers l\'observation — des tensions contradictoires, laisser la situation se clarifier avant d\'agir.',
  stabilisation: 'Orienter vers la consolidation — l\'énergie demande à être ancrée, pas encore le moment d\'avancer.',
}

const STRATEGY_DIRECTIVES_EN: Record<KsAnswerStrategy, string> = {
  action:        'Orient toward direct action — the moment is right, the signal is clear.',
  prudence:      'Orient toward prudence — active risks present, do not rush the decision.',
  observation:   'Orient toward observation — contradictory tensions, let the situation clarify before acting.',
  stabilisation: 'Orient toward consolidation — energy needs grounding, not yet time to advance.',
}

const INTENT_DYNAMIC_TEMPLATES_FR: Partial<Record<UserIntent, (zone: string, phase: string) => string>> = {
  timing_decision: (zone, phase) =>
    `Décision de timing — champ prioritaire : ${zone}${phase ? ', ' + phase : ''}. La question est QUAND, pas si.`,
  behavior_change: (zone, phase) =>
    `Changement comportemental — champ prioritaire : ${zone}${phase ? ', ' + phase : ''}. La question est LE DÉCLENCHEUR, pas la volonté.`,
}

// ── Fonction principale ───────────────────────────────────────────────────────

/**
 * Applique l'arbitrage KS et produit la directive narrative unique.
 */
export function applyKsArbiter(input: KsArbiterInput): KsArbiterResult {
  const { fusionSummary, priorityField, flowType, intent } = input
  const isFr = true // default FR — enrichir si besoin via context

  const zoneLabel = ZONE_LABELS_FR[priorityField.dominantField] ?? priorityField.dominantField
  const phaseLabel = fusionSummary.dominantPhase
    ? (PHASE_LABELS_FR[fusionSummary.dominantPhase] ?? fusionSummary.dominantPhase)
    : ''

  // Dynamique dominante
  const intentTemplate = INTENT_DYNAMIC_TEMPLATES_FR[intent]
  const dominantDynamic = intentTemplate
    ? intentTemplate(zoneLabel, phaseLabel)
    : [
        `Signal dominant : ${fusionSummary.dominantSignal}`,
        fusionSummary.dominantModule ? `(${fusionSummary.dominantModule})` : null,
        phaseLabel ? `— ${phaseLabel}` : null,
        `— champ : ${zoneLabel}`,
      ].filter(Boolean).join(' ')

  // Dynamique secondaire (si contradiction)
  const supportingDynamic = fusionSummary.contradictions.length > 0
    ? `Tension à résoudre : ${fusionSummary.contradictions[0]}`
    : undefined

  // Narrative focus — LA directive unique
  const strategyDirective = isFr
    ? STRATEGY_DIRECTIVES_FR[fusionSummary.answerStrategy]
    : STRATEGY_DIRECTIVES_EN[fusionSummary.answerStrategy]

  const narrativeFocus = [
    `FOCUS NARRATIF PRINCIPAL : ${priorityField.reason}.`,
    strategyDirective,
    priorityField.secondaryField
      ? `Champ secondaire actif : ${ZONE_LABELS_FR[priorityField.secondaryField] ?? priorityField.secondaryField}.`
      : null,
    fusionSummary.contradictions.length > 0
      ? `ATTENTION — Contradiction détectée : ${fusionSummary.contradictions.join(', ')}. Ne développer qu'UN angle.`
      : null,
  ].filter(Boolean).join(' ')

  return {
    dominantDynamic,
    supportingDynamic,
    narrativeFocus,
    answerStrategy: fusionSummary.answerStrategy,
  }
}
