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
  orientationAxis: string
  orientationMeaning: string
  whyPriority: string
  realLife: string
  pitfall: string
  timingStart: string
  timingMiddle: string
  timingEnd: string
  immediateAction: string
}

type PrioritySelection = {
  signal: StructuredSignal | null
  family: AnnualFamily
  isRadical: boolean
}

export type YearlyPriorityValidation = {
  valid: boolean
  issues: string[]
  priorityCount: number
}

const FORBIDDEN_ANNUAL_WORDS = ['true', 'false', 'signal', 'confidence'] as const
const RADICAL_PRIORITY_PATTERN = /\b(stop|supprime|coupe|refuse)\b/i

function normalize(text: string): string {
  return (text || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function sanitizeAnnualContent(text: string): string {
  return normalize(text)
    .replace(/\btrue\b/gi, 'vrai')
    .replace(/\bfalse\b/gi, 'faux')
    .replace(/\bconfidence\b/gi, 'fiabilite')
    .replace(/\bsignal\b/gi, 'point cle')
}

function sentence(value: string | null | undefined): string {
  const cleaned = sanitizeAnnualContent(value ?? '')
  if (!cleaned) return ''
  const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`
}

function compact(value: string, maxChars = 165): string {
  const cleaned = sanitizeAnnualContent(value)
  if (cleaned.length <= maxChars) return cleaned
  const cut = cleaned.lastIndexOf(' ', maxChars)
  return `${cleaned.slice(0, cut > 90 ? cut : maxChars).trim()}...`
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
  if (unwrapped) return sanitizeAnnualContent(unwrapped)

  if (typeof value === 'string') return sanitizeAnnualContent(value)
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

function describePersonalYear(signal: StructuredSignal): string | null {
  const numberCandidate = findByPaths(signal.value, [
    'yearly.personalYearNumber',
    'personalYearNumber',
    'personalYear',
  ])

  const number = typeof numberCandidate === 'number'
    ? numberCandidate
    : typeof numberCandidate === 'string'
      ? Number(numberCandidate)
      : null

  if (!number || !Number.isFinite(number)) return null

  const map: Record<number, string> = {
    1: 'un cycle d initiative et de relance nette',
    2: 'un cycle d alliance, de patience strategique et d ajustement relationnel',
    3: 'un cycle d expression, de visibilite utile et de mise en mouvement',
    4: 'un cycle de structure, de cadre et de fondations solides',
    5: 'un cycle de mouvement, de tri rapide et de reconfiguration',
    6: 'un cycle de responsabilite, d engagement durable et de stabilisation',
    7: 'un cycle de recul, d approfondissement et de recentrage',
    8: 'un cycle de consolidation, de responsabilite et de resultats mesurables',
    9: 'un cycle de cloture, de tri final et de detachement utile',
  }

  return map[number] ?? `un cycle ${number} qui demande une lecture plus strategique de tes priorites`
}

function describeSignal(signal: StructuredSignal | null): string {
  if (!signal) return 'ton annee demande un tri net des engagements et une meilleure allocation de ton energie'

  if (signal.subCategory === 'num_personal_year') {
    const personalYear = describePersonalYear(signal)
    if (personalYear) return personalYear
  }

  const exactPaths: Record<string, string[]> = {
    annual_guidance: ['publicSummary', 'summary', 'message'],
    astro_solar_return: ['annual_theme', 'theme', 'emphasis', 'summary'],
    astro_progressions: ['secondary_progressions.moon', 'moon', 'progressed_moon', 'summary'],
    astro_lunar_return: ['theme', 'summary', 'annual_theme'],
    astro_transits_current: ['summary', 'saturn', 'mars', 'moon', 'sun'],
    astro_transits_timing: ['summary', 'saturn', 'mars', 'moon', 'sun'],
    hd_current_transits: ['current_cycle', 'summary'],
    hd_current_cycle: ['current_cycle', 'summary'],
    kua_annual_influence: ['summary', 'annualInfluence', 'annualDirection'],
    kua_favorable_directions: ['favorable_directions', 'favorableDirections', 'summary'],
  }

  const candidate = stringifyCandidate(findByPaths(signal.value, exactPaths[signal.subCategory] ?? ['summary', 'message']))
  if (candidate) return compact(candidate)

  const firstScalar = stringifyCandidate(flattenScalarTexts(signal.value, 3)[0] ?? null)
  if (firstScalar) return compact(firstScalar)

  switch (familyFromSignal(signal)) {
    case 'cap':
      return 'il faut choisir plus franchement l axe qui merite vraiment tes ressources'
    case 'maturation':
      return 'quelque chose doit etre affine avant d etre expose ou decide'
    case 'rythme':
      return 'la traction existe, mais elle doit etre lue avant d accelerer'
    case 'alignement':
      return 'ton energie doit etre engagee sur moins de fronts, mais avec plus de nettete'
    case 'direction':
      return 'ton cadre concret doit mieux soutenir le cap que tu veux tenir'
    case 'cycle':
      return 'le cycle en cours favorise ce qui se consolide proprement et se mesure'
    default:
      return 'l annee te demande un tri plus net'
  }
}

function priorityTemplate(family: AnnualFamily, year: string): PriorityTemplate {
  switch (family) {
    case 'maturation':
      return {
        title: 'Maturer avant d exposer',
        orientationAxis: 'maturation de fond et positionnement plus juste',
        orientationMeaning: 'ce qui compte ne doit pas sortir trop tot; la qualite prime sur la vitesse d affichage',
        whyPriority: `En ${year}, cette priorite compte parce que ce qui est encore flou ou trop brut perdra de sa force si tu le pousses trop vite.`,
        realLife: 'Reprends ce qui est prometteur mais encore brouillon, affine le fond, teste-le sur un terrain limite, puis seulement ensuite rends-le visible.',
        pitfall: 'Montrer trop tot quelque chose qui n a pas encore passe le test du reel.',
        timingStart: `Observe ce qui murit reellement en debut de ${year} et retire ce qui demande encore trop d effort pour trop peu de clarte.`,
        timingMiddle: 'Expose seulement ce qui a gagne en solidite et en coherence.',
        timingEnd: 'Consolide ce qui a tenu dans la duree et laisse tomber ce qui reste a moitie prepare.',
        immediateAction: 'Dans les 72 prochaines heures, reprends un projet ou une decision importante, clarifie ce qui manque encore, puis planifie un seul test concret avant toute exposition plus large.',
      }
    case 'rythme':
      return {
        title: 'Cadencer l execution',
        orientationAxis: 'acceleration selective et cadence mieux tenue',
        orientationMeaning: 'l annee ne te demande pas plus d activite, mais une meilleure lecture de la traction et du bon moment',
        whyPriority: `Cette priorite est centrale en ${year} parce que la qualite du rythme fera la difference entre avancee utile et dispersion epuisante.`,
        realLife: 'Travaille sur peu de sujets a forte traction, bloque des plages nettes de concentration, et evite les relances reactives qui te font changer de cap toutes les deux heures.',
        pitfall: 'Relancer dix sujets a la fois des que l anxiete ou la pression monte.',
        timingStart: `En debut de ${year}, lis d abord la traction reelle avant d ajouter de nouveaux chantiers.`,
        timingMiddle: 'Accelere franchement seulement la ou le reel repond deja et ou un axe devient plus evident.',
        timingEnd: 'Ralentis pour stabiliser le bon rythme au lieu de finir l annee dans l empilement.',
        immediateAction: 'Dans les 24 a 72 heures, bloque un creneau de 90 minutes sur un seul sujet a traction prouvee, puis supprime une relance ou une reunion qui brouille ton rythme.',
      }
    case 'alignement':
      return {
        title: 'Nettoyer tes oui',
        orientationAxis: 'selection energetique et engagements plus propres',
        orientationMeaning: 'ce qui t eleve cette annee ne vient pas d un plus grand volume, mais d une meilleure qualite de tes oui',
        whyPriority: `C est prioritaire cette annee parce que ton energie devient un filtre strategique: mal engagee, elle te disperse; bien engagee, elle clarifie tout le reste.`,
        realLife: 'Accepte moins de sollicitations, dis oui seulement quand le corps et le contexte repondent, et coupe les efforts qui consomment beaucoup sans produire de veritable avancee.',
        pitfall: 'Dire oui pour calmer la pression, rester agreable ou ne pas decevoir, puis avancer a vide.',
        timingStart: `Le debut de ${year} sert a nettoyer les sollicitations, les obligations parasites et les oui reflexes.`,
        timingMiddle: 'Engage-toi sur peu de sujets, mais engage-toi vraiment quand la reponse est claire.',
        timingEnd: 'Protege ton energie et mesure ce qui t a reellement nourrie ou epuisee.',
        immediateAction: 'Dans les 24 a 72 heures, liste les engagements qui te vident, ferme explicitement un non, puis confirme un seul oui vraiment aligne.',
      }
    case 'direction':
      return {
        title: 'Reconfigurer le cadre',
        orientationAxis: 'repositionnement concret du cadre et du cap',
        orientationMeaning: 'la clarte viendra moins d une grande revelation que d un meilleur alignement entre ton environnement, ton axe et tes decisions',
        whyPriority: `Cette priorite compte en ${year} parce que ton cadre quotidien soutient ou sabote directement ton cap: si le decor reste flou, l execution restera floue aussi.`,
        realLife: 'Simplifie ton environnement, redefinis le prochain cap visible, reordonne tes priorites de semaine, et fais converger tes decisions concretes avec l axe que tu veux vraiment tenir.',
        pitfall: 'Changer le decor, les outils ou l organisation sans changer la vraie decision de fond.',
        timingStart: `En debut de ${year}, reconfigure ton cadre: agenda, espace, priorites et points de friction visibles.`,
        timingMiddle: 'Fais converger tes choix de temps, d espace et d attention avec le cap retenu.',
        timingEnd: 'Stabilise les reperes qui ont vraiment soutenu ta direction et coupe le superflu.',
        immediateAction: 'Dans les 72 prochaines heures, choisis ton axe prioritaire, modifie un point concret de ton environnement pour le soutenir, puis rattache une action visible a cet axe.',
      }
    case 'cycle':
      return {
        title: 'Consolider ce qui tient',
        orientationAxis: 'consolidation, responsabilites utiles et resultats durables',
        orientationMeaning: 'l annee favorise ce qui se construit proprement, se mesure, et peut etre tenu dans la duree',
        whyPriority: `En ${year}, cette priorite est strategique parce que les resultats viendront davantage de la consolidation que d un nouveau grand saut mal prepare.`,
        realLife: 'Termine ce qui a deja de la valeur, renforce ce qui donne des resultats clairs, pose une base durable, et ferme les sujets qui restent eternellement au stade de l intention.',
        pitfall: 'Empiler des debuts enthousiasmants sans fermer, cadrer ni mesurer ce qui doit vraiment grandir.',
        timingStart: `Le debut de ${year} sert a fermer les vieux fronts et a clarifier ce qui merite vraiment une base solide.`,
        timingMiddle: 'Mets l energie au milieu d annee sur la construction, le cadre et la preuve de resultat.',
        timingEnd: 'Consolide ce qui tient, mesure ce qui a vraiment avance et laisse mourir ce qui reste sans assise.',
        immediateAction: 'Dans les 48 a 72 heures, ferme un chantier sans elan reel et consacre un bloc de travail net a ce qui construit la base la plus durable de ton annee.',
      }
    case 'cap':
    default:
      return {
        title: 'Trier pour choisir',
        orientationAxis: 'tri strategique et structuration du cap',
        orientationMeaning: 'ce qui doit grandir cette annee passe par moins de fronts ouverts et plus de choix assumes',
        whyPriority: `Cette priorite est decisive en ${year} parce qu un cap brouille disperse tes ressources, alors qu un cap assume rend l execution beaucoup plus lisible.`,
        realLife: 'Trie tes projets, nomme clairement ta priorite numero un, coupe les engagements tiedes, et cesse de traiter au meme niveau ce qui est central et ce qui est secondaire.',
        pitfall: 'Garder des projets tiedes ouverts pour ne decevoir personne et finir par diluer ton axe principal.',
        timingStart: `Le debut de ${year} sert a faire l inventaire, nommer le cap et sortir des engagements qui n ont plus de vraie traction.`,
        timingMiddle: 'Mets ensuite tes moyens uniquement sur ce qui confirme ce cap dans le reel.',
        timingEnd: 'Stabilise la priorite choisie et coupe ce qui voudrait rouvrir la dispersion.',
        immediateAction: 'Dans les 24 a 72 heures, ecris noir sur blanc tes 3 vraies priorites, reporte un engagement secondaire et bloque un premier livrable visible sur la priorite numero un.',
      }
  }
}

function buildPriorityTemplateForSelection(selection: PrioritySelection, year: string): PriorityTemplate {
  const base = priorityTemplate(selection.family, year)

  if (!selection.isRadical) {
    return base
  }

  switch (selection.family) {
    case 'maturation':
      return {
        ...base,
        title: 'Stoppe l exposition precoce',
        whyPriority: `En ${year}, montrer trop tot ce qui est encore en construction te ferait perdre en credibilite et en justesse.`,
        realLife: 'Stoppe les annonces prematurees, refuse de presenter un projet encore flou, et coupe les prises de parole qui te forcent a afficher avant d etre prete.',
      }
    case 'rythme':
      return {
        ...base,
        title: 'Stoppe l agitation reactive',
        whyPriority: `Cette annee, la vraie progression passe par moins de reactions impulsives et plus de cadence choisie.`,
        realLife: 'Stoppe les relances dans tous les sens, supprime une urgence artificielle, et refuse d ouvrir un nouveau front tant que le precedent n a pas prouve sa traction.',
      }
    case 'alignement':
      return {
        ...base,
        title: 'Refuse les oui flous',
        whyPriority: `En ${year}, chaque oui non aligne te retire de l energie sur ce qui devrait vraiment avancer.`,
        realLife: 'Refuse une demande qui te sort de ton axe, coupe une collaboration tiede, et supprime un engagement que tu maintiens seulement pour rester disponible.',
      }
    case 'direction':
      return {
        ...base,
        title: 'Supprime le bruit du cadre',
        whyPriority: `Cette annee, ton cadre doit soutenir ton cap; s il reste encombre, tu perdras en lisibilite et en execution.`,
        realLife: 'Supprime un rituel inutile, coupe un usage qui brouille ton attention, et refuse d empiler de nouveaux outils avant d avoir clarifie le cap.',
      }
    case 'cycle':
      return {
        ...base,
        title: 'Coupe les chantiers sans preuve',
        whyPriority: `En ${year}, ce qui ne montre ni traction ni resultat commence a couter plus qu a promettre.`,
        realLife: 'Coupe un projet qui ne bouge pas, supprime une tache de maintien sans impact, et refuse d alimenter un chantier qui reste au stade de l intention.',
      }
    case 'cap':
    default:
      return {
        ...base,
        title: 'Coupe le secondaire',
        whyPriority: `En ${year}, laisser ouverts des fronts tiedes te coute plus que ce qu ils t apportent; ta progression depend d un tri plus net.`,
        realLife: 'Coupe un projet secondaire, refuse une opportunite non alignee, et supprime un engagement qui disperse ton attention sans renforcer ton axe principal.',
      }
  }
}

function buildPrioritySignals(
  openingSignal: StructuredSignal | null,
  prioritizedSignals: StructuredSignal[],
): PrioritySelection[] {
  const chosen: PrioritySelection[] = []
  const seenFamilies = new Set<AnnualFamily>()
  const candidates = [...(openingSignal ? [openingSignal] : []), ...prioritizedSignals]

  for (const signal of candidates) {
    const family = familyFromSignal(signal)
    if (!family || seenFamilies.has(family)) continue
    seenFamilies.add(family)
    chosen.push({ signal, family, isRadical: false })
    if (chosen.length === 3) break
  }

  for (const family of ['cap', 'rythme', 'cycle', 'alignement', 'direction', 'maturation'] as AnnualFamily[]) {
    if (chosen.length >= 3) break
    if (seenFamilies.has(family)) continue
    seenFamilies.add(family)
    chosen.push({ signal: null, family, isRadical: false })
    if (chosen.length === 3) break
  }

  return chosen.map((selection, index) => ({
    ...selection,
    isRadical: index === 0,
  }))
}

function buildOrientation(
  year: string,
  priorities: PrioritySelection[],
): string {
  const primary = priorities[0] ?? { signal: null, family: 'cap' as const, isRadical: false }
  const secondary = priorities[1] ?? null
  const primaryTemplate = priorityTemplate(primary.family, year)
  const primaryEvidence = describeSignal(primary.signal)

  const sentences = [
    sentence(`En ${year}, l axe dominant est ${primaryTemplate.orientationAxis}: ${primaryTemplate.orientationMeaning}`),
    sentence(`Ce qui ressort le plus cette annee, c est ${primaryEvidence}`),
  ]

  if (secondary) {
    const secondaryTemplate = priorityTemplate(secondary.family, year)
    sentences.push(
      sentence(`Le second mouvement utile de l annee passe par ${secondaryTemplate.orientationAxis}, pas par l empilement de nouveaux fronts`),
    )
  }

  return sentences.slice(0, 3).join(' ')
}

function buildPriorityBlock(year: string, selection: PrioritySelection, index: number): string {
  const template = buildPriorityTemplateForSelection(selection, year)
  const evidence = describeSignal(selection.signal)

  return [
    `${index}. ${template.title}`,
    `Pourquoi: ${sentence(`${template.whyPriority} Cette priorite se confirme dans l annee par ${evidence}`)}`,
    `Dans la vraie vie: ${sentence(template.realLife)}`,
  ].join('\n')
}

function buildPitfalls(year: string, priorities: PrioritySelection[]): string {
  const pitfalls = priorities
    .slice(0, 2)
    .map((selection) => {
      const template = priorityTemplate(selection.family, year)
      return sentence(template.pitfall)
    })

  const completedPitfalls = pitfalls.length >= 2
    ? pitfalls
    : [
        ...pitfalls,
        sentence('Te remettre a traiter comme urgents des sujets qui ne servent ni ton cap, ni ton rythme, ni ta consolidation.'),
      ].slice(0, 2)

  return completedPitfalls.map((entry) => `- ${entry}`).join('\n')
}

function buildTiming(year: string, priorities: PrioritySelection[]): string {
  const first = priorities[0] ?? { signal: null, family: 'cap' as const, isRadical: false }
  const second = priorities[1] ?? first
  const third = priorities[2] ?? second

  const firstTemplate = priorityTemplate(first.family, year)
  const secondTemplate = priorityTemplate(second.family, year)
  const thirdTemplate = priorityTemplate(third.family, year)

  return [
    `Debut d annee: ${sentence(firstTemplate.timingStart)}`,
    `Milieu d annee: ${sentence(secondTemplate.timingMiddle)}`,
    `Fin d annee: ${sentence(thirdTemplate.timingEnd)}`,
  ].join('\n')
}

function buildImmediateAction(year: string, primary: PrioritySelection): string {
  const template = priorityTemplate(primary.family, year)
  return sentence(template.immediateAction)
}

export function buildYearlyPriorityAnswer(input: YearlyPriorityAnswerInput): string {
  const prioritizedSignals = input.prioritizedSignals.slice(0, 8)
  const openingSignal = input.openingSignal?.signal ?? prioritizedSignals[0] ?? null
  const year = extractRequestedYear(input.userMessage)
  const priorities = buildPrioritySignals(openingSignal, prioritizedSignals)
  const primary = priorities[0] ?? { signal: null, family: 'cap' as const, isRadical: false }

  return [
    `ORIENTATION ${year}`,
    buildOrientation(year, priorities),
    '',
    'TES 3 PRIORITES REELLES',
    priorities.map((selection, index) => buildPriorityBlock(year, selection, index + 1)).join('\n\n'),
    '',
    'CE QUI VA TE FREINER',
    buildPitfalls(year, priorities),
    '',
    'TON TIMING',
    buildTiming(year, priorities),
    '',
    'ACTION IMMEDIATE',
    buildImmediateAction(year, primary),
  ].join('\n')
}

export function validateYearlyPriorityAnswerFormat(text: string): YearlyPriorityValidation {
  const cleaned = normalize(text)
  const issues: string[] = []
  const priorityBlocks = text
    .split(/\n\n/)
    .filter((block) => /^\d+\.\s+/m.test(block))
  const requiredHeadings = [
    /ORIENTATION\s+20\d{2}/i,
    /TES\s+3\s+PRIORITES\s+REELLES/i,
    /CE\s+QUI\s+VA\s+TE\s+FREINER/i,
    /TON\s+TIMING/i,
    /ACTION\s+IMMEDIATE/i,
  ]
  const disallowedPatterns = [
    /CE QUI SE PASSE/i,
    /POURQUOI\s+(?:CA|\u00C7A)\s+BLOQUE/i,
    /CE QUE TU DOIS FAIRE/i,
    /CLE\s+A\s+RETENIR/i,
    /SPH(?:ERE|\u00C8RE|\u00E8RE)/i,
  ]

  for (const pattern of requiredHeadings) {
    if (!pattern.test(cleaned)) issues.push(`missing_heading:${pattern.source}`)
  }

  for (const pattern of disallowedPatterns) {
    if (pattern.test(cleaned)) issues.push(`disallowed_block:${pattern.source}`)
  }

  const priorityCount = (text.match(/^\d+\.\s+/gm) ?? []).length
  if (priorityCount !== 3) issues.push(`invalid_priority_count:${priorityCount}`)
  if (!priorityBlocks.some((block) => RADICAL_PRIORITY_PATTERN.test(block))) {
    issues.push('missing_radical_priority')
  }

  for (const word of FORBIDDEN_ANNUAL_WORDS) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(cleaned)) {
      issues.push(`forbidden_word:${word}`)
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    priorityCount,
  }
}
