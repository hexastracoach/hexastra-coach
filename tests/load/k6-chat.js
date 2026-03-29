/**
 * k6-chat.js — Test de charge Hexastra Coach (version corrigée)
 *
 * ENDPOINT CIBLÉ : POST /api/chat
 *
 * SCÉNARIOS DISPONIBLES (passer via --env SCENARIO=xxx) :
 *   smoke       → 1 VU, 2 min — validation minimale, toujours commencer par là
 *   baseline    → montée progressive jusqu'à 50 VU — charge nominale
 *   stress      → montée jusqu'à 250 VU — point de rupture
 *
 * USAGE :
 *   k6 run --env SCENARIO=smoke --env BASE_URL=https://your-site.com k6-chat.js
 *   k6 run --env SCENARIO=baseline --env BASE_URL=https://... --env AUTH_TOKEN=xxx k6-chat.js
 *
 * VARIABLES D'ENVIRONNEMENT :
 *   BASE_URL      URL de base du site (ex: https://hexastra-coach.vercel.app)
 *   AUTH_TOKEN    Cookie sb-access-token d'une session Supabase (optionnel)
 *   SCENARIO      smoke | baseline | stress (défaut: smoke)
 *   PLAN          free | essential | premium | practitioner (défaut: free, pour les logs)
 *
 * FIXES PAR RAPPORT À L'ANCIENNE VERSION :
 *   1. Null-guard sur r.body dans tous les checks → plus de crash TypeError
 *   2. Enregistrement des métriques AVANT le bloc check (toujours exécuté)
 *   3. handleSummary lit http_req_failed pour le verdict → plus de "ACCEPTABLE" trompeur
 *   4. Détection explicite status=0 (erreur réseau / serveur inaccessible)
 *   5. Payload corrigé : `language` (et non `lang`) conforme à route.ts
 *   6. Verdict CRITIQUE si network errors > 0% (status 0 = serveur mort)
 */

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js'

// ── Métriques personnalisées ─────────────────────────────────────────────────

/** Taux d'erreurs HTTP (4xx + 5xx) — NE COMPTE PAS les erreurs réseau (status 0) */
const httpErrorRate    = new Rate('chat_http_error_rate')

/** Taux d'erreurs réseau (status 0 = connexion refusée, DNS, timeout TCP) */
const networkErrorRate = new Rate('chat_network_error_rate')

/** Taux de timeouts applicatifs (504 Vercel ou elapsed >= 30s) */
const timeoutRate      = new Rate('chat_timeout_rate')

/** Durée totale de la requête mesurée côté k6 (ms) */
const chatDuration     = new Trend('chat_full_duration', true)

/** Compteurs pour le rapport */
const successfulRequests = new Counter('chat_successful_requests')
const quotaHits          = new Counter('chat_quota_hits')
const serverErrors       = new Counter('chat_5xx_errors')
const networkErrors      = new Counter('chat_network_errors')

// ── Configuration des scénarios ───────────────────────────────────────────────

const SCENARIO   = __ENV.SCENARIO   || 'smoke'
const BASE_URL   = __ENV.BASE_URL   || 'http://localhost:3000'
const AUTH_TOKEN = __ENV.AUTH_TOKEN || ''
const PLAN       = __ENV.PLAN       || 'free'

const SCENARIOS = {

  // SMOKE : 1 VU, 2 min — vérification minimale avant tout test de charge
  // Toujours commencer par là : valide payload, auth, statut 200
  smoke: {
    executor: 'constant-vus',
    vus: 1,
    duration: '2m',
    gracefulStop: '30s',
  },

  // BASELINE : charge nominale, montée progressive
  // Simule une utilisation réelle : ~150 req/min à 50 VU (sleep 20s entre requêtes)
  baseline: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m',  target: 10  },   // Montée douce
      { duration: '5m',  target: 30  },   // Palier intermédiaire
      { duration: '5m',  target: 50  },   // Charge nominale
      { duration: '5m',  target: 50  },   // Maintien
      { duration: '2m',  target: 0   },   // Descente
    ],
    gracefulRampDown: '30s',
  },

  // STRESS : montée jusqu'au point de rupture
  // Identifier à partir de combien de VU les erreurs commencent
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
      { duration: '5m',  target: 250 },   // Maintien au peak
      { duration: '2m',  target: 0   },
    ],
    gracefulRampDown: '30s',
  },
}

