/**
 * Insight Engine — Hexastra Coach
 *
 * Détecte des patterns récurrents dans l'historique de conversation.
 * Résultat utilisé pour :
 *  - afficher un "memory hint" subtil à l'utilisateur
 *  - suggérer un approfondissement contextuel
 *  - adapter le ton du moteur sur le long terme
 *
 * Règles de protection :
 *  - jamais de données sensibles
 *  - seulement probabiliste (confidence < 1.0 toujours)
 *  - seuil minimum de 3 messages avant activation
 */

export type InsightTag =
  | 'decision_pattern'
  | 'transit_seeker'
  | 'relational_focus'
  | 'emotional_exploration'
  | 'career_focus'
  | 'depth_seeker'

export type UserInsight = {
  tag: InsightTag
  label: string
  confidence: number
  memoryHint: string
  suggestionPrompt: string
}

export type InsightResult = {
  insights: UserInsight[]
  dominant: UserInsight | null
  /** Texte affiché subtilement dans l'UI quand dominant.confidence > 0.65 */
  activeHint: string | null
}

type InsightDef = {
  tag: InsightTag
  label: string
  patterns: RegExp[]
  memoryHint: string
  suggestionPrompt: string
}

const INSIGHT_DEFS: InsightDef[] = [
  {
    tag: 'decision_pattern',
    label: 'Décisions & Direction',
    patterns: [
      /\b(d[eé]cis|choisir|choi[sx]|trancher|option|alternative|dilemme)\b/i,
      /\b(pro|travail|carri[eè]re|boulot|opportunit[eé]|poste|emploi)\b/i,
    ],
    memoryHint: "On dirait que tu explores souvent les décisions et la direction de vie… tu veux creuser ça ?",
    suggestionPrompt: 'Fais-moi une lecture fusionnée sur mes décisions de vie actuelles.',
  },
  {
    tag: 'transit_seeker',
    label: 'Timing & Cycles',
    patterns: [
      /\b(transit|timing|moment|cycle|p[eé]riode|maintenant|quand agir)\b/i,
      /\b(aujourd.hui|cette semaine|ce mois|prochains? jours?)\b/i,
    ],
    memoryHint: "Tu reviens souvent sur le timing et les cycles… une lecture prévision t'aiderait ?",
    suggestionPrompt: 'Quel est le meilleur moment pour agir dans ma situation actuelle ?',
  },
  {
    tag: 'relational_focus',
    label: 'Relations & Connexions',
    patterns: [
      /\b(relation|couple|partenaire|amour|ami|famille|entourage)\b/i,
      /\b(conflit|tension|lien|connexion|compatibilit[eé])\b/i,
    ],
    memoryHint: "Tes questions gravitent souvent autour des relations… tu veux explorer ça en profondeur ?",
    suggestionPrompt: 'Analyse la dynamique de mes relations importantes en ce moment.',
  },
  {
    tag: 'emotional_exploration',
    label: 'États intérieurs',
    patterns: [
      /\b(perdu|bloqu[eé]|sens[ie]?|ressens?|[eé]motion|anxieux|anxiet[eé]|stress|peur|tristesse)\b/i,
      /\b(int[eé]rieur|[aà] l.int[eé]rieur|profond|vraiment|moi)\b/i,
    ],
    memoryHint: "Tu explores beaucoup tes états intérieurs… une lecture bien-être t'aiderait ?",
    suggestionPrompt: 'Je veux une lecture de mon état émotionnel et intérieur du moment.',
  },
  {
    tag: 'career_focus',
    label: 'Carrière & Projet',
    patterns: [
      /\b(projet|lancer|cr[eé]er|entreprise|freelance|mission|vocation|sens\s+pro)\b/i,
      /\b(argent|revenu|finances?|success|r[eé]ussite|ambition)\b/i,
    ],
    memoryHint: "Projet et ambition reviennent souvent dans tes questions… tu veux une lecture dédiée ?",
    suggestionPrompt: 'Fais-moi une lecture sur ma trajectoire professionnelle et mon projet de vie.',
  },
  {
    tag: 'depth_seeker',
    label: 'Lecture approfondie',
    patterns: [
      /\b(approfondi|complet|d[eé]tail|expliqu|analys|comprendre|savoir)\b/i,
      /\b(th[eè]me natal|profil complet|analyse globale|multi-sciences)\b/i,
    ],
    memoryHint: "Tu aimes aller en profondeur — une lecture multi-sciences complète t'intéresserait ?",
    suggestionPrompt: "Fais-moi une analyse approfondie multi-sciences de ma situation.",
  },
]

/** Minimum user messages before activating insights */
const MIN_MESSAGES = 3
/** Minimum confidence to surface a hint */
const CONFIDENCE_THRESHOLD = 0.55

function scoreInsight(def: InsightDef, userMessages: string[]): number {
  let matches = 0
  for (const msg of userMessages) {
    const hitPatterns = def.patterns.filter((p) => p.test(msg)).length
    if (hitPatterns > 0) matches++
  }
  return matches
}

/**
 * Analyze conversation history for recurring user patterns.
 * Only considers user messages (not assistant responses).
 *
 * @param messages  Full conversation history
 */
export function buildUserInsights(
  messages: Array<{ role: string; content: string }>,
): InsightResult {
  const userMessages = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)

  if (userMessages.length < MIN_MESSAGES) {
    return { insights: [], dominant: null, activeHint: null }
  }

  const total = userMessages.length

  const scored: Array<{ def: InsightDef; score: number; confidence: number }> = INSIGHT_DEFS.map(
    (def) => {
      const score = scoreInsight(def, userMessages)
      const confidence = score / total
      return { def, score, confidence }
    },
  )
    .filter(({ score }) => score >= 2)
    .sort((a, b) => b.confidence - a.confidence)

  const insights: UserInsight[] = scored.map(({ def, confidence }) => ({
    tag: def.tag,
    label: def.label,
    confidence: Math.min(confidence, 0.95), // jamais absolu
    memoryHint: def.memoryHint,
    suggestionPrompt: def.suggestionPrompt,
  }))

  const dominant = insights[0] ?? null
  const activeHint =
    dominant && dominant.confidence >= CONFIDENCE_THRESHOLD ? dominant.memoryHint : null

  return { insights, dominant, activeHint }
}

/**
 * Build a compact context string for the LLM from detected insights.
 * Max ~120 tokens. Used in buildSystemPrompt.
 */
export function buildInsightContext(
  messages: Array<{ role: string; content: string }>,
): string | null {
  const { insights } = buildUserInsights(messages)
  if (insights.length === 0) return null

  const top = insights.slice(0, 2)
  const lines = top.map((i) => `- ${i.label} (conf. ${(i.confidence * 100).toFixed(0)}%)`)

  return ['[PATTERNS DÉTECTÉS — USAGE INTERNE]', ...lines, '[FIN PATTERNS]'].join('\n')
}
