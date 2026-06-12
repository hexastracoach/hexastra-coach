import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getOrCreateProfile } from '@/lib/profiles/getOrCreateProfile'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {

  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')
  const safeNext = next && next.startsWith('/') ? next : '/chat'

  if (!code) {
    return NextResponse.redirect(new URL('/auth', requestUrl.origin))
  }

  const response = NextResponse.redirect(new URL(safeNext, requestUrl.origin))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    logger.error('auth/callback: exchangeCodeForSession failed', { message: error.message })
    return NextResponse.redirect(new URL('/auth', requestUrl.origin))
  }

  // Ensure profile exists
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (!userError && userData.user) {
    try {
      const metadata = userData.user.user_metadata as Record<string, unknown>
      const firstName = typeof metadata.first_name === 'string' ? metadata.first_name.trim() : ''
      const lastName = typeof metadata.last_name === 'string' ? metadata.last_name.trim() : ''
      const fullName =
        (typeof metadata.full_name === 'string' && metadata.full_name.trim()) ||
        [firstName, lastName].filter(Boolean).join(' ') ||
        (typeof metadata.name === 'string' && metadata.name.trim()) ||
        null

      await getOrCreateProfile({
        id: userData.user.id,
        email: userData.user.email,
        full_name: fullName,
      })
    } catch (profileError) {
      logger.error('auth/callback: getOrCreateProfile failed', { profileError })
    }
  }

  return response
}
