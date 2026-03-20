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
 */

export type SemanticContextType =
  | 'profile'       // Who am I? My nature, my strengths (generic profile read)
  | 'astro_exact'   // Explicit astrology calculation: natal chart, transits, aspects, houses
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

  // ── ASTRO_EXACT — explicit astrological calculation request ───────────────
  // Must fire BEFORE 'profile' — "mon thème natal" is an astro reading, not a profile read.
  // Covers: natal chart, transits, aspects, houses, moon sign, solar return, progressions,
  //         retrogrades, synastry, planetary positions.
  if (
    /(theme natal|theme astral|carte (natale|du ciel|de naissance)|transits? (astrol|du moment|en cours|planetaire|actuels?)?|aspects? (astrol|natal)?|maisons? (astrol|natal)?|signe lunaire|retour solaire|progressions? (astral|secondaire|natal)?|retrogrades?|synastrie|lecture astrol|position(s)? (des )?planetes|axes? (natal|astrol)|thematique astrale|mon (ascendant|theme natal|theme astral|signe lunaire)|mes (transits|aspects|maisons|planetes|retrogrades?)|lecture (de mon |du )?theme|mon (profil|theme) astral|carte de naissance)/.test(
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
