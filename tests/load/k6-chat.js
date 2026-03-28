/**
 * k6-chat.js — Test de charge Hexastra Coach
 *
 * ENDPOINT CIBLÉ : POST /api/chat
 *
 * SCÉNARIOS DISPONIBLES (passer via --env SCENARIO=xxx) :
 *   smoke       → validation minimale, 1 VU, 1 min
 *   baseline    → charge normale, montée progressive jusqu'à 50 VU
 *   stress      → montée jusqu'au point de rupture (~200 VU)
 *   spike       → pic brutal (0→300 VU en 30s, retour rapide)
 *   soak        → charge constante sur 30 min (détecte les fuites mémoire)
 *
 * USAGE :
 *   k6 run --env SCENARIO=baseline --env BASE_URL=https://your-site.com --env AUTH_TOKEN=xxx k6-chat.js
 *
 * VARIABLES D'ENVIRONNEMENT :
 *   BASE_URL      URL de base du site (ex: https://hexastra-coach.vercel.app)
 *   AUTH_TOKEN    Valeur du cookie sb-access-token (session Supabase)
 *   SCENARIO      smoke | baseline | stress | spike | soak (défaut: baseline)
 *   PLAN          free | essential | premium | practitioner (défaut: free)
 *
 * HYPOTHÈSE : le token AUTH_TOKEN est un JWT Supabase valide obtenu via la console
 * ou via le flow d'auth normal. Sans token, la route retournera 401 ou plan=free sans userId.
 */

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js'

// ── Métriques personnalisées ─────────────────────────────────────────────────

const errorRate          = new Rate('chat_error_rate')
const timeoutRate        = new Rate('chat_timeout_rate')
const openaiLatency      = new Trend('openai_response_latency', true)
const supabaseLatency    = new Trend('quota_check_latency', true)
const chatDuration       = new Trend('chat_full_duration', true)
const successfulRequests = new Counter('chat_successful_requests')
const quotaHits          = new Counter('chat_quota_hits')
const serverErrors       = new Counter('chat_5xx_errors')

// ── Configuration des scénarios ───────────────────────────────────────────────

const SCENARIO = __ENV.SCENARIO || 'baseline'
const BASE_URL  = __ENV.BASE_URL  || 'http://localhost:3000'
const AUTH_TOKEN = __ENV.AUTH_TOKEN || ''
const PLAN = __ENV.PLAN || 'free'

const SCENARIOS = {

  // SMOKE : 1 VU, 2 min — vérification que tout fonctionne avant les vrais tests
  smoke: {
    executor: 'constant-vus',
    vus: 1,
    duration: '2m',
    gracefulStop: '30s',
  },

  // BASELINE : charge nominale, montée progressive
  // Simule une heure de trafic normal avec ramp-up
  // Cible : 50 VU = ~150 req/min (3 req/VU/min avec sleep 20s)
  baseline: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m',  target: 10  },  // Montée douce
      { duration: '5m',  target: 30  },  // Palier intermédiaire
      { duration: '5m',  target: 50  },  // Charge nominale
      { duration: '5m',  target: 50  },  // Maintien
      { duration: '2m',  target: 0   },  // Descente
    ],
    gracefulRampDown: '30s',
  },

  // STRESS : montée progressive jusqu'au point de rupture
  // Objectif : identifier à quel VU-count les erreurs commencent
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m',  target: 20  },
      { duration: '3m',  target: 50  },
      { duration: '3m',  target: 100 },
      { duration: '3m',  target: 150 },
      { duration: '3m',  target: 200 },
      { duration: '3m',  target: 250 },
      { duration: '5m',  target: 250 },  // Maintien au peak
      { duration: '2m',  target: 0   },
    ],
    gracefulRampDown: '30s',
  },

  // SPIKE : pic brutal simulant un lancement/événement
  // 0 → 300 VU en 30s, retour rapide
  spike: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: 5   },  // Baseline normale
      { duration: '30s', target: 300 },  // SPIKE brutal
      { duration: '3m',  target: 300 },  // Maintien pic
      { duration: '1m',  target: 5   },  // Retour normal
      { duration: '2m',  target: 5   },  // Vérifier récupération
      { duration: '30s', target: 0   },
    ],
    gracefulRampDown: '30s',
  },

  // SOAK : charge constante sur durée longue
  // Objectif : détecter fuites mémoire, dégradation progressive, cache saturation
  soak: {
    executor: 'constant-vus',
    vus: 30,
    duration: '30m',
    gracefulStop: '1m',
  },
}

