import type { DomainRoute } from '@/lib/hexastra/types'
import type { LayerResult } from '@/lib/hexastra/retrieval/multiLayerRetrieval'
import {
  lookupDocumentRegistry,
  type DocumentRole,
  type DocumentScienceTag,
} from '@/lib/hexastra/vector/documentRegistry'

type KnowledgeRole = DocumentRole | 'noise'

type ScienceTag = DocumentScienceTag | null

type KnowledgePacketEntry = {
  role: KnowledgeRole
  filename: string | null
  source: string
  score: number
  priority: number
  scienceTag: ScienceTag
  excerpt: string
}

function summarizeEntry(entry: KnowledgePacketEntry | null | undefined) {
  if (!entry) return null
  return {
    role: entry.role,
    filename: entry.filename,
    source: entry.source,
    score: Number(entry.score.toFixed(3)),
    scienceTag: entry.scienceTag,
    excerpt: entry.excerpt,
  }
}

function normalize(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function compactExcerpt(text: string, maxChars = 420) {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= maxChars) return cleaned
  const wordCut = cleaned.lastIndexOf(' ', maxChars)
  if (wordCut > maxChars * 0.6) return `${cleaned.slice(0, wordCut).trim()}...`
  return `${cleaned.slice(0, maxChars).trim()}...`
}

function buildHaystack(result: LayerResult) {
  const filename = normalize(result.filename)
  const text = normalize(result.text.slice(0, 900))
  return `${filename} ${text}`.trim()
}

function isNoiseDocument(haystack: string) {
  return (
    haystack.includes('readme.md') ||
    haystack.includes('module.json') ||
    haystack.includes('manifest.json') ||
    haystack.includes('checksum.txt') ||
    haystack.includes('placeholder.txt') ||
    haystack.includes('license_ks_core') ||
    haystack.includes('n8n_blueprint.json')
  )
}

function inferEntryScienceTag(haystack: string): ScienceTag {
  if (
    haystack.includes('neurokua') ||
    haystack.includes('neurosoma') ||
    haystack.includes('synesthesia') ||
    haystack.includes('synesthesie')
  ) {
    return 'neurokua'
  }

  if (
    haystack.includes('astrologie') ||
    haystack.includes('astrolex') ||
    haystack.includes('synastrie') ||
    haystack.includes('geo astrologie') ||
    haystack.includes('chiron') ||
    haystack.includes('charte') ||
    haystack.includes('theme natal')
  ) {
    return 'astrolex'
  }

  if (
    haystack.includes('human design') ||
    haystack.includes('design humain') ||
    haystack.includes('porteum') ||
    haystack.includes('croixdincarnation') ||
    haystack.includes('croix dincarnation') ||
    haystack.includes('canaux') ||
    haystack.includes('portes')
  ) {
    return 'human_design'
  }

  if (
    haystack.includes('numerologie') ||
    haystack.includes('numerology') ||
    haystack.includes('divine triangle') ||
    haystack.includes('triangle') ||
    haystack.includes('chemin de vie') ||
    haystack.includes('mois personnel')
  ) {
    return 'numerologie'
  }

  if (haystack.includes('enneagram') || haystack.includes('ennea')) {
    return 'enneagramme'
  }

  if (haystack.includes('maslow')) {
    return 'maslow'
  }

  if (haystack.includes('kua') || haystack.includes('feng shui') || haystack.includes('orientation')) {
    return 'kua'
  }

  if (
    haystack.includes('kybalion') ||
    haystack.includes('dictionnaire-des-symboles') ||
    haystack.includes('dictionnaire des symboles') ||
    haystack.includes('flow the psychology of optimal experience') ||
    haystack.includes('gestalt')
  ) {
    return 'transverse'
  }

  return 'global'
}

