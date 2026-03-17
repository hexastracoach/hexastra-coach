type ExecutedSubmodule = {
  key: string
  result: Record<string, unknown>
}

type FusedSignalSummary = {
  dominantSignal?: string | null
  phase?: string | null
  zone?: string | null
  risk_flag?: boolean
  opportunity_flag?: boolean
}

function humanizeKsToken(value: string | null | undefined) {
  if (!value) return null
  return value.replace(/_/g, ' ').trim()
}

export function buildKsLeadSummary(params: {
  flowStep: string
  selectedOutputStructure?: string | null
  fusedSignal?: FusedSignalSummary | null
  executedSubmodules?: ExecutedSubmodule[]
  message: string
}) {
  if (
    params.flowStep !== 'analysis' &&
    params.flowStep !== 'deep_reading' &&
    params.flowStep !== 'decision'
  ) {
    return params.message
  }

  if (!params.selectedOutputStructure) {
    return params.message
  }

  if (/rep[eè]res cl[eé]s/i.test(params.message)) {
    return params.message
  }

  const actionSummary = params.executedSubmodules?.find((entry) => entry.key === 'KS.ActionTranslator')
  const movementSummary = params.executedSubmodules?.find(
    (entry) =>
      entry.key === 'KS.Planetarium' ||
      entry.key === 'KS.NumCycle' ||
      entry.key === 'KS.ThemeHexAstra.V1'
  )
  const lines = [
    params.fusedSignal?.dominantSignal
      ? `- Signal dominant : ${humanizeKsToken(params.fusedSignal.dominantSignal)}`
      : null,
    params.fusedSignal?.zone
      ? `- Axe principal : ${humanizeKsToken(params.fusedSignal.zone)}`
      : null,
    movementSummary && typeof movementSummary.result.publicSummary === 'string'
      ? `- Mouvement du moment : ${movementSummary.result.publicSummary}`
      : params.fusedSignal?.phase
        ? `- Mouvement du moment : ${humanizeKsToken(params.fusedSignal.phase)}`
        : null,
    actionSummary && typeof actionSummary.result.publicSummary === 'string'
      ? `- Action utile : ${actionSummary.result.publicSummary}`
      : params.fusedSignal?.risk_flag
        ? '- Action utile : ralentir, clarifier, puis agir sans surcharge.'
        : params.fusedSignal?.opportunity_flag
          ? '- Action utile : avancer simplement sur le levier le plus vivant.'
          : null,
  ].filter(Boolean)

  if (!lines.length) {
    return params.message
  }

  return `Repères clés\n${lines.join('\n')}\n\n${params.message}`.trim()
}
