/**
 * readingTestSuite — Hexastra Coach
 *
 * Suite de tests automatisés pour valider la qualité des lectures fusion.
 * Teste les fonctions de détection (zone, phase, normalisation, QA) avec
 * des contextes de fusion mockés représentant des profils réels variés.
 *
 * Usage :
 *   import { runReadingTests } from './readingTestSuite'
 *   const results = runReadingTests()
 *   console.log(results.summary)
 */

import { normalizeSignals } from './normalizeSignals'
import { detectFusionPhase, type FusionPhaseType } from './detectFusionPhase'
import { detectDominantZone, type ZoneHint } from './detectDominantZone'
import { qaFusionCheck } from './qaFusionCheck'
import { getIntentFieldMap } from './intentFieldMapping'
import type { FusionContext, FusionArbitration, FusionModuleData } from './buildFusionContext'
import type { IntentModule } from './intentFieldMapping'

// ── Types ──────────────────────────────────────────────────────────────────────

export type TestCaseResult = {
  id: string
  description: string
  passed: boolean
  expected: { zone: ZoneHint; phase: FusionPhaseType; minCoherence: number }
  actual: { zone: ZoneHint; phase: FusionPhaseType; coherence: number; signalCount: number }
  failures: string[]
}

export type TestSuiteResult = {
  totalTests: number
  passed: number
  failed: number
  passRate: number
  results: TestCaseResult[]
  summary: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function emptyModule(): FusionModuleData {
  return { available: false, weight: 0, fields: {} }
}

function makeModule(weight: number, fields: Record<string, string | number | string[] | null>): FusionModuleData {
  return { available: true, weight, fields }
}

/**
 * Fabrique un FusionContext mocké pour les tests.
 * Simule buildFusionContext() avec des données contrôlées.
 */
function makeMockFusionContext(
  intent: string,
  modules: {
    astrology?: FusionModuleData
    human_design?: FusionModuleData
    numerology?: FusionModuleData
    enneagram?: FusionModuleData
    kua?: FusionModuleData
  },
  overrides?: { completeness?: number; fusionConfidence?: number },
): FusionContext {
  const mapping = getIntentFieldMap(intent)
  const astrology = modules.astrology ?? emptyModule()
  const human_design = modules.human_design ?? emptyModule()
  const numerology = modules.numerology ?? emptyModule()
  const enneagram = modules.enneagram ?? emptyModule()
  const kua = modules.kua ?? emptyModule()

  const modulesActivated: IntentModule[] = (
    ['astrology', 'human_design', 'numerology', 'enneagram', 'kua'] as IntentModule[]
  ).filter((m) => {
    if (m === 'astrology') return astrology.available
    if (m === 'human_design') return human_design.available
    if (m === 'numerology') return numerology.available
    if (m === 'enneagram') return enneagram.available
    if (m === 'kua') return kua.available
    return false
  })

  const completeness = overrides?.completeness ?? Math.min(1, modulesActivated.length / 3)
  const fusionConfidence = overrides?.fusionConfidence ?? completeness * 0.8

  return {
    intent,
    readingAngle: mapping.readingAngleFr,
    readingQuestion: mapping.readingQuestion,
    modulesActivated,
    dominantModule: mapping.dominantModule,
    modules: { astrology, human_design, numerology, enneagram, kua },
    completeness,
    fusionConfidence,
    confidenceBreakdown: Object.fromEntries(
      modulesActivated.map((m) => [m, modules[m]?.weight ?? 0]),
    ) as Partial<Record<IntentModule, number>>,
    warnings: [],
    mapping,
  }
}

/** Arbitration minimale pour les tests QA */
function makeArbitration(overrides?: Partial<FusionArbitration>): FusionArbitration {
  return {
    dominantDynamic: 'Test dynamic',
    secondaryDynamic: '',
    mainBlock: 'Test main block description',
    innerOuterGap: 'Test inner outer gap',
    priorityAction: 'Test priority action',
    supportPoints: ['support 1'],
    decisionStyle: '',
    relationalPattern: '',
    energyPattern: '',
    dominantModule: 'human_design',
    signalConfidence: 0.75,
    questionType: 'fusion_general_question',
    usedFields: [],
    ignoredFields: [],
    weightsApplied: {},
    reliabilitySummary: {},
    ...overrides,
  }
}

// ── Cas de test ────────────────────────────────────────────────────────────────

type TestCase = {
  id: string
  description: string
  ctx: FusionContext
  expected: { zone: ZoneHint; phase: FusionPhaseType; minCoherence: number }
}

const TEST_CASES: TestCase[] = [
  // ── TC01 : Projecteur, intent=decision → zone=direction, phase=activation ─
  {
    id: 'TC01',
    description: 'Projecteur HD + année 1 + intent decision → direction + activation',
    ctx: makeMockFusionContext(
      'decision',
      {
        human_design: makeModule(0.95, { hdType: 'Projecteur', hdAuthority: 'Emotionnel', hdStrategy: 'Attendre l\'invitation' }),
        numerology: makeModule(0.72, { lifePath: 3, personalYear: 1 }),
        astrology: makeModule(0.80, { sunSign: 'Gémeaux', moonSign: 'Capricorne', saturnSign: 'Bélier' }),
      },
      { completeness: 0.85, fusionConfidence: 0.74 },
    ),
    expected: { zone: 'direction', phase: 'activation', minCoherence: 0.6 },
  },

  // ── TC02 : intent=relationship + Vénus Balance → zone=relation ───────────
  {
    id: 'TC02',
    description: 'Générateur + Vénus Balance + intent relationship → relation',
    ctx: makeMockFusionContext(
      'relationship',
      {
        human_design: makeModule(0.90, { hdType: 'Générateur', hdAuthority: 'Sacral', hdProfile: '2/4' }),
        astrology: makeModule(0.85, { sunSign: 'Taureau', moonSign: 'Cancer', venusSign: 'Balance' }),
        enneagram: makeModule(0.72, { enneagramType: 2, enneagramWing: '3' }),
      },
      { completeness: 0.78, fusionConfidence: 0.68 },
    ),
    expected: { zone: 'relation', phase: 'stabilisation', minCoherence: 0.55 },
  },

  // ── TC03 : intent=inner_state + Lune Scorpion → zone=securite ────────────
  {
    id: 'TC03',
    description: 'Lune Scorpion + inner_state → securite + phase selon cycles',
    ctx: makeMockFusionContext(
      'inner_state',
      {
        astrology: makeModule(0.90, { sunSign: 'Vierge', moonSign: 'Scorpion', dominantElements: ['Eau', 'Terre'] }),
        human_design: makeModule(0.85, { hdType: 'Réflecteur', hdAuthority: 'Lunaire' }),
        numerology: makeModule(0.62, { lifePath: 7, personalYear: 4, personalMonth: 2 }),
      },
      { completeness: 0.82, fusionConfidence: 0.71 },
    ),
    expected: { zone: 'securite', phase: 'stabilisation', minCoherence: 0.55 },
  },

  // ── TC04 : intent=fusion_general + chemin 11 → zone=identite + sens ──────
  {
    id: 'TC04',
    description: 'Chemin maître 11 + fusion_general → identite, sens en secondaire',
    ctx: makeMockFusionContext(
      'fusion_general_question',
      {
        human_design: makeModule(0.85, { hdType: 'Manifesteur', hdProfile: '1/3', hdAuthority: 'Ego' }),
        numerology: makeModule(0.68, { lifePath: 11, personalYear: 9 }),
        enneagram: makeModule(0.45, { enneagramType: 4 }),
      },
      { completeness: 0.72, fusionConfidence: 0.63 },
    ),
    expected: { zone: 'identite', phase: 'transition', minCoherence: 0.5 },
  },

  // ── TC05 : Générateur Manifestant + Feu/Air → expansion forte ────────────
  {
    id: 'TC05',
    description: 'Générateur Manifestant + éléments Feu/Air + année 5 → expansion + activation',
    ctx: makeMockFusionContext(
      'fusion_general_question',
      {
        human_design: makeModule(0.85, { hdType: 'Générateur Manifestant', hdAuthority: 'Sacral', hdProfile: '3/5' }),
        astrology: makeModule(0.85, { sunSign: 'Lion', moonSign: 'Bélier', dominantElements: ['Feu', 'Air'] }),
        numerology: makeModule(0.68, { lifePath: 5, personalYear: 5 }),
      },
      { completeness: 0.88, fusionConfidence: 0.77 },
    ),
    expected: { zone: 'identite', phase: 'activation', minCoherence: 0.6 },
  },

  // ── TC06 : Données minimales (free user) → QA doit passer avec warning ───
  {
    id: 'TC06',
    description: 'Données partielles (1 module) → QA fail avec blockers',
    ctx: makeMockFusionContext(
      'decision',
      {
        human_design: makeModule(0.70, { hdType: 'Projecteur', hdAuthority: 'Splénique' }),
      },
      { completeness: 0.25, fusionConfidence: 0.18 },
    ),
    expected: { zone: 'direction', phase: 'stabilisation', minCoherence: 0.0 },
  },

  // ── TC07 : Ennéagramme heuristique → signal pénalisé, confiance réduite ──
  {
    id: 'TC07',
    description: 'Ennéagramme heuristique → risk_flag + confiance réduite',
    ctx: makeMockFusionContext(
      'inner_state',
      {
        astrology: makeModule(0.90, { sunSign: 'Poissons', moonSign: 'Verseau', dominantElements: ['Eau', 'Air'] }),
        human_design: makeModule(0.85, { hdType: 'Projecteur', hdAuthority: 'Ajna' }),
        enneagram: makeModule(0.39, { enneagramType: 9 }, ),  // poids réduit = heuristique
        numerology: makeModule(0.62, { lifePath: 2, personalYear: 6 }),
      },
      { completeness: 0.75, fusionConfidence: 0.62 },
    ),
    expected: { zone: 'securite', phase: 'transition', minCoherence: 0.5 },
  },

  // ── TC08 : Exact profile → identite + sens en secondaire ─────────────────
  {
    id: 'TC08',
    description: 'exact_profile intent → identite dominante, tous modules actifs',
    ctx: makeMockFusionContext(
      'exact_profile',
      {
        astrology: makeModule(0.80, { sunSign: 'Capricorne', moonSign: 'Lion', risingSign: 'Scorpion', marsSign: 'Sagittaire' }),
        human_design: makeModule(0.90, { hdType: 'Générateur', hdProfile: '4/6', hdAuthority: 'Sacral', hdDefinedCenters: 'Racine, Sacral, Coeur' }),
        numerology: makeModule(0.70, { lifePath: 8, personalYear: 3, personalMonth: 7 }),
        enneagram: makeModule(0.60, { enneagramType: 8, enneagramWing: '7' }),
        kua: makeModule(0.32, { kua: 2 }),
      },
      { completeness: 0.92, fusionConfidence: 0.81 },
    ),
    expected: { zone: 'identite', phase: 'transition', minCoherence: 0.65 },
  },
]

// ── Runner ─────────────────────────────────────────────────────────────────────

/**
 * Exécute tous les cas de test de la suite de lectures fusion.
 * Retourne les résultats structurés avec log HEXASTRA_TEST_RESULT par cas.
 */
export function runReadingTests(
  logFn?: (event: string, data: Record<string, unknown>) => void,
): TestSuiteResult {
  const results: TestCaseResult[] = []

  for (const tc of TEST_CASES) {
    const failures: string[] = []

    // Exécuter le pipeline de détection
    const signals = normalizeSignals(tc.ctx)
    const phaseResult = detectFusionPhase(tc.ctx, signals)
    const zoneResult = detectDominantZone(tc.ctx, signals)
    const arbitration = makeArbitration()
    const qa = qaFusionCheck(tc.ctx, signals, arbitration, phaseResult, zoneResult)

    // Vérifications
    if (zoneResult.zone !== tc.expected.zone) {
      failures.push(`zone: attendu="${tc.expected.zone}" obtenu="${zoneResult.zone}"`)
    }
    if (phaseResult.phase !== tc.expected.phase) {
      failures.push(`phase: attendu="${tc.expected.phase}" obtenu="${phaseResult.phase}"`)
    }
    if (qa.coherenceScore < tc.expected.minCoherence) {
      failures.push(
        `coherence: attendu≥${tc.expected.minCoherence} obtenu=${qa.coherenceScore}`,
      )
    }

    const result: TestCaseResult = {
      id: tc.id,
      description: tc.description,
      passed: failures.length === 0,
      expected: tc.expected,
      actual: {
        zone: zoneResult.zone,
        phase: phaseResult.phase,
        coherence: qa.coherenceScore,
        signalCount: signals.length,
      },
      failures,
    }

    results.push(result)

    // Log structuré si logFn fournie
    logFn?.('HEXASTRA_TEST_RESULT', {
      testId: tc.id,
      description: tc.description,
      passed: result.passed,
      expected: result.expected,
      actual: result.actual,
      failures: result.failures,
      qaWarnings: qa.warnings,
      qaBlockers: qa.blockers,
    })
  }

  const passed = results.filter((r) => r.passed).length
  const failed = results.length - passed
  const passRate = results.length > 0 ? Math.round((passed / results.length) * 100) : 0

  const failedIds = results.filter((r) => !r.passed).map((r) => r.id)
  const summary =
    failedIds.length === 0
      ? `✓ ${passed}/${results.length} tests passés (${passRate}%)`
      : `${passed}/${results.length} tests passés (${passRate}%) — Échecs: ${failedIds.join(', ')}`

  return { totalTests: results.length, passed, failed, passRate, results, summary }
}
