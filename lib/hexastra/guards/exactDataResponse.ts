/**
 * Exact Data Unavailable Response
 *
 * Returned when a subcategory requires exact calculated data
 * and the API was unable to resolve it.
 *
 * Rule: Never produce an interpretation as if data existed.
 */

type Lang = string

function tr(language: Lang, variants: Partial<Record<string, string>>): string {
  const code = (language || 'fr').slice(0, 2).toLowerCase()
  return variants[code] ?? variants['fr'] ?? ''
}

const SUBCATEGORY_LABELS: Record<string, { fr: string; en: string }> = {
  ascendant:          { fr: 'ascendant', en: 'rising sign' },
  theme_natal:        { fr: 'thème natal', en: 'birth chart' },
  maisons:            { fr: 'maisons astrologiques', en: 'astrological houses' },
  houses:             { fr: 'maisons astrologiques', en: 'astrological houses' },
  signe_lunaire:      { fr: 'signe lunaire', en: 'moon sign' },
  planetes:           { fr: 'positions planétaires', en: 'planetary positions' },
  transits:           { fr: 'transits', en: 'transits' },
  aspects:            { fr: 'aspects', en: 'aspects' },
  cycle:              { fr: 'cycles (retour solaire / progressions)', en: 'solar return / progressions' },
  retrograde:         { fr: 'rétrogrades', en: 'retrograde' },
  chemin_de_vie:      { fr: 'chemin de vie', en: 'life path number' },
  expression:         { fr: "nombre d'expression", en: 'expression number' },
  ame:                { fr: "nombre d'âme", en: 'soul number' },
  personnalite_num:   { fr: 'nombre de personnalité', en: 'personality number' },
  annee_personnelle:  { fr: 'année personnelle', en: 'personal year' },
  mois_personnel:     { fr: 'mois personnel', en: 'personal month' },
  jour_personnel:     { fr: 'jour personnel', en: 'personal day' },
  type_hd:            { fr: 'type Human Design', en: 'Human Design type' },
  strategie_hd:       { fr: 'stratégie Human Design', en: 'Human Design strategy' },
  autorite_hd:        { fr: 'autorité Human Design', en: 'Human Design authority' },
  profil_hd:          { fr: 'profil Human Design', en: 'Human Design profile' },
  centres_hd:         { fr: 'centres Human Design', en: 'Human Design centers' },
  portes_hd:          { fr: 'portes Human Design', en: 'Human Design gates' },
  canaux_hd:          { fr: 'canaux Human Design', en: 'Human Design channels' },
  croix_incarnation:  { fr: "croix d'incarnation", en: 'incarnation cross' },
  definition_hd:      { fr: 'définition Human Design', en: 'Human Design definition' },
  transits_hd:        { fr: 'transits Human Design', en: 'Human Design transits' },
  annual_guidance:    { fr: 'priorites annuelles', en: 'annual priorities' },
  career_guidance:    { fr: 'orientation professionnelle', en: 'career guidance' },
  nombre_kua:         { fr: 'nombre Kua', en: 'Kua number' },
  direction_kua:      { fr: 'directions Kua', en: 'Kua directions' },
  orientation_habitat: { fr: 'orientation habitat', en: 'home orientation' },
  orientation_bureau:  { fr: 'orientation bureau', en: 'desk orientation' },
  direction_sommeil:   { fr: 'direction de sommeil', en: 'sleeping direction' },
  sun:                { fr: 'Soleil', en: 'Sun' },
  moon:               { fr: 'Lune', en: 'Moon' },
  mercury:            { fr: 'Mercure', en: 'Mercury' },
  venus:              { fr: 'Vénus', en: 'Venus' },
  mars:               { fr: 'Mars', en: 'Mars' },
  jupiter:            { fr: 'Jupiter', en: 'Jupiter' },
  saturn:             { fr: 'Saturne', en: 'Saturn' },
  autorite_ou_strategie: { fr: 'autorité ou stratégie Human Design', en: 'Human Design authority or strategy' },
}

