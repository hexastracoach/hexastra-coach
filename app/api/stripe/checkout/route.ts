import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const stripeKey = process.env.STRIPE_SECRET_KEY
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

if (!stripeKey) {
  throw new Error('STRIPE_SECRET_KEY manquante')
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2024-06-20',
})

const PRICE_MAP: Record<string, string | undefined> = {
  essentiel_monthly: process.env.STRIPE_ESSENTIEL_MONTHLY,
  premium_monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
  praticien_monthly: process.env.STRIPE_PRICE_PRATICIEN_MONTHLY,
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const priceKey = body?.priceKey as string | undefined

    if (!priceKey) {
      return NextResponse.json(
        { error: 'priceKey manquant' },
        { status: 400 }
      )
    }

    const priceId = PRICE_MAP[priceKey]

    if (!priceId) {
      return NextResponse.json(
        { error: 'Prix invalide ou non configuré' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Utilisateur non authentifié' },
        { status: 401 }
      )
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
      const existing = await stripe.customers.list({
        email: user.email,
        limit: 1,
      })

      if (existing.data.length > 0) {
        customerId = existing.data[0].id
      } else {
        const createdCustomer = await stripe.customers.create({
          email: user.email,
          metadata: {
            supabase_user_id: user.id,
          },
        })
        customerId = createdCustomer.id
      }

      if (customerId) {
        await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id)
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

      metadata: {
        supabase_user_id: user.id,
        price_key: priceKey,
      },

      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          price_key: priceKey,
        },
      },

      allow_promotion_codes: true,
    })

    if (!session.url) {
      return NextResponse.json(
        { error: 'Impossible de créer l’URL Stripe Checkout' },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Checkout error:', err)
    return NextResponse.json(
      { error: err?.message ?? 'Erreur interne checkout' },
      { status: 500 }
    )
  }
}