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
  const normalized = value.replace(/_/g, ' ').trim().toLowerCase()

  const tokenMap: Record<string, string> = {
    security: 'securite et stabilite',
    stability: 'stabilite',
    grounding: 'ancrage',
    clarity: 'clarte',
    focus: 'focalisation',
    transition: 'transition',
    momentum: 'elan juste',
    'equilibre fragile': 'un equilibre encore fragile',
    'fragile balance': 'un equilibre encore fragile',
    'inner pressure': 'une pression interieure a reguler',
    overload: 'une surcharge a alleger',
    fatigue: 'une fatigue a respecter',
    recharge: 'une recharge a prioriser',
    decision: 'une decision a clarifier',
  }

  return tokenMap[normalized] ?? normalized
}

function buildInvisibleLead(params: {
  fusedSignal?: FusedSignalSummary | null
  executedSubmodules?: ExecutedSubmodule[]
}) {
  const dominantSignal = humanizeKsToken(params.fusedSignal?.dominantSignal)
  const zone = humanizeKsToken(params.fusedSignal?.zone)
  const phase = humanizeKsToken(params.fusedSignal?.phase)
  const actionSummary = params.executedSubmodules?.find((entry) => entry.key === 'KS.ActionTranslator')

  const movementText = dominantSignal
    ? `En ce moment, le mouvement dominant parle surtout de ${dominantSignal}.`
    : phase
      ? `En ce moment, on sent surtout une phase de ${phase}.`
      : null

  const axisText = zone ? `L'axe a renforcer tourne autour de ${zone}.` : null
  const actionText =
    actionSummary && typeof actionSummary.result.publicSummary === 'string'
      ? actionSummary.result.publicSummary
      : params.fusedSignal?.risk_flag
        ? 'Le bon geste maintenant est de ralentir, clarifier, puis agir sans surcharge.'
        : params.fusedSignal?.opportunity_flag
          ? 'Le bon geste maintenant est d avancer simplement sur ce qui repond le plus clairement.'
          : null

  return [movementText, axisText, actionText].filter(Boolean).join(' ')
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

  const trimmedMessage = params.message.trim()
  const lineCount = trimmedMessage.split(/\r?\n/).filter(Boolean).length
  const alreadyStructured =
    /^1[\.\)]\s/m.test(trimmedMessage) ||
    /^[-•]\s/m.test(trimmedMessage) ||
    /Reconnaissance|Lecture de la dynamique|Mise en perspective|Cl[eé] d'action|Ce qui se passe|Ce qui compte/i.test(trimmedMessage)

  if (alreadyStructured || lineCount >= 8 || trimmedMessage.length >= 1100) {
    return params.message
  }

  const lead = buildInvisibleLead({
    fusedSignal: params.fusedSignal,
    executedSubmodules: params.executedSubmodules,
  })

  if (!lead) {
    return params.message
  }

  return `${lead}\n\n${params.message}`.trim()
}