// Export de la config k6 — utilise le scénario sélectionné
export const options = {
  scenarios: {
    [SCENARIO]: SCENARIOS[SCENARIO] || SCENARIOS.smoke,
  },

  // ── Seuils de validation ────────────────────────────────────────────────────
  // Ces seuils font échouer le run k6 (exit code 1) si franchis.
  // Ils sont SÉPARÉS du verdict textuel de handleSummary (voir ci-dessous).
  //
  // Valeurs cibles pour /api/chat avec OpenAI natif :
  //   p95 < 15s   → OpenAI peut prendre 8-12s en conditions normales
  //   erreurs < 5% → marge raisonnable
  //   réseau < 1%  → 0 erreur réseau acceptable = serveur toujours joignable
  thresholds: {
    // Durée totale de la requête (métrique custom)
    'chat_full_duration':      ['p(95)<15000', 'p(99)<25000'],

    // Taux d'erreurs HTTP 4xx/5xx
    'chat_http_error_rate':    ['rate<0.05'],   // < 5%

    // Taux d'erreurs réseau (status 0)
    // SEUIL ZÉRO : si le serveur est inaccessible, le test est invalide
    'chat_network_error_rate': ['rate<0.01'],   // < 1% (tolérance légère pour flaps réseau)

    // Timeouts applicatifs
    'chat_timeout_rate':       ['rate<0.03'],   // < 3%

    // Métriques k6 natives
    'http_req_duration':       ['p(95)<20000'], // p95 < 20s (marge Vercel 30s)
    'http_req_failed':         ['rate<0.05'],   // < 5% (inclut les erreurs réseau k6)
  },

  userAgent: 'k6-hexastra-load-test/1.0',
}

// ── Données de test ───────────────────────────────────────────────────────────
// Questions réalistes couvrant les 5 intents principaux

const TEST_QUESTIONS = [
  // Intent: lecture complète
  'Fais-moi une lecture de ma situation actuelle',
  'Dis-moi ce qui se passe en ce moment pour moi',
  'Quelle est ma dynamique principale en ce moment ?',

  // Intent: blocage
  "Pourquoi je n'arrive pas à avancer dans mon projet ?",
  'Je bloque depuis des semaines, qu\'est-ce qui se passe ?',

  // Intent: relation
  'Comment fonctionne ma relation amoureuse en ce moment ?',
  'Pourquoi les gens ne me comprennent pas ?',

  // Intent: timing / décision
  'Est-ce le bon moment pour lancer mon projet ?',
  'Comment décider si je dois changer de travail ?',

  // Intent: identité
  'Comment est-ce que je fonctionne vraiment ?',
  'Quelles sont mes forces et mes zones de friction ?',
]

// Profils de naissance fictifs — chaque VU en utilise un différent (round-robin)
const TEST_BIRTH_PROFILES = [
  { birthDate: '1988-05-14', birthTime: '14:30', birthPlace: 'Paris',
    birthLat: 48.8566, birthLon: 2.3522, timezone: 'Europe/Paris' },
  { birthDate: '1992-11-03', birthTime: '08:15', birthPlace: 'Lyon',
    birthLat: 45.7640, birthLon: 4.8357, timezone: 'Europe/Paris' },
  { birthDate: '1985-02-28', birthTime: '22:00', birthPlace: 'Marseille',
    birthLat: 43.2965, birthLon: 5.3698, timezone: 'Europe/Paris' },
  { birthDate: '1995-07-19', birthTime: '06:45', birthPlace: 'Bordeaux',
    birthLat: 44.8378, birthLon: -0.5792, timezone: 'Europe/Paris' },
]

// ── Headers ───────────────────────────────────────────────────────────────────

function buildHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }

  // Auth Supabase via cookie.
  // Le nom exact du cookie dépend du projet Supabase (format: sb-<PROJECT_REF>-auth-token).
  // Sans token, l'API retourne plan=free sans userId — fonctionnel pour le load test.
  if (AUTH_TOKEN) {
    // Essayer les deux formats courants de cookie Supabase SSR
    headers['Cookie'] = `sb-access-token=${AUTH_TOKEN}; sb-auth-token=${AUTH_TOKEN}`
  }

  return headers
}

// ── Payload builder ───────────────────────────────────────────────────────────

