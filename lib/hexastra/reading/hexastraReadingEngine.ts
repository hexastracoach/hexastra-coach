import type {
  BirthProfile,
  ContextType,
  DomainRoute,
  PractitionerUsageHex,
} from '@/lib/hexastra/types'
import { detectDominantPotential } from '@/lib/hexastra/detection/detectDominantPotential'
import { detectEmotionalState } from '@/lib/hexastra/detection/detectEmotionalState'
import { detectLifePhase } from '@/lib/hexastra/detection/detectLifePhase'
import { detectReadingLevel } from '@/lib/hexastra/detection/detectReadingLevel'
import { detectTimingIntensity } from '@/lib/hexastra/detection/detectTimingIntensity'

export type ReadingMomentType = 'exploration' | 'adjustment' | 'bascule' | 'tension'
export type ReadingPhaseType = 'transition' | 'stabilisation' | 'expansion' | 'contraction' | 'unknown'
export type ReadingLevel =
  | 'concret'
  | 'emotionnel'
  | 'reflexion'
  | 'strategique'
  | 'praticien'

export type ReadingOutput = {
  detectedTheme: string
  detectedSubtheme: string | null
  detectedScience: string | null
  readingLevel: ReadingLevel
  momentType: ReadingMomentType
  phaseType: ReadingPhaseType
  dominantPotential: string | null
  dominantZoneOfLife: string | null
  mainDynamic: string
  keyRisk: string
  keyOpportunity: string
  mainLever: string
  recommendations: string[]
  executiveSummary: string[]
  keys: {
    understanding: {
      inner: string
      outer: string
    }
    action: {
      physical: string
      subtle: string
    }
  }
  structureTemplate: string[]
}

