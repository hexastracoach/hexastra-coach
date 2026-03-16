import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export function createSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Supabase env missing')
  }

  // cookies() peut renvoyer un store différent selon le contexte;
  // on défensivise pour éviter les erreurs "get is not a function".
  const store = cookies()
  const safeGet = typeof store.get === 'function' ? store.get.bind(store) : () => undefined
  const safeSet = typeof store.set === 'function' ? store.set.bind(store) : () => {}

  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return safeGet(name)?.value
      },
      set(name: string, value: string, options: any) {
        safeSet({ name, value, ...options })
      },
      remove(name: string, options: any) {
        safeSet({ name, value: '', ...options })
      },
    },
  })
}