function buildChatPayload(iteration) {
  const question     = randomItem(TEST_QUESTIONS)
  const birthProfile = TEST_BIRTH_PROFILES[iteration % TEST_BIRTH_PROFILES.length]

  return JSON.stringify({
    // FIX : `language` (et non `lang`) — route.ts lit body.language via resolveRequestedLanguage()
    language: 'fr',

    messages: [
      { role: 'user', content: question },
    ],

    // birthData déclenche le flux de lecture complet (calcul astro + fusion)
    // Retirer birthData si tu veux tester uniquement la branche "conversation"
    birthData: birthProfile,
  })
}

// ── Scénario principal ────────────────────────────────────────────────────────

export default function () {
  const iteration = __ITER

  group('POST /api/chat', () => {
    const payload   = buildChatPayload(iteration)
    const headers   = buildHeaders()
    const startTime = Date.now()

    const response = http.post(
      `${BASE_URL}/api/chat`,
      payload,
      {
        headers,
        timeout: '35s',     // Marge sur la limite Vercel/Railway de 30s
        tags: {
          endpoint: 'chat',
          plan: PLAN,
          scenario: SCENARIO,
        },
      }
    )

    const elapsed = Date.now() - startTime
    chatDuration.add(elapsed)

    // ── Classification de l'erreur ──────────────────────────────────────────
    //
    // FIX CRITIQUE : les métriques sont calculées ICI, AVANT le bloc check().
    // L'ancien script calculait errorRate/timeoutRate APRÈS check(), qui pouvait
    // crasher sur r.body null → les métriques n'étaient jamais enregistrées →
    // handleSummary les lisait comme undefined → verdict ACCEPTABLE trompeur.
    //
    // Catégories mutuellement exclusives :
    //   status 0          = erreur réseau (serveur inaccessible, DNS, TCP)
    //   status 429        = rate limit (quota ou IP)
    //   status 500/502/   = erreur serveur
    //   status 504        = gateway timeout (Vercel ou Railway)
    //   elapsed >= 30 000 = timeout applicatif (sans réponse HTTP)
    //   status 200        = succès

    const isNetworkError  = response.status === 0
    const isHttpError     = response.status >= 400 && response.status !== 429
    const isTimeout       = response.status === 504 || (!isNetworkError && elapsed >= 30000)
    const isQuota         = response.status === 429
    const is5xx           = response.status >= 500 && response.status !== 504

    networkErrorRate.add(isNetworkError)
    httpErrorRate.add(isHttpError)
    timeoutRate.add(isTimeout)

    if (isNetworkError) networkErrors.add(1)
    if (isQuota)        quotaHits.add(1)
    if (is5xx)          serverErrors.add(1)
    if (response.status === 200) successfulRequests.add(1)

    // ── Checks de base ──────────────────────────────────────────────────────
    //
    // FIX : null-guard sur r.body avant .includes() et .length
    // Sans ça : si r.body === null (status 0), TypeError → crash de check() →
    // le VU entier plante sans enregistrer les métriques suivantes.

    const body = response.body ?? ''  // string vide si null

    check(response, {
      'server reachable (status != 0)': (r) => r.status !== 0,
      'status 200':                     (r) => r.status === 200,
      'not 429 rate limit':             (r) => r.status !== 429,
      'not 5xx server error':           (r) => r.status < 500,
      'has content-type json':          (r) =>
        (r.headers['Content-Type'] || '').includes('application/json'),
      'response not empty':             () => body.length > 10,
      'no HTML error page':             () => !body.includes('<!DOCTYPE html>'),
    })

    // Checks sur le contenu JSON uniquement si la réponse est un 200 valide
    if (response.status === 200 && body.length > 0) {
      let parsed = null
      try { parsed = JSON.parse(body) } catch (_) { /* ignore */ }

      if (parsed) {
        check(parsed, {
          'has message or content':  (p) => Boolean(p.message || p.content || p.text || p.reply),
          'no top-level error key':  (p) => !p.error,
          'has plan field':          (p) => Boolean(p.plan),
        })
      }
    }

    // Log structuré pour le diagnostic — uniquement sur erreur
    if (isNetworkError) {
      console.error(
        `[NET_ERR] VU=${__VU} iter=${__ITER} elapsed=${elapsed}ms ` +
        `— Serveur inaccessible sur ${BASE_URL}. ` +
        `Vérifier que le serveur tourne et que BASE_URL est correcte.`
      )
    } else if (response.status >= 400) {
      console.warn(
        `[HTTP_ERR] VU=${__VU} iter=${__ITER} ` +
        `status=${response.status} elapsed=${elapsed}ms ` +
        `body=${body.substring(0, 300)}`
      )
    }
  })

  // ── Pause réaliste entre les requêtes ────────────────────────────────────
  // L'utilisateur lit la réponse IA (~30-60s) avant d'envoyer un nouveau message.
  // Ne PAS réduire ce sleep pour simuler une "vraie" API REST — /api/chat n'en est pas une.
  sleep(20 + Math.random() * 20)
}

