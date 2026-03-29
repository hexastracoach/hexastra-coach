/**
 * lib/cache/chatCache.ts — Interface abstraite du cache chat
 *
 * TOUTES LES MÉTHODES SONT ASYNC.
 * Redis (et tout stockage distant) est intrinsèquement asynchrone.
 * L'implémentation mémoire (LRU) enveloppe ses résultats dans Promise.resolve()
 * pour respecter ce contrat sans overhead significatif.
 *
 * SWAP REDIS → MÉMOIRE :
 * route.ts dépend UNIQUEMENT de cette interface via providerFactory.ts.
 * Pour changer d'implémentation : modifier la factory, pas route.ts.
 */

export interface ChatCache {
  /**
   * Récupère une valeur typée.
   * Retourne null si la clé est absente ou expirée — jamais de stale data.
   */
  get<T = unknown>(key: string): Promise<T | null>

  /**
   * Stocke une valeur avec TTL optionnel.
   * Si `ttlMs` est omis, l'implémentation utilise son TTL par défaut.
   */
  set<T = unknown>(key: string, value: T, ttlMs?: number): Promise<void>

  /**
   * Supprime une entrée du cache.
   * Ne lève pas d'erreur si la clé est absente.
   */
  delete(key: string): Promise<void>

  /**
   * Vide le cache (utile en dev/test).
   * Les implémentations production peuvent ignorer cet appel.
   */
  clear(): Promise<void>
}
