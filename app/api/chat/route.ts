import { createHash, randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { runHexastraFlow } from '@/lib/hexastra/orchestrator/runHexastraFlow'
import { enrichReadingResponse } from '@/lib/hexastra/response/enrichReadingResponse'
import type {
  BirthProfile,
  ContextType,
  PractitionerUsageHex,
  UiAction,
} from '@/lib/hexastra/types'
import type { PlanKey } from '@/types/subscription'
import type { ChatMessage } from '@/lib/chat/chatPayloadBuilder'
import { mapDbPlanToPlanKey, downgradeIfInactive } from '@/lib/permissions/plan'
import { logger } from '@/lib/utils/logger'
import { createSupabaseServer } from '@/lib/auth/supabaseServer'
import { validateEnv } from '@/lib/utils/env'
import { getOrCreateProfile } from '@/lib/profiles/getOrCreateProfile'
import { generateConversation } from '@/lib/hexastra/openai/generateConversation'
import { formatAnalysis } from '@/lib/hexastra/openai/formatAnalysis'
import { classifyIntent } from '@/lib/hexastra/openai/classifyIntent'
import { generateSuggestions } from '@/lib/hexastra/suggestions/generateSuggestions'
import { getMenuForMode } from '@/lib/hexastra/menus/getMenuForMode'
import { getModeForPlan } from '@/lib/hexastra/config/planModeMap'

const memoryCache = new Map<string, { value: unknown; expires: number }>()
const CACHE_TTL_MS = 10 * 60 * 1000

export const runtime = 'nodejs'

type DbPlan = 'free' | 'essentiel' | 'premium' | 'praticien'
type UsageFeature = 'chat_api'
type ResponseDepth = 'short' | 'medium' | 'long' | 'expert'
type ChatResponsePayload = Record<string, unknown> & {
  message?: string
  reply?: string
  content?: string
  type?: string
  plan?: PlanKey
  mode?: PlanKey | string
  conversationId?: string
  flowState?: Record<string, unknown>
  menu?: Record<string, unknown>
  metadata?: Record<string, unknown>
}
const SUPPORTED_LANGUAGES = ['fr', 'en', 'es', 'pt', 'de', 'it'] as const
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

const PLAN_LIMITS: Record<PlanKey, number | null> = {
  free: 10,
  essential: 60,
  premium: null,
  practitioner: null,
}

const REQUIRED_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: {},
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {},
  SUPABASE_SERVICE_ROLE_KEY: {},
}

function getResponseDepth(plan: PlanKey): ResponseDepth {
  switch (plan) {
    case 'essential':
      return 'medium'
    case 'premium':
      return 'long'
    case 'practitioner':
      return 'expert'
    default:
      return 'short'
  }
}

function normalizeText(value: string): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

const DEFAULT_FALLBACK_MESSAGE = 'Je suis là. Dis-moi ce dont tu as besoin.'
const DEFAULT_EMPTY_MENU = { visible: false, items: [] }

function buildConsistentResponse(
  payload: ChatResponsePayload,
  defaults?: {
    type?: string
    plan?: PlanKey
    mode?: PlanKey | string
    conversationId?: string
    flowState?: Record<string, unknown>
    menu?: Record<string, unknown>
  }
): ChatResponsePayload {
  const trimmedMessage =
    typeof payload.message === 'string' && payload.message.trim().length > 0
      ? payload.message.trim()
      : null
  const trimmedReply =
    typeof payload.reply === 'string' && payload.reply.trim().length > 0
      ? payload.reply.trim()
      : null
  const trimmedContent =
    typeof payload.content === 'string' && payload.content.trim().length > 0
      ? payload.content.trim()
      : null

  const finalText =
    trimmedMessage ?? trimmedReply ?? trimmedContent ?? DEFAULT_FALLBACK_MESSAGE

  return {
    ...payload,
    message: finalText,
    reply: finalText,
    content: finalText,
    type:
      typeof payload.type === 'string'
        ? payload.type
        : defaults?.type ?? 'conversation',
    plan:
      (typeof payload.plan === 'string' ? payload.plan : defaults?.plan) ?? 'free',
    mode:
      (typeof payload.mode === 'string' ? payload.mode : defaults?.mode) ??
      (typeof payload.plan === 'string' ? payload.plan : defaults?.plan) ??
      'free',
    conversationId:
      (typeof payload.conversationId === 'string' && payload.conversationId.trim()) ||
      defaults?.conversationId ||
      randomUUID(),
    flowState:
      payload.flowState && typeof payload.flowState === 'object'
        ? payload.flowState
        : defaults?.flowState ?? { step: 'conversation', completed: true },
    menu:
      payload.menu && typeof payload.menu === 'object'
        ? payload.menu
        : defaults?.menu ?? DEFAULT_EMPTY_MENU,
  }
}

