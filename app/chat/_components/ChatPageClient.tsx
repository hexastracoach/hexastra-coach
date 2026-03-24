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
import RenderModeStep from './RenderModeStep'
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
  getPlanHref,
  isQuotaLimitedPlan,
  shouldPersistQuotaLocally,
  type PlanKey,
} from '@/lib/plans'
import {
  computeBootstrapStep,
  isBirthDataComplete,
} from '@/lib/chat/bootstrapMachine'
import {
  getBootstrapMicroRequestType,
  resolveBootstrapUiState,
} from '@/lib/chat/bootstrapPolicy'
import { getEntitlements } from '@/lib/chat/entitlements'
import { readConversationMessages } from '@/lib/hexastra/memory/sessionMemory'
import { getMenuForMode } from '@/lib/hexastra/menus/getMenuForMode'
import { getModeForPlan } from '@/lib/hexastra/config/planModeMap'
import {
  loadMicroReadings,
  loadBirthAutoIntroCompleted,
  markBirthAutoIntroCompleted,
  markProfileDone,
  markYearDone,
  markMonthDone,
  resetMicroReadings,
} from '@/lib/chat/microReadingScheduler'
import {
  buildChatPayload,
  type RequestType,
  type ChatMessage,
} from '@/lib/chat/chatPayloadBuilder'
import {
  PRACTITIONER_USAGE_KEY,
  ANALYSIS_MODE_KEY,
  RENDER_MODE_KEY,
  type MicroReadings,
  type PractitionerUsage,
} from '@/lib/chat/bootstrapTypes'
import type { AnalysisMode, RenderMode } from '@/lib/hexastra/sciences/scienceTaxonomy'
import { FUSION_ONLY_ANALYSIS_MODE } from '@/lib/hexastra/fusionOnly'
import {
  resolveClientSendPolicy,
  resolveSelectionContext,
} from '@/lib/chat/clientSendPolicy'
import { resolveClientResponsePolicy } from '@/lib/chat/clientResponsePolicy'
import {
  loadEvolutionProfile,
  saveEvolutionProfile,
} from '@/lib/stores/userEvolutionStore'
import {
  readScopedStorage,
  removeScopedStorage,
  writeScopedStorage,
} from '@/lib/chat/scopedLocalStorage'
import type { UserEvolutionProfile } from '@/types/evolution'
import { useChatLanguage, useTranslation } from '@/lib/i18n/useTranslation'
import {
  detectUserDepthLevel,
  adjustResponseDepth,
} from '@/lib/chat/adaptiveDepthEngine'
import {
  EMPTY_USER_MEMORY,
  detectMemorySignals,
  updateUserMemory,
  type UserMemory,
} from '@/lib/chat/userMemoryEngine'
import LanguageSwitcher from '@/app/components/LanguageSwitcher'
import MenuDock from './MenuDock'
import { buildContextualSuggestions } from '@/lib/chat/suggestions'
import { buildUserInsights } from '@/lib/hexastra/memory/insightEngine'
import MemoryHint from './MemoryHint'
import { trackHexastraFunnel } from '@/lib/analytics/hexastraFunnel'
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
const USER_MEMORY_STORAGE_KEY = 'hexastra.userMemory'
const CACHE_LIMIT = 50
const DUPLICATE_MESSAGE_WINDOW_MS = 1200