function getSubcategoryLabel(subcategory: string, language: string): string {
  const labels = SUBCATEGORY_LABELS[subcategory]
  if (!labels) return subcategory.replace(/_/g, ' ')
  const code = (language || 'fr').slice(0, 2).toLowerCase()
  return code === 'en' ? labels.en : labels.fr
}

/**
 * Returns a clean, honest refusal message when exact data could not be resolved.
 * Never returns a fake interpretation.
 *
 * @param birthDataComplete - true when all required birth fields are present in the profile
 *   but the calculation API was unreachable. In that case the message targets the engine,
 *   not the user's data.
 */
export function buildExactDataUnavailableResponse(params: {
  language: string
  subcategory: string
  missingBirthFields?: string[]
  birthDataComplete?: boolean
}): string {
  const { language, subcategory, missingBirthFields = [], birthDataComplete = false } = params
  const label = getSubcategoryLabel(subcategory, language)

  const hasMissingFields = missingBirthFields.length > 0

  return tr(language, {
    fr: hasMissingFields
      ? `Pour calculer ton ${label} avec exactitude, il me manque des données de naissance essentielles :\n${missingBirthFields.map((f) => `- ${f}`).join('\n')}\n\nJe préfère ne pas improviser sur des données qui doivent être précises. Donne-moi ces informations et je te donne ton ${label} exact.`
      : birthDataComplete
        ? `Je vois bien tes données de naissance dans ton profil — elles sont complètes.\n\nLe blocage ne vient pas de tes informations : le moteur de calcul astrologique n'a pas pu être contacté à cet instant.\n\nRéessaie dans quelques instants. Si le problème persiste, contacte le support.`
        : `Je n'ai pas pu récupérer les données exactes nécessaires pour ton ${label}.\n\nJe préfère ne pas improviser sur des informations qui doivent être calculées avec précision. Si le problème persiste, vérifie que tes données de naissance sont complètes et réessaie.`,
    en: hasMissingFields
      ? `To calculate your ${label} accurately, I'm missing essential birth data:\n${missingBirthFields.map((f) => `- ${f}`).join('\n')}\n\nI won't guess on data that needs to be precise. Give me these details and I'll give you your exact ${label}.`
      : birthDataComplete
        ? `I can see your birth data is already saved in your profile — all required fields are present.\n\nThe issue is not your information: the astrological calculation engine could not be reached at this moment.\n\nPlease try again in a few moments. If the problem persists, contact support.`
        : `I was unable to retrieve the exact data needed for your ${label}.\n\nI prefer not to improvise on information that must be precisely calculated. If the issue persists, check that your birth data is complete and try again.`,
  })
}

export function buildIncompleteExactDataResponse(params: {
  language: string
  subcategory: string
  missingExactFields: string[]
}): string {
  const { language, subcategory, missingExactFields } = params
  const label = getSubcategoryLabel(subcategory, language)
  const missingLabels = missingExactFields.length
    ? missingExactFields.map((field) => `- ${getSubcategoryLabel(field, language)}`).join('\n')
    : language.startsWith('en')
      ? '- required exact calculated fields'
      : '- des champs calculés indispensables'

  return tr(language, {
    fr:
      `Je ne peux pas confirmer ton ${label} avec fiabilité à partir des données calculées actuellement disponibles.\n\n` +
      `La source renvoie un bloc partiel, et il manque encore :\n${missingLabels}\n\n` +
      `Je préfère ne rien compléter par déduction ou par analogie avec d'autres sciences.`,
    en:
      `I can't confirm your ${label} reliably from the calculated data currently available.\n\n` +
      `The source returned only partial data, and it is still missing:\n${missingLabels}\n\n` +
      `I prefer not to fill the gaps by deduction or by borrowing from other sciences.`,
  })
}
