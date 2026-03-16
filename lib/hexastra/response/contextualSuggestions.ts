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

  const humanize = (label: string): string => {
    const key = label.trim().toLowerCase()
    if (key.includes('stress')) return 'Explorer ce qui nourrit cette tension en toi aujourd’hui.'
    if (key.includes('fatigue')) return 'Lire ce que cette fatigue cherche à te faire ralentir ou réajuster.'
    if (key.includes('recentr')) return 'Approfondir ce qui peut te ramener à un axe plus stable.'
    if (key.includes('relation')) return 'Approfondir l’axe relationnel qui influence ta décision.'
    if (key.includes('travail') || key.includes('argent'))
      return 'Voir ce qui mérite d’être sécurisé avant d’avancer.'
    if (key.includes('decision') || key.includes('décision'))
      return 'Comparer ce que chaque option active réellement en toi.'
    return `Explorer cet angle : ${label}`
  }

  const labels = ranked.slice(0, 4).map((n) => humanize(n.label))
  if (!labels.includes('Revenir au menu')) labels.push('Revenir au menu')
  return labels
}