function isReferenceBookDocument(haystack: string) {
  return (
    haystack.includes('kybalion') ||
    haystack.includes('dictionnaire-des-symboles') ||
    haystack.includes('dictionnaire des symboles') ||
    haystack.includes('flow the psychology of optimal experience') ||
    haystack.includes('gestalt') ||
    haystack.includes('complete book of numerology') ||
    haystack.includes('divine triangle') ||
    haystack.includes('chiron') ||
    haystack.includes('design humain -- chetan') ||
    haystack.includes('vivre de son desgin humain') ||
    haystack.includes('vivre de son design humain') ||
    haystack.includes('croixdincarnation') ||
    haystack.includes('croix dincarnation') ||
    haystack.includes('manuel-etudiant') ||
    haystack.includes('la+charte') ||
    haystack.includes("la+structure+d'une+charte") ||
    haystack.includes('origine+et+definition') ||
    haystack.includes('hypothese neurokua') ||
    haystack.includes('manifeste') ||
    haystack.includes('architecture officielle') ||
    haystack.includes('ce que ca represente pour toi')
  )
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
  if (
    haystack.includes('astrologie') ||
    haystack.includes('astrolex') ||
    haystack.includes('theme natal') ||
    haystack.includes('theme astral')
  ) {
    return 'astrolex'
  }
  if (haystack.includes('human design') || haystack.includes('porteum')) return 'human_design'
  if (haystack.includes('numerologie') || haystack.includes('triangle') || haystack.includes('numeris')) {
    return 'numerologie'
  }
  if (haystack.includes('enneagram') || haystack.includes('ennea')) return 'enneagramme'
  if (haystack.includes('kua')) return 'kua'
  if (haystack.includes('maslow')) return 'maslow'
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
  if (haystack.includes('synastrie')) return 'synastrie'
  if (haystack.includes('geo astrologie') || haystack.includes('geo-astrologie')) return 'geo astrologie'
  if (haystack.includes('profil')) return 'profil'
  if (haystack.includes('portes')) return 'portes'
  if (haystack.includes('canaux')) return 'canaux'
  if (haystack.includes('directions favorables')) return 'directions favorables'
  if (haystack.includes('zones sensibles')) return 'zones sensibles'
  if (haystack.includes('espace de vie')) return 'espace de vie'
  if (haystack.includes('equilibre environnemental')) return 'equilibre environnemental'
  if (haystack.includes('orientation generale')) return 'orientation generale'
  if (haystack.includes('ajustement espace')) return 'ajustements espace'
  if (haystack.includes('cycle annuel') || haystack.includes('annee personnelle')) return 'cycle annuel'
  if (haystack.includes('mois personnel')) return 'mois personnel'
  if (haystack.includes('chemin de vie')) return 'chemin de vie'
  if (haystack.includes('defi') || haystack.includes('defis')) return 'defis'
  if (haystack.includes('vibration')) return 'vibration'
  if (haystack.includes('transition')) return 'transition'
  if (haystack.includes('maslow') || haystack.includes('besoin dominant')) return 'besoin dominant'
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
  const haystack = buildHaystack(params.result)
  const registryEntry = lookupDocumentRegistry(params.result.filename)

  if (isNoiseDocument(haystack)) {
    return 'noise'
  }

  if (registryEntry) {
    return registryEntry.role
  }

  if (
    haystack.includes('prompt maitre ks fusion v13') ||
    haystack.includes('master prompt') ||
    haystack.includes('system prompt full') ||
    haystack.includes('ks fusion v13 prompts officiels') ||
    haystack.includes('v13a12') ||
    haystack.includes('message acceuil') ||
    (haystack.includes('prompt') && haystack.includes('instruction')) ||
    haystack.includes('architecture de valeur') ||
    haystack.includes('garde-fous') ||
    haystack.includes('garde fous') ||
    haystack.includes('ultra compact lecture hexastra')
  ) {
    return 'masterPrompt'
  }

  if (
    haystack.includes('structure de lecture hexastra') ||
    haystack.includes('strucutre de lecture hexastra') ||
    haystack.includes('prompt structure lecture hexastra') ||
    haystack.includes('structure des lectures hexastra') ||
    haystack.includes('structure lecture')
  ) {
    return 'readingStructure'
  }

  if (haystack.includes('prompt menu') || haystack.includes('message acceuil')) {
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

  if (isReferenceBookDocument(haystack)) {
    return 'referenceBook'
  }

  if (
    haystack.includes('prompt sous module ks fusion v13') ||
    params.scienceFocus &&
    (haystack.includes(params.scienceFocus) ||
      (params.scienceFocus === 'astrolex' && haystack.includes('theme natal')) ||
      (params.scienceFocus === 'human_design' && (haystack.includes('human design') || haystack.includes('porteum'))) ||
      (params.scienceFocus === 'numerologie' && (haystack.includes('triangle') || haystack.includes('numerologie'))) ||
      (params.scienceFocus === 'enneagramme' && (haystack.includes('enneagram') || haystack.includes('ennea'))) ||
      (params.scienceFocus === 'maslow' && haystack.includes('maslow')))
  ) {
    return 'sciencePrompt'
  }

  return 'supportingKnowledge'
}

function computeEntryPriority(params: {
  result: LayerResult
  role: KnowledgeRole
  scienceFocus: string | null
}) {
  const haystack = buildHaystack(params.result)
  const registryEntry = lookupDocumentRegistry(params.result.filename)
  const entryScienceTag = inferEntryScienceTag(haystack)
  const scienceMatchesFocus =
    params.scienceFocus &&
    ((params.scienceFocus === 'science' && entryScienceTag !== 'global') ||
      params.scienceFocus === entryScienceTag)

  if (registryEntry && registryEntry.role === params.role && params.role !== 'referenceBook') {
    return registryEntry.priority
  }

  if (params.role === 'masterPrompt') {
    if (haystack.includes('prompt maitre ks fusion v13')) return 140
    if (haystack.includes('master prompt')) return 130
    if (haystack.includes('system prompt full')) return 120
    if (haystack.includes('ultra compact lecture hexastra')) return 110
    if (haystack.includes('ks fusion v13 prompts officiels')) return 100
    if (haystack.includes('hexastra engine v1')) return 90
    return 10
  }

  if (params.role === 'readingStructure') {
    if (haystack.includes('structure de lecture hexastra')) return 110
    if (haystack.includes('strucutre de lecture hexastra')) return 100
    if (haystack.includes('micro-lecture initiale')) return 90
    return 10
  }

  if (params.role === 'sciencePrompt') {
    if (haystack.includes('prompt sous module ks fusion v13')) return 110
    if (haystack.includes('prompt astrolex')) return 100
    if (haystack.includes('prompt porteum')) return 100
    if (haystack.includes('prompt neurokua system')) return 100
    if (haystack.includes('prompt neurosoma')) return 95
    if (haystack.includes('prompt gps')) return 95
    return 10
  }

  if (params.role === 'subsciencePrompt') {
    return 80
  }

  if (params.role === 'referenceBook') {
    const basePriority = registryEntry?.priority ?? 40
    if (scienceMatchesFocus) return basePriority + 20
    if (entryScienceTag === 'transverse') return Math.max(basePriority, 55)
    return basePriority
  }

  if (params.role === 'menuPrompt') {
    return 70
  }

  return 0
}

function resolveScienceTag(result: LayerResult) {
  const registryEntry = lookupDocumentRegistry(result.filename)
  if (registryEntry) return registryEntry.scienceTag
  return inferEntryScienceTag(buildHaystack(result))
}

function selectRoleEntries(
  entries: KnowledgePacketEntry[],
  role: KnowledgeRole,
  maxEntries: number,
) {
  return [...entries]
    .filter((entry) => entry.role === role)
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority
      return b.score - a.score
    })
    .slice(0, maxEntries)
}

