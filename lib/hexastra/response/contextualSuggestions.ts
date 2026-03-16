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
  const labels = ranked.map((n) => n.label)
  if (!labels.includes('Revenir au menu')) labels.push('Revenir au menu')
  return labels.slice(0, 6)
}
