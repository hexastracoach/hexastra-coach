/**
 * lib/queue/memoryChatQueue.ts — Implémentation mémoire de ChatQueue (priority queue)
 *
 * ALGORITHME :
 * File ordonnée par (priority DESC, createdAt ASC) — insertion triée via recherche binaire.
 * O(log n) en insertion, O(1) en consommation (nextJob = shift).
 *
 * MIGRATION REDIS :
 * Pour migrer vers Redis/Upstash, créer `lib/queue/redisChatQueue.ts`:
 *
 *   import { Redis } from '@upstash/redis'
 *   class RedisChatQueue implements ChatQueue {
 *     // ZADD pour la priority queue (score = priority * 1e13 - createdAt pour tri)
 *     // HSET/HGET pour les états et résultats
 *     // TTL sur les résultats via EXPIRE
 *   }
 *
 * POUR QSTASH :
 *   enqueue() publie sur QStash avec metadata plan/priority
 *   Le worker est une route /api/queue/worker déclenchée par QStash
 *
 * LIMITES MÉMOIRE :
 * - État local à l'instance Vercel (pas de partage cross-instances)
 * - Cohérent en environnement single-instance (dev, une seule fonction warm)
 * - En production multi-instance : deux clients peuvent obtenir des positions différentes
 * - Utiliser Redis pour la cohérence cross-instances en production à fort trafic
 *
 * TTL des résultats : 15 minutes (jobs done/failed supprimés automatiquement)
 */

import { randomUUID } from 'crypto'
import type {
  ChatQueue,
  QueueJobPayload,
  QueueEnqueueResult,
  QueueJobState,
  QueueStats,
} from './chatQueue'

const RESULT_TTL_MS        = 15 * 60 * 1000   // 15 min
const CLEANUP_INTERVAL_MS  = 5  * 60 * 1000   // nettoyage toutes les 5 min
const AVG_JOB_DURATION_SEC = 20               // hypothèse : 20s par job pour l'estimation

interface InternalJob {
  jobId:   string
  payload: QueueJobPayload
}

export class MemoryChatQueue implements ChatQueue {
  // File ordonnée par priorité desc + ancienneté asc
  private readonly queue: InternalJob[] = []

  // États et résultats des jobs (queued / processing / done / failed)
  private readonly states = new Map<string, QueueJobState>()

  // Stats
  private totalProcessed = 0
  private totalWaitMs    = 0

  constructor() {
    if (typeof setInterval !== 'undefined') {
      const timer = setInterval(() => this._cleanup(), CLEANUP_INTERVAL_MS)
      if (timer && typeof (timer as unknown as NodeJS.Timeout).unref === 'function') {
        (timer as unknown as NodeJS.Timeout).unref()
      }
    }
  }

  // ── Nettoyage ───────────────────────────────────────────────────────────────

  private _cleanup(): void {
    const cutoff = Date.now() - RESULT_TTL_MS
    for (const [id, state] of this.states.entries()) {
      if (
        (state.status === 'done' || state.status === 'failed') &&
        state.updatedAt < cutoff
      ) {
        this.states.delete(id)
      }
    }
  }

  // ── Insertion triée (binaire) ────────────────────────────────────────────────

  private _insertSorted(job: InternalJob): void {
    // Tri : priority DESC, createdAt ASC
    // Un job de priorité haute passe avant un job de priorité basse.
    // À priorité égale, le plus ancien passe en premier.
    let lo = 0, hi = this.queue.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      const m   = this.queue[mid].payload
      const j   = job.payload
      const before =
        m.priority > j.priority ||
        (m.priority === j.priority && m.createdAt <= j.createdAt)
      if (before) lo = mid + 1
      else        hi = mid
    }
    this.queue.splice(lo, 0, job)
  }

  private _getPosition(jobId: string): number {
    const idx = this.queue.findIndex(j => j.jobId === jobId)
    return idx === -1 ? 0 : idx + 1
  }

  private _estimateWait(position: number): number {
    return Math.max(5, position * AVG_JOB_DURATION_SEC)
  }

  // ── Interface publique ───────────────────────────────────────────────────────

  async enqueue(payload: QueueJobPayload): Promise<QueueEnqueueResult> {
    const jobId = randomUUID()
    const now   = Date.now()

    const state: QueueJobState = {
      status:    'queued',
      createdAt: now,
      updatedAt: now,
    }

    this._insertSorted({ jobId, payload })
    this.states.set(jobId, state)

    const position        = this._getPosition(jobId)
    const estimatedWaitSec = this._estimateWait(position)

    state.position         = position
    state.estimatedWaitSec = estimatedWaitSec

    return { jobId, position, estimatedWaitSec }
  }

  async getState(jobId: string): Promise<QueueJobState | null> {
    const state = this.states.get(jobId)
    if (!state) return null

    // Rafraîchir la position si toujours en queue
    if (state.status === 'queued') {
      const pos              = this._getPosition(jobId)
      state.position         = pos
      state.estimatedWaitSec = this._estimateWait(pos)
    }

    return { ...state }
  }

  async nextJob(): Promise<(QueueJobPayload & { jobId: string }) | null> {
    const job = this.queue.shift()
    if (!job) return null
    return { ...job.payload, jobId: job.jobId }
  }

  async setProcessing(jobId: string): Promise<void> {
    const state = this.states.get(jobId)
    if (!state) return
    state.status    = 'processing'
    state.updatedAt = Date.now()
    delete state.position
    delete state.estimatedWaitSec
  }

  async setDone(jobId: string, result: unknown): Promise<void> {
    const state = this.states.get(jobId)
    if (!state) return
    this.totalWaitMs    += Date.now() - state.createdAt
    this.totalProcessed ++
    state.status    = 'done'
    state.result    = result
    state.updatedAt = Date.now()
  }

  async setFailed(jobId: string, error: string): Promise<void> {
    const state = this.states.get(jobId)
    if (!state) return
    this.totalProcessed++
    state.status    = 'failed'
    state.error     = error
    state.updatedAt = Date.now()
  }

  async getQueueSize(): Promise<number> {
    return this.queue.length
  }

  async getStats(): Promise<QueueStats> {
    let queued = 0, processing = 0, done = 0, failed = 0

    for (const { status } of this.states.values()) {
      if (status === 'queued')     queued++
      else if (status === 'processing') processing++
      else if (status === 'done')       done++
      else if (status === 'failed')     failed++
    }

    return {
      queued,
      processing,
      done,
      failed,
      totalProcessed: this.totalProcessed,
      avgWaitMs: this.totalProcessed > 0
        ? Math.round(this.totalWaitMs / this.totalProcessed)
        : 0,
    }
  }
}

/** Singleton — partagé par toutes les requêtes d'une même warm instance Vercel. */
export const memoryChatQueue = new MemoryChatQueue()