function getNormalizationDiagnostics(payload: ChatResponsePayload) {
  const message = typeof payload.message === 'string' ? payload.message.trim() : ''
  const reply = typeof payload.reply === 'string' ? payload.reply.trim() : ''
  const content = typeof payload.content === 'string' ? payload.content.trim() : ''
  const from = message ? 'message' : reply ? 'reply' : content ? 'content' : 'fallback'
  const finalText = message || reply || content || DEFAULT_FALLBACK_MESSAGE

  return {
    from,
    usedLocalFallback: from === 'fallback',
    finalTextLength: finalText.length,
  }
}

function isGreeting(normalized: string): boolean {
  return /^(salut|bonjour|hello|hey|coucou|yo|bonsoir|hi|cava|ca va|ça va|merci|ok|daccord|dac|oui|non)$/.test(
    normalized.replace(/\s+/g, '')
  )
}

function detectIntentLocal(message: string): 'greeting' | 'menu' | 'birth_update' | 'analysis' | 'conversation' {
  const norm = normalizeText(message)
  if (isGreeting(norm)) return 'greeting'
  if (/(menu|angle|angles|option|choix|navigation)/.test(norm)) return 'menu'
  if (/(profil|analyse|lecture|theme|thème|astral|natal|astro|relation|travail|periode|période|decision|décision|blocage|question|hexastra|neurokua|kua|etat du jour|état du jour)/.test(norm)) {
    return 'analysis'
  }
  if (
    /(donnees de naissance mises a jour|donnees naissance mises a jour|birth data updated|ne e le|nee le|ne le|prenom|date de naissance|heure de naissance|ville de naissance|pays de naissance)/.test(
      norm
    )
  ) {
    return 'birth_update'
  }
  return 'conversation'
}

function buildCacheKey(userId: string | null, message: string, birthData?: unknown) {
  const bd = birthData ? JSON.stringify(birthData) : ''
  return `${userId ?? 'guest'}::${message}::${bd}`
}

function getCache(key: string) {
  const hit = memoryCache.get(key)
  if (hit && hit.expires > Date.now()) return hit.value
  memoryCache.delete(key)
  return null
}

function setCache(key: string, value: unknown) {
  memoryCache.set(key, { value, expires: Date.now() + CACHE_TTL_MS })
}

function limitHistory(messages: ChatMessage[], max = 6): ChatMessage[] {
  const recent = messages.slice(-max)
  const users = recent.filter((m) => m.role === 'user').slice(-3)
  const assistants = recent.filter((m) => m.role === 'assistant').slice(-2)
  const allowed = new Set([...users, ...assistants])
  return recent.filter((m) => allowed.has(m))
}

