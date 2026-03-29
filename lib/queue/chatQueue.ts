/**
 * lib/queue/chatQueue.ts — Interface abstraite de la queue de jobs /api/chat
 *
 * Même pattern que ChatCache / RateLimiter :
 *   - route.ts utilise uniquement cette interface
 *   - L'implémentation actuelle est en mémoire (memoryChatQueue.ts)
 *   - Migration Redis/QStash/Inngest = implémenter cette interface, swap le singleton
 *
 * CYCLE DE VIE D'UN JOB :
 *   enqueue() → status: "queued"
 *   nextJob() + setProcessing() → status: "processing"
 *   setDone() → status: "done"     (résultat disponible)
 *   setFailed() → status: "failed"  (erreur récupérable côté client)
 *
 * PRIORISATION :
 *   Les jobs sont triés par priority (desc) puis createdAt (asc).
 *   nextJob() retourne toujours le job de plus haute priorité le plus ancien.
 */

export interface QueueJobPayload {
  /** ID de la requête originale (pour le logging) */
  requestId: string
  /** Identifiant Supabase de l'utilisateur (null = anonyme) */
  userId: string | null
  /** Plan actif — utilisé pour la priorité et la stratégie d'exécution */
  plan: string | null
  /** IP pour fallback quota/rate-limit dans le worker */
  ip: string | null
  /** Priorité numérique : 3=practitioner, 2=premium, 1=essential, 0=free */
  priority: number
  /** Timestamp Unix (ms) de création du job */
  createdAt: number
  /** Corps brut de la requête JSON (déjà parsé, pas encore normalisé) */
  body: unknown
}

export interface QueueEnqueueResult {
  /** Identifiant unique du job — retourné au client pour le polling */
  jobId: string
  /** Position dans la queue (1 = prochain à être traité) */
  position: number
  /** Estimation du temps d'attente en secondes */
  estimatedWaitSec: number
}

export type JobStatus = 'queued' | 'processing' | 'done' | 'failed'

export interface QueueJobState {
  status: JobStatus
  /** Position actuelle (uniquement si status=queued) */
  position?: number
  /** Estimation d'attente restante en secondes (uniquement si status=queued) */
  estimatedWaitSec?: number
  /** Résultat du traitement (uniquement si status=done) */
  result?: unknown
  /** Message d'erreur (uniquement si status=failed) */
  error?: string
  /** Timestamp de création du job */
  createdAt: number
  /** Timestamp de la dernière mise à jour du statut */
  updatedAt: number
}

export interface QueueStats {
  queued:         number
  processing:     number
  done:           number
  failed:         number
  totalProcessed: number
  /** Temps moyen d'attente total (enqueue → setProcessing) en ms */
  avgWaitMs:      number
}

export interface ChatQueue {
  /**
   * Ajoute un job dans la queue.
   * Retourne le jobId et la position estimée.
   */
  enqueue(payload: QueueJobPayload): Promise<QueueEnqueueResult>

  /**
   * Retourne l'état complet d'un job (position, résultat, erreur...).
   * Retourne null si le jobId est inconnu ou expiré.
   */
  getState(jobId: string): Promise<QueueJobState | null>

  /**
   * Retire et retourne le prochain job à traiter (priorité desc, ancienneté asc).
   * Retourne null si la queue est vide.
   * ⚠️ Effet de bord : le job est retiré de la file d'attente.
   */
  nextJob(): Promise<(QueueJobPayload & { jobId: string }) | null>

  /** Marque un job comme en cours de traitement. */
  setProcessing(jobId: string): Promise<void>

  /** Marque un job comme terminé et stocke le résultat. */
  setDone(jobId: string, result: unknown): Promise<void>

  /** Marque un job comme échoué et stocke le message d'erreur. */
  setFailed(jobId: string, error: string): Promise<void>

  /** Nombre de jobs actuellement en attente (status=queued). */
  getQueueSize(): Promise<number>

  /** Métriques agrégées — utiles pour le logging et les health checks. */
  getStats(): Promise<QueueStats>
}
