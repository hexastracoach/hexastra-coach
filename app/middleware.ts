import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type PlanType = 'free' | 'essentiel' | 'premium' | 'praticien'

const PUBLIC_PATHS = [
  '/',
  '/pricing',
  '/chat',
  '/auth',
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
]

const ALWAYS_ALLOWED_PREFIXES = [
  '/api/stripe',
  '/_next',
  '/favicon.ico',
]

const ESSENTIEL_PATH_PREFIXES = ['/essentiel']
const PREMIUM_PATH_PREFIXES = ['/premium']
const PRATICIEN_PATH_PREFIXES = ['/praticien']

const AUTH_REQUIRED_PREFIXES = [
  '/account',
  '/essentiel',
  '/premium',
  '/praticien',
]

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
}

function hasRequiredPlan(userPlan: PlanType, pathname: string) {

  if (startsWithAny(pathname, PRATICIEN_PATH_PREFIXES)) {
    return userPlan === 'praticien'
  }

  if (startsWithAny(pathname, PREMIUM_PATH_PREFIXES)) {
    return userPlan === 'premium' || userPlan === 'praticien'
  }

  if (startsWithAny(pathname, ESSENTIEL_PATH_PREFIXES)) {
    return (
      userPlan === 'essentiel' ||
      userPlan === 'premium' ||
      userPlan === 'praticien'
    )
  }

  return true
}

function getRequiredPlan(pathname: string): PlanType | null {

  if (startsWithAny(pathname, PRATICIEN_PATH_PREFIXES)) return 'praticien'
  if (startsWithAny(pathname, PREMIUM_PATH_PREFIXES)) return 'premium'
  if (startsWithAny(pathname, ESSENTIEL_PATH_PREFIXES)) return 'essentiel'

  return null
}

export async function middleware(req: NextRequest) {

  const pathname = req.nextUrl.pathname
  const res = NextResponse.next()

  /**
   * routes toujours autorisées
   */

  if (startsWithAny(pathname, ALWAYS_ALLOWED_PREFIXES)) {
    return res
  }

  /**
   * routes publiques
   */

  if (isPublicPath(pathname)) {
    return res
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value
        },
        set(name, value, options) {
          res.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const needsAuth = startsWithAny(pathname, AUTH_REQUIRED_PREFIXES)

  /**
   * utilisateur non connecté
   */

  if (needsAuth && !user) {

    const loginUrl = new URL('/auth/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)

    return NextResponse.redirect(loginUrl)
  }

  if (!user) {
    return res
  }

  /**
   * récupération profil
   */

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('plan, stripe_subscription_status')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Middleware profile error:', error)
  }

  let userPlan: PlanType =
    profile?.plan === 'essentiel' ||
    profile?.plan === 'premium' ||
    profile?.plan === 'praticien'
      ? profile.plan
      : 'free'

  const subscriptionStatus = profile?.stripe_subscription_status

  /**
   * sécurité abonnement Stripe
   */

  if (
    userPlan !== 'free' &&
    subscriptionStatus &&
    subscriptionStatus !== 'active' &&
    subscriptionStatus !== 'trialing'
  ) {

    console.log('Subscription inactive → downgrade free')

    userPlan = 'free'
  }

  /**
   * vérification accès plan
   */

  if (!hasRequiredPlan(userPlan, pathname)) {

    const pricingUrl = new URL('/pricing', req.url)

    const requiredPlan = getRequiredPlan(pathname)

    if (requiredPlan) {
      pricingUrl.searchParams.set('required', requiredPlan)
    }

    pricingUrl.searchParams.set('current', userPlan)
    pricingUrl.searchParams.set('from', pathname)

    return NextResponse.redirect(pricingUrl)
  }

  return res
}

export const config = {
  matcher: [
    '/account/:path*',
    '/essentiel/:path*',
    '/premium/:path*',
    '/praticien/:path*',
  ],
}