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
    price: '0\u20ac',
    period: '/mois',
    desc: 'Pour entrer dans HexAstra sans engagement. Gratuit, direct, sans carte.',
    features: [
      'Lectures complètes avec quota quotidien',
      "Accès au cœur de l'expérience HexAstra",
      'Toutes les approches disponibles',
      'Sans carte bancaire requise',
    ],
    cta: "Commencer — c'est gratuit",
    href: '/chat',
  },
  {
    key: 'essential',
    label: 'Essentiel',
    price: '4,90\u20ac',
    period: '/mois',
    desc: 'Pour un usage régulier — sans compter tes lectures.',
    features: [
      'Usage non limité',
      'Lectures complètes sans quota',
      'Clarté approfondie sur les sujets importants',
      'Idéal pour un usage quotidien',
    ],
    cta: 'Commencer avec Essentiel',
    href: '/pricing/essentiel',
  },
  {
    key: 'premium',
    label: 'Premium',
    price: '9,90\u20ac',
    period: '/mois',
    desc: 'Pour explorer en profondeur, sans aucune restriction.',
    features: [
      'Mode libre complet',
      'Sans limitation de rythme ni de thèmes',
      'Relations, périodes, blocages, décisions',
      'Accès à toutes les lectures spécialisées',
    ],
    cta: 'Accéder au plan Premium',
    href: '/pricing/premium',
    badge: 'Le plus complet',
    highlighted: true,
  },
  {
    key: 'practitioner',
    label: 'Praticien',
    price: '24,90\u20ac',
    period: '/mois',
    desc: "Pour aller plus loin — ou accompagner d'autres personnes.",
    features: [
      'Mode Praticien avec vocabulaire avancé',
      'Lectures pour soi ou pour un client',
      'Analyse croisée de deux profils',
      'Pensé pour les profils experts ou accompagnants',
    ],
    cta: 'Ouvrir le mode Praticien',
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

/** Retourne le plan immédiatement supérieur pour les CTA d'upgrade */
export function getUpgradeTarget(plan: PlanKey): { label: string; labelKey: string; href: string } {
  if (plan === 'free') {
    return { label: 'Essentiel', labelKey: 'pricing.essentialLabel', href: getPlanHref('essential') }
  }
  if (plan === 'essential') {
    return { label: 'Premium', labelKey: 'pricing.premiumLabel', href: getPlanHref('premium') }
  }
  return { label: 'Praticien', labelKey: 'pricing.practitionerLabel', href: getPlanHref('practitioner') }
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
