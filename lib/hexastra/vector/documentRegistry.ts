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

type DocumentRegistryPattern = {
  contains: string[]
  role: DocumentRole
  scienceTag: DocumentScienceTag
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
    priority: 100,
  },
  {
    canonicalName: 'PROMPT_PORTEUM.txt',
    role: 'sciencePrompt',
    scienceTag: 'human_design',
    priority: 100,
  },
  {
    canonicalName: '9 - prompt_Neurokua_system.txt',
    aliases: ['prompt_Neurokua_system.txt'],
    role: 'sciencePrompt',
    scienceTag: 'neurokua',
    priority: 100,
  },
  {
    canonicalName: 'PROMPT_NEUROSOMA.txt',
    role: 'sciencePrompt',
    scienceTag: 'neurokua',
    priority: 95,
  },
  {
    canonicalName: 'PROMPT_GPS.txt',
    role: 'sciencePrompt',
    scienceTag: 'kua',
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
    canonicalName: 'The_Complete_Book_of_Numerology.pdf',
    role: 'referenceBook',
    scienceTag: 'numerologie',
    priority: 70,
  },
  {
    canonicalName: '628462363-Numerology-and-the-Divine-Triangle.pdf',
    role: 'referenceBook',
    scienceTag: 'numerologie',
    priority: 68,
  },
  {
    canonicalName: 'Chiron And The Healing Journey PDF.pdf',
    role: 'referenceBook',
    scienceTag: 'astrolex',
    priority: 66,
  },
  {
    canonicalName: 'La+charte.pdf',
    aliases: ['La charte.pdf'],
    role: 'referenceBook',
    scienceTag: 'astrolex',
    priority: 64,
  },
  {
    canonicalName: "LA+STRUCTURE+D'UNE+CHARTE.pdf",
    aliases: ["LA STRUCTURE D'UNE CHARTE.pdf"],
    role: 'referenceBook',
    scienceTag: 'astrolex',
    priority: 64,
  },
  {
    canonicalName: 'ORIGINE+ET+DÉFINITION.pdf',
    aliases: ['ORIGINE ET DEFINITION.pdf'],
    role: 'referenceBook',
    scienceTag: 'astrolex',
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
    priority: 68,
  },
  {
    canonicalName: 'Vivre de son desgin Humain.pdf',
    aliases: ['Vivre de son design Humain.pdf'],
    role: 'referenceBook',
    scienceTag: 'human_design',
    priority: 66,
  },
  {
    canonicalName: '497772727-SDH-systeme-du-design-humain-Les-CroixdIncarnation.pdf',
    aliases: ['497772727 SDH systeme du design humain Les CroixdIncarnation.pdf'],
    role: 'referenceBook',
    scienceTag: 'human_design',
    priority: 65,
  },
  {
    canonicalName: 'Hypothèse NeuroKua™ Par Nseku kimia.pdf',
    aliases: ['Hypothese NeuroKua Par Nseku kimia.pdf'],
    role: 'referenceBook',
    scienceTag: 'neurokua',
    priority: 68,
  },
  {
    canonicalName: 'KS.NeuroKua.Synesthesia.V1 Architecture officielle.pdf',
    role: 'referenceBook',
    scienceTag: 'neurokua',
    priority: 67,
  },
  {
    canonicalName: 'MANIFESTE — NEUROKUA™.pdf',
    aliases: ['MANIFESTE NEUROKUA.pdf'],
    role: 'referenceBook',
    scienceTag: 'neurokua',
    priority: 66,
  },
  {
    canonicalName: 'NeuroKua™ _ ce que ça représente pour toi.pdf',
    aliases: ['NeuroKua ce que ca represente pour toi.pdf'],
    role: 'referenceBook',
    scienceTag: 'neurokua',
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
    priority: 94,
  },
  {
    contains: ['enneagram'],
    role: 'referenceBook',
    scienceTag: 'enneagramme',
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
    priority: patternMatch.priority,
  }
}

export function getDocumentRegistry() {
  return DOCUMENT_REGISTRY
}
