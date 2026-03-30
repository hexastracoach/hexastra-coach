import type { LayerResult } from '@/lib/hexastra/retrieval/multiLayerRetrieval'
import type { ExactDataRequest } from '@/lib/hexastra/retrieval/exactDataHintMapper'
import type { ResponseMode } from '@/lib/hexastra/orchestration/responseModes'

export type HexastraPipelineEvalExpectation = {
  requiredSciences?: string[]
  requiredSubCategories?: string[]
  oneOfSciences?: string[]
  oneOfSubCategories?: string[]
  exactDataFlags?: Array<keyof ExactDataRequest>
  topSignalSubCategories?: string[]
  topSignalSciences?: string[]
  expectedDominantScience?: string | null
  expectedDominantSubCategory?: string | null
  responseModes?: ResponseMode[]
  openingSources?: Array<'fusion' | 'exact_data' | 'retrieval'>
  openingSciences?: string[]
  openingSubCategories?: string[]
  preferNoDominant?: boolean
  preferNoOpeningDominant?: boolean
  expectExactDataPrimary?: boolean
}

export type HexastraPipelineEvalCase = {
  id: string
  label: string
  query: string
  hasBirthData?: boolean
  rawExactData?: Record<string, unknown> | null
  retrievalResults: LayerResult[]
  expectation: HexastraPipelineEvalExpectation
}

function doc(args: {
  source: string
  fileId: string
  filename: string
  text: string
  score: number
  scienceTag: LayerResult['scienceTag']
  retrievalFocus?: string
}): LayerResult {
  return {
    source: args.source,
    fileId: args.fileId,
    filename: args.filename,
    text: args.text,
    score: args.score,
    scienceTag: args.scienceTag,
    retrievalFocus: args.retrievalFocus ?? null,
  }
}

