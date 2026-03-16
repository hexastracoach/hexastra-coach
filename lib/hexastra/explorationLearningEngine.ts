import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { PromptMenuNode } from '@/lib/hexastra/data/promptMenu'

type TrackEvent = {
  angleId: string
  theme?: string
  science?: string
  userPlan?: string
  questionContext?: string
  timestamp?: string
}

type RankContext = {
  plan: string
  intent?: string | null
}

const memoryScores = new Map<string, number>()

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createServerClient(url, key, {
    cookies: {
      get() {
        return undefined
      },
      set() {},
      remove() {},
    },
  })
}

export async function trackExplorationClick(evt: TrackEvent) {
  const now = evt.timestamp ?? new Date().toISOString()
  const baseScore = 1
  const prev = memoryScores.get(evt.angleId) ?? 0
  memoryScores.set(evt.angleId, prev + baseScore)

  const supabase = getSupabaseAdmin()
  if (!supabase) return
  try {
    await supabase.from('exploration_usage').insert({
      angle_id: evt.angleId,
      theme: evt.theme ?? null,
      science: evt.science ?? null,
      plan: evt.userPlan ?? null,
      question_context: evt.questionContext ?? null,
      created_at: now,
    })
  } catch {
    // silent fail to avoid blocking UX
  }
}

export function updateExplorationScores(angleId: string, delta = 1) {
  const prev = memoryScores.get(angleId) ?? 0
  memoryScores.set(angleId, prev + delta)
}

export function rankExplorationSuggestions(nodes: PromptMenuNode[], ctx: RankContext): PromptMenuNode[] {
  const intent = ctx.intent ?? null
  const scored = nodes.map((n) => {
    let score = 0
    if (intent && n.contextType === intent) score += 3
    const mem = memoryScores.get(n.key) ?? 0
    score += Math.min(mem, 5)
    if (ctx.plan === 'premium' || ctx.plan === 'practitioner' || ctx.plan === 'praticien') score += 1
    return { node: n, score }
  })
  return scored.sort((a, b) => b.score - a.score).map((s) => s.node)
}
