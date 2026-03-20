/**
 * Semantic Context Detector — Hexastra Coach
 *
 * Detects the user's true intent ABOVE the domain route level.
 * Used to block incorrect fallback routing (e.g. analysis + general → micro_profile).
 *
 * Priority order (highest to lowest):
 *   decision > astro_exact > profile > compatibility > timing > current > unknown
 *
 * NOTE: astro_exact MUST fire before 'profile' because patterns like
 * "mon thème natal" / "mes transits" would otherwise be captured by profile.
 *
 * detectAstroFollowup() handles conversational follow-ups (contradictions, re-verification)
 * when the previous assistant turn was about an astro exact reading.
 */

import type { ChatMessage } from '@/lib/chat/chatPayloadBuilder'

export type SemanticContextType =
  | 'profile'           // Who am I? My nature, my strengths (generic profile read)
  | 'astro_exact'       // Explicit astrology calculation: natal chart, transits, aspects, houses
  | 'astro_followup'    // Short contradiction / re-check after a previous astro exact turn
  | 'current'           // What's happening now? My current situation
  | 'timing'            // Future phases, upcoming periods, cycles
  | 'decision'          // Should I? Which option? What to choose?
  | 'compatibility'     // My relationship with another person
  | 'unknown'           // Could not determine — use fallback routing

export type SemanticContext = {
  contextType: SemanticContextType
  confidence: number
  /** Set to true when the context was promoted by conversation history (not message alone) */
  fromHistory?: boolean
}

function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

// ── Contradiction / re-check patterns ────────────────────────────────────────
// Short messages that contest a previous answer. Only meaningful when combined with
// a previous astro exact assistant turn.
const CONTRADICTION_PATTERN =
  /^(non|no|nope|faux|false|erreur|error|incorrect|wrong|pas ca|pas ça|ce n.?est pas ca|ce n.?est pas ça|c.?est pas ca|c.?est pas ça|tu te trompes|tu te trompe|tu t.?es trompe|t.?es trompe|recommence|reverifier|re-?verifier|recheck|reveri|verifie encore|verify again|pas ça du tout|pas ca du tout|c.?est faux|c.?est incorrect|c.?est errone|c.?est inexact|reessaie|re-?essaie|relance|redonne|donne moi a nouveau|refais|redonnes|pas le bon|not right|not correct|that.?s wrong|that.?s not right|check again)$/

// ── Signals that an assistant message was about astro exact ───────────────────
// Matches content that indicates the previous assistant turn contained an astro reading
const ASTRO_ASSISTANT_SIGNAL_PATTERN =
  /(theme natal|theme astral|signe solaire|signe lunaire|ascendant|maison(s)?|transit(s)?|aspect(s)?|pluton|saturne|jupiter|mars|mercure|venus|uranus|neptune|soleil en|lune en|ascendant en|retour solaire|progressions?|synastrie|carte (du ciel|natale|de naissance)|birth chart|natal chart|moon sign|rising sign|sun sign|solar return|position(s)? (des )?plan[eè]te)/i

// ── Signals in user history that suggest we were in an astro exact session ────
const ASTRO_USER_HISTORY_PATTERN =
  /(theme natal|theme astral|mon ascendant|signe lunaire|signe solaire|mes transits|mes aspects|mes maisons|birth chart|transits|natal chart|thème natal|thème astral|signe du soleil|rising sign|moon sign|sun sign)/i

/**
 * Detect whether a short contradiction/re-check message is a follow-up
 * to a previous astro exact assistant turn.
 *
 * Returns astro_exact context (promoted from history) if:
 *   1. Current message matches CONTRADICTION_PATTERN (short, <12 words)
 *   2. Either the last assistant message OR the last user message before this one
 *      contains astro exact signals
 */
export function detectAstroFollowup(
  message: string,
  history: ChatMessage[],
): SemanticContext | null {
  const normalized = normalize(message)
  const wordCount = normalized.trim().split(/\s+/).length

  // Only apply to short messages (contradiction / re-check are brief)
  if (wordCount > 12) return null
  if (!CONTRADICTION_PATTERN.test(normalized)) return null

  // Look backward through history for astro exact signal
  const reversedHistory = [...history].reverse()

  for (const msg of reversedHistory) {
    if (!msg.content) continue

    if (msg.role === 'assistant' && ASTRO_ASSISTANT_SIGNAL_PATTERN.test(msg.content)) {
      return { contextType: 'astro_followup', confidence: 0.9, fromHistory: true }
    }

    if (msg.role === 'user' && ASTRO_USER_HISTORY_PATTERN.test(normalize(msg.content))) {
      return { contextType: 'astro_followup', confidence: 0.85, fromHistory: true }
    }
  }

  return null
}

