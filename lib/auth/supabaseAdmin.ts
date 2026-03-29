/**
 * lib/auth/supabaseAdmin.ts — Point d'import canonique pour le client Supabase admin
 *
 * Ce fichier est un simple re-export depuis `lib/supabase/admin.ts`.
 *
 * POURQUOI CE FICHIER :
 * `lib/auth/` regroupe tous les utilitaires liés à l'authentification (supabaseServer, etc.).
 * `lib/supabase/admin.ts` est l'implémentation, mais son chemin d'import est contre-intuitif
 * pour les callsites qui cherchent "l'admin auth client" dans `lib/auth/`.
 *
 * USAGE PRÉFÉRÉ :
 *   import { getAdminClient } from '@/lib/auth/supabaseAdmin'
 *
 * Les callsites existants qui importent depuis `@/lib/supabase/admin` continuent de fonctionner —
 * ce fichier n'est pas obligatoire, c'est un alias de commodité.
 */

export { getAdminClient, createAdminClient } from '@/lib/supabase/admin'
