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
}

type KsSelectionConfig = {
  modules: string[]
  narrativeContract: string
  promptHint?: string
  outputStructure?: string
  submodules?: string[]
}

export type KsExecutionContract = {
  modules: string[]
  narrativeContract: string
  promptHint?: string
  outputStructure?: string
  submodules: string[]
  submoduleContracts: KsSubmoduleContract[]
}

export const KS_DOMAIN_REGISTRY: Record<DomainRoute, KsDomainConfig> = {
  general: {
    modules: ['KS.FUSION.V13', 'KS.SYNTHEON', 'KS.SENTINEL'],
    narrativeContract:
      'Lecture generale structuree a partir du noyau KS, avec arbitrage des dominantes puis reformulation simple et utile.',
  },
  neurokua: {
    modules: ['KS.NeuroKua.System.V1', 'KS.NEUROSOMA', 'KS.Q-INCARNATIO.V1', 'KS.SENTINEL'],
    narrativeContract:
      "Scanner l'etat interieur, identifier desequilibre, surcharge ou besoin de recuperation, puis donner un ajustement concret et immediat.",
  },
  gps_kua: {
    modules: ['KS.HexAstra.GPS.V1', 'KS.NeuroKua.System.V1', 'KS.SENTINEL'],
    narrativeContract:
      'Traduire les signaux directionnels et de positionnement en orientation concrete, sans exposer la mecanique interne.',
  },
  fusion: {
    modules: ['KS.FUSION.V13', 'KS.SYNTHEON', 'KS.SENTINEL', 'KS.HEXASTRAL.ENGINE'],
    narrativeContract:
      'Fusionner les signaux, resoudre les contradictions, extraire les dominantes, puis livrer une lecture claire et stable.',
  },
  relationship: {
    modules: ['KS.FUSION.V13', 'KS.SPIRITLEX.V1', 'KS.SENTINEL'],
    narrativeContract:
      'Lire la dynamique relationnelle dominante, la tension utile, puis formuler un levier relationnel simple et applicable.',
  },
  career: {
    modules: ['KS.FUSION.V13', 'KS.TRIANGLENUMERIS.V1', 'KS.SENTINEL'],
    narrativeContract:
      'Clarifier positionnement, risque, timing et prochaine action concrete dans la sphere professionnelle ou materielle.',
  },
  decision: {
    modules: ['KS.FUSION.V13', 'KS.MUTALEX.V1', 'KS.SENTINEL'],
    narrativeContract:
      'Comparer les options, arbitrer les contradictions et produire une orientation nette, prudente et utile.',
  },
  timing: {
    modules: ['KS.FUSION.V13', 'KS.TRIANGLENUMERIS.V1', 'KS.ASTROLEX.V1', 'KS.SENTINEL'],
    narrativeContract:
      "Lire la phase, les fenetres d'action et les zones de vigilance, puis proposer le bon rythme.",
  },
  wellbeing: {
    modules: ['KS.FUSION.V13', 'KS.NEUROSOMA', 'KS.SENTINEL'],
    narrativeContract:
      'Recentrer, apaiser et remettre de la coherence avec une priorite simple et non medicalisee.',
  },
  science: {
    modules: ['KS.FUSION.V13', 'KS.ASTROLEX.V1', 'KS.PORTEUM.V1', 'KS.TRIANGLENUMERIS.V1', 'KS.SENTINEL'],
    narrativeContract:
      "Traiter la science choisie comme un angle specialise, puis reintegrer le resultat dans une lecture HexAstra lisible.",
  },
}

