import { generateContextualExplorationAngles } from '@/lib/hexastra/explorationEngine'
import { rankExplorationSuggestions } from '@/lib/hexastra/explorationLearningEngine'
import type { PromptMenuNode } from '@/lib/hexastra/data/promptMenu'

type Phase =
  | 'exploration_initiale'
  | 'clarification'
  | 'decision'
  | 'transformation'
  | 'integration'
  | 'regulation'

type NavigatorInput = {
  userId?: string | null
  question?: string
  conversationHistory?: string[]
  birthProfile?: { date?: string | null; solarSign?: string | null }
  plan: string
  apiCalculations?: {
    cycle?: 'expansion' | 'stabilisation' | 'transition' | null
    dominantZone?: string | null
    depthLevel?: string | null
    scienceHint?: string | null
  }
  contextType?: string | null
  domainRoute?: string | null
  selectedMenuKey?: string | null
  selectedSubmenuKey?: string | null
}

type NavigatorOutput = {
  nextRecommendedAngle: PromptMenuNode | null
  alternativeAngles: PromptMenuNode[]
  phase: Phase
}

function detectPhase(question?: string, ctx?: string | null): Phase {
  const q = (question || '').toLowerCase()
  if (ctx === 'decision' || /décision|choisir|hésite|option/.test(q)) return 'decision'
  if (ctx === 'energy' || /fatigue|stress|recharge|énergie/.test(q)) return 'regulation'
  if (ctx === 'relationship' || /relation/.test(q)) return 'clarification'
  if (/changer|transition/.test(q)) return 'transformation'
  if (/intégrer|consolider/.test(q)) return 'integration'
  if (/clarifier|je ne sais pas/.test(q)) return 'clarification'
  return 'exploration_initiale'
}

function phaseScore(phase: Phase, node: PromptMenuNode): number {
  if (phase === 'decision' && node.contextType === 'decision') return 4
  if (phase === 'regulation' && ['energy', 'wellbeing'].includes(node.contextType || '')) return 4
  if (phase === 'clarification' && ['relationship', 'career', 'general'].includes(node.contextType || '')) return 3
  if (phase === 'transformation' && /transition|change/i.test(node.description || '')) return 2
  return 0
}

export function getNextBestExploration(input: NavigatorInput): NavigatorOutput {
  const phase = detectPhase(input.question, input.contextType || input.domainRoute)
  const nodes = generateContextualExplorationAngles({
    plan: input.plan,
    contextType: input.contextType,
    domainRoute: input.domainRoute,
    selectedMenuKey: input.selectedMenuKey,
    selectedSubmenuKey: input.selectedSubmenuKey,
    userQuestion: input.question,
    apiCalculations: input.apiCalculations,
  })

  const ranked = rankExplorationSuggestions(nodes, {
    plan: input.plan,
    intent: input.contextType ?? input.domainRoute ?? null,
  })
    .map((n) => ({ node: n, score: phaseScore(phase, n) + 1 })) // +1 base
    .sort((a, b) => b.score - a.score)

  const next = ranked[0]?.node ?? null
  const alternatives = ranked.slice(1, 5).map((r) => r.node)

  return {
    nextRecommendedAngle: next,
    alternativeAngles: alternatives,
    phase,
  }
}