function normalizeBirthData(raw: unknown): BirthProfile | null {
  if (!raw || typeof raw !== 'object') return null

  const data = raw as Record<string, unknown>
  const isoRaw = typeof data.birthDateISO === 'string' ? data.birthDateISO.trim() : ''
  let isoDate: string | undefined
  let isoTime: string | undefined
  if (isoRaw && isoRaw.includes('T')) {
    const [d, t] = isoRaw.split('T')
    isoDate = d
    isoTime = (t || '').replace('Z', '').slice(0, 5)
  }

  const birthTimeKnown =
    typeof data.birthTimeKnown === 'boolean' ? data.birthTimeKnown : undefined

  const birth: BirthProfile = {
    name: typeof data.name === 'string' ? data.name.trim() : undefined,
    firstName: typeof data.firstName === 'string' ? data.firstName.trim() : undefined,
    lastName: typeof data.lastName === 'string' ? data.lastName.trim() : undefined,
    date:
      typeof data.date === 'string'
        ? data.date.trim()
        : typeof data.birthDate === 'string'
          ? data.birthDate.trim()
          : isoDate,
    time:
      typeof data.time === 'string'
        ? data.time.trim()
        : typeof data.birthTime === 'string'
          ? data.birthTime.trim()
          : isoTime,
    place:
      typeof data.place === 'string'
        ? data.place.trim()
        : typeof data.birthCity === 'string'
          ? data.birthCity.trim()
          : undefined,
    country:
      typeof data.country === 'string'
        ? data.country.trim()
        : typeof data.birthCountryName === 'string'
          ? data.birthCountryName.trim()
          : undefined,
    lat: typeof data.lat === 'number' ? data.lat : undefined,
    lon: typeof data.lon === 'number' ? data.lon : undefined,
    gender: typeof data.gender === 'string' ? data.gender.trim() : undefined,
    birthDateISO: isoRaw || undefined,
    birthTimeKnown,
  }

  const hasUsefulData = Boolean(
    birth.firstName ||
      birth.lastName ||
      birth.date ||
      birth.time ||
      birth.place ||
      birth.country ||
      typeof birth.lat === 'number' ||
      typeof birth.lon === 'number'
  )

  return hasUsefulData ? birth : null
}

function buildSafeErrorResponse() {
  return buildConsistentResponse(
    {
      message: "Je n’ai pas pu analyser cette demande pour le moment. Essaie de reformuler ou choisis une option du menu.",
      mode: 'free',
      plan: 'free',
      flowState: { step: 'error', completed: false },
      conversationId: randomUUID(),
      metadata: {
        shouldPersistMemory: false,
      },
    },
    {
      type: 'error',
      plan: 'free',
      mode: 'free',
      flowState: { step: 'error', completed: false },
      menu: DEFAULT_EMPTY_MENU,
    }
  )
}

function buildQuotaErrorResponse(params: { plan: PlanKey; used: number; limit: number; resetAt: string | null }) {
  const { plan, used, limit, resetAt } = params

  const planLabel =
    plan === 'essential'
      ? 'Essentiel'
      : plan === 'premium'
        ? 'Premium'
        : plan === 'practitioner'
          ? 'Praticien'
          : 'Gratuit'

  const freeMessage = `Tu as atteint la limite de ton accès découverte pour le moment.

Ton espace gratuit se réouvrira automatiquement dans 24h.
Si tu veux continuer maintenant, tu peux passer à Essentiel.`

  const paidMessage = `Tu as atteint la limite de ton plan ${planLabel} pour le moment.

Tu pourras réessayer plus tard, ou passer à l’offre supérieure si tu veux continuer tout de suite.`

  const finalMessage = plan === 'free' ? freeMessage : paidMessage

  return buildConsistentResponse(
    {
      message: finalMessage,
      mode: plan,
      plan,
      flowState: { step: 'quota_limit', completed: false },
      conversationId: randomUUID(),
      metadata: {
        shouldPersistMemory: false,
        quotaExceeded: true,
        resetAt,
        used,
        limit,
      },
    },
    {
      type: 'quota',
      plan,
      mode: plan,
      flowState: { step: 'quota_limit', completed: false },
      menu: DEFAULT_EMPTY_MENU,
    }
  )
}

function getGuestSubjectKey(req: NextRequest) {
  const ua = req.headers.get('user-agent') || ''
  const ip = req.headers.get('x-forwarded-for') || ''
  return createHash('sha1')
    .update(`${ua}::${ip}`)
    .digest('hex')
}

function normalizeLanguage(language: string | undefined | null): SupportedLanguage | null {
  if (!language || typeof language !== 'string') return null
  const value = language.slice(0, 2).toLowerCase()
  return SUPPORTED_LANGUAGES.includes(value as SupportedLanguage) ? (value as SupportedLanguage) : null
}

