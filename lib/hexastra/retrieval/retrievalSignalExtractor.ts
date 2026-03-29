/**
 * retrievalSignalExtractor — Hexastra Coach
 *
 * Convertit knowledgePacket.orderedSources (déjà tagués par science via documentRegistry)
 * en KsSignal[] + bloc structuré par science pour le pipeline KS.FUSION.V13.
 *
 * USAGE :
 *   extractRetrievalSignals({ orderedSources, intent, flowType })
 *   → { signals, block, sciencesCovered, retrievalConfidence, ... }
 *
 * Aucun appel API — post-traitement pur des résultats vectoriels.
 * Les signaux produits sont mergés dans runKsPipeline avant buildFusionSummary.
 */

import type { KsSignal, KsSourceLayer, KsPhaseHint, KsZoneHint } from '@/lib/hexastra/orchestrator/fusionEngine'
import type { DocumentScienceTag, DocumentRole } from '@/lib/hexastra/vector/documentRegistry'
import { getPrioritySciencesForIntent, type ScienceKey } from '@/lib/hexastra/retrieval/scienceQueryBuilder'

// ── Types publics ─────────────────────────────────────────────────────────────

/** Shape de orderedSources retourné par buildKnowledgePacket (résumé via summarizeEntry) */
export type RetrievalSource = {
  role: DocumentRole | 'noise'
  filename: string | null
  source: string
  score: number
  scienceTag: DocumentScienceTag | null
  excerpt: string
}

export type RetrievalSignalsResult = {
  signals: KsSignal[]
  block: string
  sciencesCovered: DocumentScienceTag[]
  retrievalConfidence: number
  timingIndicators: string[]
  behaviorIndicators: string[]
  decisionIndicators: string[]
}

// ── Science → KS module + layer ───────────────────────────────────────────────

const SCIENCE_TO_MODULE: Record<DocumentScienceTag, string> = {
  astrolex:     'KS.Threshold.Timing',
  human_design: 'KS.Presence.Field',
  numerologie:  'KS.Resonance.Balance',
  enneagramme:  'KS.Porteum',
  kua:          'KS.DeconditioMap',
  neurokua:     'KS.NeuroKua',
  maslow:       'KS.Maslow.Pyramid',
  transverse:   'KS.Strategic.Arbiter',
  global:       'KS.Strategic.Arbiter',
}

const SCIENCE_TO_LAYER: Record<DocumentScienceTag, KsSourceLayer> = {
  astrolex:     'cosmos',
  human_design: 'human',
  numerologie:  'symbolic',
  enneagramme:  'human',
  kua:          'nature',
  neurokua:     'nature',
  maslow:       'strategic',
  transverse:   'strategic',
  global:       'strategic',
}

// ── Role → confidence de base ─────────────────────────────────────────────────

const ROLE_CONFIDENCE: Record<DocumentRole | 'noise', number> = {
  masterPrompt:        0.90,
  readingStructure:    0.85,
  sciencePrompt:       0.82,
  subsciencePrompt:    0.80,
  menuPrompt:          0.75,
  referenceBook:       0.70,
  supportingKnowledge: 0.55,
  noise:               0.10,
}

// ── Marqueurs d'indicateurs par domaine ──────────────────────────────────────

const TIMING_MARKERS = [
  'fenêtre', 'cycle', 'période', 'transit', 'phase', 'moment', 'timing',
  'transition', 'changement', 'rupture', 'activation', 'année personnelle',
  'mois personnel', 'favorable', 'ouverture', 'saturation',
]

const BEHAVIOR_MARKERS = [
  'pattern', 'habitude', 'conditionnement', 'déconditionnement', 'automatique',
  'mécanisme', 'schéma', 'rechute', 'blocage', 'résistance', 'addiction',
  'comportemental', 'non-soi', 'déclencheur', 'trigger',
]

const DECISION_MARKERS = [
  'autorité', 'décision', 'stratégie', 'attendre', 'répondre', 'trancher',
  'signal', 'corporel', 'sacral', 'intuitif', 'émotionnel', 'choix',
  'opportunité', 'direction', 'arbitrage',
]

// ── Inférence phase / zone depuis extrait ─────────────────────────────────────

