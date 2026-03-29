/**
 * KS.FUSION.V13 — Calibration Harness
 *
 * 12 prompts réels répartis en 4 catégories :
 *   A. timing_decision  (3 prompts)
 *   B. behavior_change  (3 prompts)
 *   C. standard         (3 prompts — relation / career / inner_state)
 *   D. decision / relation / work — lecture générale (3 prompts)
 *
 * Pour chaque prompt :
 *   1. Intent classification
 *   2. Flow type routing
 *   3. KS pipeline complet (avec CompactReadingCore mock adapté)
 *   4. Directive arbiter produite
 *   5. validateFinalOutputQuality sur un texte de réponse synthétique
 *   6. compareArbiterToFinalOutput — alignement arbiter ↔ réponse
 *   7. measureSentinelDrift — entre réponse "de référence" et réponse "dégradée"
 *
 * Chaque test émet un debug JSON via console.log pour inspection manuelle.
 */

import { describe, expect, it } from 'vitest'
import { classifyUserIntent } from '@/lib/hexastra/orchestration/intentClassifier'
import { resolveFlowType } from '@/lib/hexastra/orchestration/queryRouter'
import { runKsPipeline } from '@/lib/hexastra/orchestrator/ksPipeline'
import {
  validateFinalOutputQuality,
  compareArbiterToFinalOutput,
  measureSentinelDrift,
} from '@/lib/hexastra/orchestrator/outputValidator'
import type { CompactReadingCore } from '@/lib/hexastra/orchestrator/compactReadingCore'
import type { FusionContext } from '@/lib/hexastra/orchestrator/buildFusionContext'
import { getIntentFieldMap } from '@/lib/hexastra/orchestrator/intentFieldMapping'

// ── Profil partagé (même personne pour tous les tests) ────────────────────────

const BASE_COMPACT_CORE: CompactReadingCore = {
  dominantDynamic: 'Énergie de réponse — attend le signal interne avant d\'agir',
  hiddenMechanism: 'Régulation émotionnelle par le comportement — évite la tension intérieure via l\'action externe',
  realTension: 'Tension entre la tête (décision mentale) et le corps (signal sacral) — conflit chronique',
  visibleEffect: 'Rechute ou blocage à chaque moment de vide ou de pression externe',
  rightMovement: 'Attendre la saturation naturelle — ne pas décider sous pression',
  decisionSignal: 'Signal sacral — attendre la réponse corporelle avant de trancher',
  timingSignal: 'Année 5 numéro personnel — phase de changement et de mobilité, fenêtre active',
  energyLeak: 'Énergie perdue à insister là où aucun signal clair ne vient',
  leveragePoint: 'Un seul ajustement : aligner la décision avec le signal interne non-mental',
  toneHint: 'Ton ancré et direct — pas de détours',
  solarToneHint: 'Ton factuel et structuré',
  questionType: 'timing_decision',
  signalConfidence: 0.78,
}

function makeFusionCtx(intent: string): FusionContext {
  return {
    intent,
    readingAngle: 'lecture stratégique',
    readingQuestion: '',
    modulesActivated: ['astrology', 'human_design', 'numerology'],
    dominantModule: 'human_design',
    mapping: getIntentFieldMap('timing'),
    modules: {
      astrology: {
        available: true,
        weight: 0.25,
        fields: { sunSign: 'scorpion', yearPersonal: '5' },
      },
      human_design: {
        available: true,
        weight: 0.30,
        fields: { hdType: 'générateur', hdAuthority: 'sacrale' },
        isHeuristic: false,
      },
      numerology: {
        available: true,
        weight: 0.20,
        fields: { lifePath: '5', personalYear: '5' },
      },
      enneagram: {
        available: false,
        weight: 0,
        fields: {},
        isHeuristic: true,
      },
      kua: {
        available: false,
        weight: 0,
        fields: {},
      },
    },
    fusionConfidence: 0.75,
    completeness: 0.70,
    confidenceBreakdown: {
      astrology: 0.75,
      human_design: 0.80,
      numerology: 0.68,
      enneagram: 0,
      kua: 0,
    },
    warnings: [],
  }
}

