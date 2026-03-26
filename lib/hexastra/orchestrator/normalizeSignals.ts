/**
 * normalizeSignals — Hexastra Coach
 *
 * Normalise les signaux extraits du contexte de fusion en objets comparables.
 * Chaque signal a une source, un tag sémantique, une intensité, une confiance,
 * une direction et des hints de phase/zone pour le pipeline d'arbitrage avancé.
 */

import type { FusionContext } from './buildFusionContext'
import type { IntentModule } from './intentFieldMapping'

// ── Types ──────────────────────────────────────────────────────────────────────

export type SignalDirection = 'expansif' | 'contractif' | 'neutre'
export type PhaseHint = 'activation' | 'stabilisation' | 'transition' | null
export type ZoneHint = 'émotionnel' | 'décisionnel' | 'relationnel' | 'identitaire' | 'cyclique'

export type NormalizedSignal = {
  /** Module source du signal */
  source: IntentModule
  /** Tag sémantique du signal */
  tag: string
  /** Description courte du signal */
  description: string
  /** Intensité brute du signal (0–1) */
  intensity: number
  /** Confiance tenant compte du poids effectif du module */
  confidence: number
  /** Direction énergétique du signal */
  direction: SignalDirection
  /** Indice de phase dominant pour ce signal */
  phase_hint: PhaseHint
  /** Zone fonctionnelle principale */
  zone_hint: ZoneHint
  /** Vrai si ce signal représente un risque ou une friction */
  risk_flag: boolean
  /** Vrai si ce signal représente une opportunité ou un levier */
  opportunity_flag: boolean
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function deaccent(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

const FIRE_SIGNS = ['aries', 'belier', 'leo', 'lion', 'sagittarius', 'sagittaire']
const AIR_SIGNS = ['gemini', 'gemeaux', 'libra', 'balance', 'aquarius', 'verseau']
const EARTH_SIGNS = ['taurus', 'taureau', 'virgo', 'vierge', 'capricorn', 'capricorne']
const WATER_SIGNS = ['cancer', 'scorpio', 'scorpion', 'pisces', 'poissons']

function signDirection(sign: string | null | undefined): SignalDirection {
  if (!sign) return 'neutre'
  const n = deaccent(sign)
  if (FIRE_SIGNS.some((s) => n.includes(s)) || AIR_SIGNS.some((s) => n.includes(s))) return 'expansif'
  if (EARTH_SIGNS.some((s) => n.includes(s)) || WATER_SIGNS.some((s) => n.includes(s))) return 'contractif'
  return 'neutre'
}

const PERSONAL_YEAR_PHASE: Record<number, PhaseHint> = {
  1: 'activation',
  2: 'stabilisation',
  3: 'transition',
  4: 'stabilisation',
  5: 'activation',
  6: 'transition',
  7: 'stabilisation',
  8: 'activation',
  9: 'transition',
  11: 'stabilisation',
  22: 'stabilisation',
  33: 'transition',
}

const HD_TYPE_DIRECTION: Array<[string, SignalDirection]> = [
  ['generateur manifestant', 'expansif'],
  ['manifesting generator', 'expansif'],
  ['manifesteur', 'expansif'],
  ['manifestor', 'expansif'],
  ['generateur', 'expansif'],
  ['generator', 'expansif'],
  ['projecteur', 'contractif'],
  ['projector', 'contractif'],
  ['reflecteur', 'contractif'],
  ['reflector', 'contractif'],
]

function hdTypeDirection(hdType: string | null | undefined): SignalDirection {
  if (!hdType) return 'neutre'
  const n = deaccent(hdType)
  for (const [key, dir] of HD_TYPE_DIRECTION) {
    if (n.includes(key)) return dir
  }
  return 'neutre'
}

// ── Extracteurs par module ─────────────────────────────────────────────────────

function extractAstroSignals(ctx: FusionContext): NormalizedSignal[] {
  const signals: NormalizedSignal[] = []
  const mod = ctx.modules.astrology
  if (!mod.available || mod.weight === 0) return signals
  const conf = mod.weight
  const fields = mod.fields

  const moonSign = fields['moonSign'] as string | null
  const sunSign = fields['sunSign'] as string | null
  const venusSign = fields['venusSign'] as string | null
  const marsSign = fields['marsSign'] as string | null
  const saturnSign = fields['saturnSign'] as string | null
  const dominantElements = fields['dominantElements'] as string[] | null

  if (moonSign) {
    const n = deaccent(moonSign)
    const isWater = WATER_SIGNS.some((s) => n.includes(s))
    signals.push({
      source: 'astrology',
      tag: 'emotional_sensitivity',
      description: `Lune ${moonSign} — réactivité émotionnelle et besoins de sécurité`,
      intensity: 0.85,
      confidence: conf,
      direction: signDirection(moonSign),
      phase_hint: null,
      zone_hint: 'émotionnel',
      risk_flag: isWater,
      opportunity_flag: conf > 0.7,
    })
  }

  if (sunSign) {
    signals.push({
      source: 'astrology',
      tag: 'identity_anchor',
      description: `Soleil ${sunSign} — expression identitaire centrale`,
      intensity: 0.80,
      confidence: conf,
      direction: signDirection(sunSign),
      phase_hint: null,
      zone_hint: 'identitaire',
      risk_flag: false,
      opportunity_flag: conf > 0.7,
    })
  }

  if (venusSign) {
    signals.push({
      source: 'astrology',
      tag: 'attraction_mode',
      description: `Vénus ${venusSign} — mode d'attraction et de connexion relationnelle`,
      intensity: 0.65,
      confidence: conf * 0.85,
      direction: signDirection(venusSign),
      phase_hint: null,
      zone_hint: 'relationnel',
      risk_flag: false,
      opportunity_flag: false,
    })
  }

  if (marsSign) {
    signals.push({
      source: 'astrology',
      tag: 'action_driver',
      description: `Mars ${marsSign} — élan d'action et de décision`,
      intensity: 0.70,
      confidence: conf * 0.80,
      direction: signDirection(marsSign),
      phase_hint: null,
      zone_hint: 'décisionnel',
      risk_flag: false,
      opportunity_flag: conf > 0.75,
    })
  }

  if (saturnSign) {
    const n = deaccent(saturnSign)
    const isTransitionSign =
      n.includes('pisces') ||
      n.includes('poissons') ||
      n.includes('scorpio') ||
      n.includes('scorpion') ||
      n.includes('capricorn') ||
      n.includes('capricorne')
    signals.push({
      source: 'astrology',
      tag: 'structural_constraint',
      description: `Saturne ${saturnSign} — structure, discipline et leçons de maturité`,
      intensity: 0.55,
      confidence: conf * 0.75,
      direction: 'contractif',
      phase_hint: isTransitionSign ? 'transition' : 'stabilisation',
      zone_hint: 'décisionnel',
      risk_flag: isTransitionSign,
      opportunity_flag: false,
    })
  }

  if (dominantElements?.length) {
    const dea = dominantElements.map(deaccent)
    const hasFireAir = dea.some((n) => n === 'feu' || n === 'fire' || n === 'air')
    const hasEarthWater = dea.some((n) => n === 'terre' || n === 'earth' || n === 'eau' || n === 'water')
    const dir: SignalDirection =
      hasFireAir && !hasEarthWater ? 'expansif' : hasEarthWater && !hasFireAir ? 'contractif' : 'neutre'
    signals.push({
      source: 'astrology',
      tag: 'elemental_balance',
      description: `Éléments dominants: ${dominantElements.join(', ')}`,
      intensity: 0.55,
      confidence: conf * 0.75,
      direction: dir,
      phase_hint: hasFireAir ? 'activation' : hasEarthWater ? 'stabilisation' : null,
      zone_hint: 'identitaire',
      risk_flag: false,
      opportunity_flag: false,
    })
  }

  return signals
}

function extractHDSignals(ctx: FusionContext): NormalizedSignal[] {
  const signals: NormalizedSignal[] = []
  const mod = ctx.modules.human_design
  if (!mod.available || mod.weight === 0) return signals
  const conf = mod.weight
  const fields = mod.fields

  const hdType = fields['hdType'] as string | null
  const hdAuthority = fields['hdAuthority'] as string | null
  const hdProfile = fields['hdProfile'] as string | null

  if (hdType) {
    const n = deaccent(hdType)
    let tag = 'hd_type_mechanism'
    if (n.includes('generateur manifestant') || n.includes('manifesting generator')) tag = 'multi_track_energy'
    else if (n.includes('projecteur') || n.includes('projector')) tag = 'invitation_mechanism'
    else if (n.includes('generateur') || n.includes('generator')) tag = 'response_mechanism'
    else if (n.includes('manifesteur') || n.includes('manifestor')) tag = 'initiation_mechanism'
    else if (n.includes('reflecteur') || n.includes('reflector')) tag = 'environment_mirror'

    signals.push({
      source: 'human_design',
      tag,
      description: `Type HD ${hdType}${hdProfile ? ` profil ${hdProfile}` : ''} — mécanisme de fonctionnement naturel`,
      intensity: 0.95,
      confidence: conf,
      direction: hdTypeDirection(hdType),
      phase_hint: null,
      zone_hint: 'identitaire',
      risk_flag: false,
      opportunity_flag: conf > 0.8,
    })
  }

  if (hdAuthority) {
    signals.push({
      source: 'human_design',
      tag: 'decision_authority',
      description: `Autorité HD ${hdAuthority} — canal de décision fiable`,
      intensity: 0.90,
      confidence: conf,
      direction: 'neutre',
      phase_hint: null,
      zone_hint: 'décisionnel',
      risk_flag: false,
      opportunity_flag: true,
    })
  }

  return signals
}

function extractNumerologySignals(ctx: FusionContext): NormalizedSignal[] {
  const signals: NormalizedSignal[] = []
  const mod = ctx.modules.numerology
  if (!mod.available || mod.weight === 0) return signals
  const conf = mod.weight
  const fields = mod.fields

  const lifePath = fields['lifePath'] as string | number | null
  const personalYear = fields['personalYear'] as string | number | null
  const personalMonth = fields['personalMonth'] as string | number | null

  if (lifePath !== null && lifePath !== undefined) {
    const num = typeof lifePath === 'string' ? parseInt(lifePath, 10) : lifePath
    if (!isNaN(num)) {
      const isMaster = num === 11 || num === 22 || num === 33
      const isExpansif = num === 1 || num === 3 || num === 5
      const isContractif = num === 4 || num === 7 || num === 8
      signals.push({
        source: 'numerology',
        tag: 'life_path_driver',
        description: `Chemin de vie ${lifePath}${isMaster ? ' (maître)' : ''} — moteur de fond de la trajectoire`,
        intensity: 0.75,
        confidence: conf,
        direction: isExpansif ? 'expansif' : isContractif ? 'contractif' : 'neutre',
        phase_hint: null,
        zone_hint: 'identitaire',
        risk_flag: false,
        opportunity_flag: isMaster,
      })
    }
  }

  if (personalYear !== null && personalYear !== undefined) {
    const yearNum = typeof personalYear === 'string' ? parseInt(personalYear, 10) : personalYear
    if (!isNaN(yearNum)) {
      const phaseHint = PERSONAL_YEAR_PHASE[yearNum] ?? null
      const isExpansif = yearNum === 1 || yearNum === 5 || yearNum === 8
      const isContractif = yearNum === 4 || yearNum === 7
      signals.push({
        source: 'numerology',
        tag: 'yearly_cycle',
        description: `Année personnelle ${personalYear} — contexte cyclique dominant`,
        intensity: 0.70,
        confidence: conf,
        direction: isExpansif ? 'expansif' : isContractif ? 'contractif' : 'neutre',
        phase_hint: phaseHint,
        zone_hint: 'cyclique',
        risk_flag: yearNum === 9,
        opportunity_flag: yearNum === 1 || yearNum === 8,
      })
    }
  }

  if (personalMonth !== null && personalMonth !== undefined) {
    const monthNum = typeof personalMonth === 'string' ? parseInt(personalMonth, 10) : personalMonth
    if (!isNaN(monthNum)) {
      signals.push({
        source: 'numerology',
        tag: 'monthly_cycle',
        description: `Mois personnel ${personalMonth} — inflexion mensuelle`,
        intensity: 0.45,
        confidence: conf * 0.75,
        direction: 'neutre',
        phase_hint: PERSONAL_YEAR_PHASE[monthNum] ?? null,
        zone_hint: 'cyclique',
        risk_flag: false,
        opportunity_flag: false,
      })
    }
  }

  return signals
}

function extractEnneagramSignals(ctx: FusionContext): NormalizedSignal[] {
  const signals: NormalizedSignal[] = []
  const mod = ctx.modules.enneagram
  if (!mod.available || mod.weight === 0) return signals
  const conf = mod.weight
  const isHeuristic = mod.isHeuristic ?? false
  const fields = mod.fields

  const ennType = fields['enneagramType'] as string | number | null
  const ennWing = fields['enneagramWing'] as string | null

  if (ennType !== null && ennType !== undefined) {
    const num = typeof ennType === 'string' ? parseInt(ennType, 10) : ennType
    if (!isNaN(num)) {
      const needsRecognition = num === 2 || num === 3 || num === 4
      const needsAutonomy = num === 1 || num === 5 || num === 8
      const isExpansif = num === 1 || num === 3 || num === 7 || num === 8
      const isContractif = num === 4 || num === 5 || num === 9
      signals.push({
        source: 'enneagram',
        tag: needsRecognition ? 'recognition_need' : needsAutonomy ? 'autonomy_driver' : 'core_fear_pattern',
        description: `Type ${ennType} Ennéagramme${ennWing ? ` aile ${ennWing}` : ''}${isHeuristic ? ' (heuristique)' : ''} — schéma de peur et de désir central`,
        intensity: isHeuristic ? 0.50 : 0.72,
        confidence: conf,
        direction: isExpansif ? 'expansif' : isContractif ? 'contractif' : 'neutre',
        phase_hint: null,
        zone_hint: 'identitaire',
        risk_flag: isHeuristic,
        opportunity_flag: !isHeuristic && conf > 0.5,
      })
    }
  }

  return signals
}

function extractKuaSignals(ctx: FusionContext): NormalizedSignal[] {
  const signals: NormalizedSignal[] = []
  const mod = ctx.modules.kua
  if (!mod.available || mod.weight === 0) return signals
  const conf = mod.weight
  const fields = mod.fields

  const kua = fields['kua'] as string | number | null
  if (kua !== null && kua !== undefined) {
    signals.push({
      source: 'kua',
      tag: 'favorable_direction_support',
      description: `Kua ${kua} — directions favorables et alignement spatial`,
      intensity: 0.40,
      confidence: conf,
      direction: 'neutre',
      phase_hint: null,
      zone_hint: 'décisionnel',
      risk_flag: false,
      opportunity_flag: conf > 0.3,
    })
  }

  return signals
}

// ── Main ───────────────────────────────────────────────────────────────────────

/**
 * Normalise tous les signaux du contexte de fusion en objets comparables.
 *
 * Chaque signal a une source, un tag, une intensité, une confiance, une direction
 * et des hints de phase/zone pour le pipeline d'arbitrage avancé.
 *
 * @param ctx Contexte de fusion construit par buildFusionContext
 * @returns Tableau de signaux normalisés triés par confiance décroissante
 */
export function normalizeSignals(ctx: FusionContext): NormalizedSignal[] {
  const signals: NormalizedSignal[] = [
    ...extractAstroSignals(ctx),
    ...extractHDSignals(ctx),
    ...extractNumerologySignals(ctx),
    ...extractEnneagramSignals(ctx),
    ...extractKuaSignals(ctx),
  ]

  // Trier par confiance décroissante, puis par intensité
  return signals.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence
    return b.intensity - a.intensity
  })
}
