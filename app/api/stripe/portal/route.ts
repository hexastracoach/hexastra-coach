import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseServer } from '@/lib/auth/supabaseServer'
import { logger } from '@/lib/utils/logger'
import { validateEnv } from '@/lib/utils/env'
import { unauthorized, internalError, ok } from '@/lib/utils/apiResponse'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  validateEnv({
    STRIPE_SECRET_KEY: {},
    NEXT_PUBLIC_APP_URL: {},
    NEXT_PUBLIC_SUPABASE_URL: {},
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {},
  })

  const stripeKey = process.env.STRIPE_SECRET_KEY!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (!stripeKey) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 503 })
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })
  const supabase = createSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return unauthorized()
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id as string | undefined

  if (!customerId && user.email) {
    const customers = await stripe.customers.list({ email: user.email, limit: 1 })
    if (customers.data.length) {
      customerId = customers.data[0].id
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }
  }

  if (!customerId) {
    logger.warn('Portal: no Stripe customer for user', { userId: user.id })
    return NextResponse.json({ error: 'Aucun client Stripe trouvé' }, { status: 404 })
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/account`,
  })

  return ok({ url: portalSession.url })
}
