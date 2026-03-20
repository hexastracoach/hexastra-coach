import type { DomainRoute } from '@/lib/hexastra/types'
import { getKsSubmoduleContracts, type KsSubmoduleContract } from './moduleRegistry'
import { SCIENCE_SUBANALYSIS_LIST } from '@/lib/hexastra/orchestrator/contextualSelection'

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
  label?: string
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
  label?: string
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
      'Traiter la science choisie comme un angle specialise, puis reintegrer le resultat dans une lecture HexAstra lisible.',
    executionStrategy: 'api_first',
  },
}

const KS_SELECTION_REGISTRY: Record<string, KsSelectionConfig> = {
  state_today: {
    modules: ['KS.NeuroKua.System.V1', 'KS.NEUROSOMA', 'KS.SENTINEL'],
    narrativeContract: "Produire directement un scan de l'etat du jour, sans re-questionner l'utilisateur.",
    promptHint: "Lecture directe NeuroKua de l'etat du jour a partir des donnees deja enregistrees.",
    outputStructure: 'Etat global -> desequilibre dominant -> levier immediat -> conseil pratique',
    contextFrame:
      "Sous-theme NeuroKua centre sur l'etat actuel, le niveau d'equilibre, la tension dominante et le bon reglage immediat.",
    clarificationQuestion:
      "Veux-tu surtout comprendre ton etat global du jour, ou un point precis comme la fatigue, le stress ou la clarte ?",
    submodules: ['KS.StateActivation', 'KS.InnerStateReader', 'KS.NeuroTimingMap'],
    executionStrategy: 'api_first',
  },
  fatigue_recharge: {
    modules: ['KS.NeuroKua.System.V1', 'KS.NEUROSOMA', 'KS.Q-INCARNATIO.V1'],
    narrativeContract: 'Diagnostiquer la fatigue dominante et proposer une recharge prioritaire.',
    outputStructure: 'Fatigue dominante -> cause probable -> recharge prioritaire -> geste concret',
    contextFrame:
      'Sous-theme de recharge centre sur la fatigue, la reserve reelle et le meilleur geste de recuperation.',
    clarificationQuestion:
      "Ta demande porte surtout sur la fatigue physique, mentale ou sur une sensation generale d'epuisement ?",
    submodules: ['KS.InnerStateReader', 'KS.RecoveryProtocol', 'KS.ActionTranslator'],
    executionStrategy: 'api_first',
  },
  stress_overload: {
    modules: ['KS.NeuroKua.System.V1', 'KS.NEUROSOMA', 'KS.SENTINEL'],
    narrativeContract: 'Identifier la surcharge dominante et donner un levier concret de stabilisation.',
    outputStructure: 'Surcharge dominante -> risque a eviter -> stabilisation -> action simple',
    contextFrame:
      'Sous-theme de surcharge centre sur la tension, la sursollicitation et le levier de stabilisation prioritaire.',
    clarificationQuestion:
      'Le stress que tu veux regarder est-il surtout mental, emotionnel ou lie a une situation precise ?',
    submodules: ['KS.StateActivation', 'KS.VoiceModulation', 'KS.NeuroTimingMap'],
    executionStrategy: 'api_first',
  },
  quick_adjustment: {
    modules: ['KS.NeuroKua.System.V1', 'KS.Q-INCARNATIO.V1'],
    narrativeContract: 'Donner un ajustement bref, pratique et immediat.',
    outputStructure: 'Constat -> ajustement rapide -> effet attendu',
    contextFrame:
      'Sous-theme d ajustement rapide centre sur un micro-reglage concret a effet immediat.',
    clarificationQuestion:
      "Tu veux un ajustement rapide pour retrouver du calme, de l elan ou de la clarte ?",
    submodules: ['KS.ActionTranslator', 'KS.SynesthesiaMap'],
    executionStrategy: 'api_first',
  },
  detailed_reading: {
    modules: ['KS.FUSION.V13', 'KS.SYNTHEON', 'KS.HEXASTRAL.ENGINE', 'KS.SENTINEL'],
    narrativeContract: 'Produire une lecture fusionnee detaillee, stable et structuree.',
    outputStructure: 'Phase -> dynamique dominante -> risque -> opportunite -> orientation',
    contextFrame:
      'Lecture generale detaillee centree sur la phase actuelle, les dominantes, les vigilances et la direction utile.',
    clarificationQuestion:
      'Veux-tu que la lecture detaillee se concentre surtout sur ta situation globale, une decision, ou un domaine de vie precis ?',
    executionStrategy: 'api_first',
  },
  science_neurokua: {
    modules: ['KS.NeuroKua.System.V1', 'KS.NEUROSOMA', 'KS.SENTINEL'],
    narrativeContract:
      "Traiter la demande comme une lecture NeuroKua specialisee centree sur les 4 dynamiques, l'axe dominant, l'axe correctif et le bon ajustement spatial ou sensoriel.",
    outputStructure:
      'Mode dominant -> axe correctif -> surcharge ou manque -> ajustement spatial ou sensoriel -> action concrete',
    contextFrame:
      "Science NeuroKua centree sur les 4 dynamiques internes, l'axe correctif, la regulation de l'etat et les ajustements d'environnement utiles.",
    clarificationQuestion:
      "Souhaites-tu un scan global NeuroKua, ou regarder un axe precis comme surcharge, clarte, regulation, orientation ou ajustement sensoriel ?",
    submodules: [
      'KS.StateActivation',
      'KS.InnerStateReader',
      'KS.NeuroTimingMap',
      'KS.SynesthesiaMap',
      'KS.RecoveryProtocol',
      'KS.ActionTranslator',
    ],
    executionStrategy: 'api_first',
  },
  science_astrolex: {
    modules: ['KS.ASTROLEX.V1', 'KS.Planetarium', 'KS.Transitus', 'KS.SENTINEL'],
    narrativeContract:
      'Lire la phase astrologique, les maisons, les aspects, les axes, les relations et le bon timing prioritaire.',
    outputStructure: 'Planetes dominantes -> maisons ou domaine active -> tension ou appui -> timing -> conseil',
    contextFrame:
      'Science Astrologie centree sur le timing, la phase, les maisons, les activations, les axes et la bonne fenetre d action.',
    clarificationQuestion:
      'En astrologie, veux-tu regarder le timing general, les maisons, les aspects, la synastrie, la geo-astrologie ou les axes de vie ?',
    submodules: [
      'KS.Planetarium',
      'KS.Domus',
      'KS.Aspectum',
      'KS.Nodus',
      'KS.Transitus',
      'KS.Synastria',
      'KS.GeoAstroMap',
      'KS.HouseOppositionMap',
      'KS.AethericMap',
      'KS.SyncBridge.Astro',
    ],
    executionStrategy: 'api_first',
  },
  science_porteum: {
    modules: ['KS.PORTEUM.V1', 'KS.ChannelMap', 'KS.PolarityMap', 'KS.SENTINEL'],
    narrativeContract:
      'Lire le fonctionnement Human Design, les appuis, les centres sensibles, les profils et la logique de decision.',
    outputStructure:
      'Narration fluide Human Design centree sur les centres, les canaux, les portes, le profil, l autorite et la strategie, sans titres visibles automatiques.',
    contextFrame:
      "Science Human Design centree sur le fonctionnement reel, les centres d'appui, les canaux, les portes, les profils et la maniere optimale de decider.",
    clarificationQuestion:
      "Avec Human Design, veux-tu surtout comprendre ton type, tes centres, tes canaux, tes portes, ton profil ou ta meilleure maniere de decider ?",
    submodules: [
      'KS.TypeProfile',
      'KS.ProfileMap',
      'KS.ChannelMap',
      'KS.GateMap',
      'KS.AuthorityStrategy',
      'KS.IncarnationCross',
      'KS.Vocalis',
      'KS.DeconditioMap',
      'KS.PolarityMap',
    ],
    executionStrategy: 'api_first',
  },
  science_triangle: {
    modules: ['KS.TRIANGLENUMERIS.V1', 'KS.NumCore', 'KS.NumCycle', 'KS.SENTINEL'],
    narrativeContract:
      'Lire le cycle numerologique dominant, la vibration active, les transitions et la bonne attitude du moment.',
    outputStructure: 'Cycle dominant -> phase numerique -> opportunite -> vigilance -> attitude',
    contextFrame:
      'Science Numerologie centree sur les cycles, la vibration active, le rythme, le chemin de vie et la stabilite du moment.',
    clarificationQuestion:
      "Veux-tu une lecture numerologique du cycle general, du mois personnel, du chemin de vie, des defis, ou de l'impact actuel sur un domaine de vie ?",
    submodules: [
      'KS.NumCore',
      'KS.NumCycle',
      'KS.LifePathMap',
      'KS.PersonalMonthMap',
      'KS.NumericChallengeMap',
      'KS.HexaNum.LinkBridge',
    ],
    executionStrategy: 'api_first',
  },
  science_enneagram: {
    modules: ['KS.SPIRITLEX.V1', 'KS.ArchetypeMap', 'KS.EmotionMap', 'KS.SENTINEL'],
    narrativeContract:
      'Lire le type dominant, les ailes, les instincts, la bascule stress ou securite, puis le levier evolutif prioritaire.',
    outputStructure: 'Type dominant -> mecanisme de defense -> stress ou securite -> levier evolutif',
    contextFrame:
      'Lecture Enneagramme centree sur le type dominant, les ailes, les instincts, la defense et le levier d evolution.',
    clarificationQuestion:
      "Avec l Enneagramme, veux-tu comprendre ton type, tes ailes, ton sous-type instinctif, ta bascule stress ou ton levier d evolution ?",
    submodules: [
      'KS.SymbolCore',
      'KS.ArchetypeMap',
      'KS.EmotionMap',
      'KS.EnneaTypeMap',
      'KS.EnneaWingMap',
      'KS.EnneaInstinctMap',
      'KS.EnneaStressMap',
      'KS.SpiritLex.LinkBioTotem',
    ],
    executionStrategy: 'module_first',
  },
  science_kua: {
    modules: ['KS.HexAstra.GPS.V1', 'KS.KAFA.WAVES', 'KS.SENTINEL'],
    narrativeContract:
      "Lire l'orientation, le positionnement, les directions favorables et l'ajustement environnemental utile.",
    outputStructure: 'Orientation utile -> zone de tension -> ajustement espace -> conseil pratique',
    contextFrame:
      'Science Kua centree sur les directions favorables, les zones sensibles, le positionnement et l ajustement de l environnement.',
    clarificationQuestion:
      "Avec Kua, veux-tu regarder tes directions favorables, une decision, ton espace de vie ou un ajustement concret de ton environnement ?",
    submodules: ['KS.SignalReader', 'KS.DirectionMap', 'KS.SpaceMap', 'KS.KuaTimingMap', 'KS.PlantInterface'],
    executionStrategy: 'api_first',
  },
  science_maslow: {
    modules: ['KS.FUSION.V13', 'KS.NEUROSOMA', 'KS.Q-INCARNATIO.V1', 'KS.SENTINEL'],
    narrativeContract:
      'Lire le besoin dominant selon la pyramide de Maslow, identifier le manque ou la surcharge, puis proposer le prochain palier de stabilisation.',
    outputStructure: 'Besoin dominant -> manque ou surcharge -> prochain palier -> action de stabilisation',
    contextFrame:
      'Science Pyramide de Maslow centree sur le besoin actuellement prioritaire, ce qui manque pour te stabiliser, et le palier suivant a soutenir.',
    clarificationQuestion:
      "Avec la Pyramide de Maslow, veux-tu comprendre ton besoin dominant actuel, un manque precis, ou le prochain palier a consolider ?",
    submodules: [
      'KS.InnerStateReader',
      'KS.NeedHierarchyMap',
      'KS.CompensationMap',
      'KS.GrowthStepMap',
      'KS.ActionTranslator',
    ],
    executionStrategy: 'module_first',
  },
  science_fusion: {
    modules: ['KS.FUSION.V13', 'KS.SYNTHEON', 'KS.HEXASTRAL.ENGINE', 'KS.SENTINEL'],
    narrativeContract: 'Fusion complete avec arbitrage des dominantes et sortie narrative stabilisee.',
    outputStructure: 'Dominantes -> contradictions -> arbitrage -> orientation -> action',
    contextFrame:
      'Lecture Fusion complete centree sur les dominantes croisees, les contradictions et l arbitrage final.',
    clarificationQuestion:
      'Veux-tu une fusion complete generale, ou une fusion appliquee a une question ou un domaine precis ?',
    executionStrategy: 'api_first',
  },
  ...Object.fromEntries(
    SCIENCE_SUBANALYSIS_LIST.map((entry) => [
      entry.key,
      {
        label: entry.label,
        modules: entry.modules,
        narrativeContract: `Traiter ${entry.label} comme un angle focalise qui sert de contexte actif avant la lecture, puis repondre dans ce cadre sans perdre la science de reference.`,
        promptHint: entry.promptHint,
        outputStructure: entry.outputStructure,
        contextFrame: entry.contextFrame,
        clarificationQuestion: entry.clarificationQuestion,
        submodules: entry.submodules,
        executionStrategy: entry.executionStrategy,
      } satisfies KsSelectionConfig,
    ]),
  ),
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

function deaccent(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function getKsFreeformContract(message?: string | null): KsSelectionConfig | null {
  const text = deaccent((message ?? '').toLowerCase())
  if (!text.trim()) return null

  if (text.includes('theme natal') || text.includes('theme astral') || text.includes('carte du ciel')) {
    return {
      modules: [
        'KS.HEXASTRAL.ENGINE',
        'KS.ASTROLEX.V1',
        'KS.Planetarium',
        'KS.Domus',
        'KS.Aspectum',
        'KS.SENTINEL',
      ],
      narrativeContract:
        'Produire une lecture de theme natal directe a partir des donnees de naissance, sans redemander les informations deja presentes.',
      promptHint: 'Lecture directe du theme natal a partir des donnees de naissance deja enregistrees.',
      outputStructure: 'Signature de naissance -> axes dominants -> forces -> vigilances -> orientation actuelle',
      contextFrame:
        'Lecture de theme natal centree sur la signature de naissance, les maisons, les axes dominants et leur traduction concrete.',
      clarificationQuestion:
        'Veux-tu un theme natal global, ou te concentrer sur un angle precis comme les maisons, les aspects, les axes ou la vocation ?',
      submodules: [
        'KS.Planetarium',
        'KS.Domus',
        'KS.Aspectum',
        'KS.Nodus',
        'KS.HouseOppositionMap',
        'KS.ThemeHexAstra.V1',
      ],
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