function resolveRequestedLanguage(body: Record<string, unknown>, messages: ChatMessage[]) {
  const explicitLanguage = normalizeLanguage(
    typeof body.language === 'string'
      ? body.language.trim()
      : typeof body.chatLanguage === 'string'
        ? body.chatLanguage.trim()
        : undefined
  )

  if (explicitLanguage) return explicitLanguage

  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content
  const detected = lastUserMessage ? detectLanguageFromText(lastUserMessage) : null
  return detected ?? 'fr'
}

function detectLanguageFromText(text: string): SupportedLanguage | null {
  const samples: { lang: SupportedLanguage; terms: string[] }[] = [
    { lang: 'fr', terms: ['bonjour', 'salut'] },
    { lang: 'en', terms: ['hello', 'hi', 'thanks'] },
    { lang: 'es', terms: ['hola', 'gracias'] },
    { lang: 'pt', terms: ['olá', 'obrigado'] },
    { lang: 'de', terms: ['hallo', 'danke'] },
    { lang: 'it', terms: ['ciao', 'grazie'] },
  ]

  const lowered = (text || '').toLowerCase()
  const scores = samples.map((sample) => ({
    lang: sample.lang,
    score: sample.terms.reduce((s, term) => (lowered.includes(term) ? s + 1 : s), 0),
  }))

  const best = scores.reduce((max, current) => (current.score > max.score ? current : max), { lang: 'fr' as SupportedLanguage, score: 0 })
  return best.score === 0 ? null : best.lang
}

async function resolveEffectivePlan(req: NextRequest): Promise<{ plan: PlanKey; userId: string | null }> {
  try {
    const supabase = createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { plan: 'free', userId: null }

    const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!adminUrl || !adminKey) return { plan: 'free', userId: user.id }

    const { profile } = await getOrCreateProfile({ id: user.id, email: user.email, full_name: null })
    const plan = downgradeIfInactive(mapDbPlanToPlanKey(profile.plan as DbPlan | undefined), profile.stripe_subscription_status ?? null)
    return { plan, userId: user.id }
  } catch (error) {
    logger.error('[api/chat] resolveEffectivePlan failed', { error })
    return { plan: 'free', userId: null }
  }
}

async function enforceDailyQuota(params: { req: NextRequest; userId: string | null; plan: PlanKey; feature: UsageFeature }) {
  const { req, userId, plan, feature } = params

  const limit = PLAN_LIMITS[plan]
  if (limit === null) {
    return {
      blocked: false as const,
      used: 0,
      limit: null,
      remaining: null,
      resetAt: null,
      windowStartedAt: null,
    }
  }

  const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!adminUrl || !adminKey) {
    logger.warn('[api/chat] quota disabled: missing admin Supabase env')
    return {
      blocked: false as const,
      used: 0,
      limit,
      remaining: limit,
      resetAt: null,
      windowStartedAt: null,
    }
  }

  const admin = createAdminClient(adminUrl, adminKey)
  const subjectKey = userId ? `user:${userId}` : getGuestSubjectKey(req)
  const now = new Date()

  const key = createHash('sha1')
    .update(`${subjectKey}::${feature}::${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`)
    .digest('hex')

  const { data } = await admin
    .from('daily_usage')
    .select('*')
    .eq('usage_key', key)
    .maybeSingle()

  const used = data?.used ?? 0
  const blocked = used >= limit

  const remaining = blocked ? 0 : Math.max(0, limit - used)
  const resetAt = new Date()
  resetAt.setUTCDate(resetAt.getUTCDate() + 1)
  resetAt.setUTCHours(0, 0, 0, 0)

  return {
    blocked,
    used,
    limit,
    remaining,
    resetAt: resetAt.toISOString(),
    windowStartedAt: data?.window_started_at ?? null,
  }
}

