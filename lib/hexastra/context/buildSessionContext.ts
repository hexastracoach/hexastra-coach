import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ContextType,
  DomainRoute,
  EmotionalState,
  PrecisionLevel,
  SessionStateRecord,
  TimingIntensity,
} from '@/lib/hexastra/types'
import { readSessionState } from '@/lib/hexastra/memory/sessionMemory'
import { detectDominantPotential } from '@/lib/hexastra/detection/detectDominantPotential'
import { detectLifePhase } from '@/lib/hexastra/detection/detectLifePhase'
import { detectReadingLevel } from '@/lib/hexastra/detection/detectReadingLevel'
import { detectTimingIntensity } from '@/lib/hexastra/detection/detectTimingIntensity'
import { detectEmotionalState } from '@/lib/hexastra/detection/detectEmotionalState'
import { detectPrecision } from '@/lib/hexastra/session/sessionBrain'
import { findMenuItem, getMenuForMode } from '@/lib/hexastra/menus/getMenuForMode'

export type HexastraSessionContext = {
  state: SessionStateRecord | null
  currentTheme: string | null
  contextType: ContextType
  selectedMenuKey: string | null
  selectedSubmenuKey: string | null
  readingLevel: string
  timing: TimingIntensity
  emotionalState: EmotionalState
  precision: PrecisionLevel
  dominantPotential: string
  lifePhase: string
  domainRoute: DomainRoute
  activeModule: string | null
}

function inferDomainRoute(message: string, contextType: ContextType): DomainRoute {
  const t = message.toLowerCase()

  if (/(fatigue|surcharge|stress|recharge|energie|etat du jour|état du jour|neurokua)/i.test(t)) {
    return 'neurokua'
  }

  if (/\b(kua|feng|direction|orientation|boussole)\b|equilibre energetique|équilibre énergétique/i.test(t)) {
    return 'gps_kua'
  }

  if (/(fusion|lecture generale|lecture complete|lecture complète|hexastra complete|hexastra complète)/i.test(t)) {
    return 'fusion'
  }

  if (contextType === 'career') return 'career'
  if (contextType === 'relationship') return 'relationship'
  if (contextType === 'decision') return 'decision'
  if (contextType === 'timing') return 'timing'
  if (contextType === 'wellbeing' || contextType === 'energy') return 'neurokua'
  if (contextType === 'science') return 'science'
  if (contextType === 'hexastraReading') return 'fusion'
  return 'general'
}

export async function buildSessionContext({
  supabase,
  conversationId,
  message,
  contextType,
  selectedMenuKey,
  selectedSubmenuKey,
  practitioner,
}: {
  supabase: SupabaseClient | null
  conversationId: string | null
  message: string
  contextType?: ContextType
  selectedMenuKey?: string | null
  selectedSubmenuKey?: string | null
  practitioner?: boolean
}): Promise<HexastraSessionContext> {
  const state = await readSessionState(supabase, conversationId)
  const resolvedContext = contextType ?? state?.current_context_type ?? 'general'
  const theme = state?.current_theme ?? (resolvedContext === 'general' ? null : resolvedContext)
  const mode = practitioner ? 'praticien' : 'libre'
  const selected = findMenuItem(getMenuForMode(mode), selectedSubmenuKey ?? selectedMenuKey ?? null)
  const domainRoute =
    selected?.domainRoute ?? state?.current_domain_route ?? inferDomainRoute(message, resolvedContext)
  const activeModule =
    domainRoute === 'gps_kua'
      ? 'KS.HexAstra.GPS.V1'
      : domainRoute === 'neurokua'
        ? 'KS.NeuroKua.System.V1'
        : domainRoute === 'fusion'
          ? 'KS.FUSION.V13'
          : null

  return {
    state,
    currentTheme: theme,
    contextType: resolvedContext,
    selectedMenuKey: selectedMenuKey ?? state?.last_selected_menu_key ?? null,
    selectedSubmenuKey: selectedSubmenuKey ?? state?.last_selected_submenu_key ?? null,
    readingLevel: detectReadingLevel(message, practitioner),
    timing: detectTimingIntensity(message) as TimingIntensity,
    emotionalState: detectEmotionalState(message),
    precision: detectPrecision(message),
    dominantPotential: detectDominantPotential(message),
    lifePhase: detectLifePhase(message),
    domainRoute,
    activeModule,
  }
}
