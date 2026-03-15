import { createClient } from '@supabase/supabase-js';
import type { PlanKey } from '@/types/subscription';
import { mapDbPlanToPlanKey, downgradeIfInactive } from './plan';
import { logger } from '@/lib/utils/logger';

type ProfileRow = { plan: string | null; stripe_subscription_status: string | null };

export async function getUserPlan(userId: string): Promise<PlanKey> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    logger.warn('getUserPlan: missing service env, fallback free');
    return 'free';
  }

  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data, error } = await supabase
    .from('profiles')
    .select('plan, stripe_subscription_status')
    .eq('id', userId)
    .maybeSingle<ProfileRow>();

  if (error) {
    logger.error('getUserPlan profile lookup failed', { error });
    return 'free';
  }

  const plan = mapDbPlanToPlanKey(data?.plan);
  return downgradeIfInactive(plan, data?.stripe_subscription_status ?? null);
}
