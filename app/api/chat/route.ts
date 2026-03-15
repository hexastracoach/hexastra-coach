import { createHash, randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient as createSupabaseServer } from '@/lib/supabase/server'
import { runHexastraFlow } from '@/lib/hexastra/orchestrator/runHexastraFlow'
import type {
  BirthProfile,
  ContextType,
  PractitionerUsageHex,
  UiAction,
} from '@/lib/hexastra/types'
import type { PlanKey } from '@/lib/plans'
import type { ChatMessage } from '@/lib/chat/chatPayloadBuilder'

export const runtime = 'nodejs'

type DbPlan = 'free' | 'essentiel' | 'premium' | 'praticien'
type UsageFeature = 'chat_api'
type ResponseDepth = 'short' | 'medium' | 'long' | 'expert'

const PLAN_LIMITS: Record<PlanKey, number | null> = {
  free: 3,
  essential: 20,
  premium: null,
  practitioner: null,
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
    .filter(
      (m): m is { role?: unknown; content?: unknown } =>
        Boolean(m && typeof m === 'object')
    )
    .map(
      (m): ChatMessage => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: typeof m.content === 'string' ? m.content.trim() : '',
      })
    )
    .filter((m) => m.content.length > 0)
    .slice(-20)
}

function mapDbPlanToPlanKey(plan: unknown): PlanKey {
  if (plan === 'essentiel') return 'essential'
  if (plan === 'premium') return 'premium'
  if (plan === 'praticien') return 'practitioner'
  return 'free'
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

  const birth: BirthProfile = {
    firstName:
      typeof data.firstName === 'string' ? data.firstName.trim() : undefined,
    lastName:
      typeof data.lastName === 'string' ? data.lastName.trim() : undefined,
    date:
      typeof data.date === 'string'
        ? data.date.trim()
        : typeof data.birthDate === 'string'
          ? data.birthDate.trim()
          : undefined,
    time:
      typeof data.time === 'string'
        ? data.time.trim()
        : typeof data.birthTime === 'string'
          ? data.birthTime.trim()
          : undefined,
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
    message:
      'Je n’ai pas pu terminer la lecture pour le moment. Réessaie dans quelques instants.',
    reply:
      'Je n’ai pas pu terminer la lecture pour le moment. Réessaie dans quelques instants.',
    mode: 'free',
    plan: 'free',
    flowState: { step: 'error', completed: false },
    conversationId: randomUUID(),
    metadata: {
      shouldPersistMemory: false,
    },
  }
}

function buildQuotaErrorResponse(plan: PlanKey, used: number, limit: number) {
  const planLabel =
    plan === 'essential'
      ? 'Essentiel'
      : plan === 'premium'
        ? 'Premium'
        : plan === 'practitioner'
          ? 'Praticien'
          : 'Gratuit'

  return {
    message:
      plan === 'free'
        ? `Tu as atteint ta limite gratuite du jour (${limit}). Passe à Essentiel pour continuer.`
        : `Tu as atteint la limite de ton plan ${planLabel} pour aujourd’hui (${limit}).`,
    reply:
      plan === 'free'
        ? `Tu as atteint ta limite gratuite du jour (${limit}). Passe à Essentiel pour continuer.`
        : `Tu as atteint la limite de ton plan ${planLabel} pour aujourd’hui (${limit}).`,
    mode: plan,
    plan,
    flowState: { step: 'quota_limit', completed: false },
    conversationId: randomUUID(),
    metadata: {
      shouldPersistMemory: false,
      quotaExceeded: true,
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

function getGuestSubjectKey(req: NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for') ?? ''
  const ip = forwardedFor.split(',')[0]?.trim() || 'unknown-ip'
  const ua = req.headers.get('user-agent') ?? 'unknown-ua'
  const raw = `${ip}|${ua}`
  const hash = createHash('sha256').update(raw).digest('hex').slice(0, 24)
  return `guest:${hash}`
}

async function resolveEffectivePlan(
  req: NextRequest
): Promise<{
  plan: PlanKey
  userId: string | null
}> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      plan: 'free',
      userId: null,
    }
  }

  const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!adminUrl || !adminKey) {
    return {
      plan: 'free',
      userId: user.id,
    }
  }

  const admin = createAdminClient(adminUrl, adminKey)

  const { data: profile, error } = await admin
    .from('profiles')
    .select('plan, stripe_subscription_status')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[api/chat] profile lookup error', error)
    return {
      plan: 'free',
      userId: user.id,
    }
  }

  let resolvedPlan = mapDbPlanToPlanKey(profile?.plan as DbPlan | undefined)
  const subscriptionStatus = profile?.stripe_subscription_status as
    | string
    | undefined

  if (
    resolvedPlan !== 'free' &&
    subscriptionStatus &&
    subscriptionStatus !== 'active' &&
    subscriptionStatus !== 'trialing'
  ) {
    resolvedPlan = 'free'
  }

  return {
    plan: resolvedPlan,
    userId: user.id,
  }
}