// Export de la config k6 — utilise le scénario choisi
export const options = {
  scenarios: {
    [SCENARIO]: SCENARIOS[SCENARIO] || SCENARIOS.baseline,
  },

  // ── Seuils de validation ────────────────────────────────────────────────────
  // STATUTS :
  //   ✅ Acceptable  : p95 < 15s (OpenAI natif peut prendre 10-15s)
  //   ⚠️  Fragile     : p95 entre 15s et 25s
  //   🔴 Critique    : p95 > 25s, erreurs > 5%, timeouts > 3%
  thresholds: {
    // Durée globale de la requête /api/chat
    'chat_full_duration':         ['p(95)<15000', 'p(99)<25000'],

    // Taux d'erreur HTTP (4xx + 5xx)
    'chat_error_rate':            ['rate<0.05'],     // < 5% erreurs

    // Timeouts (status 504 ou erreur réseau)
    'chat_timeout_rate':          ['rate<0.03'],     // < 3% timeouts

    // Métriques k6 natives
    'http_req_duration':          ['p(95)<20000'],   // p95 < 20s (marge OpenAI)
    'http_req_failed':            ['rate<0.05'],     // < 5% échecs réseau

    // TBD: latence interne Supabase estimée (si header custom injecté)
    // 'quota_check_latency':     ['p(95)<500'],
  },

  // Headers de suivi pour débogage
  userAgent: 'k6-hexastra-load-test/1.0',
}

// ── Données de test ───────────────────────────────────────────────────────────
// Questions réalistes couvrant les 5 intents principaux

const TEST_QUESTIONS = [
  // Intent: general / lecture complète
  'Fais-moi une lecture de ma situation actuelle',
  'Dis-moi ce qui se passe en ce moment pour moi',
  'Quelle est ma dynamique principale en ce moment ?',

  // Intent: blocage
  "Pourquoi je n'arrive pas à avancer dans mon projet ?",
  'Je bloque depuis des semaines, qu\'est-ce qui se passe ?',
  "Pourquoi les choses n'avancent pas dans ma vie pro ?",

  // Intent: relation / love
  'Comment fonctionne ma relation amoureuse en ce moment ?',
  'Pourquoi les gens ne me comprennent pas ?',
  'Pourquoi j\'ai du mal à me connecter aux autres ?',

  // Intent: timing / décision
  'Est-ce le bon moment pour lancer mon projet ?',
  'Est-ce que je dois changer de travail maintenant ?',
  'Comment décider si je dois déménager ?',

  // Intent: identity
  'Comment est-ce que je fonctionne vraiment ?',
  'Quelles sont mes forces et mes zones de friction ?',
  'Explique-moi mon mode de fonctionnement',
]

// Profils de naissance fictifs pour simuler des utilisateurs différents
const TEST_BIRTH_PROFILES = [
  {
    birthDate: '1988-05-14',
    birthTime: '14:30',
    birthPlace: 'Paris',
    birthLat: 48.8566,
    birthLon: 2.3522,
    timezone: 'Europe/Paris',
  },
  {
    birthDate: '1992-11-03',
    birthTime: '08:15',
    birthPlace: 'Lyon',
    birthLat: 45.7640,
    birthLon: 4.8357,
    timezone: 'Europe/Paris',
  },
  {
    birthDate: '1985-02-28',
    birthTime: '22:00',
    birthPlace: 'Marseille',
    birthLat: 43.2965,
    birthLon: 5.3698,
    timezone: 'Europe/Paris',
  },
  {
    birthDate: '1995-07-19',
    birthTime: '06:45',
    birthPlace: 'Bordeaux',
    birthLat: 44.8378,
    birthLon: -0.5792,
    timezone: 'Europe/Paris',
  },
]

// ── Headers ───────────────────────────────────────────────────────────────────

function buildHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }

  // Authentification via cookie Supabase si token fourni
  if (AUTH_TOKEN) {
    headers['Cookie'] = `sb-access-token=${AUTH_TOKEN}`
  }

  return headers
}

// ── Payload builder ───────────────────────────────────────────────────────────

function buildChatPayload(iteration) {
  const question = randomItem(TEST_QUESTIONS)
  const birthProfile = TEST_BIRTH_PROFILES[iteration % TEST_BIRTH_PROFILES.length]

  return JSON.stringify({
    messages: [
      {
        role: 'user',
        content: question,
      },
    ],
    // Profil de naissance — déclenche le flux de lecture complet
    birthData: birthProfile,
    // Langue
    lang: 'fr',
  })
}

// ── Scénario principal ────────────────────────────────────────────────────────

