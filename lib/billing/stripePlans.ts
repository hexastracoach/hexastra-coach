import type { PlanKey } from '@/types/subscription'
import { mapDbPlanToPlanKey } from '@/lib/permissions/plan'

export type StripePriceKey = 'essentiel_monthly' | 'premium_monthly' | 'praticien_monthly'

export const STRIPE_PRICE_MAP: Record<StripePriceKey, string | undefined> = {
  essentiel_monthly: process.env.STRIPE_ESSENTIEL_MONTHLY,
  premium_monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
  praticien_monthly: process.env.STRIPE_PRICE_PRATICIEN_MONTHLY,
}

export function planFromPriceKey(priceKey?: string | null): PlanKey {
  if (priceKey === 'praticien_monthly') return 'practitioner'
  if (priceKey === 'premium_monthly') return 'premium'
  if (priceKey === 'essentiel_monthly') return 'essential'
  return 'free'
}

export function priceKeyFromPlan(plan: PlanKey): StripePriceKey | null {
  if (plan === 'essential') return 'essentiel_monthly'
  if (plan === 'premium') return 'premium_monthly'
  if (plan === 'practitioner') return 'praticien_monthly'
  return null
}

// Legacy DB plan mapping helper if needed elsewhere
export const mapDbPlan = mapDbPlanToPlanKey
