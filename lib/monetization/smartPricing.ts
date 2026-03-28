import type { SessionStateRecord } from '@/lib/hexastra/types'
import type { PlanKey } from '@/lib/plans'

export type EmotionalEngagement = 'low' | 'medium' | 'high'

export type SmartPricingSessionState = {
  messagesCount: number
  emotionalEngagement: EmotionalEngagement
  clarityScore: number
  lastInteractionTimestamp: string
  lastUpgradeShownAt?: string | null
  upgradeShownCount?: number
  lastUpgradeTargetPlan?: PlanKey | null
}

export type SmartUpgradeTrigger = 'engagement' | 'quota_limit' | null

export type SmartUpgradeDecision = {
  shouldShow: boolean
  reason: SmartUpgradeTrigger
  targetPlan: PlanKey | null
  message: string | null
  ctaLabel: string | null
}

type BuildPricingStateParams = {
  messages: Array<{ role: string; content: string }>
  lastInteractionTimestamp?: string
  previousState?: SessionStateRecord | null
}

type ResolveUpgradeDecisionParams = {
  plan: PlanKey
  sessionState: SmartPricingSessionState
  previousState?: SessionStateRecord | null
}

const HIGH_SIGNAL_PATTERNS = [
  /\bje me sens\b/,
  /\bje ressens\b/,
  /\bj ai peur\b/,
  /\bje doute\b/,
  /\bje souffre\b/,
  /\bje suis perdu(?:e)?\b/,
  /\bca me touche\b/,
  /\brelation\b/,
  /\bcouple\b/,
  /\bamour\b/,
  /\brupture\b/,
  /\bfamille\b/,
  /\bpartenaire\b/,
  /\bseparation\b/,
  /\bdecision\b/,
  /\bchoisir\b/,
  /\bquitter\b/,
  /\brester\b/,
  /\bchanger\b/,
  /\btrancher\b/,
  /\bdilemme\b/,
]

const MEDIUM_SIGNAL_PATTERNS = [
  /\bcomprendre\b/,
  /\bpourquoi\b/,
  /\bcomment avancer\b/,
  /\bquoi faire\b/,
  /\bclarifier\b/,
  /\bvoir plus clair\b/,
  /\btravail\b/,
  /\bargent\b/,
  /\bprojet\b/,
  /\btiming\b/,
  /\bblocage\b/,
  /\bfatigue\b/,
  /\bstress\b/,
]

const LOW_SIGNAL_PATTERNS = [
  /\bc est quoi\b/,
  /\bdefinis\b/,
  /\bexplique\b/,
  /\bcomment ca marche\b/,
  /\bquestion generale\b/,
]

const PERSONAL_DEPTH_PATTERNS = [
  /\bje\b/,
  /\bmoi\b/,
  /\bmon\b/,
  /\bma\b/,
  /\bmes\b/,
  /\bparce que\b/,
  /\bdepuis\b/,
  /\ben ce moment\b/,
  /\baujourd hui\b/,
  /\bactuellement\b/,
  /\bje n arrive pas\b/,
  /\bje veux comprendre\b/,
]

function normalizeText(value: string): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0)
}

function normalizeScore(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}

function getDefaultUpgradeLabel(targetPlan: PlanKey | null): string | null {
  if (!targetPlan) return null
  if (targetPlan === 'premium') return 'Aller plus loin avec Premium'
  if (targetPlan === 'practitioner') return 'Continuer avec Praticien'
  return 'Continuer avec Essentiel'
}

export function detectEmotionalEngagement(message: string): EmotionalEngagement {
  const text = normalizeText(message)
  if (!text) return 'low'

  const highSignals = countMatches(text, HIGH_SIGNAL_PATTERNS)
  const mediumSignals = countMatches(text, MEDIUM_SIGNAL_PATTERNS)
  const lowSignals = countMatches(text, LOW_SIGNAL_PATTERNS)

  if (highSignals >= 2 || (highSignals >= 1 && text.length >= 80)) {
    return 'high'
  }

  if (lowSignals > 0 && highSignals === 0 && mediumSignals === 0) {
    return 'low'
  }

  if (mediumSignals > 0 || text.length >= 60) {
    return 'medium'
  }

  return 'low'
}

export function computeClarityScore(message: string, messageCount: number): number {
  const text = normalizeText(message)
  if (!text) return 0

  const personalSignals = countMatches(text, PERSONAL_DEPTH_PATTERNS)
  const emotionalSignals = countMatches(text, HIGH_SIGNAL_PATTERNS)
  const detailBoost = Math.min(text.length / 3, 28)
  const conversationBoost = Math.min(messageCount * 8, 24)

  return normalizeScore(detailBoost + personalSignals * 12 + emotionalSignals * 8 + conversationBoost)
}

