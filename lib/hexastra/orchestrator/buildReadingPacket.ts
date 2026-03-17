export function buildReadingPacket(params: {
  domainRoute: string
  selectedOutputStructure?: string | null
  ksNarrativeBrief?: string | null
  ksSummary?: {
    dominantSignal?: string | null
    primaryModule?: string | null
    primaryFamily?: string | null
    sourceLayers?: string[]
    submodules?: string[]
  } | null
  readingSummary?: {
    detectedTheme?: string | null
    detectedSubtheme?: string | null
    detectedScience?: string | null
    readingLevel?: string | null
    momentType?: string | null
    phaseType?: string | null
    dominantPotential?: string | null
    mainLever?: string | null
    executiveSummary?: string[]
  } | null
  submoduleSummaries?: string[]
}) {
  return {
    domainRoute: params.domainRoute,
    outputStructure: params.selectedOutputStructure ?? null,
    ksNarrativeBrief: params.ksNarrativeBrief ?? null,
    ksSummary: params.ksSummary ?? null,
    readingSummary: params.readingSummary ?? null,
    submoduleSummaries: params.submoduleSummaries ?? [],
  }
}
