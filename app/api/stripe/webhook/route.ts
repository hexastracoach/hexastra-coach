import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type PlanType = 'free' | 'essentiel' | 'premium' | 'praticien'

function getPlanFromPriceKey(priceKey?: string | null): PlanType {
  if (priceKey === 'praticien_monthly') return 'praticien'
  if (priceKey === 'premium_monthly') return 'premium'
  if (priceKey === 'essentiel_monthly') return 'essentiel'
  return 'free'
}

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!stripeKey || !webhookSecret) {
    console.error('Stripe non configuré')
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 503 })
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2024-06-20',
  })

  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error('Signature Stripe invalide', err)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  const supabase =
    supabaseUrl && supabaseKey
      ? createClient(supabaseUrl, supabaseKey)
      : null

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        const userId =
          session.client_reference_id ||
          session.metadata?.supabase_user_id ||
          null

        const priceKey = session.metadata?.price_key ?? null
        const plan = getPlanFromPriceKey(priceKey)

        const customerId =
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id || null

        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id || null

        const paymentIntentId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id || null

        console.log('Checkout Stripe terminé', {
          sessionId: session.id,
          userId,
          priceKey,
          plan,
          customerId,
          subscriptionId,
        })

        if (supabase) {
          // Mise à jour orders si la table existe et si une ligne correspond
          const { error: orderError } = await supabase
            .from('orders')
            .update({
              status: 'paid',
              stripe_payment_id: paymentIntentId,
            })
            .eq('stripe_session_id', session.id)

          if (orderError) {
            console.warn('Update orders ignoré ou échoué:', orderError.message)
          }

          if (userId) {
            const { error: profileError } = await supabase
              .from('profiles')
              .update({
                plan,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                stripe_subscription_status: 'active',
              })
              .eq('id', userId)

            if (profileError) {
              console.error('Erreur update profiles après checkout:', profileError)
            } else {
              console.log(`Plan utilisateur mis à jour → ${plan}`)
            }
          } else {
            console.warn('userId introuvable dans checkout.session.completed')
          }
        }

        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id || null

        const subscriptionId = subscription.id
        const subscriptionStatus = subscription.status
        const priceKey = subscription.metadata?.price_key ?? null
        const userId = subscription.metadata?.supabase_user_id ?? null
        const plan = getPlanFromPriceKey(priceKey)

        console.log('Subscription créée / mise à jour', {
          eventType: event.type,
          subscriptionId,
          customerId,
          userId,
          priceKey,
          plan,
          subscriptionStatus,
        })

        if (supabase) {
          if (userId) {
            const { error } = await supabase
              .from('profiles')
              .update({
                plan,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                stripe_subscription_status: subscriptionStatus,
              })
              .eq('id', userId)

            if (error) {
              console.error(`Erreur update profiles (${event.type}) par userId:`, error)
            }
          } else if (customerId) {
            const { error } = await supabase
              .from('profiles')
              .update({
                plan,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                stripe_subscription_status: subscriptionStatus,
              })
              .eq('stripe_customer_id', customerId)

            if (error) {
              console.error(
                `Erreur update profiles (${event.type}) par stripe_customer_id:`,
                error
              )
            }
          } else {
            console.warn('Ni userId ni customerId trouvés sur subscription event')
          }
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const subscriptionId = subscription.id
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id || null

        console.log('Subscription supprimée', {
          subscriptionId,
          customerId,
        })

        if (supabase) {
          if (subscriptionId) {
            const { error } = await supabase
              .from('profiles')
              .update({
                plan: 'free',
                stripe_subscription_id: null,
                stripe_subscription_status: 'canceled',
              })
              .eq('stripe_subscription_id', subscriptionId)

            if (error) {
              console.error(
                'Erreur downgrade profile par stripe_subscription_id:',
                error
              )
            }
          }

          if (customerId) {
            const { error } = await supabase
              .from('profiles')
              .update({
                plan: 'free',
                stripe_subscription_id: null,
                stripe_subscription_status: 'canceled',
              })
              .eq('stripe_customer_id', customerId)

            if (error) {
              console.error(
                'Erreur downgrade profile par stripe_customer_id:',
                error
              )
            }
          }
        }

        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice

        const customerId =
          typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.id || null

        console.log('Facture abonnement payée', {
          invoiceId: invoice.id,
          customerId,
        })

        if (supabase && customerId) {
          const { error } = await supabase
            .from('profiles')
            .update({
              stripe_subscription_status: 'active',
            })
            .eq('stripe_customer_id', customerId)

          if (error) {
            console.error('Erreur update stripe_subscription_status=active:', error)
          }
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        const customerId =
          typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.id || null

        console.warn('Paiement abonnement échoué', {
          invoiceId: invoice.id,
          customerId,
        })

        if (supabase && customerId) {
          const { error } = await supabase
            .from('profiles')
            .update({
              stripe_subscription_status: 'past_due',
            })
            .eq('stripe_customer_id', customerId)

          if (error) {
            console.error('Erreur update stripe_subscription_status=past_due:', error)
          }
        }

        break
      }

      default:
        console.log('Event Stripe ignoré:', event.type)
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Erreur webhook Stripe', err)

    return NextResponse.json(
      { error: 'Erreur webhook Stripe' },
      { status: 500 }
    )
  }
}