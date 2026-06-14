import type { Mode } from '@/app/chat/_lib/chat'
import type {
  PlanKey,
  AnalysisDepth,
  PlanCapabilities,
  PlanUiData,
  PlanApiContext,
} from '@/types/subscription'
import { getPlanContract, getPlanQuotaLimit, PLAN_CONTRACTS } from '@/lib/hexastra/orchestration/planContracts'

export type { PlanKey, AnalysisDepth, PlanCapabilities, PlanUiData, PlanApiContext }

// ─── Capabilities par plan ─────────────────────────────────────────────────

function toAnalysisDepth(plan: PlanKey): AnalysisDepth {
  const contract = getPlanContract(plan)
  if (contract.responseDepth === 'expert') return 'expert'
  if (contract.responseDepth === 'medium') return 'medium'
  if (contract.responseDepth === 'short') return 'low'
  return 'high'
}

function getAvailableModesFromContract(plan: PlanKey): Mode[] {
  const contract = getPlanContract(plan)
  if (contract.features.practitionerStructure) {
    return ['essentiel', 'premium', 'praticien']
  }
  if (contract.mode === 'libre_approfondi') {
    return ['essentiel', 'premium']
  }
  return ['essentiel']
}

export const PLAN_CAPABILITIES: Record<PlanKey, PlanCapabilities> = {
  free: {
    canUseChat: true,
    maxMessagesPerDay: PLAN_CONTRACTS.free.quotaLimit,
    analysisDepth: toAnalysisDepth('free'),
    availableModes: getAvailableModesFromContract('free'),
    canUsePractitionerMode: PLAN_CONTRACTS.free.features.practitionerStructure,
    canAnalyzeForClients: PLAN_CONTRACTS.free.features.clientUsage,
    canGetLongResponses: PLAN_CONTRACTS.free.maxOutputLength !== 'short',
    canAccessDeepAnalysis: PLAN_CONTRACTS.free.features.deepAnalysis,
    canAccessProfessionalFormat:
      PLAN_CONTRACTS.free.features.practitionerStructure && PLAN_CONTRACTS.free.features.clientUsage,
  },
  essential: {
    canUseChat: true,
    maxMessagesPerDay: PLAN_CONTRACTS.essential.quotaLimit,
    analysisDepth: toAnalysisDepth('essential'),
    availableModes: getAvailableModesFromContract('essential'),
    canUsePractitionerMode: PLAN_CONTRACTS.essential.features.practitionerStructure,
    canAnalyzeForClients: PLAN_CONTRACTS.essential.features.clientUsage,
    canGetLongResponses: PLAN_CONTRACTS.essential.maxOutputLength !== 'short',
    canAccessDeepAnalysis: PLAN_CONTRACTS.essential.features.deepAnalysis,
    canAccessProfessionalFormat:
      PLAN_CONTRACTS.essential.features.practitionerStructure && PLAN_CONTRACTS.essential.features.clientUsage,
  },
  premium: {
    canUseChat: true,
    maxMessagesPerDay: PLAN_CONTRACTS.premium.quotaLimit,
    analysisDepth: toAnalysisDepth('premium'),
    availableModes: getAvailableModesFromContract('premium'),
    canUsePractitionerMode: PLAN_CONTRACTS.premium.features.practitionerStructure,
    canAnalyzeForClients: PLAN_CONTRACTS.premium.features.clientUsage,
    canGetLongResponses: PLAN_CONTRACTS.premium.maxOutputLength !== 'short',
    canAccessDeepAnalysis: PLAN_CONTRACTS.premium.features.deepAnalysis,
    canAccessProfessionalFormat:
      PLAN_CONTRACTS.premium.features.practitionerStructure && PLAN_CONTRACTS.premium.features.clientUsage,
  },
  practitioner: {
    canUseChat: true,
    maxMessagesPerDay: PLAN_CONTRACTS.practitioner.quotaLimit,
    analysisDepth: toAnalysisDepth('practitioner'),
    availableModes: getAvailableModesFromContract('practitioner'),
    canUsePractitionerMode: PLAN_CONTRACTS.practitioner.features.practitionerStructure,
    canAnalyzeForClients: PLAN_CONTRACTS.practitioner.features.clientUsage,
    canGetLongResponses: PLAN_CONTRACTS.practitioner.maxOutputLength !== 'short',
    canAccessDeepAnalysis: PLAN_CONTRACTS.practitioner.features.deepAnalysis,
    canAccessProfessionalFormat:
      PLAN_CONTRACTS.practitioner.features.practitionerStructure &&
      PLAN_CONTRACTS.practitioner.features.clientUsage,
  },
}

// ─── Données UI (source unique pour homepage + pricing pages) ──────────────

