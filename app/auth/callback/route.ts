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
    console.error('Supabase auth error:', error.message)
    return NextResponse.redirect(new URL('/auth', requestUrl.origin))
  }

  // Ensure profile exists
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (!userError && userData.user) {
    try {
      await getOrCreateProfile({
        id: userData.user.id,
        email: userData.user.email,
        full_name: (userData.user.user_metadata as any)?.full_name ?? null,
      })
    } catch (profileError) {
      logger.error('auth/callback: getOrCreateProfile failed', { profileError })
    }
  }

  return response
}
