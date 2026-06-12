import type { PlanKey } from '@/types/subscription'
import type {
  BirthProfile,
  ContextType,
  PractitionerUsageHex,
  UiAction,
} from '@/lib/hexastra/types'
import type { ChatMessage } from '@/lib/chat/chatPayloadBuilder'
import type { ReadingPlanContract } from '@/lib/hexastra/orchestration/readingPlanContract'

export type N8nChatWebhookPayload = {
  source: 'hexastra-web'
  requestId: string
  userId: string | null
  plan: PlanKey
  responseDepth: 'short' | 'medium' | 'long' | 'expert'
  readingPlan: ReadingPlanContract
  requestType: 'micro_profile' | 'micro_year' | 'micro_month' | 'chat'
  conversationId: string | null
  language: string
  messages: ChatMessage[]
  lastUserMessage: string
  birthData: BirthProfile | null
  partnerBirthData?: BirthProfile | null
  practitionerUsage: PractitionerUsageHex
  contextType: ContextType
  selectedMenuKey: string | null
  selectedSubmenuKey: string | null
  uiAction: UiAction
  journeyEnabled: boolean
  analysisMode: 'science_by_science' | 'hexastra_fusion'
  renderMode: 'simple' | 'approfondie' | 'praticien' | null
  userIntentKey: string | null
  evolutionProfile: Record<string, unknown> | null
  quota: {
    used: number
    limit: number | null
    remaining: number | null
    resetAt: string | null
    windowStartedAt: string | null
  }
}

export type N8nChatWebhookResponse = Record<string, unknown> & {
  message?: string
  reply?: string
  content?: string
  blocks?: string[]
  chunks?: string[]
  messages?: Array<string | { content?: string; message?: string; reply?: string }>
}

export type N8nBirthWebhookPayload = {
  source: 'hexastra-web'
  event: 'birth_profile_saved'
  userId: string | null
  savedMode: 'full' | 'core_only' | 'local_only'
  updatedFields: string[]
  birthData: Record<string, unknown>
  partnerBirthData: Record<string, unknown> | null
  savedAt: string
}

const DEFAULT_N8N_TIMEOUT_MS = 120_000
const MAX_N8N_TIMEOUT_MS = 120_000

export function getN8nChatWebhookUrl() {
  const url = process.env.N8N_WEBHOOK_CHAT_URL?.trim()
  return url || null
}

export function getN8nBirthWebhookUrl() {
  const url = process.env.N8N_WEBHOOK_BIRTH_URL?.trim()
  return url || getN8nChatWebhookUrl()
}

export function isN8nChatEnabled() {
  return Boolean(getN8nChatWebhookUrl())
}

export function isN8nBirthWebhookEnabled() {
  return Boolean(getN8nBirthWebhookUrl())
}

function resolveN8nTimeoutMs() {
  const raw = process.env.N8N_WEBHOOK_TIMEOUT_MS
  if (!raw) return DEFAULT_N8N_TIMEOUT_MS

  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_N8N_TIMEOUT_MS

  return Math.min(Math.max(parsed, 1_000), MAX_N8N_TIMEOUT_MS)
}

function normalizeTextResponse(text: string): N8nChatWebhookResponse {
  return {
    message: text,
    reply: text,
    content: text,
    type: 'conversation',
    flowState: { step: 'conversation', completed: true },
    menu: { visible: false, items: [] },
  }
}

function readBlockText(value: unknown): string | null {
  if (typeof value === 'string') {
    const text = value.trim()
    return text || null
  }

  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  const text =
    typeof record.content === 'string' && record.content.trim()
      ? record.content.trim()
      : typeof record.message === 'string' && record.message.trim()
        ? record.message.trim()
        : typeof record.reply === 'string' && record.reply.trim()
          ? record.reply.trim()
          : ''

  return text || null
}

function normalizeResponseBlocks(record: Record<string, unknown>): string[] {
  const candidates = [record.blocks, record.chunks, record.messages]

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue

    const blocks = candidate
      .map(readBlockText)
      .filter((text): text is string => Boolean(text))

    if (blocks.length > 0) return blocks
  }

  return []
}

export function normalizeN8nChatWebhookResponse(
  data: unknown,
): N8nChatWebhookResponse {
  if (typeof data === 'string') {
    return normalizeTextResponse(data)
  }

  if (!data || typeof data !== 'object') {
    return normalizeTextResponse('')
  }

  const record = data as Record<string, unknown>

  if (Array.isArray(record)) {
    const blocks = record
      .map(readBlockText)
      .filter((text): text is string => Boolean(text))
    const text = blocks.join('\n\n')
    return {
      ...normalizeTextResponse(text),
      blocks,
      chunks: blocks,
      messages: blocks,
    }
  }

  const blocks = normalizeResponseBlocks(record)

  const text =
    blocks.length > 0
      ? blocks.join('\n\n')
      : typeof record.message === 'string' && record.message.trim()
      ? record.message.trim()
      : typeof record.reply === 'string' && record.reply.trim()
        ? record.reply.trim()
        : typeof record.content === 'string' && record.content.trim()
          ? record.content.trim()
          : ''

  return {
    ...record,
    message: text,
    reply: text,
    content: text,
    ...(blocks.length > 0 ? { blocks, chunks: blocks } : {}),
    type: typeof record.type === 'string' ? record.type : 'conversation',
    flowState:
      record.flowState && typeof record.flowState === 'object'
        ? record.flowState
        : { step: 'conversation', completed: true },
    menu:
      record.menu && typeof record.menu === 'object'
        ? record.menu
        : { visible: false, items: [] },
  }
}

export async function callN8nChatWebhook(
  payload: N8nChatWebhookPayload,
): Promise<N8nChatWebhookResponse> {
  const url = getN8nChatWebhookUrl()
  if (!url) {
    throw new Error('N8N_WEBHOOK_CHAT_URL is not configured')
  }

  const secret = process.env.N8N_WEBHOOK_SECRET?.trim()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), resolveN8nTimeoutMs())

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret
          ? {
              'x-hexastra-webhook-secret': secret,
              Authorization: `Bearer ${secret}`,
            }
          : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
    })

    const raw = await response.text()
    let data: unknown = raw

    if (raw.trim()) {
      try {
        data = JSON.parse(raw)
      } catch {
        data = raw
      }
    }

    if (!response.ok) {
      throw new Error(`n8n chat webhook failed with status ${response.status}: ${raw.slice(0, 300)}`)
    }

    return normalizeN8nChatWebhookResponse(data)
  } finally {
    clearTimeout(timeout)
  }
}

export async function callN8nBirthWebhook(
  payload: N8nBirthWebhookPayload,
): Promise<void> {
  const url = getN8nBirthWebhookUrl()
  if (!url) return

  const secret = process.env.N8N_WEBHOOK_SECRET?.trim()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), resolveN8nTimeoutMs())

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret
          ? {
              'x-hexastra-webhook-secret': secret,
              Authorization: `Bearer ${secret}`,
            }
          : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new Error(`n8n birth webhook failed with status ${response.status}: ${detail.slice(0, 300)}`)
    }
  } finally {
    clearTimeout(timeout)
  }
}
