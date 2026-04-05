import type { FinalAnswer } from '@/lib/hexastra/rendering/buildFinalAnswer'
import type { RenderFormat, RenderProfile } from '@/lib/hexastra/rendering/selectRenderProfile'

export type ApplyRenderProfileInput = {
  answer: {
    text: string
    sections?: {
      opening?: string
      explanation?: string
      action?: string
      key?: string
      currentPlay?: string
      hiddenLogic?: string
      tension?: string
      trajectory?: string
      lever?: string
      actionNow?: string
    }
  }
  profile: RenderProfile
}

type AnswerSections = NonNullable<FinalAnswer['sections']>

function normalize(text: string): string {
  return (text || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function capitalize(text: string): string {
  const cleaned = normalize(text)
  if (!cleaned) return ''
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

function sentence(text: string): string {
  const cleaned = capitalize(text)
  if (!cleaned) return ''
  return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`
}

function splitSentences(text: string): string[] {
  const cleaned = normalize(text)
  if (!cleaned) return []

  const matches = cleaned.match(/[^.!?]+[.!?]?/g) ?? []
  return matches
    .map((entry) => sentence(entry))
    .filter(Boolean)
}

function limitSentences(text: string | undefined, maxSentences: number): string | undefined {
  const sentences = splitSentences(text ?? '')
  if (sentences.length === 0) return undefined
  return sentences.slice(0, maxSentences).join(' ')
}

function stripNarrativeOpening(text: string | undefined): string | undefined {
  const cleaned = normalize(text ?? '')
  if (!cleaned) return undefined

  const stripped = cleaned
    .replace(/^en ce moment,\s+ce qui ressort le plus nettement, c'est que\s*/i, '')
    .replace(/^ce qui ressort d'abord, c'est que\s*/i, '')
    .replace(/^actuellement,\s*/i, '')
    .replace(/^en ce moment,\s*/i, '')
    .replace(/^le plus clair, c'est que\s*/i, '')

  return sentence(stripped)
}

function coerceProfile(profile: RenderProfile): RenderProfile {
  const safeFormat: RenderFormat =
    profile?.format === 'concise' ||
    profile?.format === 'enriched' ||
    profile?.format === 'storytelling' ||
    profile?.format === 'deep'
      ? profile.format
      : 'enriched'

  const toneByFormat = {
    concise: 'direct',
    enriched: 'fluid',
    storytelling: 'premium',
    deep: 'practitioner',
  } as const

  return {
    format: safeFormat,
    tone:
      profile?.tone === 'direct' ||
      profile?.tone === 'fluid' ||
      profile?.tone === 'premium' ||
      profile?.tone === 'practitioner'
        ? profile.tone
        : toneByFormat[safeFormat],
    maxSections: typeof profile?.maxSections === 'number' && profile.maxSections > 0 ? profile.maxSections : 4,
    includeNarrativeOpening: profile?.includeNarrativeOpening ?? safeFormat !== 'concise',
    includeDeepExplanation:
      profile?.includeDeepExplanation ?? (safeFormat === 'storytelling' || safeFormat === 'deep'),
    includeActionBlock: profile?.includeActionBlock ?? true,
    includeKeyBlock: profile?.includeKeyBlock ?? true,
  }
}

function buildSectionLimits(format: RenderFormat) {
  switch (format) {
    case 'concise':
      return { opening: 1, explanation: 1, action: 1, key: 1 }
    case 'enriched':
      return { opening: 2, explanation: 2, action: 1, key: 1 }
    case 'storytelling':
      return { opening: 2, explanation: 2, action: 2, key: 1 }
    case 'deep':
      return { opening: 2, explanation: 3, action: 2, key: 1 }
  }
}

function buildSixBlockLimits(format: RenderFormat) {
  switch (format) {
    case 'concise':
      return { currentPlay: 1, hiddenLogic: 1, tension: 1, trajectory: 1, lever: 1, actionNow: 1 }
    case 'enriched':
      return { currentPlay: 1, hiddenLogic: 2, tension: 1, trajectory: 1, lever: 1, actionNow: 1 }
    case 'storytelling':
      return { currentPlay: 2, hiddenLogic: 2, tension: 2, trajectory: 1, lever: 1, actionNow: 2 }
    case 'deep':
      return { currentPlay: 2, hiddenLogic: 3, tension: 2, trajectory: 2, lever: 2, actionNow: 2 }
  }
}

function buildTitles(profile: RenderProfile) {
  switch (profile.tone) {
    case 'direct':
      return {
        opening: '-> L essentiel',
        explanation: '-> Ce que cela montre',
        action: '-> Action',
        key: '-> A retenir',
      }
    case 'premium':
      return {
        opening: '-> Ce qui se dessine',
        explanation: '-> Ce que cela raconte',
        action: '-> Ce que tu peux faire',
        key: '-> La cle',
      }
    case 'practitioner':
      return {
        opening: '-> Axe dominant et contexte utile',
        explanation: '-> Lecture de fond et dynamique',
        action: '-> Orientation concrete a privilegier',
        key: '-> Point cle a garder en tete',
      }
    case 'fluid':
    default:
      return {
        opening: '-> Ce qui se passe',
        explanation: '-> Pourquoi',
        action: '-> Ce que tu peux faire',
        key: '-> Cle a retenir',
      }
  }
}

function profileSections(sections: FinalAnswer['sections'], profile: RenderProfile): AnswerSections | null {
  if (!sections) return null

  if (
    sections.currentPlay ||
    sections.hiddenLogic ||
    sections.tension ||
    sections.trajectory ||
    sections.lever ||
    sections.actionNow
  ) {
    const limits = buildSixBlockLimits(profile.format)
    const currentPlay = limitSentences(
      profile.includeNarrativeOpening ? sections.currentPlay : stripNarrativeOpening(sections.currentPlay),
      limits.currentPlay,
    )
    const hiddenLogic = limitSentences(sections.hiddenLogic, limits.hiddenLogic)
    const tension = limitSentences(sections.tension, limits.tension)
    const trajectory = limitSentences(sections.trajectory, limits.trajectory)
    const lever = limitSentences(sections.lever, limits.lever)
    const actionNow = limitSentences(sections.actionNow, limits.actionNow)

    return {
      opening: currentPlay,
      explanation: [hiddenLogic, tension, trajectory].filter(Boolean).join(' ') || undefined,
      action: actionNow,
      key: lever,
      currentPlay,
      hiddenLogic,
      tension,
      trajectory,
      lever,
      actionNow,
    }
  }

  const limits = buildSectionLimits(profile.format)
  const openingSource = profile.includeNarrativeOpening
    ? sections.opening
    : stripNarrativeOpening(sections.opening)

  return {
    opening: limitSentences(openingSource, limits.opening),
    explanation: limitSentences(sections.explanation, limits.explanation),
    action: profile.includeActionBlock ? limitSentences(sections.action, limits.action) : undefined,
    key: profile.includeKeyBlock ? limitSentences(sections.key, limits.key) : undefined,
  }
}

export function buildRenderProfileText(args: {
  sections?: FinalAnswer['sections']
  profile: RenderProfile
  fallbackText?: string
}): string {
  const safeProfile = coerceProfile(args.profile)
  const sections = args.sections

  if (!sections) {
    return args.fallbackText ?? ''
  }

  if (
    sections.currentPlay ||
    sections.hiddenLogic ||
    sections.tension ||
    sections.trajectory ||
    sections.lever ||
    sections.actionNow
  ) {
    const blocks: Array<{ title: string; content: string | undefined }> = [
      { title: '-> 1. CE QUI EST EN TRAIN DE SE JOUER', content: sections.currentPlay },
      { title: '-> 2. LA LOGIQUE CACHEE', content: sections.hiddenLogic },
      { title: '-> 3. LE POINT DE TENSION', content: sections.tension },
      { title: '-> 4. LA TRAJECTOIRE SI RIEN NE CHANGE', content: sections.trajectory },
      { title: '-> 5. LE LEVIER DE BASCULE', content: sections.lever },
      { title: '-> 6. CE QUE TU PEUX FAIRE MAINTENANT', content: sections.actionNow },
    ]

    return blocks
      .filter((block) => normalize(block.content ?? '').length > 0)
      .flatMap((block, index) =>
        index === 0
          ? [block.title, normalize(block.content ?? '')]
          : ['', block.title, normalize(block.content ?? '')],
      )
      .join('\n')
  }

  const titles = buildTitles(safeProfile)
  const blocks: Array<{ title: string; content: string | undefined }> = [
    { title: titles.opening, content: sections.opening },
    { title: titles.explanation, content: sections.explanation },
    { title: titles.action, content: safeProfile.includeActionBlock ? sections.action : undefined },
    { title: titles.key, content: safeProfile.includeKeyBlock ? sections.key : undefined },
  ]

  return blocks
    .filter((block) => normalize(block.content ?? '').length > 0)
    .slice(0, safeProfile.maxSections)
    .flatMap((block, index) =>
      index === 0
        ? [block.title, normalize(block.content ?? '')]
        : ['', block.title, normalize(block.content ?? '')],
    )
    .join('\n')
}

export function applyRenderProfile(input: ApplyRenderProfileInput): FinalAnswer {
  const safeProfile = coerceProfile(input.profile)
  const profiledSections = profileSections(input.answer.sections, safeProfile)

  if (!profiledSections) {
    return {
      text: input.answer.text,
      sections: input.answer.sections,
    }
  }

  return {
    text: buildRenderProfileText({
      sections: profiledSections,
      profile: safeProfile,
      fallbackText: input.answer.text,
    }),
    sections: profiledSections,
  }
}
