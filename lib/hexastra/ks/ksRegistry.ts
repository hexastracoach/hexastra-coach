import type { DomainRoute } from '@/lib/hexastra/types'
import { getKsSubmoduleContracts, type KsSubmoduleContract } from './moduleRegistry'

export const KS_EXECUTION_STAGES = [
  'interface_utilisateur',
  'input_engine',
  'fusion_engine',
  'modules_specialises',
  'narrative_engine',
] as const

type KsDomainConfig = {
  modules: string[]
  narrativeContract: string
  executionStrategy?: 'api_first' | 'module_first' | 'support'
}

type KsSelectionConfig = {
  modules: string[]
  narrativeContract: string
  promptHint?: string
  outputStructure?: string
  contextFrame?: string
  clarificationQuestion?: string
  submodules?: string[]
  executionStrategy?: 'api_first' | 'module_first' | 'support'
}

export type KsExecutionContract = {
  modules: string[]
  narrativeContract: string
  promptHint?: string
  outputStructure?: string
  contextFrame?: string
  clarificationQuestion?: string
  submodules: string[]
  submoduleContracts: KsSubmoduleContract[]
  executionStrategy?: 'api_first' | 'module_first' | 'support'
}

export const KS_DOMAIN_REGISTRY: Record<DomainRoute, KsDomainConfig> = {
  general: {
    modules: ['KS.FUSION.V13', 'KS.SYNTHEON', 'KS.SENTINEL'],
    narrativeContract:
      'Lecture generale structuree a partir du noyau KS, avec arbitrage des dominantes puis reformulation simple et utile.',
    executionStrategy: 'module_first',
  },
  neurokua: {
    modules: ['KS.NeuroKua.System.V1', 'KS.NEUROSOMA', 'KS.Q-INCARNATIO.V1', 'KS.SENTINEL'],
    narrativeContract:
      "Scanner l'etat interieur, identifier desequilibre, surcharge ou besoin de recuperation, puis donner un ajustement concret et immediat.",
    executionStrategy: 'api_first',
  },
  gps_kua: {
    modules: ['KS.HexAstra.GPS.V1', 'KS.NeuroKua.System.V1', 'KS.SENTINEL'],
    narrativeContract:
      'Traduire les signaux directionnels et de positionnement en orientation concrete, sans exposer la mecanique interne.',
    executionStrategy: 'api_first',
  },
  fusion: {
    modules: ['KS.FUSION.V13', 'KS.SYNTHEON', 'KS.SENTINEL', 'KS.HEXASTRAL.ENGINE'],
    narrativeContract:
      'Fusionner les signaux, resoudre les contradictions, extraire les dominantes, puis livrer une lecture claire et stable.',
    executionStrategy: 'api_first',
  },
  relationship: {
    modules: ['KS.FUSION.V13', 'KS.SPIRITLEX.V1', 'KS.SENTINEL'],
    narrativeContract:
      'Lire la dynamique relationnelle dominante, la tension utile, puis formuler un levier relationnel simple et applicable.',
    executionStrategy: 'module_first',
  },
  career: {
    modules: ['KS.FUSION.V13', 'KS.TRIANGLENUMERIS.V1', 'KS.SENTINEL'],
    narrativeContract:
      'Clarifier positionnement, risque, timing et prochaine action concrete dans la sphere professionnelle ou materielle.',
    executionStrategy: 'module_first',
  },
  decision: {
    modules: ['KS.FUSION.V13', 'KS.MUTALEX.V1', 'KS.SENTINEL'],
    narrativeContract:
      'Comparer les options, arbitrer les contradictions et produire une orientation nette, prudente et utile.',
    executionStrategy: 'module_first',
  },
  timing: {
    modules: ['KS.FUSION.V13', 'KS.TRIANGLENUMERIS.V1', 'KS.ASTROLEX.V1', 'KS.SENTINEL'],
    narrativeContract:
      "Lire la phase, les fenetres d'action et les zones de vigilance, puis proposer le bon rythme.",
    executionStrategy: 'api_first',
  },
  wellbeing: {
    modules: ['KS.FUSION.V13', 'KS.NEUROSOMA', 'KS.SENTINEL'],
    narrativeContract:
      'Recentrer, apaiser et remettre de la coherence avec une priorite simple et non medicalisee.',
    executionStrategy: 'module_first',
  },
  science: {
    modules: ['KS.FUSION.V13', 'KS.ASTROLEX.V1', 'KS.PORTEUM.V1', 'KS.TRIANGLENUMERIS.V1', 'KS.SENTINEL'],
    narrativeContract:
      "Traiter la science choisie comme un angle specialise, puis reintegrer le resultat dans une lecture HexAstra lisible.",
    executionStrategy: 'api_first',
  },
}

