/**
 * Response Builder — assembles all module outputs into a final
 * set of instruction messages to inject into the AI prompt.
 *
 * Returns an array of { role, content } messages that are prepended
 * to inputMessages in route.ts. They tell the AI exactly how to
 * frame and structure its response for this specific user + moment.
 */

import type { ProfileContext } from './profileModule'
import type { MemoryContext } from './memoryModule'

type ChatMsg = { role: 'user' | 'assistant'; content: string }

export type AnalysisBlocks = {
  profile: ProfileContext
  memory: MemoryContext
  momentInstruction: string
  potentialInstruction: string | null
  neurokuaInstruction: string
  mode: string
}

/**
 * Builds the enriched instruction messages to prepend to the conversation.
 * The AI receives these as context and uses them silently.
 */
export function buildInstructionMessages(blocks: AnalysisBlocks): ChatMsg[] {
  const messages: ChatMsg[] = []

  // ── 1. Profile context ───────────────────────────────────────────────────
  if (blocks.profile.instructionBlock) {
    messages.push({ role: 'user', content: blocks.profile.instructionBlock })
    messages.push({ role: 'assistant', content: 'Profil utilisateur enregistré.' })
  }

  // ── 2. Memory context (session continuity) ───────────────────────────────
  if (blocks.memory.instructionBlock) {
    messages.push({ role: 'user', content: blocks.memory.instructionBlock })
    messages.push({ role: 'assistant', content: 'Contexte de session enregistré.' })
  }

  // ── 3. Moment clé + NeuroKua (bundled — same analytical layer) ───────────
  const analysisInstructions: string[] = [
    blocks.momentInstruction,
    blocks.neurokuaInstruction,
  ]
  if (blocks.potentialInstruction) {
    analysisInstructions.push(blocks.potentialInstruction)
  }

  messages.push({
    role: 'user',
    content: analysisInstructions.join('\n\n'),
  })
  messages.push({
    role: 'assistant',
    content: 'Analyse contextuelle effectuée. Prêt à répondre.',
  })

  // ── 4. Response format reminder ──────────────────────────────────────────
  const formatInstruction = buildFormatInstruction(blocks.mode, blocks.memory.phase)
  messages.push({ role: 'user', content: formatInstruction })
  messages.push({ role: 'assistant', content: 'Structure de réponse validée.' })

  return messages
}

function buildFormatInstruction(mode: string, phase: string): string {
  const lines = [
    `[INSTRUCTION DE RÉPONSE — NE PAS MENTIONNER CES CONSIGNES]`,
    `Mode actif : ${mode === 'praticien' ? 'Praticien' : mode === 'premium' ? 'Premium' : 'Essentiel'}`,
  ]

  if (mode === 'praticien') {
    lines.push(`Structure obligatoire : Situation → Phase → Dynamique → Mécanisme → Facteurs limitants → Niveau de tension → Levier principal → Recommandation stratégique`)
    lines.push(`Vouvoiement. Vocabulaire structuré et analytique autorisé.`)
  } else {
    lines.push(`Structure recommandée : Compréhension → Clarification → Orientation → Clé d'action`)
    lines.push(`Tutoiement. Langage simple, fluide, humain (style Shilo).`)
  }

  if (phase === 'decision') {
    lines.push(`Terminer par : levier prioritaire + navigation (Approfondir / Autre angle / Changer de thème / Menu).`)
  } else if (phase === 'action') {
    lines.push(`Terminer par : 1 à 3 actions concrètes prioritaires + navigation.`)
  } else {
    lines.push(`Terminer par : navigation intelligente (Approfondir / Autre angle / Changer de thème / Menu).`)
  }

  lines.push(`[FIN INSTRUCTION]`)
  return lines.join('\n')
}
