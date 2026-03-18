export type DocumentRole =
  | 'masterPrompt'
  | 'readingStructure'
  | 'menuPrompt'
  | 'sciencePrompt'
  | 'subsciencePrompt'
  | 'referenceBook'
  | 'supportingKnowledge'

export type DocumentScienceTag =
  | 'astrolex'
  | 'human_design'
  | 'numerologie'
  | 'enneagramme'
  | 'kua'
  | 'neurokua'
  | 'maslow'
  | 'transverse'
  | 'global'

export type DocumentRegistryEntry = {
  canonicalName: string
  aliases?: string[]
  role: DocumentRole
  scienceTag: DocumentScienceTag
  subscienceFocus?: string | null
  priority: number
}

export type DocumentRegistryBlockName =
  | 'astrologie'
  | 'human_design'
  | 'enneagramme'
  | 'neurokua'
  | 'numerologie'
  | 'kua'
  | 'maslow'
  | 'ks_fusion_globaux'

type DocumentRegistryPattern = {
  contains: string[]
  role: DocumentRole
  scienceTag: DocumentScienceTag
  subscienceFocus?: string | null
  priority: number
}

function normalize(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const DOCUMENT_REGISTRY: DocumentRegistryEntry[] = [
  {
    canonicalName: 'prompt_maitre_ks_fusion_v13_et_v13a12.txt',
    role: 'masterPrompt',
    scienceTag: 'global',
    priority: 140,
  },
  {
    canonicalName: '1 - MASTER_PROMPT.txt',
    role: 'masterPrompt',
    scienceTag: 'global',
    priority: 130,
  },
  {
    canonicalName: 'SYSTEM_PROMPT_FULL.txt',
    role: 'masterPrompt',
    scienceTag: 'global',
    priority: 120,
  },
  {
    canonicalName: 'PROMPT SYSTème KS ULTRA COMPACT LECTURE HEXASTRA.txt',
    aliases: ['PROMPT SYSTème KS ULTRA COMPACT LECTURE HEXASTRA.txt'],
    role: 'masterPrompt',
    scienceTag: 'global',
    priority: 110,
  },
  {
    canonicalName: 'KS_FUSION_V13_PROMPTS_OFFICIELS.docx',
    role: 'masterPrompt',
    scienceTag: 'global',
    priority: 100,
  },
  {
    canonicalName: 'PROMPT KS FUSION V13.pdf',
    role: 'masterPrompt',
    scienceTag: 'global',
    priority: 95,
  },
  {
    canonicalName: 'HEXASTRA_ENGINE_V1.txt',
    role: 'masterPrompt',
    scienceTag: 'global',
    priority: 90,
  },
  {
    canonicalName: 'Structure_de_lecture_HexAstra.docx',
    role: 'readingStructure',
    scienceTag: 'global',
    priority: 110,
  },
  {
    canonicalName: 'Strucutre de lecture Hexastra.txt',
    role: 'readingStructure',
    scienceTag: 'global',
    priority: 100,
  },
  {
    canonicalName: 'MICRO-LECTURE INITIALe — PROFIL UTILISATEUR.txt',
    role: 'readingStructure',
    scienceTag: 'global',
    priority: 90,
  },
  {
    canonicalName: '2 - PROMPT_MENU.txt',
    role: 'menuPrompt',
    scienceTag: 'global',
    priority: 70,
  },
  {
    canonicalName: '10 - Message_acceuil.txt',
    role: 'menuPrompt',
    scienceTag: 'global',
    priority: 68,
  },
  {
    canonicalName: 'PROMPT SOUS MODULE KS FUSION V13.pdf',
    role: 'sciencePrompt',
    scienceTag: 'global',
    priority: 110,
  },
  {
    canonicalName: 'PROMPT_ASTROLEX.txt',
    role: 'sciencePrompt',
    scienceTag: 'astrolex',
    subscienceFocus: 'lecture astro generale',
    priority: 100,
  },
  {
    canonicalName: 'PROMPT_PORTEUM.txt',
    role: 'sciencePrompt',
    scienceTag: 'human_design',
    subscienceFocus: 'lecture human design generale',
    priority: 100,
  },
  {
    canonicalName: '9 - prompt_Neurokua_system.txt',
    aliases: ['prompt_Neurokua_system.txt'],
    role: 'sciencePrompt',
    scienceTag: 'neurokua',
    subscienceFocus: 'lecture neurokua generale',
    priority: 100,
  },
  {
    canonicalName: 'PROMPT_NEUROSOMA.txt',
    role: 'sciencePrompt',
    scienceTag: 'neurokua',
    subscienceFocus: 'recalibration sensorielle',
    priority: 95,
  },
  {
    canonicalName: 'PROMPT_GPS.txt',
    role: 'sciencePrompt',
    scienceTag: 'kua',
    subscienceFocus: 'orientation generale',
    priority: 95,
  },
  {
    canonicalName: 'Prompt_Mémoire_intelligente_utilisateur_(HexAstra Memory Core).txt',
    aliases: ['Prompt Memoire intelligente utilisateur (HexAstra Memory Core).txt'],
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 84,
  },
  {
    canonicalName: 'PROMPT_Q_INCARNATIO.txt',
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 82,
  },
  {
    canonicalName: 'HEXASTRA – KNOWLEDGE CORE.pdf',
    aliases: ['HEXASTRA - KNOWLEDGE CORE.pdf'],
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 80,
  },
  {
    canonicalName: 'HexAstra_Knowledge_Core_Part2.docx',
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 79,
  },
  {
    canonicalName: 'HexAstra_Knowledge_Core_Part3.docx',
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 78,
  },
  {
    canonicalName: 'HexAstra_Knowledge_RAG.json',
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 77,
  },
  {
    canonicalName: 'HexAstra_Knowledge_RAG_1000.json',
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 76,
  },
  {
    canonicalName: 'KS_CORE_STRUCTURE.json',
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 75,
  },
  {
    canonicalName: 'KS_CONTEXT_ENGINE_V1.txt',
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 74,
  },
  {
    canonicalName: 'KS_CONTEXT_CYCLE_V1.txt',
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 73,
  },
  {
    canonicalName: 'KS_CONTEXT_LEVEL_V1.txt',
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 72,
  },
  {
    canonicalName: 'KS_CONTEXT_ZONE_V1.txt',
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 72,
  },
  {
    canonicalName: 'KS_CONTEXT_SENTINEL_V1.txt',
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 71,
  },
  {
    canonicalName: 'KS_SENTINEL_EXTENSIONS_V1.txt',
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 70,
  },
  {
    canonicalName: 'KS_CORE_POTENTIAL_V1.txt',
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 69,
  },
  {
    canonicalName: 'KS_RESONANCE_BALANCE_V1.txt',
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 69,
  },
  {
    canonicalName: 'KS_THRESHOLD_TIMING_V1.txt',
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 69,
  },
  {
    canonicalName: 'KS_CORE_EXTENSIONS_V1.txt',
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 68,
  },
  {
    canonicalName: 'KS_EXTENSIONS_CONCAT_V1.txt',
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 67,
  },
  {
    canonicalName: 'KS_FUSION_V13_Modules_Principaux.json',
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 67,
  },
  {
    canonicalName: 'KS_FUSION_V13_Modules_Principaux.docx',
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 67,
  },
  {
    canonicalName: 'KS_FUSION_V13_Modules_Complementaires.json',
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 66,
  },
  {
    canonicalName: 'KS_FUSION_V13_Modules_Complementaires_Classes.docx',
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 66,
  },
  {
    canonicalName: 'gpt_instruction_blocks.v1.json',
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 65,
  },
  {
    canonicalName: '1 - Cartographie complète du système KS.pdf',
    aliases: ['1 - Cartographie complete du systeme KS.pdf'],
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 64,
  },
  {
    canonicalName: '2 - Carte complète finale — KS.pdf',
    aliases: ['2 - Carte complete finale - KS.pdf'],
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 64,
  },
  {
    canonicalName: '3 - KS.FUSION.V13 —  CONFIGURATION SYSTÉMIQUE.pdf',
    aliases: ['3 - KS.FUSION.V13 - CONFIGURATION SYSTEMIQUE.pdf'],
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 63,
  },
  {
    canonicalName: '4 - KS FUSION V13 _ Un orchestrateur “exécutable”.pdf',
    aliases: ['4 - KS FUSION V13 _ Un orchestrateur executable.pdf'],
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 63,
  },
  {
    canonicalName:
      '4 - le contrat de données unique  (KS Signal Envelope)  la Fusion Engine  (pondération + résolution de contradictions).pdf',
    aliases: ['4 - le contrat de donnees unique (KS Signal Envelope) la Fusion Engine.pdf'],
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 62,
  },
  {
    canonicalName: '5 - KS fusion v13 MODULE DE SECURITE.pdf',
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 61,
  },
  {
    canonicalName: '6 -KS FUSION V13 MODULE SUPPLEMENTAIRE 2.pdf',
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 60,
  },
  {
    canonicalName: '7 - KS FUSION V13 Module supplémentaire.pdf',
    aliases: ['7 - KS FUSION V13 Module supplementaire.pdf'],
    role: 'supportingKnowledge',
    scienceTag: 'global',
    priority: 60,
  },
  {
    canonicalName: '7 - Prompt_DÉTECTION_DU_MOMENT_CLÉ_(TIMING INTELLIGENT).txt',
    aliases: [
      '7 - Prompt_DETECTION_DU_MOMENT_CLE_(TIMING INTELLIGENT).txt',
      '7 - Prompt DÃ‰TECTION DU MOMENT CLÃ‰ (TIMING INTELLIGENT).txt',
    ],
    role: 'sciencePrompt',
    scienceTag: 'numerologie',
    subscienceFocus: 'timing numerologique',
    priority: 96,
  },
  {
    canonicalName: 'The_Complete_Book_of_Numerology.pdf',
    role: 'referenceBook',
    scienceTag: 'numerologie',
    subscienceFocus: 'lecture numerologie generale',
    priority: 70,
  },
  {
    canonicalName: '628462363-Numerology-and-the-Divine-Triangle.pdf',
    role: 'referenceBook',
    scienceTag: 'numerologie',
    subscienceFocus: 'triangle et vibration',
    priority: 68,
  },
  {
    canonicalName: 'Chiron And The Healing Journey PDF.pdf',
    role: 'referenceBook',
    scienceTag: 'astrolex',
    subscienceFocus: 'chiron',
    priority: 66,
  },
  {
    canonicalName: 'La+charte.pdf',
    aliases: ['La charte.pdf'],
    role: 'referenceBook',
    scienceTag: 'astrolex',
    subscienceFocus: 'theme natal',
    priority: 64,
  },
  {
    canonicalName: "LA+STRUCTURE+D'UNE+CHARTE.pdf",
    aliases: ["LA STRUCTURE D'UNE CHARTE.pdf"],
    role: 'referenceBook',
    scienceTag: 'astrolex',
    subscienceFocus: 'maisons',
    priority: 64,
  },
  {
    canonicalName: 'ORIGINE+ET+DÉFINITION.pdf',
    aliases: ['ORIGINE ET DEFINITION.pdf'],
    role: 'referenceBook',
    scienceTag: 'astrolex',
    subscienceFocus: 'fondamentaux astrologiques',
    priority: 63,
  },
  {
    canonicalName:
      'Le design humain -- Chetan Parkyn -- 2018 -- Guy Trédaniel -- 2813221791 -- a412f172c73d760825de6501fc6b537d -- Anna’s Archive.pdf',
    aliases: [
      'Le design humain -- Chetan Parkyn -- 2018 -- Guy Tredaniel -- 2813221791 -- a412f172c73d760825de6501fc6b537d -- Annas Archive.pdf',
    ],
    role: 'referenceBook',
    scienceTag: 'human_design',
    subscienceFocus: 'profil et fonctionnement general',
    priority: 68,
  },
  {
    canonicalName: 'Vivre de son desgin Humain.pdf',
    aliases: ['Vivre de son design Humain.pdf'],
    role: 'referenceBook',
    scienceTag: 'human_design',
    subscienceFocus: 'autorite et strategie',
    priority: 66,
  },
  {
    canonicalName: '497772727-SDH-systeme-du-design-humain-Les-CroixdIncarnation.pdf',
    aliases: ['497772727 SDH systeme du design humain Les CroixdIncarnation.pdf'],
    role: 'referenceBook',
    scienceTag: 'human_design',
    subscienceFocus: 'croix d incarnation',
    priority: 65,
  },
  {
    canonicalName: 'Hypothèse NeuroKua™ Par Nseku kimia.pdf',
    aliases: ['Hypothese NeuroKua Par Nseku kimia.pdf', 'Hypothèse NeuroKua™ Par Nseku kimia.pdf'],
    role: 'referenceBook',
    scienceTag: 'neurokua',
    subscienceFocus: 'modele neurokua',
    priority: 68,
  },
  {
    canonicalName: 'KS.NeuroKua.Synesthesia.V1 Architecture officielle.pdf',
    role: 'referenceBook',
    scienceTag: 'neurokua',
    subscienceFocus: 'synesthesie',
    priority: 67,
  },
  {
    canonicalName: 'MANIFESTE — NEUROKUA™.pdf',
    aliases: ['MANIFESTE NEUROKUA.pdf', 'MANIFESTE — NEUROKUA™.pdf'],
    role: 'referenceBook',
    scienceTag: 'neurokua',
    subscienceFocus: 'fondamentaux neurokua',
    priority: 66,
  },
  {
    canonicalName: 'NeuroKua™ _ ce que ça représente pour toi.pdf',
    aliases: ['NeuroKua ce que ca represente pour toi.pdf', 'NeuroKua™ _ ce que ça représente pour toi.pdf'],
    role: 'referenceBook',
    scienceTag: 'neurokua',
    subscienceFocus: 'traduction concrete',
    priority: 65,
  },
  {
    canonicalName: 'Kybalion.pdf',
    role: 'referenceBook',
    scienceTag: 'transverse',
    priority: 55,
  },
  {
    canonicalName: '513327300-Dictionnaire-Des-Symboles-Avec-Recherche-PDF.pdf',
    role: 'referenceBook',
    scienceTag: 'transverse',
    priority: 54,
  },
  {
    canonicalName: 'Flow_The_Psychology_of_Optimal_Experience.pdf',
    aliases: ['Flow The Psychology of Optimal Experience.pdf'],
    role: 'referenceBook',
    scienceTag: 'transverse',
    priority: 53,
  },
  {
    canonicalName: 'le grand liver de la gestalt chantal et gonzale masquellier.pdf',
    aliases: ['le grand livre de la gestalt chantal et gonzale masquellier.pdf'],
    role: 'referenceBook',
    scienceTag: 'transverse',
    priority: 52,
  },
]

const DOCUMENT_REGISTRY_PATTERNS: DocumentRegistryPattern[] = [
  {
    contains: ['prompt', 'enneagram'],
    role: 'sciencePrompt',
    scienceTag: 'enneagramme',
    subscienceFocus: 'lecture enneagramme generale',
    priority: 94,
  },
  {
    contains: ['type', 'enneagram'],
    role: 'referenceBook',
    scienceTag: 'enneagramme',
    subscienceFocus: 'type',
    priority: 64,
  },
  {
    contains: ['aile', 'enneagram'],
    role: 'referenceBook',
    scienceTag: 'enneagramme',
    subscienceFocus: 'aile',
    priority: 63,
  },
  {
    contains: ['wing', 'enneagram'],
    role: 'referenceBook',
    scienceTag: 'enneagramme',
    subscienceFocus: 'aile',
    priority: 63,
  },
  {
    contains: ['instinct', 'enneagram'],
    role: 'referenceBook',
    scienceTag: 'enneagramme',
    subscienceFocus: 'instinct',
    priority: 63,
  },
  {
    contains: ['stress', 'enneagram'],
    role: 'referenceBook',
    scienceTag: 'enneagramme',
    subscienceFocus: 'stress ou securite',
    priority: 64,
  },
  {
    contains: ['securite', 'enneagram'],
    role: 'referenceBook',
    scienceTag: 'enneagramme',
    subscienceFocus: 'stress ou securite',
    priority: 63,
  },
  {
    contains: ['piege', 'enneagram'],
    role: 'referenceBook',
    scienceTag: 'enneagramme',
    subscienceFocus: 'pieges',
    priority: 62,
  },
  {
    contains: ['ressource', 'enneagram'],
    role: 'referenceBook',
    scienceTag: 'enneagramme',
    subscienceFocus: 'ressources',
    priority: 62,
  },
  {
    contains: ['levier', 'enneagram'],
    role: 'referenceBook',
    scienceTag: 'enneagramme',
    subscienceFocus: 'levier evolutif',
    priority: 62,
  },
  {
    contains: ['enneagram'],
    role: 'referenceBook',
    scienceTag: 'enneagramme',
    subscienceFocus: 'lecture enneagramme generale',
    priority: 62,
  },
  {
    contains: ['prompt', 'maslow'],
    role: 'sciencePrompt',
    scienceTag: 'maslow',
    priority: 94,
  },
  {
    contains: ['pyramide', 'maslow'],
    role: 'referenceBook',
    scienceTag: 'maslow',
    priority: 62,
  },
  {
    contains: ['maslow'],
    role: 'referenceBook',
    scienceTag: 'maslow',
    priority: 60,
  },
  {
    contains: ['prompt', 'gps'],
    role: 'sciencePrompt',
    scienceTag: 'kua',
    subscienceFocus: 'orientation generale',
    priority: 95,
  },
  {
    contains: ['direction', 'favorable'],
    role: 'referenceBook',
    scienceTag: 'kua',
    subscienceFocus: 'directions favorables',
    priority: 66,
  },
  {
    contains: ['directions', 'favorables'],
    role: 'referenceBook',
    scienceTag: 'kua',
    subscienceFocus: 'directions favorables',
    priority: 66,
  },
  {
    contains: ['zone', 'sensible', 'kua'],
    role: 'referenceBook',
    scienceTag: 'kua',
    subscienceFocus: 'zones sensibles',
    priority: 65,
  },
  {
    contains: ['zones', 'sensibles'],
    role: 'referenceBook',
    scienceTag: 'kua',
    subscienceFocus: 'zones sensibles',
    priority: 65,
  },
  {
    contains: ['espace', 'vie'],
    role: 'referenceBook',
    scienceTag: 'kua',
    subscienceFocus: 'espace de vie',
    priority: 64,
  },
  {
    contains: ['feng', 'shui'],
    role: 'referenceBook',
    scienceTag: 'kua',
    subscienceFocus: 'espace de vie',
    priority: 64,
  },
  {
    contains: ['decision', 'kua'],
    role: 'referenceBook',
    scienceTag: 'kua',
    subscienceFocus: 'decision',
    priority: 64,
  },
  {
    contains: ['equilibre', 'environnemental'],
    role: 'referenceBook',
    scienceTag: 'kua',
    subscienceFocus: 'equilibre environnemental',
    priority: 64,
  },
  {
    contains: ['environnement', 'kua'],
    role: 'referenceBook',
    scienceTag: 'kua',
    subscienceFocus: 'equilibre environnemental',
    priority: 63,
  },
  {
    contains: ['ajustement', 'espace'],
    role: 'referenceBook',
    scienceTag: 'kua',
    subscienceFocus: 'ajustements espace',
    priority: 63,
  },
  {
    contains: ['orientation', 'kua'],
    role: 'referenceBook',
    scienceTag: 'kua',
    subscienceFocus: 'orientation generale',
    priority: 63,
  },
  {
    contains: ['prompt', 'numerolog'],
    role: 'sciencePrompt',
    scienceTag: 'numerologie',
    subscienceFocus: 'lecture numerologie generale',
    priority: 96,
  },
  {
    contains: ['prompt', 'triangle'],
    role: 'sciencePrompt',
    scienceTag: 'numerologie',
    subscienceFocus: 'lecture numerologie generale',
    priority: 95,
  },
  {
    contains: ['cycle annuel'],
    role: 'referenceBook',
    scienceTag: 'numerologie',
    subscienceFocus: 'cycle annuel',
    priority: 67,
  },
  {
    contains: ['annee personnelle'],
    role: 'referenceBook',
    scienceTag: 'numerologie',
    subscienceFocus: 'cycle annuel',
    priority: 67,
  },
  {
    contains: ['mois personnel'],
    role: 'referenceBook',
    scienceTag: 'numerologie',
    subscienceFocus: 'mois personnel',
    priority: 66,
  },
  {
    contains: ['chemin de vie'],
    role: 'referenceBook',
    scienceTag: 'numerologie',
    subscienceFocus: 'chemin de vie',
    priority: 66,
  },
  {
    contains: ['defi', 'numerolog'],
    role: 'referenceBook',
    scienceTag: 'numerologie',
    subscienceFocus: 'defis',
    priority: 65,
  },
  {
    contains: ['defis', 'numerolog'],
    role: 'referenceBook',
    scienceTag: 'numerologie',
    subscienceFocus: 'defis',
    priority: 65,
  },
  {
    contains: ['vibration', 'numerolog'],
    role: 'referenceBook',
    scienceTag: 'numerologie',
    subscienceFocus: 'vibration',
    priority: 65,
  },
  {
    contains: ['divine', 'triangle'],
    role: 'referenceBook',
    scienceTag: 'numerologie',
    subscienceFocus: 'triangle et vibration',
    priority: 66,
  },
  {
    contains: ['transition', 'numerolog'],
    role: 'referenceBook',
    scienceTag: 'numerologie',
    subscienceFocus: 'transition',
    priority: 64,
  },
  {
    contains: ['prompt', 'astro'],
    role: 'sciencePrompt',
    scienceTag: 'astrolex',
    subscienceFocus: 'lecture astro generale',
    priority: 96,
  },
  {
    contains: ['prompt', 'neurokua'],
    role: 'sciencePrompt',
    scienceTag: 'neurokua',
    subscienceFocus: 'lecture neurokua generale',
    priority: 96,
  },
  {
    contains: ['prompt', 'neurosoma'],
    role: 'sciencePrompt',
    scienceTag: 'neurokua',
    subscienceFocus: 'recalibration sensorielle',
    priority: 95,
  },
  {
    contains: ['baseline', 'neurokua'],
    role: 'referenceBook',
    scienceTag: 'neurokua',
    subscienceFocus: 'baseline',
    priority: 66,
  },
  {
    contains: ['etat du jour', 'neurokua'],
    role: 'referenceBook',
    scienceTag: 'neurokua',
    subscienceFocus: 'baseline',
    priority: 65,
  },
  {
    contains: ['balance', 'neurokua'],
    role: 'referenceBook',
    scienceTag: 'neurokua',
    subscienceFocus: 'balance',
    priority: 65,
  },
  {
    contains: ['axe correctif', 'neurokua'],
    role: 'referenceBook',
    scienceTag: 'neurokua',
    subscienceFocus: 'balance',
    priority: 65,
  },
  {
    contains: ['timing', 'neurokua'],
    role: 'referenceBook',
    scienceTag: 'neurokua',
    subscienceFocus: 'timing',
    priority: 64,
  },
  {
    contains: ['overload', 'neurokua'],
    role: 'referenceBook',
    scienceTag: 'neurokua',
    subscienceFocus: 'overload',
    priority: 64,
  },
  {
    contains: ['surcharge', 'neurokua'],
    role: 'referenceBook',
    scienceTag: 'neurokua',
    subscienceFocus: 'overload',
    priority: 64,
  },
  {
    contains: ['fatigue', 'neurokua'],
    role: 'referenceBook',
    scienceTag: 'neurokua',
    subscienceFocus: 'overload',
    priority: 63,
  },
  {
    contains: ['recalibration', 'neurokua'],
    role: 'referenceBook',
    scienceTag: 'neurokua',
    subscienceFocus: 'recalibration',
    priority: 64,
  },
  {
    contains: ['sensoriel', 'neurokua'],
    role: 'referenceBook',
    scienceTag: 'neurokua',
    subscienceFocus: 'recalibration',
    priority: 63,
  },
  {
    contains: ['synesthesia'],
    role: 'referenceBook',
    scienceTag: 'neurokua',
    subscienceFocus: 'synesthesie',
    priority: 64,
  },
  {
    contains: ['synesthesie'],
    role: 'referenceBook',
    scienceTag: 'neurokua',
    subscienceFocus: 'synesthesie',
    priority: 64,
  },
  {
    contains: ['neurokua'],
    role: 'referenceBook',
    scienceTag: 'neurokua',
    subscienceFocus: 'lecture neurokua generale',
    priority: 62,
  },
  {
    contains: ['prompt', 'porteum'],
    role: 'sciencePrompt',
    scienceTag: 'human_design',
    subscienceFocus: 'lecture human design generale',
    priority: 96,
  },
  {
    contains: ['human', 'design', 'profil'],
    role: 'referenceBook',
    scienceTag: 'human_design',
    subscienceFocus: 'profil',
    priority: 67,
  },
  {
    contains: ['centre'],
    role: 'referenceBook',
    scienceTag: 'human_design',
    subscienceFocus: 'centres',
    priority: 66,
  },
  {
    contains: ['canal'],
    role: 'referenceBook',
    scienceTag: 'human_design',
    subscienceFocus: 'canaux',
    priority: 66,
  },
  {
    contains: ['canaux'],
    role: 'referenceBook',
    scienceTag: 'human_design',
    subscienceFocus: 'canaux',
    priority: 66,
  },
  {
    contains: ['porte'],
    role: 'referenceBook',
    scienceTag: 'human_design',
    subscienceFocus: 'portes',
    priority: 65,
  },
  {
    contains: ['autorite'],
    role: 'referenceBook',
    scienceTag: 'human_design',
    subscienceFocus: 'autorite et strategie',
    priority: 65,
  },
  {
    contains: ['strategie'],
    role: 'referenceBook',
    scienceTag: 'human_design',
    subscienceFocus: 'autorite et strategie',
    priority: 65,
  },
  {
    contains: ['croix', 'incarnation'],
    role: 'referenceBook',
    scienceTag: 'human_design',
    subscienceFocus: 'croix d incarnation',
    priority: 64,
  },
  {
    contains: ['synastr'],
    role: 'referenceBook',
    scienceTag: 'astrolex',
    subscienceFocus: 'synastrie',
    priority: 66,
  },
  {
    contains: ['geo', 'astrolog'],
    role: 'referenceBook',
    scienceTag: 'astrolex',
    subscienceFocus: 'geo astrologie',
    priority: 65,
  },
  {
    contains: ['transit'],
    role: 'referenceBook',
    scienceTag: 'astrolex',
    subscienceFocus: 'transits',
    priority: 64,
  },
  {
    contains: ['maison'],
    role: 'referenceBook',
    scienceTag: 'astrolex',
    subscienceFocus: 'maisons',
    priority: 63,
  },
  {
    contains: ['aspect'],
    role: 'referenceBook',
    scienceTag: 'astrolex',
    subscienceFocus: 'aspects',
    priority: 63,
  },
]

const NORMALIZED_REGISTRY = DOCUMENT_REGISTRY.flatMap((entry) => {
  const names = [entry.canonicalName, ...(entry.aliases ?? [])]
  return names.map((name) => ({
    key: normalize(name),
    entry,
  }))
})

export function lookupDocumentRegistry(filename: string | null | undefined) {
  const normalizedFilename = normalize(filename)
  if (!normalizedFilename) return null

  const exactMatch = NORMALIZED_REGISTRY.find((item) => item.key === normalizedFilename)?.entry
  if (exactMatch) return exactMatch

  const patternMatch = DOCUMENT_REGISTRY_PATTERNS.find((pattern) =>
    pattern.contains.every((term) => normalizedFilename.includes(term)),
  )

  if (!patternMatch) return null

  return {
    canonicalName: filename ?? normalizedFilename,
    role: patternMatch.role,
    scienceTag: patternMatch.scienceTag,
    subscienceFocus: patternMatch.subscienceFocus ?? null,
    priority: patternMatch.priority,
  }
}

export function getDocumentRegistry() {
  return DOCUMENT_REGISTRY
}

export function getDocumentRegistryBlocks(): Record<DocumentRegistryBlockName, DocumentRegistryEntry[]> {
  const sortByPriority = (entries: DocumentRegistryEntry[]) =>
    [...entries].sort((a, b) => b.priority - a.priority)

  return {
    astrologie: sortByPriority(DOCUMENT_REGISTRY.filter((entry) => entry.scienceTag === 'astrolex')),
    human_design: sortByPriority(DOCUMENT_REGISTRY.filter((entry) => entry.scienceTag === 'human_design')),
    enneagramme: sortByPriority(DOCUMENT_REGISTRY.filter((entry) => entry.scienceTag === 'enneagramme')),
    neurokua: sortByPriority(DOCUMENT_REGISTRY.filter((entry) => entry.scienceTag === 'neurokua')),
    numerologie: sortByPriority(DOCUMENT_REGISTRY.filter((entry) => entry.scienceTag === 'numerologie')),
    kua: sortByPriority(DOCUMENT_REGISTRY.filter((entry) => entry.scienceTag === 'kua')),
    maslow: sortByPriority(DOCUMENT_REGISTRY.filter((entry) => entry.scienceTag === 'maslow')),
    ks_fusion_globaux: sortByPriority(
      DOCUMENT_REGISTRY.filter((entry) => entry.scienceTag === 'global' || entry.scienceTag === 'transverse'),
    ),
  }
}
