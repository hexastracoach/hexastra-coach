/**
 * lib/queue/processChatJob.ts — Worker de traitement des jobs de queue
 *
 * MÉCANISME :
 * Chaque appel à processNextQueuedJob() :
 *   1. Consomme un job de la queue (nextJob — atomique)
 *   2. Le marque comme "processing"
 *   3. Exécute runHexastraFlow avec les params extraits du body
 *   4. Stocke le résultat via setDone / setFailed
 *
 * DÉCLENCHEMENT OPPORTUNISTE (depuis route.ts) :
 *   import { after } from 'next/server'
 *   after(() => processNextQueuedJob().catch(() => {}))
 *
 *   `after()` exécute la fonction APRÈS que la réponse est envoyée au client.
 *   Disponible depuis Next.js 15 (stable). Compatible Node.js runtime sur Vercel.
 *
 * COMPATIBILITÉ SERVERLESS :
 *   - Pas de worker permanent — traitement déclenché par les requêtes entrantes
 *   - En mode high trafic : chaque requête sync trigger le traitement d'un job
 *   - Garantie faible : si la fonction Vercel se termine avant after(), le job reste en queue
 *     et sera traité par la prochaine requête
 *
 * EXECUTION SIMPLIFIÉE :
 *   Le worker exécute runHexastraFlow directement, sans la couche orchestration complète
 *   de route.ts (pas de quota daily, pas de cache, pas de métriques de charge).
 *   Ce choix est délibéré : les jobs en queue sont des requêtes de plan free en mode viral —
 *   une réponse correcte mais sans les enrichissements premium est acceptable.
 *
 * MIGRATION VERS QSTASH / INNGEST :
 *   Remplacer processNextQueuedJob() par un appel à l'API QStash/Inngest :
 *   - QStash : after(() => qstash.publish({ url: '/api/queue/worker', body: job }))
 *   - Inngest : after(() => inngest.send({ name: 'chat/process', data: job }))
 *   Le corps du worker reste identique.
 */

import { runHexastraFlow } from '@/lib/hexastra/orchestrator/runHexastraFlow'
import { memoryChatQueue } from './memoryChatQueue'
import type { ChatMessage } from '@/lib/chat/chatPayloadBuilder'
import type { BirthProfile } from '@/lib/hexastra/types'

// ── Extraction sécurisée des champs du body ───────────────────────────────────

function _safeStr(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function _parseMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((m): m is Record<string, unknown> => m !== null && typeof m === 'object')
    .map(m => {
      const role = m.role === 'user' || m.role === 'assistant' || m.role === 'system'
        ? (m.role as ChatMessage['role'])
        : 'user'
      const content = _safeStr(m.content)
      return { role, content }
    })
    .filter(m => m.content.length > 0)
    .slice(-6)  // 6 derniers messages max (même logique que route.ts)
}

function _parseBirthData(raw: unknown): BirthProfile | null {
  if (!raw || typeof raw !== 'object') return null
  const d = raw as Record<string, unknown>

  const isoRaw = _safeStr(d.birthDateISO)
  let isoDate: string | undefined
  let isoTime: string | undefined
  if (isoRaw.includes('T')) {
    const [dt, t] = isoRaw.split('T')
    isoDate = dt
    isoTime = (t || '').replace('Z', '').slice(0, 5)
  }

  const birth: BirthProfile = {
    name:          _safeStr(d.name) || undefined,
    firstName:     _safeStr(d.firstName) || undefined,
    date:          _safeStr(d.date) || _safeStr(d.birthDate) || isoDate,
    time:          _safeStr(d.time) || _safeStr(d.birthTime) || isoTime,
    place:         _safeStr(d.place) || _safeStr(d.birthCity) || undefined,
    country:       _safeStr(d.country) || _safeStr(d.birthCountryName) || undefined,
    lat:           typeof d.lat === 'number' ? d.lat : undefined,
    lon:           typeof d.lon === 'number' ? d.lon : undefined,
    gender:        _safeStr(d.gender) || undefined,
    birthDateISO:  isoRaw || undefined,
    birthTimeKnown: typeof d.birthTimeKnown === 'boolean' ? d.birthTimeKnown : undefined,
  }

  const hasData = Boolean(birth.firstName || birth.date || birth.place)
  return hasData ? birth : null
}

// ── Exécution d'un job ────────────────────────────────────────────────────────

async function _executeJobBody(body: unknown, plan: string): Promise<unknown> {
  const b = (body ?? {}) as Record<string, unknown>

  const messages  = _parseMessages(b.messages)
  const birthData = _parseBirthData(b.birthData)
  const language  = _safeStr(b.language || b.chatLanguage).slice(0, 2) || 'fr'
  const analysisMode = b.analysisMode === 'science_by_science' || b.analysisMode === 'hexastra_fusion'
    ? (b.analysisMode as 'science_by_science' | 'hexastra_fusion')
    : null

  // Appel direct à runHexastraFlow — contourne quota/cache (délibéré pour les jobs queués)
  return runHexastraFlow({
    plan:              plan as Parameters<typeof runHexastraFlow>[0]['plan'],
    requestType:       'chat',
    messages,
    birthData,
    practitionerUsage: null,
    language,
    conversationId:    typeof b.conversationId === 'string' ? b.conversationId : null,
    selectedMenuKey:   typeof b.selectedMenuKey === 'string' ? b.selectedMenuKey : null,
    selectedSubmenuKey: typeof b.selectedSubmenuKey === 'string' ? b.selectedSubmenuKey : null,
    analysisMode,
    journeyEnabled:    b.journeyEnabled === true,
  })
}

// ── API publique ──────────────────────────────────────────────────────────────

/**
 * Consomme et traite le prochain job de la queue.
 *
 * Ne lève jamais d'exception — les erreurs sont capturées et stockées dans le job.
 * Retourne true si un job a été traité, false si la queue était vide.
 *
 * USAGE depuis route.ts (après envoi de la réponse) :
 *   import { after } from 'next/server'
 *   after(() => processNextQueuedJob())
 */
export async function processNextQueuedJob(): Promise<boolean> {
  const job = await memoryChatQueue.nextJob()
  if (!job) return false

  await memoryChatQueue.setProcessing(job.jobId)

  try {
    const plan   = job.plan ?? 'free'
    const result = await _executeJobBody(job.body, plan)
    await memoryChatQueue.setDone(job.jobId, result)
    return true
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await memoryChatQueue.setFailed(job.jobId, msg)
    return false
  }
}
