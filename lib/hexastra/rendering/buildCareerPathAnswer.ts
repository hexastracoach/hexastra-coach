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

type CareerTraitSpec = {
  natural: string[]
  environments: string[]
  blockers: string[]
  actions: {
    primary: string
    secondary: string
  }
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
    environmentCount: 5,
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
    /\b(maison 10|house10|house 10|maison 6|house6|house 6)\b/i,
  ],
  autonomy: [
    /\b(manifesteur|manifestor|independant|liberte|freelance|initier)\b/i,
    /\b(sagittaire|sagittarius)\b/i,
  ],
  movement: [
    /\b(sagittaire|sagittarius|mars|terrain|variete|mouvement|mobile)\b/i,
    /\b(generator|generateur)\b/i,
  ],
  analysis: [
    /\b(vierge|virgo|diagnostic|analyse|recherche|strategie)\b/i,
    /\b(^|[^0-9])7([^0-9]|$)\b/i,
  ],
  relation: [
    /\b(balance|libra|relation|client|partenariat|communaute|accompagnement)\b/i,
    /\b(2\/4|4\/6)\b/i,
  ],
}

const CAREER_TRAITS: Record<CareerTraitId, CareerTraitSpec> = {
  guidance: {
    natural: [
      'Tu donnes le meilleur quand ton regard aide quelqu un a voir plus clair.',
      'Tu avances mieux quand ta valeur est reconnue, pas quand tu la forces.',
    ],
    environments: [
      'travail avec interaction humaine (accompagnement, relation client, conseil)',
      'role de transmission (formation, mentorat, contenu, animation)',
      'poste ou tu aides a clarifier une situation complexe',
    ],
    blockers: [
      'te vendre en continu dans un cadre qui ne voit pas ta valeur',
      'rester dans un poste ou tu pousses sans retour clair',
    ],
    actions: {
      primary: 'teste un role ou ton regard aide vraiment quelqu un cette semaine',
      secondary: 'demande a deux personnes ou elles voient ta valeur la plus nette',
    },
  },
  creative: {
    natural: [
      'Tu restes engage quand tu peux creer, montrer ou porter une idee.',
      'Tu t eteins vite dans un cadre sans expression personnelle.',
    ],
    environments: [
      'environnement creatif (contenu, design, ecriture, image)',
      'role de communication (media, marque, presentation, narration)',
      'travail ou tu peux transformer une idee en forme visible',
    ],
    blockers: [
      'accepter un role trop sec ou sans espace de creation',
      'faire seulement de l execution sans marge personnelle',
    ],
    actions: {
      primary: 'produis un mini projet visible sur un sujet qui t attire',
      secondary: 'repere les taches ou tu perds toute energie faute de creation',
    },
  },
  structured: {
    natural: [
      'Tu avances mieux avec un cadre clair, des attentes nettes et du suivi.',
      'Tu rends plus de valeur quand une idee devient methode ou resultat.',
    ],
    environments: [
      'cadre organise avec responsabilites claires (gestion, operations, coordination)',
      'role ou tu ameliore un systeme (organisation, process, qualite)',
      'poste ou la rigueur et la fiabilite sont utiles au quotidien',
    ],
    blockers: [
      'rester dans le flou trop longtemps sans role ni priorite nette',
      'travailler dans un cadre brouillon qui change sans logique',
    ],
    actions: {
      primary: 'compare deux roles en regardant leur cadre reel, pas leur image',
      secondary: 'liste les conditions de travail qui te rendent fiable sur la duree',
    },
  },
  autonomy: {
    natural: [
      'Tu as besoin de marge pour choisir ton rythme et ta facon d agir.',
      'Tu tiens mieux quand tu peux porter un sujet sans lourdeur inutile.',
    ],
    environments: [
      'role autonome avec liberte d action (freelance, mission, projet personnel)',
      'poste ou tu peux lancer et porter un sujet (produit, business, developpement)',
      'cadre leger ou la responsabilite compte plus que le controle',
    ],
    blockers: [
      'rester dans un cadre trop ferme qui coupe ton elan',
      'attendre trop d autorisations avant de bouger',
    ],
    actions: {
      primary: 'teste une piste ou tu peux decider vite et agir sans lourdeur',
      secondary: 'parle avec une personne qui travaille deja de facon plus autonome',
    },
  },
  movement: {
    natural: [
      'Tu tiens mieux dans un travail qui bouge et qui varie.',
      'Tu perds vite l elan quand tout devient trop repetitif.',
    ],
    environments: [
      'travail avec mouvement et variete (terrain, commercial, evenements, lancement)',
      'environnement avec changements rapides (startup, projet, mission courte)',
      'poste vivant ou les journees ne se ressemblent pas',
    ],
    blockers: [
      'te forcer a rester dans un rythme trop repetitif',
      'accepter une routine qui te vide sans te stimuler',
    ],
    actions: {
      primary: 'teste un terrain plus mobile avant de te fixer sur un titre',
      secondary: 'observe les moments ou la variete te redonne le plus d elan',
    },
  },
  analysis: {
    natural: [
      'Tu apportes beaucoup quand tu observes, structures et comprends vite.',
      'Tu es plus fort quand tu lis bien une situation avant de foncer.',
    ],
    environments: [
      'role d analyse et de recul (strategie, recherche, diagnostic, audit)',
      'travail de precision utile (qualite, edition, optimisation, data)',
      'poste ou tu rends une situation plus claire et plus simple',
    ],
    blockers: [
      'sur analyser sans jamais tester le terrain',
      'rester trop longtemps dans la preparation pure',
    ],
    actions: {
      primary: 'choisis une piste et verifie-la avec un test concret cette semaine',
      secondary: 'note les contextes ou ton recul aide vraiment a mieux decider',
    },
  },
  relation: {
    natural: [
      'Tu progresses quand le lien humain est vivant et utile.',
      'Tu tiens mieux dans un cadre ou la relation compte vraiment.',
    ],
    environments: [
      'travail de lien et de mediation (partenariats, relation client, communaute)',
      'cadre collaboratif ou tu crees de la confiance',
      'poste ou tu relies des personnes, des besoins ou des equipes',
    ],
    blockers: [
      'rester trop longtemps dans un environnement froid ou isole',
      'tenir un role sans echanges vivants ni vrai lien humain',
    ],
    actions: {
      primary: 'repere les moments ou tu te sens le plus vivant avec les autres',
      secondary: 'teste un cadre ou la relation fait partie du travail, pas un bonus',
    },
  },
}

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
    parts.push(...flattenScalarTexts(signal.value, 8))
  }

  return normalize(parts.join(' | '))
}

