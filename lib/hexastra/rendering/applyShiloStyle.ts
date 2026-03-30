export type ShiloInput = {
  opening: string
  explanation: string
  action: string
  key: string
  responseMode: string
}

export type ShiloOutput = {
  opening: string
  explanation: string
  action: string
  key: string
}

type SectionName = keyof ShiloOutput

type Rule = {
  pattern: RegExp
  replacement: string
}

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

function ensureSentence(text: string): string {
  const cleaned = capitalize(text)
  if (!cleaned) return ''
  return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`
}

function splitSentences(text: string): string[] {
  const cleaned = normalize(text)
  if (!cleaned) return []

  const normalizedPunctuation = cleaned
    .replace(/\s*;\s*/g, '. ')
    .replace(/\s*,\s+puis\s+/gi, '. Puis ')

  const matches = normalizedPunctuation.match(/[^.!?]+[.!?]?/g) ?? []
  return matches
    .map((entry) => ensureSentence(entry))
    .filter(Boolean)
}

function dedupeSentences(sentences: string[]): string[] {
  const seen = new Set<string>()
  const output: string[] = []

  for (const sentence of sentences) {
    const key = normalize(sentence).toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    output.push(sentence)
  }

  return output
}

function joinSentences(sentences: string[], limit: number): string {
  return dedupeSentences(sentences)
    .slice(0, limit)
    .join(' ')
}

function applyRules(text: string, rules: Rule[]): string {
  return rules.reduce(
    (current, rule) => current.replace(rule.pattern, rule.replacement),
    normalize(text),
  )
}

const COMMON_RULES: Rule[] = [
  { pattern: /\bwait for the invitation\b/gi, replacement: "attendre la bonne invitation" },
  { pattern: /\bstrategie\b/gi, replacement: 'strategie' },
]

const OPENING_RULES: Rule[] = [
  { pattern: /^actuellement,\s*/i, replacement: 'En ce moment, ' },
  {
    pattern: /^en ce moment,\s+le signal le plus net montre que\s*/i,
    replacement: "En ce moment, ce qui ressort le plus nettement, c'est que ",
  },
  {
    pattern: /^ce qui ressort d abord, c est que\s*/i,
    replacement: "Ce qui ressort d'abord, c'est que ",
  },
  {
    pattern: /\bune periode de transition importante\b/gi,
    replacement: 'un moment ou les choses bougent vraiment',
  },
  {
    pattern: /\bune phase de transformation interne est en cours\b/gi,
    replacement: "quelque chose est en train de bouger en profondeur chez toi",
  },
  {
    pattern: /\ble point central, pour l instant, tourne autour de\b/gi,
    replacement: 'en ce moment, tout se joue autour de',
  },
  {
    pattern: /\bton retour solaire ouvre une phase de\b/gi,
    replacement: "ton retour solaire met l'accent sur",
  },
]

const EXPLANATION_RULES: Rule[] = [
  {
    pattern: /\ble point le plus concret ici est que\b/gi,
    replacement: "Le plus clair, c'est que",
  },
  {
    pattern: /\ble signal qui appuie cette lecture parle de\b/gi,
    replacement: "Ce qui vient confirmer le mouvement, c'est",
  },
  {
    pattern: /\bce contexte ajoute aussi\b/gi,
    replacement: 'Et en toile de fond, on retrouve aussi',
  },
  {
    pattern: /\bau fond,\b/gi,
    replacement: 'En profondeur,',
  },
]

const ACTION_RULES: Rule[] = [
  {
    pattern: /\btu dois attendre avant d agir\b/gi,
    replacement: "Ce n'est pas le moment de forcer. Laisse venir la bonne reponse",
  },
  {
    pattern: /\battends un vrai signal de reponse avant d initier\b/gi,
    replacement: "Ne force pas le mouvement. Attends une vraie reponse avant d'initier",
  },
  {
    pattern: /\bne cherche pas a trancher trop vite\b/gi,
    replacement: 'Ne tranche pas trop vite',
  },
  {
    pattern: /\barrete de lutter sur tous les fronts\b/gi,
    replacement: "N'essaie pas de tenir tous les fronts en meme temps",
  },
  {
    pattern: /\bobserve ce qui revient avec le plus d insistance maintenant\b/gi,
    replacement: "Regarde ce qui revient avec le plus d'insistance maintenant",
  },
  {
    pattern: /\butilise cette information comme repere spatial concret\b/gi,
    replacement: 'Prends cette information comme un repere spatial tres concret',
  },
  {
    pattern: /\bramene ton energie sur un seul axe concret\b/gi,
    replacement: 'Ramene ton energie sur un seul axe',
  },
]

function styleOpening(text: string, responseMode: string): string {
  let styled = applyRules(text, [...COMMON_RULES, ...OPENING_RULES])

  if (
    (responseMode === 'concise_fusion_answer' || responseMode === 'interpretive_reading') &&
    /^tu es dans un moment ou les choses bougent vraiment/i.test(styled)
  ) {
    styled = styled.replace(
      /^tu es dans un moment ou les choses bougent vraiment/i,
      'Tu es dans un moment ou les choses bougent vraiment',
    )
  }

  if (
    responseMode === 'timing_strategic_response' &&
    !/en ce moment|moment|timing/i.test(styled)
  ) {
    styled = `En ce moment, ${styled.charAt(0).toLowerCase()}${styled.slice(1)}`
  }

  return joinSentences(splitSentences(styled), 2)
}

function styleExplanation(text: string): string {
  const styled = applyRules(text, [...COMMON_RULES, ...EXPLANATION_RULES])
  return joinSentences(splitSentences(styled), 3)
}

function styleAction(text: string, responseMode: string): string {
  let styled = applyRules(text, [...COMMON_RULES, ...ACTION_RULES])

  if (
    responseMode === 'timing_strategic_response' &&
    !/moment|rythme|signal/i.test(styled)
  ) {
    styled = `${styled} Cherche le bon moment avant d'accelerer.`
  }

  return joinSentences(splitSentences(styled), 3)
}

