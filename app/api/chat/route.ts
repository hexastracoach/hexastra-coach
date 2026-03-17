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

export const runtime = 'nodejs'

type DbPlan = 'free' | 'essentiel' | 'premium' | 'praticien'
type UsageFeature = 'chat_api'
type ResponseDepth = 'short' | 'medium' | 'long' | 'expert'
const SUPPORTED_LANGUAGES = ['fr', 'en', 'es', 'pt', 'de', 'it'] as const
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

const PLAN_LIMITS: Record<PlanKey, number | null> = {
  free: 10,        // prÃ©cÃ©demment 3
  essential: 60,   // prÃ©cÃ©demment 20
  premium: null,   // illimitÃ©
  practitioner: null, // illimitÃ©
}

const REQUIRED_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: {},
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {},
  SUPABASE_SERVICE_ROLE_KEY: {},
}

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function isGreetingOrSmallTalk(normalized: string): boolean {
  return /^(salut|bonjour|hello|hey|coucou|yo|bonsoir|hi|merci|ok|daccord|dac|ca va|ça va|\?ca va|\?ça va|oui|non)$/.test(
    normalized.replace(/\s+\?/g, '?').replace(/\s+/g, ' ')
  )
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
    lat: toOptionalNumber(data.lat ?? data.birthLat),
    lon: toOptionalNumber(data.lon ?? data.birthLng),
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
  return {
    message: "Je n'ai pas pu terminer la lecture pour le moment. RÃ©essaie dans quelques instants.",
    reply: "Je n'ai pas pu terminer la lecture pour le moment. RÃ©essaie dans quelques instants.",
    mode: 'free',
    plan: 'free',
    flowState: { step: 'error', completed: false },
    conversationId: randomUUID(),
    metadata: {
      shouldPersistMemory: false,
    },
  }
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

  const freeMessage = `Tu as atteint la limite de ton accÃ¨s dÃ©couverte pour le moment.

Ton espace gratuit se rÃ©ouvrira automatiquement dans 24h.
Si tu veux continuer maintenant, tu peux passer Ã  Essentiel.`

  const paidMessage = `Tu as atteint la limite de ton plan ${planLabel} pour le moment.

Tu pourras rÃ©essayer plus tard, ou passer Ã  lâ€™offre supÃ©rieure si tu veux continuer tout de suite.`

  const finalMessage = plan === 'free' ? freeMessage : paidMessage

  return {
    message: finalMessage,
    reply: finalMessage,
    mode: plan,
    plan,
    flowState: { step: 'quota_limit', completed: false },
    conversationId: randomUUID(),
    metadata: {
      shouldPersistMemory: false,
      quotaExceeded: true,
      upgradeTargetPlan: plan === 'free' ? 'essential' : 'premium',
      upgradeCtaLabel: plan === 'free' ? 'Passer Ã  Essentiel' : 'Passer Ã  Premium',
      resetAt,
      usage: {
        used,
        limit,
        remaining: 0,
      },
    },
  }
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function getResetAtIso(windowStartedAt: string | Date) {
  const startedAt = windowStartedAt instanceof Date ? windowStartedAt : new Date(windowStartedAt)
  return new Date(startedAt.getTime() + 24 * 60 * 60 * 1000).toISOString()
}

function getGuestSubjectKey(req: NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for') ?? ''
  const ip = forwardedFor.split(',')[0]?.trim() || 'unknown-ip'
  const ua = req.headers.get('user-agent') ?? 'unknown-ua'
  const raw = `${ip}|${ua}`
  const hash = createHash('sha256').update(raw).digest('hex').slice(0, 24)
  return `guest:${hash}`
}

function normalizeLanguage(lang: string | null | undefined): SupportedLanguage | null {
  if (!lang) return null
  const code = lang.slice(0, 2).toLowerCase()
  return SUPPORTED_LANGUAGES.includes(code as SupportedLanguage) ? (code as SupportedLanguage) : null
}

function detectLanguageFromText(text: string): SupportedLanguage | null {
  const normalized = text.trim().toLowerCase()
  if (!normalized) return null

  const frenchSignals = ['bonjour', 'salut', 'bonsoir', 'merci', 'je veux', 'jâ€™ai', "j'ai", 'peux-tu', 'peut tu', 'pourquoi', 'comment', 'travail', 'amour', 'santÃ©']
  const englishSignals = ['hello', 'hi', 'hey', 'thank you', 'please', 'i want', 'can you', 'how', 'why', 'love', 'work', 'health']
  const spanishSignals = ['hola', 'buenas', 'gracias', 'por favor', 'ayuda', 'salud', 'trabajo', 'amor', 'como', 'quÃ©', 'porque']
  const portugueseSignals = ['olÃ¡', 'obrigado', 'por favor', 'saÃºde', 'trabalho', 'amor', 'porquÃª', 'como', 'podes', 'ajuda']
  const germanSignals = ['hallo', 'danke', 'bitte', 'gesundheit', 'arbeit', 'liebe', 'warum', 'wie', 'kannst', 'hilfe']
  const italianSignals = ['ciao', 'grazie', 'per favore', 'salute', 'lavoro', 'amore', 'perchÃ©', 'come', 'puoi', 'aiuto']

  const scores = [
    { lang: 'fr' as SupportedLanguage, score: frenchSignals.reduce((s, w) => s + (normalized.includes(w) ? 1 : 0), 0) },
    { lang: 'en' as SupportedLanguage, score: englishSignals.reduce((s, w) => s + (normalized.includes(w) ? 1 : 0), 0) },
    { lang: 'es' as SupportedLanguage, score: spanishSignals.reduce((s, w) => s + (normalized.includes(w) ? 1 : 0), 0) },
    { lang: 'pt' as SupportedLanguage, score: portugueseSignals.reduce((s, w) => s + (normalized.includes(w) ? 1 : 0), 0) },
    { lang: 'de' as SupportedLanguage, score: germanSignals.reduce((s, w) => s + (normalized.includes(w) ? 1 : 0), 0) },
    { lang: 'it' as SupportedLanguage, score: italianSignals.reduce((s, w) => s + (normalized.includes(w) ? 1 : 0), 0) },
  ]

  const best = scores.reduce((max, current) => (current.score > max.score ? current : max), { lang: 'fr' as SupportedLanguage, score: 0 })
  return best.score === 0 ? null : best.lang
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

  const { data: existing, error: selectError } = await admin
    .from('usage_daily')
    .select('id, count, window_started_at')
    .eq('subject_key', subjectKey)
    .eq('feature', feature)
    .maybeSingle()

  if (selectError) {
    logger.error('[api/chat] usage select error', { selectError })
    return {
      blocked: false as const,
      used: 0,
      limit,
      remaining: limit,
      resetAt: null,
      windowStartedAt: null,
    }
  }

  const existingWindowStartedAt =
    typeof existing?.window_started_at === 'string' && existing.window_started_at
      ? new Date(existing.window_started_at)
      : null

  const hasActiveWindow =
    existingWindowStartedAt !== null &&
    now.getTime() - existingWindowStartedAt.getTime() < 24 * 60 * 60 * 1000

  if (!existing?.id) {
    const windowStartedAt = now.toISOString()
    const { error: insertError } = await admin.from('usage_daily').insert({
      usage_date: getTodayIsoDate(),
      subject_key: subjectKey,
      feature,
      count: 1,
      window_started_at: windowStartedAt,
      updated_at: windowStartedAt,
    })
    if (insertError) logger.error('[api/chat] usage insert error', { insertError })

    return {
      blocked: false as const,
      used: 1,
      limit,
      remaining: Math.max(limit - 1, 0),
      resetAt: getResetAtIso(windowStartedAt),
      windowStartedAt,
    }
  }

  if (!hasActiveWindow) {
    const windowStartedAt = now.toISOString()
    const { error: resetError } = await admin
      .from('usage_daily')
      .update({
        count: 1,
        usage_date: getTodayIsoDate(),
        window_started_at: windowStartedAt,
        updated_at: windowStartedAt,
      })
      .eq('id', existing.id)

    if (resetError) logger.error('[api/chat] usage reset error', { resetError })

    return {
      blocked: false as const,
      used: 1,
      limit,
      remaining: Math.max(limit - 1, 0),
      resetAt: getResetAtIso(windowStartedAt),
      windowStartedAt,
    }
  }

  const currentCount = existing?.count ?? 0
  const resetAt = existingWindowStartedAt ? getResetAtIso(existingWindowStartedAt) : null

  if (currentCount >= limit) {
    return {
      blocked: true as const,
      used: currentCount,
      limit,
      remaining: 0,
      resetAt,
      windowStartedAt: existing?.window_started_at ?? null,
    }
  }

  const updatedCount = currentCount + 1
  const { error: updateError } = await admin
    .from('usage_daily')
    .update({
      count: updatedCount,
      usage_date: getTodayIsoDate(),
      updated_at: now.toISOString(),
    })
    .eq('id', existing.id)

  if (updateError) logger.error('[api/chat] usage update error', { updateError })

  return {
    blocked: false as const,
    used: updatedCount,
    limit,
    remaining: Math.max(limit - updatedCount, 0),
    resetAt,
    windowStartedAt: existing?.window_started_at ?? null,
  }
}

function shouldApplyPremiumLock(plan: PlanKey) {
  return plan === 'essential'
}

function truncateTextForPlan(text: string, plan: PlanKey) {
  const maxChars = plan === 'free' ? 550 : 1100

  if (!text || text.length <= maxChars) {
    return { truncated: text, wasTrimmed: false }
  }

  const sliced = text.slice(0, maxChars)
  const lastSentence = Math.max(sliced.lastIndexOf('. '), sliced.lastIndexOf('! '), sliced.lastIndexOf('? '))

  const clean = lastSentence > 120 ? sliced.slice(0, lastSentence + 1).trim() : `${sliced.trim()}...`

  return { truncated: clean, wasTrimmed: true }
}

function buildPremiumLockBlock(plan: PlanKey) {
  if (plan === 'free') {
    return {
      teaser:
        'AperÃ§u disponible. La suite de lâ€™analyse complÃ¨te, les nuances et les leviers prioritaires sont rÃ©servÃ©s aux plans supÃ©rieurs.',
      ctaLabel: 'Passer Ã  Essentiel',
      targetPlan: 'essential',
    }
  }

  return {
    teaser:
      'La base est visible ici. La lecture complÃ¨te, plus profonde et plus stratÃ©gique, est rÃ©servÃ©e aux plans Premium et Praticien.',
    ctaLabel: 'Passer Ã  Premium',
    targetPlan: 'premium',
  }
}

function applyPremiumInsightLock(params: { plan: PlanKey; response: any }) {
  const { plan, response } = params

  if (!shouldApplyPremiumLock(plan)) return response

  const sourceText =
    typeof response?.reply === 'string'
      ? response.reply
      : typeof response?.message === 'string'
        ? response.message
        : ''

  if (!sourceText) return response

  const { truncated, wasTrimmed } = truncateTextForPlan(sourceText, plan)
  if (!wasTrimmed) return response

  const lock = buildPremiumLockBlock(plan)
  const lockedReply = `${truncated}\n\n${lock.teaser}`

  return {
    ...response,
    message: lockedReply,
    reply: lockedReply,
    metadata: {
      ...(response?.metadata ?? {}),
      premiumPreviewLocked: true,
      upgradeTargetPlan: lock.targetPlan,
      upgradeCtaLabel: lock.ctaLabel,
    },
  }
}

export async function POST(req: NextRequest) {
  const requestId = randomUUID()
  const log = (level: 'info' | 'debug' | 'warn' | 'error', msg: string, meta?: Record<string, unknown>) =>
    logger[level](`[api/chat][${requestId}] ${msg}`, meta)

  log('info', 'POST hit')

  try {
    validateEnv(REQUIRED_ENV)

    const body = await req.json().catch(() => null)
    log('debug', 'body parsed', { hasBody: Boolean(body) })

    if (!body || typeof body !== 'object') {
      log('warn', 'invalid body')
      return NextResponse.json(buildSafeErrorResponse(), { status: 400 })
    }

    const requestType =
      (body as Record<string, unknown>).requestType === 'micro_profile' ||
      (body as Record<string, unknown>).requestType === 'micro_year' ||
      (body as Record<string, unknown>).requestType === 'micro_month'
        ? ((body as Record<string, unknown>).requestType as 'micro_profile' | 'micro_year' | 'micro_month')
        : 'chat'

    const sanitizedMessages = sanitizeMessages((body as Record<string, unknown>).messages)
    const lastUserMessage = [...sanitizedMessages].reverse().find((m) => m.role === 'user')?.content?.trim() ?? ''
    const normalizedLast = normalizeText(lastUserMessage)

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

    // 1) Greeting / small talk : OpenAI direct, pas de quota
    if (isGreetingOrSmallTalk(normalizedLast)) {
      const content = await generateConversation(lastUserMessage || 'Bonjour.')
      return NextResponse.json(
        {
          content,
          type: 'conversation',
          plan: effectivePlan,
          mode: effectivePlan,
          conversationId:
            typeof (body as Record<string, unknown>).conversationId === 'string'
              ? ((body as Record<string, unknown>).conversationId as string)
              : randomUUID(),
          flowState: { step: 'conversation', completed: true },
          menu: { visible: false, items: [] },
        },
        { status: 200 }
      )
    }

    // 2) Intention via OpenAI classifier
    const intent = await classifyIntent(lastUserMessage)

    // 3) Quota pour les flux métier
    const quota = await enforceDailyQuota({
      req,
      userId,
      plan: effectivePlan,
      feature: 'chat_api',
    })

    log('debug', 'quota', quota as any)

    if (quota.blocked && quota.limit !== null) {
      log('warn', 'quota blocked', { userId, plan: effectivePlan, used: quota.used })
      return NextResponse.json(
        buildQuotaErrorResponse({
          plan: effectivePlan,
          used: quota.used,
          limit: quota.limit,
          resetAt: quota.resetAt,
        }),
        { status: 429 }
      )
    }

    // Routage lÃ©ger par intention
    if (intent === 'conversation') {
      const content = await generateConversation(lastUserMessage || 'Bonjour.')
      return NextResponse.json(
        {
          content,
          type: 'conversation',
          plan: effectivePlan,
          mode: effectivePlan,
          conversationId:
            typeof (body as Record<string, unknown>).conversationId === 'string'
              ? ((body as Record<string, unknown>).conversationId as string)
              : randomUUID(),
          flowState: { step: 'conversation', completed: true },
          menu: { visible: false, items: [] },
        },
        { status: 200 }
      )
    }

    if (intent === 'menu') {
      log('info', 'routing to navigation/menu')
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
      return NextResponse.json(menuResponse, { status: 200 })
    }

    if (intent === 'irrelevant') {
      const polite = "Je prÃ©fÃ¨re rester concentrÃ© sur ce qui peut vraiment tâ€™aider."
      return NextResponse.json(
        {
          content: polite,
          type: 'conversation',
          plan: effectivePlan,
          mode: effectivePlan,
          conversationId:
            typeof (body as Record<string, unknown>).conversationId === 'string'
              ? ((body as Record<string, unknown>).conversationId as string)
              : randomUUID(),
          flowState: { step: 'conversation', completed: true },
          menu: { visible: false, items: [] },
        },
        { status: 200 }
      )
    }

    log('info', 'calling runHexastraFlow (business)')

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

    log('info', 'runHexastraFlow success', { flowState: response?.flowState ?? null })

    // Reformulation Shilo post-analyse (texte uniquement) sauf navigation/menus
    const shouldRephrase =
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
        ? `${reformatted}\n\n---\n${generateSuggestions(response.message).join('\n')}`
        : reformatted

    const finalResponse = applyPremiumInsightLock({
      plan: effectivePlan,
      response: withSuggestions ? { ...response, message: withSuggestions, reply: withSuggestions } : response,
    })

    const enriched = enrichReadingResponse({
      response: finalResponse,
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
      journeyEnabled,
    })

    return NextResponse.json(
      {
        ...enriched,
        plan: effectivePlan,
        mode: effectivePlan,
        metadata: {
          ...(enriched?.metadata ?? finalResponse?.metadata ?? {}),
          quota: {
            used: quota.used,
            limit: quota.limit,
            remaining: quota.remaining,
            resetAt: quota.resetAt,
            windowStartedAt: quota.windowStartedAt,
          },
          responseDepth,
                    journeyEnabled,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    log('error', 'fatal error', { error })
    return NextResponse.json(buildSafeErrorResponse(), { status: 500 })
  }
}