const DOC_LIBRARY = {
  astro_identity: doc({
    source: 'knowledge',
    fileId: 'astro-identity',
    filename: 'Astrologie_identite_ascendant_et_big3.pdf',
    text: 'Ascendant, big 3 et axe identitaire astrologique pour lecture directe et interpretee.',
    score: 0.83,
    scienceTag: 'astrolex',
    retrievalFocus: 'identity',
  }),
  astro_timing: doc({
    source: 'knowledge',
    fileId: 'astro-timing',
    filename: 'Transits_progressions_et_cycles_du_moment.pdf',
    text: 'Transits, progressions, retour solaire et timing astrologique de la periode actuelle.',
    score: 0.86,
    scienceTag: 'astrolex',
    retrievalFocus: 'timing',
  }),
  astro_relationship: doc({
    source: 'knowledge',
    fileId: 'astro-relationship',
    filename: 'Synastrie_et_compatibilite_astrologique.pdf',
    text: 'Synastrie, compatibilite astrologique et dynamique relationnelle de couple.',
    score: 0.81,
    scienceTag: 'astrolex',
    retrievalFocus: 'relationship',
  }),
  hd_identity: doc({
    source: 'science_focus:human_design',
    fileId: 'hd-identity',
    filename: 'Human_Design_type_profil_strategie.txt',
    text: 'Type, profil, strategie et autorite en Human Design pour lecture identitaire.',
    score: 0.85,
    scienceTag: 'human_design',
    retrievalFocus: 'identity',
  }),
  hd_timing: doc({
    source: 'science_focus:human_design',
    fileId: 'hd-timing',
    filename: 'Transits_HD_et_cycle_actuel.txt',
    text: 'Transits Human Design, energie du moment et activations du cycle actuel.',
    score: 0.79,
    scienceTag: 'human_design',
    retrievalFocus: 'timing',
  }),
  hd_relationship: doc({
    source: 'science_focus:human_design',
    fileId: 'hd-relationship',
    filename: 'Compatibilite_et_connexions_human_design.txt',
    text: 'Compatibilite Human Design, connexion energetique et dynamique de relation.',
    score: 0.8,
    scienceTag: 'human_design',
    retrievalFocus: 'relationship',
  }),
  num_identity: doc({
    source: 'knowledge',
    fileId: 'num-identity',
    filename: 'Numerologie_fondations_chemin_de_vie.pdf',
    text: 'Chemin de vie, profil numerologique et fondations identitaires.',
    score: 0.82,
    scienceTag: 'numerologie',
    retrievalFocus: 'identity',
  }),
  num_timing: doc({
    source: 'knowledge',
    fileId: 'num-timing',
    filename: 'Cycles_numerologiques_annee_personnelle.pdf',
    text: 'Annee personnelle, cycles numerologiques et timing decisionnel.',
    score: 0.84,
    scienceTag: 'numerologie',
    retrievalFocus: 'timing',
  }),
  num_relationship: doc({
    source: 'knowledge',
    fileId: 'num-relationship',
    filename: 'Compatibilite_numerologique_et_couple.pdf',
    text: 'Compatibilite numerologique et resonance relationnelle entre deux personnes.',
    score: 0.77,
    scienceTag: 'numerologie',
    retrievalFocus: 'relationship',
  }),
  kua_space: doc({
    source: 'knowledge',
    fileId: 'kua-space',
    filename: 'Kua_directions_favorables_et_habitat.pdf',
    text: 'Nombre Kua, directions favorables, orientation du lit et du bureau.',
    score: 0.85,
    scienceTag: 'kua',
    retrievalFocus: 'space',
  }),
  ennea_relationship: doc({
    source: 'knowledge',
    fileId: 'ennea-relationship',
    filename: 'Enneagramme_relation_et_compatibilite.pdf',
    text: 'Compatibilite enneagramme, mecanismes relationnels et tensions de couple.',
    score: 0.74,
    scienceTag: 'enneagramme',
    retrievalFocus: 'relationship',
  }),
  fusion_current: doc({
    source: 'ks_fusion',
    fileId: 'fusion-current',
    filename: 'Hexastra_fusion_situation_du_moment.txt',
    text: 'Lecture fusion de la situation actuelle, du blocage et de la direction a prendre.',
    score: 0.78,
    scienceTag: 'global',
    retrievalFocus: 'current_state',
  }),
  fusion_relationship: doc({
    source: 'ks_fusion',
    fileId: 'fusion-relationship',
    filename: 'Hexastra_fusion_relation_en_cours.txt',
    text: 'Lecture fusion relationnelle avec focus sur lien, compatibilite et timing.',
    score: 0.76,
    scienceTag: 'global',
    retrievalFocus: 'relationship',
  }),
} as const

function docs(...keys: Array<keyof typeof DOC_LIBRARY>): LayerResult[] {
  return keys.map((key) => ({ ...DOC_LIBRARY[key] }))
}

function astroRawIdentity(): Record<string, unknown> {
  return {
    ascendant: 'Balance',
    sun: 'Lion',
    moon: 'Cancer',
    astroProfile: {
      ascendant: 'Balance',
      sun: 'Lion',
      moon: 'Cancer',
    },
  }
}

function hdRawType(): Record<string, unknown> {
  return {
    hdProfile: {
      hdType: 'Projector',
      hdStrategy: 'Wait for the invitation',
      hdAuthority: 'Emotional',
    },
  }
}

function hdRawProfile(): Record<string, unknown> {
  return {
    hdProfile: {
      hdType: 'Projector',
      hdProfile: '3/5',
      profile: '3/5',
      hdAuthority: 'Emotional',
    },
  }
}

function numerologyRawLifePath(): Record<string, unknown> {
  return {
    numerologyProfile: {
      chemin_de_vie: 7,
      lifePath: 7,
    },
  }
}

function transitRaw(): Record<string, unknown> {
  return {
    exactData: {
      transits: {
        saturn: 'Phase de structure et de tri.',
        mars: 'Besoin d agir avec discernement.',
      },
    },
  }
}

