/**
 * fusion-arbiter-validation — Hexastra Coach
 *
 * Batterie de validation complète du Fusion Arbiter (Priorité 2).
 *
 * Pour chaque question test :
 *   1. Classify intent réel (classifyUserIntent)
 *   2. Field map réel (getIntentFieldMap)
 *   3. Contexte de fusion réel (buildFusionContext) avec payload mock réaliste
 *   4. Arbitrage réel (arbitrateFusionSignals)
 *   5. Output complet + assertions de cohérence
 *
 * Profil utilisateur mock :
 *   - Soleil Scorpion | Lune Bélier | Ascendant Balance | Vénus Vierge | Mars Sagittaire | Saturne Poissons
 *   - HD Projecteur 2/4 | Autorité Émotionnelle | Single Définition | Stratégie : Attendre l'invitation
 *   - Chemin de vie 7 | Année personnelle 3 | Mois personnel 8
 *   - Ennéagramme 4w3 | Instinct SP
 *   - Kua 6 | Métal | Directions : Ouest
 */

import { describe, expect, it } from 'vitest'
import { classifyUserIntent } from '@/lib/hexastra/orchestration/intentClassifier'
import { getIntentFieldMap } from '@/lib/hexastra/orchestrator/intentFieldMapping'
import { buildFusionContext } from '@/lib/hexastra/orchestrator/buildFusionContext'
import { arbitrateFusionSignals } from '@/lib/hexastra/orchestrator/arbitrateFusionSignals'

// ── Payload mock réaliste ──────────────────────────────────────────────────────
// Structure compatible avec les extracteurs de buildFusionContext

const MOCK_RAW_PAYLOAD: Record<string, unknown> = {
  // ── Astrologie (clé tropical → extraite par resolveStrictAstroContext) ──────
  tropical: {
    sun: 'Scorpion',
    moon: 'Bélier',
    ascendant: 'Balance',
    mercury: 'Scorpion',
    venus: 'Vierge',
    mars: 'Sagittaire',
    jupiter: 'Capricorne',
    saturn: 'Poissons',
  },

  // ── Human Design (clés camelCase reconnues par resolveHumanDesignCoreFields) ─
  type_hd: 'Projecteur',
  profil_hd: '2/4',
  autorite_hd: 'Autorité Émotionnelle',
  strategie_hd: "Attendre l'invitation",
  hdDefinition: 'Simple',
  hdIncarnationCross: 'Croix des Relations',
  hdDefinedCenters: ['Plexus Solaire', 'Cœur', 'Tête'],
  hdOpenCenters: ['Racine', 'Sacré', 'Gorge', 'G', 'Rate', 'Ajna'],

  // ── Numérologie ──────────────────────────────────────────────────────────────
  numerology: {
    chemin_de_vie: 7,
    annee_personnelle: 3,
    mois_personnel: 8,
    expression: 5,
    ame: 2,
  },

  // ── Ennéagramme ──────────────────────────────────────────────────────────────
  enneagram: {
    type_enn: 4,
    aile_enn: 3,
    instinct_enn: 'SP',
    peur: 'Ne pas avoir d\'identité propre',
    desir: 'Être authentique et unique',
    is_heuristic: false,
  },

  // ── Kua ──────────────────────────────────────────────────────────────────────
  kua: {
    nombre_kua: 6,
    element: 'Métal',
    direction_kua: 'Ouest, Nord-Ouest',
  },
}

// ── Séparateur visuel ─────────────────────────────────────────────────────────

function printSection(label: string, content: unknown) {
  const str = typeof content === 'string' ? content : JSON.stringify(content, null, 2)
  console.log(`\n  ▸ ${label}`)
  console.log(`    ${str.split('\n').join('\n    ')}`)
}

function banner(n: number, question: string) {
  console.log(`\n${'═'.repeat(70)}`)
  console.log(`  TEST ${String(n).padStart(2, '0')} — ${question}`)
  console.log('═'.repeat(70))
}

