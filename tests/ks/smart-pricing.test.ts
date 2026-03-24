import { describe, expect, it } from 'vitest'
import {
  buildQuotaUpgradeDecision,
  buildSmartPricingSessionState,
  buildSmartUpgradeDecision,
  computeClarityScore,
  detectEmotionalEngagement,
} from '@/lib/monetization/smartPricing'

describe('smart pricing', () => {
  it('detects high emotional engagement for personal relationship decisions', () => {
    const engagement = detectEmotionalEngagement(
      "Je me sens perdue dans ma relation. J'ai peur de faire le mauvais choix et je doute de rester ou partir.",
    )

    expect(engagement).toBe('high')
  })

  it('detects low emotional engagement for generic product questions', () => {
    const engagement = detectEmotionalEngagement("C'est quoi Hexastra et comment ca marche ?")

    expect(engagement).toBe('low')
  })

  it('raises clarity score when the message is personal and detailed', () => {
    const shortScore = computeClarityScore('Je doute.', 1)
    const deepScore = computeClarityScore(
      "Je me sens bloquee depuis plusieurs semaines dans mon couple. J'essaie de comprendre pourquoi je reste alors que cette situation me fatigue et me touche beaucoup.",
      3,
    )

    expect(deepScore).toBeGreaterThan(shortScore)
    expect(deepScore).toBeGreaterThanOrEqual(58)
  })

  it('triggers a natural upgrade after three strong messages for a free user', () => {
    const sessionState = buildSmartPricingSessionState({
      messages: [
        { role: 'user', content: 'Je tourne en rond depuis plusieurs jours.' },
        { role: 'assistant', content: 'Je t aide a clarifier.' },
        { role: 'user', content: "J'ai peur de prendre la mauvaise decision dans ma relation." },
        {
          role: 'user',
          content:
            "Je me sens vraiment perdue. Cette situation de couple me touche beaucoup et je doute de rester ou de partir. J'ai besoin de comprendre ce qui bloque vraiment pour moi.",
        },
      ],
    })

    const decision = buildSmartUpgradeDecision({
      plan: 'free',
      sessionState,
      previousState: null,
    })

    expect(sessionState.messagesCount).toBe(3)
    expect(sessionState.emotionalEngagement).toBe('high')
    expect(decision.shouldShow).toBe(true)
    expect(decision.reason).toBe('engagement')
    expect(['essential', 'premium']).toContain(decision.targetPlan)
    expect(decision.message).toContain('On peut aller plus loin si tu veux.')
  })

  it('does not retrigger too soon after a recent upgrade prompt', () => {
    const previousState = {
      pricing_last_upgrade_shown_at: new Date().toISOString(),
      pricing_upgrade_shown_count: 1,
    }
    const sessionState = buildSmartPricingSessionState({
      messages: [
        { role: 'user', content: 'Je me sens perdue.' },
        { role: 'user', content: "J'ai peur de faire le mauvais choix." },
        {
          role: 'user',
          content:
            "Je me sens vraiment touchee par cette relation et j'ai besoin de comprendre pourquoi je reste dans ce dilemme.",
        },
      ],
      previousState,
    })

    const decision = buildSmartUpgradeDecision({
      plan: 'essential',
      sessionState,
      previousState,
    })

    expect(decision.shouldShow).toBe(false)
    expect(decision.targetPlan).toBeNull()
  })

  it('builds quota upgrade messaging without forcing practitioner users', () => {
    expect(buildQuotaUpgradeDecision('free').targetPlan).toBe('essential')
    expect(buildQuotaUpgradeDecision('essential').targetPlan).toBe('premium')
    expect(buildQuotaUpgradeDecision('practitioner').shouldShow).toBe(false)
  })
})
