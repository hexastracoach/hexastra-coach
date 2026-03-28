/**
 * lib/supabase/admin.ts — Client Supabase service_role (côté serveur uniquement)
 *
 * PROBLÈME RÉSOLU :
 * L'ancien createAdminClient() créait une nouvelle instance à chaque appel.
 * Chaque instanciation = setup de connexion HTTP + overhead de configuration (~30-50ms).
 * Sur 100 req/s, ça représente 100 handshakes inutiles par seconde.
 *
 * SOLUTION :
 * Singleton pattern via _adminClient. En serverless (Vercel) :
 * - L'instance est créée une seule fois par "warm instance" Node.js
 * - Toutes les requêtes sur la même instance réutilisent le même client
 * - Pas de problème multi-thread en Node.js (single-threaded)
 *
 * COMPATIBILITÉ :
 * createAdminClient() est conservé et délègue à getAdminClient().
 * Tous les appels existants dans readingSubjectService, chartCacheService, etc.
 * bénéficient automatiquement du singleton sans modification.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

/** Instance unique partagée sur toute la durée de vie du processus Node.js. */
let _adminClient: SupabaseClient | null = null

/**
 * Retourne le client Supabase admin (service_role).
 * Crée l'instance au premier appel, la réutilise ensuite.
 *
 * ⚠️  Uniquement côté serveur — la SUPABASE_SERVICE_ROLE_KEY ne doit jamais
 * être exposée au client.
 */
export function getAdminClient(): SupabaseClient {
  if (!_adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new Error(
        '[getAdminClient] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant'
      )
    }

    _adminClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return _adminClient
}

/**
 * Compatibilité descendante — délègue à getAdminClient().
 * Les appels existants (readingSubjectService, chartCacheService…) fonctionnent
 * sans modification et bénéficient du singleton.
 *
 * @deprecated Préférer getAdminClient() dans le nouveau code.
 */
export function createAdminClient(): SupabaseClient {
  return getAdminClient()
}
