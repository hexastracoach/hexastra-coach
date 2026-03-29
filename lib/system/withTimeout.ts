/**
 * lib/system/withTimeout.ts — Utilitaire de timeout pour les Promises
 *
 * PROBLÈME SANS CET UTILITAIRE :
 * Chaque point de timeout dans route.ts réimplémente le même pattern :
 *   const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(...), ms))
 *   return Promise.race([myPromise, timeout])
 *
 * Ce pattern a plusieurs défauts :
 * - Timer jamais nettoyé si la Promise principale résout avant le timeout
 * - Nom de l'opération absent dans le message d'erreur
 * - Duplication à chaque call-site
 *
 * AVANTAGES :
 * - `TimeoutError` nommé — distinguable d'autres erreurs dans les catch
 * - `unref()` sur le timer — n'empêche pas le process de se terminer proprement
 * - Nettoyage automatique via `clearTimeout` si la Promise résout avant timeout
 * - Compatible avec tout type de Promise (async function, fetch, etc.)
 *
 * USAGE :
 *   import { withTimeout, TimeoutError } from '@/lib/system/withTimeout'
 *
 *   try {
 *     const result = await withTimeout(runHexastraFlow(input), 28_000, 'runHexastraFlow')
 *   } catch (err) {
 *     if (err instanceof TimeoutError) { ... }
 *   }
 */

/**
 * Erreur levée quand une Promise dépasse le délai imparti.
 * Hérite d'Error pour la compatibilité avec les catch existants.
 */
export class TimeoutError extends Error {
  readonly operationName: string
  readonly timeoutMs: number

  constructor(operationName: string, timeoutMs: number) {
    super(`"${operationName}" timed out after ${timeoutMs}ms`)
    this.name = 'TimeoutError'
    this.operationName = operationName
    this.timeoutMs = timeoutMs
    // Fixe la chaîne de prototype pour instanceof (requis en ES5 cible)
    Object.setPrototypeOf(this, TimeoutError.prototype)
  }
}

/**
 * Enveloppe une Promise avec un timeout strict.
 *
 * @param promise   La Promise à surveiller
 * @param ms        Délai maximum en millisecondes
 * @param name      Nom de l'opération (pour le message d'erreur et les logs)
 * @returns         La valeur résolue par `promise` si elle arrive avant `ms`
 * @throws          `TimeoutError` si le délai est dépassé
 *
 * Le timer interne est nettoyé automatiquement dans les deux cas (résolution ou rejet),
 * évitant les fuites de timers dans les environnements serverless.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, name = 'operation'): Promise<T> {
  let timerId: ReturnType<typeof setTimeout> | null = null

  const timeoutPromise = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => {
      timerId = null
      reject(new TimeoutError(name, ms))
    }, ms)

    // Sur Node.js : ne pas bloquer la boucle d'événements si c'est le seul timer actif.
    // Équivalent de `timer.unref()` — aucun effet côté navigateur.
    if (timerId && typeof (timerId as unknown as NodeJS.Timeout).unref === 'function') {
      (timerId as unknown as NodeJS.Timeout).unref()
    }
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timerId !== null) {
      clearTimeout(timerId)
      timerId = null
    }
  })
}