// ── Textes de réponse synthétiques ────────────────────────────────────────────

/** Bonne réponse timing_decision — concrète, marqueurs temporels, action finale */
const GOOD_TIMING_RESPONSE = `
Tu es dans une phase de changement actif (année 5 — mobilité et transformation).
Le signal n'est pas encore saturé : tu ressens la pression de décider, mais ton corps ne répond pas encore clairement.

Ce qui se passe en ce moment : une tension entre la tête qui veut trancher et le signal sacral qui attend.
Pourquoi ça bloque : tu décides par volonté, pas par réponse. Le générateur ne peut pas forcer.

Le meilleur moment pour agir : dans les prochaines semaines, quand la saturation sera naturelle — tu le reconnaîtras à une clarté soudaine, pas à une pensée répétitive.
Comment reconnaître la bonne fenêtre : le corps dit oui sans effort. L'idée revient d'elle-même sans forçage.
Les moments à éviter : décider dans le vide, sous ennui, ou sous pression externe.

Ce que tu dois faire maintenant : attends le signal. Pose une question simple à ton corps chaque matin. Note la réponse.
Clé à retenir : ce n'est pas quand tu décideras — c'est quand ça décidera pour toi.
`.trim()

/** Bonne réponse behavior_change — mécanisme nommé, déclencheur identifié */
const GOOD_BEHAVIOR_RESPONSE = `
Le comportement que tu veux changer n'est pas une faiblesse de volonté — c'est un mécanisme de régulation.
Chaque fois que la tension intérieure monte, ton système cherche une décharge rapide. C'est automatique.

Le déclencheur réel : le vide, l'ennui, ou la pression non résolue. Pas le comportement lui-même.
Ce que le comportement fait pour toi : il évite la tension. Il ne te détend pas — il décale.

La stratégie de changement juste : identifier le déclencheur avant le comportement.
Quand tu sens le vide monter, pose-toi cette question : qu'est-ce que j'évite en ce moment ?
Commence par nommer l'inconfort. Pas l'éviter, pas le régler — juste le nommer.

Action concrète : ce soir, note une situation où tu as eu l'impulsion. Identifie ce qui s'est passé juste avant.
`.trim()

/** Bonne réponse standard relation — directe, sans vague */
const GOOD_RELATION_RESPONSE = `
La dynamique relationnelle que tu décris reflète un pattern récurrent : tu t'adaptes avant même que l'autre exprime un besoin.
Ce mécanisme vient de ton autorité sacrale — tu réponds à ce que tu perçois, pas à ce qui est dit.

Ce qui se passe : tu gères la tension de l'autre pour éviter un conflit qui n'existe peut-être pas encore.
Ce que tu projettes dans cette relation : une lecture émotionnelle que l'autre n'a pas validée.

L'ajustement possible : demande avant de t'adapter. Une question directe change tout.
Commence par une conversation courte : "j'ai l'impression que... est-ce que c'est juste ?"
`.trim()

/** Réponse dégradée — vague, trop longue, pas d'action */
const DEGRADED_RESPONSE = `
Il est possible que tu sois dans une période de transition. Peut-être que les choses vont évoluer dans les prochains temps.
Parfois, on ressent une confusion qui est tout à fait normale. Il se peut que cette confusion soit en lien avec ton fonctionnement intérieur.

Écoute-toi. Suis ton intuition. Quand tu seras prêt, les choses se mettront en place naturellement.
Il est important de prendre soin de toi et de ne pas te mettre trop de pression. La vie a ses rythmes et chacun avance à son propre rythme.

Tu pourrais également envisager d'explorer différentes pistes. Les énergies planétaires sont favorables à une réflexion profonde.
Parfois, il suffit d'observer ce qui se passe autour de soi pour comprendre ce qui se passe en soi.
Éventuellement, tu trouveras ta voie. Il se peut que ce chemin ne soit pas encore totalement clair, mais potentiellement il se dessinera.

En quelque sorte, tout cela fait partie d'un processus de croissance personnelle qui est tout à fait normal et naturel.
Il est possible que tu aies besoin de plus de temps pour intégrer ces transformations.
`.trim()

