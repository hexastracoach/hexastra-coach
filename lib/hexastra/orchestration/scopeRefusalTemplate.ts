/**
 * Scope refusal templates — polite, multilingual, non-robotic.
 * Used when policy.branch === 'out_of_scope' to build a pre-made response
 * without any LLM call.
 */

const REFUSAL_FR = `Je suis HexAstra Coach, un outil d'analyse personnelle basé sur les sciences humaines : astrologie, numérologie, Human Design, énergie Kua et fusion NeuroKua.

Ce que tu me demandes sort de mon domaine de spécialisation, et je préfère être honnête plutôt que d'improviser une réponse hors de mon champ.

Si tu as une question sur ta situation de vie, tes relations, une décision à prendre, ton profil énergétique ou tes cycles actuels — je suis là pour ça. Tu peux aussi choisir un angle via le menu.`

const REFUSAL_EN = `I am HexAstra Coach, a personal analysis tool grounded in human sciences: astrology, numerology, Human Design, Kua energy, and NeuroKua fusion.

What you're asking falls outside my area of expertise, and I'd rather be honest than improvise an answer beyond my scope.

If you have a question about your life situation, relationships, a decision to make, your energy profile, or your current cycles — I'm here for that. You can also explore an angle via the menu.`

export function buildScopeRefusalResponse(language: string): string {
  const isEnglish = language.toLowerCase().startsWith('en')
  return isEnglish ? REFUSAL_EN : REFUSAL_FR
}
