import type { DomainRoute } from '@/lib/hexastra/types'
import type { LayerResult } from '@/lib/hexastra/retrieval/multiLayerRetrieval'

type KnowledgeRole =
  | 'masterPrompt'
  | 'readingStructure'
  | 'menuPrompt'
  | 'sciencePrompt'
  | 'subsciencePrompt'
  | 'supportingKnowledge'

type KnowledgePacketEntry = {
  role: KnowledgeRole
  filename: string | null
  source: string
  score: number
  excerpt: string
}

function normalize(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function compactExcerpt(text: string, maxChars = 420) {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= maxChars) return cleaned
  const wordCut = cleaned.lastIndexOf(' ', maxChars)
  if (wordCut > maxChars * 0.6) return `${cleaned.slice(0, wordCut).trim()}...`
  return `${cleaned.slice(0, maxChars).trim()}...`
}

function inferScienceFocus(params: {
  domainRoute: DomainRoute
  selectedMenuLabel?: string | null
  selectedSubmenuLabel?: string | null
  latestUserMessage?: string | null
}) {
  const haystack = normalize(
    [
      params.domainRoute,
      params.selectedMenuLabel,
      params.selectedSubmenuLabel,
      params.latestUserMessage,
    ]
      .filter(Boolean)
      .join(' '),
  )

  if (haystack.includes('neurokua')) return 'neurokua'
  if (haystack.includes('astrolex') || haystack.includes('theme natal') || haystack.includes('theme astral')) {
    return 'astrolex'
  }
  if (haystack.includes('porteum')) return 'porteum'
  if (haystack.includes('triangle') || haystack.includes('numeris')) return 'trianglenumeris'
  if (haystack.includes('kua')) return 'kua'
  if (haystack.includes('fusion')) return 'fusion'
  return params.domainRoute === 'science' ? 'science' : null
}

function inferSubscienceFocus(params: {
  selectedMenuLabel?: string | null
  selectedSubmenuLabel?: string | null
  latestUserMessage?: string | null
}) {
  const haystack = normalize(
    [params.selectedMenuLabel, params.selectedSubmenuLabel, params.latestUserMessage]
      .filter(Boolean)
      .join(' '),
  )

  if (haystack.includes('etat du jour')) return 'etat du jour'
  if (haystack.includes('fatigue')) return 'fatigue'
  if (haystack.includes('stress')) return 'stress'
  if (haystack.includes('recharge')) return 'recharge'
  if (haystack.includes('decision')) return 'decision'
  if (haystack.includes('timing')) return 'timing'
  if (haystack.includes('lecture detaillee') || haystack.includes('lecture detaillee')) return 'lecture detaillee'
  return null
}

function classifyRole(params: {
  result: LayerResult
  scienceFocus: string | null
  subscienceFocus: string | null
}): KnowledgeRole {
  const filename = normalize(params.result.filename)
  const text = normalize(params.result.text.slice(0, 900))
  const haystack = `${filename} ${text}`

  if (
    haystack.includes('message_acceuil') ||
    (haystack.includes('prompt') && haystack.includes('instruction')) ||
    haystack.includes('architecture_de_valeur') ||
    haystack.includes('garde-fous') ||
    haystack.includes('garde fous') ||
    haystack.includes('ultra compact lecture hexastra')
  ) {
    return 'masterPrompt'
  }

  if (
    haystack.includes('structure_de_lecture_hexastra') ||
    haystack.includes('prompt structure lecture hexastra') ||
    haystack.includes('structure_des_lectures_hexastra') ||
    haystack.includes('structure lecture')
  ) {
    return 'readingStructure'
  }

  if (haystack.includes('prompt_menu') || haystack.includes('menu')) {
    return 'menuPrompt'
  }

  if (
    params.scienceFocus &&
    filename.includes(params.scienceFocus) &&
    (filename.includes('prompt') || filename.includes('system'))
  ) {
    return 'sciencePrompt'
  }

  if (
    params.subscienceFocus &&
    (haystack.includes(params.subscienceFocus) ||
      (params.subscienceFocus === 'etat du jour' && haystack.includes('mon etat du jour')))
  ) {
    return 'subsciencePrompt'
  }

  if (
    params.scienceFocus &&
    (haystack.includes(params.scienceFocus) ||
      (params.scienceFocus === 'astrolex' && haystack.includes('theme natal')) ||
      (params.scienceFocus === 'trianglenumeris' && haystack.includes('triangle')))
  ) {
    return 'sciencePrompt'
  }

  return 'supportingKnowledge'
}

function selectRoleEntries(
  entries: KnowledgePacketEntry[],
  role: KnowledgeRole,
  maxEntries: number,
) {
  return entries.filter((entry) => entry.role === role).slice(0, maxEntries)
}

export function buildKnowledgePacket(params: {
  results: LayerResult[]
  domainRoute: DomainRoute
  selectedMenuLabel?: string | null
  selectedSubmenuLabel?: string | null
  selectedPromptHint?: string | null
  selectedOutputStructure?: string | null
  latestUserMessage?: string | null
}) {
  const scienceFocus = inferScienceFocus({
    domainRoute: params.domainRoute,
    selectedMenuLabel: params.selectedMenuLabel,
    selectedSubmenuLabel: params.selectedSubmenuLabel,
    latestUserMessage: params.latestUserMessage,
  })
  const subscienceFocus = inferSubscienceFocus({
    selectedMenuLabel: params.selectedMenuLabel,
    selectedSubmenuLabel: params.selectedSubmenuLabel,
    latestUserMessage: params.latestUserMessage,
  })

  const entries = [...params.results]
    .sort((a, b) => b.score - a.score)
    .map((result) => ({
      role: classifyRole({ result, scienceFocus, subscienceFocus }),
      filename: result.filename || null,
      source: result.source,
      score: result.score,
      excerpt: compactExcerpt(result.text),
    }))

  const packet = {
    domainRoute: params.domainRoute,
    focus: {
      selectedMenuLabel: params.selectedMenuLabel ?? null,
      selectedSubmenuLabel: params.selectedSubmenuLabel ?? null,
      scienceFocus,
      subscienceFocus,
    },
    constraints: {
      selectedPromptHint: params.selectedPromptHint ?? null,
      selectedOutputStructure: params.selectedOutputStructure ?? null,
    },
    priorityOrder: [
      'masterPrompt',
      'readingStructure',
      'sciencePrompt',
      'subsciencePrompt',
      'supportingKnowledge',
    ] as const,
    masterPrompt: selectRoleEntries(entries, 'masterPrompt', 1)[0] ?? null,
    readingStructure: selectRoleEntries(entries, 'readingStructure', 1)[0] ?? null,
    menuPrompt: selectRoleEntries(entries, 'menuPrompt', 1)[0] ?? null,
    sciencePrompt: selectRoleEntries(entries, 'sciencePrompt', 2),
    subsciencePrompt: selectRoleEntries(entries, 'subsciencePrompt', 2),
    supportingKnowledge: selectRoleEntries(entries, 'supportingKnowledge', 4),
  }

  if (
    !packet.masterPrompt &&
    !packet.readingStructure &&
    packet.sciencePrompt.length === 0 &&
    packet.subsciencePrompt.length === 0 &&
    packet.supportingKnowledge.length === 0
  ) {
    return null
  }

  return packet
}
