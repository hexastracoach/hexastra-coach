import { canContinueChat, type PlanKey } from '@/lib/plans'
import { buildClarificationPrompt, buildGuardResponse, moderateMessage } from './conversationLayer'
import { routeUserQuery } from './queryRouter'
import type { ContextType, HexastraMenuItem } from '@/lib/hexastra/types'

export type ResolvedMenuSelection = {
  item: HexastraMenuItem
  parent?: HexastraMenuItem
  openParentOnly?: boolean
}

export type ClientSendPolicyDecision =
  | { kind: 'open_menu' }
  | { kind: 'open_parent'; selection: ResolvedMenuSelection }
  | { kind: 'select_context'; selection: ResolvedMenuSelection }
  | {
      kind: 'local_reply'
      reply: string
      premiumLock?: { targetPlan: string; ctaLabel: string; text: string }
    }
  | { kind: 'api' }

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function isMenuOpenMessage(value: string) {
  const text = normalizeText(value)
  if (!text) return false

  return (
    text === 'menu' ||
    text === 'revenir au menu' ||
    text === 'retour au menu' ||
    text === 'ouvre le menu' ||
    text === 'ouvrir le menu' ||
    text === 'montre le menu' ||
    text === 'affiche le menu'
  )
}

export function parseNumericMenuChoice(value: string) {
  const match = value.trim().match(/^(\d{1,2})$/)
  if (!match) return null

  const choice = Number(match[1])
  return Number.isInteger(choice) && choice > 0 ? choice : null
}

export function findMenuItemByKey(items: HexastraMenuItem[], key: string | null) {
  if (!key) return null
  return items.find((item) => item.key === key) ?? null
}

export function resolveNumericMenuSelection(
  items: HexastraMenuItem[],
  choice: number,
  selectedMenuKey: string | null
): ResolvedMenuSelection | null {
  const selectedParent = findMenuItemByKey(items, selectedMenuKey)

  if (selectedParent?.submenu?.length) {
    const submenuItem = selectedParent.submenu[choice - 1]
    if (!submenuItem) return null
    return { item: submenuItem, parent: selectedParent }
  }

  const topLevelItem = items[choice - 1]
  if (!topLevelItem) return null

  if (topLevelItem.submenu?.length) {
    return { item: topLevelItem, openParentOnly: true }
  }

  return { item: topLevelItem }
}

function buildModerationReply(params: {
  moderation: ReturnType<typeof moderateMessage>
  activeClarificationQuestion?: string | null
  activeContextFrame?: string | null
}) {
  const { moderation, activeClarificationQuestion, activeContextFrame } = params
  if (moderation === 'CONFUSED') {
    return (
      activeClarificationQuestion ??
      (activeContextFrame
        ? `${activeContextFrame}\n\n${buildClarificationPrompt()}`
        : buildClarificationPrompt())
    )
  }

  return buildGuardResponse(moderation)
}

function buildFreeQuotaReply() {
  return {
    reply: `Tu as atteint la limite de ton accès découverte pour le moment.

Ton espace gratuit se rouvrira automatiquement dans 24h.
Si tu veux continuer maintenant, tu peux passer à Essentiel.`,
    premiumLock: {
      targetPlan: 'essential',
      ctaLabel: 'Passer à Essentiel',
      text:
        'Ton accès gratuit est temporairement arrivé à sa limite. Reviens dans 24h ou passe à Essentiel pour continuer maintenant.',
    },
  }
}

export function resolveClientSendPolicy(params: {
  message: string
  plan: PlanKey
  usedMessages: number
  menuItems: HexastraMenuItem[]
  selectedMenuKey: string | null
  selectedSubmenuKey: string | null
  activeClarificationQuestion?: string | null
  activeContextFrame?: string | null
}): ClientSendPolicyDecision {
  const {
    message,
    plan,
    usedMessages,
    menuItems,
    selectedMenuKey,
    selectedSubmenuKey,
    activeClarificationQuestion,
    activeContextFrame,
  } = params

  if (isMenuOpenMessage(message)) {
    return { kind: 'open_menu' }
  }

  const numericChoice = parseNumericMenuChoice(message)
  const hasActiveSubanalysisContext = Boolean(selectedSubmenuKey)

  if (numericChoice && menuItems.length > 0 && !hasActiveSubanalysisContext) {
    const selection = resolveNumericMenuSelection(menuItems, numericChoice, selectedMenuKey)
    if (selection?.openParentOnly) {
      return { kind: 'open_parent', selection }
    }
    if (selection) {
      return { kind: 'select_context', selection }
    }
  }

  const moderation = moderateMessage(message)
  if (moderation !== 'SAFE') {
    return {
      kind: 'local_reply',
      reply: buildModerationReply({
        moderation,
        activeClarificationQuestion,
        activeContextFrame,
      }),
    }
  }

  if (!canContinueChat(plan, usedMessages)) {
    const quotaReply = buildFreeQuotaReply()
    return {
      kind: 'local_reply',
      reply: quotaReply.reply,
      premiumLock: quotaReply.premiumLock,
    }
  }

  const routeResult = routeUserQuery(message)
  if (routeResult.decision !== 'allowed') {
    return {
      kind: 'local_reply',
      reply: routeResult.message,
    }
  }

  return { kind: 'api' }
}

export function resolveSelectionContext(selection: ResolvedMenuSelection): {
  contextType: ContextType
  menuKey: string
  submenuKey: string | null
  openParentKey: string | null
} {
  const contextType = selection.item.contextType ?? selection.parent?.contextType ?? 'general'
  return {
    contextType,
    menuKey: selection.parent?.key ?? selection.item.key,
    submenuKey: selection.parent ? selection.item.key : null,
    openParentKey: selection.parent?.key ?? null,
  }
}
