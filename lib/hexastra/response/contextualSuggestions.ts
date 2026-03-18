import { generateContextualExplorationAngles } from '@/lib/hexastra/explorationEngine'
import { rankExplorationSuggestions } from '@/lib/hexastra/explorationLearningEngine'

type SuggestionInput = {
  plan: string
  contextType?: string | null
  domainRoute?: string | null
  selectedMenuKey?: string | null
  selectedSubmenuKey?: string | null
  lastUserMessage?: string
}

export function generateContextualSuggestions(input: SuggestionInput): string[] {
  if (input.plan === 'free') {
    return []
  }

  const nodes = generateContextualExplorationAngles({
    plan: input.plan,
    contextType: input.contextType,
    domainRoute: input.domainRoute,
    selectedMenuKey: input.selectedMenuKey,
    selectedSubmenuKey: input.selectedSubmenuKey,
    userQuestion: input.lastUserMessage,
  })

  const ranked = rankExplorationSuggestions(nodes, {
    plan: input.plan,
    intent: input.contextType ?? input.domainRoute ?? null,
  })

  const humanize = (label: string): string => {
    const key = label.trim().toLowerCase()
    if (key.includes('stress')) return 'Approfondir la source de cette tension.'
    if (key.includes('fatigue')) return 'Voir ce que cette fatigue demande de reajuster.'
    if (key.includes('recentr')) return 'Revenir a ce qui peut te stabiliser maintenant.'
    if (key.includes('relation')) return 'Regarder l axe relationnel en jeu.'
    if (key.includes('travail') || key.includes('argent')) return 'Voir ce qui merite d etre securise.'
    if (key.includes('decision')) return 'Comparer ce que chaque option active reellement.'
    return label
  }

  return ranked
    .slice(0, 2)
    .map((node) => humanize(node.label))
    .filter(Boolean)
}
