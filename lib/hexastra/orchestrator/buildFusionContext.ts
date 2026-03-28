/**
 * buildFusionContext — Hexastra Coach
 *
 * Construit un CONTEXTE DE FUSION orienté à partir de l'intent et de la payload /chart/fusion.
 *
 * Contrairement à buildFusionProfileBlock (générique), cette fonction :
 * 1. Reçoit l'intent classifié
 * 2. Consulte le mapping intentFieldMapping pour savoir quels champs extraire
 * 3. Extrait UNIQUEMENT les champs pertinents de la payload brute
 * 4. Applique les pénalités heuristiques (ex: ennéagramme heuristique → poids réduit)
 * 5. Retourne un objet structuré, trié, prêt pour l'arbitrage
 *
 * Le modèle ne reçoit jamais la payload brute — il reçoit ce contexte déjà orienté.
 */

import { buildCompactNatalReadingContext } from '@/lib/hexastra/guards/exactDataGuard'
import { buildCompactHumanDesignContext } from '@/lib/humandesign/compactContext'
import { getIntentFieldMap, type IntentFieldMap, type IntentModule } from './intentFieldMapping'

// ── Types ──────────────────────────────────────────────────────────────────────

/**
 * Résultat de l'arbitrage des signaux.
 * Défini ici pour éviter la dépendance circulaire avec arbitrateFusionSignals.ts.
 */
export type FusionArbitration = {
  // ── Dynamiques ──────────────────────────────────────────────────────────────
  /** Dynamique principale — le signal le plus fort pour cet intent */
  dominantDynamic: string
  /** Dynamique secondaire — second signal significatif */
  secondaryDynamic: string
  /** Mécanisme central — le pourquoi de la dynamique */
  mainBlock: string
  /** Décalage intérieur/extérieur — tension principale */
  innerOuterGap: string
  /** Action prioritaire adaptée au profil */
  priorityAction: string
  /** Signaux de support (max 3) */
  supportPoints: string[]
  // ── Patterns contextuels ────────────────────────────────────────────────────
  /** Comment cette personne décide (HD authority + logique) */
  decisionStyle: string
  /** Pattern relationnel dominant (HD type + Vénus/Lune) */
  relationalPattern: string
  /** Dynamique énergétique (HD type + dominantes astro) */
  energyPattern: string
  // ── Meta ────────────────────────────────────────────────────────────────────
  dominantModule: string
  signalConfidence: number
  /** Intent/type de question qui a généré cet arbitrage */
  questionType: string
  // ── Traçabilité ─────────────────────────────────────────────────────────────
  /** Champs API effectivement utilisés (module.field) */
  usedFields: string[]
  /** Champs présents dans le mapping mais absents du payload */
  ignoredFields: string[]
  /** Poids effectifs appliqués par module */
  weightsApplied: Partial<Record<string, number>>
  /** Fiabilité par module (true = disponible et pondéré) */
  reliabilitySummary: Partial<Record<string, boolean>>
}

export type FusionModuleData = {
  available: boolean
  /** Poids effectif (0–1) après application des pénalités heuristiques */
  weight: number
  /** Champs extraits et leur valeur */
  fields: Record<string, string | number | string[] | null>
  /** Vrai si les données sont heuristiques (moins fiables) */
  isHeuristic?: boolean
}

export type FusionContext = {
  intent: string
  readingAngle: string
  readingQuestion: string
  modulesActivated: IntentModule[]
  dominantModule: IntentModule
  modules: {
    astrology: FusionModuleData
    human_design: FusionModuleData
    numerology: FusionModuleData
    enneagram: FusionModuleData
    kua: FusionModuleData
  }
  /** 0–1 : proportion des champs attendus qui ont été trouvés */
  completeness: number
  /** 0–1 : confiance globale dans la lecture (poids × couverture champs × pénalités) */
  fusionConfidence: number
  /** Confiance par module (0–1), uniquement pour les modules actifs */
  confidenceBreakdown: Partial<Record<IntentModule, number>>
  warnings: string[]
  mapping: IntentFieldMap
}

// ── Extracteurs par module ─────────────────────────────────────────────────────

