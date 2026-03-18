'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { useSearchParams } from 'next/navigation'
import PremiumBackground from '@/app/components/PremiumBackground'
import { createClient } from '@/lib/supabase/client'
import Composer from './Composer'
import LeftSidebar from './LeftSidebar'
import MessageList from './MessageList'
import BirthDataInlineForm from './BirthDataInlineForm'
import PractitionerUsageStep from './PractitionerUsageStep'
import PaywallBanner from './PaywallBanner'
import {
  STORAGE_KEYS,
  EMPTY_BIRTH_DATA,
  makeReadingTitle,
  type Msg,
  type Project,
  type Reading,
  type BirthData,
} from '../_lib/chat'
import {
  FREE_USAGE_STORAGE_KEY,
  FREE_USAGE_FIRST_MSG_KEY,
  canContinueChat,
  isFreePlan,
  type PlanKey,
} from '@/lib/plans'
import {
  computeBootstrapStep,
  isBirthDataComplete,
} from '@/lib/chat/bootstrapMachine'
import { getEntitlements } from '@/lib/chat/entitlements'
import { getMenuForMode } from '@/lib/hexastra/menus/getMenuForMode'
import { getModeForPlan } from '@/lib/hexastra/config/planModeMap'
import {
  loadMicroReadings,
  markProfileDone,
  markYearDone,
  markMonthDone,
} from '@/lib/chat/microReadingScheduler'
import {
  buildChatPayload,
  type RequestType,
  type ChatMessage,
} from '@/lib/chat/chatPayloadBuilder'
import {
  PRACTITIONER_USAGE_KEY,
  type MicroReadings,
  type PractitionerUsage,
} from '@/lib/chat/bootstrapTypes'
import { routeUserQuery } from '@/lib/chat/queryRouter'
import {
  loadEvolutionProfile,
  saveEvolutionProfile,
} from '@/lib/stores/userEvolutionStore'
import type { UserEvolutionProfile } from '@/types/evolution'
import { useChatLanguage, useTranslation } from '@/lib/i18n/useTranslation'
import {
  buildClarificationPrompt,
  buildGuardResponse,
  moderateMessage,
} from '@/lib/chat/conversationLayer'
import {
  detectUserDepthLevel,
  adjustResponseDepth,
} from '@/lib/chat/adaptiveDepthEngine'
import {
  EMPTY_USER_MEMORY,
  detectMemorySignals,
  getUserMemoryContext,
  updateUserMemory,
  type UserMemory,
} from '@/lib/chat/userMemoryEngine'
import LanguageSwitcher from '@/app/components/LanguageSwitcher'
import MenuDock from './MenuDock'
import type {
  ContextType,
  HexastraApiResponse,
  HexastraMenuItem,
} from '@/lib/hexastra/types'

type ChatApiMetadata = Record<string, unknown> & {
  contextType?: ContextType
  selectedMenuKey?: string | null
  selectedSubmenuKey?: string | null
  contextFrame?: string | null
  clarificationQuestion?: string | null
  userMemoryUpdate?: Partial<UserMemory>
  quota?: {
    used?: number
    limit?: number | null
    remaining?: number | null
    resetAt?: string | null
    windowStartedAt?: string | null
  }
  quotaExceeded?: boolean
  resetAt?: string | null
  used?: number
  limit?: number
  upgradeTargetPlan?: string
  upgradeCtaLabel?: string
  premiumPreviewLocked?: boolean
  intentDetected?: string
}

function IconMenu() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="13" height="1.3" rx="0.65" fill="currentColor" />
      <rect x="2" y="8" width="9" height="1.3" rx="0.65" fill="currentColor" opacity="0.7" />
      <rect x="2" y="12" width="11" height="1.3" rx="0.65" fill="currentColor" opacity="0.85" />
    </svg>
  )
}

const API_TIMEOUT_MS = 30000
const CONVERSATION_STORAGE_KEY = 'hexastra_conversation_id'
const CACHE_LIMIT = 50
const DUPLICATE_MESSAGE_WINDOW_MS = 1200

function getWelcomeContent(language: string) {
  switch (language) {
    case 'en':
      return `Hello.

I'm HexAstra Coach.
I'm here to help you understand your situation, your timing, and the most useful direction to take.`
    case 'es':
      return `Hola.

Soy HexAstra Coach.
Estoy aqui para ayudarte a comprender tu situacion, tu timing y la direccion mas util a seguir.`
    default:
      return `Bonjour.

Je suis HexAstra Coach.
Un outil de lecture strategique pour t'aider a comprendre ta situation, ton timing et la meilleure direction a prendre.`
  }
}

