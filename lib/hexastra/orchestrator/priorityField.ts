/**
 * Priority Field Detector — KS.FUSION.V13
 *
 * Détecte la vraie priorité du moment de l'utilisateur :
 * pas seulement le thème apparent de la question,
 * mais le CHAMP DE VIE qui demande le plus d'attention.
 *
 * 6 champs disponibles :
 *   security   → sécurité, stabilité matérielle, emploi, logement
 *   relation   → relations, couple, famille, entourage
 *   identity   → qui je suis, fonctionnement naturel, nature profonde
 *   direction  → voie, projet, décision, orientation
 *   expansion  → croissance, avancer, créer, développer
 *   meaning    → sens, mission, raison d'être, comprendre
 */

import type { KsZoneHint, FusionSummary } from './fusionEngine'

// ── Types ─────────────────────────────────────────────────────────────────────

export type PriorityFieldResult = {
  dominantField: KsZoneHint
  secondaryField?: KsZoneHint
  reason: string
  confidence: number
}

export type PriorityFieldInput = {
  userQuestion: string
  fusionSummary: FusionSummary
  context?: {
    intent?: string
    lang?: string
  }
}

// ── Patterns par champ ────────────────────────────────────────────────────────

const FIELD_PATTERNS: Record<KsZoneHint, RegExp> = {
  security: /\b(securit[ée]|stable|stabilit[ée]|argent|logement|emploi|survie|peur de perdre|finanac|revenus?|chômage|manque de)\b/i,
  relation: /\b(relation|couple|famille|ami[e]?s?|entourage|partenaire|conjoint|conflit|tension avec|avec (lui|elle|eux|elles|quelqu))\b/i,
  identity: /\b(qui (suis.?je|je suis)|mon identit[eé]|ma nature|qui suis|quel type|fonctionnement|ma vraie|ma nature (profonde|r[eé]elle))\b/i,
  direction: /\b(direction|voie|chemin|but|objectif|projet|d[eé]cision|choisir|orienter|quelle (voie|direction)|quel chemin)\b/i,
  expansion: /\b(avancer|d[eé]velopper|cr[eé]er|lancer|expanser|progresser|[eé]voluer|changer de|nouvelle [eé]tape|passer [àa])\b/i,
  meaning:   /\b(sens|raison d['']?[êe]tre|pourquoi|mission (de vie)?|signif|comprendre ce qui|ma vie|[àa] quoi [çc]a sert)\b/i,
}

// ── Boost contextuel selon l'intent ──────────────────────────────────────────

const INTENT_FIELD_BOOST: Record<string, KsZoneHint> = {
  timing_decision:       'direction',
  behavior_change:       'identity',
  decision:              'direction',
  relationship:          'relation',
  love:                  'relation',
  work_money:            'expansion',
  inner_state:           'identity',
  blocage:               'identity',
  timing:                'direction',
  identity:              'identity',
  life_period:           'meaning',
  fusion_general_question: 'meaning',
}

// ── Raisons lisibles ──────────────────────────────────────────────────────────

const FIELD_REASONS: Record<KsZoneHint, string> = {
  security:  'La question touche à la stabilité matérielle ou au besoin de sécurité fondamentale',
  relation:  'La question porte sur les dynamiques relationnelles et la connexion aux autres',
  identity:  'La question explore le fonctionnement interne et la nature profonde',
  direction: 'La question demande une orientation : quoi faire, quel chemin prendre',
  expansion: 'La question porte sur la croissance, l\'avancement et le changement',
  meaning:   'La question cherche du sens, une compréhension profonde de ce qui se passe',
}

// ── Utilitaire ────────────────────────────────────────────────────────────────

function deaccent(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

// ── Fonction principale ───────────────────────────────────────────────────────

/**
 * Détecte le champ de vie prioritaire à partir de la question utilisateur,
 * du résumé de fusion et du contexte d'intent.
 */
export function detectPriorityField(input: PriorityFieldInput): PriorityFieldResult {
  const { userQuestion, fusionSummary, context = {} } = input
  const normalized = deaccent(userQuestion || '')

  // Score chaque champ depuis la question
  const scores: Record<KsZoneHint, number> = {
    security: 0,
    relation: 0,
    identity: 0,
    direction: 0,
    expansion: 0,
    meaning: 0,
  }

  for (const [field, pattern] of Object.entries(FIELD_PATTERNS) as [KsZoneHint, RegExp][]) {
    if (pattern.test(normalized)) {
      scores[field] += 2
    }
  }

  // Boost depuis la zone dominante du fusionSummary
  if (fusionSummary.dominantZone) {
    scores[fusionSummary.dominantZone] += 1.5
  }

  // Boost depuis l'intent
  const intentBoost = context.intent ? INTENT_FIELD_BOOST[context.intent] : null
  if (intentBoost) {
    scores[intentBoost] += 1
  }

  // Trier et extraire dominant + secondaire
  const sorted = (Object.entries(scores) as [KsZoneHint, number][])
    .sort((a, b) => b[1] - a[1])

  const dominantEntry = sorted[0]!
  const dominantField: KsZoneHint = dominantEntry[1] > 0 ? dominantEntry[0] : 'direction'
  const secondaryEntry = sorted[1]
  const secondaryField: KsZoneHint | undefined =
    secondaryEntry && secondaryEntry[1] > 0 ? secondaryEntry[0] : undefined

  // Confiance : normalisée sur le score total
  const totalScore = dominantEntry[1] + (secondaryEntry?.[1] ?? 0)
  const confidence = totalScore > 0
    ? Number(Math.min(0.95, (dominantEntry[1] / (totalScore + 1))).toFixed(2))
    : 0.40

  return {
    dominantField,
    secondaryField: secondaryField !== dominantField ? secondaryField : undefined,
    reason: FIELD_REASONS[dominantField],
    confidence,
  }
}
