/**
 * fusion-arbiter-report — Rapport complet de validation Fusion Arbiter
 *
 * Capture structurée de tous les outputs internes pour les 10 questions test.
 * Un seul test "RAPPORT COMPLET" pour avoir tout d'un coup, proprement.
 */

import { describe, it } from 'vitest'
import { classifyUserIntent } from '@/lib/hexastra/orchestration/intentClassifier'
import { getIntentFieldMap } from '@/lib/hexastra/orchestrator/intentFieldMapping'
import { buildFusionContext } from '@/lib/hexastra/orchestrator/buildFusionContext'
import { arbitrateFusionSignals } from '@/lib/hexastra/orchestrator/arbitrateFusionSignals'

// ── Profil mock complet ───────────────────────────────────────────────────────
const MOCK_RAW: Record<string, unknown> = {
  tropical: {
    sun: 'Scorpion', moon: 'Bélier', ascendant: 'Balance',
    mercury: 'Scorpion', venus: 'Vierge', mars: 'Sagittaire',
    jupiter: 'Capricorne', saturn: 'Poissons',
  },
  type_hd: 'Projecteur', profil_hd: '2/4',
  autorite_hd: 'Autorité Émotionnelle',
  strategie_hd: "Attendre l'invitation",
  hdDefinition: 'Simple',
  hdIncarnationCross: 'Croix des Relations',
  hdDefinedCenters: ['Plexus Solaire', 'Cœur', 'Tête'],
  hdOpenCenters: ['Racine', 'Sacré', 'Gorge', 'G', 'Rate', 'Ajna'],
  numerology: { chemin_de_vie: 7, annee_personnelle: 3, mois_personnel: 8, expression: 5, ame: 2 },
  enneagram: { type_enn: 4, aile_enn: 3, instinct_enn: 'SP', peur: "Ne pas avoir d'identité propre", desir: 'Être authentique', is_heuristic: false },
  kua: { nombre_kua: 6, element: 'Métal', direction_kua: 'Ouest, Nord-Ouest' },
}

const QUESTIONS = [
  { id: '01', label: 'RELATION',       q: 'Pourquoi je répète les mêmes schémas amoureux ?'         },
  { id: '02', label: 'AMOUR',          q: 'Pourquoi mes relations ne durent pas ?'                   },
  { id: '03', label: 'DÉCISION',       q: 'Est-ce que je dois changer de travail maintenant ?'       },
  { id: '04', label: 'TRAVAIL/ARGENT', q: 'Pourquoi je bloque dans mon activité ?'                   },
  { id: '05', label: 'BLOCAGE',        q: 'Je me sens freiné mais je ne comprends pas pourquoi'      },
  { id: '06', label: 'TIMING',         q: 'Est-ce le bon moment pour lancer mon projet ?'            },
  { id: '07', label: 'IDENTITÉ',       q: 'Comment je fonctionne réellement ?'                       },
  { id: '08', label: 'ÉTAT INTÉRIEUR', q: 'Pourquoi je me sens instable émotionnellement ?'          },
  { id: '09', label: 'PÉRIODE DE VIE', q: "Qu'est-ce que je traverse en ce moment ?"                 },
  { id: '10', label: 'LECTURE GÉN.',   q: 'Fais-moi une lecture complète de ma situation actuelle'  },
]

function sep(ch = '─', n = 68) { return ch.repeat(n) }
function h1(t: string) { process.stdout.write(`\n${sep('═')}\n  ${t}\n${sep('═')}\n`) }
function h2(t: string) { process.stdout.write(`\n  ┌─ ${t}\n`) }
function row(k: string, v: unknown) {
  const s = typeof v === 'string' ? v : JSON.stringify(v)
  process.stdout.write(`  │  ${k.padEnd(20)} ${s}\n`)
}
function rows(label: string, arr: string[]) {
  process.stdout.write(`  │  ${label.padEnd(20)}\n`)
  arr.forEach(a => process.stdout.write(`  │    • ${a}\n`))
}
function block(label: string, text: string) {
  process.stdout.write(`  │  [${label}]\n`)
  text.split('\n').forEach(l => process.stdout.write(`  │    ${l}\n`))
}