function extractAstroFields(
  raw: Record<string, unknown>,
  fields: string[],
): Record<string, string | number | string[] | null> {
  try {
    const ctx = buildCompactNatalReadingContext(raw, 2000)
    const available: Record<string, unknown> = {
      sunSign: ctx.sunSign,
      moonSign: ctx.moonSign,
      risingSign: ctx.risingSign,
      mercurySign: ctx.mercurySign,
      venusSign: ctx.venusSign,
      marsSign: ctx.marsSign,
      jupiterSign: ctx.jupiterSign,
      saturnSign: ctx.saturnSign,
      sunDegree: ctx.sunDegree,
      dominantElements: ctx.dominantElements?.length ? ctx.dominantElements : null,
      dominantModalities: ctx.dominantModalities?.length ? ctx.dominantModalities : null,
      stelliums: ctx.stelliums?.length ? ctx.stelliums : null,
      keyAspects: ctx.keyAspects?.length ? ctx.keyAspects : null,
      dominantSigns: ctx.dominantSigns?.length ? ctx.dominantSigns : null,
    }
    const result: Record<string, string | number | string[] | null> = {}
    for (const field of fields) {
      const v = available[field]
      if (v !== undefined && v !== null) {
        result[field] = v as string | number | string[] | null
      }
    }
    return result
  } catch {
    return {}
  }
}

function extractHDFields(
  raw: Record<string, unknown>,
  fields: string[],
): Record<string, string | null> {
  try {
    const ctx = buildCompactHumanDesignContext(raw)
    if (!ctx) return {}
    const available: Record<string, unknown> = {
      hdType: ctx.hdType,
      hdProfile: ctx.hdProfile,
      hdAuthority: ctx.hdAuthority,
      hdStrategy: ctx.hdStrategy,
      hdDefinition: ctx.hdDefinition,
      hdIncarnationCross: ctx.hdIncarnationCross,
      hdDefinedCenters: ctx.hdDefinedCenters?.length ? ctx.hdDefinedCenters.join(', ') : null,
      hdOpenCenters: ctx.hdOpenCenters?.length ? ctx.hdOpenCenters.join(', ') : null,
    }
    const result: Record<string, string | null> = {}
    for (const field of fields) {
      const v = available[field]
      if (v !== undefined && v !== null) {
        result[field] = v as string | null
      }
    }
    return result
  } catch {
    return {}
  }
}

function mergeNested(raw: Record<string, unknown>, ...keys: string[]): Record<string, unknown> {
  const merged: Record<string, unknown> = {}
  for (const key of keys) {
    const nested = raw[key]
    if (nested && typeof nested === 'object') Object.assign(merged, nested)
  }
  Object.assign(merged, raw)
  return merged
}

function findValue(src: Record<string, unknown>, ...aliases: string[]): string | number | null {
  for (const alias of aliases) {
    const v = src[alias]
    if (v !== undefined && v !== null && v !== '') return v as string | number
  }
  return null
}

function extractNumerologyFields(
  raw: Record<string, unknown>,
  fields: string[],
): Record<string, string | number | null> {
  const src = mergeNested(raw, 'numerology', 'numerologie', 'numbers')
  const ALIASES: Record<string, string[]> = {
    lifePath: ['chemin_de_vie', 'life_path', 'lifePath', 'lifePathNumber', 'cheminVie'],
    expression: ['expression', 'expression_number', 'expressionNumber'],
    soul: ['ame', 'soul', 'soul_number', 'soulNumber'],
    personality: ['personnalite_num', 'personality', 'personality_number'],
    personalYear: ['annee_personnelle', 'personal_year', 'personalYear'],
    personalMonth: ['mois_personnel', 'personal_month', 'personalMonth'],
  }
  const result: Record<string, string | number | null> = {}
  for (const field of fields) {
    const aliases = ALIASES[field]
    if (aliases) {
      const value = findValue(src, ...aliases)
      if (value !== null) result[field] = value
    }
  }
  return result
}