/**
 * Detect the semantic context type from a raw user message.
 * Returns contextType + confidence (0–1).
 * confidence < 0.5 = treat as 'unknown'
 *
 * Pass `history` to enable astro follow-up detection for contradictions.
 */
export function detectContext(message: string, history?: ChatMessage[]): SemanticContext {
  const text = normalize(message)

  // ── ASTRO FOLLOW-UP — contextual contradiction after an astro exact turn ──
  // Checked BEFORE keyword patterns because "non" / "faux" have no keywords
  if (history && history.length > 0) {
    const followup = detectAstroFollowup(message, history)
    if (followup) return followup
  }

  // ── DECISION — highest specificity ───────────────────────────────────────
  if (
    /(dois-?je|faut-?il|j'?hesite|j.?hesite|que faire|quelle option|quelle direction|quel choix|faut il que|trancher|choisir entre|je dois choisir|devrais-?je|should i|what should i|which option|decision a prendre)/.test(
      text,
    )
  ) {
    return { contextType: 'decision', confidence: 0.92 }
  }

  // ── ASTRO_EXACT — explicit astrological calculation request ───────────────
  // Must fire BEFORE 'profile' — "mon thème natal" is an astro reading, not a profile read.
  // Covers: natal chart, transits, aspects, houses, moon sign, solar return, progressions,
  //         retrogrades, synastry, planetary positions, sun/moon/rising direct questions.
  if (
    /(theme natal|theme astral|carte (natale|du ciel|de naissance)|transits? (astrol|du moment|en cours|planetaire|actuels?)?|aspects? (astrol|natal)?|maisons? (astrol|natal)?|signe (lunaire|solaire|du soleil)|retour solaire|progressions? (astral|secondaire|natal)?|retrogrades?|synastrie|lecture astrol|position(s)? (des )?planetes|axes? (natal|astrol)|thematique astrale|mon (ascendant|theme natal|theme astral|signe lunaire|signe solaire)|mes (transits|aspects|maisons|planetes|retrogrades?)|lecture (de mon |du )?theme|mon (profil|theme) astral|carte de naissance|sun sign|moon sign|rising sign|my rising|my moon sign|my sun sign|quel (est mon|sont mes) (signe|ascendant|lune|soleil)|quels? sont (mon|mes) (signe|signes|placements?)|soleil.{0,20}lune.{0,20}ascendant|lune.{0,20}ascendant|ascendant.{0,20}lune)/.test(
      text,
    )
  ) {
    return { contextType: 'astro_exact', confidence: 0.95 }
  }

  // ── PROFILE — who am I, my nature (generic, non-astro) ───────────────────
  // Intentionally excludes astro-specific patterns (covered above)
  if (
    /(qui suis-?je|mon profil|ma nature profonde|mes forces|mes talents|mes potentiels|mes atouts|connaitre mon profil|who am i|my profile|my chart|my nature|my strengths|my talents|ma personnalite|mon type hd|mon profil hd|mon profil numerologique|mon chemin de vie|mon nombre|mon type (human design|hd))/.test(
      text,
    )
  ) {
    return { contextType: 'profile', confidence: 0.9 }
  }

  // ── COMPATIBILITY — with another person ───────────────────────────────────
  if (
    /(compatibilite|compatible avec|relation avec|lien avec|mon partenaire|ma partenaire|mon conjoint|ma conjointe|nous deux|notre relation|notre compatibilite|compatibility with|our relationship|between us|entre nous)/.test(
      text,
    )
  ) {
    return { contextType: 'compatibility', confidence: 0.88 }
  }

  // ── TIMING — future periods, upcoming phases ──────────────────────────────
  if (
    /(prochains? (mois|semaines?|jours?|ann[ee]e?)|mois a venir|periode a venir|a venir|dans les prochains|upcoming|next (month|week|year)|what.?s coming|ce qui m.?attend|ce que m.?apporte|cette ann[ee]e|ce mois-ci|ce cycle|cycle a venir)/.test(
      text,
    )
  ) {
    return { contextType: 'timing', confidence: 0.85 }
  }

  // ── CURRENT SITUATION — what's happening now ──────────────────────────────
  if (
    /(situation actuelle|ce qui se passe|moment que je vis|p[ee]riode que je traverse|comment je suis|o[u] j.?en suis|o[u] en suis|actuellement|en ce moment|ce moment|aujourd.?hui|ce que je vis|analyser? ma situation|analyser? (ma|la) situation|comment [cc]a se passe|que se passe.?t.?il|ma situation (de vie|actuelle|du moment)|[ee]tat actuel|[ee]tat du moment|bilan (actuel|du moment)|ma vie en ce moment|comment je me sens|je me sens|comment [cc]a va)/.test(
      text,
    )
  ) {
    return { contextType: 'current', confidence: 0.85 }
  }

  return { contextType: 'unknown', confidence: 0 }
}