function inferPhaseFromExcerpt(excerpt: string): KsPhaseHint | null {
  const e = excerpt.toLowerCase()
  if (/activ|transit actif|énergie favorable|lancer|commencer/.test(e)) return 'activation'
  if (/stabilis|ancrage|poser les bases|maintenir|consolid/.test(e)) return 'stabilisation'
  if (/transition|changement|rupture|passage|cycle de/.test(e)) return 'transition'
  return null
}

function inferZoneFromExcerpt(excerpt: string): KsZoneHint | null {
  const e = excerpt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (/identit|soi propre|essence|type profil|qui je/.test(e)) return 'identity'
  if (/relation|couple|partena|synastrie|famille/.test(e)) return 'relation'
  if (/carriere|travail|vocation|argent|professionnel/.test(e)) return 'direction'
  if (/securit|fondation|stabilit|logement|emploi/.test(e)) return 'security'
  if (/sens|valeur|mission|chemin de vie|raison/.test(e)) return 'meaning'
  if (/expans|croissanc|jupiter|avancer|developper/.test(e)) return 'expansion'
  return null
}

// ── Extraction d'indicateurs pertinents ──────────────────────────────────────

function extractIndicators(excerpts: string[], markers: string[]): string[] {
  const found = new Set<string>()
  const combined = excerpts.join(' ').toLowerCase()
  for (const marker of markers) {
    if (combined.includes(marker.toLowerCase())) found.add(marker)
  }
  return [...found].slice(0, 6)
}

// ── Score composite d'une source (role confidence + vector score) ─────────────

function compositeScore(src: RetrievalSource): number {
  return (ROLE_CONFIDENCE[src.role] ?? 0.5) * 0.6 + src.score * 0.4
}

// ── API publique ──────────────────────────────────────────────────────────────

/**
 * Convertit orderedSources (knowledgePacket) en KsSignal[] + bloc structuré par science.
 *
 * - Les sciences prioritaires sont déterminées par l'intent via getPrioritySciencesForIntent.
 * - Un seul KsSignal par science (meilleure entrée composite).
 * - Sciences 'global' / 'transverse' traitées en dernier (appui neutre).
 */
export function extractRetrievalSignals(input: {
  orderedSources: RetrievalSource[]
  intent: string
  flowType?: string
}): RetrievalSignalsResult {
  const { orderedSources, intent, flowType } = input

  // Sciences prioritaires pour cet intent (type ScienceKey ↔ DocumentScienceTag se recouvrent sur les 5 sciences principales)
  const prioritySciences = getPrioritySciencesForIntent(intent) as unknown as DocumentScienceTag[]

  // Grouper par scienceTag — exclure null et noise
  const byScience = new Map<DocumentScienceTag, RetrievalSource[]>()
  for (const src of orderedSources) {
    if (!src.scienceTag || src.role === 'noise') continue
    const tag = src.scienceTag
    if (!byScience.has(tag)) byScience.set(tag, [])
    byScience.get(tag)!.push(src)
  }

  // Ordre : sciences prioritaires d'abord, puis les autres (global/transverse en dernier)
  const DEPRIORITIZED: DocumentScienceTag[] = ['global', 'transverse']
  const othersFirst = [...byScience.keys()].filter(
    (s) => !prioritySciences.includes(s) && !DEPRIORITIZED.includes(s),
  )
  const deprioritized = [...byScience.keys()].filter((s) => DEPRIORITIZED.includes(s))
  const orderedSciences: DocumentScienceTag[] = [
    ...prioritySciences.filter((s) => byScience.has(s)),
    ...othersFirst,
    ...deprioritized,
  ]

  const signals: KsSignal[] = []
  const sciencesCovered: DocumentScienceTag[] = []
  const allExcerpts: string[] = []

  for (const science of orderedSciences) {
    const entries = byScience.get(science)
    if (!entries || entries.length === 0) continue

    // Meilleure entrée par score composite (role confidence × 0.6 + vector score × 0.4)
    const best = entries.reduce((a, b) => (compositeScore(a) >= compositeScore(b) ? a : b))

    const confidence = ROLE_CONFIDENCE[best.role] ?? 0.55
    const intensity = Math.min(Math.max(best.score, 0), 1.0)

    allExcerpts.push(best.excerpt)

    const signal: KsSignal = {
      module:         SCIENCE_TO_MODULE[science] ?? 'KS.Strategic.Arbiter',
      sourceLayer:    SCIENCE_TO_LAYER[science],
      signals: [
        {
          tag:         science,
          description: best.excerpt.slice(0, 300),
          intensity,
          confidence,
        },
      ],
      phaseHint:       inferPhaseFromExcerpt(best.excerpt),
      zoneHint:        inferZoneFromExcerpt(best.excerpt),
      riskFlag:        false,
      opportunityFlag: intensity > 0.70 && confidence > 0.70,
      notes:           `retrieval vectoriel — ${best.role} — score ${best.score.toFixed(3)}`,
    }

    signals.push(signal)
    sciencesCovered.push(science)
  }

  // Confiance globale = moyenne des confidences individuelles
  const retrievalConfidence =
    signals.length > 0
      ? signals.reduce((sum, s) => sum + (s.signals[0]?.confidence ?? 0.5), 0) / signals.length
      : 0.5

  const timingIndicators   = extractIndicators(allExcerpts, TIMING_MARKERS)
  const behaviorIndicators = extractIndicators(allExcerpts, BEHAVIOR_MARKERS)
  const decisionIndicators = extractIndicators(allExcerpts, DECISION_MARKERS)

  const block = buildRetrievalBlock({
    signals,
    sciencesCovered,
    intent,
    flowType,
    retrievalConfidence,
    timingIndicators,
    decisionIndicators,
  })

  return {
    signals,
    block,
    sciencesCovered,
    retrievalConfidence,
    timingIndicators,
    behaviorIndicators,
    decisionIndicators,
  }
}