const KS_SELECTION_REGISTRY: Record<string, KsSelectionConfig> = {
  state_today: {
    modules: ['KS.NeuroKua.System.V1', 'KS.NEUROSOMA', 'KS.SENTINEL'],
    narrativeContract: "Produire directement un scan de l'etat du jour, sans re-questionner l'utilisateur.",
    promptHint: "Lecture directe NeuroKua de l'etat du jour a partir des donnees deja enregistrees.",
    outputStructure: 'Etat global -> desequilibre dominant -> levier immediat -> conseil pratique',
    contextFrame: "Sous-theme NeuroKua centré sur l'état actuel, le niveau d'équilibre, la tension dominante et le bon réglage immédiat.",
    clarificationQuestion: "Veux-tu surtout comprendre ton état global du jour, ou un point précis comme la fatigue, le stress ou la clarté ?",
    submodules: ['KS.StateActivation', 'KS.InnerStateReader'],
    executionStrategy: 'api_first',
  },
  fatigue_recharge: {
    modules: ['KS.NeuroKua.System.V1', 'KS.NEUROSOMA', 'KS.Q-INCARNATIO.V1'],
    narrativeContract: 'Diagnostiquer la fatigue dominante et proposer une recharge prioritaire.',
    outputStructure: 'Fatigue dominante -> cause probable -> recharge prioritaire -> geste concret',
    contextFrame: 'Sous-theme de recharge centré sur la fatigue, la réserve réelle et le meilleur geste de récupération.',
    clarificationQuestion: "Ta demande porte surtout sur la fatigue physique, mentale ou sur une sensation générale d'épuisement ?",
    submodules: ['KS.InnerStateReader', 'KS.ActionTranslator'],
    executionStrategy: 'api_first',
  },
  stress_overload: {
    modules: ['KS.NeuroKua.System.V1', 'KS.NEUROSOMA', 'KS.SENTINEL'],
    narrativeContract: 'Identifier la surcharge dominante et donner un levier concret de stabilisation.',
    outputStructure: 'Surcharge dominante -> risque a eviter -> stabilisation -> action simple',
    contextFrame: 'Sous-theme de surcharge centré sur la tension, la sursollicitation et le levier de stabilisation prioritaire.',
    clarificationQuestion: "Le stress que tu veux regarder est-il surtout mental, émotionnel ou lié à une situation précise ?",
    submodules: ['KS.StateActivation', 'KS.VoiceModulation'],
    executionStrategy: 'api_first',
  },
  quick_adjustment: {
    modules: ['KS.NeuroKua.System.V1', 'KS.Q-INCARNATIO.V1'],
    narrativeContract: 'Donner un ajustement bref, pratique et immediat.',
    outputStructure: 'Constat -> ajustement rapide -> effet attendu',
    contextFrame: 'Sous-theme d’ajustement rapide centré sur un micro-réglage concret à effet immédiat.',
    clarificationQuestion: "Tu veux un ajustement rapide pour retrouver du calme, de l’élan ou de la clarté ?",
    submodules: ['KS.ActionTranslator'],
    executionStrategy: 'api_first',
  },
  detailed_reading: {
    modules: ['KS.FUSION.V13', 'KS.SYNTHEON', 'KS.HEXASTRAL.ENGINE', 'KS.SENTINEL'],
    narrativeContract: 'Produire une lecture fusionnee detaillee, stable et structuree.',
    outputStructure: 'Phase -> dynamique dominante -> risque -> opportunite -> orientation',
    contextFrame: 'Lecture générale détaillée centrée sur la phase actuelle, les dominantes, les vigilances et la direction utile.',
    clarificationQuestion: "Veux-tu que la lecture détaillée se concentre surtout sur ta situation globale, une décision, ou un domaine de vie précis ?",
    executionStrategy: 'api_first',
  },
  science_neurokua: {
    modules: ['KS.NeuroKua.System.V1', 'KS.NEUROSOMA', 'KS.SENTINEL'],
    narrativeContract: "Traiter la demande comme une lecture NeuroKua specialisee centree sur l'equilibre et la regulation.",
    outputStructure: 'Etat global -> axe de regulation -> surcharge ou recharge -> ajustement',
    contextFrame: "Science NeuroKua centrée sur l'équilibre intérieur, la régulation et le geste juste du moment.",
    clarificationQuestion: "Souhaites-tu un scan global NeuroKua ou regarder un axe précis comme stress, fatigue ou stabilité ?",
    submodules: ['KS.StateActivation', 'KS.InnerStateReader', 'KS.ActionTranslator'],
    executionStrategy: 'api_first',
  },
  science_astrolex: {
    modules: ['KS.ASTROLEX.V1', 'KS.Planetarium', 'KS.Transitus', 'KS.SENTINEL'],
    narrativeContract: 'Lire les influences, la phase traversee et le timing prioritaire.',
    outputStructure: 'Phase actuelle -> domaine active -> tension ou opportunite -> timing -> conseil',
    contextFrame: 'Science Astrolex centrée sur le timing, la phase, les maisons, les activations et la bonne fenêtre d’action.',
    clarificationQuestion: "Sur Astrolex, veux-tu regarder ton timing général, un domaine de vie précis, ou une question astrologique comme les maisons, aspects ou axes ?",
    submodules: ['KS.Planetarium', 'KS.Domus', 'KS.Aspectum', 'KS.Nodus', 'KS.Transitus', 'KS.AethericMap', 'KS.SyncBridge.Astro'],
    executionStrategy: 'api_first',
  },
  science_porteum: {
    modules: ['KS.PORTEUM.V1', 'KS.ChannelMap', 'KS.PolarityMap', 'KS.SENTINEL'],
    narrativeContract: 'Lire le fonctionnement naturel, les appuis et les frictions d incarnation.',
    outputStructure: 'Fonctionnement naturel -> zone sensible -> bon reflexe -> ajustement',
    contextFrame: 'Science Porteum centrée sur le fonctionnement réel, les centres d’appui, les canaux et les frictions d’incarnation.',
    clarificationQuestion: "Avec Porteum, veux-tu surtout comprendre ton fonctionnement global, une zone sensible, ou ton meilleur mode d’action ?",
    submodules: ['KS.Vocalis', 'KS.DeconditioMap', 'KS.PolarityMap', 'KS.ChannelMap'],
    executionStrategy: 'api_first',
  },
  science_triangle: {
    modules: ['KS.TRIANGLENUMERIS.V1', 'KS.NumCore', 'KS.NumCycle', 'KS.SENTINEL'],
    narrativeContract: 'Lire le cycle dominant, la temporalite utile et la bonne attitude du moment.',
    outputStructure: 'Cycle dominant -> phase numerique -> opportunite -> vigilance -> attitude',
    contextFrame: 'Science Triangle Numeris centrée sur les cycles, la vibration active, le rythme et la stabilité du moment.',
    clarificationQuestion: "Veux-tu une lecture du cycle général, d’une période précise, ou de l’impact actuel sur un domaine de vie ?",
    submodules: ['KS.NumCore', 'KS.NumCycle', 'KS.HexaNum.LinkBridge'],
    executionStrategy: 'api_first',
  },
  science_enneagram: {
    modules: ['KS.SPIRITLEX.V1', 'KS.ArchetypeMap', 'KS.EmotionMap', 'KS.SENTINEL'],
    narrativeContract: 'Lire la reaction dominante, le piege a eviter et le levier evolutif.',
    outputStructure: 'Reaction dominante -> mode stress -> piege -> levier evolutif',
    contextFrame: 'Lecture archétypale centrée sur le mécanisme dominant, la défense, le stress et le levier d’évolution.',
    clarificationQuestion: "Veux-tu comprendre ton mécanisme global, ta réaction sous stress, ou un levier de transformation plus précis ?",
    submodules: ['KS.SymbolCore', 'KS.ArchetypeMap', 'KS.EmotionMap', 'KS.SpiritLex.LinkBioTotem'],
    executionStrategy: 'module_first',
  },
  science_kua: {
    modules: ['KS.HexAstra.GPS.V1', 'KS.KAFA.WAVES', 'KS.SENTINEL'],
    narrativeContract: "Lire l'orientation, le positionnement et l'ajustement environnemental utile.",
    outputStructure: 'Orientation utile -> zone de tension -> ajustement espace -> conseil pratique',
    contextFrame: 'Science Kua centrée sur l’orientation, le positionnement et l’ajustement de l’environnement.',
    clarificationQuestion: "Avec Kua, veux-tu une orientation générale, une aide de décision, ou un ajustement concret de ton espace ?",
    submodules: ['KS.SignalReader', 'KS.PlantInterface'],
    executionStrategy: 'api_first',
  },
  science_fusion: {
    modules: ['KS.FUSION.V13', 'KS.SYNTHEON', 'KS.HEXASTRAL.ENGINE', 'KS.SENTINEL'],
    narrativeContract: 'Fusion complete avec arbitrage des dominantes et sortie narrative stabilisee.',
    outputStructure: 'Dominantes -> contradictions -> arbitrage -> orientation -> action',
    contextFrame: 'Lecture Fusion complète centrée sur les dominantes croisées, les contradictions et l’arbitrage final.',
    clarificationQuestion: "Veux-tu une fusion complète générale, ou une fusion appliquée à une question ou un domaine précis ?",
    executionStrategy: 'api_first',
  },
}

