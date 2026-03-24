import { describe, expect, it } from 'vitest'
import {
  isMenuOpenMessage,
  resolveClientSendPolicy,
  resolveSelectionContext,
} from '@/lib/chat/clientSendPolicy'
import type { HexastraMenuItem } from '@/lib/hexastra/types'

const MENU_ITEMS: HexastraMenuItem[] = [
  {
    key: 'general_reading',
    label: 'Lecture generale',
    description: 'Lecture directe',
    contextType: 'general',
  },
  {
    key: 'science',
    label: 'Analyse par science',
    description: 'Entrer dans une science',
    contextType: 'science',
    submenu: [
      {
        key: 'science_porteum',
        label: 'Human Design',
        description: 'Portes, centres, canaux',
        contextType: 'science',
      },
    ],
  },
]

describe('client send policy', () => {
  it('recognizes explicit menu-open commands', () => {
    expect(isMenuOpenMessage('ouvre le menu')).toBe(true)
    expect(isMenuOpenMessage('affiche le menu')).toBe(true)
    expect(isMenuOpenMessage('bonjour')).toBe(false)
  })

  it('opens a parent card when a top-level numeric choice targets a submenu', () => {
    const decision = resolveClientSendPolicy({
      message: '2',
      plan: 'free',
      usedMessages: 0,
      menuItems: MENU_ITEMS,
      selectedMenuKey: null,
      selectedSubmenuKey: null,
    })

    expect(decision.kind).toBe('open_parent')
    if (decision.kind !== 'open_parent') return
    expect(decision.selection.item.key).toBe('science')
    expect(decision.selection.openParentOnly).toBe(true)
  })

  it('selects a submenu context when a numeric choice is sent inside an opened parent', () => {
    const decision = resolveClientSendPolicy({
      message: '1',
      plan: 'premium',
      usedMessages: 0,
      menuItems: MENU_ITEMS,
      selectedMenuKey: 'science',
      selectedSubmenuKey: null,
    })

    expect(decision.kind).toBe('select_context')
    if (decision.kind !== 'select_context') return

    const context = resolveSelectionContext(decision.selection)
    expect(decision.selection.parent?.key).toBe('science')
    expect(context.menuKey).toBe('science')
    expect(context.submenuKey).toBe('science_porteum')
    expect(context.contextType).toBe('science')
  })

  it('returns a local clarification reply for confused short messages', () => {
    const decision = resolveClientSendPolicy({
      message: 'a',
      plan: 'premium',
      usedMessages: 0,
      menuItems: MENU_ITEMS,
      selectedMenuKey: 'science',
      selectedSubmenuKey: 'science_porteum',
      activeClarificationQuestion: 'Que veux-tu explorer dans ce sous-angle ?',
      activeContextFrame: 'Contexte Human Design',
    })

    expect(decision.kind).toBe('local_reply')
    if (decision.kind !== 'local_reply') return
    expect(decision.reply).toContain('Que veux-tu explorer')
  })

  it('does not treat a numeric reply as a menu choice when a modern submenu is already active', () => {
    const decision = resolveClientSendPolicy({
      message: '1',
      plan: 'premium',
      usedMessages: 0,
      menuItems: MENU_ITEMS,
      selectedMenuKey: 'science_human_design',
      selectedSubmenuKey: 'hd_portes',
      activeClarificationQuestion: 'Que veux-tu explorer dans tes portes ?',
      activeContextFrame: 'Contexte Human Design - Portes',
    })

    expect(decision.kind).not.toBe('open_parent')
    expect(decision.kind).not.toBe('select_context')
  })

  it('keeps the free daily quota gate on the client for immediate feedback', () => {
    const decision = resolveClientSendPolicy({
      message: 'Analyse ma situation actuelle',
      plan: 'free',
      usedMessages: 10,
      menuItems: MENU_ITEMS,
      selectedMenuKey: null,
      selectedSubmenuKey: null,
    })

    expect(decision.kind).toBe('local_reply')
    if (decision.kind !== 'local_reply') return
    expect(decision.premiumLock?.targetPlan).toBe('essential')
    expect(decision.reply.toLowerCase()).toContain("essentiel de cette situation")
    expect(decision.premiumLock?.ctaLabel).toBe('Continuer avec Essentiel')
  })

  it('blocks obvious technical questions before the API call', () => {
    const decision = resolveClientSendPolicy({
      message: 'Corrige mon erreur TypeScript dans React',
      plan: 'premium',
      usedMessages: 0,
      menuItems: MENU_ITEMS,
      selectedMenuKey: null,
      selectedSubmenuKey: null,
    })

    expect(decision.kind).toBe('local_reply')
    if (decision.kind !== 'local_reply') return
    expect(decision.reply.toLowerCase()).toContain('questions techniques')
  })
})
