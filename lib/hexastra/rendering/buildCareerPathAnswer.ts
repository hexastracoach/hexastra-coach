import type { OpeningSignalSelection } from '@/lib/hexastra/orchestrator/selectOpeningSignal'
import type { StructuredSignal } from '@/lib/hexastra/retrieval/structuredSignalBuilder'
import { normalizeUserPlan } from '@/lib/hexastra/rendering/normalizeUserPlan'
import type { UserPlan } from '@/lib/hexastra/rendering/selectRenderProfile'
import { unwrapDisplayText } from '@/lib/hexastra/utils/unwrapDisplayValue'

export type CareerPathAnswerInput = {
  userMessage: string
  openingSignal: OpeningSignalSelection | null
  prioritizedSignals: StructuredSignal[]
  userPlan?: UserPlan | null
}

type CareerPlanStyle = {
  naturalCount: number
  environmentCount: number
  blockerCount: number
  actionCount: number
}

type CareerTraitId =
  | 'guidance'
  | 'creative'
  | 'structured'
  | 'autonomy'
  | 'movement'
  | 'analysis'
  | 'relation'

type CareerAutonomyStyle = 'autonomous' | 'framed' | 'hybrid'
type CareerEnergyStyle = 'relational' | 'analytical' | 'creative'
type CareerPaceStyle = 'stable' | 'mobile' | 'exploratory'
type CareerDominantMode = 'clarify' | 'structure' | 'create' | 'launch'

type CareerProfile = {
  traits: CareerTraitId[]
  scores: Record<CareerTraitId, number>
  autonomyStyle: CareerAutonomyStyle
  energyStyle: CareerEnergyStyle
  paceStyle: CareerPaceStyle
  dominantMode: CareerDominantMode
}

const CAREER_PLAN_STYLES: Record<UserPlan, CareerPlanStyle> = {
  free: {
    naturalCount: 2,
    environmentCount: 3,
    blockerCount: 1,
    actionCount: 1,
  },
  essentiel: {
    naturalCount: 3,
    environmentCount: 4,
    blockerCount: 2,
    actionCount: 2,
  },
  premium: {
    naturalCount: 4,
    environmentCount: 4,
    blockerCount: 2,
    actionCount: 2,
  },
  praticien: {
    naturalCount: 4,
    environmentCount: 5,
    blockerCount: 2,
    actionCount: 2,
  },
}

const DEFAULT_TRAITS: CareerTraitId[] = ['guidance', 'structured', 'autonomy']

const TRAIT_PATTERNS: Record<CareerTraitId, RegExp[]> = {
  guidance: [
    /\b(projecteur|projector|invitation|mentor|guide|coaching|conseil)\b/i,
    /\b(2\/4|5\/1|5\/2)\b/i,
  ],
  creative: [
    /\b(lion|leo|expression|gorge|throat|venus|creation|creatif|creative)\b/i,
    /\b(^|[^0-9])3([^0-9]|$)\b/i,
  ],
  structured: [
    /\b(capricorne|capricorn|vierge|virgo|saturne|saturn|metal)\b/i,
    /\b(maison 10|house10|house 10|maison 6|house6|house 6|process|organisation)\b/i,
  ],
  autonomy: [
    /\b(manifesteur|manifestor|independant|liberte|freelance|initier|autonome)\b/i,
    /\b(sagittaire|sagittarius)\b/i,
  ],
  movement: [
    /\b(sagittaire|sagittarius|mars|terrain|variete|mouvement|mobile|lancement)\b/i,
    /\b(generator|generateur)\b/i,
  ],
  analysis: [
    /\b(vierge|virgo|diagnostic|analyse|recherche|strategie|clarifier)\b/i,
    /\b(^|[^0-9])7([^0-9]|$)\b/i,
  ],
  relation: [
    /\b(balance|libra|relation|client|partenariat|communaute|accompagnement)\b/i,
    /\b(2\/4|4\/6)\b/i,
  ],
}

const FORBIDDEN_CAREER_PATTERNS = [
  /\bHuman Design\b/gi,
  /\bastrologie\b/gi,
  /\bnumerologie\b/gi,
  /\benneagramme\b/gi,
  /\bKua\b/gi,
  /\bProjecteur\b/gi,
  /\bManifestor\b/gi,
  /\bManifesteur\b/gi,
  /\bCapricorne\b/gi,
  /\bVierge\b/gi,
  /\bSagittaire\b/gi,
  /\btout est possible\b/gi,
  /\btu es fait pour aider les autres\b/gi,
  /\btu es une personne unique\b/gi,
]