// ── Bloc structuré handoff → arbiter ─────────────────────────────────────────

function buildRetrievalBlock(params: {
  signals: KsSignal[]
  sciencesCovered: DocumentScienceTag[]
  intent: string
  flowType?: string
  retrievalConfidence: number
  timingIndicators: string[]
  decisionIndicators: string[]
}): string {
  const {
    signals,
    sciencesCovered,
    intent,
    flowType,
    retrievalConfidence,
    timingIndicators,
    decisionIndicators,
  } = params

  const lines: string[] = [
    '━━━ RETRIEVAL VECTORIEL — SIGNAUX PAR SCIENCE ━━━',
    `INTENT : ${intent}${flowType ? ` | FLOW : ${flowType}` : ''}`,
    `SCIENCES : ${sciencesCovered.join(', ')}`,
    '',
  ]

  for (const signal of signals) {
    const s = signal.signals[0]
    if (!s) continue

    const science  = s.tag as DocumentScienceTag
    const layer    = signal.sourceLayer ?? 'strategic'
    const excerpt  = (s.description ?? '').slice(0, 200).replace(/"/g, "'")
    const phasePart = signal.phaseHint ? ` | phase : ${signal.phaseHint}` : ''
    const zonePart  = signal.zoneHint  ? ` | zone : ${signal.zoneHint}`  : ''

    lines.push(`[${science} → ${signal.module}]`)
    lines.push(`"${excerpt}"`)
    lines.push(
      `layer : ${layer} | intensity : ${s.intensity.toFixed(2)} | confidence : ${s.confidence.toFixed(2)}${phasePart}${zonePart}`,
    )

    const isTimingScience    = science === 'astrolex'     || science === 'numerologie'
    const isDecisionScience  = science === 'human_design' || science === 'enneagramme'

    if (isTimingScience && timingIndicators.length > 0) {
      lines.push(`indicateurs-timing : ${timingIndicators.join(', ')}`)
    }
    if (isDecisionScience && decisionIndicators.length > 0) {
      lines.push(`indicateurs-décision : ${decisionIndicators.join(', ')}`)
    }

    lines.push('')
  }

  // Handoff résumé pour l'arbiter
  const handoffParts = sciencesCovered
    .slice(0, 3)
    .map((s) => `${s} (${SCIENCE_TO_LAYER[s] ?? 'strategic'})`)
    .join(', ')

  lines.push(`HANDOFF → KS.ARBITER : ${handoffParts}`)
  lines.push(`CONFIANCE GLOBALE : ${retrievalConfidence.toFixed(2)}`)
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  return lines.join('\n')
}