async function enforceDailyQuota(params: {
  req: NextRequest
  userId: string | null
  plan: PlanKey
  feature: UsageFeature
}) {
  const { req, userId, plan, feature } = params

  const limit = PLAN_LIMITS[plan]

  if (limit === null) {
    return {
      blocked: false as const,
      used: 0,
      limit: null,
      remaining: null,
    }
  }

  const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!adminUrl || !adminKey) {
    console.warn('[api/chat] quota disabled: missing admin Supabase env')
    return {
      blocked: false as const,
      used: 0,
      limit,
      remaining: limit,
    }
  }

  const admin = createAdminClient(adminUrl, adminKey)
  const usageDate = getTodayIsoDate()
  const subjectKey = userId ? `user:${userId}` : getGuestSubjectKey(req)

  const { data: existing, error: selectError } = await admin
    .from('usage_daily')
    .select('id, count')
    .eq('usage_date', usageDate)
    .eq('subject_key', subjectKey)
    .eq('feature', feature)
    .maybeSingle()

  if (selectError) {
    console.error('[api/chat] usage select error', selectError)
    return {
      blocked: false as const,
      used: 0,
      limit,
      remaining: limit,
    }
  }

  const currentCount = existing?.count ?? 0

  if (currentCount >= limit) {
    return {
      blocked: true as const,
      used: currentCount,
      limit,
      remaining: 0,
    }
  }

  if (existing?.id) {
    const { error: updateError } = await admin
      .from('usage_daily')
      .update({
        count: currentCount + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (updateError) {
      console.error('[api/chat] usage update error', updateError)
    }
  } else {
    const { error: insertError } = await admin.from('usage_daily').insert({
      usage_date: usageDate,
      subject_key: subjectKey,
      feature,
      count: 1,
    })

    if (insertError) {
      console.error('[api/chat] usage insert error', insertError)
    }
  }

  return {
    blocked: false as const,
    used: currentCount + 1,
    limit,
    remaining: Math.max(limit - (currentCount + 1), 0),
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)

    if (!body || typeof body !== 'object') {
      return NextResponse.json(buildSafeErrorResponse(), { status: 400 })
    }

    const requestType =
      (body as Record<string, unknown>).requestType === 'micro_profile' ||
      (body as Record<string, unknown>).requestType === 'micro_year' ||
      (body as Record<string, unknown>).requestType === 'micro_month'
        ? ((body as Record<string, unknown>).requestType as
            | 'micro_profile'
            | 'micro_year'
            | 'micro_month')
        : 'chat'

    const { plan: effectivePlan, userId } = await resolveEffectivePlan(req)
    const responseDepth = getResponseDepth(effectivePlan)

    const quota = await enforceDailyQuota({
      req,
      userId,
      plan: effectivePlan,
      feature: 'chat_api',
    })

    if (quota.blocked && quota.limit !== null) {
      return NextResponse.json(
        buildQuotaErrorResponse(effectivePlan, quota.used, quota.limit),
        { status: 429 }
      )
    }

    function shouldApplyPremiumLock(plan: PlanKey) {
    return plan === 'free' || plan === 'essential'
  }

  function truncateTextForPlan(text: string, plan: PlanKey) {
    const maxChars = plan === 'free' ? 550 : 1100

    if (!text || text.length <= maxChars) {
      return {
        truncated: text,
        wasTrimmed: false,
      }
    }

    const sliced = text.slice(0, maxChars)
    const lastSentence =
      Math.max(sliced.lastIndexOf('. '), sliced.lastIndexOf('! '), sliced.lastIndexOf('? ')) || maxChars

    const clean =
      lastSentence > 120 ? sliced.slice(0, lastSentence + 1).trim() : `${sliced.trim()}...`

    return {
      truncated: clean,
      wasTrimmed: true,
    }
  }

  function buildPremiumLockBlock(plan: PlanKey) {
    if (plan === 'free') {
      return {
        teaser:
          'Aperçu disponible. La suite de l’analyse complète, les nuances et les leviers prioritaires sont réservés aux plans supérieurs.',
        ctaLabel: 'Passer à Essentiel',
        targetPlan: 'essential',
      }
    }

    return {
      teaser:
        'La base est visible ici. La lecture complète, plus profonde et plus stratégique, est réservée aux plans Premium et Praticien.',
      ctaLabel: 'Passer à Premium',
      targetPlan: 'premium',
    }
  }

  function applyPremiumInsightLock(params: {
    plan: PlanKey
    response: any
  }) {
    const { plan, response } = params

    if (!shouldApplyPremiumLock(plan)) {
      return response
    }

    const sourceText =
      typeof response?.reply === 'string'
        ? response.reply
        : typeof response?.message === 'string'
          ? response.message
          : ''

    if (!sourceText) {
      return response
    }

    const { truncated, wasTrimmed } = truncateTextForPlan(sourceText, plan)

    if (!wasTrimmed) {
      return response
    }

    const lock = buildPremiumLockBlock(plan)

    const lockedReply = `${truncated}

  ${lock.teaser}`

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

    const response = await runHexastraFlow({
      plan: effectivePlan,
      responseDepth,
      language:
        typeof (body as Record<string, unknown>).language === 'string'
          ? ((body as Record<string, unknown>).language as string)
          : typeof (body as Record<string, unknown>).chatLanguage === 'string'
            ? ((body as Record<string, unknown>).chatLanguage as string)
            : 'fr',
      requestType,
      birthData: normalizeBirthData((body as Record<string, unknown>).birthData),
      practitionerUsage: normalizePractitionerUsage(
        (body as Record<string, unknown>).practitionerUsage
      ),
      contextType: normalizeContextType(
        (body as Record<string, unknown>).contextType
      ),
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
      messages: sanitizeMessages((body as Record<string, unknown>).messages),
      evolutionProfile:
        (body as Record<string, unknown>).evolutionProfile &&
        typeof (body as Record<string, unknown>).evolutionProfile === 'object'
          ? ((body as Record<string, unknown>).evolutionProfile as Record<
              string,
              unknown
            >)
          : null,
    })
      const finalResponse = applyPremiumInsightLock({
      plan: effectivePlan,
      response,
    })
   return NextResponse.json(
    {
      ...finalResponse,
      plan: effectivePlan,
      mode: effectivePlan,
      metadata: {
        ...(finalResponse?.metadata ?? {}),
        quota: {
          used: quota.used,
          limit: quota.limit,
          remaining: quota.remaining,
        },
        responseDepth,
      },
    },
    { status: 200 }
  )
  } catch (error) {
    console.error('[api/chat] fatal error', error)
    return NextResponse.json(buildSafeErrorResponse(), { status: 500 })
  }
}