function pickCareerTraits(
  userMessage: string,
  openingSignal: OpeningSignalSelection | null,
  prioritizedSignals: StructuredSignal[],
): CareerTraitId[] {
  const corpus = collectCareerCorpus(userMessage, openingSignal, prioritizedSignals)
  const scored = (Object.keys(TRAIT_PATTERNS) as CareerTraitId[])
    .map((trait) => ({
      trait,
      score: TRAIT_PATTERNS[trait].reduce((sum, pattern) => sum + (pattern.test(corpus) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score)

  const resolved = scored.filter((entry) => entry.score > 0).map((entry) => entry.trait)
  return (resolved.length > 0 ? resolved : DEFAULT_TRAITS).slice(0, 3)
}

function hasCareerTimingCue(signals: StructuredSignal[]): boolean {
  return signals.some((signal) =>
    /(year|cycle|timing|transit|solar|lunar|progress)/i.test(signal.subCategory),
  )
}

function buildNaturalSection(
  traits: CareerTraitId[],
  userPlan: UserPlan,
  hasTimingCue: boolean,
): string {
  const style = CAREER_PLAN_STYLES[userPlan]
  const lines = uniq(
    traits.flatMap((trait, index) =>
      index === 0
        ? CAREER_TRAITS[trait].natural
        : [CAREER_TRAITS[trait].natural[0]],
    ),
  )

  if (userPlan === 'premium' || userPlan === 'praticien') {
    lines.push(
      hasTimingCue
        ? 'En ce moment, teste court avant de te fixer plus loin.'
        : 'Choisis d abord le bon cadre. Le titre vient ensuite.',
    )
  } else if (userPlan === 'essentiel') {
    lines.push('Choisis un cadre qui te ressemble avant de viser un titre.')
  }

  return lines
    .slice(0, style.naturalCount)
    .map((line) => sentence(line))
    .join('\n')
}

function buildEnvironmentSection(traits: CareerTraitId[], userPlan: UserPlan): string {
  const style = CAREER_PLAN_STYLES[userPlan]
  const items = uniq(traits.flatMap((trait) => CAREER_TRAITS[trait].environments))
    .slice(0, style.environmentCount)

  return items.map((item) => `- ${item}`).join('\n')
}

function buildBlockerSection(traits: CareerTraitId[], userPlan: UserPlan): string {
  const style = CAREER_PLAN_STYLES[userPlan]
  const items = uniq(traits.flatMap((trait) => CAREER_TRAITS[trait].blockers))
    .slice(0, style.blockerCount)

  return items.map((item) => `- ${sentence(item)}`).join('\n')
}

function buildActionSection(
  traits: CareerTraitId[],
  userPlan: UserPlan,
  hasTimingCue: boolean,
): string {
  const style = CAREER_PLAN_STYLES[userPlan]
  const primary = CAREER_TRAITS[traits[0] ?? DEFAULT_TRAITS[0]].actions.primary
  const secondaryBase =
    CAREER_TRAITS[traits[1] ?? traits[0] ?? DEFAULT_TRAITS[1]].actions.secondary
  const secondary = hasTimingCue && (userPlan === 'premium' || userPlan === 'praticien')
    ? 'ensuite, garde seulement le terrain qui repond vraiment'
    : secondaryBase

  if (style.actionCount === 1) {
    return `- ${sentence(primary)}`
  }

  return [
    `- Action principale: ${sentence(primary)}`,
    `- Action secondaire: ${sentence(secondary)}`,
  ]
    .slice(0, style.actionCount)
    .join('\n')
}

export function buildCareerPathAnswer(input: CareerPathAnswerInput): string {
  const userPlan = normalizeUserPlan(input.userPlan)
  const signals = collectCareerSignals(input.openingSignal, input.prioritizedSignals.slice(0, 8))
  const traits = pickCareerTraits(input.userMessage, input.openingSignal, signals)
  const hasTimingCue = hasCareerTimingCue(signals)

  return [
    '→ CE QUI TE CORRESPOND NATURELLEMENT',
    buildNaturalSection(traits, userPlan, hasTimingCue),
    '',
    '→ LES ENVIRONNEMENTS OU METIERS ALIGNES',
    buildEnvironmentSection(traits, userPlan),
    '',
    '→ CE QUI VA TE BLOQUER',
    buildBlockerSection(traits, userPlan),
    '',
    '→ CE QUE TU PEUX FAIRE MAINTENANT',
    buildActionSection(traits, userPlan, hasTimingCue),
  ].join('\n')
}