function getWelcomeContent(language: string) {
  switch (language) {
    case 'en':
      return `Hello.

You do not need the perfect question.
Tell me what feels unclear, heavy, or stuck for you right now.

I will help you understand what is happening, then see the clearest next direction.`
    case 'es':
      return `Hola.

Soy HexAstra Coach.
Estoy aqui para ayudarte a comprender tu situacion, tu timing y la direccion mas util a seguir.

Para lanzar tu primera lectura automatica, abre el formulario de datos de nacimiento en la barra de chat y completalo una vez.`
    default:
      return `Bonjour.

Tu n'as pas besoin d'arriver avec une question parfaite.
Parle-moi simplement de ce qui est flou, lourd ou bloqué pour toi.

Je t'aiderai à comprendre ce qui se joue, puis à voir la direction la plus juste.`
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  return `Contexte choisi : ${contextLabel}. N ouvre pas encore de lecture. Garde simplement cet angle comme cadre, puis demande-moi ma vraie question avant d analyser.`
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

function applyBirthDataState(
  next: Partial<BirthData> | null | undefined,
  setState: (value: BirthData) => void,
  ref: MutableRefObject<BirthData>,
) {
  const normalized = mergeBirthData(next ?? {})
  ref.current = normalized
  setState(normalized)
}

function splitBirthLocation(value: unknown) {
  if (typeof value !== 'string') {
    return { birthCity: '', birthCountryName: '' }
  }

  const segments = value
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean)

  if (segments.length === 0) {
    return { birthCity: '', birthCountryName: '' }
  }

  if (segments.length === 1) {
    return { birthCity: segments[0], birthCountryName: '' }
  }

  return {
    birthCity: segments.slice(0, -1).join(', '),
    birthCountryName: segments[segments.length - 1],
  }
}

function birthDataFromProfile(profile: Record<string, unknown> | null | undefined): BirthData | null {
  if (!profile || typeof profile !== 'object') return null

  const { birthCity, birthCountryName } = splitBirthLocation(profile.birth_location)
  const birthLat =
    typeof profile.birth_lat === 'number'
      ? String(profile.birth_lat)
      : typeof profile.birth_lat === 'string'
        ? profile.birth_lat
        : ''
  const birthLng =
    typeof profile.birth_lng === 'number'
      ? String(profile.birth_lng)
      : typeof profile.birth_lng === 'string'
        ? profile.birth_lng
        : ''

  const normalized = mergeBirthData({
    firstName: typeof profile.first_name === 'string' ? profile.first_name : '',
    birthDate: typeof profile.birth_date === 'string' ? profile.birth_date : '',
    birthTime: typeof profile.birth_time === 'string' ? profile.birth_time : '',
    birthTimeKnown:
      typeof profile.birth_time_known === 'boolean'
        ? profile.birth_time_known
        : Boolean(profile.birth_time),
    birthCity,
    birthLat,
    birthLng,
    birthCountryCode: typeof profile.birth_country_code === 'string' ? profile.birth_country_code : '',
    birthCountryName,
    gender: typeof profile.gender === 'string' ? profile.gender : '',
  })

  return isBirthDataComplete(normalized) ? normalized : null
}

export default function ChatPageClient() {
  const searchParams = useSearchParams()
  const supabase = createClient()
  const chatLanguage = useChatLanguage()
  const { t } = useTranslation()
  const entrySource = searchParams.get('source') ?? 'direct'

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
  const [, setUserMemory] = useState<UserMemory>(EMPTY_USER_MEMORY)

  const [readings, setReadings] = useState<Reading[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  const [showLeft, setShowLeft] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(1600)
  const [userEmail, setUserEmail] = useState('')
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [storageScopeReady, setStorageScopeReady] = useState(false)

  const [birthData, setBirthData] = useState<BirthData>(EMPTY_BIRTH_DATA)
  const [partnerBirthData, setPartnerBirthData] = useState<BirthData>(EMPTY_BIRTH_DATA)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)

  const [userPlan, setUserPlan] = useState<PlanKey>('free')
  const [planLoaded, setPlanLoaded] = useState(false)

  const [practitionerUsage, setPractitionerUsage] = useState<PractitionerUsage>(null)
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>(FUSION_ONLY_ANALYSIS_MODE)
  const [renderMode, setRenderMode] = useState<RenderMode | null>(null)

  const [microReadings, setMicroReadings] = useState<MicroReadings>({
    profileKey: null,
    yearKey: null,
    monthKey: null,
  })
  const [birthAutoIntroCompleted, setBirthAutoIntroCompleted] = useState(false)
  const [autoBirthIntroPending, setAutoBirthIntroPending] = useState(false)
  const [showInlineBirthForm, setShowInlineBirthForm] = useState(false)

  const [evolutionProfile, setEvolutionProfile] = useState<UserEvolutionProfile | null>(null)

  const [quotaMessagesUsed, setQuotaMessagesUsed] = useState(0)
  const [quotaResetAt, setQuotaResetAt] = useState<Date | null>(null)

  const cacheRef = useRef<Map<string, string>>(new Map())
  const funnelTrackingRef = useRef({
    firstMessageSent: false,
    secondMessageSent: false,
    limitReached: false,
  })
  const hasPrefilled = useRef(false)
  const microTriggerRef = useRef<string | null>(null)
  const forceMicroBootstrapRef = useRef(false)
  const requestAbortRef = useRef<AbortController | null>(null)
  const requestSequenceRef = useRef(0)
  const lastMessageRef = useRef<string | null>(null)
  const birthDataRef = useRef<BirthData>(EMPTY_BIRTH_DATA)
  const partnerBirthDataRef = useRef<BirthData>(EMPTY_BIRTH_DATA)
  const journeyHydratedRef = useRef(false)
  const mode = planLoaded ? getEntitlements(userPlan).chatMode : 'essentiel'
  const storageScope = authUserId

  const step = computeBootstrapStep({
    planLoaded,
    plan: userPlan,
    practitionerUsage,
    analysisMode,
    renderMode,
    birthData,
    microReadings,
    allowAutomaticMicroReadings: autoBirthIntroPending,
  })
  const bootstrapUi = resolveBootstrapUiState(step)
  const isMicroBootstrapPending = bootstrapUi.isMicroPending
  const chatStep = bootstrapUi.chatStep
  const pendingMicroRequestType = getBootstrapMicroRequestType(step)

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

  // Minimal formatting: keep business response as-is, optionally trim via depth
  const formatAssistantReply = useCallback(
    (
      base: string,
      {
        intent: _intent,
        isReading,
        userMessage: _userMessage,
        depthLevel,
      }: {
        intent: string | undefined
        isReading: boolean
        userMessage: string
        depthLevel: string
      }
    ) => {
      const depthAdjusted = adjustResponseDepth(base, {
        level: depthLevel as any,
        plan: userPlan,
        isReading,
      })
      return depthAdjusted
    },
    [userPlan]
  )

  const userMessages = useMemo(
    () => messages.filter((message) => message.role === 'user'),
    [messages]
  )

  const lastUserMessage = userMessages[userMessages.length - 1]?.content ?? ''
  const lastAssistantMessage =
    [...messages].reverse().find((message) => message.role === 'assistant')?.content ?? ''

  const contextualSuggestions = useMemo(
    () => buildContextualSuggestions({ messages, plan: userPlan }),
    // Recalcule uniquement quand le dernier message ou le plan change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages.length, userPlan],
  )

  const activeInsight = useMemo(
    () => buildUserInsights(messages).dominant,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages.length],
  )
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
    : birthAutoIntroCompleted
      ? 'Enregistrer ces données pour mes prochaines lectures ->'
      : "Enregistrer et lancer ma lecture d'accueil ->"
  const shouldShowMenuDock =
    chatStep === 'conversation_ready' &&
    menuItems.length > 0 &&
    !isTyping &&
    !isMicroBootstrapPending &&
    isMenuDockOpen

  const desktopLeft = viewportWidth >= 1100
  const userInitials = getInitials(userEmail)
  const isLimitReached = isQuotaLimitedPlan(userPlan) && !canContinueChat(userPlan, quotaMessagesUsed)
  const returnNote = chatLanguage?.startsWith('en')
    ? 'Come back with your situation. Things evolve, and your reading can evolve too.'
    : 'Reviens avec ta situation. Les choses évoluent, ta lecture aussi.'
  const shouldShowReturnNote =
    bootstrapUi.chatReady &&
    !isLimitReached &&
    messages.some((message) => message.role === 'assistant' && message.id !== 'welcome')

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
        ? `Ton parcours HexAstra est activé.\nJe pourrai garder le fil de ton exploration, repérer les étapes déjà traversées et te proposer plus facilement la prochaine étape utile.`
        : `Le parcours HexAstra est désactivé.\nJe continue à répondre normalement, sans suivre explicitement un chemin étape par étape.`
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
    const responsePolicy = resolveClientResponsePolicy(data)

    if (responsePolicy.conversationId) setConversationId(responsePolicy.conversationId)

    if (responsePolicy.menu.action === 'open') {
      setMenuItems(responsePolicy.menu.items)
      setIsMenuDockOpen(true)
    } else if (responsePolicy.menu.action === 'close') {
      setIsMenuDockOpen(false)
    }

    if (responsePolicy.context.contextType) setActiveContextType(responsePolicy.context.contextType)

    if (responsePolicy.context.selectedMenuKey !== undefined) {
      setSelectedMenuKey(responsePolicy.context.selectedMenuKey ?? null)
      setOpenMenuParentKey(responsePolicy.context.selectedMenuKey ?? null)
    }

    if (responsePolicy.context.selectedSubmenuKey !== undefined) {
      setSelectedSubmenuKey(responsePolicy.context.selectedSubmenuKey ?? null)
    }

    if (responsePolicy.context.contextFrame !== undefined) {
      setActiveContextFrame(responsePolicy.context.contextFrame ?? null)
    }

    if (responsePolicy.context.clarificationQuestion !== undefined) {
      setActiveClarificationQuestion(responsePolicy.context.clarificationQuestion ?? null)
    }

    if (responsePolicy.evolutionProfile) {
      setEvolutionProfile(responsePolicy.evolutionProfile as UserEvolutionProfile)
      saveEvolutionProfile(responsePolicy.evolutionProfile as UserEvolutionProfile, storageScope)
    }

    if (responsePolicy.userMemoryUpdate) {
      try {
        const update = responsePolicy.userMemoryUpdate as Partial<UserMemory>
        setUserMemory((prev) => {
          const merged = { ...prev, ...update }
          writeScopedStorage(
            window.localStorage,
            USER_MEMORY_STORAGE_KEY,
            JSON.stringify(merged),
            storageScope,
          )
          return merged
        })
      } catch {}
    }

    if (isQuotaLimitedPlan(userPlan) && responsePolicy.quotaSync) {
      setQuotaMessagesUsed(responsePolicy.quotaSync.used)
      setQuotaResetAt(responsePolicy.quotaSync.resetAt)

      if (shouldPersistQuotaLocally(userPlan)) {
        try {
          localStorage.setItem(FREE_USAGE_STORAGE_KEY, String(responsePolicy.quotaSync.used))

          if (responsePolicy.quotaSync.windowStartedAt) {
            localStorage.setItem(FREE_USAGE_FIRST_MSG_KEY, responsePolicy.quotaSync.windowStartedAt)
          } else if (responsePolicy.quotaSync.used <= 0) {
            localStorage.removeItem(FREE_USAGE_FIRST_MSG_KEY)
          }
        } catch {}
      }
    }

      if (responsePolicy.quotaExceeded && isQuotaLimitedPlan(userPlan)) {
        setQuotaMessagesUsed(responsePolicy.quotaExceeded.used)
        setQuotaResetAt(responsePolicy.quotaExceeded.resetAt)
        if (!funnelTrackingRef.current.limitReached) {
          funnelTrackingRef.current.limitReached = true
          trackHexastraFunnel('chat_limit_reached', {
            plan: userPlan,
            source: entrySource,
            usedMessages: responsePolicy.quotaExceeded.used,
            via: 'server',
          })
        }
      }

    if (responsePolicy.premiumLock.action === 'set') {
      setPremiumLock(responsePolicy.premiumLock.value)
    } else {
      setPremiumLock(null)
    }

    return responsePolicy.reply
  }, [entrySource, storageScope, userPlan])

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
        analysisMode,
        renderMode,
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

        setAuthUserId(data?.user?.id ?? null)
        if (data?.user?.email) setUserEmail(data.user.email)

        const plan = (data?.user?.user_metadata?.plan as PlanKey) ?? 'free'
        setUserPlan(plan)
        setPlanLoaded(true)
        setStorageScopeReady(true)

        if (error) {
          console.warn('[ChatPageClient] getUser error, fallback to free plan', error)
        }

        setEvolutionProfile((prev) => {
          const updated = { ...(prev ?? {}), plan }
          saveEvolutionProfile(updated, data?.user?.id ?? null)
          return updated
        })
      })
      .catch((err) => {
        if (!mounted) return
        console.error('[ChatPageClient] getUser failed', err)
        setAuthUserId(null)
        setPlanLoaded(true)
        setStorageScopeReady(true)
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
    if (!storageScopeReady) return
    try {
      const stored = readScopedStorage(window.localStorage, CONVERSATION_STORAGE_KEY, storageScope)
      setConversationId(stored && stored.trim() ? stored : null)
    } catch {
      setConversationId(null)
    }
  }, [storageScopeReady, storageScope])

  useEffect(() => {
    if (!storageScopeReady) return
    try {
      if (conversationId) {
        writeScopedStorage(window.localStorage, CONVERSATION_STORAGE_KEY, conversationId, storageScope)
      } else {
        removeScopedStorage(window.localStorage, CONVERSATION_STORAGE_KEY, storageScope)
      }
    } catch {}
  }, [conversationId, storageScopeReady, storageScope])

  // Reload conversation history from Supabase after a page refresh
  useEffect(() => {
    if (!conversationId || messages.length > 0) return
    readConversationMessages(supabase, conversationId).then((rows) => {
      if (rows.length === 0) return
      setMessages(
        rows.map((r) => ({
          id: r.id,
          role: r.role,
          content: r.content,
          created_at: r.created_at,
        })),
      )
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  useEffect(() => {
    if (!storageScopeReady) return
    let cancelled = false

    const hydrateBirthData = async () => {
      try {
        const stored = readScopedStorage(window.localStorage, STORAGE_KEYS.birthData, storageScope)
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<BirthData>
          if (parsed && typeof parsed === 'object') {
            applyBirthDataState(parsed, setBirthData, birthDataRef)
            return
          }
        }
      } catch {}

      if (storageScope) {
        try {
          const response = await fetch('/api/profile/birth', {
            method: 'GET',
            cache: 'no-store',
          })
          const payload = (await safeJson(response)) as { profile?: Record<string, unknown> | null } | null
          const profileBirthData = response.ok ? birthDataFromProfile(payload?.profile ?? null) : null

          if (!cancelled && profileBirthData) {
            applyBirthDataState(profileBirthData, setBirthData, birthDataRef)
            writeScopedStorage(
              window.localStorage,
              STORAGE_KEYS.birthData,
              JSON.stringify(profileBirthData),
              storageScope,
            )
            return
          }
        } catch {}
      }

      if (!cancelled) {
        applyBirthDataState(null, setBirthData, birthDataRef)
      }
    }

    void hydrateBirthData()

    return () => {
      cancelled = true
    }
  }, [storageScopeReady, storageScope])

  useEffect(() => {
    if (!storageScopeReady) return
    try {
      const stored = readScopedStorage(window.localStorage, USER_MEMORY_STORAGE_KEY, storageScope)
      if (!stored) {
        setUserMemory(EMPTY_USER_MEMORY)
        return
      }

      const parsed = JSON.parse(stored) as UserMemory
      setUserMemory(parsed && typeof parsed === 'object' ? parsed : EMPTY_USER_MEMORY)
    } catch {
      setUserMemory(EMPTY_USER_MEMORY)
    }
  }, [storageScopeReady, storageScope])

  useEffect(() => {
    if (!storageScopeReady) return
    try {
      const stored = readScopedStorage(window.localStorage, STORAGE_KEYS.partnerBirthData, storageScope)
      if (!stored) {
        applyBirthDataState(null, setPartnerBirthData, partnerBirthDataRef)
        return
      }

      const parsed = JSON.parse(stored) as Partial<BirthData>
      if (parsed && typeof parsed === 'object') {
        applyBirthDataState(parsed, setPartnerBirthData, partnerBirthDataRef)
        return
      }
    } catch {}

    applyBirthDataState(null, setPartnerBirthData, partnerBirthDataRef)
  }, [storageScopeReady, storageScope])

  useEffect(() => {
    if (!storageScopeReady) return
    setMicroReadings(loadMicroReadings(storageScope))
  }, [storageScopeReady, storageScope])

  useEffect(() => {
    if (!storageScopeReady) return

    const storedCompleted = loadBirthAutoIntroCompleted(storageScope)
    if (storedCompleted) {
      setBirthAutoIntroCompleted(true)
      return
    }

    if (isBirthDataComplete(birthData)) {
      setBirthAutoIntroCompleted(true)
      markBirthAutoIntroCompleted(storageScope)
      return
    }

    setBirthAutoIntroCompleted(false)
  }, [birthData, storageScopeReady, storageScope])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PRACTITIONER_USAGE_KEY)
      if (stored === 'personal' || stored === 'client') {
        setPractitionerUsage(stored)
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      setAnalysisMode(FUSION_ONLY_ANALYSIS_MODE)
      localStorage.setItem(ANALYSIS_MODE_KEY, FUSION_ONLY_ANALYSIS_MODE)
      const storedRender = localStorage.getItem(RENDER_MODE_KEY)
      if (storedRender === 'simple' || storedRender === 'approfondie' || storedRender === 'praticien') {
        setRenderMode(storedRender)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!storageScopeReady) return
    const profile = loadEvolutionProfile(storageScope)
    setEvolutionProfile(profile)
  }, [storageScopeReady, storageScope])

  useEffect(() => {
    if (!storageScopeReady) return
    try {
      const storedReadings = readScopedStorage(window.localStorage, STORAGE_KEYS.readings, storageScope)
      const storedProjects = readScopedStorage(window.localStorage, STORAGE_KEYS.projects, storageScope)

      if (storedReadings) {
        const parsed = JSON.parse(storedReadings)
        if (Array.isArray(parsed)) setReadings(parsed.filter(isValidReading))
      } else {
        setReadings([])
      }

      if (storedProjects) {
        const parsed = JSON.parse(storedProjects)
        if (Array.isArray(parsed)) setProjects(parsed.filter(isValidProject))
      } else {
        setProjects([])
      }
    } catch {
      setReadings([])
      setProjects([])
    }
  }, [storageScopeReady, storageScope])

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
    if (!shouldPersistQuotaLocally(userPlan)) {
      setQuotaMessagesUsed(0)
      setQuotaResetAt(null)
      return
    }

    try {
      const firstMsgRaw = localStorage.getItem(FREE_USAGE_FIRST_MSG_KEY)

      if (firstMsgRaw) {
        const firstMsgTime = new Date(firstMsgRaw).getTime()
        const resetAt = new Date(firstMsgTime + 24 * 60 * 60 * 1000)

        if (Date.now() >= resetAt.getTime()) {
          localStorage.removeItem(FREE_USAGE_FIRST_MSG_KEY)
          localStorage.setItem(FREE_USAGE_STORAGE_KEY, '0')
          setQuotaMessagesUsed(0)
          setQuotaResetAt(null)
        } else {
          const n = parseInt(localStorage.getItem(FREE_USAGE_STORAGE_KEY) ?? '0', 10)
          setQuotaMessagesUsed(Number.isFinite(n) ? n : 0)
          setQuotaResetAt(resetAt)
        }
      } else {
        setQuotaMessagesUsed(0)
        setQuotaResetAt(null)
      }
    } catch {
      setQuotaMessagesUsed(0)
    }
  }, [userPlan])

  useEffect(() => {
    if (!pendingMicroRequestType) {
      return
    }

    // Évite de bloquer l'UI au chargement. Exception: juste après l'envoi
    // du formulaire de naissance, on autorise la séquence micro complète.
    if (isWelcome && !forceMicroBootstrapRef.current) return

    if (microTriggerRef.current === step) return
    microTriggerRef.current = step

    void triggerMicroReading(pendingMicroRequestType)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWelcome, pendingMicroRequestType])

  useEffect(() => {
    if (step === 'conversation_ready') {
      forceMicroBootstrapRef.current = false
      if (autoBirthIntroPending) {
        setAutoBirthIntroPending(false)
        setBirthAutoIntroCompleted(true)
        markBirthAutoIntroCompleted(storageScope)
      }
    }
  }, [autoBirthIntroPending, step, storageScope])

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
      writeScopedStorage(window.localStorage, STORAGE_KEYS.birthData, JSON.stringify(normalized), storageScope)
    } catch {}
  }, [storageScope])

  const handlePartnerBirthDataChange = useCallback((next: BirthData) => {
    const normalized = mergeBirthData(next)
    partnerBirthDataRef.current = normalized
    setPartnerBirthData(normalized)
    try {
      writeScopedStorage(
        window.localStorage,
        STORAGE_KEYS.partnerBirthData,
        JSON.stringify(normalized),
        storageScope,
      )
    } catch {}
  }, [storageScope])

  const appendBirthDataSavedMessage = useCallback((content: string) => {
    setMessages((prev) => {
      const base = prev[0]?.id === 'welcome' ? [] : prev
      return [
        ...base,
        {
          id: `${Date.now()}-birth-saved`,
          role: 'assistant' as const,
          content,
          created_at: new Date().toISOString(),
        },
      ]
    })
  }, [])

  const handleBirthDataSave = useCallback(
    (next: BirthData, partnerNext: BirthData) => {
      const normalized = mergeBirthData(next)
      const normalizedPartner = mergeBirthData(partnerNext)
      handleBirthDataChange(normalized)
      handlePartnerBirthDataChange(normalizedPartner)

      // Persist to Supabase profiles table (fire-and-forget — non-blocking)
      console.log('[BIRTH_FORM] birth data saved to localStorage, syncing to Supabase', {
        firstName: normalized.firstName,
        birthDate: normalized.birthDate,
        birthCity: normalized.birthCity,
        hasLat: !!normalized.birthLat,
        hasLng: !!normalized.birthLng,
      })
      fetch('/api/profile/birth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalized),
      }).catch((err) => {
        console.warn('[BIRTH_FORM] Supabase sync failed (non-critical)', err)
      })

      if (normalized.firstName) {
        setEvolutionProfile((prev) => {
          const updated = { ...(prev ?? {}), firstName: normalized.firstName }
          saveEvolutionProfile(updated, storageScope)
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

      const hasPrimaryBirthData = isBirthDataComplete(normalized)
      const shouldRunInitialAutoReading =
        hasPrimaryBirthData && !birthAutoIntroCompleted && !shouldResumeAfterBirthSave

      if (parts.length && shouldResumeAfterBirthSave) {
        setBirthAutoIntroCompleted(true)
        setAutoBirthIntroPending(false)
        markBirthAutoIntroCompleted(storageScope)
        void sendStructuredAction({
          message: `Mes données de naissance sont maintenant enregistrées (${parts.join(', ')}). Reprends ma demande précédente et fais la lecture demandée : ${pendingReadingRequest}`,
          displayMessage: 'Mes données de naissance sont enregistrées. Reprends ma demande précédente.',
          contextType: activeContextType,
          uiAction: 'restart_flow',
        })
        return
      }

      if (shouldRunInitialAutoReading) {
        setMicroReadings(resetMicroReadings(storageScope))
        microTriggerRef.current = null
        forceMicroBootstrapRef.current = true
        setAutoBirthIntroPending(true)
        return
      }

      if (parts.length || partnerParts.length) {
        forceMicroBootstrapRef.current = false
        setAutoBirthIntroPending(false)
      appendBirthDataSavedMessage(
          partnerParts.length > 0
            ? 'Les données de naissance sont enregistrées. HexAstra pourra les utiliser pour tes prochaines lectures, pour toi comme pour un proche.'
            : 'Tes données de naissance sont enregistrées. HexAstra pourra les utiliser pour tes prochaines lectures.'
        )
      }
    },
    [
      activeContextType,
      appendBirthDataSavedMessage,
      birthAutoIntroCompleted,
      handleBirthDataChange,
      handlePartnerBirthDataChange,
      pendingReadingRequest,
      sendStructuredAction,
      shouldResumeAfterBirthSave,
      storageScope,
    ]
  )

  const handlePractitionerUsageSelect = useCallback((usage: PractitionerUsage) => {
    setPractitionerUsage(usage)
    try {
      localStorage.setItem(PRACTITIONER_USAGE_KEY, usage ?? '')
    } catch {}
  }, [])

  const handleRenderModeSelect = useCallback((mode: RenderMode) => {
    setRenderMode(mode)
    try {
      localStorage.setItem(RENDER_MODE_KEY, mode)
    } catch {}
  }, [])

  const persistReadings = useCallback((next: Reading[]) => {
    setReadings(next)
    writeScopedStorage(window.localStorage, STORAGE_KEYS.readings, JSON.stringify(next), storageScope)
  }, [storageScope])

  const persistProjects = useCallback((next: Project[]) => {
    setProjects(next)
    writeScopedStorage(window.localStorage, STORAGE_KEYS.projects, JSON.stringify(next), storageScope)
  }, [storageScope])

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
        fullContent: lastAssistant.content,
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
      analysisMode,
      renderMode,
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

        if (requestType === 'micro_profile') next = markProfileDone(prev, birthData, storageScope)
        else if (requestType === 'micro_year') next = markYearDone(prev, storageScope)
        else next = markMonthDone(prev, storageScope)

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
      const attachNote = attachedFile ? `\n\n[Pièce jointe : ${attachedFile.name}]` : ''
      const currentBirthData = birthDataRef.current
      const currentPartnerBirthData = partnerBirthDataRef.current
      const content = baseContent + attachNote
      const requestContent = buildStoredBirthDataRequest(baseContent, currentBirthData) + attachNote

      if (!content.trim() || isTyping) return
      if (isDuplicateMessage(lastMessageRef, content)) return
      if (chatStep !== 'conversation_ready') return
      if (isMicroBootstrapPending) return

      const localDecision = resolveClientSendPolicy({
        message: baseContent,
        plan: userPlan,
        usedMessages: quotaMessagesUsed,
        menuItems,
        selectedMenuKey,
        selectedSubmenuKey,
        activeClarificationQuestion,
        activeContextFrame,
      })

      const nextUserMessageCount = userMessages.length + 1
      if (nextUserMessageCount === 1 && !funnelTrackingRef.current.firstMessageSent) {
        funnelTrackingRef.current.firstMessageSent = true
        trackHexastraFunnel('chat_first_message_sent', {
          plan: userPlan,
          source: entrySource,
        })
      } else if (nextUserMessageCount === 2 && !funnelTrackingRef.current.secondMessageSent) {
        funnelTrackingRef.current.secondMessageSent = true
        trackHexastraFunnel('chat_second_message_sent', {
          plan: userPlan,
          source: entrySource,
        })
      }

      const _depthLevel = detectUserDepthLevel(baseContent, messages, userPlan)
      const memorySignals = detectMemorySignals(baseContent)
      setUserMemory((prev) => {
        const next = updateUserMemory(prev, memorySignals)
        try {
          writeScopedStorage(window.localStorage, USER_MEMORY_STORAGE_KEY, JSON.stringify(next), storageScope)
        } catch {}
        return next
      })

      if (localDecision.kind === 'open_menu') {
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

      if (localDecision.kind === 'open_parent') {
        const baseMessages = isWelcome ? [] : messages
        const userMsg: Msg = {
          id: `${Date.now()}-user`,
          role: 'user',
          content,
          created_at: new Date().toISOString(),
        }
        const selectionContext = resolveSelectionContext(localDecision.selection)

        setMessages([...baseMessages, userMsg])
        setInput('')
        setAttachedFile(null)
        setActiveContextType(selectionContext.contextType)
        setSelectedMenuKey(selectionContext.menuKey)
        setSelectedSubmenuKey(selectionContext.submenuKey)
        setOpenMenuParentKey(localDecision.selection.item.key)
        setIsMenuDockOpen(true)
        return
      }

      if (localDecision.kind === 'select_context') {
        const selectionContext = resolveSelectionContext(localDecision.selection)
        setInput('')
        setAttachedFile(null)
        setActiveContextType(selectionContext.contextType)
        setSelectedMenuKey(selectionContext.menuKey)
        setSelectedSubmenuKey(selectionContext.submenuKey)
        setOpenMenuParentKey(selectionContext.openParentKey)
        setIsMenuDockOpen(false)

        await sendStructuredAction({
          message: buildMenuSelectionRequest(localDecision.selection.item, localDecision.selection.parent),
          displayMessage: content,
          contextType: selectionContext.contextType,
          menuKey: selectionContext.menuKey,
          submenuKey: selectionContext.submenuKey,
          uiAction: localDecision.selection.parent ? 'select_submenu_item' : 'select_menu_item',
        })
        return
      }

      if (localDecision.kind === 'local_reply') {
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
            id: `${Date.now()}-local-guard`,
            role: 'assistant',
            content: localDecision.reply,
            created_at: new Date().toISOString(),
          },
        ])

        if (localDecision.premiumLock) {
          setPremiumLock(localDecision.premiumLock)
          if (!funnelTrackingRef.current.limitReached) {
            funnelTrackingRef.current.limitReached = true
            trackHexastraFunnel('chat_limit_reached', {
              plan: userPlan,
              source: entrySource,
              usedMessages: quotaMessagesUsed,
              via: 'client',
            })
          }
        }

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
        analysisMode,
        renderMode,
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
      entrySource,
      quotaMessagesUsed,
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
      activeClarificationQuestion,
      activeContextFrame,
      storageScope,
      userMessages,
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
    funnelTrackingRef.current = {
      firstMessageSent: false,
      secondMessageSent: false,
      limitReached: false,
    }
    try {
      removeScopedStorage(window.localStorage, CONVERSATION_STORAGE_KEY, storageScope)
    } catch {}
  }, [chatLanguage, storageScope])

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
        content: reading.fullContent ?? reading.preview,
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

  const bootstrapOverlay =
    bootstrapUi.overlayKind === 'practitioner_usage' ? (
      <div className="hx-bootstrap-overlay">
        <PractitionerUsageStep onSelect={handlePractitionerUsageSelect} />
      </div>
    ) : step === 'render_mode_selection' ? (
      <div className="hx-bootstrap-overlay">
        <RenderModeStep onSelect={handleRenderModeSelect} />
      </div>
    ) : null

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
    disabled: !bootstrapUi.chatReady || isMicroBootstrapPending || isLimitReached || isTyping,
    // Suggestions contextuelles dynamiques
    suggestions: bootstrapUi.chatReady && !isLimitReached ? contextualSuggestions : [],
    onSuggestionSelect: (v: string) => void handleSend(v),
    showFusionEntry: bootstrapUi.chatReady && !isLimitReached,
    onFusionEntry: (prompt: string) => void handleSend(prompt),
  }

  return (
    <div className="hx-chat-page">
      <PremiumBackground />

      {paymentSuccess && (
        <div className="hx-payment-success-banner" role="status">
          <span>*</span>
          <span>Paiement confirmé, votre abonnement est activé.</span>
          <button type="button" onClick={() => setPaymentSuccess(false)} aria-label="Fermer">
            ×
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
                        trackHexastraFunnel('chat_upgrade_clicked', {
                          location: 'premium_lock',
                          plan: userPlan,
                          source: entrySource,
                          targetPlan: premiumLock.targetPlan,
                        })
                        window.location.href = getPlanHref(
                          premiumLock.targetPlan as 'essential' | 'premium' | 'practitioner',
                        )
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
                  title="Explorer votre situation"
                  subtitle="Choisis le cadre le plus utile pour lancer ton analyse Hexastra."
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
              {/* Memory hint — affiché subtilement quand un pattern récurrent est détecté */}
              {activeInsight && activeInsight.confidence >= 0.55 && bootstrapUi.chatReady && !isLimitReached && (
                <MemoryHint
                  hint={activeInsight.memoryHint}
                  suggestionPrompt={activeInsight.suggestionPrompt}
                  onPrompt={(v) => void handleSend(v)}
                />
              )}

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
                  <PaywallBanner plan={userPlan} resetAt={quotaResetAt} />
                ) : (
                  <Composer {...composerProps} />
                ))}

              {shouldShowReturnNote && !bootstrapOverlay && (
                <p className="hx-app-return-note">{returnNote}</p>
              )}

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
