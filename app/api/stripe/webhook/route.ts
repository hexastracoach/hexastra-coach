import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { planFromPriceKey, StripePriceKey } from '@/lib/billing/stripePlans'
import { logger } from '@/lib/utils/logger'
import { validateEnv } from '@/lib/utils/env'

export const runtime = 'nodejs'

type DbPlan = 'free' | 'essentiel' | 'premium' | 'praticien'

const STRIPE_EVENTS_HANDLED = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
])

function supabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function POST(req: NextRequest) {
  validateEnv({
    STRIPE_SECRET_KEY: {},
    STRIPE_WEBHOOK_SECRET: {},
    NEXT_PUBLIC_SUPABASE_URL: {},
    SUPABASE_SERVICE_ROLE_KEY: {},
  })

  const stripeKey = process.env.STRIPE_SECRET_KEY!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })

  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    logger.error('Signature Stripe invalide', { err })
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  if (!STRIPE_EVENTS_HANDLED.has(event.type)) {
    logger.info('Stripe event ignoré', { type: event.type })
    return NextResponse.json({ received: true })
  }

  const supabase = supabaseServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id || session.metadata?.supabase_user_id || null
        const priceKey = session.metadata?.price_key as StripePriceKey | undefined
        const plan = planFromPriceKey(priceKey)
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id || null
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id || null
        const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null

        logger.info('Checkout session completed', { sessionId: session.id, userId, priceKey, plan })

        if (supabase && userId) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              plan: plan as DbPlan,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              stripe_subscription_status: 'active',
            })
            .eq('id', userId)

          if (profileError) logger.error('Profile update after checkout failed', { profileError })

          const { error: orderError } = await supabase
            .from('orders')
            .update({ status: 'paid', stripe_payment_id: paymentIntentId })
            .eq('stripe_session_id', session.id)

          if (orderError) logger.warn('Order update ignored/failed', { orderError })
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id || null
        const subscriptionId = subscription.id
        const subscriptionStatus = subscription.status
        const priceKey = subscription.metadata?.price_key as StripePriceKey | undefined
        const userId = subscription.metadata?.supabase_user_id ?? null
        const plan = planFromPriceKey(priceKey)

        logger.info('Subscription upsert', { event: event.type, subscriptionId, customerId, userId, priceKey, plan, subscriptionStatus })

        if (supabase) {
          const update = {
            plan: plan as DbPlan,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_subscription_status: subscriptionStatus,
          }

          const { error } = userId
            ? await supabase.from('profiles').update(update).eq('id', userId)
            : await supabase.from('profiles').update(update).eq('stripe_customer_id', customerId)

          if (error) logger.error('Profile update failed on subscription event', { error })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const subscriptionId = subscription.id
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id || null

        logger.info('Subscription deleted', { subscriptionId, customerId })

        if (supabase) {
          const update = {
            plan: 'free' as DbPlan,
            stripe_subscription_id: null,
            stripe_subscription_status: 'canceled',
          }

          if (subscriptionId) {
            const { error } = await supabase.from('profiles').update(update).eq('stripe_subscription_id', subscriptionId)
            if (error) logger.error('Downgrade by subscription_id failed', { error })
          }

          if (customerId) {
            const { error } = await supabase.from('profiles').update(update).eq('stripe_customer_id', customerId)
            if (error) logger.error('Downgrade by customer_id failed', { error })
          }
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id || null
        logger.info('Invoice paid', { invoiceId: invoice.id, customerId })

        if (supabase && customerId) {
          const { error } = await supabase
            .from('profiles')
            .update({ stripe_subscription_status: 'active' })
            .eq('stripe_customer_id', customerId)
          if (error) logger.error('Update status active failed', { error })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id || null
        logger.warn('Invoice payment failed', { invoiceId: invoice.id, customerId })

        if (supabase && customerId) {
          const { error } = await supabase
            .from('profiles')
            .update({ stripe_subscription_status: 'past_due' })
            .eq('stripe_customer_id', customerId)
          if (error) logger.error('Update status past_due failed', { error })
        }
        break
      }

      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    logger.error('Erreur webhook Stripe', { error: err })
    return NextResponse.json({ error: 'Erreur webhook Stripe' }, { status: 500 })
  }
}
