import type { ContextType, HexastraApiResponse, HexastraMenuItem } from '@/lib/hexastra/types'

export type ClientPremiumLockPayload = {
  targetPlan: string
  ctaLabel: string
  text: string
}

export type ClientPremiumLockPolicy =
  | { action: 'set'; value: ClientPremiumLockPayload }
  | { action: 'clear' }

export type ClientMenuPolicy =
  | { action: 'open'; items: HexastraMenuItem[] }
  | { action: 'close' }
  | { action: 'preserve' }

export type ClientQuotaSyncPolicy = {
  used: number
  resetAt: Date | null
  windowStartedAt: string | null
}

export type ClientQuotaExceededPolicy = {
  used: number
  resetAt: Date | null
}

export type ClientResponsePolicy = {
  reply: string
  conversationId: string | null
  menu: ClientMenuPolicy
  context: {
    contextType?: ContextType
    selectedMenuKey?: string | null
    selectedSubmenuKey?: string | null
    contextFrame?: string | null
    clarificationQuestion?: string | null
  }
  evolutionProfile: Record<string, unknown> | null
  userMemoryUpdate: Record<string, unknown> | null
  quotaSync: ClientQuotaSyncPolicy | null
  quotaExceeded: ClientQuotaExceededPolicy | null
  premiumLock: ClientPremiumLockPolicy
}

function toDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function getStableApiReply(data: (HexastraApiResponse & { content?: unknown }) | null | undefined) {
  if (!data) {
    return "Je n'ai pas pu terminer la lecture pour le moment. On réessaie dans un instant."
  }

  if (typeof data.message === 'string' && data.message.trim()) return data.message
  if (typeof data.reply === 'string' && data.reply.trim()) return data.reply
  if (typeof data.content === 'string' && data.content.trim()) return data.content

  return "Je n'ai pas pu terminer la lecture pour le moment. On réessaie dans un instant."
}

export function resolveClientResponsePolicy(
  data: (HexastraApiResponse & { content?: unknown }) | null | undefined,
): ClientResponsePolicy {
  const reply = getStableApiReply(data)
  const metadata = data?.metadata ?? {}

  let menu: ClientMenuPolicy = { action: 'preserve' }
  if (data?.menu?.visible && Array.isArray(data.menu.items)) {
    menu = { action: 'open', items: data.menu.items }
  } else if (data?.menu?.visible === false) {
    menu = { action: 'close' }
  }

  const context: ClientResponsePolicy['context'] = {}
  if (metadata.contextType) context.contextType = metadata.contextType
  if (Object.prototype.hasOwnProperty.call(metadata, 'selectedMenuKey')) {
    context.selectedMenuKey = metadata.selectedMenuKey ?? null
  }
  if (Object.prototype.hasOwnProperty.call(metadata, 'selectedSubmenuKey')) {
    context.selectedSubmenuKey = metadata.selectedSubmenuKey ?? null
  }
  if (Object.prototype.hasOwnProperty.call(metadata, 'contextFrame')) {
    context.contextFrame = metadata.contextFrame ?? null
  }
  if (Object.prototype.hasOwnProperty.call(metadata, 'clarificationQuestion')) {
    context.clarificationQuestion = metadata.clarificationQuestion ?? null
  }

  const quotaSync =
    metadata.quota && typeof metadata.quota === 'object'
      ? {
          used:
            typeof metadata.quota.used === 'number' && Number.isFinite(metadata.quota.used)
              ? metadata.quota.used
              : 0,
          resetAt: toDate(metadata.quota.resetAt),
          windowStartedAt:
            typeof metadata.quota.windowStartedAt === 'string' && metadata.quota.windowStartedAt
              ? metadata.quota.windowStartedAt
              : null,
        }
      : null

  const quotaExceeded = metadata.quotaExceeded
    ? {
        used:
          typeof metadata.used === 'number'
            ? metadata.used
            : typeof metadata.limit === 'number'
              ? metadata.limit
              : 3,
        resetAt: toDate(metadata.resetAt),
      }
    : null

  let premiumLock: ClientPremiumLockPolicy = { action: 'clear' }
  if (quotaExceeded) {
    premiumLock = {
      action: 'set',
      value: {
        targetPlan: metadata.upgradeTargetPlan ?? 'essential',
        ctaLabel: metadata.upgradeCtaLabel ?? 'Continuer avec Essentiel',
        text: reply || "Tu peux continuer.\nDébloque l'accès complet et va plus loin dans ta compréhension.",
      },
    }
  } else if (metadata.premiumPreviewLocked) {
    premiumLock = {
      action: 'set',
      value: {
        targetPlan: metadata.upgradeTargetPlan ?? 'premium',
        ctaLabel: metadata.upgradeCtaLabel ?? 'Aller plus loin avec Premium',
        text:
          "Tu as déjà le cœur de la réponse. Passe en Premium pour aller plus loin, avec plus de précision et une lecture plus profonde.",
      },
    }
  }

  return {
    reply,
    conversationId: data?.conversationId ?? null,
    menu,
    context,
    evolutionProfile:
      data?.updatedEvolutionProfile && typeof data.updatedEvolutionProfile === 'object'
        ? data.updatedEvolutionProfile
        : null,
    userMemoryUpdate:
      metadata.userMemoryUpdate && typeof metadata.userMemoryUpdate === 'object'
        ? metadata.userMemoryUpdate
        : null,
    quotaSync,
    quotaExceeded,
    premiumLock,
  }
}