export function getKsDomainConfig(domain: DomainRoute): KsDomainConfig {
  return KS_DOMAIN_REGISTRY[domain] ?? KS_DOMAIN_REGISTRY.general
}

export function getKsSelectionConfig(key?: string | null): KsSelectionConfig | null {
  if (!key) return null
  return KS_SELECTION_REGISTRY[key] ?? null
}

export function getKsSelectionExecutionContract(key?: string | null): KsExecutionContract | null {
  const config = getKsSelectionConfig(key)
  if (!config) return null

  const submodules = config.submodules ?? []
  return {
    ...config,
    submodules,
    submoduleContracts: getKsSubmoduleContracts(submodules),
  }
}

export function getKsFreeformContract(message?: string | null): KsSelectionConfig | null {
  const text = (message ?? '').toLowerCase()
  if (!text.trim()) return null

  if (
    text.includes('theme natal') ||
    text.includes('thème natal') ||
    text.includes('theme astral') ||
    text.includes('thème astral') ||
    text.includes('carte du ciel')
  ) {
    return {
      modules: ['KS.HEXASTRAL.ENGINE', 'KS.ASTROLEX.V1', 'KS.Planetarium', 'KS.Domus', 'KS.Aspectum', 'KS.SENTINEL'],
      narrativeContract:
        'Produire une lecture de theme natal directe a partir des donnees de naissance, sans redemander les informations deja presentes.',
      promptHint:
        'Lecture directe du theme natal a partir des donnees de naissance deja enregistrees.',
      outputStructure:
        'Signature de naissance -> axes dominants -> forces -> vigilances -> orientation actuelle',
      contextFrame:
        'Lecture de thème natal centrée sur la signature de naissance, les maisons, les axes dominants et leur traduction concrète.',
      clarificationQuestion:
        "Veux-tu un thème natal global, ou te concentrer sur un angle précis comme les maisons, les aspects, la mission ou les blocages ?",
      submodules: ['KS.Planetarium', 'KS.Domus', 'KS.Aspectum', 'KS.ThemeHexAstra.V1'],
      executionStrategy: 'api_first',
    }
  }

  return null
}

export function getKsFreeformExecutionContract(message?: string | null): KsExecutionContract | null {
  const config = getKsFreeformContract(message)
  if (!config) return null

  const submodules = config.submodules ?? []
  return {
    ...config,
    submodules,
    submoduleContracts: getKsSubmoduleContracts(submodules),
  }
}