export function buildSmartPricingSessionState(
  params: BuildPricingStateParams,
): SmartPricingSessionState {
  const { messages, lastInteractionTimestamp, previousState } = params
  const userMessages = messages.filter(
    (message) => message.role === 'user' && message.content.trim().length > 0,
  )
  const lastUserMessage = userMessages[userMessages.length - 1]?.content ?? ''

  return {
    messagesCount: userMessages.length,
    emotionalEngagement: detectEmotionalEngagement(lastUserMessage),
    clarityScore: computeClarityScore(lastUserMessage, userMessages.length),
    lastInteractionTimestamp: lastInteractionTimestamp ?? new Date().toISOString(),
    lastUpgradeShownAt: previousState?.pricing_last_upgrade_shown_at ?? null,
    upgradeShownCount: previousState?.pricing_upgrade_shown_count ?? 0,
    lastUpgradeTargetPlan:
      previousState?.pricing_last_upgrade_target_plan === 'essential' ||
      previousState?.pricing_last_upgrade_target_plan === 'premium' ||
      previousState?.pricing_last_upgrade_target_plan === 'practitioner'
        ? previousState.pricing_last_upgrade_target_plan
        : null,
  }
}

export function shouldTriggerEngagementUpgrade(
  sessionState: SmartPricingSessionState,
  previousState?: SessionStateRecord | null,
): boolean {
  if (sessionState.emotionalEngagement !== 'high') return false
  if (sessionState.messagesCount < 3) return false
  if (sessionState.clarityScore < 58) return false

  const shownCount = previousState?.pricing_upgrade_shown_count ?? 0
  if (shownCount >= 2) return false

  const lastShownAt = previousState?.pricing_last_upgrade_shown_at
  if (!lastShownAt) return true

  const elapsed = Date.now() - new Date(lastShownAt).getTime()
  if (Number.isNaN(elapsed)) return true

  return elapsed >= 30 * 60 * 1000
}

export function resolveEngagementUpgradeTarget(
  plan: PlanKey,
  sessionState: SmartPricingSessionState,
): PlanKey | null {
  if (plan === 'premium' || plan === 'practitioner') return null
  if (plan === 'essential') return 'premium'
  if (plan === 'free') {
    return sessionState.clarityScore >= 76 ? 'premium' : 'essential'
  }
  return null
}

export function buildSmartUpgradeDecision(
  params: ResolveUpgradeDecisionParams,
): SmartUpgradeDecision {
  const { plan, sessionState, previousState } = params

  if (!shouldTriggerEngagementUpgrade(sessionState, previousState)) {
    return {
      shouldShow: false,
      reason: null,
      targetPlan: null,
      message: null,
      ctaLabel: null,
    }
  }

  const targetPlan = resolveEngagementUpgradeTarget(plan, sessionState)
  if (!targetPlan) {
    return {
      shouldShow: false,
      reason: null,
      targetPlan: null,
      message: null,
      ctaLabel: null,
    }
  }

  return {
    shouldShow: true,
    reason: 'engagement',
    targetPlan,
    message:
      "On peut aller encore plus loin ensemble si tu veux.",
    ctaLabel: getDefaultUpgradeLabel(targetPlan),
  }
}

export function buildQuotaUpgradeDecision(plan: PlanKey): SmartUpgradeDecision {
  const targetPlan =
    plan === 'free'
      ? 'essential'
      : plan === 'essential'
        ? 'premium'
        : plan === 'premium'
          ? 'practitioner'
          : null

  return {
    shouldShow: Boolean(targetPlan),
    reason: 'quota_limit',
    targetPlan,
    message:
      "Tu as utilisé tes lectures du jour.\nReviens dans 24h ou continue si tu veux aller plus loin.",
    ctaLabel: "Voir les options",
  }
}

export function toSessionStatePatch(
  sessionState: SmartPricingSessionState,
  decision?: SmartUpgradeDecision,
): Partial<SessionStateRecord> {
  const shouldPersistUpgrade = Boolean(decision?.shouldShow && decision.targetPlan)

  return {
    pricing_messages_count: sessionState.messagesCount,
    pricing_emotional_engagement: sessionState.emotionalEngagement,
    pricing_clarity_score: sessionState.clarityScore,
    pricing_last_interaction_at: sessionState.lastInteractionTimestamp,
    pricing_last_upgrade_shown_at: shouldPersistUpgrade
      ? sessionState.lastInteractionTimestamp
      : sessionState.lastUpgradeShownAt ?? null,
    pricing_upgrade_shown_count: shouldPersistUpgrade
      ? (sessionState.upgradeShownCount ?? 0) + 1
      : sessionState.upgradeShownCount ?? 0,
    pricing_last_upgrade_target_plan: shouldPersistUpgrade
      ? decision?.targetPlan ?? null
      : sessionState.lastUpgradeTargetPlan ?? null,
  }
}