export const PLANS_UI: PlanUiData[] = [
  {
    key: 'free',
    label: 'Gratuit',
    price: '0 EUR',
    period: '/mois',
    desc: 'Decouvrez si Hexastra peut reellement vous aider.',
    features: [
      'Acces decouverte immediat',
      "Acces au coeur de l'experience",
      'Messages limites par jour',
      'Sans engagement',
    ],
    cta: 'Commencer gratuitement',
    href: '/chat',
  },
  {
    key: 'essential',
    label: 'Essentiel',
    price: '9,90 EUR',
    period: '/mois',
    desc: 'Pour poser vos questions du quotidien et obtenir une clarte rapide.',
    features: [
      'Usage illimite',
      'Reponses concises et fluides',
      'Aucune coupure dans vos echanges',
      'Ideal pour un usage regulier',
    ],
    cta: 'Choisir Essentiel',
    href: '/pricing/essentiel',
  },
  {
    key: 'premium',
    label: 'Premium',
    price: '19,90 EUR',
    period: '/mois',
    desc: 'Ideal quand une decision compte vraiment.',
    features: [
      'Analyses plus profondes',
      'Guidance plus precise',
      'Meilleur soutien aux decisions importantes',
      'Le meilleur equilibre entre clarte et profondeur',
    ],
    cta: 'Choisir Premium',
    href: '/pricing/premium',
    badge: 'Recommande',
    highlighted: true,
  },
  {
    key: 'practitioner',
    label: 'Praticien',
    price: '29,90 EUR',
    period: '/mois',
    desc: 'Pour un usage avance, plus profond et plus structure.',
    features: [
      'Usage avance',
      'Cadre plus expert',
      'Preparation aux futures fonctions pro',
      'Pense pour les praticiens et power users',
    ],
    cta: 'Choisir Praticien',
    href: '/pricing/praticien',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────

export function getPlanCapabilities(plan: PlanKey): PlanCapabilities {
  return PLAN_CAPABILITIES[plan]
}

export function canUseChatMode(plan: PlanKey, mode: Mode): boolean {
  return PLAN_CAPABILITIES[plan].availableModes.includes(mode)
}

export function canContinueChat(plan: PlanKey, usedMessages: number): boolean {
  const max = getPlanQuotaLimit(plan)
  if (max === null) return true
  return usedMessages < max
}

export function getAnalysisDepth(plan: PlanKey): AnalysisDepth {
  return PLAN_CAPABILITIES[plan].analysisDepth
}

export function getAvailableModes(plan: PlanKey): Mode[] {
  return PLAN_CAPABILITIES[plan].availableModes
}

export function isFreePlan(plan: PlanKey): boolean {
  return plan === 'free'
}

export function isPractitioner(plan: PlanKey): boolean {
  return plan === 'practitioner'
}

export function isQuotaLimitedPlan(plan: PlanKey): boolean {
  return getPlanQuotaLimit(plan) !== null
}

export function shouldPersistQuotaLocally(plan: PlanKey): boolean {
  return plan === 'free'
}

export function getPlanHref(plan: PlanKey): string {
  switch (plan) {
    case 'essential':
      return '/pricing/essentiel'
    case 'premium':
      return '/pricing/premium'
    case 'practitioner':
      return '/pricing/praticien'
    default:
      return '/pricing'
  }
}

export function getPlanCheckoutHref(plan: PlanKey): string {
  const href = getPlanHref(plan)
  return `${href}${href.includes('?') ? '&' : '?'}checkout=1`
}

export function getPlanCheckoutAuthHref(plan: PlanKey): string {
  const next = encodeURIComponent(getPlanCheckoutHref(plan))
  return `/auth?plan=${plan}&next=${next}`
}

/** Retourne le plan immédiatement supérieur pour les CTA d'upgrade */
export function getUpgradeTarget(plan: PlanKey): {
  plan: PlanKey
  label: string
  labelKey: string
  href: string
} {
  if (plan === 'free') {
    return {
      plan: 'essential',
      label: 'Essentiel',
      labelKey: 'pricing.essentialLabel',
      href: getPlanHref('essential'),
    }
  }
  if (plan === 'essential') {
    return {
      plan: 'premium',
      label: 'Premium',
      labelKey: 'pricing.premiumLabel',
      href: getPlanHref('premium'),
    }
  }
  return {
    plan: 'practitioner',
    label: 'Praticien',
    labelKey: 'pricing.practitionerLabel',
    href: getPlanHref('practitioner'),
  }
}

/** Retourne le label lisible d'un plan */
export function getPlanLabel(plan: PlanKey): string {
  return PLANS_UI.find((p) => p.key === plan)?.label ?? plan
}

/** Label affiché quand un mode est bloqué */
export function getModeUnlockLabel(mode: Mode): string {
  if (mode === 'premium') return 'Disponible avec le plan Premium'
  if (mode === 'praticien') return 'Disponible avec le plan Praticien'
  return 'Plan sup\u00e9rieur requis'
}

/** Construit le contexte plan inject\u00e9 dans l'API chat */
export function buildPlanApiContext(plan: PlanKey): PlanApiContext {
  const contract = getPlanContract(plan)
  return {
    plan,
    analysisDepth: toAnalysisDepth(plan),
    practitionerEnabled: contract.features.practitionerStructure,
    longResponseAllowed: contract.maxOutputLength !== 'short',
    professionalUseAllowed: contract.features.clientUsage,
  }
}

// ─── localStorage keys pour le suivi free ─────────────────────────────────

export const FREE_USAGE_STORAGE_KEY = 'hexastra.free.usage'
/** @deprecated replaced by FREE_USAGE_FIRST_MSG_KEY */
export const FREE_USAGE_DATE_KEY = 'hexastra.free.date'
/** ISO timestamp du premier message envoyé dans la fenêtre de 24h en cours */
export const FREE_USAGE_FIRST_MSG_KEY = 'hexastra.free.firstmsg'

/** Réinitialise complètement le compteur free dans localStorage */
export function resetFreeUsage(): void {
  try {
    localStorage.removeItem(FREE_USAGE_STORAGE_KEY)
    localStorage.removeItem(FREE_USAGE_DATE_KEY)
    localStorage.removeItem(FREE_USAGE_FIRST_MSG_KEY)
  } catch { /* noop */ }
}

/** Retourne le timestamp de reset (firstMsg + 24h), ou null si pas de fenêtre active */
export function getFreeResetAt(): Date | null {
  try {
    const raw = localStorage.getItem(FREE_USAGE_FIRST_MSG_KEY)
    if (!raw) return null
    const t = new Date(raw).getTime()
    if (Number.isNaN(t)) return null
    return new Date(t + 24 * 60 * 60 * 1000)
  } catch { return null }
}