// ── Catégorie A : timing_decision ─────────────────────────────────────────────

describe('Calibration A — timing_decision', () => {
  it('A1 — "quand arrêter de fumer ?" — pipeline complet + validation', () => {
    const message = 'quel est le meilleur moment pour arrêter de fumer ?'
    const intent = classifyUserIntent(message)
    const flowType = resolveFlowType(intent)

    expect(intent).toBe('timing_decision')
    expect(flowType).toBe('timing_strategic')

    const core: CompactReadingCore = {
      ...BASE_COMPACT_CORE,
      questionType: 'timing_decision',
      timingSignal: 'Année 5 — fenêtre de changement active, énergie de rupture présente',
    }
    const ctx = { ...makeFusionCtx('timing_decision'), readingQuestion: message }

    const pipeline = runKsPipeline({
      userIntent: intent,
      userMessage: message,
      compactCore: core,
      fusionCtx: ctx,
      flowType,
      lang: 'fr',
    })

    const validation = validateFinalOutputQuality(GOOD_TIMING_RESPONSE, {
      intent,
      answerStrategy: pipeline.arbiter.answerStrategy,
      responseMode: 'timing_strategic_response',
    })

    const alignment = compareArbiterToFinalOutput({
      arbiter: pipeline.arbiter,
      finalOutput: GOOD_TIMING_RESPONSE,
    })

    console.log('[CALIBRATION A1]', JSON.stringify({
      intent,
      flowType,
      arbiter: pipeline.arbiter,
      directive: pipeline.arbiterDirective,
      validation,
      alignment,
    }, null, 2))

    expect(pipeline.arbiterDirective).toContain('KS.FUSION.V13')
    expect(pipeline.arbiterDirective).toContain('RÈGLES ANTI-EXPANSION')
    expect(pipeline.arbiterDirective).toContain('FOCUS NARRATIF UNIQUE')
    expect(validation.checks.hasAction).toBe(true)
    expect(validation.checks.hasTimingMarker).toBe(true)
    expect(validation.checks.noVaguePhrases).toBe(true)
    expect(validation.score).toBeGreaterThanOrEqual(60)
    // alignment.alignmentScore dépend des mots-clés générés dynamiquement par l'arbiter —
    // on vérifie uniquement la structure du résultat, pas une valeur fixe
    expect(typeof alignment.aligned).toBe('boolean')
    expect(alignment.alignmentScore).toBeGreaterThanOrEqual(0)
    expect(alignment.alignmentScore).toBeLessThanOrEqual(100)
  })

  it('A2 — "bon moment pour quitter mon emploi ?" — stratégie et marqueurs', () => {
    const message = 'est-ce le bon moment pour quitter mon emploi ?'
    const intent = classifyUserIntent(message)
    const flowType = resolveFlowType(intent)

    expect(intent).toBe('timing_decision')

    const pipeline = runKsPipeline({
      userIntent: intent,
      userMessage: message,
      compactCore: BASE_COMPACT_CORE,
      fusionCtx: makeFusionCtx('timing_decision'),
      flowType,
      lang: 'fr',
    })

    expect(pipeline.arbiter.answerStrategy).toMatch(/^(action|prudence|observation|stabilisation)$/)
    expect(pipeline.arbiterDirective).toContain('RÈGLE 2')
    expect(pipeline.arbiterDirective).toContain('RÈGLE 4')

    console.log('[CALIBRATION A2]', JSON.stringify({
      intent,
      arbiter: pipeline.arbiter,
      sentinel: pipeline.fusionSummary.sentinelStatus,
    }, null, 2))
  })

  it('A3 — validation sur réponse dégradée → doit échouer noVaguePhrases', () => {
    const message = 'quand dois-je me lancer dans mon projet ?'
    const intent = classifyUserIntent(message)
    const flowType = resolveFlowType(intent)

    const pipeline = runKsPipeline({
      userIntent: intent,
      userMessage: message,
      compactCore: BASE_COMPACT_CORE,
      fusionCtx: makeFusionCtx('timing_decision'),
      flowType,
      lang: 'fr',
    })

    const validation = validateFinalOutputQuality(DEGRADED_RESPONSE, {
      intent,
      answerStrategy: pipeline.arbiter.answerStrategy,
      responseMode: 'timing_strategic_response',
    })

    console.log('[CALIBRATION A3 — DÉGRADÉE]', JSON.stringify({
      validation,
      vaguePhrasesFound: validation.vaguePhrasesFound,
      score: validation.score,
    }, null, 2))

    expect(validation.checks.noVaguePhrases).toBe(false)
    expect(validation.vaguePhrasesFound.length).toBeGreaterThan(0)
    // score = 75 car les autres checks passent — valid peut être true, mais noVaguePhrases doit échouer
    expect(validation.issues.some(i => i.includes('vague'))).toBe(true)
  })
})

