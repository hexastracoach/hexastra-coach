import type { Mode } from '@/app/chat/_lib/chat'
import type {
  PlanKey,
  AnalysisDepth,
  PlanCapabilities,
  PlanUiData,
  PlanApiContext,
} from '@/types/subscription'

export type { PlanKey, AnalysisDepth, PlanCapabilities, PlanUiData, PlanApiContext }

// ─── Capabilities par plan ─────────────────────────────────────────────────

export const PLAN_CAPABILITIES: Record<PlanKey, PlanCapabilities> = {
  free: {
    canUseChat: true,
    maxMessagesPerDay: 9999,
    analysisDepth: 'high',
    availableModes: ['essentiel'],
    canUsePractitionerMode: false,
    canAnalyzeForClients: false,
    canGetLongResponses: true,
    canAccessDeepAnalysis: false,
    canAccessProfessionalFormat: false,
  },
  essential: {
    canUseChat: true,
    maxMessagesPerDay: null,
    analysisDepth: 'high',
    availableModes: ['essentiel'],
    canUsePractitionerMode: false,
    canAnalyzeForClients: false,
    canGetLongResponses: true,
    canAccessDeepAnalysis: false,
    canAccessProfessionalFormat: false,
  },
  premium: {
    canUseChat: true,
    maxMessagesPerDay: null,
    analysisDepth: 'high',
    availableModes: ['essentiel', 'premium'],
    canUsePractitionerMode: false,
    canAnalyzeForClients: false,
    canGetLongResponses: true,
    canAccessDeepAnalysis: true,
    canAccessProfessionalFormat: false,
  },
  practitioner: {
    canUseChat: true,
    maxMessagesPerDay: null,
    analysisDepth: 'expert',
    availableModes: ['essentiel', 'premium', 'praticien'],
    canUsePractitionerMode: true,
    canAnalyzeForClients: true,
    canGetLongResponses: true,
    canAccessDeepAnalysis: true,
    canAccessProfessionalFormat: true,
  },
}

// ─── Données UI (source unique pour homepage + pricing pages) ──────────────

export const PLANS_UI: PlanUiData[] = [
  {
    key: 'free',
    label: 'Gratuit',
    price: '0\u20ac',
    period: '/mois',
    desc: 'Une premi\u00e8re porte d\u2019entr\u00e9e pour d\u00e9couvrir HexAstra.',
    features: [
      'Acc\u00e8s limit\u00e9 comme un assistant de clart\u00e9',
      'D\u00e9couverte de l\u2019exp\u00e9rience',
      'Lectures compl\u00e8tes avec quota quotidien',
      'Acc\u00e8s au coeur de l\u2019exp\u00e9rience HexAstra',
    ],
    cta: 'Commencer gratuitement',
    href: '/chat',
  },
  {
    key: 'essential',
    label: 'Essentiel',
    price: '4,90\u20ac',
    period: '/mois',
    desc: 'Le mode quotidien pour aller vite et voir clair.',
    features: [
      'Usage non limit\u00e9',
      'Lectures compl\u00e8tes',
      'Clart\u00e9 approfondie sur les sujets importants',
      'Id\u00e9al pour un usage r\u00e9gulier',
    ],
    cta: 'Choisir Essentiel',
    href: '/pricing/essentiel',
  },
  {
    key: 'premium',
    label: 'Premium',
    price: '9,90\u20ac',
    period: '/mois',
    desc: 'L\u2019exp\u00e9rience compl\u00e8te pour explorer en profondeur.',
    features: [
      'Mode libre complet',
      'Sans limitation',
      'Lectures compl\u00e8tes sans restriction de rythme',
      'Relations, p\u00e9riodes, blocages, d\u00e9cisions',
    ],
    cta: 'Passer en Premium',
    href: '/pricing/premium',
    badge: 'Le plus populaire',
    highlighted: true,
  },
  {
    key: 'practitioner',
    label: 'Praticien',
    price: '24,90\u20ac',
    period: '/mois',
    desc: 'Le niveau professionnel pour aller plus loin ou accompagner.',
    features: [
      'Mode praticien',
      'Analyses avanc\u00e9es',
      'Usage orient\u00e9 accompagnement',
      'Pens\u00e9 pour les profils experts',
    ],
    cta: 'Acc\u00e9der au mode Praticien',
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
  const max = PLAN_CAPABILITIES[plan].maxMessagesPerDay
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

/** Retourne le plan immédiatement supérieur pour les CTA d'upgrade */
export function getUpgradeTarget(plan: PlanKey): { label: string; labelKey: string; href: string } {
  if (plan === 'free') return { label: 'Essentiel', labelKey: 'pricing.essentialLabel', href: '/pricing/essentiel' }
  if (plan === 'essential') return { label: 'Premium', labelKey: 'pricing.premiumLabel', href: '/pricing/premium' }
  return { label: 'Praticien', labelKey: 'pricing.practitionerLabel', href: '/pricing/praticien' }
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
  const caps = PLAN_CAPABILITIES[plan]
  return {
    plan,
    analysisDepth: caps.analysisDepth,
    practitionerEnabled: caps.canUsePractitionerMode,
    longResponseAllowed: caps.canGetLongResponses,
    professionalUseAllowed: caps.canAnalyzeForClients,
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
