import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {

  const stripeKey = process.env.STRIPE_SECRET_KEY
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (!stripeKey) {
    return NextResponse.json(
      { error: 'Stripe non configuré' },
      { status: 503 }
    )
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2024-06-20'
  })

  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Utilisateur non authentifié' },
      { status: 401 }
    )
  }

  /**
   * récupérer le stripe_customer_id stocké
   */
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id

  /**
   * si pas trouvé dans la base
   * on tente via l'email
   */
  if (!customerId && user.email) {

    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    })

    if (customers.data.length) {
      customerId = customers.data[0].id

      /**
       * sauvegarde dans Supabase
       */
      await supabase
        .from('profiles')
        .update({
          stripe_customer_id: customerId
        })
        .eq('id', user.id)

    }

  }

  if (!customerId) {
    return NextResponse.json(
      { error: 'Aucun client Stripe trouvé' },
      { status: 404 }
    )
  }

  /**
   * création session portal
   */
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/account`
  })

  return NextResponse.json({
    url: portalSession.url
  })

}