const KS_SELECTION_REGISTRY: Record<string, KsSelectionConfig> = {
  state_today: {
    modules: ['KS.NeuroKua.System.V1', 'KS.NEUROSOMA', 'KS.SENTINEL'],
    narrativeContract: "Produire directement un scan de l'etat du jour, sans re-questionner l'utilisateur.",
    promptHint: "Lecture directe NeuroKua de l'etat du jour a partir des donnees deja enregistrees.",
    outputStructure: 'Etat global -> desequilibre dominant -> levier immediat -> conseil pratique',
    submodules: ['KS.StateActivation', 'KS.InnerStateReader'],
  },
  fatigue_recharge: {
    modules: ['KS.NeuroKua.System.V1', 'KS.NEUROSOMA', 'KS.Q-INCARNATIO.V1'],
    narrativeContract: 'Diagnostiquer la fatigue dominante et proposer une recharge prioritaire.',
    outputStructure: 'Fatigue dominante -> cause probable -> recharge prioritaire -> geste concret',
    submodules: ['KS.InnerStateReader', 'KS.ActionTranslator'],
  },
  stress_overload: {
    modules: ['KS.NeuroKua.System.V1', 'KS.NEUROSOMA', 'KS.SENTINEL'],
    narrativeContract: 'Identifier la surcharge dominante et donner un levier concret de stabilisation.',
    outputStructure: 'Surcharge dominante -> risque a eviter -> stabilisation -> action simple',
    submodules: ['KS.StateActivation', 'KS.VoiceModulation'],
  },
  quick_adjustment: {
    modules: ['KS.NeuroKua.System.V1', 'KS.Q-INCARNATIO.V1'],
    narrativeContract: 'Donner un ajustement bref, pratique et immediat.',
    outputStructure: 'Constat -> ajustement rapide -> effet attendu',
    submodules: ['KS.ActionTranslator'],
  },
  detailed_reading: {
    modules: ['KS.FUSION.V13', 'KS.SYNTHEON', 'KS.HEXASTRAL.ENGINE', 'KS.SENTINEL'],
    narrativeContract: 'Produire une lecture fusionnee detaillee, stable et structuree.',
    outputStructure: 'Phase -> dynamique dominante -> risque -> opportunite -> orientation',
  },
  science_neurokua: {
    modules: ['KS.NeuroKua.System.V1', 'KS.NEUROSOMA', 'KS.SENTINEL'],
    narrativeContract: "Traiter la demande comme une lecture NeuroKua specialisee centree sur l'equilibre et la regulation.",
    outputStructure: 'Etat global -> axe de regulation -> surcharge ou recharge -> ajustement',
    submodules: ['KS.StateActivation', 'KS.InnerStateReader', 'KS.ActionTranslator'],
  },
  science_astrolex: {
    modules: ['KS.ASTROLEX.V1', 'KS.Planetarium', 'KS.Transitus', 'KS.SENTINEL'],
    narrativeContract: 'Lire les influences, la phase traversee et le timing prioritaire.',
    outputStructure: 'Phase actuelle -> domaine active -> tension ou opportunite -> timing -> conseil',
    submodules: ['KS.Planetarium', 'KS.Domus', 'KS.Aspectum', 'KS.Nodus', 'KS.Transitus', 'KS.AethericMap', 'KS.SyncBridge.Astro'],
  },
  science_porteum: {
    modules: ['KS.PORTEUM.V1', 'KS.ChannelMap', 'KS.PolarityMap', 'KS.SENTINEL'],
    narrativeContract: 'Lire le fonctionnement naturel, les appuis et les frictions d incarnation.',
    outputStructure: 'Fonctionnement naturel -> zone sensible -> bon reflexe -> ajustement',
    submodules: ['KS.Vocalis', 'KS.DeconditioMap', 'KS.PolarityMap', 'KS.ChannelMap'],
  },
  science_triangle: {
    modules: ['KS.TRIANGLENUMERIS.V1', 'KS.NumCore', 'KS.NumCycle', 'KS.SENTINEL'],
    narrativeContract: 'Lire le cycle dominant, la temporalite utile et la bonne attitude du moment.',
    outputStructure: 'Cycle dominant -> phase numerique -> opportunite -> vigilance -> attitude',
    submodules: ['KS.NumCore', 'KS.NumCycle', 'KS.HexaNum.LinkBridge'],
  },
  science_enneagram: {
    modules: ['KS.SPIRITLEX.V1', 'KS.ArchetypeMap', 'KS.EmotionMap', 'KS.SENTINEL'],
    narrativeContract: 'Lire la reaction dominante, le piege a eviter et le levier evolutif.',
    outputStructure: 'Reaction dominante -> mode stress -> piege -> levier evolutif',
    submodules: ['KS.SymbolCore', 'KS.ArchetypeMap', 'KS.EmotionMap', 'KS.SpiritLex.LinkBioTotem'],
  },
  science_kua: {
    modules: ['KS.HexAstra.GPS.V1', 'KS.KAFA.WAVES', 'KS.SENTINEL'],
    narrativeContract: "Lire l'orientation, le positionnement et l'ajustement environnemental utile.",
    outputStructure: 'Orientation utile -> zone de tension -> ajustement espace -> conseil pratique',
    submodules: ['KS.SignalReader', 'KS.PlantInterface'],
  },
  science_fusion: {
    modules: ['KS.FUSION.V13', 'KS.SYNTHEON', 'KS.HEXASTRAL.ENGINE', 'KS.SENTINEL'],
    narrativeContract: 'Fusion complete avec arbitrage des dominantes et sortie narrative stabilisee.',
    outputStructure: 'Dominantes -> contradictions -> arbitrage -> orientation -> action',
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
      submodules: ['KS.Planetarium', 'KS.Domus', 'KS.Aspectum', 'KS.ThemeHexAstra.V1'],
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