function createWelcomeMessage(language: string): Msg {
  return {
    id: 'welcome',
    role: 'assistant',
    content: getWelcomeContent(language),
    created_at: new Date().toISOString(),
  }
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function isSimpleGreeting(value: string) {
  const text = normalizeText(value)
  if (!text) return false

  const greetings = new Set([
    'bonjour',
    'salut',
    'bonsoir',
    'hello',
    'hi',
    'hey',
    'coucou',
    'yo',
    'bjr',
    'slt',
    'cc',
  ])

  return greetings.has(text)
}

function isBirthDataUpdateMessage(value: string) {
  const text = normalizeText(value)
  return (
    text.includes('donnees de naissance mises a jour') ||
    text.includes("lecture croisee donnees de l autre personne mises a jour")
  )
}

function isMenuSelectionMessage(value: string) {
  const text = (value || '').trim()
  return text.includes('->') || text.includes('→')
}

function isMenuOpenMessage(value: string) {
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

function parseNumericMenuChoice(value: string) {
  const match = value.trim().match(/^(\d{1,2})$/)
  if (!match) return null

  const choice = Number(match[1])
  return Number.isInteger(choice) && choice > 0 ? choice : null
}

function findMenuItemByKey(items: HexastraMenuItem[], key: string | null) {
  if (!key) return null
  return items.find((item) => item.key === key) ?? null
}

function resolveNumericMenuSelection(
  items: HexastraMenuItem[],
  choice: number,
  selectedMenuKey: string | null
): { item: HexastraMenuItem; parent?: HexastraMenuItem; openParentOnly?: boolean } | null {
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

function assistantAskedForBirthData(value: string) {
  const text = normalizeText(value)
  return (
    text.includes('date de naissance') ||
    text.includes('heure exacte') ||
    text.includes('ville') ||
    text.includes('pays') ||
    text.includes('pour dresser ton theme astral')
  )
}

function buildMenuSelectionRequest(item: HexastraMenuItem, parent?: HexastraMenuItem) {
  const parentLabel = parent?.label ?? item.label
  const targetLabel = parent ? item.label : null
  const contextLabel = targetLabel ? `${parentLabel} -> ${targetLabel}` : parentLabel

  return `Je veux une lecture ${contextLabel} à partir de mes données enregistrées. Donne-moi directement le bilan ou l'analyse utile, sans me redemander de décrire mon état sauf si c'est indispensable.`
}

function buildMenuSelectionDisplay(item: HexastraMenuItem, parent?: HexastraMenuItem) {
  return parent ? `${parent.label} -> ${item.label}` : item.label
}

function buildStoredBirthDataRequest(value: string, birthData: BirthData) {
  if (!isBirthDataComplete(birthData)) return value

  const text = normalizeText(value)

  if (
    /(theme natal|theme astral|carte du ciel|analyse astrale|mon theme|mon theme natal|mon theme astral)/.test(
      text
    )
  ) {
    return "Je veux mon thème natal à partir de mes données de naissance déjà enregistrées. Lance directement la lecture utile sans me redemander mes données sauf si un champ critique manque réellement."
  }

  if (/(neurokua|kua)/.test(text) && /(etat du jour|mon etat|bilan du jour|etat interieur)/.test(text)) {
    return "Je veux une lecture NeuroKua Mon état du jour à partir de mes données enregistrées. Donne-moi directement le bilan ou l'analyse utile, sans me redemander de décrire mon état sauf si c'est indispensable."
  }

  return value
}

function getInitials(email: string) {
  if (!email) return 'HX'
  const clean = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ')
  const parts = clean.split(' ').filter(Boolean)
  if (parts.length === 0) return 'HX'
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function isValidReading(value: unknown): value is Reading {
  if (!value || typeof value !== 'object') return false
  const reading = value as Partial<Reading>
  return (
    typeof reading.id === 'string' &&
    typeof reading.title === 'string' &&
    typeof reading.date === 'string'
  )
}

function isValidProject(value: unknown): value is Project {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<Project>
  return typeof project.id === 'string' && typeof project.name === 'string'
}

async function safeJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function setCacheEntry(
  cache: Map<string, string>,
  key: string,
  value: string,
  limit = CACHE_LIMIT
) {
  cache.set(key, value)

  if (cache.size > limit) {
    const firstKey = cache.keys().next().value
    if (firstKey) {
      cache.delete(firstKey)
    }
  }
}

function isDuplicateMessage(
  lastMessageRef: MutableRefObject<string | null>,
  message: string
) {
  if (lastMessageRef.current === message) {
    return true
  }

  lastMessageRef.current = message

  setTimeout(() => {
    if (lastMessageRef.current === message) {
      lastMessageRef.current = null
    }
  }, DUPLICATE_MESSAGE_WINDOW_MS)

  return false
}

function mergeBirthData(data: Partial<BirthData>): BirthData {
  return {
    ...EMPTY_BIRTH_DATA,
    ...data,
    birthTimeKnown:
      data.birthTimeKnown ?? EMPTY_BIRTH_DATA.birthTimeKnown ?? Boolean(data.birthTime ?? EMPTY_BIRTH_DATA.birthTime),
  }
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

export default function ChatPageClient() {
  const searchParams = useSearchParams()
  const supabase = createClient()
  const chatLanguage = useChatLanguage()
  const { t } = useTranslation()

  const [messages, setMessages] = useState<Msg[]>([])
  const [premiumLock, setPremiumLock] = useState<{
    targetPlan: string
    ctaLabel: string
    text: string
  } | null>(null)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [menuItems, setMenuItems] = useState<HexastraMenuItem[]>([])
  const [isMenuDockOpen, setIsMenuDockOpen] = useState(false)
  const [openMenuParentKey, setOpenMenuParentKey] = useState<string | null>(null)
  const [activeContextType, setActiveContextType] = useState<ContextType>('general')
  const [selectedMenuKey, setSelectedMenuKey] = useState<string | null>(null)
  const [selectedSubmenuKey, setSelectedSubmenuKey] = useState<string | null>(null)
  const [activeContextFrame, setActiveContextFrame] = useState<string | null>(null)
  const [activeClarificationQuestion, setActiveClarificationQuestion] = useState<string | null>(null)
  const [journeyEnabled, setJourneyEnabled] = useState<boolean>(false)
  const [userMemory, setUserMemory] = useState<UserMemory>(EMPTY_USER_MEMORY)

  const [readings, setReadings] = useState<Reading[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  const [showLeft, setShowLeft] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(1600)
  const [userEmail, setUserEmail] = useState('')

  const [birthData, setBirthData] = useState<BirthData>(EMPTY_BIRTH_DATA)
  const [partnerBirthData, setPartnerBirthData] = useState<BirthData>(EMPTY_BIRTH_DATA)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)

  const [userPlan, setUserPlan] = useState<PlanKey>('free')
  const [planLoaded, setPlanLoaded] = useState(false)

  const [practitionerUsage, setPractitionerUsage] = useState<PractitionerUsage>(null)

  const [microReadings, setMicroReadings] = useState<MicroReadings>({
    profileKey: null,
    yearKey: null,
    monthKey: null,
  })
  const [showInlineBirthForm, setShowInlineBirthForm] = useState(false)

  const [evolutionProfile, setEvolutionProfile] = useState<UserEvolutionProfile | null>(null)

  const [freeMessagesUsed, setFreeMessagesUsed] = useState(0)
  const [freeResetAt, setFreeResetAt] = useState<Date | null>(null)

  const cacheRef = useRef<Map<string, string>>(new Map())
  const hasPrefilled = useRef(false)
  const microTriggerRef = useRef<string | null>(null)
  const forceMicroBootstrapRef = useRef(false)
  const requestAbortRef = useRef<AbortController | null>(null)
  const requestSequenceRef = useRef(0)
  const lastMessageRef = useRef<string | null>(null)
  const birthDataRef = useRef<BirthData>(EMPTY_BIRTH_DATA)
  const partnerBirthDataRef = useRef<BirthData>(EMPTY_BIRTH_DATA)
  const journeyHydratedRef = useRef(false)
  const conversationContextRef = useRef({}) // legacy placeholder, no longer used

  const mode = planLoaded ? getEntitlements(userPlan).chatMode : 'essentiel'

  const step = computeBootstrapStep({
    planLoaded,
    plan: userPlan,
    practitionerUsage,
    birthData,
    microReadings,
  })

  const isMicroBootstrapPending =
    step === 'micro_profile_pending' ||
    step === 'micro_year_pending' ||
    step === 'micro_month_pending'

  // The composer should stay usable once the blocking bootstrap steps are over.
  const chatStep = step === 'loading' ? 'loading' : 'conversation_ready'

  useEffect(() => {
    if (isBirthDataComplete(birthData)) {
      setShowInlineBirthForm(false)
    }
  }, [birthData])

  useEffect(() => {
    birthDataRef.current = birthData
  }, [birthData])

  useEffect(() => {
    partnerBirthDataRef.current = partnerBirthData
  }, [partnerBirthData])

  useEffect(() => {
    if (!isBirthDataComplete(birthData)) {
      setShowInlineBirthForm(true)
    }
  }, [birthData])

  const isWelcome = useMemo(() => messages.length === 0, [messages])

  // Memory hint used sparingly
  const memoryHint = useMemo(() => getUserMemoryContext(userMemory), [userMemory])

  // Minimal formatting: keep business response as-is, optionally trim via depth
  const formatAssistantReply = useCallback(
    (
      base: string,
      {
        intent,
        isReading,
        userMessage,
        depthLevel,
      }: {
        intent: string | undefined
        isReading: boolean
        userMessage: string
        depthLevel: string
      }
    ) => {
      const shouldAppendMemory =
        !isReading &&
        Boolean(memoryHint) &&
        intent !== 'greeting' &&
        intent !== 'menu' &&
        !isSimpleGreeting(userMessage) &&
        !/^Bienvenue\./i.test(base.trim())
      const withMemory = shouldAppendMemory && memoryHint ? `${base}\n\n${memoryHint}` : base
      const depthAdjusted = adjustResponseDepth(withMemory, {
        level: depthLevel as any,
        plan: userPlan,
        isReading,
      })
      return depthAdjusted
    },
    [memoryHint, userPlan]
  )

  const userMessages = useMemo(
    () => messages.filter((message) => message.role === 'user'),
    [messages]
  )

  const userMessageCount = userMessages.length
  const lastUserMessage = userMessages[userMessages.length - 1]?.content ?? ''
  const lastAssistantMessage =
    [...messages].reverse().find((message) => message.role === 'assistant')?.content ?? ''
  const pendingReadingRequest = [...userMessages]
    .reverse()
    .find((message) => {
      const content = message.content ?? ''
      return (
        content.trim().length > 0 &&
        !isBirthDataUpdateMessage(content) &&
        !isMenuSelectionMessage(content)
      )
    })?.content ?? ''
  const shouldResumeAfterBirthSave =
    assistantAskedForBirthData(lastAssistantMessage) && pendingReadingRequest.trim().length > 0
  const birthSubmitLabel = shouldResumeAfterBirthSave
    ? 'Envoyer mes données et reprendre ma demande ->'
    : 'Enregistrer mes données ->'
  const shouldShowMenuDock =
    chatStep === 'conversation_ready' &&
    menuItems.length > 0 &&
    !isTyping &&
    !isMicroBootstrapPending &&
    isMenuDockOpen

  const desktopLeft = viewportWidth >= 1100
  const userInitials = getInitials(userEmail)
  const isLimitReached = isFreePlan(userPlan) && !canContinueChat(userPlan, freeMessagesUsed)

  const isReadingFlowStep = useCallback((step?: string | null) => {
    if (!step) return false
    return (
      step === 'analysis' ||
      step === 'decision' ||
      step === 'deep_reading' ||
      step === 'sensitive_support' ||
      step === 'micro_profile' ||
      step === 'micro_year' ||
      step === 'micro_month'
    )
  }, [])

  const pushJourneyMessage = useCallback(
    (enabled: boolean) => {
      const content = enabled
        ? `Ton parcours HexAstra est activÃ©.\nJe pourrai garder le fil de ton exploration, repÃ©rer les Ã©tapes dÃ©jÃ  traversÃ©es et te proposer plus facilement la prochaine Ã©tape utile.`
        : `Le parcours HexAstra est dÃ©sactivÃ©.\nJe continue Ã  rÃ©pondre normalement, sans suivre explicitement un chemin Ã©tape par Ã©tape.`
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-journey`,
          role: 'assistant',
          content,
          created_at: new Date().toISOString(),
          isReading: false,
        },
      ])
    },
    []
  )

  const handleJourneyToggle = useCallback(
    (next: boolean) => {
      setJourneyEnabled(next)
      try {
        localStorage.setItem('hexastra.journey_enabled', next ? '1' : '0')
      } catch {}
      if (journeyHydratedRef.current) {
        pushJourneyMessage(next)
      }
    },
    [pushJourneyMessage]
  )

  const applyApiResponse = useCallback((data: HexastraApiResponse | null | undefined) => {
    if (!data) {
      return "Je n'ai pas pu terminer la lecture pour le moment. On réessaie dans un instant."
    }

    const metadata = (data.metadata ?? {}) as ChatApiMetadata
    const reply = getStableApiReply(data as HexastraApiResponse & { content?: unknown })

    if (data.conversationId) setConversationId(data.conversationId)

    if (data.menu?.visible && Array.isArray(data.menu.items)) {
      setMenuItems(data.menu.items)
      setIsMenuDockOpen(true)
    } else if (data.menu?.visible === false) {
      setIsMenuDockOpen(false)
    }

    if (metadata.contextType) setActiveContextType(metadata.contextType)

    if (metadata.selectedMenuKey !== undefined) {
      setSelectedMenuKey(metadata.selectedMenuKey ?? null)
      setOpenMenuParentKey(metadata.selectedMenuKey ?? null)
    }

    if (metadata.selectedSubmenuKey !== undefined) {
      setSelectedSubmenuKey(metadata.selectedSubmenuKey ?? null)
    }

    if (metadata.contextFrame !== undefined) {
      setActiveContextFrame(metadata.contextFrame ?? null)
    }

    if (metadata.clarificationQuestion !== undefined) {
      setActiveClarificationQuestion(metadata.clarificationQuestion ?? null)
    }

    if (data.updatedEvolutionProfile) {
      setEvolutionProfile(data.updatedEvolutionProfile as UserEvolutionProfile)
      saveEvolutionProfile(data.updatedEvolutionProfile as UserEvolutionProfile)
    }

    if (metadata.userMemoryUpdate && typeof metadata.userMemoryUpdate === 'object') {
      try {
        const update = metadata.userMemoryUpdate as Partial<UserMemory>
        setUserMemory((prev) => {
          const merged = { ...prev, ...update }
          localStorage.setItem('hexastra.userMemory', JSON.stringify(merged))
          return merged
        })
      } catch {}
    }

    const quotaMeta = metadata.quota
    if (isFreePlan(userPlan) && quotaMeta) {
      const used =
        typeof quotaMeta.used === 'number' && Number.isFinite(quotaMeta.used)
          ? quotaMeta.used
          : 0

      setFreeMessagesUsed(used)

      const resetAtValue =
        typeof quotaMeta.resetAt === 'string' && quotaMeta.resetAt
          ? new Date(quotaMeta.resetAt)
          : null

      setFreeResetAt(resetAtValue)

      try {
        localStorage.setItem(FREE_USAGE_STORAGE_KEY, String(used))

        if (typeof quotaMeta.windowStartedAt === 'string' && quotaMeta.windowStartedAt) {
          localStorage.setItem(FREE_USAGE_FIRST_MSG_KEY, quotaMeta.windowStartedAt)
        } else if (used <= 0) {
          localStorage.removeItem(FREE_USAGE_FIRST_MSG_KEY)
        }
      } catch {}
    }

    if (metadata.quotaExceeded) {
      const resetAtValue =
        typeof metadata.resetAt === 'string' && metadata.resetAt
          ? new Date(metadata.resetAt)
          : null

      if (isFreePlan(userPlan)) {
        setFreeMessagesUsed(
          typeof metadata.used === 'number'
            ? metadata.used
            : typeof metadata.limit === 'number'
              ? metadata.limit
              : 3
        )
        setFreeResetAt(resetAtValue)
      }

      setPremiumLock({
        targetPlan: metadata.upgradeTargetPlan ?? 'essential',
        ctaLabel: metadata.upgradeCtaLabel ?? 'Passer Ã  Essentiel',
        text: reply || 'Ton accÃ¨s gratuit a atteint sa limite pour le moment.',
      })

      return reply
    }

    if (metadata.premiumPreviewLocked) {
      setPremiumLock({
        targetPlan: metadata.upgradeTargetPlan ?? 'premium',
        ctaLabel: metadata.upgradeCtaLabel ?? 'Passer Ã  Premium',
        text: 'La suite de lâ€™analyse complÃ¨te est disponible dans le plan supÃ©rieur.',
      })
    } else {
      setPremiumLock(null)
    }

    return reply
  }, [userPlan])

  const postChatPayload = useCallback(
    async (payload: unknown): Promise<HexastraApiResponse> => {
      if (requestAbortRef.current) {
        requestAbortRef.current.abort()
      }

      const controller = new AbortController()
      requestAbortRef.current = controller
      let timedOut = false
      const timeout = setTimeout(() => {
        timedOut = true
        controller.abort()
      }, API_TIMEOUT_MS)

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })

        if (response.status === 401) {
          window.location.href = '/auth?reason=session_expired'
          throw new Error('Session expired')
        }

        const data = await safeJson(response)

        if (!response.ok) {
          if (response.status === 429 && data && typeof data === 'object') {
            return data as HexastraApiResponse
          }

          console.error('[ChatPageClient] /api/chat error', response.status, data)
          throw new Error(`API error ${response.status}`)
        }

        if (!data || typeof data !== 'object') {
          throw new Error('Invalid API response')
        }

        return data as HexastraApiResponse
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new Error(timedOut ? 'Request timeout' : 'Request aborted')
        }
        throw error
      } finally {
        clearTimeout(timeout)
        if (requestAbortRef.current === controller) {
          requestAbortRef.current = null
        }
      }
    },
    []
  )

  const sendStructuredAction = useCallback(
    async ({
      message,
      displayMessage,
      contextType,
      menuKey,
      submenuKey,
      uiAction,
    }: {
      message: string
      displayMessage?: string
      contextType: ContextType
      menuKey?: string | null
      submenuKey?: string | null
      uiAction: 'select_menu_item' | 'select_submenu_item' | 'open_menu' | 'restart_flow'
    }) => {
      if (isTyping) return

      const requestSeq = ++requestSequenceRef.current
      const visibleMessage = (displayMessage ?? message).trim()
      const requestMessage = message.trim()

      const userMessage: Msg = {
        id: `${Date.now()}-user`,
        role: 'user',
        content: visibleMessage,
        created_at: new Date().toISOString(),
      }

      const baseMessages = isWelcome ? [] : messages
      const nextConversation = [...baseMessages, userMessage]
      const requestConversation = [...baseMessages, { ...userMessage, content: requestMessage }]

      setIsMenuDockOpen(uiAction === 'open_menu')
      if (uiAction === 'open_menu') {
        setOpenMenuParentKey(null)
        setSelectedMenuKey(null)
        setSelectedSubmenuKey(null)
      }

      setMessages(nextConversation)
      setIsTyping(true)

      const payload = buildChatPayload({
        requestType: 'chat',
        plan: userPlan,
        birthData: birthDataRef.current,
        partnerBirthData: partnerBirthDataRef.current,
        practitionerUsage,
        chatLanguage,
        conversationId,
        messages: requestConversation.map((m) => ({ role: m.role, content: m.content })),
        evolutionProfile,
        contextType,
        selectedMenuKey: menuKey ?? null,
        selectedSubmenuKey: submenuKey ?? null,
        uiAction,
        journeyEnabled,
      })

      try {
        const data = await postChatPayload(payload)
        if (requestSeq !== requestSequenceRef.current) return
        const isReading = isReadingFlowStep(data?.flowState?.step)
        const reply = applyApiResponse(data)
        const depthLevel = detectUserDepthLevel(requestMessage, messages, userPlan)
        const finalReply = formatAssistantReply(reply, {
          intent: ((data?.metadata ?? {}) as ChatApiMetadata).intentDetected,
          userMessage: requestMessage,
          isReading,
          depthLevel,
        })

        setMessages([
          ...nextConversation,
          {
            id: `${Date.now()}-assistant`,
            role: 'assistant',
            content: finalReply,
            created_at: new Date().toISOString(),
            isReading,
          },
        ])
      } catch (error) {
        if (requestSeq !== requestSequenceRef.current) return
        console.error('[sendStructuredAction] failed', error)
        if (error instanceof Error && error.message === 'Request aborted') {
          return
        }
        setMessages([
          ...nextConversation,
          {
            id: `${Date.now()}-error`,
            role: 'assistant',
            content:
              error instanceof Error && error.message === 'Request timeout'
                ? "Je n'ai pas pu ouvrir cet angle à temps. On réessaie dans un instant."
                : "Je n'ai pas pu ouvrir cet angle pour le moment. On réessaie dans un instant.",
            created_at: new Date().toISOString(),
          },
        ])
      } finally {
        if (requestSeq === requestSequenceRef.current) {
          setIsTyping(false)
        }
      }
    },
    [
      applyApiResponse,
      chatLanguage,
      conversationId,
      evolutionProfile,
      isTyping,
      isWelcome,
      messages,
      practitionerUsage,
      userPlan,
      postChatPayload,
      journeyEnabled,
      isReadingFlowStep,
      formatAssistantReply,
    ]
  )

  useEffect(() => {
    let mounted = true

    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!mounted) return

        if (data?.user?.email) setUserEmail(data.user.email)

        const plan = (data?.user?.user_metadata?.plan as PlanKey) ?? 'free'
        setUserPlan(plan)
        setPlanLoaded(true)

        if (error) {
          console.warn('[ChatPageClient] getUser error, fallback to free plan', error)
        }

        setEvolutionProfile((prev) => {
          const updated = { ...(prev ?? {}), plan }
          saveEvolutionProfile(updated)
          return updated
        })
      })
      .catch((err) => {
        if (!mounted) return
        console.error('[ChatPageClient] getUser failed', err)
        setPlanLoaded(true)
      })

    return () => {
      mounted = false
    }
  }, [supabase])

  // Pré-charger le menu initial dès que le plan est connu
  useEffect(() => {
    if (!planLoaded || menuItems.length) return
    const mode = getModeForPlan(userPlan)
    setMenuItems(getMenuForMode(mode))
  }, [planLoaded, menuItems.length, userPlan])

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('hexastra.journey_enabled')
      if (stored !== null) setJourneyEnabled(stored === '1')
    } catch {}
    journeyHydratedRef.current = true
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONVERSATION_STORAGE_KEY)
      if (stored) {
        setConversationId(stored)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!conversationId) return
    try {
      localStorage.setItem(CONVERSATION_STORAGE_KEY, conversationId)
    } catch {}
  }, [conversationId])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.birthData)
      if (stored) {
        const parsed = JSON.parse(stored) as BirthData
        if (parsed && typeof parsed === 'object') {
          const normalized = mergeBirthData(parsed)
          birthDataRef.current = normalized
          setBirthData(normalized)
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('hexastra.userMemory')
      if (stored) {
        const parsed = JSON.parse(stored) as UserMemory
        if (parsed && typeof parsed === 'object') setUserMemory(parsed)
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.partnerBirthData)
      if (stored) {
        const parsed = JSON.parse(stored) as BirthData
        if (parsed && typeof parsed === 'object') {
          const normalized = mergeBirthData(parsed)
          partnerBirthDataRef.current = normalized
          setPartnerBirthData(normalized)
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    setMicroReadings(loadMicroReadings())
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PRACTITIONER_USAGE_KEY)
      if (stored === 'personal' || stored === 'client') {
        setPractitionerUsage(stored)
      }
    } catch {}
  }, [])

  useEffect(() => {
    const profile = loadEvolutionProfile()
    if (profile) setEvolutionProfile(profile)
  }, [])

  useEffect(() => {
    try {
      const storedReadings = localStorage.getItem(STORAGE_KEYS.readings)
      const storedProjects = localStorage.getItem(STORAGE_KEYS.projects)

      if (storedReadings) {
        const parsed = JSON.parse(storedReadings)
        if (Array.isArray(parsed)) setReadings(parsed.filter(isValidReading))
      }

      if (storedProjects) {
        const parsed = JSON.parse(storedProjects)
        if (Array.isArray(parsed)) setProjects(parsed.filter(isValidProject))
      }
    } catch {
      setReadings([])
      setProjects([])
    }
  }, [])

  useEffect(() => {
    const query = searchParams.get('q')
    if (!query || hasPrefilled.current) return
    hasPrefilled.current = true
    setInput(query)
  }, [searchParams])

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      setPaymentSuccess(true)
      const timer = setTimeout(() => setPaymentSuccess(false), 6000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  useEffect(() => {
    if (!isFreePlan(userPlan)) return

    try {
      const firstMsgRaw = localStorage.getItem(FREE_USAGE_FIRST_MSG_KEY)

      if (firstMsgRaw) {
        const firstMsgTime = new Date(firstMsgRaw).getTime()
        const resetAt = new Date(firstMsgTime + 24 * 60 * 60 * 1000)

        if (Date.now() >= resetAt.getTime()) {
          localStorage.removeItem(FREE_USAGE_FIRST_MSG_KEY)
          localStorage.setItem(FREE_USAGE_STORAGE_KEY, '0')
          setFreeMessagesUsed(0)
          setFreeResetAt(null)
        } else {
          const n = parseInt(localStorage.getItem(FREE_USAGE_STORAGE_KEY) ?? '0', 10)
          setFreeMessagesUsed(Number.isFinite(n) ? n : 0)
          setFreeResetAt(resetAt)
        }
      } else {
        setFreeMessagesUsed(0)
        setFreeResetAt(null)
      }
    } catch {
      setFreeMessagesUsed(0)
    }
  }, [userPlan])

  useEffect(() => {
    if (
      step !== 'micro_profile_pending' &&
      step !== 'micro_year_pending' &&
      step !== 'micro_month_pending'
    ) {
      return
    }

    // Évite de bloquer l'UI au chargement. Exception: juste après l'envoi
    // du formulaire de naissance, on autorise la séquence micro complète.
    if (isWelcome && !forceMicroBootstrapRef.current) return

    if (microTriggerRef.current === step) return
    microTriggerRef.current = step

    const requestType: RequestType =
      step === 'micro_profile_pending'
        ? 'micro_profile'
        : step === 'micro_year_pending'
          ? 'micro_year'
          : 'micro_month'

    void triggerMicroReading(requestType)
  }, [step, isWelcome])

  useEffect(() => {
    if (step === 'conversation_ready') {
      forceMicroBootstrapRef.current = false
    }
  }, [step])

  useEffect(() => {
    return () => {
      if (requestAbortRef.current) {
        requestAbortRef.current.abort()
      }
    }
  }, [])

  const handleBirthDataChange = useCallback((next: BirthData) => {
    const normalized = mergeBirthData(next)
    birthDataRef.current = normalized
    setBirthData(normalized)
    try {
      localStorage.setItem(STORAGE_KEYS.birthData, JSON.stringify(normalized))
    } catch {}
  }, [])

  const handlePartnerBirthDataChange = useCallback((next: BirthData) => {
    const normalized = mergeBirthData(next)
    partnerBirthDataRef.current = normalized
    setPartnerBirthData(normalized)
    try {
      localStorage.setItem(STORAGE_KEYS.partnerBirthData, JSON.stringify(normalized))
    } catch {}
  }, [])

    const handleBirthDataSave = useCallback(
    (next: BirthData, partnerNext: BirthData) => {
      const normalized = mergeBirthData(next)
      const normalizedPartner = mergeBirthData(partnerNext)
      handleBirthDataChange(normalized)
      handlePartnerBirthDataChange(normalizedPartner)

      const reset = loadMicroReadings()
      setMicroReadings({ ...reset, profileKey: null })
      microTriggerRef.current = null

      if (normalized.firstName) {
        setEvolutionProfile((prev) => {
          const updated = { ...(prev ?? {}), firstName: normalized.firstName }
          saveEvolutionProfile(updated)
          return updated
        })
      }

      const parts: string[] = []
      if (normalized.firstName) parts.push(`prénom ${normalized.firstName}`)
      if (normalized.birthDate) parts.push(`né(e) le ${normalized.birthDate}`)
      if (normalized.birthTimeKnown === false) {
        parts.push('heure non fournie (12:00 par défaut)')
      } else if (normalized.birthTime) {
        parts.push(`à ${normalized.birthTime}`)
      }
      if (normalized.birthCity) parts.push(`à ${normalized.birthCity}`)
      if (normalized.birthCountryName) parts.push(normalized.birthCountryName)

      if (parts.length) {
        if (shouldResumeAfterBirthSave) {
          void sendStructuredAction({
            message: `Mes données de naissance sont maintenant enregistrées (${parts.join(', ')}). Reprends ma demande précédente et fais la lecture demandée : ${pendingReadingRequest}`,
            displayMessage: 'Mes données de naissance sont enregistrées. Reprends ma demande précédente.',
            contextType: activeContextType,
            uiAction: 'restart_flow',
          })
        } else {
          forceMicroBootstrapRef.current = true
        }
      }

      const partnerParts: string[] = []
      if (normalizedPartner.firstName) partnerParts.push(`prénom ${normalizedPartner.firstName}`)
      if (normalizedPartner.birthDate) partnerParts.push(`né(e) le ${normalizedPartner.birthDate}`)
      if (normalizedPartner.birthTimeKnown === false) {
        partnerParts.push('heure non fournie (12:00 par défaut)')
      } else if (normalizedPartner.birthTime) {
        partnerParts.push(`à ${normalizedPartner.birthTime}`)
      }
      if (normalizedPartner.birthCity) partnerParts.push(`à ${normalizedPartner.birthCity}`)
      if (normalizedPartner.birthCountryName) partnerParts.push(normalizedPartner.birthCountryName)

      if (partnerParts.length) {
        void sendStructuredAction({
          message: `Lecture croisée — données de l'autre personne mises à jour : ${partnerParts.join(', ')}.`,
          contextType: activeContextType,
          uiAction: 'restart_flow',
        })
      }
    },
    [
      activeContextType,
      handleBirthDataChange,
      handlePartnerBirthDataChange,
      pendingReadingRequest,
      sendStructuredAction,
      shouldResumeAfterBirthSave,
    ]
  )

  const handlePractitionerUsageSelect = useCallback((usage: PractitionerUsage) => {
    setPractitionerUsage(usage)
    try {
      localStorage.setItem(PRACTITIONER_USAGE_KEY, usage ?? '')
    } catch {}
  }, [])

  const persistReadings = useCallback((next: Reading[]) => {
    setReadings(next)
    localStorage.setItem(STORAGE_KEYS.readings, JSON.stringify(next))
  }, [])

  const persistProjects = useCallback((next: Project[]) => {
    setProjects(next)
    localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(next))
  }, [])

  const saveReading = useCallback(
    (conversation: Msg[]) => {
      const lastAssistant = [...conversation].reverse().find((m) => m.role === 'assistant')
      const firstUser = conversation.find((m) => m.role === 'user')

      if (!lastAssistant || !firstUser) return

      const reading: Reading = {
        id: `${Date.now()}`,
        title: makeReadingTitle(firstUser.content),
        science:
          mode === 'essentiel'
            ? 'Mode Essentiel'
            : mode === 'premium'
              ? 'Mode Premium'
              : 'Mode Praticien',
        date: new Date().toISOString(),
        preview: lastAssistant.content.slice(0, 220),
      }

      persistReadings([reading, ...readings].slice(0, 80))
    },
    [mode, persistReadings, readings]
  )

  async function triggerMicroReading(requestType: RequestType) {
    if (isTyping) return
    setIsTyping(true)
    const requestSeq = ++requestSequenceRef.current

    const loadingId = `${Date.now()}-micro-loading`

    setMessages((prev) => {
      const base = prev[0]?.id === 'welcome' ? [] : prev
      return [
        ...base,
        {
          id: loadingId,
          role: 'assistant' as const,
          content: '__loading_micro__',
          created_at: new Date().toISOString(),
        },
      ]
    })

    const historyMsgs: ChatMessage[] = []

    const payload = buildChatPayload({
      requestType,
      plan: userPlan,
      birthData,
      partnerBirthData,
      practitionerUsage,
      chatLanguage,
      conversationId,
      messages: historyMsgs,
      contextType: activeContextType,
      selectedMenuKey,
      selectedSubmenuKey,
      uiAction: 'send_message',
      journeyEnabled,
    })

    try {
      const data = await postChatPayload(payload)
      if (requestSeq !== requestSequenceRef.current) return
      const reply = applyApiResponse(data)
      const isReading = isReadingFlowStep(data?.flowState?.step)
      const depthLevel = detectUserDepthLevel(lastUserMessage || reply, messages, userPlan)
      const finalReply = formatAssistantReply(reply, {
        intent: ((data?.metadata ?? {}) as ChatApiMetadata).intentDetected,
        userMessage: lastUserMessage || reply,
        isReading,
        depthLevel,
      })

      setMessages((prev) => {
        const without = prev.filter((m) => m.id !== loadingId)

        return [
          ...without,
          {
            id: `${Date.now()}-micro`,
            role: 'assistant' as const,
            content: finalReply,
            created_at: new Date().toISOString(),
            isReading,
          },
        ]
      })

      setMicroReadings((prev) => {
        let next: MicroReadings

        if (requestType === 'micro_profile') next = markProfileDone(prev, birthData)
        else if (requestType === 'micro_year') next = markYearDone(prev)
        else next = markMonthDone(prev)

        microTriggerRef.current = null
        return next
      })
    } catch (error) {
      if (requestSeq !== requestSequenceRef.current) return
      console.error('[triggerMicroReading] failed', error)
      if (error instanceof Error && error.message === 'Request aborted') {
        return
      }
      setMessages((prev) => prev.filter((m) => m.id !== loadingId))
      microTriggerRef.current = null
    } finally {
      if (requestSeq === requestSequenceRef.current) {
        setIsTyping(false)
      }
    }
  }

  const handleSend = useCallback(
    async (provided?: string) => {
      const baseContent = (provided ?? input).trim()
      const attachNote = attachedFile ? `\n\n[PiÃ¨ce jointe : ${attachedFile.name}]` : ''
      const currentBirthData = birthDataRef.current
      const currentPartnerBirthData = partnerBirthDataRef.current
      const content = baseContent + attachNote
      const requestContent = buildStoredBirthDataRequest(baseContent, currentBirthData) + attachNote

      if (!content.trim() || isTyping) return
      if (isDuplicateMessage(lastMessageRef, content)) return
      if (chatStep !== 'conversation_ready') return
      if (isMicroBootstrapPending) return

      if (isMenuOpenMessage(baseContent)) {
        const baseMessages = isWelcome ? [] : messages
        const userMsg: Msg = {
          id: `${Date.now()}-user`,
          role: 'user',
          content,
          created_at: new Date().toISOString(),
        }

        setMessages([...baseMessages, userMsg])
        setInput('')
        setAttachedFile(null)
        setMenuItems((prev) => (prev.length ? prev : getMenuForMode(getModeForPlan(userPlan))))
        setActiveContextType('general')
        setSelectedMenuKey(null)
        setSelectedSubmenuKey(null)
        setOpenMenuParentKey(null)
        setIsMenuDockOpen(true)
        return
      }

      const numericChoice = parseNumericMenuChoice(baseContent)
      if (numericChoice && menuItems.length > 0) {
        const selection = resolveNumericMenuSelection(menuItems, numericChoice, selectedMenuKey)

        if (selection?.openParentOnly) {
          const baseMessages = isWelcome ? [] : messages
          const userMsg: Msg = {
            id: `${Date.now()}-user`,
            role: 'user',
            content,
            created_at: new Date().toISOString(),
          }

          setMessages([...baseMessages, userMsg])
          setInput('')
          setAttachedFile(null)
          setActiveContextType(selection.item.contextType ?? 'general')
          setSelectedMenuKey(selection.item.key)
          setSelectedSubmenuKey(null)
          setOpenMenuParentKey(selection.item.key)
          setIsMenuDockOpen(true)
          return
        }

        if (selection) {
          const context = selection.item.contextType ?? selection.parent?.contextType ?? 'general'
          setInput('')
          setAttachedFile(null)
          setActiveContextType(context)
          setSelectedMenuKey(selection.parent?.key ?? selection.item.key)
          setSelectedSubmenuKey(selection.parent ? selection.item.key : null)
          setOpenMenuParentKey(selection.parent?.key ?? null)
          setIsMenuDockOpen(false)

          await sendStructuredAction({
            message: buildMenuSelectionRequest(selection.item, selection.parent),
            displayMessage: content,
            contextType: context,
            menuKey: selection.parent?.key ?? selection.item.key,
            submenuKey: selection.parent ? selection.item.key : null,
            uiAction: selection.parent ? 'select_submenu_item' : 'select_menu_item',
          })
          return
        }
      }

      const moderation = moderateMessage(baseContent)
      const depthLevel = detectUserDepthLevel(baseContent, messages, userPlan)
      const memorySignals = detectMemorySignals(baseContent)
      setUserMemory((prev) => {
        const next = updateUserMemory(prev, memorySignals)
        try { localStorage.setItem('hexastra.userMemory', JSON.stringify(next)) } catch {}
        return next
      })

      if (moderation !== 'SAFE') {
        const baseMessages = isWelcome ? [] : messages
        const userMsg: Msg = {
          id: `${Date.now()}-user`,
          role: 'user',
          content,
          created_at: new Date().toISOString(),
        }
        setMessages([
          ...baseMessages,
          userMsg,
          {
            id: `${Date.now()}-moderation`,
            role: 'assistant',
            content:
              moderation === 'CONFUSED'
                ? activeClarificationQuestion ??
                  (activeContextFrame
                    ? `${activeContextFrame}\n\n${buildClarificationPrompt()}`
                    : buildClarificationPrompt())
                : buildGuardResponse(moderation),
            created_at: new Date().toISOString(),
          },
        ])
        setInput('')
        setAttachedFile(null)
        return
      }

      if (!canContinueChat(userPlan, freeMessagesUsed)) {
        const baseMessages = isWelcome ? [] : messages

        setMessages([
          ...baseMessages,
          {
            id: `${Date.now()}-limit`,
            role: 'assistant',
            content: `Tu as atteint la limite de ton accÃ¨s dÃ©couverte pour le moment.

Ton espace gratuit se rÃ©ouvrira automatiquement dans 24h.
Si tu veux continuer maintenant, tu peux passer Ã  Essentiel.`,
            created_at: new Date().toISOString(),
          },
        ])

        setPremiumLock({
          targetPlan: 'essential',
          ctaLabel: 'Passer Ã  Essentiel',
          text:
            'Ton accÃ¨s gratuit est temporairement arrivÃ© Ã  sa limite. Reviens dans 24h ou passe Ã  Essentiel pour continuer maintenant.',
        })

        return
      }

      const routeResult = routeUserQuery(baseContent)
      if (routeResult.decision !== 'allowed') {
        const baseMessages = isWelcome ? [] : messages
        const userMsg: Msg = {
          id: `${Date.now()}-user`,
          role: 'user',
          content,
          created_at: new Date().toISOString(),
        }

        setMessages([
          ...baseMessages,
          userMsg,
          {
            id: `${Date.now()}-guard`,
            role: 'assistant',
            content: routeResult.message,
            created_at: new Date().toISOString(),
          },
        ])

        setInput('')
        setAttachedFile(null)
        return
      }

      const userMessage: Msg = {
        id: `${Date.now()}-user`,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      }

      const baseMessages = isWelcome ? [] : messages
      const nextConversation = [...baseMessages, userMessage]

      setMessages(nextConversation)
      setInput('')
      setAttachedFile(null)
      setIsTyping(true)

      const cacheKey = [
        userPlan,
        activeContextType,
        selectedMenuKey ?? '',
        selectedSubmenuKey ?? '',
        conversationId ?? '',
        requestContent.slice(0, 120),
      ].join('::')

      const cachedReply = cacheRef.current.get(cacheKey)
      if (cachedReply) {
        const cachedIsReading =
          cachedReply.includes('â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€') ||
          cachedReply.toLowerCase().includes('pour aller plus loin')
        const depthLevel = detectUserDepthLevel(baseContent, messages, userPlan)
        const composedCached = formatAssistantReply(cachedReply, {
          intent: undefined,
          isReading: cachedIsReading,
          userMessage: baseContent,
          depthLevel,
        })
        const assistantMessage: Msg = {
          id: `${Date.now()}-cached`,
          role: 'assistant',
          content: composedCached,
          created_at: new Date().toISOString(),
          cached: true,
          isReading: cachedIsReading,
        }

        setTimeout(() => {
          const final = [...nextConversation, assistantMessage]
          setMessages(final)
          setIsTyping(false)
          saveReading(final)
        }, 180)

        return
      }

      const historyMsgs: ChatMessage[] = [
        ...baseMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        {
          role: 'user',
          content: requestContent,
        },
      ]

      const payload = buildChatPayload({
        requestType: 'chat',
        plan: userPlan,
        birthData: currentBirthData,
        partnerBirthData: currentPartnerBirthData,
        practitionerUsage,
        chatLanguage,
        conversationId,
        messages: historyMsgs,
        evolutionProfile,
        contextType: activeContextType,
        selectedMenuKey,
        selectedSubmenuKey,
        uiAction: 'send_message',
        journeyEnabled,
      })
      const requestSeq = ++requestSequenceRef.current

      try {
        const data = await postChatPayload(payload)
        if (requestSeq !== requestSequenceRef.current) return
        const reply = applyApiResponse(data)
        const isReading = isReadingFlowStep(data?.flowState?.step)
        const depthLevel = detectUserDepthLevel(requestContent, messages, userPlan)
        const finalReply = formatAssistantReply(reply, {
          intent: ((data?.metadata ?? {}) as ChatApiMetadata).intentDetected,
          userMessage: requestContent,
          isReading,
          depthLevel,
        })

        const assistantMessage: Msg = {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: finalReply,
          created_at: new Date().toISOString(),
          isReading,
        }

        const final = [...nextConversation, assistantMessage]
        setMessages(final)
        setIsTyping(false)

        setCacheEntry(cacheRef.current, cacheKey, reply)
        saveReading(final)


      } catch (error) {
        if (requestSeq !== requestSequenceRef.current) return
        console.error('[handleSend] failed', error)
        if (error instanceof Error && error.message === 'Request aborted') {
          return
        }

        setMessages([
          ...nextConversation,
          {
            id: `${Date.now()}-error`,
            role: 'assistant',
            content:
              error instanceof Error && error.message === 'Request timeout'
                ? "Je n'ai pas pu terminer la lecture à temps. Réessaie dans quelques instants."
                : "Je n'ai pas pu terminer la lecture pour le moment. Réessaie dans quelques instants.",
            created_at: new Date().toISOString(),
          },
        ])

        setIsTyping(false)
      } finally {
        if (requestSeq === requestSequenceRef.current) {
          setIsTyping(false)
        }
      }
    },
    [
      activeContextType,
      applyApiResponse,
      attachedFile,
      chatLanguage,
      conversationId,
      evolutionProfile,
      freeMessagesUsed,
      input,
      isTyping,
      isWelcome,
      messages,
      practitionerUsage,
      saveReading,
      selectedMenuKey,
      selectedSubmenuKey,
      isMicroBootstrapPending,
      chatStep,
      userPlan,
      postChatPayload,
      journeyEnabled,
      isReadingFlowStep,
      formatAssistantReply,
      sendStructuredAction,
      menuItems,
    ]
  )

  const handleNewReading = useCallback(() => {
    setMessages([createWelcomeMessage(chatLanguage)])
    setConversationId(null)
    setInput('')
    setMenuItems([])
      setIsMenuDockOpen(false)
      setOpenMenuParentKey(null)
      setActiveContextType('general')
      setSelectedMenuKey(null)
      setSelectedSubmenuKey(null)
      setActiveContextFrame(null)
      setActiveClarificationQuestion(null)
      microTriggerRef.current = null
    lastMessageRef.current = null
    try {
      localStorage.removeItem(CONVERSATION_STORAGE_KEY)
    } catch {}
  }, [chatLanguage])

  const handleCreateProject = useCallback(
    (name: string) => {
      if (!name.trim()) return
      persistProjects([...projects, { id: `${Date.now()}`, name: name.trim(), collapsed: false }])
    },
    [persistProjects, projects]
  )

  const handleAssignReadingToProject = useCallback(
    (readingId: string, projectId: string) => {
      persistReadings(readings.map((r) => (r.id === readingId ? { ...r, projectId } : r)))
    },
    [persistReadings, readings]
  )

  const handleOpenReading = useCallback((reading: Reading) => {
    setMessages([
      {
        id: `reading-${reading.id}`,
        role: 'assistant',
        content: `Lecture sauvegardÃ©e\n\n${reading.preview}`,
        created_at: reading.date,
      },
    ])
    setShowLeft(false)
  }, [])

  const sidebar = (
    <LeftSidebar
      projects={projects}
      readings={readings}
      userInitials={userInitials}
      onNewReading={handleNewReading}
      onCreateProject={handleCreateProject}
      onOpenReading={handleOpenReading}
      onAssignReadingToProject={handleAssignReadingToProject}
    />
  )

  const mobileOverlay =
    !desktopLeft && showLeft ? (
      <div className="hx-chat-overlay" onClick={() => setShowLeft(false)} role="presentation">
        <aside
          className="hx-chat-mobile-sheet hx-chat-mobile-sheet-left hx-chat-panel"
          onClick={(e) => e.stopPropagation()}
        >
          {sidebar}
        </aside>
      </div>
    ) : null

  const bootstrapOverlay = (() => {
    if (step === 'loading') return null

    if (step === 'birthdata_missing') {
      return null
    }

    if (step === 'practitioner_usage_needed') {
      return (
        <div className="hx-bootstrap-overlay">
          <PractitionerUsageStep onSelect={handlePractitionerUsageSelect} />
        </div>
      )
    }

    return null
  })()

  const composerProps = {
    value: input,
    onChange: setInput,
    onSend: () => void handleSend(),
    onQuickPrompt: (v: string) => void handleSend(v),
    showQuickPrompts: false,
    onAttach: (file: File) => setAttachedFile(file),
    attachedFileName: attachedFile?.name,
    onRemoveAttach: () => setAttachedFile(null),
    onBirthFormOpen: () => setShowInlineBirthForm((v) => !v),
    highlightBirth: isWelcome && !isBirthDataComplete(birthData),
    disabled: chatStep !== 'conversation_ready' || isMicroBootstrapPending || isLimitReached || isTyping,
  }

  return (
    <div className="hx-chat-page">
      <PremiumBackground />

      {paymentSuccess && (
        <div className="hx-payment-success-banner" role="status">
          <span>âœ¦</span>
          <span>Paiement confirmÃ© â€” votre abonnement est activÃ©.</span>
          <button type="button" onClick={() => setPaymentSuccess(false)} aria-label="Fermer">
            âœ•
          </button>
        </div>
      )}

      {mobileOverlay}

      <div className="hx-app-layout">
        {desktopLeft && <aside className="hx-app-sidebar">{sidebar}</aside>}

        <main className="hx-app-main">
          <div className="hx-app-topbar">
            <div className="hx-app-topbar-left">
              {!desktopLeft && (
                <button
                  type="button"
                  className="hx-icon-btn"
                  onClick={() => setShowLeft(true)}
                  aria-label="Menu"
                >
                  <IconMenu />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.9)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={journeyEnabled}
                  onChange={(e) => handleJourneyToggle(e.target.checked)}
                  style={{ accentColor: '#4cd2c0' }}
                />
                <span>Suivre mon parcours HexAstra</span>
              </label>
              <LanguageSwitcher variant="flag" className="hx-nav-lang" />
            </div>
          </div>

          <div className="hx-app-feed hx-scroll-soft">
            <div className="hx-app-feed-inner">
              <MessageList
                messages={messages}
                isTyping={isTyping}
                lastUserMessage={lastUserMessage}
                onRetry={(fallback) => {
                  if (fallback) {
                    void handleSend(fallback)
                  } else {
                    void handleSend(lastUserMessage)
                  }
                }}
              />

              {premiumLock && (
                <div className="hx-premium-lock">
                  <div className="hx-premium-lock-inner">
                    <div className="hx-premium-lock-text">{premiumLock.text}</div>

                    <button
                      className="hx-premium-lock-btn"
                      onClick={() => {
                        window.location.href = `/pricing?upgrade=${premiumLock.targetPlan}`
                      }}
                    >
                      {premiumLock.ctaLabel}
                    </button>
                  </div>
                </div>
              )}

              {shouldShowMenuDock && (
                <MenuDock
                  items={menuItems}
                  title="HexAstra Coach"
                  subtitle="Quel angle souhaites-tu explorer ?"
                  userPlan={userPlan}
                  lastUserMessage={lastUserMessage}
                  openParentKey={openMenuParentKey}
                  onOpenParentChange={setOpenMenuParentKey}
                  onSelect={(item, parent) => {
                    const context = item.contextType ?? parent?.contextType ?? 'general'
                    setActiveContextType(context)
                    setSelectedMenuKey(parent?.key ?? item.key)
                    setSelectedSubmenuKey(parent ? item.key : null)
                    setOpenMenuParentKey(parent?.key ?? null)
                    setIsMenuDockOpen(false)

                    void sendStructuredAction({
                      message: buildMenuSelectionRequest(item, parent),
                      displayMessage: buildMenuSelectionDisplay(item, parent),
                      contextType: context,
                      menuKey: parent?.key ?? item.key,
                      submenuKey: parent ? item.key : null,
                      uiAction: parent ? 'select_submenu_item' : 'select_menu_item',
                    })
                  }}
                />
              )}
            </div>
          </div>

          <div className="hx-app-bottom">
            <div className="hx-app-composer-wrap">
              {showInlineBirthForm && (
                <div className="hx-inline-birth">
                  <BirthDataInlineForm
                    data={birthData}
                    partnerData={partnerBirthData}
                    submitLabel={birthSubmitLabel}
                    onSave={(next, partner) => {
                      handleBirthDataSave(next, partner)
                      setShowInlineBirthForm(false)
                    }}
                  />
                </div>
              )}

              {bootstrapOverlay ??
                (isLimitReached ? (
                  <PaywallBanner plan={userPlan} resetAt={freeResetAt} />
                ) : (
                  <Composer {...composerProps} />
                ))}

              {!isLimitReached && !bootstrapOverlay && (
                <p className="hx-app-disclaimer">{t('chat.disclaimer')}</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}