function solarReturnRaw(): Record<string, unknown> {
  return {
    exactData: {
      solar_return: {
        annual_theme: 'Recentrage sur le cap personnel.',
        emphasis: 'Visibilite et responsabilite.',
      },
    },
  }
}

function progressionsAliasRaw(): Record<string, unknown> {
  return {
    progressions: {
      secondary_progressions: {
        moon: 'Nouvelle maturation emotionnelle.',
      },
    },
  }
}

function numerologyCyclesRaw(): Record<string, unknown> {
  return {
    exactData: {
      numerology_cycles: {
        yearly: {
          personalYearNumber: 6,
        },
        monthly: {
          personalMonthNumber: 4,
        },
      },
    },
  }
}

function kuaDirectionsRaw(): Record<string, unknown> {
  return {
    exactData: {
      kua_directions: {
        kua_number: 4,
        favorable_directions: ['SE', 'E', 'N'],
        unfavorable_directions: ['W'],
        bed_orientation: 'SE',
        desk_orientation: 'E',
      },
    },
  }
}

function hdTransitRaw(): Record<string, unknown> {
  return {
    exactData: {
      human_design_transits: {
        active_gates: ['57', '34'],
        current_cycle: 'Listening before acting.',
      },
    },
  }
}

function multiTimingRaw(): Record<string, unknown> {
  return {
    publicSummary: 'Le moment present demande de ralentir, prioriser et choisir un axe clair.',
    exactData: {
      transits: {
        saturn: 'Tri et responsabilisation.',
      },
      human_design_transits: {
        current_cycle: 'Attendre le bon signal corporel.',
      },
      numerology_cycles: {
        yearly: {
          personalYearNumber: 6,
        },
      },
      kua_directions: {
        favorable_directions: ['SE', 'E'],
      },
    },
  }
}