export async function POST(req: NextRequest) {
  const requestId = randomUUID()
  const log = (level: 'info' | 'debug' | 'warn' | 'error', msg: string, meta?: Record<string, unknown>) => {
    logger[level](`[api/chat][${requestId}] ${msg}`, meta)
  }

  log('info', 'POST hit')

  try {
    validateEnv(REQUIRED_ENV)

    const body = await req.json().catch(() => null)
    log('debug', 'body parsed', { hasBody: Boolean(body) })

    if (!body || typeof body !== 'object') {
      log('warn', 'invalid body')
      const safeErrorResponse = buildSafeErrorResponse()
      log('info', 'response normalized', {
        branch: 'safe_error',
        ...getNormalizationDiagnostics(safeErrorResponse),
      })
      return NextResponse.json(safeErrorResponse, { status: 400 })
    }

    const requestType =
      (body as Record<string, unknown>).requestType === 'micro_profile' ||
      (body as Record<string, unknown>).requestType === 'micro_year' ||
      (body as Record<string, unknown>).requestType === 'micro_month'
        ? ((body as Record<string, unknown>).requestType as 'micro_profile' | 'micro_year' | 'micro_month')
        : 'chat'

    const sanitizedMessages = limitHistory(sanitizeMessages((body as Record<string, unknown>).messages))
    const lastUserMessage = [...sanitizedMessages].reverse().find((m) => m.role === 'user')?.content?.trim() ?? ''
    const normalizedLast = normalizeText(lastUserMessage)
    const requestedConversationId =
      typeof (body as Record<string, unknown>).conversationId === 'string'
        ? ((body as Record<string, unknown>).conversationId as string)
        : null

    log('info', 'request summary', {
      requestType,
      messagesCount: sanitizedMessages.length,
      lastUserMessage,
      normalizedLast,
    })

    const { plan: effectivePlan, userId } = await resolveEffectivePlan(req)
    log('info', 'effective plan resolved', { effectivePlan, userId })

    const responseDepth = getResponseDepth(effectivePlan)
    const journeyEnabled =
      typeof (body as Record<string, unknown>).journeyEnabled === 'boolean'
        ? ((body as Record<string, unknown>).journeyEnabled as boolean)
        : false

    const intentLocal = detectIntentLocal(lastUserMessage)
    log('info', 'intent detected', { intentLocal })

    if (intentLocal === 'greeting') {
      log('info', 'branch chosen', { branch: 'greeting' })
      const greetingMenu = getMenuForMode(getModeForPlan(effectivePlan))
      const payload = {
        content:
          'Bonjour. Choisis simplement un angle du menu et je t’accompagne directement sur la bonne lecture.',
        type: 'greeting',
        plan: effectivePlan,
        mode: effectivePlan,
        conversationId: requestedConversationId ?? randomUUID(),
        flowState: { step: 'menu', completed: true },
        menu: {
          visible: true,
          items: greetingMenu,
        },
        metadata: {
          contextType: 'general',
          selectedMenuKey: null,
          selectedSubmenuKey: null,
          intentDetected: 'greeting',
        },
      }
      const resp = buildConsistentResponse(payload, {
        type: 'greeting',
        plan: effectivePlan,
        mode: effectivePlan,
        conversationId: requestedConversationId ?? undefined,
        flowState: { step: 'menu', completed: true },
        menu: {
          visible: true,
          items: greetingMenu,
        },
      })
      log('info', 'response normalized', {
        branch: 'greeting',
        ...getNormalizationDiagnostics(payload),
      })
      return NextResponse.json(resp, { status: 200 })
    }

    const cacheKey = buildCacheKey(userId, lastUserMessage, normalizeBirthData((body as Record<string, unknown>).birthData))
    const cached = getCache(cacheKey)
    if (cached) {
      const cachedResponse = buildConsistentResponse(cached as ChatResponsePayload, {
        plan: effectivePlan,
        mode: effectivePlan,
        conversationId: requestedConversationId ?? undefined,
        menu: DEFAULT_EMPTY_MENU,
      })
      log('info', 'cacheHit', {
        cacheKey,
        branch: 'cache',
        ...getNormalizationDiagnostics(cached as ChatResponsePayload),
      })
      return NextResponse.json(cachedResponse, { status: 200 })
    }

    if (intentLocal === 'menu') {
      log('info', 'branch chosen', { branch: 'menu' })
      const menuResponse = await runHexastraFlow({
        plan: effectivePlan,
        responseDepth,
        language: resolveRequestedLanguage(body as Record<string, unknown>, sanitizedMessages),
        requestType: 'chat',
        birthData: normalizeBirthData((body as Record<string, unknown>).birthData),
        practitionerUsage: normalizePractitionerUsage((body as Record<string, unknown>).practitionerUsage),
        contextType: 'general',
        selectedMenuKey: null,
        selectedSubmenuKey: null,
        uiAction: 'open_menu',
        conversationId:
          typeof (body as Record<string, unknown>).conversationId === 'string'
            ? ((body as Record<string, unknown>).conversationId as string)
            : null,
        messages: sanitizedMessages,
        evolutionProfile:
          (body as Record<string, unknown>).evolutionProfile &&
          typeof (body as Record<string, unknown>).evolutionProfile === 'object'
            ? ((body as Record<string, unknown>).evolutionProfile as Record<string, unknown>)
            : null,
        journeyEnabled,
      })
      const normalizedMenuResponse = buildConsistentResponse(menuResponse as ChatResponsePayload, {
        type: 'menu',
        plan: effectivePlan,
        mode: effectivePlan,
        conversationId: requestedConversationId ?? undefined,
        flowState: { step: 'menu', completed: true },
        menu: DEFAULT_EMPTY_MENU,
      })
      setCache(cacheKey, normalizedMenuResponse)
      log('info', 'response normalized', {
        branch: 'menu',
        ...getNormalizationDiagnostics(menuResponse as ChatResponsePayload),
      })
      const status = normalizedMenuResponse.flowState?.step === 'error' ? 500 : 200
      return NextResponse.json(normalizedMenuResponse, { status })
    }

    if (intentLocal === 'birth_update') {
      log('info', 'branch chosen', { branch: 'birth_update' })
      const birthResponse = await runHexastraFlow({
        plan: effectivePlan,
        responseDepth,
        language: resolveRequestedLanguage(body as Record<string, unknown>, sanitizedMessages),
        requestType: 'chat',
        birthData: normalizeBirthData((body as Record<string, unknown>).birthData),
        practitionerUsage: normalizePractitionerUsage((body as Record<string, unknown>).practitionerUsage),
        contextType: 'general',
        selectedMenuKey: null,
        selectedSubmenuKey: null,
        uiAction: 'restart_flow',
        conversationId:
          typeof (body as Record<string, unknown>).conversationId === 'string'
            ? ((body as Record<string, unknown>).conversationId as string)
            : null,
        messages: sanitizedMessages,
        evolutionProfile:
          (body as Record<string, unknown>).evolutionProfile &&
          typeof (body as Record<string, unknown>).evolutionProfile === 'object'
            ? ((body as Record<string, unknown>).evolutionProfile as Record<string, unknown>)
            : null,
        journeyEnabled,
      })
      const normalizedBirthResponse = buildConsistentResponse(birthResponse as ChatResponsePayload, {
        type: 'birth_update',
        plan: effectivePlan,
        mode: effectivePlan,
        conversationId: requestedConversationId ?? undefined,
        flowState: { step: 'birthdata', completed: true },
        menu: DEFAULT_EMPTY_MENU,
      })
      setCache(cacheKey, normalizedBirthResponse)
      log('info', 'response normalized', {
        branch: 'birth_update',
        ...getNormalizationDiagnostics(birthResponse as ChatResponsePayload),
      })
      const status = normalizedBirthResponse.flowState?.step === 'error' ? 500 : 200
      return NextResponse.json(normalizedBirthResponse, { status })
    }

    const quota = await enforceDailyQuota({
      req,
      userId,
      plan: effectivePlan,
      feature: 'chat_api',
    })

    log('debug', 'quota', quota as any)

    if (quota.blocked && quota.limit !== null) {
      log('warn', 'quota blocked', { userId, plan: effectivePlan, used: quota.used })
      const quotaResponse = buildQuotaErrorResponse({
        plan: effectivePlan,
        used: quota.used,
        limit: quota.limit,
        resetAt: quota.resetAt,
      })
      log('info', 'response normalized', {
        branch: 'quota',
        ...getNormalizationDiagnostics(quotaResponse),
      })
      return NextResponse.json(
        quotaResponse,
        { status: 429 }
      )
    }

    if (intentLocal === 'conversation') {
      log('info', 'branch chosen', { branch: 'conversation' })
      try {
        const content = await generateConversation(lastUserMessage || 'Bonjour.')
        const convResponse = buildConsistentResponse(
          {
            content,
            type: 'conversation',
            plan: effectivePlan,
            mode: effectivePlan,
            conversationId: requestedConversationId ?? randomUUID(),
            flowState: { step: 'conversation', completed: true },
            menu: DEFAULT_EMPTY_MENU,
          },
          {
            type: 'conversation',
            plan: effectivePlan,
            mode: effectivePlan,
            conversationId: requestedConversationId ?? undefined,
            flowState: { step: 'conversation', completed: true },
            menu: DEFAULT_EMPTY_MENU,
          }
        )
        setCache(cacheKey, convResponse)
        log('info', 'response normalized', {
          branch: 'conversation',
          ...getNormalizationDiagnostics({ content }),
        })
        return NextResponse.json(convResponse, { status: 200 })
      } catch (error) {
        log('warn', 'simple conversation failed, fallback local', { error: (error as Error)?.message })
        const payload = {
          type: 'conversation',
          plan: effectivePlan,
          mode: effectivePlan,
          conversationId: requestedConversationId ?? randomUUID(),
          flowState: { step: 'conversation', completed: true },
          menu: DEFAULT_EMPTY_MENU,
        }
        const convResponse = buildConsistentResponse(payload, {
          type: 'conversation',
          plan: effectivePlan,
          mode: effectivePlan,
          conversationId: requestedConversationId ?? undefined,
          flowState: { step: 'conversation', completed: true },
          menu: DEFAULT_EMPTY_MENU,
        })
        log('info', 'response normalized', {
          branch: 'conversation_fallback',
          ...getNormalizationDiagnostics(payload),
        })
        return NextResponse.json(convResponse, { status: 200 })
      }
    }

    const intent =
      intentLocal === 'analysis'
        ? await classifyIntent(lastUserMessage).catch((error) => {
            log('warn', 'classifyIntent failed; keep intentLocal', { error })
            return intentLocal
          })
        : intentLocal

    if (intentLocal === 'analysis' && intent && intent !== intentLocal) {
      log('info', 'intent classifyIntent', { intent })
    }

    log('info', 'branch chosen', { branch: 'analysis' })
    const response = await runHexastraFlow({
      plan: effectivePlan,
      responseDepth,
      language: resolveRequestedLanguage(body as Record<string, unknown>, sanitizedMessages),
      requestType,
      birthData: normalizeBirthData((body as Record<string, unknown>).birthData),
      practitionerUsage: normalizePractitionerUsage((body as Record<string, unknown>).practitionerUsage),
      contextType: normalizeContextType((body as Record<string, unknown>).contextType),
      selectedMenuKey:
        typeof (body as Record<string, unknown>).selectedMenuKey === 'string'
          ? ((body as Record<string, unknown>).selectedMenuKey as string)
          : null,
      selectedSubmenuKey:
        typeof (body as Record<string, unknown>).selectedSubmenuKey === 'string'
          ? ((body as Record<string, unknown>).selectedSubmenuKey as string)
          : null,
      uiAction: normalizeUiAction((body as Record<string, unknown>).uiAction),
      conversationId:
        typeof (body as Record<string, unknown>).conversationId === 'string'
          ? ((body as Record<string, unknown>).conversationId as string)
          : null,
      messages: sanitizedMessages,
      evolutionProfile:
        (body as Record<string, unknown>).evolutionProfile &&
        typeof (body as Record<string, unknown>).evolutionProfile === 'object'
          ? ((body as Record<string, unknown>).evolutionProfile as Record<string, unknown>)
          : null,
      journeyEnabled,
    })

    const shouldRephrase =
      intentLocal === 'analysis' &&
      response?.flowState?.step !== 'menu' &&
      !(response?.menu?.visible) &&
      typeof response?.message === 'string' &&
      response?.message.trim().length > 0

    const reformatted =
      shouldRephrase && response.message
        ? await formatAnalysis(response.message)
        : response.message

    const withSuggestions =
      reformatted && shouldRephrase
        ? `${reformatted}\n\n${generateSuggestions(response.message).join('\n')}`
        : reformatted

    const finalResponse = buildConsistentResponse(
      withSuggestions
        ? ({ ...response, message: withSuggestions, reply: withSuggestions, content: withSuggestions } as ChatResponsePayload)
        : (response as ChatResponsePayload),
      {
        type: 'analysis',
        plan: effectivePlan,
        mode: effectivePlan,
        conversationId: requestedConversationId ?? undefined,
        menu: DEFAULT_EMPTY_MENU,
      }
    )

    setCache(cacheKey, finalResponse)

    const enriched = enrichReadingResponse({
      response: finalResponse as any,
      plan: effectivePlan,
      birthDate: (finalResponse as any)?.birthData?.date ?? (body as any)?.birthData?.date,
      solarSign: (finalResponse as any)?.birthData?.solarSign ?? (body as any)?.birthData?.solarSign,
      contextType: finalResponse?.metadata?.contextType ?? (body as any)?.contextType,
      domainRoute: (finalResponse as any)?.domainRoute ?? (body as any)?.domainRoute,
      selectedMenuKey:
        (finalResponse?.metadata as any)?.selectedMenuKey ??
        (body as any)?.selectedMenuKey ??
        null,
      selectedSubmenuKey:
        (finalResponse?.metadata as any)?.selectedSubmenuKey ??
        (body as any)?.selectedSubmenuKey ??
        null,
    })

    const normalizedEnriched = buildConsistentResponse(enriched as ChatResponsePayload, {
      type:
        typeof finalResponse.type === 'string'
          ? finalResponse.type
          : 'analysis',
      plan: effectivePlan,
      mode: effectivePlan,
      conversationId: requestedConversationId ?? undefined,
      menu: DEFAULT_EMPTY_MENU,
    })

    log('info', 'response normalized', {
      branch: 'analysis',
      ...getNormalizationDiagnostics(enriched as ChatResponsePayload),
    })
    log('info', 'return final payload', {
      step: enriched?.flowState?.step ?? finalResponse?.flowState?.step,
      menuVisible: enriched?.menu?.visible ?? finalResponse?.menu?.visible,
      intentDetected: intent,
    })
    const finalStatus = normalizedEnriched.flowState?.step === 'error' ? 500 : 200
    return NextResponse.json(
      {
        ...normalizedEnriched,
        plan: effectivePlan,
        mode: effectivePlan,
        metadata: {
          ...(((normalizedEnriched as ChatResponsePayload)?.metadata as Record<string, unknown> | undefined) ??
            ((finalResponse as ChatResponsePayload)?.metadata as Record<string, unknown> | undefined) ??
            {}),
          quota: {
            used: quota.used,
            limit: quota.limit,
            remaining: quota.remaining,
            resetAt: quota.resetAt,
            windowStartedAt: quota.windowStartedAt,
          },
          responseDepth,
          journeyEnabled,
          intentDetected: intent,
        },
      },
      { status: finalStatus }
    )
  } catch (error) {
    log('error', 'fatal error', { error })
    const safeErrorResponse = buildSafeErrorResponse()
    log('info', 'response normalized', {
      branch: 'safe_error',
      ...getNormalizationDiagnostics(safeErrorResponse),
    })
    return NextResponse.json(safeErrorResponse, { status: 500 })
  }
}

function normalizeContextType(value: unknown): ContextType {
  return typeof value === 'string' ? (value as ContextType) : 'general'
}

function normalizeUiAction(value: unknown): UiAction {
  return typeof value === 'string' ? (value as UiAction) : 'send_message'
}

function normalizePractitionerUsage(value: unknown): PractitionerUsageHex {
  if (value === 'self' || value === 'client') return value
  if (value === 'personal') return 'self'
  return null
}

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function sanitizeMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) return []

  return messages
    .filter((m): m is { role?: unknown; content?: unknown } => Boolean(m && typeof m === 'object'))
    .map(
      (m): ChatMessage => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: typeof m.content === 'string' ? m.content.trim() : '',
      })
    )
    .filter((m) => m.content.length > 0)
    .slice(-30)
}
