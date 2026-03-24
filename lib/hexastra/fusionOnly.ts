import type { HexastraMenuItem, HexastraMode } from '@/lib/hexastra/types'
import type { PlanKey } from '@/types/subscription'

export const FUSION_ONLY_ANALYSIS_MODE = 'hexastra_fusion' as const
export const FUSION_ONLY_ENTRY_LABEL = 'Explorer votre situation'
export const FUSION_ONLY_ANALYSIS_LABEL = 'Analyse Hexastra'
export const SCIENCE_BREAKDOWN_FALLBACK_MESSAGE =
  'Hexastra integre plusieurs systemes pour te donner une reponse claire et directe.'

const FUSION_PUBLIC_MENU: HexastraMenuItem[] = [
  {
    key: 'hexastra_entry',
    label: FUSION_ONLY_ENTRY_LABEL,
    description: 'Choisis le cadre le plus utile pour lancer une lecture unifiee.',
    contextType: 'hexastraReading',
    domainRoute: 'fusion',
    promptHint:
      'Lancer une lecture Hexastra unifiee, centree sur la situation, les leviers et la direction la plus utile.',
    submenu: [
      {
        key: 'hexastra_analysis',
        label: FUSION_ONLY_ANALYSIS_LABEL,
        description: 'Lecture globale, claire et directe de ce que tu traverses.',
        contextType: 'hexastraReading',
        domainRoute: 'fusion',
        promptHint:
          'Produire une lecture Hexastra complete, unifiee et exploitable de la situation actuelle.',
      },
      {
        key: 'hexastra_decision',
        label: 'Decision a prendre',
        description: 'Comparer les options, le timing et le bon axe d action.',
        contextType: 'decision',
        domainRoute: 'decision',
        promptHint:
          'Croiser les signaux utiles pour eclairer une decision avec clarte, priorite et timing.',
      },
      {
        key: 'hexastra_relationship',
        label: 'Amour / Relations',
        description: 'Clarifier une dynamique relationnelle, un lien ou une tension.',
        contextType: 'relationship',
        domainRoute: 'relationship',
        promptHint:
          'Lire la dynamique relationnelle en cours, les tensions, appuis et ajustements prioritaires.',
      },
      {
        key: 'hexastra_career',
        label: 'Travail / Argent',
        description: 'Voir ce qui se joue dans la vie pro, la stabilite et les choix concrets.',
        contextType: 'career',
        domainRoute: 'career',
        promptHint:
          'Produire une lecture Hexastra appliquee au travail, a l argent et a la prochaine marche utile.',
      },
      {
        key: 'hexastra_wellbeing',
        label: 'Etat interieur',
        description: 'Comprendre la fatigue, la pression, le blocage ou le besoin de recentrage.',
        contextType: 'wellbeing',
        domainRoute: 'wellbeing',
        promptHint:
          'Lire les dynamiques interieures, la regulation utile et le levier de stabilisation maintenant.',
      },
      {
        key: 'hexastra_timing',
        label: 'Vision des prochains mois',
        description: 'Identifier la phase active, les points de vigilance et le bon tempo.',
        contextType: 'timing',
        domainRoute: 'timing',
        promptHint:
          'Croiser les signaux de cycle, de phase et de timing pour orienter les prochains mois.',
      },
    ],
  },
]

function cloneMenuItem(item: HexastraMenuItem): HexastraMenuItem {
  return {
    ...item,
    submenu: item.submenu?.map(cloneMenuItem),
  }
}

export function getFusionOnlyMenu(_mode: HexastraMode): HexastraMenuItem[] {
  return FUSION_PUBLIC_MENU.map(cloneMenuItem)
}

export function normalizeFusionOnlyAnalysisMode(
  _mode?: 'science_by_science' | 'hexastra_fusion' | null,
) {
  return FUSION_ONLY_ANALYSIS_MODE
}

export function canAccessScienceBreakdown(plan: PlanKey): boolean {
  return plan === 'practitioner'
}

export function isScienceMenuKey(key?: string | null): boolean {
  if (!key) return false

  return (
    key === 'science' ||
    key.startsWith('science_') ||
    key.startsWith('astro_') ||
    key.startsWith('hd_') ||
    key.startsWith('num_') ||
    key.startsWith('enn_') ||
    key.startsWith('kua_')
  )
}

export function sanitizeFusionOnlySelectionKey(key?: string | null): string | null {
  return isScienceMenuKey(key) ? null : (key ?? null)
}

export function isScienceBreakdownRequest(message?: string | null): boolean {
  const text = (message || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!text) return false

  if (
    /\b(analyse par science|analyse par sciences|retour aux sciences|science by science|show my astrology)\b/.test(
      text,
    )
  ) {
    return true
  }

  return /\b(mon|ma|mes|show|montre|voir|ouvre|affiche|donne|parle moi de|lecture|analyse)\b.{0,32}\b(astrologie|astrolex|human design|design humain|numerologie|enneagramme|enneagram|kua)\b/.test(
    text,
  )
}
