import type { OpeningSignalSelection } from '@/lib/hexastra/orchestrator/selectOpeningSignal'
import type { StructuredSignal } from '@/lib/hexastra/retrieval/structuredSignalBuilder'
import { unwrapDisplayText } from '@/lib/hexastra/utils/unwrapDisplayValue'

export type YearlyPriorityAnswerInput = {
  userMessage: string
  openingSignal: OpeningSignalSelection | null
  prioritizedSignals: StructuredSignal[]
}

type AnnualFamily =
  | 'cap'
  | 'maturation'
  | 'rythme'
  | 'alignement'
  | 'direction'
  | 'cycle'

type PriorityTemplate = {
  title: string
  explanation: string
  realLife: string
  pitfall: string
}

export type YearlyPriorityValidation = {
  valid: boolean
  issues: string[]
  priorityCount: number
}

function normalize(text: string): string {
  return (text || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function sentence(value: string | null | undefined): string {
  const cleaned = normalize(value ?? '')
  if (!cleaned) return ''
  const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`
}

function compact(value: string, maxChars = 150): string {
  const cleaned = normalize(value)
  if (cleaned.length <= maxChars) return cleaned
  const cut = cleaned.lastIndexOf(' ', maxChars)
  return `${cleaned.slice(0, cut > 80 ? cut : maxChars).trim()}...`
}

function flattenScalarTexts(value: unknown, limit = 6, bucket: string[] = []): string[] {
  if (bucket.length >= limit || value === null || value === undefined) return bucket

  if (typeof value === 'string') {
    const cleaned = normalize(value)
    if (cleaned) bucket.push(cleaned)
    return bucket
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    bucket.push(String(value))
    return bucket
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      flattenScalarTexts(entry, limit, bucket)
      if (bucket.length >= limit) break
    }
    return bucket
  }

  if (typeof value === 'object') {
    for (const entry of Object.values(value as Record<string, unknown>)) {
      flattenScalarTexts(entry, limit, bucket)
      if (bucket.length >= limit) break
    }
  }

  return bucket
}

function getPathValue(value: unknown, path: string): unknown {
  let current: unknown = value
  for (const key of path.split('.')) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return null
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

function findByPaths(value: unknown, paths: string[]): unknown {
  for (const path of paths) {
    const candidate = getPathValue(value, path)
    if (candidate !== null && candidate !== undefined && candidate !== '') {
      return candidate
    }
  }
  return null
}

function stringifyCandidate(value: unknown): string | null {
  const unwrapped = unwrapDisplayText(value)
  if (unwrapped) return normalize(unwrapped)

  if (typeof value === 'string') return normalize(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)

  if (Array.isArray(value)) {
    const parts = flattenScalarTexts(value, 4)
    return parts.length > 0 ? parts.join(', ') : null
  }

  return null
}

function extractRequestedYear(message: string): string {
  const match = message.match(/\b(20\d{2})\b/)
  if (match) return match[1]

  if (/\bcette annee\b|\bmon annee\b|\bthis year\b/i.test(message)) {
    return String(new Date().getFullYear())
  }

  return String(new Date().getFullYear())
}

function familyFromSignal(signal: StructuredSignal | null): AnnualFamily | null {
  if (!signal) return null
  const key = normalize(signal.subCategory).toLowerCase()

  if (/annual_guidance|solar_return|fusion_general|fusion_timing|fusion_decision/.test(key)) return 'cap'
  if (/progressions|lunar_return/.test(key)) return 'maturation'
  if (/transits|timing/.test(key)) return 'rythme'
  if (/hd_current_transits|hd_current_cycle/.test(key)) return 'alignement'
  if (/kua/.test(key)) return 'direction'
  if (/num_personal_year|numerology|cycle/.test(key)) return 'cycle'

  return 'cap'
}

function describeSignal(signal: StructuredSignal | null): string {
  if (!signal) return 'ton annee demande un recentrage net'

  const exactPaths: Record<string, string[]> = {
    annual_guidance: ['publicSummary', 'summary', 'message'],
    astro_solar_return: ['annual_theme', 'theme', 'emphasis', 'summary'],
    astro_progressions: ['secondary_progressions.moon', 'moon', 'progressed_moon', 'summary'],
    astro_lunar_return: ['theme', 'summary', 'annual_theme'],
    astro_transits_current: ['summary', 'saturn', 'mars', 'moon', 'sun'],
    hd_current_transits: ['current_cycle', 'summary'],
    hd_current_cycle: ['current_cycle', 'summary'],
    num_personal_year: ['yearly.personalYearNumber', 'personalYearNumber', 'personalYear', 'summary'],
    kua_annual_influence: ['summary', 'annualInfluence', 'annualDirection'],
    kua_favorable_directions: ['favorable_directions', 'favorableDirections', 'summary'],
  }

  const candidate = stringifyCandidate(findByPaths(signal.value, exactPaths[signal.subCategory] ?? ['summary', 'message']))
  if (candidate) return compact(candidate)

  const firstScalar = stringifyCandidate(flattenScalarTexts(signal.value, 3)[0] ?? null)
  if (firstScalar) return compact(firstScalar)

  switch (familyFromSignal(signal)) {
    case 'cap':
      return 'ton cap demande d etre clarifie et assume'
    case 'maturation':
      return 'quelque chose murit en profondeur avant de se montrer pleinement'
    case 'rythme':
      return 'le bon rythme compte plus que la force brute'
    case 'alignement':
      return 'ton energie doit etre engagee plus proprement'
    case 'direction':
      return 'ta direction gagne a etre rendue plus concrete'
    case 'cycle':
      return 'le cycle en cours pousse a construire sur du solide'
    default:
      return 'l annee te demande un tri plus net'
  }
}

function priorityTemplate(family: AnnualFamily, year: string): PriorityTemplate {
  switch (family) {
    case 'maturation':
      return {
        title: 'Maturer avant de montrer',
        explanation: `En ${year}, ce qui doit compter ne se force pas. Il faut laisser murir ce qui prend de la profondeur avant de l exposer trop vite.`,
        realLife: 'Dans la vraie vie: travaille le fond, affine ton message, et ne lance pas trop tot un projet encore instable.',
        pitfall: 'Vouloir prouver trop vite que tout est deja pret.',
      }
    case 'rythme':
      return {
        title: 'Rythme juste',
        explanation: `Ton vrai levier cette annee n est pas d en faire plus, mais de savoir quand accelerer et quand observer.`,
        realLife: 'Dans la vraie vie: reduis les relances inutiles, protege les plages de concentration, et avance seulement sur ce qui montre une vraie traction.',
        pitfall: 'Confondre urgence, pression et bon timing.',
      }
    case 'alignement':
      return {
        title: 'Alignement energetique',
        explanation: `L annee te demande d engager ton energie la ou la reponse est claire, pas la ou la pression est la plus forte.`,
        realLife: 'Dans la vraie vie: accepte moins de sollicitations, choisis mieux tes oui, et coupe les efforts qui vident sans nourrir.',
        pitfall: 'Dire oui pour calmer la pression ou rassurer les autres.',
      }
    case 'direction':
      return {
        title: 'Direction concrete',
        explanation: `Ta priorite est de rendre ton axe visible et praticable, pas seulement inspirant sur le papier.`,
        realLife: 'Dans la vraie vie: simplifie ton environnement, clarifie le prochain cap, et aligne tes choix quotidiens avec ce cap.',
        pitfall: 'Changer tout ton cadre d un coup au lieu d ajuster le point le plus decisif.',
      }
    case 'cycle':
      return {
        title: 'Construire le bon cycle',
        explanation: `Le mouvement de ${year} soutient ce qui se consolide proprement, pas ce qui se disperse en trop de fronts ouverts.`,
        realLife: 'Dans la vraie vie: termine ce qui a une vraie valeur, pose une base durable, et ferme les chantiers sans elan reel.',
        pitfall: 'Empiler des debuts sans construire de base stable.',
      }
    case 'cap':
    default:
      return {
        title: 'Cap a assumer',
        explanation: `Le mouvement dominant de ${year} te pousse a choisir plus franchement ce que tu veux vraiment porter.`,
        realLife: 'Dans la vraie vie: trie tes projets, nomme ta priorite numero un, et retire les engagements qui diluent ton axe principal.',
        pitfall: 'Te disperser entre plusieurs priorites declarees comme urgentes.',
      }
  }
}

function buildPrioritySignals(
  openingSignal: StructuredSignal | null,
  prioritizedSignals: StructuredSignal[],
): Array<{ signal: StructuredSignal | null; family: AnnualFamily }> {
  const chosen: Array<{ signal: StructuredSignal | null; family: AnnualFamily }> = []
  const seenFamilies = new Set<AnnualFamily>()
  const candidates = [...(openingSignal ? [openingSignal] : []), ...prioritizedSignals]

  for (const signal of candidates) {
    const family = familyFromSignal(signal)
    if (!family || seenFamilies.has(family)) continue
    seenFamilies.add(family)
    chosen.push({ signal, family })
    if (chosen.length === 3) return chosen
  }

  for (const family of ['cap', 'rythme', 'cycle', 'alignement', 'direction', 'maturation'] as AnnualFamily[]) {
    if (seenFamilies.has(family)) continue
    seenFamilies.add(family)
    chosen.push({ signal: null, family })
    if (chosen.length === 3) break
  }

  return chosen
}

function buildOrientation(
  year: string,
  openingSignal: StructuredSignal | null,
  prioritizedSignals: StructuredSignal[],
): string {
  const primary = describeSignal(openingSignal ?? prioritizedSignals[0] ?? null)
  const secondary = describeSignal(prioritizedSignals.find((signal) => signal !== openingSignal) ?? null)

  return [
    sentence(`En ${year}, le mouvement dominant demande surtout de clarifier le cap et de concentrer ton energie sur ce qui porte vraiment`),
    sentence(primary),
    secondary && secondary !== primary
      ? sentence(`Le bon axe n est pas d en faire plus, mais d assumer plus nettement ce qui doit devenir central: ${secondary}`)
      : '',
  ]
    .filter(Boolean)
    .slice(0, 3)
    .join(' ')
}

function buildPriorityBlock(year: string, signal: StructuredSignal | null, family: AnnualFamily, index: number): string {
  const template = priorityTemplate(family, year)
  const evidence = describeSignal(signal)

  return [
    `${index}. ${template.title}`,
    `Pourquoi: ${sentence(`${template.explanation} Signal d appui: ${evidence}`)}`,
    `Dans la vraie vie: ${sentence(template.realLife.replace(/^Dans la vraie vie:\s*/i, ''))}`,
  ].join('\n')
}

function buildPitfalls(year: string, priorityFamilies: AnnualFamily[]): string {
  const unique = Array.from(new Set(priorityFamilies))
  const pitfalls = unique
    .slice(0, 2)
    .map((family) => sentence(priorityTemplate(family, year).pitfall))

  const withFallbacks = pitfalls.length === 2
    ? pitfalls
    : [
        ...pitfalls,
        sentence('Te disperser en rouvrant des sujets qui ne sont pas sur ton axe principal.'),
      ].slice(0, 2)

  return withFallbacks.map((entry) => `- ${entry}`).join('\n')
}

function buildTiming(year: string, priorityFamilies: AnnualFamily[]): string {
  const dominant = priorityFamilies[0] ?? 'cap'
  const accelerationCue =
    dominant === 'rythme' || dominant === 'alignement'
      ? 'Accelere quand la reponse du reel est claire et qu un axe prend vraiment.'
      : 'Accelere quand ton axe est clarifie et que l execution devient simple.'

  const observationCue =
    dominant === 'maturation'
      ? 'Observe d abord ce qui murit avant de l exposer.'
      : 'Observe avant de rajouter de nouvelles charges.'

  const consolidationCue =
    dominant === 'cycle' || dominant === 'direction'
      ? 'Consolide ce qui tient vraiment et simplifie le reste.'
      : 'Consolide les choix qui ont prouve leur traction.'

  return [
    `Debut d annee: ${sentence(`${observationCue} Le debut de ${year} sert a trier, nommer et ajuster`)}`,
    `Milieu d annee: ${sentence(accelerationCue)}`,
    `Fin d annee: ${sentence(consolidationCue)}`,
  ].join('\n')
}

function buildImmediateAction(priorityFamily: AnnualFamily): string {
  switch (priorityFamily) {
    case 'rythme':
      return sentence('Dans les 72 prochaines heures, bloque un seul creneau de 90 minutes pour ta priorite numero un et annule une demande qui parasite ton rythme.')
    case 'alignement':
      return sentence('Dans les prochaines 24 a 72 heures, liste les engagements qui te vident, garde un seul vrai oui, et ferme explicitement un non.')
    case 'direction':
      return sentence('Dans les 72 prochaines heures, choisis ton axe prioritaire, reconfigure un point concret de ton environnement, puis rattache une action visible a cet axe.')
    case 'cycle':
      return sentence('Dans les 48 prochaines heures, ferme un chantier sans elan reel et consacre un bloc de travail net a ce qui construit la base de ton annee.')
    case 'maturation':
      return sentence('Dans les 72 prochaines heures, reprends une idee importante, clarifie son fond, puis pose une seule action qui la fait murir proprement.')
    case 'cap':
    default:
      return sentence('Dans les 24 a 72 heures, ecris noir sur blanc tes 3 priorites, supprime une dispersion immediate, et bloque un premier pas concret sur la priorite numero un.')
  }
}

export function buildYearlyPriorityAnswer(input: YearlyPriorityAnswerInput): string {
  const prioritizedSignals = input.prioritizedSignals.slice(0, 8)
  const openingSignal = input.openingSignal?.signal ?? prioritizedSignals[0] ?? null
  const year = extractRequestedYear(input.userMessage)
  const priorities = buildPrioritySignals(openingSignal, prioritizedSignals)
  const priorityFamilies = priorities.map((entry) => entry.family)
  const primaryFamily = priorityFamilies[0] ?? 'cap'

  const blocks = [
    `ORIENTATION ${year}`,
    buildOrientation(year, openingSignal, prioritizedSignals),
    '',
    'TES 3 PRIORITES REELLES',
    priorities.map((entry, index) => buildPriorityBlock(year, entry.signal, entry.family, index + 1)).join('\n\n'),
    '',
    'CE QUI VA TE FREINER',
    buildPitfalls(year, priorityFamilies),
    '',
    'TON TIMING',
    buildTiming(year, priorityFamilies),
    '',
    'ACTION IMMEDIATE',
    buildImmediateAction(primaryFamily),
  ]

  return blocks.join('\n')
}

export function validateYearlyPriorityAnswerFormat(text: string): YearlyPriorityValidation {
  const cleaned = normalize(text)
  const issues: string[] = []
  const requiredHeadings = [
    /ORIENTATION\s+20\d{2}/i,
    /TES\s+3\s+PRIORITES\s+REELLES/i,
    /CE\s+QUI\s+VA\s+TE\s+FREINER/i,
    /TON\s+TIMING/i,
    /ACTION\s+IMMEDIATE/i,
  ]
  const disallowedPatterns = [
    /CE QUI SE PASSE/i,
    /POURQUOI\s+[CÇ]A\s+BLOQUE/i,
    /CE QUE TU DOIS FAIRE/i,
    /CLE\s+A\s+RETENIR/i,
    /SPH[EÈ]RE/i,
  ]

  for (const pattern of requiredHeadings) {
    if (!pattern.test(cleaned)) issues.push(`missing_heading:${pattern.source}`)
  }

  for (const pattern of disallowedPatterns) {
    if (pattern.test(cleaned)) issues.push(`disallowed_block:${pattern.source}`)
  }

  const priorityCount = (text.match(/^\d+\.\s+/gm) ?? []).length
  if (priorityCount !== 3) issues.push(`invalid_priority_count:${priorityCount}`)

  return {
    valid: issues.length === 0,
    issues,
    priorityCount,
  }
}
