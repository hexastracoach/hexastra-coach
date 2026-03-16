import { PROMPT_MENU, type PromptMenuNode } from '@/lib/hexastra/data/promptMenu'
import { getModeForPlan } from '@/lib/hexastra/config/planModeMap'

type CycleSignal = 'expansion' | 'stabilisation' | 'transition'
type DepthLevel = 'materiel' | 'emotionnel' | 'strategique' | 'evolution' | 'sens'

export type ExplorationEngineInput = {
  userQuestion?: string
  conversationContext?: string
  birthProfile?: { date?: string | null; solarSign?: string | null }
  plan: string
  apiCalculations?: {
    cycle?: CycleSignal | null
    dominantZone?: string | null
    depthLevel?: DepthLevel | null
    scienceHint?: string | null
  }
  vectorContext?: string
  selectedMenuKey?: string | null
  selectedSubmenuKey?: string | null
  contextType?: string | null
  domainRoute?: string | null
}

const INTENT_KEYWORDS: Record<string, string[]> = {
  relationship: ['amour', 'relation', 'couple', 'affectif', 'personne'],
  career: ['travail', 'job', 'boulot', 'pro', 'argent', 'financ'],
  decision: ['décision', 'choisir', 'hésite', 'option', 'trancher'],
  energy: ['énergie', 'energie', 'fatigue', 'stress', 'motivation', 'énergie du moment'],
  timing: ['mois', 'phase', 'prochain', 'timing', 'période', 'cycle'],
  wellbeing: ['bien-être', 'bienetre', 'état intérieur', 'calme'],
}

function budgetForPlan(plan: string) {
  switch (plan) {
    case 'free':
      return 3
    case 'essential':
    case 'essentiel':
      return 4
    case 'premium':
      return 5
    case 'practitioner':
    case 'praticien':
      return 6
    default:
      return 4
  }
}

function detectIntent(question?: string, ctx?: string | null): string | null {
  if (ctx) return ctx
  if (!question) return null
  const lower = question.toLowerCase()
  for (const [intent, words] of Object.entries(INTENT_KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) return intent
  }
  return null
}

function flatten(nodes: PromptMenuNode[]): PromptMenuNode[] {
  const all: PromptMenuNode[] = []
  nodes.forEach((n) => {
    all.push(n)
    if (n.children) all.push(...flatten(n.children))
  })
  return all
}

function scoreNode(node: PromptMenuNode, intent: string | null, api?: ExplorationEngineInput['apiCalculations']) {
  let score = 0
  if (intent && node.contextType === intent) score += 3
  if (api?.scienceHint && node.domainRoute === api.scienceHint) score += 2
  if (api?.dominantZone && node.description?.toLowerCase().includes(api.dominantZone.toLowerCase())) score += 1
  if (api?.cycle === 'expansion' && /expan|opportunité/i.test(node.description || '')) score += 1
  if (api?.cycle === 'transition' && /transition|changer/i.test(node.description || '')) score += 1
  return score
}

export function generateContextualExplorationAngles(input: ExplorationEngineInput): PromptMenuNode[] {
  const mode = getModeForPlan(input.plan as any)
  const nodes = PROMPT_MENU[mode] ?? PROMPT_MENU['libre']
  const flat = flatten(nodes)
  const intent = detectIntent(input.userQuestion, input.contextType || input.domainRoute)
  const budget = budgetForPlan(input.plan)

  const ranked = flat
    .map((n) => ({ node: n, score: scoreNode(n, intent, input.apiCalculations) }))
    .sort((a, b) => b.score - a.score)

  const suggestions: PromptMenuNode[] = []
  const add = (node?: PromptMenuNode) => {
    if (!node) return
    if (!suggestions.find((n) => n.key === node.key) && suggestions.length < budget) {
      suggestions.push(node)
    }
  }

  // Priorité : current -> siblings -> ranked
  const currentKey = input.selectedSubmenuKey || input.selectedMenuKey
  const current = currentKey ? flat.find((n) => n.key === currentKey) : null
  if (current) add(current)

  if (current) {
    const parent = nodes.find((n) => n.children?.some((c) => c.key === currentKey))
    parent?.children
      ?.filter((c) => c.key !== current.key)
      .forEach((c) => add(c))
  }

  ranked.forEach(({ node }) => {
    if (suggestions.length >= budget) return
    add(node)
  })

  return suggestions
}