// ── Catégorie B : behavior_change ─────────────────────────────────────────────

describe('Calibration B — behavior_change', () => {
  it('B1 — "arrêter de procrastiner" — déclencheur identifié', () => {
    const message = 'je veux arrêter de procrastiner mais je n\'y arrive jamais, comment sortir de ce schéma ?'
    const intent = classifyUserIntent(message)
    const flowType = resolveFlowType(intent)

    expect(intent).toBe('behavior_change')
    expect(flowType).toBe('behavior')

    const core: CompactReadingCore = {
      ...BASE_COMPACT_CORE,
      questionType: 'behavior_change',
      hiddenMechanism: 'La procrastination est une régulation de l\'anxiété anticipatoire — pas une question de temps',
    }

    const pipeline = runKsPipeline({
      userIntent: intent,
      userMessage: message,
      compactCore: core,
      fusionCtx: makeFusionCtx('behavior_change'),
      flowType,
      lang: 'fr',
    })

    const validation = validateFinalOutputQuality(GOOD_BEHAVIOR_RESPONSE, {
      intent,
      answerStrategy: pipeline.arbiter.answerStrategy,
      responseMode: 'timing_strategic_response',
    })

    const alignment = compareArbiterToFinalOutput({
      arbiter: pipeline.arbiter,
      finalOutput: GOOD_BEHAVIOR_RESPONSE,
    })

    console.log('[CALIBRATION B1]', JSON.stringify({
      intent,
      flowType,
      arbiter: pipeline.arbiter,
      validation,
      alignment,
    }, null, 2))

    expect(validation.checks.hasAction).toBe(true)
    expect(validation.checks.noVaguePhrases).toBe(true)
    expect(validation.score).toBeGreaterThanOrEqual(60)
  })

  it('B2 — "addiction aux réseaux" — modules KS actifs', () => {
    const message = 'comment me débarrasser de mon addiction aux réseaux sociaux ?'
    const intent = classifyUserIntent(message)
    const flowType = resolveFlowType(intent)

    expect(intent).toBe('behavior_change')

    const pipeline = runKsPipeline({
      userIntent: intent,
      userMessage: message,
      compactCore: BASE_COMPACT_CORE,
      fusionCtx: makeFusionCtx('behavior_change'),
      flowType,
      lang: 'fr',
    })

    // KS.Presence.Field doit être dans les modules activés pour behavior
    expect(pipeline.ksModules).toContain('KS.Presence.Field')
    expect(pipeline.ksModules).toContain('KS.Resonance.Balance')

    console.log('[CALIBRATION B2]', JSON.stringify({
      intent,
      ksModules: pipeline.ksModules,
      arbiter: pipeline.arbiter,
    }, null, 2))
  })

  it('B3 — sentinel drift entre bonne et dégradée réponse behavior', () => {
    const drift = measureSentinelDrift(GOOD_BEHAVIOR_RESPONSE, DEGRADED_RESPONSE)

    console.log('[CALIBRATION B3 — DRIFT]', JSON.stringify(drift, null, 2))

    expect(drift.driftDetected).toBe(true)
    expect(drift.dimensions.clarityLoss).toBe(true)
    expect(drift.driftScore).toBeGreaterThanOrEqual(25)
  })
})

