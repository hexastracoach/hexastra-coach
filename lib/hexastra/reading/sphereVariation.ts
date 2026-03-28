/**
 * sphereVariation — Anti-répétition pour les 12 sphères Hexastra
 *
 * PROBLÈME :
 * Plusieurs sphères partagent des sources de données proches (hiddenMechanism,
 * realTension, visibleEffect). Sans transformation active, certaines sphères
 * risquent de se ressembler trop.
 *
 * APPROCHE :
 * 1. Mesure de similarité token-based (rapide, déterministe)
 * 2. Seuil de tolérance : > 65% de tokens communs = "trop similaire"
 * 3. Diversification : reformuler depuis un champ alternatif
 *
 * GARANTIE :
 * - Pas de hasard ni de LLM dans cette couche
 * - Même input → même output toujours
 * - Légère (pas de lib externe)
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type SphereContentPair = {
  id: number
  content: string
}

// ── Logique de similarité ────────────────────────────────────────────────────

/**
 * Tokenise un texte : minuscules, sans ponctuation, mots de 3+ chars.
 * Exclut les stopwords courants FR/EN pour ne garder que les mots porteurs.
 */
const STOPWORDS = new Set([
  // FR
  'le','la','les','un','une','des','de','du','et','en','à','au','aux','tu','je','il',
  'elle','on','nous','vous','ils','elles','ce','qui','que','quoi','dont','où','par',
  'pour','sur','sous','dans','avec','sans','mais','ou','car','ni','ne','pas','plus',
  'très','bien','quand','comme','si','donc','or','car','que','quand','puis','car',
  // EN
  'the','a','an','of','in','to','and','or','but','for','on','at','with','by','is',
  'it','its','this','that','not','no','so','if','as','from',
])

export function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
  )
}

/**
 * Jaccard similarity entre deux textes.
 * Retourne un score 0–1 (1 = identiques, 0 = aucun token commun).
 */
export function jaccardSimilarity(a: string, b: string): number {
  const setA = tokenize(a)
  const setB = tokenize(b)
  if (setA.size === 0 && setB.size === 0) return 1
  if (setA.size === 0 || setB.size === 0) return 0

  let intersection = 0
  for (const token of setA) {
    if (setB.has(token)) intersection++
  }

  const union = setA.size + setB.size - intersection
  return union === 0 ? 0 : intersection / union
}

/**
 * Détecte si deux contenus de sphères sont trop similaires.
 * Seuil : 0.65 (65% de tokens Jaccard en commun)
 */
export const SIMILARITY_THRESHOLD = 0.65

export function areTooSimilar(a: string, b: string): boolean {
  return jaccardSimilarity(a, b) >= SIMILARITY_THRESHOLD
}

// ── Validation et rapport ─────────────────────────────────────────────────────

export type SimilarityReport = {
  /** Toutes les paires avec leurs scores */
  pairs: Array<{ idA: number; idB: number; score: number; flag: boolean }>
  /** Nombre de paires flagguées (trop similaires) */
  flaggedCount: number
  /** true si 0 paires flagguées */
  valid: boolean
}

/**
 * Analyse la similarité entre toutes les paires de sphères.
 * Retourne un rapport détaillé (utile pour les tests et le debug).
 *
 * @param spheres  Liste de { id, content } pour les 12 sphères
 * @returns        Rapport de similarité complet
 */
export function analyzeSphereVariation(spheres: SphereContentPair[]): SimilarityReport {
  const pairs: SimilarityReport['pairs'] = []

  for (let i = 0; i < spheres.length; i++) {
    for (let j = i + 1; j < spheres.length; j++) {
      const a = spheres[i]!
      const b = spheres[j]!
      const score = jaccardSimilarity(a.content, b.content)
      pairs.push({
        idA: a.id,
        idB: b.id,
        score: Math.round(score * 100) / 100,
        flag: score >= SIMILARITY_THRESHOLD,
      })
    }
  }

  const flaggedCount = pairs.filter((p) => p.flag).length

  return {
    pairs,
    flaggedCount,
    valid: flaggedCount === 0,
  }
}

/**
 * Retourne les paires trop similaires (score ≥ seuil).
 * Raccourci pour les assertions de test.
 */
export function flaggedSimilarPairs(spheres: SphereContentPair[]): Array<{ idA: number; idB: number; score: number }> {
  const { pairs } = analyzeSphereVariation(spheres)
  return pairs
    .filter((p) => p.flag)
    .map(({ idA, idB, score }) => ({ idA, idB, score }))
}
