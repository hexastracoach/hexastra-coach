/**
 * Semantic Context Detector — Hexastra Coach
 *
 * Detects the user's true intent ABOVE the domain route level.
 * Used to block incorrect fallback routing (e.g. analysis + general → micro_profile).
 *
 * Priority: subcategory > science > contextType > detectContext fallback
 */

export type SemanticContextType =
  | 'profile'       // Who am I? My chart, my nature, my strengths
  | 'current'       // What's happening now? My current situation
  | 'timing'        // Future phases, upcoming periods, cycles
  | 'decision'      // Should I? Which option? What to choose?
  | 'compatibility' // My relationship with another person
  | 'unknown'       // Could not determine — use fallback routing

export type SemanticContext = {
  contextType: SemanticContextType
  confidence: number
}

function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Detect the semantic context type from a raw user message.
 * Returns contextType + confidence (0–1).
 * confidence < 0.5 = treat as 'unknown'
 */
export function detectContext(message: string): SemanticContext {
  const text = normalize(message)

  // ── DECISION — highest specificity ───────────────────────────────────────
  if (
    /(dois-?je|faut-?il|j'?hesite|j.?hesite|que faire|quelle option|quelle direction|quel choix|faut il que|trancher|choisir entre|je dois choisir|devrais-?je|should i|what should i|which option|decision a prendre)/.test(
      text,
    )
  ) {
    return { contextType: 'decision', confidence: 0.92 }
  }

  // ── PROFILE — who am I, my nature ─────────────────────────────────────────
  if (
    /(qui suis-?je|mon profil|ma carte|mon theme natal|mon theme astral|mon ascendant|mon signe lunaire|mon type hd|ma personnalite|ma nature profonde|mes forces|mes talents|mes potentiels|mes atouts|connaitre mon|who am i|my profile|my birth chart|my chart|my nature|my strengths|my talents)/.test(
      text,
    )
  ) {
    return { contextType: 'profile', confidence: 0.9 }
  }

  // ── COMPATIBILITY — with another person ───────────────────────────────────
  if (
    /(compatibilite|compatible avec|relation avec|lien avec|mon partenaire|ma partenaire|mon conjoint|ma conjointe|nous deux|notre relation|synastrie|notre compatibilite|synastry|compatibility with|our relationship|between us|entre nous)/.test(
      text,
    )
  ) {
    return { contextType: 'compatibility', confidence: 0.88 }
  }

  // ── TIMING — future periods, upcoming phases ──────────────────────────────
  if (
    /(prochains? (mois|semaines?|jours?|ann[ée]e?)|mois a venir|periode a venir|a venir|dans les prochains|upcoming|next (month|week|year)|what.?s coming|ce qui m.?attend|ce que m.?apporte|cette ann[ée]e|ce mois-ci|ce cycle|cycle a venir|mes transits|transit du moment)/.test(
      text,
    )
  ) {
    return { contextType: 'timing', confidence: 0.85 }
  }

  // ── CURRENT SITUATION — what's happening now ──────────────────────────────
  if (
    /(situation actuelle|ce qui se passe|moment que je vis|p[eé]riode que je traverse|comment je suis|o[uù] j.?en suis|o[uù] en suis|actuellement|en ce moment|ce moment|aujourd.?hui|ce que je vis|analyser? ma situation|analyser? (ma|la) situation|comment [çc]a se passe|que se passe.?t.?il|ma situation (de vie|actuelle|du moment)|[eé]tat actuel|[eé]tat du moment|bilan (actuel|du moment)|ma vie en ce moment|comment je me sens|je me sens|comment [çc]a va)/.test(
      text,
    )
  ) {
    return { contextType: 'current', confidence: 0.85 }
  }

  return { contextType: 'unknown', confidence: 0 }
}