function selectReferenceBooks(
  entries: KnowledgePacketEntry[],
  scienceFocus: string | null,
  maxEntries: number,
) {
  const referenceBooks = selectRoleEntries(entries, 'referenceBook', 50)

  if (referenceBooks.length <= maxEntries || !scienceFocus || scienceFocus === 'science') {
    return referenceBooks.slice(0, maxEntries)
  }

  const chosen: KnowledgePacketEntry[] = []

  const pushOnce = (candidate: KnowledgePacketEntry | undefined) => {
    if (!candidate) return
    if (chosen.some((entry) => entry.filename === candidate.filename && entry.source === candidate.source)) return
    chosen.push(candidate)
  }

  pushOnce(referenceBooks.find((entry) => entry.scienceTag === scienceFocus))
  pushOnce(referenceBooks.find((entry) => entry.scienceTag === 'transverse'))

  for (const entry of referenceBooks) {
    pushOnce(entry)
    if (chosen.length >= maxEntries) break
  }

  return chosen.slice(0, maxEntries)
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

  const allEntries = [...params.results]
    .sort((a, b) => b.score - a.score)
    .map((result) => {
      const role = classifyRole({ result, scienceFocus, subscienceFocus })
      return {
        role,
        filename: result.filename || null,
        source: result.source,
        score: result.score,
        priority: computeEntryPriority({ result, role, scienceFocus }),
        scienceTag: resolveScienceTag(result),
        excerpt: compactExcerpt(result.text),
      }
    })
  const entries = allEntries.filter((entry) => entry.role !== 'noise')
  const ignoredSources = allEntries.filter((entry) => entry.role === 'noise')

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
      'referenceBook',
      'supportingKnowledge',
    ] as const,
    hierarchyGuide:
      'Toujours ordonner la lecture ainsi: prompt maitre -> structure de lecture -> science choisie -> sous-science choisie -> livres de reference relies a la bonne science -> savoir support.',
    fusionGuide:
      'HexAstra lit par fusion: prioriser la science active, puis croiser avec au moins un appui transverse ou global quand il existe, quel que soit le plan. La grille de Maslow peut servir d appui discret pour lire le besoin dominant ou la stabilisation, sans devenir une science affichee par defaut.',
    ignoredSources: ignoredSources.map((entry) => ({
      filename: entry.filename,
      source: entry.source,
      score: Number(entry.score.toFixed(3)),
    })),
    masterPrompt: selectRoleEntries(entries, 'masterPrompt', 1)[0] ?? null,
    readingStructure: selectRoleEntries(entries, 'readingStructure', 1)[0] ?? null,
    menuPrompt: selectRoleEntries(entries, 'menuPrompt', 1)[0] ?? null,
    sciencePrompt: selectRoleEntries(entries, 'sciencePrompt', 2),
    subsciencePrompt: selectRoleEntries(entries, 'subsciencePrompt', 2),
    referenceBook: selectReferenceBooks(entries, scienceFocus, 3),
    supportingKnowledge: selectRoleEntries(entries, 'supportingKnowledge', 4),
  }

  const orderedSources = [
    summarizeEntry(packet.masterPrompt),
    summarizeEntry(packet.readingStructure),
    ...packet.sciencePrompt.map((entry) => summarizeEntry(entry)),
    ...packet.subsciencePrompt.map((entry) => summarizeEntry(entry)),
    ...packet.referenceBook.map((entry) => summarizeEntry(entry)),
    ...packet.supportingKnowledge.map((entry) => summarizeEntry(entry)),
  ].filter(Boolean)

  if (
    !packet.masterPrompt &&
    !packet.readingStructure &&
    packet.sciencePrompt.length === 0 &&
    packet.subsciencePrompt.length === 0 &&
    packet.referenceBook.length === 0 &&
    packet.supportingKnowledge.length === 0
  ) {
    return null
  }

  return {
    ...packet,
    orderedSources,
  }
}