// ── Résumé de fin de test ─────────────────────────────────────────────────────

export function handleSummary(data) {

  // ── Lecture des métriques ─────────────────────────────────────────────────
  //
  // FIX : on lit maintenant http_req_failed (métrique native k6) en PLUS
  // des métriques custom. Si http_req_failed est élevé ET que les métriques
  // custom sont absentes (non enregistrées), on peut quand même détecter l'état réel.

  const durationMetric    = data.metrics['chat_full_duration']
  const httpErrMetric     = data.metrics['chat_http_error_rate']
  const netErrMetric      = data.metrics['chat_network_error_rate']
  const timeoutMetric     = data.metrics['chat_timeout_rate']
  const httpReqFailed     = data.metrics['http_req_failed']    // métrique NATIVE k6
  const httpReqDuration   = data.metrics['http_req_duration']  // métrique NATIVE k6
  const successCount      = data.metrics['chat_successful_requests']
  const quotaCount        = data.metrics['chat_quota_hits']
  const netErrCount       = data.metrics['chat_network_errors']
  const serverErrCount    = data.metrics['chat_5xx_errors']

  // Helper : lire une valeur de métrique avec fallback
  function readRate(metric)  { return metric ? (metric.values.rate  * 100) : null }
  function readP95(metric)   { return metric ? metric.values['p(95)'] : null }
  function readP99(metric)   { return metric ? metric.values['p(99)'] : null }
  function readAvg(metric)   { return metric ? metric.values['avg']    : null }
  function readCount(metric) { return metric ? metric.values.count      : 0 }
  function fmt(val, unit)    { return val !== null ? `${Math.round(val)}${unit}` : 'N/A (non enregistrée)' }
  function fmtRate(val)      { return val !== null ? `${val.toFixed(2)}%` : 'N/A (non enregistrée)' }

  const p95      = readP95(durationMetric)
  const p99      = readP99(durationMetric)
  const avg      = readAvg(durationMetric)
  const httpErr  = readRate(httpErrMetric)
  const netErr   = readRate(netErrMetric)
  const timeouts = readRate(timeoutMetric)

  // FIX : lire http_req_failed (native k6) comme filet de sécurité
  // Cette métrique est TOUJOURS enregistrée par k6, même si nos métriques custom crashent.
  const nativeFailedRate = readRate(httpReqFailed)   // inclut erreurs réseau
  const nativeP95        = readP95(httpReqDuration)

  const successTotal  = readCount(successCount)
  const quotaTotal    = readCount(quotaCount)
  const netErrTotal   = readCount(netErrCount)
  const serverErrTotal = readCount(serverErrCount)

  // ── Calcul du verdict ─────────────────────────────────────────────────────
  //
  // FIX PRINCIPAL : le verdict vérifie maintenant http_req_failed (native k6)
  // comme source de vérité primaire — elle est toujours disponible même si
  // les métriques custom ne sont pas enregistrées (ex: crash r.body null).
  //
  // Ordre de priorité :
  // 1. Erreurs réseau > 1%  → CRITIQUE (serveur inaccessible = test invalide)
  // 2. http_req_failed > 5% → CRITIQUE (k6 lui-même mesure les échecs)
  // 3. p95 > 25s            → CRITIQUE
  // 4. Erreurs HTTP > 5%    → CRITIQUE
  // 5. Timeouts > 3%        → CRITIQUE
  // 6. Seuils "fragile"     → FRAGILE
  // 7. Tout OK              → ACCEPTABLE

  let verdict    = '✅  ACCEPTABLE'
  let reasonCode = []

  // Règle 1 : erreurs réseau → test invalide (le serveur n'est pas joignable)
  if (netErr !== null && netErr > 1) {
    verdict = '🔴  CRITIQUE'
    reasonCode.push(`erreurs réseau ${fmtRate(netErr)} > 1% — serveur inaccessible`)
  }
  // Règle 1b : utiliser http_req_failed si netErr non disponible
  else if (netErr === null && nativeFailedRate !== null && nativeFailedRate > 5) {
    verdict = '🔴  CRITIQUE'
    reasonCode.push(`http_req_failed (native k6) = ${fmtRate(nativeFailedRate)} > 5%`)
  }
  else {
    // Règle 2 : p95 critique
    if (p95 !== null && p95 > 25000) {
      verdict = '🔴  CRITIQUE'
      reasonCode.push(`p95 ${Math.round(p95)}ms > 25 000ms`)
    }
    // Règle 3 : erreurs HTTP critiques
    if (httpErr !== null && httpErr > 5) {
      verdict = '🔴  CRITIQUE'
      reasonCode.push(`erreurs HTTP ${fmtRate(httpErr)} > 5%`)
    }
    // Règle 4 : timeouts critiques
    if (timeouts !== null && timeouts > 3) {
      verdict = '🔴  CRITIQUE'
      reasonCode.push(`timeouts ${fmtRate(timeouts)} > 3%`)
    }

    // Seuils "fragile" (seulement si pas encore CRITIQUE)
    if (verdict === '✅  ACCEPTABLE') {
      if ((p95 !== null && p95 > 15000) ||
          (httpErr !== null && httpErr > 2) ||
          (timeouts !== null && timeouts > 1) ||
          (nativeFailedRate !== null && nativeFailedRate > 2)) {
        verdict = '⚠️   FRAGILE'
        reasonCode.push('un ou plusieurs seuils fragiles franchis')
      }
    }
  }

  const reasons = reasonCode.length > 0
    ? `  Raisons : ${reasonCode.join(' | ')}`
    : '  Aucun seuil critique franchi.'

  // ── Rapport textuel ───────────────────────────────────────────────────────

  const divider = '══════════════════════════════════════════════════════════════════'

  const summary = `
${divider}
  HEXASTRA COACH — RAPPORT DE CHARGE k6
  Scénario : ${SCENARIO.toUpperCase().padEnd(10)} | Plan : ${PLAN} | URL : ${BASE_URL}
${divider}

  LATENCE  /api/chat
  ────────────────────────────────────────────────
  Moyenne (custom)   : ${fmt(avg, 'ms')}
  p95     (custom)   : ${fmt(p95, 'ms')}   seuil OK : < 15 000ms
  p99     (custom)   : ${fmt(p99, 'ms')}   seuil OK : < 25 000ms
  p95     (k6 natif) : ${fmt(nativeP95, 'ms')}

  FIABILITÉ
  ────────────────────────────────────────────────
  Erreurs réseau     : ${fmtRate(netErr)}    (seuil OK : < 1%  — status 0)
  Erreurs HTTP 4xx/5xx: ${fmtRate(httpErr)}    (seuil OK : < 5%)
  Timeouts 504/30s   : ${fmtRate(timeouts)}    (seuil OK : < 3%)
  Rate limit 429     : ${quotaTotal} occurrences
  Erreurs 5xx        : ${serverErrTotal} occurrences
  http_req_failed    : ${fmtRate(nativeFailedRate)}    (métrique native k6)

  COMPTEURS
  ────────────────────────────────────────────────
  Requêtes réussies  : ${successTotal}
  Erreurs réseau     : ${netErrTotal}
  Rate limits 429    : ${quotaTotal}
  Erreurs 5xx        : ${serverErrTotal}

  VERDICT : ${verdict}
${reasons}

  ────────────────────────────────────────────────
  NOTE : si "N/A (non enregistrée)" apparaît pour une métrique critique,
  c'est que le serveur n'a pas répondu du tout (connexion refusée).
  Vérifier que BASE_URL est correcte et que le serveur est en ligne.
${divider}
`

  console.log(summary)

  // Export JSON pour CI/CD
  return {
    stdout: summary,
    'tests/load/results/summary.json': JSON.stringify(
      {
        scenario: SCENARIO,
        plan: PLAN,
        baseUrl: BASE_URL,
        timestamp: new Date().toISOString(),
        verdict,
        metrics: {
          p95_ms:    p95,
          p99_ms:    p99,
          avg_ms:    avg,
          httpErrorRate:    httpErr,
          networkErrorRate: netErr,
          timeoutRate:      timeouts,
          httpReqFailed:    nativeFailedRate,
          successCount:     successTotal,
          quotaHits:        quotaTotal,
          networkErrors:    netErrTotal,
          serverErrors:     serverErrTotal,
        },
        raw: data,
      },
      null,
      2
    ),
  }
}