function extractEnneagramFields(
  raw: Record<string, unknown>,
  fields: string[],
): { data: Record<string, string | number | null>; isHeuristic: boolean } {
  const src = mergeNested(raw, 'enneagram', 'enneagramme')
  const ALIASES: Record<string, string[]> = {
    enneagramType: ['type_enn', 'type', 'enneagram_type'],
    enneagramWing: ['aile_enn', 'wing', 'enneagram_wing', 'aile'],
    instinct: ['instinct_enn', 'instinct', 'instinctual_variant'],
    fear: ['peur', 'fear', 'core_fear'],
    desire: ['desir', 'desire', 'core_desire'],
  }
  const isHeuristic = Boolean(src['is_heuristic'] ?? src['heuristic'])
  const data: Record<string, string | number | null> = {}
  for (const field of fields) {
    const aliases = ALIASES[field]
    if (aliases) {
      const value = findValue(src, ...aliases)
      if (value !== null) data[field] = value
    }
  }
  return { data, isHeuristic }
}

function extractKuaFields(
  raw: Record<string, unknown>,
  fields: string[],
): Record<string, string | number | null> {
  const src = mergeNested(raw, 'kua')
  const ALIASES: Record<string, string[]> = {
    kua: ['nombre_kua', 'kua', 'kua_number', 'numero_kua'],
    directions: ['direction_kua', 'directions', 'favorable_directions'],
    element: ['element', 'element_kua'],
  }
  const result: Record<string, string | number | null> = {}
  for (const field of fields) {
    const aliases = ALIASES[field]
    if (aliases) {
      const value = findValue(src, ...aliases)
      if (value !== null) result[field] = value
    }
  }
  return result
}

// ── Builder principal ──────────────────────────────────────────────────────────

/**
 * Construit un contexte de fusion orienté à partir de l'intent et de la payload brute.
 *
 * @param intent  Intent classifié (relationship, decision, inner_state, fusion_general_question…)
 * @param raw     Payload brute de /chart/fusion
 * @param lang    'fr' | 'en'
 */
