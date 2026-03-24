import type { HexastraMenuItem, HexastraMode } from '@/lib/hexastra/types'
import type { PlanKey } from '@/types/subscription'

export const FUSION_ONLY_ANALYSIS_MODE = 'hexastra_fusion' as const
export const FUSION_ONLY_ENTRY_LABEL = 'Explorer votre situation'
export const FUSION_ONLY_ANALYSIS_LABEL = 'Analyse Hexastra'
export const SCIENCE_BREAKDOWN_FALLBACK_MESSAGE =
  'Je peux te donner une réponse directe si tu me parles de ta situation.'

export type PublicScience =
  | 'astrology'
  | 'human_design'
  | 'numerology'
  | 'enneagram'
  | 'kua'

export type ExplicitScienceIntent = {
  science: PublicScience
  label: string
  selectionKey: string
}

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

const SCIENCE_REQUEST_SELF_PATTERN =
  /\b(mon|ma|mes|moi|pour moi|sur moi|my|me|mine|for me|about me)\b/
const SCIENCE_REQUEST_VERB_PATTERN =
  /\b(je veux|j aimerais|je voudrais|montre|show|donne|give|lecture|reading|analyse|analysis|understand|comprendre|explique|explain|voir|regarde|look at|decode|decoder|theme natal|theme astral|birth chart|natal chart)\b/
const SCIENCE_FUSION_FOLLOWUP_PATTERN =
  /\b(fusion|lecture globale|lecture plus globale|lecture d ensemble|vue d ensemble|lecture croisee|croiser|croise|broader reading|global reading)\b/

type ScienceIntentConfig = {
  science: PublicScience
  label: string
  aliases: string[]
  strongPatterns?: RegExp[]
}

const SCIENCE_INTENT_CONFIGS: ScienceIntentConfig[] = [
  {
    science: 'astrology',
    label: 'Astrologie',
    aliases: [
      'astrologie',
      'astrology',
      'astro',
      'theme astrologique',
      'theme astral',
      'theme natal',
      'birth chart',
      'natal chart',
      'carte du ciel',
    ],
    strongPatterns: [/\b(theme astrologique|theme astral|theme natal|birth chart|natal chart|carte du ciel)\b/],
  },
  {
    science: 'human_design',
    label: 'Human Design',
    aliases: ['human design', 'design humain', 'bodygraph', 'mon hd', 'my hd'],
    strongPatterns: [/\b(human design|design humain|bodygraph|mon hd|my hd)\b/],
  },
  {
    science: 'numerology',
    label: 'Numerologie',
    aliases: [
      'numerologie',
      'numerology',
      'chemin de vie',
      'life path',
      'annee personnelle',
      'personal year',
      'mois personnel',
      'personal month',
    ],
    strongPatterns: [/\b(chemin de vie|life path|annee personnelle|personal year|mois personnel|personal month)\b/],
  },
  {
    science: 'enneagram',
    label: 'Enneagramme',
    aliases: ['enneagramme', 'enneagram', 'ennea'],
    strongPatterns: [/\b(enneagramme|enneagram|ennea)\b/],
  },
  {
    science: 'kua',
    label: 'Kua',
    aliases: ['kua', 'nombre kua', 'kua number', 'direction kua', 'kua directions'],
    strongPatterns: [/\b(kua|nombre kua|kua number|direction kua|kua directions)\b/],
  },
]

function cloneMenuItem(item: HexastraMenuItem): HexastraMenuItem {
  return {
    ...item,
    submenu: item.submenu?.map(cloneMenuItem),
  }
}