function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function sentence(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return ''
  return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`
}

function uniq<T>(values: T[]): T[] {
  return [...new Set(values)]
}

function flattenScalarTexts(value: unknown, limit = 6, bucket: string[] = []): string[] {
  if (bucket.length >= limit || value === null || value === undefined) return bucket

  if (typeof value === 'string') {
    const unwrapped = unwrapDisplayText(value)
    const cleaned = (unwrapped || value).trim()
    if (cleaned) bucket.push(cleaned)
    return bucket
  }

  if (typeof value === 'number') {
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

function collectCareerSignals(
  openingSignal: OpeningSignalSelection | null,
  prioritizedSignals: StructuredSignal[],
): StructuredSignal[] {
  return uniq([openingSignal?.signal, ...prioritizedSignals].filter(Boolean) as StructuredSignal[])
}

function collectCareerCorpus(
  userMessage: string,
  openingSignal: OpeningSignalSelection | null,
  prioritizedSignals: StructuredSignal[],
): string {
  const parts = [userMessage]

  for (const signal of collectCareerSignals(openingSignal, prioritizedSignals)) {
    parts.push(signal.subCategory.replace(/_/g, ' '))
    parts.push(...flattenScalarTexts(signal.value, 10))
  }

  return normalize(parts.join(' | '))
}

function scoreCareerTraits(
  userMessage: string,
  openingSignal: OpeningSignalSelection | null,
  prioritizedSignals: StructuredSignal[],
): Record<CareerTraitId, number> {
  const corpus = collectCareerCorpus(userMessage, openingSignal, prioritizedSignals)

  return (Object.keys(TRAIT_PATTERNS) as CareerTraitId[]).reduce(
    (scores, trait) => {
      scores[trait] = TRAIT_PATTERNS[trait].reduce(
        (sum, pattern) => sum + (pattern.test(corpus) ? 1 : 0),
        0,
      )
      return scores
    },
    {} as Record<CareerTraitId, number>,
  )
}

function pickCareerTraitsFromScores(scores: Record<CareerTraitId, number>): CareerTraitId[] {
  const resolved = (Object.keys(scores) as CareerTraitId[])
    .map((trait) => ({ trait, score: scores[trait] }))
    .sort((a, b) => b.score - a.score)
    .filter((entry) => entry.score > 0)
    .map((entry) => entry.trait)

  return (resolved.length > 0 ? resolved : DEFAULT_TRAITS).slice(0, 3)
}

function resolveCareerProfile(scores: Record<CareerTraitId, number>): CareerProfile {
  const traits = pickCareerTraitsFromScores(scores)
  const careScore = scores.guidance + scores.relation
  const systemScore = scores.structured + scores.analysis
  const creativeScore = scores.creative
  const driveScore = scores.autonomy + scores.movement
  const autonomyPull = scores.autonomy + scores.movement
  const framePull = scores.structured + scores.analysis

  const dominantMode: CareerDominantMode =
    creativeScore >= careScore && creativeScore >= systemScore && creativeScore >= driveScore
      ? 'create'
      : systemScore >= careScore && systemScore >= driveScore
        ? 'structure'
        : careScore >= driveScore
          ? 'clarify'
          : 'launch'

  const energyStyle: CareerEnergyStyle =
    creativeScore >= careScore && creativeScore >= systemScore
      ? 'creative'
      : systemScore > careScore
        ? 'analytical'
        : 'relational'

  const autonomyStyle: CareerAutonomyStyle =
    autonomyPull >= framePull + 2 ? 'autonomous' : framePull >= autonomyPull + 2 ? 'framed' : 'hybrid'

  const paceStyle: CareerPaceStyle =
    scores.movement >= scores.structured + 1
      ? 'mobile'
      : scores.structured + scores.analysis >= scores.movement + 2
        ? 'stable'
        : 'exploratory'

  return {
    traits,
    scores,
    dominantMode,
    energyStyle,
    autonomyStyle,
    paceStyle,
  }
}

function hasCareerTimingCue(signals: StructuredSignal[]): boolean {
  return signals.some((signal) =>
    /(year|cycle|timing|transit|solar|lunar|progress)/i.test(signal.subCategory),
  )
}

function buildDominantSentence(profile: CareerProfile): string {
  switch (profile.dominantMode) {
    case 'clarify':
      return 'Tu brilles quand tu clarifies une situation et aides a choisir.'
    case 'structure':
      return 'Tu brilles quand tu mets du cadre, des priorites ou une methode.'
    case 'create':
      return 'Tu brilles quand tu rends une idee claire, visible et vivante.'
    case 'launch':
      return 'Tu brilles quand tu lances, testes et fais avancer un sujet.'
  }
}

function buildWorkNeedSentence(profile: CareerProfile): string {
  switch (profile.autonomyStyle) {
    case 'autonomous':
      return 'Tu tiens mieux avec de la marge et une vraie responsabilite.'
    case 'framed':
      return 'Tu tiens mieux avec un cadre net et des attentes stables.'
    case 'hybrid':
    default:
      return 'Tu tiens mieux avec un cadre clair, mais pas rigide.'
  }
}

function buildEnergySentence(profile: CareerProfile): string {
  switch (profile.energyStyle) {
    case 'creative':
      return 'Tu restes engage quand tu peux creer ou faire passer une idee.'
    case 'analytical':
      return 'Tu restes bon quand tu peux lire, trier et comprendre.'
    case 'relational':
    default:
      return 'Le lien humain utile te porte plus qu un travail froid.'
  }
}

function buildSuccessSentence(profile: CareerProfile, hasTimingCue: boolean): string {
  if (hasTimingCue) {
    return 'Teste court maintenant. Garde ensuite ce qui repond vraiment.'
  }

  if (profile.dominantMode === 'structure') {
    return 'Tu reussis mieux quand ton role regle un vrai probleme.'
  }

  if (profile.dominantMode === 'clarify') {
    return 'Ta valeur se voit vite quand tu aides a decider plus clair.'
  }

  if (profile.dominantMode === 'create') {
    return 'Ta valeur monte quand une idee devient visible et utile.'
  }

  return 'Tu progresses quand tu testes vite puis gardes ce qui marche.'
}

function buildCareerFamilies(profile: CareerProfile): string[] {
  const families: string[] = []

  switch (profile.dominantMode) {
    case 'clarify':
      families.push('role ou tu clarifies, reformules et aides a choisir')
      families.push('cadre ou ta presence aide quelqu un a avancer ou decider')
      break
    case 'structure':
      families.push('role ou tu transformes du flou en cadre, priorites ou methode')
      families.push('poste ou tu mets de l ordre dans un projet, une equipe ou un process')
      break
    case 'create':
      families.push('role ou tu rends une idee lisible, visible ou engageante')
      families.push('terrain ou tu portes un message, une forme ou une experience claire')
      break
    case 'launch':
      families.push('role ou tu testes, ajustes et fais avancer vite')
      families.push('terrain ou il faut bouger, lancer et iterer sans lourdeur')
      break
  }

  switch (profile.autonomyStyle) {
    case 'autonomous':
      families.push('cadre leger ou la responsabilite compte plus que le controle')
      families.push('travail autonome avec vraie marge pour choisir ton rythme')
      break
    case 'framed':
      families.push('poste stable avec attentes nettes, responsabilites claires et suivi')
      families.push('cadre ou la fiabilite, la methode et la constance comptent')
      break
    case 'hybrid':
      families.push('role avec cadre clair et marge reelle pour organiser ta methode')
      break
  }

  switch (profile.energyStyle) {
    case 'relational':
      families.push('environnement ou la relation sert une decision, pas juste un lien social')
      families.push('travail de lien, mediation ou relation client avec utilite visible')
      break
    case 'analytical':
      families.push('travail ou tu lis une situation, trouves le point faible et proposes mieux')
      families.push('poste de diagnostic, optimisation ou lecture fine avant action')
      break
    case 'creative':
      families.push('environnement creatif ou tu fais passer une idee de facon claire')
      families.push('travail ou tu relies message, image, narration ou experience')
      break
  }

  switch (profile.paceStyle) {
    case 'mobile':
      families.push('cadre vivant avec terrain, mouvement, lancement ou missions courtes')
      break
    case 'stable':
      families.push('terrain stable ou la repetition construit un vrai resultat')
      break
    case 'exploratory':
      families.push('cadre ou tu peux explorer une piste sans te figer trop vite')
      break
  }

  return uniq(families)
}

function buildWearLine(profile: CareerProfile): string {
  if (profile.energyStyle === 'creative') {
    return 'execution pure, sans voix, sans espace pour porter une idee'
  }

  if (profile.energyStyle === 'analytical') {
    return 'agitation permanente sans recul, sans tri ni logique de fond'
  }

  return 'cadre froid ou tu aides beaucoup sans effet clair ni limites nettes'
}

function buildExpansionLine(profile: CareerProfile, hasTimingCue: boolean): string {
  if (hasTimingCue) {
    return 'une piste courte d abord, puis un cadre plus large quand la reponse est nette'
  }

  switch (profile.dominantMode) {
    case 'clarify':
      return 'roles ou ton regard devient decision, cadrage ou accompagnement'
    case 'structure':
      return 'roles ou ta methode devient pilotage, priorite ou qualite'
    case 'create':
      return 'roles ou ton message devient offre, contenu ou experience visible'
    case 'launch':
    default:
      return 'roles ou ton elan devient lancement, developpement ou terrain responsable'
  }
}

function buildNaturalSection(
  profile: CareerProfile,
  userPlan: UserPlan,
  hasTimingCue: boolean,
): string {
  const style = CAREER_PLAN_STYLES[userPlan]
  const lines = [
    buildDominantSentence(profile),
    buildWorkNeedSentence(profile),
    buildEnergySentence(profile),
  ]

  if (userPlan === 'premium' || userPlan === 'praticien') {
    lines.push(buildSuccessSentence(profile, hasTimingCue))
  } else if (userPlan === 'essentiel') {
    lines.push('Choisis le bon cadre avant de viser le bon titre.')
  }

  return uniq(lines)
    .slice(0, style.naturalCount)
    .map((line) => sentence(line))
    .join('\n')
}

function buildEnvironmentSection(
  profile: CareerProfile,
  userPlan: UserPlan,
  hasTimingCue: boolean,
): string {
  const style = CAREER_PLAN_STYLES[userPlan]
  const families = buildCareerFamilies(profile)

  if (userPlan === 'premium') {
    const items = [
      `- Metiers alignes: ${sentence(families[0] ?? 'role ou tu apportes une valeur visible')}`,
      `- Environnements favorables: ${sentence(families[2] ?? families[1] ?? 'cadre clair avec marge reelle et utilite concrete')}`,
      `- Maniere de reussir: ${sentence(buildSuccessSentence(profile, hasTimingCue).replace(/\.$/, ''))}`,
      `- A construire maintenant: ${sentence(
        hasTimingCue
          ? 'garde une piste courte ou ta valeur se voit vite'
          : 'choisis un terrain simple ou ta facon de travailler se voit tout de suite',
      )}`,
    ]

    return items.slice(0, style.environmentCount).join('\n')
  }

  if (userPlan === 'praticien') {
    const items = [
      `- Terrain naturel: ${sentence(families[0] ?? 'cadre ou ta valeur devient vite visible')}`,
      `- Terrain d usure: ${sentence(buildWearLine(profile))}`,
      `- Terrain d expansion: ${sentence(buildExpansionLine(profile, hasTimingCue))}`,
      `- Logique de reussite: ${sentence(buildSuccessSentence(profile, hasTimingCue).replace(/\.$/, ''))}`,
      `- Vigilance pro: ${sentence(
        profile.autonomyStyle === 'autonomous'
          ? 'ne rentre pas dans un cadre qui demande de demander la permission pour tout'
          : 'ne compense pas un role flou par trop d effort et trop de disponibilite',
      )}`,
    ]

    return items.slice(0, style.environmentCount).join('\n')
  }

  return families
    .slice(0, style.environmentCount)
    .map((item) => `- ${item}`)
    .join('\n')
}

function buildBlockerCandidates(profile: CareerProfile): string[] {
  const items: string[] = []

  switch (profile.dominantMode) {
    case 'clarify':
      items.push('te rendre utile partout sans cadre clair ni vraie place')
      break
    case 'structure':
      items.push('porter le desordre des autres au lieu de cadrer ton role')
      break
    case 'create':
      items.push('accepter un cadre propre mais sans place pour ta voix')
      break
    case 'launch':
      items.push('attendre un plan parfait au lieu de tester un vrai terrain')
      break
  }

  switch (profile.autonomyStyle) {
    case 'autonomous':
      items.push('rester dans un cadre qui controle tout et use ton elan')
      break
    case 'framed':
      items.push('dire oui a un role flou puis compenser par trop d effort')
      break
    case 'hybrid':
      items.push('accepter un cadre trop vague ou trop ferme, jamais bien ajuste')
      break
  }

  switch (profile.energyStyle) {
    case 'analytical':
      items.push('analyser longtemps sans verifier une piste sur le terrain')
      break
    case 'creative':
      items.push('faire de l execution pure jusqu a eteindre ton envie')
      break
    case 'relational':
      items.push('dire oui pour aider, meme quand le cadre ne te porte pas')
      break
  }

  switch (profile.paceStyle) {
    case 'mobile':
      items.push('tenir une routine trop fixe jusqu a perdre ton energie')
      break
    case 'stable':
      items.push('changer trop vite alors que ta force vient de la constance')
      break
    case 'exploratory':
      items.push('ouvrir trop de pistes puis ne plus savoir laquelle nourrir')
      break
  }

  return uniq(items)
}

function buildBlockerSection(profile: CareerProfile, userPlan: UserPlan): string {
  const style = CAREER_PLAN_STYLES[userPlan]
  return buildBlockerCandidates(profile)
    .slice(0, style.blockerCount)
    .map((item) => `- ${sentence(item)}`)
    .join('\n')
}

function buildPrimaryAction(profile: CareerProfile): string {
  switch (profile.dominantMode) {
    case 'clarify':
      return 'teste une mission courte ou tu aides a clarifier un vrai probleme'
    case 'structure':
      return 'compare deux roles en regardant leur cadre reel et leurs priorites'
    case 'create':
      return 'montre une idee simple dans un format visible cette semaine'
    case 'launch':
    default:
      return 'teste une piste courte ou tu peux agir sans attendre'
  }
}

function buildSecondaryAction(profile: CareerProfile, hasTimingCue: boolean): string {
  if (hasTimingCue) {
    return 'garde ensuite le terrain qui repond vraiment et ferme le reste'
  }

  if (profile.energyStyle === 'analytical') {
    return 'note ou ton regard rend une situation plus simple ou plus nette'
  }

  if (profile.energyStyle === 'creative') {
    return 'repere une tache ou tu peux mettre plus de voix, de forme ou de message'
  }

  return 'parle a deux personnes qui voient deja ou tu es le plus utile'
}

function buildActionSection(
  profile: CareerProfile,
  userPlan: UserPlan,
  hasTimingCue: boolean,
): string {
  const style = CAREER_PLAN_STYLES[userPlan]
  const primary = buildPrimaryAction(profile)
  const secondary = buildSecondaryAction(profile, hasTimingCue)

  if (style.actionCount === 1) {
    return `- ${sentence(primary)}`
  }

  if (userPlan === 'praticien') {
    return [
      `- Action principale: ${sentence(primary)}`,
      `- Action secondaire: ${sentence(
        profile.autonomyStyle === 'autonomous'
          ? 'nomme un terrain d usure a fermer ce mois ci'
          : secondary,
      )}`,
    ]
      .slice(0, style.actionCount)
      .join('\n')
  }

  return [
    `- Action principale: ${sentence(primary)}`,
    `- Action secondaire: ${sentence(secondary)}`,
  ]
    .slice(0, style.actionCount)
    .join('\n')
}

function sanitizeCareerText(text: string): string {
  let cleaned = text

  for (const pattern of FORBIDDEN_CAREER_PATTERNS) {
    cleaned = cleaned.replace(pattern, '')
  }

  return cleaned
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+\./g, '.')
    .replace(/\s+,/g, ',')
    .trim()
}

export function buildCareerPathAnswer(input: CareerPathAnswerInput): string {
  const userPlan = normalizeUserPlan(input.userPlan)
  const signals = collectCareerSignals(input.openingSignal, input.prioritizedSignals.slice(0, 8))
  const scores = scoreCareerTraits(input.userMessage, input.openingSignal, signals)
  const profile = resolveCareerProfile(scores)
  const hasTimingCue = hasCareerTimingCue(signals)

  return sanitizeCareerText(
    [
      '→ CE QUI TE CORRESPOND NATURELLEMENT',
      buildNaturalSection(profile, userPlan, hasTimingCue),
      '',
      '→ LES ENVIRONNEMENTS OU METIERS ALIGNES',
      buildEnvironmentSection(profile, userPlan, hasTimingCue),
      '',
      '→ CE QUI VA TE BLOQUER',
      buildBlockerSection(profile, userPlan),
      '',
      '→ CE QUE TU PEUX FAIRE MAINTENANT',
      buildActionSection(profile, userPlan, hasTimingCue),
    ].join('\n'),
  )
}