function styleKey(text: string, responseMode: string): string {
  let styled = normalize(text)

  if (/la clarte ne vient pas en forcant, mais en repondant au signal le plus juste/i.test(styled)) {
    styled = "La clarte revient quand tu cesses de forcer."
  } else if (/la clarte vient du bon rythme, pas de la precipitation/i.test(styled)) {
    styled = "Le bon rythme t'en dira plus que la precipitation."
  } else if (/ta bonne direction vient d une reponse juste, pas d une initiative sous pression/i.test(styled)) {
    styled = "Ta bonne direction nait d'une reponse juste, pas d'une pression."
  } else if (/le cycle porte mieux ce que tu consolides que ce que tu forces/i.test(styled)) {
    styled = 'Ce cycle soutient ce que tu consolides, pas ce que tu forces.'
  } else if (/l espace juste soutient une decision plus claire/i.test(styled)) {
    styled = "Quand l'espace est juste, la decision se clarifie."
  } else if (/ce que tu traverses devient plus lisible quand tu honores le mouvement dominant au lieu de le contrer/i.test(styled)) {
    styled = "Ce que tu traverses s'eclaire quand tu arretes de le contrer."
  } else if (responseMode === 'interpretive_reading') {
    styled = `Ce qui se joue s'eclaire quand tu le regardes sans le brusquer.`
  }

  return joinSentences(splitSentences(styled), 1)
}

export function applyShiloStyle(input: ShiloInput): ShiloOutput {
  const base: ShiloOutput = {
    opening: ensureSentence(input.opening),
    explanation: ensureSentence(input.explanation),
    action: ensureSentence(input.action),
    key: ensureSentence(input.key),
  }

  const styledSections: Array<SectionName> = ['opening', 'explanation', 'action', 'key']

  return styledSections.reduce<ShiloOutput>((output, section) => {
    switch (section) {
      case 'opening':
        output.opening = styleOpening(base.opening, input.responseMode)
        break
      case 'explanation':
        output.explanation = styleExplanation(base.explanation)
        break
      case 'action':
        output.action = styleAction(base.action, input.responseMode)
        break
      case 'key':
        output.key = styleKey(base.key, input.responseMode)
        break
    }

    return output
  }, { ...base })
}