function printArbitration(a: ReturnType<typeof arbitrateFusionSignals>) {
  printSection('dominantDynamic', a.dominantDynamic)
  printSection('secondaryDynamic', a.secondaryDynamic || '(vide)')
  printSection('mainBlock', a.mainBlock)
  printSection('innerOuterGap', a.innerOuterGap)
  printSection('decisionStyle', a.decisionStyle || '(vide)')
  printSection('relationalPattern', a.relationalPattern || '(vide)')
  printSection('energyPattern', a.energyPattern || '(vide)')
  printSection('priorityAction', a.priorityAction)
  printSection('supportPoints', a.supportPoints)
  printSection('dominantModule', a.dominantModule)
  printSection('signalConfidence', a.signalConfidence)
  printSection('questionType', a.questionType)
  printSection('usedFields', a.usedFields)
  printSection('ignoredFields', a.ignoredFields)
  printSection('weightsApplied', a.weightsApplied)
  printSection('reliabilitySummary', a.reliabilitySummary)
}

// ── Helper ────────────────────────────────────────────────────────────────────

function runPipeline(question: string, lang = 'fr') {
  const intent = classifyUserIntent(question, null, false)
  const fieldMap = getIntentFieldMap(intent)
  const ctx = buildFusionContext(intent, MOCK_RAW_PAYLOAD, lang)
  const arbitration = arbitrateFusionSignals(ctx, lang)
  return { intent, fieldMap, ctx, arbitration }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Fusion Arbiter — Validation Priorité 2', () => {

  // ── TEST 01 — RELATION ─────────────────────────────────────────────────────
  it('01 — RELATION: Pourquoi je répète toujours les mêmes schémas amoureux ?', () => {
    const q = 'Pourquoi je répète toujours les mêmes schémas amoureux ?'
    banner(1, q)

    const { intent, fieldMap, ctx, arbitration } = runPipeline(q)

    printSection('INTENT DÉTECTÉ', intent)
    printSection('QUESTION TYPE (readingAngle)', fieldMap.readingAngleFr)
    printSection('MODULE DOMINANT', fieldMap.dominantModule)
    printSection('POIDS PAR MODULE', fieldMap.moduleWeights)
    printSection('CHAMPS PRIORITAIRES HD', fieldMap.priorityFields.human_design)
    printSection('CHAMPS PRIORITAIRES ASTRO', fieldMap.priorityFields.astrology)
    printSection('COMPLETENESS ctx', ctx.completeness)
    printSection('WARNINGS ctx', ctx.warnings)
    printArbitration(arbitration)

    // Assertions
    expect(['relationship', 'love']).toContain(intent)
    expect(arbitration.dominantDynamic).toBeTruthy()
    expect(arbitration.mainBlock.length).toBeGreaterThan(20)
    expect(arbitration.priorityAction).toBeTruthy()
    expect(arbitration.usedFields.length).toBeGreaterThan(0)
  })

  // ── TEST 02 — AMOUR ────────────────────────────────────────────────────────
  it('02 — AMOUR: Pourquoi mes relations ne durent pas ?', () => {
    const q = 'Pourquoi mes relations ne durent pas ?'
    banner(2, q)

    const { intent, fieldMap, ctx, arbitration } = runPipeline(q)

    printSection('INTENT DÉTECTÉ', intent)
    printSection('QUESTION TYPE', fieldMap.readingAngleFr)
    printSection('MODULE DOMINANT', fieldMap.dominantModule)
    printSection('POIDS', fieldMap.moduleWeights)
    printSection('COMPLETENESS', ctx.completeness)
    printArbitration(arbitration)

    expect(['love', 'relationship']).toContain(intent)
    expect(arbitration.dominantDynamic).toBeTruthy()
    expect(arbitration.relationalPattern).toBeTruthy()
    expect(arbitration.priorityAction).toBeTruthy()
  })

  // ── TEST 03 — DÉCISION ─────────────────────────────────────────────────────
  it('03 — DÉCISION: Est-ce que je dois changer de travail maintenant ?', () => {
    const q = 'Est-ce que je dois changer de travail maintenant ?'
    banner(3, q)

    const { intent, fieldMap, ctx, arbitration } = runPipeline(q)

    printSection('INTENT DÉTECTÉ', intent)
    printSection('QUESTION TYPE', fieldMap.readingAngleFr)
    printSection('MODULE DOMINANT', fieldMap.dominantModule)
    printSection('POIDS', fieldMap.moduleWeights)
    printSection('CHAMPS PRIORITAIRES HD', fieldMap.priorityFields.human_design)
    printSection('COMPLETENESS', ctx.completeness)
    printArbitration(arbitration)

    expect(['decision', 'work_money', 'timing']).toContain(intent)
    expect(arbitration.decisionStyle).toBeTruthy()
    expect(arbitration.dominantDynamic).toBeTruthy()
    expect(arbitration.priorityAction).toBeTruthy()
  })

  // ── TEST 04 — TRAVAIL / ARGENT ─────────────────────────────────────────────
  it('04 — TRAVAIL/ARGENT: Pourquoi je bloque dans mon activité ?', () => {
    const q = 'Pourquoi je bloque dans mon activité ?'
    banner(4, q)

    const { intent, fieldMap, ctx, arbitration } = runPipeline(q)

    printSection('INTENT DÉTECTÉ', intent)
    printSection('QUESTION TYPE', fieldMap.readingAngleFr)
    printSection('MODULE DOMINANT', fieldMap.dominantModule)
    printSection('POIDS', fieldMap.moduleWeights)
    printSection('COMPLETENESS', ctx.completeness)
    printArbitration(arbitration)

    expect(['work_money', 'blocage', 'inner_state']).toContain(intent)
    expect(arbitration.dominantDynamic).toBeTruthy()
    expect(arbitration.priorityAction).toBeTruthy()
  })

  // ── TEST 05 — BLOCAGE ──────────────────────────────────────────────────────
  it('05 — BLOCAGE: Je sens que je suis freiné, mais je ne comprends pas pourquoi', () => {
    const q = 'Je sens que je suis freiné, mais je ne comprends pas pourquoi'
    banner(5, q)

    const { intent, fieldMap, ctx, arbitration } = runPipeline(q)

    printSection('INTENT DÉTECTÉ', intent)
    printSection('QUESTION TYPE', fieldMap.readingAngleFr)
    printSection('MODULE DOMINANT', fieldMap.dominantModule)
    printSection('POIDS', fieldMap.moduleWeights)
    printSection('CHAMPS HD PRIORITAIRES', fieldMap.priorityFields.human_design)
    printSection('CHAMPS ENNÉAGRAMME PRIORITAIRES', fieldMap.priorityFields.enneagram)
    printSection('COMPLETENESS', ctx.completeness)
    printArbitration(arbitration)

    expect(['blocage', 'inner_state']).toContain(intent)
    expect(arbitration.dominantDynamic).toBeTruthy()
    expect(arbitration.mainBlock.length).toBeGreaterThan(20)
    expect(arbitration.priorityAction).toBeTruthy()
  })

  // ── TEST 06 — TIMING ───────────────────────────────────────────────────────
  it('06 — TIMING: Est-ce le bon moment pour lancer mon projet ?', () => {
    const q = 'Est-ce le bon moment pour lancer mon projet ?'
    banner(6, q)

    const { intent, fieldMap, ctx, arbitration } = runPipeline(q)

    printSection('INTENT DÉTECTÉ', intent)
    printSection('QUESTION TYPE', fieldMap.readingAngleFr)
    printSection('MODULE DOMINANT', fieldMap.dominantModule)
    printSection('POIDS', fieldMap.moduleWeights)
    printSection('CHAMPS NUMÉROLOGIE', fieldMap.priorityFields.numerology)
    printSection('COMPLETENESS', ctx.completeness)
    printArbitration(arbitration)

    expect(['timing', 'decision']).toContain(intent)
    expect(fieldMap.dominantModule).toBe('numerology')
    expect(arbitration.dominantDynamic).toBeTruthy()
    expect(arbitration.priorityAction).toBeTruthy()
  })

  // ── TEST 07 — IDENTITÉ ─────────────────────────────────────────────────────
  it('07 — IDENTITÉ: Comment je fonctionne réellement ?', () => {
    const q = 'Comment je fonctionne réellement ?'
    banner(7, q)

    const { intent, fieldMap, ctx, arbitration } = runPipeline(q)

    printSection('INTENT DÉTECTÉ', intent)
    printSection('QUESTION TYPE', fieldMap.readingAngleFr)
    printSection('MODULE DOMINANT', fieldMap.dominantModule)
    printSection('POIDS', fieldMap.moduleWeights)
    printSection('CHAMPS HD', fieldMap.priorityFields.human_design)
    printSection('COMPLETENESS', ctx.completeness)
    printArbitration(arbitration)

    expect(['identity', 'exact_profile', 'fusion_general_question']).toContain(intent)
    expect(arbitration.dominantDynamic).toBeTruthy()
    expect(arbitration.decisionStyle).toBeTruthy()
    expect(arbitration.energyPattern).toBeTruthy()
  })

  // ── TEST 08 — ÉTAT INTÉRIEUR ───────────────────────────────────────────────
  it('08 — ÉTAT INTÉRIEUR: Pourquoi je me sens instable émotionnellement ?', () => {
    const q = 'Pourquoi je me sens instable émotionnellement ?'
    banner(8, q)

    const { intent, fieldMap, ctx, arbitration } = runPipeline(q)

    printSection('INTENT DÉTECTÉ', intent)
    printSection('QUESTION TYPE', fieldMap.readingAngleFr)
    printSection('MODULE DOMINANT', fieldMap.dominantModule)
    printSection('POIDS', fieldMap.moduleWeights)
    printSection('COMPLETENESS', ctx.completeness)
    printArbitration(arbitration)

    expect(['inner_state', 'blocage']).toContain(intent)
    expect(arbitration.dominantDynamic).toBeTruthy()
    expect(arbitration.mainBlock.length).toBeGreaterThan(20)
    expect(arbitration.priorityAction).toBeTruthy()
  })

  // ── TEST 09 — PÉRIODE DE VIE ───────────────────────────────────────────────
  it("09 — PÉRIODE DE VIE: Qu'est-ce que je traverse en ce moment ?", () => {
    const q = "Qu'est-ce que je traverse en ce moment ?"
    banner(9, q)

    const { intent, fieldMap, ctx, arbitration } = runPipeline(q)

    printSection('INTENT DÉTECTÉ', intent)
    printSection('QUESTION TYPE', fieldMap.readingAngleFr)
    printSection('MODULE DOMINANT', fieldMap.dominantModule)
    printSection('POIDS', fieldMap.moduleWeights)
    printSection('CHAMPS NUMÉROLOGIE', fieldMap.priorityFields.numerology)
    printSection('COMPLETENESS', ctx.completeness)
    printArbitration(arbitration)

    expect(['life_period', 'inner_state', 'fusion_general_question']).toContain(intent)
    expect(arbitration.dominantDynamic).toBeTruthy()
    expect(arbitration.priorityAction).toBeTruthy()
  })

  // ── TEST 10 — LECTURE GÉNÉRALE ─────────────────────────────────────────────
  it('10 — LECTURE GÉNÉRALE: Fais-moi une lecture complète de ma situation actuelle', () => {
    const q = 'Fais-moi une lecture complète de ma situation actuelle'
    banner(10, q)

    const { intent, fieldMap, ctx, arbitration } = runPipeline(q)

    printSection('INTENT DÉTECTÉ', intent)
    printSection('QUESTION TYPE', fieldMap.readingAngleFr)
    printSection('MODULE DOMINANT', fieldMap.dominantModule)
    printSection('POIDS', fieldMap.moduleWeights)
    printSection('COMPLETENESS', ctx.completeness)
    printSection('FUSION CONFIDENCE', ctx.fusionConfidence)
    printArbitration(arbitration)

    expect(['fusion_general_question', 'exact_profile', 'life_period']).toContain(intent)
    expect(arbitration.dominantDynamic).toBeTruthy()
    expect(arbitration.supportPoints.length).toBeGreaterThan(0)
    expect(arbitration.usedFields.length).toBeGreaterThan(0)
  })

  // ── SYNTHÈSE GLOBALE ───────────────────────────────────────────────────────
  it('SYNTHÈSE — Détection des intents sur les 10 questions', () => {
    const questions = [
      { label: 'RELATION',       q: 'Pourquoi je répète toujours les mêmes schémas amoureux ?',         expected: ['relationship', 'love'] },
      { label: 'AMOUR',          q: 'Pourquoi mes relations ne durent pas ?',                             expected: ['love', 'relationship'] },
      { label: 'DÉCISION',       q: 'Est-ce que je dois changer de travail maintenant ?',                 expected: ['decision', 'work_money', 'timing'] },
      { label: 'TRAVAIL/ARGENT', q: 'Pourquoi je bloque dans mon activité ?',                            expected: ['work_money', 'blocage', 'inner_state'] },
      { label: 'BLOCAGE',        q: 'Je sens que je suis freiné, mais je ne comprends pas pourquoi',     expected: ['blocage', 'inner_state'] },
      { label: 'TIMING',         q: 'Est-ce le bon moment pour lancer mon projet ?',                     expected: ['timing', 'decision'] },
      { label: 'IDENTITÉ',       q: 'Comment je fonctionne réellement ?',                                expected: ['identity', 'exact_profile', 'fusion_general_question'] },
      { label: 'ÉTAT INTÉRIEUR', q: 'Pourquoi je me sens instable émotionnellement ?',                   expected: ['inner_state', 'blocage'] },
      { label: 'PÉRIODE DE VIE', q: "Qu'est-ce que je traverse en ce moment ?",                          expected: ['life_period', 'inner_state', 'fusion_general_question'] },
      { label: 'LECTURE GÉN.',   q: 'Fais-moi une lecture complète de ma situation actuelle',            expected: ['fusion_general_question', 'exact_profile', 'life_period'] },
    ]

    console.log('\n' + '═'.repeat(70))
    console.log('  SYNTHÈSE — DÉTECTION INTENT + DOMINANT MODULE + CONFIANCE')
    console.log('═'.repeat(70))
    console.log(`  ${'LABEL'.padEnd(16)} ${'INTENT'.padEnd(25)} ${'DOM.MODULE'.padEnd(15)} ${'CONFIANCE'.padEnd(10)} CHAMPS UTILISÉS`)
    console.log(`  ${'-'.repeat(16)} ${'-'.repeat(25)} ${'-'.repeat(15)} ${'-'.repeat(10)} ${'-'.repeat(20)}`)

    const results: { label: string; intent: string; ok: boolean; dominantModule: string; confidence: number; usedCount: number }[] = []

    for (const { label, q, expected } of questions) {
      const { intent, fieldMap, arbitration } = runPipeline(q)
      const ok = expected.includes(intent)
      results.push({
        label,
        intent,
        ok,
        dominantModule: arbitration.dominantModule,
        confidence: Math.round(arbitration.signalConfidence * 100),
        usedCount: arbitration.usedFields.length,
      })
      console.log(
        `  ${label.padEnd(16)} ${intent.padEnd(25)} ${arbitration.dominantModule.padEnd(15)} ${String(Math.round(arbitration.signalConfidence * 100) + '%').padEnd(10)} ${arbitration.usedFields.length} champs`
      )
      if (!ok) {
        console.log(`    ⚠ INTENT INATTENDU — attendu: [${expected.join('/')}] — obtenu: ${intent}`)
      }
    }

    console.log('\n  PROBLÈMES DÉTECTÉS :')
    const problems = results.filter(r => !r.ok)
    if (problems.length === 0) {
      console.log('  ✓ Aucun intent mal détecté')
    } else {
      for (const p of problems) {
        console.log(`  ✗ [${p.label}] intent incorrect: ${p.intent}`)
      }
    }

    const lowConf = results.filter(r => r.confidence < 50)
    if (lowConf.length > 0) {
      console.log('\n  CONFIANCE FAIBLE (< 50%) :')
      for (const r of lowConf) console.log(`    ✗ [${r.label}] ${r.confidence}%`)
    } else {
      console.log('  ✓ Confiance > 50% sur tous les tests')
    }

    const noFields = results.filter(r => r.usedCount === 0)
    if (noFields.length > 0) {
      console.log('\n  AUCUN CHAMP UTILISÉ :')
      for (const r of noFields) console.log(`    ✗ [${r.label}] 0 champs`)
    } else {
      console.log(`  ✓ Tous les tests utilisent des champs (min ${Math.min(...results.map(r => r.usedCount))} champs)`)
    }

    // Au moins 7 sur 10 doivent avoir le bon intent
    const okCount = results.filter(r => r.ok).length
    console.log(`\n  BILAN : ${okCount}/10 intents dans la plage acceptée`)
    expect(okCount).toBeGreaterThanOrEqual(7)
  })
})