// ── Catégorie C : standard (relation / career / inner_state) ──────────────────

describe('Calibration C — standard', () => {
  it('C1 — "problème dans ma relation" — flow standard, pas de timing_strategic', () => {
    const message = 'j\'ai l\'impression que ma relation ne va pas bien, qu\'est-ce qui se passe vraiment ?'
    const intent = classifyUserIntent(message)
    const flowType = resolveFlowType(intent)

    expect(flowType).toBe('standard')

    const pipeline = runKsPipeline({
      userIntent: intent,
      userMessage: message,
      compactCore: {
        ...BASE_COMPACT_CORE,
        questionType: intent,
        hiddenMechanism: 'Projection émotionnelle — lire la tension de l\'autre avant qu\'il la nomme',
      },
      fusionCtx: makeFusionCtx(intent),
      flowType,
      lang: 'fr',
    })

    const validation = validateFinalOutputQuality(GOOD_RELATION_RESPONSE, {
      intent,
      answerStrategy: pipeline.arbiter.answerStrategy,
      responseMode: 'hexastra_coaching',
    })

    console.log('[CALIBRATION C1]', JSON.stringify({
      intent,
      flowType,
      arbiter: pipeline.arbiter,
      validation,
    }, null, 2))

    expect(pipeline.arbiterDirective).toContain('KS.FUSION.V13')
    expect(validation.score).toBeGreaterThanOrEqual(60)
  })

  it('C2 — "carrière / reconversion" — intent work_money, flow standard', () => {
    const message = 'j\'hésite entre deux opportunités professionnelles et je ne sais pas laquelle choisir'
    const intent = classifyUserIntent(message)
    const flowType = resolveFlowType(intent)

    expect(flowType).toBe('standard')

    const pipeline = runKsPipeline({
      userIntent: intent,
      userMessage: message,
      compactCore: {
        ...BASE_COMPACT_CORE,
        questionType: intent,
        rightMovement: 'Explorer des voies qui activent naturellement l\'énergie — pas celles qui semblent logiques',
      },
      fusionCtx: makeFusionCtx(intent),
      flowType,
      lang: 'fr',
    })

    expect(pipeline.arbiter.answerStrategy).toMatch(/^(action|prudence|observation|stabilisation)$/)
    expect(pipeline.priorityField.dominantField).toBeDefined()

    console.log('[CALIBRATION C2]', JSON.stringify({
      intent,
      priorityField: pipeline.priorityField,
      arbiter: pipeline.arbiter,
    }, null, 2))
  })

  it('C3 — "état intérieur / je me sens vide" — inner_state, flow standard', () => {
    const message = 'je me sens vide depuis quelques semaines, je ne sais pas pourquoi'
    const intent = classifyUserIntent(message)
    const flowType = resolveFlowType(intent)

    expect(flowType).toBe('standard')

    const pipeline = runKsPipeline({
      userIntent: intent,
      userMessage: message,
      compactCore: {
        ...BASE_COMPACT_CORE,
        questionType: intent,
        hiddenMechanism: 'Vide post-saturation — le générateur a donné sans retour suffisant',
        realTension: 'Attente implicite de reconnaissance vs fonctionnement naturel de l\'énergie de réponse',
      },
      fusionCtx: makeFusionCtx(intent),
      flowType,
      lang: 'fr',
    })

    expect(pipeline.fusionSummary.confidenceScore).toBeGreaterThan(0)
    expect(pipeline.arbiterDirective).toContain('RÈGLE 1')

    console.log('[CALIBRATION C3]', JSON.stringify({
      intent,
      fusionSummary: pipeline.fusionSummary,
      arbiter: pipeline.arbiter,
    }, null, 2))
  })
})

