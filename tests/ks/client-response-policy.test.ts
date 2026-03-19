import { describe, expect, it } from 'vitest'
import { resolveClientResponsePolicy } from '@/lib/chat/clientResponsePolicy'
import type { HexastraApiResponse } from '@/lib/hexastra/types'

describe('client response policy', () => {
  it('normalizes menu, context, memory and quota sync from an API response', () => {
    const policy = resolveClientResponsePolicy({
      message: 'Lecture prête',
      mode: 'libre',
      plan: 'free',
      flowState: { step: 'analysis', completed: true },
      conversationId: 'conv_policy_1',
      menu: {
        visible: true,
        items: [
          {
            key: 'science',
            label: 'Analyse par science',
            description: 'Choisis une science',
            contextType: 'science',
          },
        ],
      },
      metadata: {
        contextType: 'science',
        selectedMenuKey: 'science',
        selectedSubmenuKey: 'science_porteum',
        contextFrame: 'Cadre Human Design',
        clarificationQuestion: 'Que veux-tu explorer ?',
        userMemoryUpdate: { recurringTheme: 'decisions' },
        quota: {
          used: 4,
          resetAt: '2026-03-20T08:00:00.000Z',
          windowStartedAt: '2026-03-19T08:00:00.000Z',
        },
      },
    } as HexastraApiResponse)

    expect(policy.reply).toBe('Lecture prête')
    expect(policy.menu.action).toBe('open')
    expect(policy.context.selectedMenuKey).toBe('science')
    expect(policy.context.selectedSubmenuKey).toBe('science_porteum')
    expect(policy.context.contextFrame).toBe('Cadre Human Design')
    expect(policy.userMemoryUpdate).toEqual({ recurringTheme: 'decisions' })
    expect(policy.quotaSync?.used).toBe(4)
    expect(policy.quotaSync?.windowStartedAt).toBe('2026-03-19T08:00:00.000Z')
    expect(policy.premiumLock.action).toBe('clear')
  })

  it('turns quota exceeded responses into a premium lock decision', () => {
    const policy = resolveClientResponsePolicy({
      message: 'Limite atteinte',
      mode: 'libre',
      plan: 'free',
      flowState: { step: 'quota_limit', completed: true },
      conversationId: 'conv_policy_2',
      metadata: {
        quotaExceeded: true,
        used: 10,
        limit: 10,
        resetAt: '2026-03-20T08:00:00.000Z',
        upgradeTargetPlan: 'essential',
        upgradeCtaLabel: 'Passer à Essentiel',
      },
    } as HexastraApiResponse)

    expect(policy.quotaExceeded?.used).toBe(10)
    expect(policy.premiumLock.action).toBe('set')
    if (policy.premiumLock.action !== 'set') return
    expect(policy.premiumLock.value.targetPlan).toBe('essential')
    expect(policy.premiumLock.value.ctaLabel).toBe('Passer à Essentiel')
  })

  it('turns premium preview locks into a premium upsell decision', () => {
    const policy = resolveClientResponsePolicy({
      message: 'Extrait disponible',
      mode: 'libre_avance',
      plan: 'essential',
      flowState: { step: 'analysis', completed: true },
      conversationId: 'conv_policy_3',
      metadata: {
        premiumPreviewLocked: true,
      },
    } as HexastraApiResponse)

    expect(policy.premiumLock.action).toBe('set')
    if (policy.premiumLock.action !== 'set') return
    expect(policy.premiumLock.value.targetPlan).toBe('premium')
  })

  it('preserves menu state when the response does not explicitly change it', () => {
    const policy = resolveClientResponsePolicy({
      message: 'Suite de lecture',
      mode: 'libre',
      plan: 'premium',
      flowState: { step: 'analysis', completed: true },
      conversationId: 'conv_policy_4',
    } as HexastraApiResponse)

    expect(policy.menu.action).toBe('preserve')
    expect(policy.premiumLock.action).toBe('clear')
  })
})