function normalizeText(value: string | null | undefined) {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function detectThemeFromContext(domainRoute: DomainRoute, contextType?: ContextType | null) {
  if (domainRoute === 'neurokua') return 'neuro_equilibre'
  if (domainRoute === 'gps_kua') return 'kua_orientation'
  if (domainRoute === 'relationship' || contextType === 'relationship') return 'amour_relations'
  if (domainRoute === 'career' || contextType === 'career') return 'travail_argent'
  if (domainRoute === 'decision' || contextType === 'decision') return 'decision'
  if (domainRoute === 'timing') return 'vision_prochains_mois'
  if (domainRoute === 'wellbeing' || contextType === 'wellbeing' || contextType === 'energy') {
    return 'bien_etre_etat_interieur'
  }
  if (domainRoute === 'science') return 'analyse_par_science'
  return 'lecture_generale'
}

function inferSubtheme(message: string, theme: string) {
  const text = normalizeText(message)

  if (theme === 'neuro_equilibre') {
    if (text.includes('fatigue')) return 'fatigue_recharge'
    if (text.includes('stress') || text.includes('surcharge')) return 'stress_surcharge'
    if (text.includes('etat') || text.includes('jour')) return 'etat_du_jour'
  }

  if (theme === 'travail_argent') {
    if (text.includes('argent')) return 'argent_securite'
    if (text.includes('projet')) return 'projet_personnel'
    if (text.includes('conflit')) return 'ambiance_conflits'
  }

  if (theme === 'amour_relations') {
    if (text.includes('couple')) return 'en_couple'
    if (text.includes('celib')) return 'celibataire'
    if (text.includes('famille')) return 'famille_proches'
  }

  if (theme === 'decision') {
    if (text.includes('travail') || text.includes('pro')) return 'decision_pro'
    if (text.includes('relation')) return 'decision_relationnelle'
  }

  if (theme === 'lecture_generale') {
    if (text.includes('detail')) return 'lecture_detaillee'
    if (text.includes('force')) return 'forces_du_moment'
    if (text.includes('vigil')) return 'vigilances'
  }

  return null
}

function inferScience(message: string, domainRoute: DomainRoute) {
  const text = normalizeText(message)

  if (text.includes('neurokua')) return 'neurokua'
  if (text.includes('astrolex') || text.includes('theme natal') || text.includes('theme astral')) return 'astrolex'
  if (text.includes('porteum')) return 'porteum'
  if (text.includes('triangle') || text.includes('numeris')) return 'trianglenumeris'
  if (text.includes('ennea')) return 'enneatype'
  if (text.includes('kua')) return domainRoute === 'gps_kua' ? 'kua' : 'kua'
  if (domainRoute === 'science') return 'science'
  return null
}

function inferZoneOfLife(theme: string, fusedSignal?: { zone?: string | null; dominantSignal?: string | null } | null) {
  if (fusedSignal?.zone) return fusedSignal.zone
  if (theme === 'amour_relations') return 'relation'
  if (theme === 'travail_argent') return 'securite'
  if (theme === 'decision') return 'direction'
  if (theme === 'vision_prochains_mois') return 'expansion'
  if (theme === 'bien_etre_etat_interieur' || theme === 'neuro_equilibre') return 'security'
  return 'direction'
}

function pickStructureTemplate(theme: string, science: string | null, practitionerUsage: PractitionerUsageHex) {
  if (practitionerUsage === 'client') {
    return ['Situation', 'Phase', 'Dynamique', 'Risques', 'Levier', 'Recommandation']
  }

  if (science === 'astrolex') {
    return ['Reconnaissance', 'Energie actuelle', 'Domaine active', 'Timing', 'Conseil du cycle']
  }
  if (science === 'neurokua') {
    return ['Reconnaissance', 'Equilibre des axes', 'Desequilibre principal', 'Ajustement', 'Cle d action']
  }
  if (science === 'trianglenumeris') {
    return ['Reconnaissance', 'Cycle principal', 'Transition en cours', 'Opportunite', 'Conseil du cycle']
  }
  if (science === 'kua') {
    return ['Reconnaissance', 'Orientation utile', 'Zone de tension', 'Positionnement', 'Conseil pratique']
  }

  switch (theme) {
    case 'amour_relations':
      return ['Reconnaissance', 'Dynamique relationnelle', 'Mecanisme invisible', 'Levier relationnel', 'Action concrete']
    case 'travail_argent':
      return ['Reconnaissance', 'Contexte', 'Blocage ou poussee', 'Strategie simple', 'Action prioritaire']
    case 'bien_etre_etat_interieur':
    case 'neuro_equilibre':
      return ['Reconnaissance', 'Etat dominant', 'Source du desequilibre', 'Reorientation', 'Action courte']
    case 'decision':
      return ['Reconnaissance', 'Forces en presence', 'Risque', 'Orientation la plus fluide', 'Action immediate']
    case 'vision_prochains_mois':
      return ['Reconnaissance', 'Phase globale', 'Opportunites', 'Vigilances', 'Direction strategique']
    default:
      return ['Reconnaissance', 'Lecture de la dynamique', 'Mise en perspective', 'Reorientation', 'Cle d action']
  }
}

export function buildExecutiveSummary(output: Pick<ReadingOutput, 'mainDynamic' | 'keyRisk' | 'mainLever'>) {
  return [
    `Situation actuelle : ${output.mainDynamic}`,
    `Enjeu cle : ${output.keyRisk}`,
    `Orientation prioritaire : ${output.mainLever}`,
  ]
}

export function generateHexastraReading(input: {
  latestUserMessage: string
  contextType?: ContextType | null
  domainRoute: DomainRoute
  birthData?: BirthProfile | null
  practitionerUsage?: PractitionerUsageHex
  fusedSignal?: {
    dominantSignal?: string | null
    zone?: string | null
    phase?: string | null
    risk_flag?: boolean
    opportunity_flag?: boolean
  } | null
}) : ReadingOutput {
  const latestUserMessage = input.latestUserMessage ?? ''
  const practitionerUsage = input.practitionerUsage ?? null
  const detectedTheme = detectThemeFromContext(input.domainRoute, input.contextType)
  const detectedSubtheme = inferSubtheme(latestUserMessage, detectedTheme)
  const detectedScience = inferScience(latestUserMessage, input.domainRoute)
  const readingLevel = detectReadingLevel(latestUserMessage, practitionerUsage === 'client') as ReadingLevel
  const momentType = detectTimingIntensity(latestUserMessage)
  const phaseType = detectLifePhase(latestUserMessage) as ReadingPhaseType
  const dominantPotentialRaw = detectDominantPotential(latestUserMessage)
  const dominantPotential = dominantPotentialRaw === 'unknown' ? null : dominantPotentialRaw
  const emotionalState = detectEmotionalState(latestUserMessage)
  const dominantZoneOfLife = inferZoneOfLife(detectedTheme, input.fusedSignal)

  const mainDynamic = input.fusedSignal?.dominantSignal
    ? input.fusedSignal.dominantSignal.replace(/_/g, ' ')
    : emotionalState === 'surcharge'
      ? 'tension interieure qui demande simplification'
      : phaseType === 'transition'
        ? 'phase de repositionnement et de clarification'
        : 'mouvement de fond a clarifier'

  const keyRisk = input.fusedSignal?.risk_flag
    ? 'forcer ou agir depuis la surcharge'
    : momentType === 'tension'
      ? 'reagir trop vite sous pression'
      : phaseType === 'contraction'
        ? 's epuiser en voulant maintenir trop de choses'
        : 'se disperser ou rester trop flou'

  const keyOpportunity = input.fusedSignal?.opportunity_flag
    ? 'appuyer sur la dynamique deja ouverte'
    : phaseType === 'expansion'
      ? 'mettre en mouvement ce qui demande a grandir'
      : 'clarifier puis agir avec plus de justesse'

  const mainLever =
    dominantPotential === 'structuration'
      ? 'poser un cadre simple et une priorite nette'
      : dominantPotential === 'creation'
        ? 'transformer lintuition en action concrete'
        : dominantPotential === 'accompagnement'
          ? 'appuyer sur la qualite relationnelle et la transmission'
          : momentType === 'tension'
            ? 'reduire la pression visible et revenir a lessentiel'
            : 'choisir un seul axe et avancer dessus clairement'

  const recommendations = [
    mainLever,
    practitionerUsage === 'client'
      ? 'garder une recommandation sobre, claire et exploitable en accompagnement'
      : 'rester sur une action testable immediatement',
  ]

  const keys = {
    understanding: {
      inner: 'miroir interieur clair',
      outer: 'miroir exterieur clair',
    },
    action: {
      physical: 'action concrete',
      subtle: 'attitude ou posture mentale',
    },
  }

  const structureTemplate = pickStructureTemplate(
    detectedTheme,
    detectedScience,
    practitionerUsage
  )

  const output: ReadingOutput = {
    detectedTheme,
    detectedSubtheme,
    detectedScience,
    readingLevel,
    momentType,
    phaseType,
    dominantPotential,
    dominantZoneOfLife,
    mainDynamic,
    keyRisk,
    keyOpportunity,
    mainLever,
    recommendations,
    executiveSummary: [],
    keys,
    structureTemplate,
  }

  output.executiveSummary = buildExecutiveSummary(output)
  return output
}