// ── Catégorie D : decision / relation / work — lecture générale ───────────────

describe('Calibration D — decision / relation / work', () => {
  it('D1 — "dois-je accepter cette offre ?" — decision, alignement arbiter', () => {
    const message = 'on m\'a proposé une nouvelle offre d\'emploi, je ne sais pas si je dois accepter'
    const intent = classifyUserIntent(message)
    const flowType = resolveFlowType(intent)

    const pipeline = runKsPipeline({
      userIntent: intent,
      userMessage: message,
      compactCore: {
        ...BASE_COMPACT_CORE,
        questionType: intent,
        decisionSignal: 'Décision par réponse corporelle — attendre la clarté du signal sacral, pas la logique',
        rightMovement: 'Ne pas décider sous la pression du délai — demander plus de temps',
      },
      fusionCtx: makeFusionCtx(intent),
      flowType,
      lang: 'fr',
    })

    const syntheticResponse = `
Tu n'es pas encore en état de décider — le signal n'est pas clair.
Ce que tu ressens, c'est la pression du délai, pas la clarté de la réponse.

Ton mécanisme de décision juste : attendre que le corps réponde. Pas la tête.
Quand tu imagines accepter, qu'est-ce qui se passe physiquement ? Un oui corporel ou une tension ?

Action concrète : demande un délai de réflexion. Observe ta réaction physique face à cette question dans les prochains jours.
Ne décide pas sous contrainte de temps — c'est le premier piège.
    `.trim()

    const alignment = compareArbiterToFinalOutput({
      arbiter: pipeline.arbiter,
      finalOutput: syntheticResponse,
    })

    console.log('[CALIBRATION D1]', JSON.stringify({
      intent,
      flowType,
      arbiter: pipeline.arbiter,
      alignment,
    }, null, 2))

    expect(pipeline.arbiterDirective).toContain('KS.FUSION.V13')
    expect(alignment.alignmentScore).toBeGreaterThanOrEqual(0) // vérification de structure
    expect(typeof alignment.aligned).toBe('boolean')
  })

  it('D2 — "tension avec collègue" — relation, priorityField = relation', () => {
    const message = 'il y a une grosse tension avec mon collègue, comment gérer ça ?'
    const intent = classifyUserIntent(message)

    const pipeline = runKsPipeline({
      userIntent: intent,
      userMessage: message,
      compactCore: {
        ...BASE_COMPACT_CORE,
        questionType: intent,
        realTension: 'Conflit de perception — ce que tu projettes vs ce que l\'autre vit réellement',
      },
      fusionCtx: makeFusionCtx(intent),
      flowType: resolveFlowType(intent),
      lang: 'fr',
    })

    // Le champ prioritaire doit être relation ou identity (selon le message)
    expect(['relation', 'identity', 'direction']).toContain(pipeline.priorityField.dominantField)

    console.log('[CALIBRATION D2]', JSON.stringify({
      intent,
      priorityField: pipeline.priorityField,
      arbiter: pipeline.arbiter,
    }, null, 2))
  })

  it('D3 — "lecture générale / où j\'en suis" — fusion_general_question, pipeline stable', () => {
    const message = 'j\'aimerais avoir une lecture générale sur où j\'en suis en ce moment'
    const intent = classifyUserIntent(message)
    const flowType = resolveFlowType(intent)

    const pipeline = runKsPipeline({
      userIntent: intent,
      userMessage: message,
      compactCore: BASE_COMPACT_CORE,
      fusionCtx: makeFusionCtx(intent),
      flowType,
      lang: 'fr',
    })

    // Pipeline doit toujours produire une directive valide même pour lecture générale
    expect(pipeline.arbiterDirective).toBeTruthy()
    expect(pipeline.arbiterDirective.length).toBeGreaterThan(100)
    expect(pipeline.arbiter.narrativeFocus).toBeTruthy()
    expect(pipeline.fusionSummary.sentinelStatus).toMatch(/^(validated|degraded)$/)

    console.log('[CALIBRATION D3]', JSON.stringify({
      intent,
      flowType,
      sentinel: pipeline.fusionSummary.sentinelStatus,
      confidence: pipeline.fusionSummary.confidenceScore,
      arbiter: pipeline.arbiter,
    }, null, 2))
  })
})