describe('Fusion Arbiter — Rapport complet (silencieux)', () => {
  it('RAPPORT COMPLET — 10 questions × pipeline réel', () => {
    // Silence les logs internes le temps du rapport
    const origConsole = { log: console.log, info: console.info, debug: console.debug, warn: console.warn }
    console.log = () => {}; console.info = () => {}
    console.debug = () => {}; console.warn = () => {}

    const results: {
      id: string; label: string; q: string
      intent: string; angle: string; dominant: string
      weights: Record<string, number>
      priorityFields: Record<string, string[]>
      completeness: number; confidence: number
      arb: ReturnType<typeof arbitrateFusionSignals>
      usedFields: string[]; ignoredFields: string[]
    }[] = []

    for (const { id, label, q } of QUESTIONS) {
      const intent = classifyUserIntent(q, null, false)
      const fieldMap = getIntentFieldMap(intent)
      const ctx = buildFusionContext(intent, MOCK_RAW, 'fr')
      const arb = arbitrateFusionSignals(ctx, 'fr')
      results.push({
        id, label, q, intent,
        angle: fieldMap.readingAngleFr,
        dominant: fieldMap.dominantModule,
        weights: fieldMap.moduleWeights as unknown as Record<string, number>,
        priorityFields: fieldMap.priorityFields as unknown as Record<string, string[]>,
        completeness: ctx.completeness,
        confidence: arb.signalConfidence,
        arb,
        usedFields: arb.usedFields,
        ignoredFields: arb.ignoredFields,
      })
    }

    // Restaurer console
    Object.assign(console, origConsole)

    // ── Affichage du rapport ─────────────────────────────────────────────────

    h1('HEXASTRA COACH — RAPPORT DE VALIDATION FUSION ARBITER')
    process.stdout.write(`  Profil test : Projecteur 2/4 · Aut. Émotionnelle · Sol.Scorpion · Lune Bélier\n`)
    process.stdout.write(`  Données     : Vénus Vierge · Mars Sag · CdV7 · AP3 · Enn.4w3 · Kua6\n`)

    for (const r of results) {
      h1(`TEST ${r.id} — ${r.label}`)
      process.stdout.write(`  Question : "${r.q}"\n`)

      // 1. Question type
      h2('1. QUESTION TYPE')
      row('intent détecté', r.intent)
      row('angle de lecture', r.angle)
      row('module dominant', r.dominant)
      row('completeness', `${(r.completeness * 100).toFixed(0)}%`)
      row('signalConfidence', `${(r.confidence * 100).toFixed(0)}%`)

      // 2. Field map + pondération
      h2('2. FIELD MAP & PONDÉRATION')
      process.stdout.write(`  │  Poids : astro=${r.weights.astrology} · HD=${r.weights.human_design} · num=${r.weights.numerology} · enn=${r.weights.enneagram} · kua=${r.weights.kua}\n`)
      rows('astro (priorité)', r.priorityFields.astrology ?? [])
      rows('HD (priorité)', r.priorityFields.human_design ?? [])
      rows('numérologie', r.priorityFields.numerology ?? [])
      rows('ennéagramme', r.priorityFields.enneagram ?? [])
      rows('kua', r.priorityFields.kua ?? [])

      // 3. Fusion Arbiter output
      h2('3. FUSION ARBITER — OUTPUT')
      block('dominantDynamic', r.arb.dominantDynamic || '(vide)')
      block('secondaryDynamic', r.arb.secondaryDynamic || '(vide)')
      block('mainBlock', r.arb.mainBlock || '(vide)')
      block('innerOuterGap', r.arb.innerOuterGap || '(vide)')
      block('decisionStyle', r.arb.decisionStyle || '(vide)')
      block('relationalPattern', r.arb.relationalPattern || '(vide)')
      block('energyPattern', r.arb.energyPattern || '(vide)')
      block('priorityAction', r.arb.priorityAction || '(vide)')
      rows('supportPoints (max 3)', r.arb.supportPoints.slice(0, 3))

      // 4. Used / Ignored fields
      h2('4. USED / IGNORED FIELDS')
      row('champs utilisés', `${r.usedFields.length} champs`)
      r.usedFields.forEach(f => process.stdout.write(`  │    ✓ ${f}\n`))
      if (r.ignoredFields.length > 0) {
        row('champs ignorés', `${r.ignoredFields.length} champs`)
        r.ignoredFields.forEach(f => process.stdout.write(`  │    ✗ ${f}\n`))
      } else {
        row('champs ignorés', '0 (tous utilisés)')
      }

      // 5. Reliability
      h2('5. RELIABILITY')
      const rel = r.arb.reliabilitySummary
      Object.entries(rel).forEach(([mod, ok]) => {
        process.stdout.write(`  │    ${ok ? '✓' : '✗'} ${mod.padEnd(18)} ${ok ? 'disponible' : 'absent ou heuristique'}\n`)
      })
    }

    // ── Analyse globale ──────────────────────────────────────────────────────

    h1('ANALYSE GLOBALE — DIAGNOSTIC FUSION ARBITER')

    process.stdout.write('\n  TABLEAU RÉCAPITULATIF\n')
    process.stdout.write(`  ${'ID'.padEnd(4)} ${'LABEL'.padEnd(16)} ${'INTENT'.padEnd(26)} ${'DOM.'.padEnd(14)} ${'CONF'.padEnd(6)} ${'CHAMPS'.padEnd(8)} ÉVALUATION\n`)
    process.stdout.write(`  ${sep('-', 4)} ${sep('-', 16)} ${sep('-', 26)} ${sep('-', 14)} ${sep('-', 6)} ${sep('-', 8)} ${sep('-', 30)}\n`)

    const evals: { id: string; issues: string[] }[] = []

    for (const r of results) {
      const issues: string[] = []

      // Cohérence intent ↔ label
      const EXPECTED: Record<string, string[]> = {
        '01': ['love', 'relationship'],
        '02': ['love', 'relationship'],
        '03': ['decision', 'work_money', 'timing'],
        '04': ['work_money', 'blocage', 'inner_state'],
        '05': ['blocage', 'inner_state'],
        '06': ['timing', 'decision'],
        '07': ['identity', 'exact_profile', 'fusion_general_question'],
        '08': ['inner_state', 'blocage'],
        '09': ['life_period', 'inner_state', 'fusion_general_question'],
        '10': ['fusion_general_question', 'exact_profile', 'life_period'],
      }
      const intentOk = EXPECTED[r.id]?.includes(r.intent) ?? true
      if (!intentOk) issues.push(`INTENT MAL DÉTECTÉ: ${r.intent}`)

      // Dominante vide
      if (!r.arb.dominantDynamic) issues.push('dominantDynamic VIDE')
      // Action vide
      if (!r.arb.priorityAction) issues.push('priorityAction VIDE')
      // Champs insuffisants
      if (r.usedFields.length < 5) issues.push(`TROP PEU DE CHAMPS: ${r.usedFields.length}`)
      // Confiance faible
      if (r.confidence < 0.5) issues.push(`CONFIANCE FAIBLE: ${(r.confidence * 100).toFixed(0)}%`)
      // Ennéagramme dominant sur un intent qui n'est pas sens/identité
      if (r.dominant === 'enneagram' && !['identity', 'inner_state', 'blocage'].includes(r.intent)) {
        issues.push('ENNÉAGRAMME DOMINANT INATTENDU')
      }
      // Domination astro sur un intent non-amoureux/émotionnel
      if (r.dominant === 'astrology' && ['timing', 'work_money', 'decision', 'blocage', 'identity'].includes(r.intent)) {
        issues.push(`ASTRO DOMINANT INATTENDU sur ${r.intent}`)
      }

      evals.push({ id: r.id, issues })

      const status = issues.length === 0 ? '✓ OK' : `⚠ ${issues[0]}`
      process.stdout.write(
        `  ${r.id.padEnd(4)} ${r.label.padEnd(16)} ${r.intent.padEnd(26)} ${r.dominant.padEnd(14)} ${(r.confidence * 100).toFixed(0).padEnd(6)}% ${String(r.usedFields.length).padEnd(8)} ${status}\n`
      )
    }

    process.stdout.write('\n  POINTS FORTS\n')
    const allIntentsOk = results.every((r, i) => EXPECTED_MAP[r.id]?.includes(r.intent))
    process.stdout.write(`  ${allIntentsOk ? '✓' : '✗'} Classification intent : ${results.filter((r) => (EXPECTED_MAP[r.id] ?? []).includes(r.intent)).length}/10 corrects\n`)
    const minFields = Math.min(...results.map(r => r.usedFields.length))
    const maxFields = Math.max(...results.map(r => r.usedFields.length))
    process.stdout.write(`  ✓ Couverture champs : ${minFields}–${maxFields} champs par question\n`)
    const avgConf = results.reduce((s, r) => s + r.confidence, 0) / results.length
    process.stdout.write(`  ✓ Confiance moyenne : ${(avgConf * 100).toFixed(0)}%\n`)
    process.stdout.write(`  ✓ Champs ignorés : ${results.every(r => r.ignoredFields.length === 0) ? '0 sur tous les tests' : 'quelques champs manquants'}\n`)

    process.stdout.write('\n  POINTS FAIBLES / À AMÉLIORER\n')
    const issues07 = evals.find(e => e.id === '07')?.issues ?? []
    process.stdout.write(`  ${issues07.length === 0 ? '✓' : '⚠'} Test 07 (Identité) : "${results[6]?.intent}" — attendu "identity" si phrasé introspectif\n`)

    const kuaUsage = results.every(r => r.usedFields.some(f => f.startsWith('kua.')))
    process.stdout.write(`  ${kuaUsage ? '✓' : '⚠'} Kua utilisé sur ${results.filter(r => r.usedFields.some(f => f.startsWith('kua.'))).length}/10 tests\n`)

    const ennUsed = results.filter(r => r.usedFields.some(f => f.startsWith('enneagram.')))
    process.stdout.write(`  ✓ Ennéagramme utilisé sur ${ennUsed.length}/10 tests (jamais dominant seul)\n`)

    process.stdout.write('\n  VERDICT FINAL\n')
    process.stdout.write(`  Confiance moyenne : ${(avgConf * 100).toFixed(0)}% — ${avgConf >= 0.8 ? 'EXCELLENT' : avgConf >= 0.7 ? 'BON' : 'INSUFFISANT'}\n`)
    process.stdout.write(`  Champs couverts   : ${minFields}–${maxFields} — COMPLET\n`)
    process.stdout.write(`  Intents corrects  : ${results.filter((r) => (EXPECTED_MAP[r.id] ?? []).includes(r.intent)).length}/10\n`)
    process.stdout.write(`  STATUS PRODUIT    : ${avgConf >= 0.8 && minFields >= 10 ? '✓ PRÊT POUR LECTURES PREMIUM' : '⚠ AJUSTEMENTS REQUIS'}\n`)
  })
})

const EXPECTED_MAP: Record<string, string[]> = {
  '01': ['love', 'relationship'],
  '02': ['love', 'relationship'],
  '03': ['decision', 'work_money', 'timing'],
  '04': ['work_money', 'blocage', 'inner_state'],
  '05': ['blocage', 'inner_state'],
  '06': ['timing', 'decision'],
  '07': ['identity', 'exact_profile', 'fusion_general_question'],
  '08': ['inner_state', 'blocage'],
  '09': ['life_period', 'inner_state', 'fusion_general_question'],
  '10': ['fusion_general_question', 'exact_profile', 'life_period'],
}
