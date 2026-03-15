import { createClient } from '@supabase/supabase-js'
import type { PlanKey } from '@/types/subscription'
import { mapDbPlanToPlanKey } from '@/lib/permissions/plan'
import { logger } from '@/lib/utils/logger'

type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  plan: string | null
  stripe_customer_id?: string | null
  stripe_subscription_status?: string | null
}

export async function getOrCreateProfile(user: { id: string; email?: string | null; full_name?: string | null }): Promise<{
  profile: ProfileRow
  plan: PlanKey
}> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    logger.warn('getOrCreateProfile: missing service env, returning free plan')
    return {
      profile: {
        id: user.id,
        email: user.email ?? null,
        full_name: user.full_name ?? null,
        plan: 'free',
        stripe_customer_id: null,
        stripe_subscription_status: null,
      },
      plan: 'free',
    }
  }

  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

  const { data: existing, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, plan, stripe_customer_id, stripe_subscription_status')
    .eq('id', user.id)
    .maybeSingle<ProfileRow>()

  if (error) {
    logger.error('getOrCreateProfile: select failed', { error })
  }

  if (existing) {
    return {
      profile: existing,
      plan: mapDbPlanToPlanKey(existing.plan),
    }
  }

  const insert: ProfileRow = {
    id: user.id,
    email: user.email ?? null,
    full_name: user.full_name ?? null,
    plan: 'free',
    stripe_customer_id: null,
    stripe_subscription_status: null,
  }

  const { error: insertError, data: inserted } = await supabase
    .from('profiles')
    .insert(insert)
    .select('id, email, full_name, plan, stripe_customer_id, stripe_subscription_status')
    .maybeSingle<ProfileRow>()

  if (insertError || !inserted) {
    logger.error('getOrCreateProfile: insert failed', { insertError })
    return { profile: insert, plan: 'free' }
  }

  return {
    profile: inserted,
    plan: mapDbPlanToPlanKey(inserted.plan),
  }
}