export const HEXASTRA_PIPELINE_EVAL_CASES: HexastraPipelineEvalCase[] = [
  {
    id: 'direct_ascendant',
    label: 'Direct knowledge - mon ascendant',
    query: 'mon ascendant',
    rawExactData: astroRawIdentity(),
    retrievalResults: docs('astro_identity', 'fusion_current'),
    expectation: {
      requiredSciences: ['astro'],
      requiredSubCategories: ['astro_sign_rising'],
      topSignalSubCategories: ['astro_sign_rising'],
      expectedDominantScience: 'astro',
      expectedDominantSubCategory: 'astro_sign_rising',
      responseModes: ['calculated_reading'],
      expectExactDataPrimary: true,
    },
  },
  {
    id: 'direct_hd_type',
    label: 'Direct knowledge - mon type hd',
    query: 'mon type hd',
    rawExactData: hdRawType(),
    retrievalResults: docs('hd_identity', 'fusion_current'),
    expectation: {
      requiredSciences: ['human_design'],
      requiredSubCategories: ['hd_type'],
      topSignalSubCategories: ['hd_type'],
      expectedDominantScience: 'human_design',
      expectedDominantSubCategory: 'hd_type',
      responseModes: ['calculated_reading'],
      openingSources: ['exact_data'],
      openingSciences: ['human_design'],
      openingSubCategories: ['hd_type'],
      expectExactDataPrimary: true,
    },
  },
  {
    id: 'direct_hd_profile',
    label: 'Direct knowledge - mon profil human design',
    query: 'mon profil human design',
    rawExactData: hdRawProfile(),
    retrievalResults: docs('hd_identity', 'fusion_current'),
    expectation: {
      requiredSciences: ['human_design'],
      requiredSubCategories: ['hd_profile'],
      topSignalSubCategories: ['hd_profile'],
      expectedDominantScience: 'human_design',
      expectedDominantSubCategory: 'hd_profile',
      responseModes: ['calculated_reading'],
      expectExactDataPrimary: true,
    },
  },
  {
    id: 'direct_life_path',
    label: 'Direct knowledge - mon chemin de vie',
    query: 'mon chemin de vie',
    rawExactData: numerologyRawLifePath(),
    retrievalResults: docs('num_identity', 'fusion_current'),
    expectation: {
      requiredSciences: ['numerology'],
      requiredSubCategories: ['num_life_path'],
      topSignalSubCategories: ['num_life_path'],
      expectedDominantScience: 'numerology',
      expectedDominantSubCategory: 'num_life_path',
      responseModes: ['calculated_reading'],
      expectExactDataPrimary: true,
    },
  },
  {
    id: 'direct_kua_number',
    label: 'Direct knowledge - mon nombre kua',
    query: 'mon nombre kua',
    rawExactData: kuaDirectionsRaw(),
    retrievalResults: docs('kua_space', 'fusion_current'),
    expectation: {
      requiredSciences: ['kua'],
      requiredSubCategories: ['kua_number'],
      exactDataFlags: ['includeKuaDirections'],
      topSignalSubCategories: ['kua_number'],
      expectedDominantScience: 'kua',
      expectedDominantSubCategory: 'kua_number',
      responseModes: ['calculated_reading'],
      expectExactDataPrimary: true,
    },
  },
  {
    id: 'timing_transits',
    label: 'Timing - mes transits actuels',
    query: 'mes transits actuels',
    rawExactData: transitRaw(),
    retrievalResults: docs('astro_timing', 'num_timing', 'fusion_current'),
    expectation: {
      requiredSciences: ['astro'],
      requiredSubCategories: ['astro_transits_current'],
      exactDataFlags: ['includeTransits'],
      topSignalSubCategories: ['astro_transits_current'],
      expectedDominantScience: 'astro',
      expectedDominantSubCategory: 'astro_transits_current',
      responseModes: ['concise_fusion_answer'],
      expectExactDataPrimary: true,
    },
  },
  {
    id: 'timing_solar_return',
    label: 'Timing - mon retour solaire',
    query: 'mon retour solaire',
    rawExactData: solarReturnRaw(),
    retrievalResults: docs('astro_timing', 'fusion_current'),
    expectation: {
      requiredSciences: ['astro'],
      requiredSubCategories: ['astro_solar_return'],
      exactDataFlags: ['includeSolarReturn'],
      topSignalSubCategories: ['astro_solar_return'],
      expectedDominantScience: 'astro',
      expectedDominantSubCategory: 'astro_solar_return',
      responseModes: ['concise_fusion_answer'],
      openingSources: ['exact_data'],
      openingSciences: ['astro'],
      openingSubCategories: ['astro_solar_return'],
      expectExactDataPrimary: true,
    },
  },
  {
    id: 'timing_progressions',
    label: 'Timing - mes progressions',
    query: 'mes progressions',
    rawExactData: progressionsAliasRaw(),
    retrievalResults: docs('astro_timing', 'fusion_current'),
    expectation: {
      requiredSciences: ['astro'],
      requiredSubCategories: ['astro_progressions'],
      exactDataFlags: ['includeProgressions'],
      topSignalSubCategories: ['astro_progressions'],
      expectedDominantScience: 'astro',
      expectedDominantSubCategory: 'astro_progressions',
      responseModes: ['concise_fusion_answer'],
      openingSources: ['exact_data'],
      openingSciences: ['astro'],
      openingSubCategories: ['astro_progressions'],
      expectExactDataPrimary: true,
    },
  },
  {
    id: 'timing_personal_year',
    label: 'Timing - mon annee perso',
    query: 'mon annee perso',
    rawExactData: numerologyCyclesRaw(),
    retrievalResults: docs('num_timing', 'fusion_current'),
    expectation: {
      requiredSciences: ['numerology'],
      requiredSubCategories: ['num_personal_year'],
      exactDataFlags: ['includeNumerologyCycles'],
      topSignalSubCategories: ['num_personal_year'],
      expectedDominantScience: 'numerology',
      expectedDominantSubCategory: 'num_personal_year',
      responseModes: ['concise_fusion_answer'],
      openingSources: ['exact_data'],
      openingSciences: ['numerology'],
      openingSubCategories: ['num_personal_year'],
      expectExactDataPrimary: true,
    },
  },
  {
    id: 'timing_current_cycle',
    label: 'Timing - mon cycle actuel',
    query: 'mon cycle actuel',
    rawExactData: multiTimingRaw(),
    retrievalResults: docs('astro_timing', 'hd_timing', 'num_timing', 'fusion_current'),
    expectation: {
      requiredSciences: ['fusion'],
      oneOfSciences: ['astro', 'human_design', 'numerology'],
      oneOfSubCategories: ['fusion_timing', 'astro_transits_current', 'num_personal_year', 'hd_current_cycle'],
      exactDataFlags: ['includeTransits', 'includeHumanDesignTransits', 'includeNumerologyCycles'],
      topSignalSubCategories: ['astro_transits_current', 'num_personal_year', 'hd_current_cycle', 'fusion_timing'],
      responseModes: ['concise_fusion_answer'],
      preferNoDominant: true,
    },
  },
  {
    id: 'relationship_compatibility_generic',
    label: 'Relationnel - ma compatibilite',
    query: 'ma compatibilite',
    rawExactData: null,
    retrievalResults: docs('astro_relationship', 'hd_relationship', 'num_relationship', 'ennea_relationship', 'fusion_relationship'),
    expectation: {
      oneOfSciences: ['astro', 'human_design', 'numerology', 'enneagram'],
      oneOfSubCategories: ['astro_synastry', 'hd_connection_dynamics', 'num_relationship_compatibility', 'ennea_relationship_dynamics'],
      topSignalSciences: ['astro', 'human_design', 'numerology', 'enneagram'],
      responseModes: ['concise_fusion_answer'],
      preferNoDominant: true,
    },
  },
  {
    id: 'relationship_compatibility_astro',
    label: 'Relationnel - compatibilite astrologique',
    query: 'compatibilite astrologique',
    rawExactData: null,
    retrievalResults: docs('astro_relationship', 'fusion_relationship'),
    expectation: {
      requiredSciences: ['astro'],
      requiredSubCategories: ['astro_synastry'],
      topSignalSubCategories: ['astro_synastry'],
      expectedDominantScience: 'astro',
      expectedDominantSubCategory: 'astro_synastry',
      responseModes: ['concise_fusion_answer'],
    },
  },
  {
    id: 'relationship_compatibility_hd',
    label: 'Relationnel - compatibilite human design',
    query: 'compatibilite human design',
    rawExactData: null,
    retrievalResults: docs('hd_relationship', 'fusion_relationship'),
    expectation: {
      requiredSciences: ['human_design'],
      requiredSubCategories: ['hd_connection_dynamics'],
      topSignalSubCategories: ['hd_connection_dynamics'],
      expectedDominantScience: 'human_design',
      expectedDominantSubCategory: 'hd_connection_dynamics',
      responseModes: ['concise_fusion_answer'],
    },
  },
  {
    id: 'relationship_current',
    label: 'Relationnel - relation en ce moment',
    query: 'relation en ce moment',
    rawExactData: {
      publicSummary: 'Une dynamique relationnelle se clarifie mais demande du recul.',
      ...transitRaw(),
    },
    retrievalResults: docs('fusion_relationship', 'astro_relationship', 'astro_timing'),
    expectation: {
      requiredSciences: ['fusion'],
      oneOfSubCategories: ['fusion_relationships', 'astro_transits_relationships', 'astro_transits_current'],
      topSignalSubCategories: ['fusion_relationships', 'astro_transits_relationships', 'astro_transits_current'],
      responseModes: ['concise_fusion_answer'],
    },
  },
  {
    id: 'decision_now',
    label: 'Decision - que dois-je faire maintenant',
    query: 'que dois-je faire maintenant',
    rawExactData: multiTimingRaw(),
    retrievalResults: docs('fusion_current', 'astro_timing', 'hd_timing', 'num_timing'),
    expectation: {
      requiredSciences: ['fusion'],
      oneOfSubCategories: ['fusion_decision', 'hd_strategy', 'num_decision_timing', 'astro_transits_timing'],
      exactDataFlags: ['includeTransits', 'includeNumerologyCycles'],
      topSignalSubCategories: ['fusion_decision', 'hd_strategy', 'num_decision_timing', 'astro_transits_timing'],
      responseModes: ['concise_fusion_answer'],
    },
  },
  {
    id: 'decision_blocked_now',
    label: 'Decision - pourquoi je bloque en ce moment',
    query: 'pourquoi je bloque en ce moment',
    rawExactData: multiTimingRaw(),
    retrievalResults: docs('fusion_current', 'astro_timing', 'hd_timing'),
    expectation: {
      requiredSciences: ['fusion'],
      oneOfSubCategories: ['fusion_general', 'fusion_timing', 'astro_transits_current', 'hd_current_cycle'],
      topSignalSubCategories: ['fusion_general', 'fusion_timing', 'astro_transits_current', 'hd_current_cycle'],
      responseModes: ['concise_fusion_answer'],
    },
  },
  {
    id: 'decision_direction',
    label: 'Decision - quelle direction prendre',
    query: 'quelle direction prendre',
    rawExactData: multiTimingRaw(),
    retrievalResults: docs('fusion_current', 'kua_space', 'num_timing'),
    expectation: {
      requiredSciences: ['fusion'],
      oneOfSubCategories: ['fusion_decision', 'kua_favorable_directions', 'kua_decision_direction'],
      topSignalSubCategories: ['fusion_decision', 'kua_favorable_directions', 'kua_decision_direction'],
      responseModes: ['concise_fusion_answer'],
    },
  },
  {
    id: 'decision_current_state',
    label: 'Decision - que se passe-t-il pour moi en ce moment',
    query: 'que se passe-t-il pour moi en ce moment',
    rawExactData: multiTimingRaw(),
    retrievalResults: docs('fusion_current', 'astro_timing', 'hd_timing', 'num_timing'),
    expectation: {
      requiredSciences: ['fusion'],
      oneOfSubCategories: ['fusion_general', 'fusion_timing', 'astro_transits_current'],
      topSignalSubCategories: ['fusion_general', 'fusion_timing', 'astro_transits_current'],
      expectedDominantScience: 'fusion',
      responseModes: ['concise_fusion_answer'],
      openingSources: ['exact_data', 'fusion'],
      openingSciences: ['fusion', 'astro', 'human_design', 'numerology'],
      openingSubCategories: ['fusion_general', 'fusion_timing', 'fusion_life_situation', 'astro_transits_current', 'hd_current_cycle', 'num_personal_year'],
    },
  },
  {
    id: 'energy_current',
    label: 'Energie - mon energie actuelle',
    query: 'mon energie actuelle',
    rawExactData: {
      exactData: {
        transits: {
          saturn: 'Phase de structure et de tri.',
          mars: 'Besoin d agir avec discernement.',
        },
        human_design_transits: {
          active_gates: ['57', '34'],
          current_cycle: 'Listening before acting.',
        },
      },
    },
    retrievalResults: docs('astro_timing', 'hd_timing', 'fusion_current'),
    expectation: {
      oneOfSciences: ['astro', 'human_design'],
      oneOfSubCategories: ['astro_transits_energy', 'astro_transits_current', 'hd_current_transits'],
      exactDataFlags: ['includeTransits'],
      topSignalSubCategories: ['astro_transits_energy', 'astro_transits_current', 'hd_current_transits'],
      responseModes: ['concise_fusion_answer'],
      openingSources: ['exact_data'],
      openingSciences: ['astro', 'human_design'],
      openingSubCategories: ['astro_transits_energy', 'astro_transits_current', 'hd_current_transits'],
    },
  },
  {
    id: 'energy_what_i_am_crossing',
    label: 'Energie - qu est-ce que je traverse',
    query: "qu'est-ce que je traverse",
    rawExactData: multiTimingRaw(),
    retrievalResults: docs('fusion_current', 'astro_timing', 'num_timing'),
    expectation: {
      requiredSciences: ['fusion'],
      oneOfSubCategories: ['fusion_general', 'fusion_timing', 'astro_transits_current'],
      topSignalSubCategories: ['fusion_general', 'fusion_timing', 'astro_transits_current'],
      responseModes: ['concise_fusion_answer'],
      openingSources: ['exact_data', 'fusion'],
      openingSciences: ['fusion', 'astro'],
      openingSubCategories: ['fusion_life_situation', 'fusion_general', 'fusion_timing', 'astro_transits_current'],
    },
  },
  {
    id: 'energy_good_period',
    label: 'Energie - suis-je dans une bonne periode',
    query: 'suis-je dans une bonne periode',
    rawExactData: multiTimingRaw(),
    retrievalResults: docs('fusion_current', 'astro_timing', 'num_timing'),
    expectation: {
      requiredSciences: ['fusion'],
      oneOfSubCategories: ['fusion_timing', 'astro_transits_timing', 'num_personal_year'],
      topSignalSubCategories: ['fusion_timing', 'astro_transits_timing', 'num_personal_year'],
      responseModes: ['concise_fusion_answer'],
    },
  },
  {
    id: 'kua_favorable_directions',
    label: 'Kua - mes directions favorables',
    query: 'mes directions favorables',
    rawExactData: kuaDirectionsRaw(),
    retrievalResults: docs('kua_space', 'fusion_current'),
    expectation: {
      requiredSciences: ['kua'],
      requiredSubCategories: ['kua_favorable_directions'],
      exactDataFlags: ['includeKuaDirections'],
      topSignalSubCategories: ['kua_favorable_directions'],
      expectedDominantScience: 'kua',
      expectedDominantSubCategory: 'kua_favorable_directions',
      responseModes: ['calculated_reading'],
      openingSources: ['exact_data'],
      openingSciences: ['kua'],
      openingSubCategories: ['kua_favorable_directions'],
      expectExactDataPrimary: true,
    },
  },
  {
    id: 'kua_bed_orientation',
    label: 'Kua - orientation de mon lit',
    query: 'orientation de mon lit',
    rawExactData: kuaDirectionsRaw(),
    retrievalResults: docs('kua_space', 'fusion_current'),
    expectation: {
      requiredSciences: ['kua'],
      requiredSubCategories: ['kua_bed_orientation'],
      exactDataFlags: ['includeKuaDirections'],
      topSignalSubCategories: ['kua_bed_orientation'],
      expectedDominantScience: 'kua',
      expectedDominantSubCategory: 'kua_bed_orientation',
      responseModes: ['concise_fusion_answer'],
      expectExactDataPrimary: true,
    },
  },
  {
    id: 'kua_desk_orientation',
    label: 'Kua - ou placer mon bureau',
    query: 'ou placer mon bureau',
    rawExactData: kuaDirectionsRaw(),
    retrievalResults: docs('kua_space', 'fusion_current'),
    expectation: {
      requiredSciences: ['kua'],
      requiredSubCategories: ['kua_desk_orientation'],
      exactDataFlags: ['includeKuaDirections'],
      topSignalSubCategories: ['kua_desk_orientation'],
      expectedDominantScience: 'kua',
      expectedDominantSubCategory: 'kua_desk_orientation',
      responseModes: ['concise_fusion_answer'],
      expectExactDataPrimary: true,
    },
  },
  {
    id: 'ambiguous_type',
    label: 'Ambigu - mon type',
    query: 'mon type',
    rawExactData: null,
    retrievalResults: docs('hd_identity', 'ennea_relationship', 'fusion_current'),
    expectation: {
      requiredSciences: ['human_design', 'enneagram'],
      requiredSubCategories: ['hd_type', 'ennea_type_core'],
      topSignalSciences: ['human_design', 'enneagram'],
      preferNoDominant: true,
      preferNoOpeningDominant: true,
    },
  },
]
