/**
 * Hallucination Guard — Hexastra Coach
 *
 * Guards against:
 * 1. False plan limitations when exact data is already resolved
 * 2. Anti-contradiction: do not change a value because the user contests it
 * 3. Response mode integrity: factual request should receive factual response
 *
 * These rules are injected into system prompts and can also be used
 * to scrub or flag problematic output.
 */

import type { ResponseMode } from '@/lib/hexastra/orchestration/responseModes'

// ── False Plan Limitation Guard ────────────────────────────────────────────────

/**
 * Phrases that signal a false plan limitation message.
 * If exactDataResolved=true and reliable=true, these must be blocked.
 */
const FALSE_PLAN_LIMIT_PHRASES = [
  'plan free ne permet pas',
  'plan gratuit ne permet pas',
  'plan gratuit ne donne pas',
  'accès réservé au plan',
  'disponible uniquement avec',
  'lecture disponible uniquement',
  'pas disponible sur votre plan',
  'pas disponible sur ton plan',
  'plan supérieur requis pour',
  'version premium requise',
  "je n'ai pas accès",
  'je ne peux pas calculer',
  "je n'ai pas les données de calcul",
  "upgrader votre plan",
  'passer au plan',
  'réservé aux abonnés',
  "n'est pas inclus dans",
]

/**
 * Should we block false plan limitation messages?
 *
 * RULE: if exact data is resolved and reliable, any plan-based limitation message
 * is a false negative — the engine already has the answer, the plan limitation is irrelevant.
 */
export function shouldBlockFalsePlanLimitation(
  exactDataResolved: boolean,
  reliable: boolean,
): boolean {
  return exactDataResolved && reliable
}

/**
 * Detect whether a response text contains a false plan limitation phrase.
 * Used for logging/alerting; not for hard blocking (LLM output is already generated).
 */
export function containsFalsePlanLimitation(responseText: string): boolean {
  const lower = (responseText || '').toLowerCase()
  return FALSE_PLAN_LIMIT_PHRASES.some((phrase) => lower.includes(phrase))
}

// ── Anti-Hallucination Prompt Rules ───────────────────────────────────────────

/**
 * Strict rules injected into the system prompt to prevent hallucination.
 *
 * These are injected directly before the exactDataBlock so the LLM reads them
 * in context with the data it is about to use.
 */
export const ANTI_HALLUCINATION_RULES = `RÈGLES ABSOLUES — DONNÉES EXACTES (ne jamais transgresser):
1. Ne jamais inventer une donnée exacte (planète, signe, profil, type, nombre, centre, autorité, canal, porte, placement).
2. Ne jamais corriger ou modifier une valeur exacte parce que l'utilisateur la contredit.
   → Si l'utilisateur dit "tu te trompes sur mon ascendant", répondre:
     "La valeur que j'indique provient du moteur de calcul. Si tu penses à une erreur, vérifie tes données de naissance enregistrées."
3. Ne jamais déduire un profil HD depuis l'astrologie, ni une planète depuis le HD. Les sciences ne s'empruntent pas entre elles.
4. Ne jamais remplacer une liste demandée par une prose générale.
   → Si l'utilisateur demande "mes planètes", donner la liste, pas une interprétation générale.
5. Ne jamais utiliser des données du vector store comme source primaire d'une valeur calculée.
6. Si une donnée est absente du bloc de données ci-dessous, le dire honnêtement:
   "Cette donnée n'est pas disponible — vérifie que tes informations de naissance sont enregistrées."
7. Ne jamais inventer depuis la mémoire de modèle. Seul le bloc de données ci-dessous fait foi.
8. Ne jamais prétendre qu'un plan commercial bloque l'accès si le moteur a déjà répondu avec des données fiables.`

// ── Response Mode Integrity Check ─────────────────────────────────────────────

/**
 * Heuristic check: does a response match the expected mode?
 *
 * Returns true if a probable mismatch is detected (for logging only).
 * Do NOT hard-block on this — it's a diagnostic signal.
 */
export function detectResponseModeMismatch(
  responseText: string,
  expectedMode: ResponseMode,
  exactDataResolved: boolean,
): boolean {
  if (!exactDataResolved || !responseText || responseText.length < 30) return false

  if (expectedMode === 'exact_list' || expectedMode === 'exact_card') {
    // A factual response should contain structured values, not only prose.
    // Heuristic: look for structured markers (colon-separated, bullets, numbers, degree symbols)
    const hasStructuredValue = /[A-Z][a-zà-ÿ]+ ?\:.*\S|●|•|\d+\/\d+|\d+°|[A-Z]{3,}/.test(responseText)
    // If long response with no structured value → likely prose for a fact request
    if (!hasStructuredValue && responseText.length > 150) return true
  }

  return false
}

// ── Anti-Contradiction prompt snippet ─────────────────────────────────────────

/**
 * Short directive to add when a contradiction follow-up is detected.
 * Prevents the LLM from capitulating to the user's contested value.
 */
export const ANTI_CONTRADICTION_DIRECTIVE = `DIRECTIVE ANTI-CONTRADICTION:
L'utilisateur conteste une valeur exacte. Ne la modifie PAS.
Rappelle que la valeur provient du moteur de calcul (données de naissance).
Si une erreur est possible, invite l'utilisateur à vérifier ses données de naissance enregistrées.
Ne recalcule pas depuis ta mémoire de modèle — seul le bloc de données fait foi.`