export function buildFusionContext(
  intent: string,
  raw: Record<string, unknown>,
  lang = 'fr',
): FusionContext {
  const mapping = getIntentFieldMap(intent)
  const warnings: string[] = []
  const isFr = lang.slice(0, 2).toLowerCase() !== 'en'
  const readingAngle = isFr ? mapping.readingAngleFr : mapping.readingAngleEn

  // Extraire chaque module
  let astroFields: Record<string, string | number | string[] | null> = {}
  let hdFields: Record<string, string | null> = {}
  let numeFields: Record<string, string | number | null> = {}
  let ennData: Record<string, string | number | null> = {}
  let ennIsHeuristic = false
  let kuaFields: Record<string, string | number | null> = {}

  astroFields = extractAstroFields(raw, mapping.priorityFields.astrology)
  if (Object.keys(astroFields).length === 0) warnings.push('astrology: aucun champ extrait')

  hdFields = extractHDFields(raw, mapping.priorityFields.human_design)
  if (Object.keys(hdFields).length === 0) warnings.push('human_design: aucun champ extrait')

  numeFields = extractNumerologyFields(raw, mapping.priorityFields.numerology)
  if (Object.keys(numeFields).length === 0) warnings.push('numerology: aucun champ extrait')

  const ennResult = extractEnneagramFields(raw, mapping.priorityFields.enneagram)
  ennData = ennResult.data
  ennIsHeuristic = ennResult.isHeuristic
  if (Object.keys(ennData).length === 0) warnings.push('enneagram: aucun champ extrait')
  if (ennIsHeuristic) {
    warnings.push(
      `enneagram heuristique — poids réduit: ${mapping.moduleWeights.enneagram} → ${(mapping.moduleWeights.enneagram * 0.55).toFixed(2)}`,
    )
  }

  kuaFields = extractKuaFields(raw, mapping.priorityFields.kua)
  if (Object.keys(kuaFields).length === 0) warnings.push('kua: aucun champ extrait')

  // Poids effectifs (pénalité heuristique + zéro si module absent)
  const effectiveWeights = { ...mapping.moduleWeights }
  if (ennIsHeuristic) effectiveWeights.enneagram = effectiveWeights.enneagram * 0.55
  if (Object.keys(astroFields).length === 0) effectiveWeights.astrology = 0
  if (Object.keys(hdFields).length === 0) effectiveWeights.human_design = 0
  if (Object.keys(numeFields).length === 0) effectiveWeights.numerology = 0
  if (Object.keys(ennData).length === 0) effectiveWeights.enneagram = 0
  if (Object.keys(kuaFields).length === 0) effectiveWeights.kua = 0

  // Complétude : ratio champs trouvés / champs attendus
  const totalExpected = Object.values(mapping.priorityFields).reduce(
    (acc, fields) => acc + fields.length,
    0,
  )
  const totalFound =
    Object.keys(astroFields).length +
    Object.keys(hdFields).length +
    Object.keys(numeFields).length +
    Object.keys(ennData).length +
    Object.keys(kuaFields).length
  const completeness = totalExpected > 0 ? Math.min(1, totalFound / totalExpected) : 0

  // Modules activés = ceux qui ont au moins un champ extrait
  const modulesActivated: IntentModule[] = mapping.activeModules.filter((m) => {
    if (m === 'astrology') return Object.keys(astroFields).length > 0
    if (m === 'human_design') return Object.keys(hdFields).length > 0
    if (m === 'numerology') return Object.keys(numeFields).length > 0
    if (m === 'enneagram') return Object.keys(ennData).length > 0
    if (m === 'kua') return Object.keys(kuaFields).length > 0
    return false
  })

  // Confiance globale et par module
  // HD et astro ont plus de poids que les autres sciences
  const MODULE_CONFIDENCE_BOOST: Record<IntentModule, number> = {
    astrology: 1.10,
    human_design: 1.20,
    numerology: 1.00,
    enneagram: 1.00,
    kua: 0.80,
  }
  const foundPerModule: Record<IntentModule, number> = {
    astrology: Object.keys(astroFields).length,
    human_design: Object.keys(hdFields).length,
    numerology: Object.keys(numeFields).length,
    enneagram: Object.keys(ennData).length,
    kua: Object.keys(kuaFields).length,
  }

  const confidenceBreakdown: Partial<Record<IntentModule, number>> = {}
  let weightedConfSum = 0
  let baseWeightSum = 0

  for (const m of ['astrology', 'human_design', 'numerology', 'enneagram', 'kua'] as IntentModule[]) {
    const baseW = mapping.moduleWeights[m]
    if (baseW === 0) continue
    const effectiveW = effectiveWeights[m]
    const expectedCount = mapping.priorityFields[m].length
    const fieldRatio = expectedCount > 0 ? Math.min(1, foundPerModule[m] / expectedCount) : 0
    const boost = MODULE_CONFIDENCE_BOOST[m]
    const moduleConf = Math.min(1, effectiveW * fieldRatio * boost)
    confidenceBreakdown[m] = Math.round(moduleConf * 100) / 100
    weightedConfSum += moduleConf * baseW
    baseWeightSum += baseW
  }

  const fusionConfidence =
    baseWeightSum > 0
      ? Math.round(Math.min(1, (weightedConfSum / baseWeightSum) * completeness) * 100) / 100
      : 0

  return {
    intent,
    readingAngle,
    readingQuestion: mapping.readingQuestion,
    modulesActivated,
    dominantModule: mapping.dominantModule,
    modules: {
      astrology: {
        available: Object.keys(astroFields).length > 0,
        weight: effectiveWeights.astrology,
        fields: astroFields,
      },
      human_design: {
        available: Object.keys(hdFields).length > 0,
        weight: effectiveWeights.human_design,
        fields: hdFields as Record<string, string | number | string[] | null>,
      },
      numerology: {
        available: Object.keys(numeFields).length > 0,
        weight: effectiveWeights.numerology,
        fields: numeFields as Record<string, string | number | string[] | null>,
      },
      enneagram: {
        available: Object.keys(ennData).length > 0,
        weight: effectiveWeights.enneagram,
        fields: ennData as Record<string, string | number | string[] | null>,
        isHeuristic: ennIsHeuristic,
      },
      kua: {
        available: Object.keys(kuaFields).length > 0,
        weight: effectiveWeights.kua,
        fields: kuaFields as Record<string, string | number | string[] | null>,
      },
    },
    completeness,
    fusionConfidence,
    confidenceBreakdown,
    warnings,
    mapping,
  }
}