export default function (data) {
  const iteration = __ITER

  // ── Requête principale ─────────────────────────────────────────────────────
  group('POST /api/chat', () => {
    const payload = buildChatPayload(iteration)
    const headers = buildHeaders()
    const startTime = Date.now()

    const response = http.post(
      `${BASE_URL}/api/chat`,
      payload,
      {
        headers,
        timeout: '35s',   // Marge sur la limite Vercel 30s
        tags: {
          endpoint: 'chat',
          plan: PLAN,
          scenario: SCENARIO,
        },
      }
    )

    const elapsed = Date.now() - startTime
    chatDuration.add(elapsed)

    // ── Checks de base ──────────────────────────────────────────────────────
    const isSuccess = check(response, {
      'status 200': (r) => r.status === 200,
      'has content-type json': (r) => (r.headers['Content-Type'] || '').includes('application/json'),
      'response not empty': (r) => r.body && r.body.length > 10,
      'no HTML error page': (r) => !r.body.includes('<!DOCTYPE html>'),
    })

    // ── Checks sur le contenu de la réponse ────────────────────────────────
    if (response.status === 200) {
      let parsed = null
      try {
        parsed = JSON.parse(response.body)
      } catch (_) {}

      if (parsed) {
        check(parsed, {
          'has message or content': (p) => Boolean(p.message || p.content || p.text || p.reply),
          'no error field': (p) => !p.error || p.error === null,
        })
      }

      successfulRequests.add(1)
    }

    // ── Tracking des erreurs par type ───────────────────────────────────────
    errorRate.add(response.status >= 400)

    if (response.status === 429) {
      quotaHits.add(1)
    }

    if (response.status >= 500) {
      serverErrors.add(1)
    }

    // Timeout : status 0 (erreur réseau) ou 504 (gateway timeout)
    const isTimeout = response.status === 0 || response.status === 504 || elapsed >= 30000
    timeoutRate.add(isTimeout)

    // Log les erreurs pour diagnostic
    if (response.status >= 400) {
      console.log(
        `[ERROR] VU=${__VU} iter=${__ITER} ` +
        `status=${response.status} ` +
        `elapsed=${elapsed}ms ` +
        `body=${response.body ? response.body.substring(0, 200) : '(empty)'}`
      )
    }
  })

  // ── Temps de réflexion entre requêtes ──────────────────────────────────────
  // Simule le comportement réel : l'utilisateur lit la réponse avant de réécrire
  // Pour /api/chat avec OpenAI : pause de 20-40s est réaliste
  // (moins agressif que des API REST classiques)
  sleep(20 + Math.random() * 20)
}

// ── Résumé de fin de test ─────────────────────────────────────────────────────

export function handleSummary(data) {
  const duration       = data.metrics['chat_full_duration']
  const errorRateVal   = data.metrics['chat_error_rate']
  const timeoutRateVal = data.metrics['chat_timeout_rate']
  const httpFailed     = data.metrics['http_req_failed']

  const p95  = duration ? Math.round(duration.values['p(95)']) : 'N/A'
  const p99  = duration ? Math.round(duration.values['p(99)']) : 'N/A'
  const avg  = duration ? Math.round(duration.values['avg'])   : 'N/A'
  const errors    = errorRateVal   ? (errorRateVal.values.rate   * 100).toFixed(2) : 'N/A'
  const timeouts  = timeoutRateVal ? (timeoutRateVal.values.rate * 100).toFixed(2) : 'N/A'
  const netFailed = httpFailed     ? (httpFailed.values.rate     * 100).toFixed(2) : 'N/A'

  // Verdict automatique basé sur les seuils
  const p95Num = parseFloat(p95)
  const errNum = parseFloat(errors)
  const toNum  = parseFloat(timeouts)

  let verdict = '✅ ACCEPTABLE'
  if (p95Num > 25000 || errNum > 5 || toNum > 3) {
    verdict = '🔴 CRITIQUE'
  } else if (p95Num > 15000 || errNum > 2 || toNum > 1) {
    verdict = '⚠️  FRAGILE'
  }

  const summary = `
══════════════════════════════════════════════════════════════════
  HEXASTRA COACH — RAPPORT DE CHARGE k6
  Scénario : ${SCENARIO.toUpperCase()} | Plan : ${PLAN} | URL : ${BASE_URL}
══════════════════════════════════════════════════════════════════

  LATENCE /api/chat
  ─────────────────────────────────────────
  Moyenne      : ${avg}ms
  p95          : ${p95}ms   (seuil OK : < 15 000ms)
  p99          : ${p99}ms   (seuil OK : < 25 000ms)

  FIABILITÉ
  ─────────────────────────────────────────
  Erreurs HTTP : ${errors}%    (seuil OK : < 5%)
  Timeouts     : ${timeouts}%    (seuil OK : < 3%)
  Échecs réseau: ${netFailed}%

  VERDICT : ${verdict}

══════════════════════════════════════════════════════════════════
`

  console.log(summary)

  // Export JSON pour CI/CD
  return {
    stdout: summary,
    'tests/load/results/summary.json': JSON.stringify(data, null, 2),
  }
}