function normalizeScienceRequestText(value: string) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2019']/g, ' ')
    .replace(/[^a-z0-9\s/+-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function mapScienceHint(scienceHint?: string | null): PublicScience | null {
  switch (scienceHint) {
    case 'astrology':
      return 'astrology'
    case 'human_design':
      return 'human_design'
    case 'numerology':
      return 'numerology'
    case 'enneagram':
      return 'enneagram'
    case 'kua':
      return 'kua'
    default:
      return null
  }
}

function labelForScience(science: PublicScience): string {
  switch (science) {
    case 'astrology':
      return 'Astrologie'
    case 'human_design':
      return 'Human Design'
    case 'numerology':
      return 'Numerologie'
    case 'enneagram':
      return 'Enneagramme'
    case 'kua':
      return 'Kua'
  }
}

export function resolveScienceSelectionKey(
  science: PublicScience,
  subcategory?: string | null,
): string {
  switch (science) {
    case 'astrology':
      switch (subcategory) {
        case 'transits':
        case 'retrograde':
        case 'cycle':
          return 'science_astrolex_transits'
        case 'maisons':
          return 'science_astrolex_houses'
        case 'aspects':
          return 'science_astrolex_aspects'
        case 'compatibilite_astro':
          return 'science_astrolex_synastry'
        case 'planetes':
          return 'science_astrolex_planetarium'
        default:
          return 'science_astrolex_synthesis'
      }
    case 'human_design':
      switch (subcategory) {
        case 'centres_hd':
          return 'science_porteum_centers'
        case 'canaux_hd':
          return 'science_porteum_channels'
        case 'portes_hd':
          return 'science_porteum_gates'
        case 'profil_hd':
          return 'science_porteum_profile'
        case 'autorite_hd':
        case 'strategie_hd':
          return 'science_porteum_authority'
        default:
          return 'science_porteum_synthesis'
      }
    case 'numerology':
      switch (subcategory) {
        case 'annee_personnelle':
          return 'science_triangle_year'
        case 'mois_personnel':
        case 'jour_personnel':
          return 'science_triangle_month'
        case 'chemin_de_vie':
        case 'expression':
        case 'ame':
        case 'personnalite_num':
          return 'science_triangle_vibration'
        case 'cycle_vie':
          return 'science_triangle_transition'
        default:
          return 'science_triangle_synthesis'
      }
    case 'enneagram':
      switch (subcategory) {
        case 'type_enn':
        case 'aile_enn':
          return 'science_enneagram_type'
        case 'instinct_enn':
        case 'desintegration_enn':
          return 'science_enneagram_defense'
        case 'integration_enn':
          return 'science_enneagram_resources'
        default:
          return 'science_enneagram_synthesis'
      }
    case 'kua':
      switch (subcategory) {
        case 'nombre_kua':
        case 'direction_kua':
          return 'science_kua_orientation'
        case 'orientation_habitat':
          return 'science_kua_space'
        case 'orientation_bureau':
        case 'direction_sommeil':
        case 'elements_kua':
        case 'feng_shui':
          return 'science_kua_environment'
        default:
          return 'science_kua_synthesis'
      }
  }
}

export function resolvePublicScienceFromSelectionKey(key?: string | null): PublicScience | null {
  if (!key) return null

  if (
    key === 'science_astrologie' ||
    key.startsWith('science_astrolex') ||
    key.startsWith('astro_')
  ) {
    return 'astrology'
  }

  if (
    key === 'science_human_design' ||
    key.startsWith('science_porteum') ||
    key.startsWith('hd_')
  ) {
    return 'human_design'
  }

  if (
    key === 'science_numerologie' ||
    key.startsWith('science_triangle') ||
    key.startsWith('num_')
  ) {
    return 'numerology'
  }

  if (
    key === 'science_enneagramme' ||
    key.startsWith('science_enneagram') ||
    key.startsWith('enn_')
  ) {
    return 'enneagram'
  }

  if (key === 'science_kua' || key.startsWith('science_kua') || key.startsWith('kua_')) {
    return 'kua'
  }

  return null
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

export function detectExplicitScienceIntent(params: {
  message?: string | null
  scienceHint?: string | null
  subcategory?: string | null
}): ExplicitScienceIntent | null {
  const text = normalizeScienceRequestText(params.message ?? '')
  if (!text) return null

  for (const config of SCIENCE_INTENT_CONFIGS) {
    const hasAlias = config.aliases.some((alias) => {
      const normalizedAlias = normalizeScienceRequestText(alias)
      return text === normalizedAlias || (normalizedAlias.length >= 4 && text.includes(normalizedAlias))
    })
    const hasStrongPattern = (config.strongPatterns ?? []).some((pattern) => pattern.test(text))
    const looksLikeDirectAsk =
      SCIENCE_REQUEST_VERB_PATTERN.test(text) ||
      SCIENCE_REQUEST_SELF_PATTERN.test(text) ||
      config.aliases.some((alias) => text === normalizeScienceRequestText(alias))

    if (hasStrongPattern || (hasAlias && looksLikeDirectAsk)) {
      return {
        science: config.science,
        label: config.label,
        selectionKey: resolveScienceSelectionKey(config.science, params.subcategory),
      }
    }
  }

  const hintedScience = mapScienceHint(params.scienceHint)
  if (!hintedScience) return null

  const looksLikeDirectScienceAsk =
    SCIENCE_REQUEST_VERB_PATTERN.test(text) ||
    SCIENCE_REQUEST_SELF_PATTERN.test(text) ||
    Boolean(params.subcategory)

  if (!looksLikeDirectScienceAsk) {
    return null
  }

  return {
    science: hintedScience,
    label: labelForScience(hintedScience),
    selectionKey: resolveScienceSelectionKey(hintedScience, params.subcategory),
  }
}

export function isFusionFollowupRequest(message?: string | null): boolean {
  const text = normalizeScienceRequestText(message ?? '')
  return Boolean(text && SCIENCE_FUSION_FOLLOWUP_PATTERN.test(text))
}

export function isScienceMenuKey(key?: string | null): boolean {
  return Boolean(resolvePublicScienceFromSelectionKey(key) || key === 'science')
}

export function sanitizeFusionOnlySelectionKey(key?: string | null): string | null {
  if (typeof key !== 'string') return null
  const trimmed = key.trim()
  return trimmed || null
}

export function isScienceBreakdownRequest(message?: string | null): boolean {
  return Boolean(detectExplicitScienceIntent({ message }))
}