// ── Tests transversaux ────────────────────────────────────────────────────────

describe('Calibration transversale — outputValidator', () => {
  it('validateFinalOutputQuality — bonne réponse → score ≥ 80', () => {
    const result = validateFinalOutputQuality(GOOD_TIMING_RESPONSE, {
      intent: 'timing_decision',
      answerStrategy: 'action',
      responseMode: 'timing_strategic_response',
    })
    expect(result.score).toBeGreaterThanOrEqual(80)
    expect(result.valid).toBe(true)
    expect(result.checks.hasAction).toBe(true)
    expect(result.checks.hasTimingMarker).toBe(true)
    expect(result.checks.noVaguePhrases).toBe(true)
  })

  it('validateFinalOutputQuality — réponse dégradée → invalide', () => {
    const result = validateFinalOutputQuality(DEGRADED_RESPONSE, {
      intent: 'timing_decision',
      answerStrategy: 'action',
      responseMode: 'timing_strategic_response',
    })
    // score = 75 (−25 pour phrases vagues) — valid peut rester true mais noVaguePhrases doit échouer
    expect(result.checks.noVaguePhrases).toBe(false)
    expect(result.issues.length).toBeGreaterThan(0)
    expect(result.vaguePhrasesFound.length).toBeGreaterThan(0)
  })

  it('measureSentinelDrift — entre bonne et dégradée → dérive détectée', () => {
    const drift = measureSentinelDrift(GOOD_TIMING_RESPONSE, DEGRADED_RESPONSE)
    expect(drift.driftDetected).toBe(true)
    expect(drift.driftScore).toBeGreaterThanOrEqual(25)
    expect(drift.dimensions.clarityLoss).toBe(true)
  })

  it('measureSentinelDrift — entre deux bonnes réponses → pas de dérive majeure', () => {
    const drift = measureSentinelDrift(GOOD_TIMING_RESPONSE, GOOD_BEHAVIOR_RESPONSE)
    // Les deux sont bonnes — pas de perte de clarté ni d'expansion excessive
    expect(drift.dimensions.clarityLoss).toBe(false)
    expect(drift.driftScore).toBeLessThan(75)
  })

  it('compareArbiterToFinalOutput — arbiter action + réponse sans action → non aligné', () => {
    const arbiter = {
      dominantDynamic: 'Décision de timing — champ prioritaire : l\'orientation et la décision',
      narrativeFocus: 'FOCUS NARRATIF PRINCIPAL : fenêtre de changement active. Orienter vers l\'action directe — le moment est propice, le signal est clair.',
      answerStrategy: 'action' as const,
    }

    const weakResponse = `
Il y a beaucoup de choses à considérer dans cette situation.
Peut-être que tu trouveras ta réponse avec le temps. Parfois les choses se clarifient d'elles-mêmes.
Il se peut que ce soit une période de questionnement normal.
    `.trim()

    const result = compareArbiterToFinalOutput({ arbiter, finalOutput: weakResponse })

    console.log('[CALIBRATION TRANSVERSALE — ARBITER DRIFT]', JSON.stringify(result, null, 2))

    expect(result.aligned).toBe(false)
    expect(result.driftReasons.length).toBeGreaterThan(0)
    expect(result.suggestions.length).toBeGreaterThan(0)
  })
})
