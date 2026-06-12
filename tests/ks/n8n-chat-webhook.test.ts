import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  callN8nChatWebhook,
  getN8nChatWebhookUrl,
  isN8nChatEnabled,
  normalizeN8nChatWebhookResponse,
  type N8nChatWebhookPayload,
} from '@/lib/n8n/chatWebhook'
import { buildReadingPlanContract } from '@/lib/hexastra/orchestration/readingPlanContract'

const basePayload: N8nChatWebhookPayload = {
  source: 'hexastra-web',
  requestId: 'req-1',
  userId: 'user-1',
  plan: 'free',
  responseDepth: 'short',
  readingPlan: buildReadingPlanContract('free'),
  requestType: 'chat',
  conversationId: 'conv-1',
  language: 'fr',
  messages: [{ role: 'user', content: 'Bonjour' }],
  lastUserMessage: 'Bonjour',
  birthData: null,
  partnerBirthData: null,
  practitionerUsage: null,
  contextType: 'general',
  selectedMenuKey: null,
  selectedSubmenuKey: null,
  uiAction: 'send_message',
  journeyEnabled: false,
  analysisMode: 'hexastra_fusion',
  renderMode: null,
  userIntentKey: null,
  evolutionProfile: null,
  quota: {
    used: 1,
    limit: 3,
    remaining: 2,
    resetAt: null,
    windowStartedAt: null,
  },
}

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.N8N_WEBHOOK_CHAT_URL
  delete process.env.N8N_WEBHOOK_SECRET
  delete process.env.N8N_WEBHOOK_TIMEOUT_MS
})

describe('n8n chat webhook', () => {
  it('is enabled only when the chat webhook URL is configured', () => {
    expect(getN8nChatWebhookUrl()).toBeNull()
    expect(isN8nChatEnabled()).toBe(false)

    process.env.N8N_WEBHOOK_CHAT_URL = ' https://n8n.test/webhook/chat '

    expect(getN8nChatWebhookUrl()).toBe('https://n8n.test/webhook/chat')
    expect(isN8nChatEnabled()).toBe(true)
  })

  it('normalizes text and json responses to the chat contract', () => {
    expect(normalizeN8nChatWebhookResponse('Salut')).toMatchObject({
      message: 'Salut',
      reply: 'Salut',
      content: 'Salut',
      flowState: { step: 'conversation', completed: true },
    })

    expect(normalizeN8nChatWebhookResponse({ reply: 'Lecture prete', type: 'analysis' })).toMatchObject({
      message: 'Lecture prete',
      reply: 'Lecture prete',
      content: 'Lecture prete',
      type: 'analysis',
    })
  })

  it('posts the full payload to n8n with the shared secret headers', async () => {
    process.env.N8N_WEBHOOK_CHAT_URL = 'https://n8n.test/webhook/chat'
    process.env.N8N_WEBHOOK_SECRET = 'secret-123'

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Automated by n8n' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const response = await callN8nChatWebhook(basePayload)

    expect(response.message).toBe('Automated by n8n')
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://n8n.test/webhook/chat')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      'x-hexastra-webhook-secret': 'secret-123',
      Authorization: 'Bearer secret-123',
    })
    expect(JSON.parse(String(init.body))).toMatchObject({
      source: 'hexastra-web',
      requestId: 'req-1',
      lastUserMessage: 'Bonjour',
      readingPlan: {
        plan: 'free',
        readingDepth: 'discovery',
        maxParagraphs: 3,
        maxActions: 1,
      },
      quota: { used: 1, remaining: 2 },
    })
  })

  it('builds different reading contracts for each subscription plan', () => {
    expect(buildReadingPlanContract('free')).toMatchObject({
      readingDepth: 'discovery',
      maxParagraphs: 3,
      include: { synthesis: false, phase: false, practitionerMarkers: false },
    })

    expect(buildReadingPlanContract('essential')).toMatchObject({
      readingDepth: 'guided',
      maxParagraphs: 5,
      include: { synthesis: true, phase: true, lifeZone: false },
    })

    expect(buildReadingPlanContract('premium')).toMatchObject({
      readingDepth: 'deep',
      maxParagraphs: 8,
      include: { lifeZone: true, reliability: true, contradictions: true },
    })

    expect(buildReadingPlanContract('practitioner')).toMatchObject({
      readingDepth: 'professional',
      maxParagraphs: 10,
      include: { practitionerMarkers: true },
    })
  })
})