// ── Block builder ──────────────────────────────────────────────────────────────

/**
 * Construit le bloc texte orienté à injecter dans le prompt système.
 * Remplace l'ancien buildFusionProfileBlock pour les lectures guidées par intent.
 *
 * Le bloc contient :
 * - L'angle de lecture et la question traitée
 * - Les signaux prioritaires triés par poids décroissant
 * - L'arbitrage : dynamique dominante, décalage, action prioritaire
 * - Les règles d'utilisation pour le modèle
 */
export function buildOrientedFusionBlock(
  ctx: FusionContext,
  arbitration: FusionArbitration,
  firstName?: string | null,
  isFr = true,
  phaseData?: { phase: string; phaseConfidence: number } | null,
  zoneData?: { zone: string; zoneScore: number; subZones: string[] } | null,
): string {
  const nameTag = firstName ? ` — ${firstName.toUpperCase()}` : ''
  const lines: string[] = []

  const intentLabel = ctx.intent.toUpperCase().replace(/_/g, ' ')
  const header = isFr
    ? `FUSION CONTEXT${nameTag} — INTENTION: ${intentLabel}`
    : `FUSION CONTEXT${nameTag} — INTENT: ${intentLabel}`
  lines.push(header)
  lines.push('')

  lines.push(isFr ? `ANGLE DE LECTURE: ${ctx.readingAngle}` : `READING ANGLE: ${ctx.readingAngle}`)
  lines.push(
    isFr
      ? `QUESTION TRAITÉE: ${ctx.readingQuestion}`
      : `QUESTION ADDRESSED: ${ctx.readingQuestion}`,
  )

  if (phaseData) {
    const phaseLabel = isFr
      ? phaseData.phase === 'activation'
        ? 'ACTIVATION (élan, nouveau cycle)'
        : phaseData.phase === 'transition'
          ? 'TRANSITION (passage, lâcher-prise)'
          : 'STABILISATION (ancrage, consolidation)'
      : phaseData.phase === 'activation'
        ? 'ACTIVATION (momentum, new cycle)'
        : phaseData.phase === 'transition'
          ? 'TRANSITION (letting go, passage)'
          : 'STABILISATION (grounding, consolidation)'
    lines.push(
      isFr
        ? `PHASE ACTUELLE: ${phaseLabel} (confiance: ${Math.round(phaseData.phaseConfidence * 100)}%)`
        : `CURRENT PHASE: ${phaseLabel} (confidence: ${Math.round(phaseData.phaseConfidence * 100)}%)`,
    )
  }

  if (zoneData) {
    const zoneSubs = zoneData.subZones.length > 0 ? ` (${zoneData.subZones.slice(0, 2).join(', ')})` : ''
    lines.push(
      isFr
        ? `ZONE DE VIE: ${zoneData.zone.toUpperCase()} — force ${Math.round(zoneData.zoneScore * 100)}%${zoneSubs}`
        : `LIFE ZONE: ${zoneData.zone.toUpperCase()} — strength ${Math.round(zoneData.zoneScore * 100)}%${zoneSubs}`,
    )
  }

  const confPct = Math.round(ctx.fusionConfidence * 100)
  lines.push(
    isFr
      ? `FIABILITÉ LECTURE: ${confPct}% (données: ${Math.round(ctx.completeness * 100)}% complètes)`
      : `READING RELIABILITY: ${confPct}% (data: ${Math.round(ctx.completeness * 100)}% complete)`,
  )
  lines.push('')

  // Signaux triés par poids décroissant
  lines.push(isFr ? 'SIGNAUX PRIORITAIRES:' : 'PRIORITY SIGNALS:')

  const sortedModules = ctx.modulesActivated
    .filter((m) => ctx.modules[m].available)
    .sort((a, b) => ctx.modules[b].weight - ctx.modules[a].weight)

  for (const mod of sortedModules) {
    const mData = ctx.modules[mod]
    const isDominant = mod === arbitration.dominantModule
    const dominantTag = isDominant ? (isFr ? ' — DOMINANT' : ' — DOMINANT') : ''
    const heuristicNote =
      mod === 'enneagram' && mData.isHeuristic
        ? isFr
          ? ' ⚠ heuristique'
          : ' ⚠ heuristic'
        : ''

    const fieldStr = Object.entries(mData.fields)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) => {
        const val = Array.isArray(v) ? (v as string[]).join(', ') : String(v)
        return `${k}: ${val}`
      })
      .join(' | ')

    if (fieldStr) {
      const label = getModuleLabel(mod, isFr)
      lines.push(`[${label}${heuristicNote}]${dominantTag} ${fieldStr}`)
    }
  }

  lines.push('')

  // Arbitrage
  lines.push(isFr ? 'ARBITRAGE:' : 'ARBITRATION:')
  lines.push(
    isFr
      ? `Dynamique dominante: ${arbitration.dominantDynamic}`
      : `Dominant dynamic: ${arbitration.dominantDynamic}`,
  )
  lines.push(
    isFr
      ? `Décalage intérieur/extérieur: ${arbitration.innerOuterGap}`
      : `Inner/outer gap: ${arbitration.innerOuterGap}`,
  )
  lines.push(
    isFr
      ? `Mécanisme central: ${arbitration.mainBlock}`
      : `Core mechanism: ${arbitration.mainBlock}`,
  )
  lines.push(
    isFr
      ? `Action prioritaire: ${arbitration.priorityAction}`
      : `Priority action: ${arbitration.priorityAction}`,
  )

  if (arbitration.supportPoints.length > 0) {
    lines.push(
      isFr
        ? `Points de support: ${arbitration.supportPoints.join(' • ')}`
        : `Support points: ${arbitration.supportPoints.join(' • ')}`,
    )
  }

  lines.push('')

  // Avertissements si présents
  if (ctx.warnings.length > 0) {
    lines.push(
      isFr
        ? `Limites de fiabilité: ${ctx.warnings.join(' | ')}`
        : `Reliability limits: ${ctx.warnings.join(' | ')}`,
    )
    lines.push('')
  }

  // Règles d'utilisation pour le modèle
  const rules = isFr
    ? [
        "RÈGLES D'UTILISATION (invisibles pour l'utilisateur):",
        '- Utilise UNIQUEMENT les champs ci-dessus pour ancrer chaque bloc de la réponse.',
        '- La dynamique dominante est le FIL DIRECTEUR de toute la réponse.',
        "- Ne mentionne JAMAIS les sciences ou modules dans la réponse publique.",
        '- Chaque bloc doit refléter le décalage intérieur/extérieur identifié.',
        '- L\'action prioritaire doit apparaître dans le bloc "Ce que tu peux faire".',
        "- Interdit de produire des conseils génériques non ancrés dans ces données.",
        "- Interdit d'inventer des valeurs absentes de ce bloc.",
      ]
    : [
        'USAGE RULES (invisible to user):',
        '- Use ONLY the fields above to ground each block of the response.',
        '- The dominant dynamic is the THREAD running through the entire response.',
        '- NEVER mention sciences or modules in the public response.',
        '- Each block must reflect the identified inner/outer gap.',
        '- The priority action must appear in the "What you can do" block.',
        '- No generic advice not grounded in this data.',
        '- Never invent values absent from this block.',
      ]
  lines.push(...rules)

  return lines.join('\n')
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getModuleLabel(mod: string, isFr: boolean): string {
  const labels: Record<string, { fr: string; en: string }> = {
    astrology: { fr: 'Astrologie', en: 'Astrology' },
    human_design: { fr: 'Human Design', en: 'Human Design' },
    numerology: { fr: 'Numérologie', en: 'Numerology' },
    enneagram: { fr: 'Ennéagramme', en: 'Enneagram' },
    kua: { fr: 'Kua', en: 'Kua' },
  }
  return isFr ? (labels[mod]?.fr ?? mod) : (labels[mod]?.en ?? mod)
}
