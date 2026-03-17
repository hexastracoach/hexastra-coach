export type KsModuleCategory =
  | 'analysis'
  | 'fusion'
  | 'security'
  | 'translation'
  | 'registry'
  | 'bridge'

export type KsSubmoduleContract = {
  key: string
  category: KsModuleCategory
  purpose: string
  inputType: string
  outputType: string
  dependencies: string[]
  priority: 'high' | 'medium' | 'low'
  executionStrategy?: 'api_first' | 'module_first' | 'support'
}

export const KS_SUBMODULE_REGISTRY: Record<string, KsSubmoduleContract> = {
  'KS.StateActivation': {
    key: 'KS.StateActivation',
    category: 'analysis',
    purpose: "Identifier l'etat interieur dominant et les signaux d'activation utiles.",
    inputType: 'user_state_context',
    outputType: 'state_activation_signal',
    dependencies: ['KS.NeuroKua.System.V1'],
    priority: 'high',
  },
  'KS.InnerStateReader': {
    key: 'KS.InnerStateReader',
    category: 'analysis',
    purpose: 'Lire les desequilibres, surcharges et besoins de regulation.',
    inputType: 'birth_profile_or_state_snapshot',
    outputType: 'inner_state_signal',
    dependencies: ['KS.NEUROSOMA'],
    priority: 'high',
  },
  'KS.ActionTranslator': {
    key: 'KS.ActionTranslator',
    category: 'translation',
    purpose: 'Transformer une lecture en action simple, concrete et applicable.',
    inputType: 'dominant_signal_bundle',
    outputType: 'practical_adjustment',
    dependencies: ['KS.Q-INCARNATIO.V1'],
    priority: 'high',
  },
  'KS.VoiceModulation': {
    key: 'KS.VoiceModulation',
    category: 'translation',
    purpose: 'Adapter le ton narratif pour reduire la surcharge et garder la clarte.',
    inputType: 'stress_or_overload_signal',
    outputType: 'regulated_narrative_hint',
    dependencies: ['KS.SENTINEL'],
    priority: 'medium',
  },
  'KS.Planetarium': {
    key: 'KS.Planetarium',
    category: 'analysis',
    purpose: 'Extraire les dominantes planetaires, vitesses, dignites et pressions majeures.',
    inputType: 'birth_or_transit_chart',
    outputType: 'planetary_dominance_signal',
    dependencies: ['KS.ASTROLEX.V1'],
    priority: 'high',
  },
  'KS.Domus': {
    key: 'KS.Domus',
    category: 'analysis',
    purpose: 'Cartographier les maisons actives, sensibles ou sous tension.',
    inputType: 'house_distribution',
    outputType: 'life_zone_activation_signal',
    dependencies: ['KS.Planetarium'],
    priority: 'high',
  },
  'KS.Aspectum': {
    key: 'KS.Aspectum',
    category: 'analysis',
    purpose: 'Lire les aspects dominants et les tensions relationnelles entre facteurs.',
    inputType: 'planetary_aspects',
    outputType: 'aspect_tension_signal',
    dependencies: ['KS.Planetarium'],
    priority: 'high',
  },
  'KS.Nodus': {
    key: 'KS.Nodus',
    category: 'analysis',
    purpose: 'Evaluer les noeuds, points karmiques et axes de direction.',
    inputType: 'nodal_map',
    outputType: 'directional_axis_signal',
    dependencies: ['KS.ASTROLEX.V1'],
    priority: 'medium',
  },
  'KS.Transitus': {
    key: 'KS.Transitus',
    category: 'analysis',
    purpose: 'Lire la phase en cours, le timing et les activations transitaires.',
    inputType: 'transit_chart',
    outputType: 'timing_window_signal',
    dependencies: ['KS.Planetarium', 'KS.Aspectum'],
    priority: 'high',
  },
  'KS.AethericMap': {
    key: 'KS.AethericMap',
    category: 'bridge',
    purpose: 'Reconnecter les activations astrales a une lecture globale HexAstra.',
    inputType: 'astro_signal_bundle',
    outputType: 'integrated_astro_signal',
    dependencies: ['KS.Planetarium', 'KS.Domus', 'KS.Aspectum'],
    priority: 'medium',
  },
  'KS.SyncBridge.Astro': {
    key: 'KS.SyncBridge.Astro',
    category: 'bridge',
    purpose: 'Synchroniser les sorties Astrolex avec la fusion multidimensionnelle.',
    inputType: 'astro_signal_bundle',
    outputType: 'fusion_ready_astro_signal',
    dependencies: ['KS.AethericMap'],
    priority: 'medium',
  },
  'KS.Vocalis': {
    key: 'KS.Vocalis',
    category: 'analysis',
    purpose: "Lire les signatures d'expression et les appuis naturels d'incarnation.",
    inputType: 'expression_signature',
    outputType: 'expression_pattern_signal',
    dependencies: ['KS.PORTEUM.V1'],
    priority: 'medium',
  },
  'KS.DeconditioMap': {
    key: 'KS.DeconditioMap',
    category: 'analysis',
    purpose: 'Identifier les couches de conditionnement et les frottements recurrents.',
    inputType: 'conditioning_profile',
    outputType: 'conditioning_tension_signal',
    dependencies: ['KS.PORTEUM.V1'],
    priority: 'high',
  },
  'KS.PolarityMap': {
    key: 'KS.PolarityMap',
    category: 'analysis',
    purpose: 'Cartographier les polarites internes utiles pour les arbitrages.',
    inputType: 'incarnation_profile',
    outputType: 'polarity_balance_signal',
    dependencies: ['KS.PORTEUM.V1'],
    priority: 'high',
  },
  'KS.ChannelMap': {
    key: 'KS.ChannelMap',
    category: 'analysis',
    purpose: 'Identifier les canaux forts, sensibles et intermittents.',
    inputType: 'channel_profile',
    outputType: 'channel_strength_signal',
    dependencies: ['KS.PORTEUM.V1'],
    priority: 'medium',
  },
  'KS.NumCore': {
    key: 'KS.NumCore',
    category: 'analysis',
    purpose: 'Extraire la signature numerique structurante et ses dominantes.',
    inputType: 'numeric_profile',
    outputType: 'numeric_core_signal',
    dependencies: ['KS.TRIANGLENUMERIS.V1'],
    priority: 'high',
  },
  'KS.NumCycle': {
    key: 'KS.NumCycle',
    category: 'analysis',
    purpose: 'Lire les cycles numeriques actifs et la temporalite utile.',
    inputType: 'numeric_cycle_map',
    outputType: 'numeric_cycle_signal',
    dependencies: ['KS.NumCore'],
    priority: 'high',
  },
  'KS.HexaNum.LinkBridge': {
    key: 'KS.HexaNum.LinkBridge',
    category: 'bridge',
    purpose: 'Raccorder les cycles numeriques au moteur HexAstra global.',
    inputType: 'numeric_signal_bundle',
    outputType: 'fusion_ready_numeric_signal',
    dependencies: ['KS.NumCore', 'KS.NumCycle'],
    priority: 'medium',
  },
  'KS.SymbolCore': {
    key: 'KS.SymbolCore',
    category: 'analysis',
    purpose: 'Extraire les symboles dominants et les marqueurs archetypaux.',
    inputType: 'symbolic_profile',
    outputType: 'archetypal_symbol_signal',
    dependencies: ['KS.SPIRITLEX.V1'],
    priority: 'medium',
  },
  'KS.ArchetypeMap': {
    key: 'KS.ArchetypeMap',
    category: 'analysis',
    purpose: 'Cartographier les archetypes dominants et les roles defensifs.',
    inputType: 'symbolic_profile',
    outputType: 'archetype_dominance_signal',
    dependencies: ['KS.SymbolCore'],
    priority: 'high',
  },
  'KS.EmotionMap': {
    key: 'KS.EmotionMap',
    category: 'analysis',
    purpose: 'Lire la dynamique emotionnelle, la tension et le mode de stress.',
    inputType: 'emotional_pattern_profile',
    outputType: 'emotional_pattern_signal',
    dependencies: ['KS.SymbolCore'],
    priority: 'high',
  },
  'KS.SpiritLex.LinkBioTotem': {
    key: 'KS.SpiritLex.LinkBioTotem',
    category: 'bridge',
    purpose: 'Relier les archetypes symboliques a des leviers incarnes utiles.',
    inputType: 'archetypal_signal_bundle',
    outputType: 'embodied_symbolic_signal',
    dependencies: ['KS.ArchetypeMap', 'KS.EmotionMap'],
    priority: 'medium',
  },
  'KS.SignalReader': {
    key: 'KS.SignalReader',
    category: 'analysis',
    purpose: "Lire les signaux directionnels, d'espace et d'orientation.",
    inputType: 'directional_context',
    outputType: 'directional_signal',
    dependencies: ['KS.HexAstra.GPS.V1'],
    priority: 'high',
  },
  'KS.PlantInterface': {
    key: 'KS.PlantInterface',
    category: 'bridge',
    purpose: "Traduire l'environnement et l'espace en ajustement concret.",
    inputType: 'environmental_signal_bundle',
    outputType: 'environmental_adjustment',
    dependencies: ['KS.SignalReader'],
    priority: 'medium',
  },
  'KS.ThemeHexAstra.V1': {
    key: 'KS.ThemeHexAstra.V1',
    category: 'translation',
    purpose: 'Composer une lecture de theme natal stable a partir du bundle astral.',
    inputType: 'integrated_birth_chart_signal',
    outputType: 'natal_reading_contract',
    dependencies: ['KS.Planetarium', 'KS.Domus', 'KS.Aspectum'],
    priority: 'high',
  },
}

export function getKsSubmoduleContract(key: string): KsSubmoduleContract | null {
  return KS_SUBMODULE_REGISTRY[key] ?? null
}

export function getKsSubmoduleContracts(keys?: string[] | null): KsSubmoduleContract[] {
  if (!Array.isArray(keys) || !keys.length) return []
  return keys
    .map((key) => getKsSubmoduleContract(key))
    .filter((entry): entry is KsSubmoduleContract => Boolean(entry))
}
