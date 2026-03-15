import type { PlanKey } from '@/types/subscription';

export type DbPlan = 'free' | 'essentiel' | 'premium' | 'praticien';

export function mapDbPlanToPlanKey(plan: unknown): PlanKey {
  if (plan === 'essentiel') return 'essential';
  if (plan === 'premium') return 'premium';
  if (plan === 'praticien') return 'practitioner';
  return 'free';
}

export function isPlanActive(plan: PlanKey, stripeStatus?: string | null) {
  if (plan === 'free') return true;
  return stripeStatus === 'active' || stripeStatus === 'trialing';
}

export function downgradeIfInactive(plan: PlanKey, stripeStatus?: string | null): PlanKey {
  return isPlanActive(plan, stripeStatus) ? plan : 'free';
}
