import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseServer } from '@/lib/auth/supabaseServer'
import { STRIPE_PRICE_MAP } from '@/lib/billing/stripePlans'
import { logger } from '@/lib/utils/logger'
import { validateEnv } from '@/lib/utils/env'
import { badRequest, internalError, unauthorized, ok } from '@/lib/utils/apiResponse'

export const runtime = 'nodejs'

const stripeKey = process.env.STRIPE_SECRET_KEY
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

if (!stripeKey) {
  throw new Error('STRIPE_SECRET_KEY manquante')
}

const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })

export async function POST(req: NextRequest) {
  try {
    validateEnv({
      STRIPE_SECRET_KEY: {},
      NEXT_PUBLIC_APP_URL: {},
      NEXT_PUBLIC_SUPABASE_URL: {},
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {},
    })

    const body = await req.json().catch(() => null)
    const priceKey = body?.priceKey as string | undefined

    if (!priceKey) {
      return badRequest('priceKey manquant')
    }

    const priceId = STRIPE_PRICE_MAP[priceKey as keyof typeof STRIPE_PRICE_MAP]
    if (!priceId) {
      return badRequest('Prix invalide ou non configuré')
    }

    const supabase = createSupabaseServer()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return unauthorized()
    }

    let customerId: string | undefined
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id
    } else if (user.email) {
      const existing = await stripe.customers.list({ email: user.email, limit: 1 })
      if (existing.data.length > 0) {
        customerId = existing.data[0].id
      } else {
        const createdCustomer = await stripe.customers.create({
          email: user.email,
          metadata: { supabase_user_id: user.id },
        })
        customerId = createdCustomer.id
      }

      if (customerId) {
        await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer: customerId,
      customer_email: customerId ? undefined : user.email ?? undefined,
      success_url: `${appUrl}/chat?payment=success`,
      cancel_url: `${appUrl}/pricing`,
      locale: 'fr',
      client_reference_id: user.id,
      metadata: { supabase_user_id: user.id, price_key: priceKey },
      subscription_data: {
        metadata: { supabase_user_id: user.id, price_key: priceKey },
      },
      allow_promotion_codes: true,
    })

    if (!session.url) {
      logger.error('Stripe session created without URL', { priceKey })
      return internalError("Impossible de créer l’URL Stripe Checkout")
    }

    return ok({ url: session.url })
  } catch (err: any) {
    logger.error('Checkout error', { error: err })
    return internalError(err?.message ?? 'Erreur interne checkout')
  }
}
