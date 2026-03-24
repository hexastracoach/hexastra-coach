/**
 * Scope refusal templates - polite, multilingual, non-robotic.
 * Used when policy.branch === 'out_of_scope' to build a pre-made response
 * without any LLM call.
 */

const REFUSAL_FR = `Je suis HexAstra Coach, un outil d'analyse personnelle centre sur la lecture de situation, les dynamiques de vie, les decisions et les cycles utiles.

Ce que tu me demandes sort de mon domaine de specialisation, et je prefere etre honnete plutot que d'improviser une reponse hors de mon champ.

Si tu as une question sur ta situation de vie, tes relations, une decision a prendre, ton equilibre interieur ou ta phase actuelle, je suis la pour ca. Tu peux aussi choisir un angle via le menu.`

const REFUSAL_EN = `I am HexAstra Coach, a personal analysis tool focused on life situations, dynamics, decisions and useful cycles.

What you're asking falls outside my area of expertise, and I'd rather be honest than improvise an answer beyond my scope.

If you have a question about your life situation, relationships, a decision to make, your inner balance or your current phase, I'm here for that. You can also explore an angle via the menu.`

export function buildScopeRefusalResponse(language: string): string {
  const isEnglish = language.toLowerCase().startsWith('en')
  return isEnglish ? REFUSAL_EN : REFUSAL_FR
}
