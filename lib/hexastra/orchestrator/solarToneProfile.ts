/**
 * solarToneProfile — Hexastra Coach
 *
 * Micro-personnalisation du ton de lecture par signe solaire.
 *
 * RÈGLE :
 * - Subtil, pas caricatural — le signe solaire colore le ton, il ne dicte pas la vérité
 * - Utilisé uniquement pour le toneHint dans CompactReadingCore
 * - Invariant : la stratégie HD et les données restent la base
 *
 * Structure : sunSign → SolarToneProfile (FR + EN)
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type SolarToneProfile = {
  /** Tonalité dominante du signe */
  tonalite: string
  /** Niveau de directivité (low | medium | high) */
  directivite: 'low' | 'medium' | 'high'
  /** Texture émotionnelle — comment l'émotion colore la lecture */
  textureEmotionnelle: string
  /** Style de phrases recommandé */
  styleDePhrases: string
  /** Intensité vocabulaire : 1 (doux) → 3 (fort) */
  intensiteVocabulaire: 1 | 2 | 3
  /** Conseil de ton pour le coaching (FR) */
  toneHint: string
  /** Coaching tone hint (EN) */
  toneHintEn: string
}

// ── Table des profils ──────────────────────────────────────────────────────────

const SOLAR_TONE_MAP: Record<string, SolarToneProfile> = {
  // ── Bélier / Aries ──────────────────────────────────────────────────────────
  'bélier': {
    tonalite: 'Direct, tranchant, énergique',
    directivite: 'high',
    textureEmotionnelle: 'Émotions vives, réactions immédiates — besoin de clarté et d\'action concrète',
    styleDePhrases: 'Phrases courtes. Verbes d\'action. Aller droit au but sans détour.',
    intensiteVocabulaire: 3,
    toneHint: 'Aller droit au but. Phrases courtes et directes. Vocabulaire d\'action (lancer, trancher, avancer). Éviter les formulations molles.',
    toneHintEn: 'Get straight to the point. Short, direct sentences. Action verbs (launch, decide, move). Avoid soft formulations.',
  },
  'aries': {
    tonalite: 'Direct, sharp, energetic',
    directivite: 'high',
    textureEmotionnelle: 'Vivid, immediate emotions — need for clarity and concrete action',
    styleDePhrases: 'Short sentences. Action verbs. Straight to the point.',
    intensiteVocabulaire: 3,
    toneHint: 'Aller droit au but. Phrases courtes et directes. Vocabulaire d\'action. Éviter les formulations molles.',
    toneHintEn: 'Get straight to the point. Short, direct sentences. Action verbs. Avoid soft formulations.',
  },

  // ── Taureau / Taurus ────────────────────────────────────────────────────────
  'taureau': {
    tonalite: 'Ancré, sensoriel, posé',
    directivite: 'medium',
    textureEmotionnelle: 'Émotions stables mais profondes — besoin de concret, de tangible et de sécurité',
    styleDePhrases: 'Phrases construites, sensuelles. Vocabulaire concret et sensoriel. Prise le temps de poser chaque idée.',
    intensiteVocabulaire: 2,
    toneHint: 'Ancrer dans le concret. Langage sensoriel et tangible. Patience dans le rythme. Éviter l\'abstraction excessive.',
    toneHintEn: 'Ground in the concrete. Sensory, tangible language. Patient rhythm. Avoid excessive abstraction.',
  },
  'taurus': {
    tonalite: 'Grounded, sensory, steady',
    directivite: 'medium',
    textureEmotionnelle: 'Stable but deep emotions — need for concrete, tangible, and security',
    styleDePhrases: 'Constructed, sensory sentences. Concrete vocabulary. Taking time with each idea.',
    intensiteVocabulaire: 2,
    toneHint: 'Ancrer dans le concret. Langage sensoriel et tangible. Éviter l\'abstraction excessive.',
    toneHintEn: 'Ground in the concrete. Sensory, tangible language. Avoid excessive abstraction.',
  },

  // ── Gémeaux / Gemini ────────────────────────────────────────────────────────
  'gémeaux': {
    tonalite: 'Vif, multiple, curieux',
    directivite: 'medium',
    textureEmotionnelle: 'Émotions changeantes — besoin de comprendre, de nommer, de voir plusieurs angles',
    styleDePhrases: 'Phrases légères, fluides. Jeux de mots subtils. Multiples perspectives exprimées simplement.',
    intensiteVocabulaire: 2,
    toneHint: 'Ton vif et mobile. Offrir plusieurs angles. Phrases fluides. Éviter le dogmatisme ou la lourdeur.',
    toneHintEn: 'Lively, mobile tone. Offer multiple angles. Fluid sentences. Avoid dogmatism or heaviness.',
  },
  'gemini': {
    tonalite: 'Lively, multiple, curious',
    directivite: 'medium',
    textureEmotionnelle: 'Changing emotions — need to understand, name, and see multiple angles',
    styleDePhrases: 'Light, fluid sentences. Subtle wordplay. Multiple perspectives expressed simply.',
    intensiteVocabulaire: 2,
    toneHint: 'Ton vif et mobile. Offrir plusieurs angles. Éviter le dogmatisme.',
    toneHintEn: 'Lively, mobile tone. Offer multiple angles. Avoid dogmatism.',
  },

  // ── Cancer ──────────────────────────────────────────────────────────────────
  'cancer': {
    tonalite: 'Doux, enveloppant, protecteur',
    directivite: 'low',
    textureEmotionnelle: 'Profonde sensibilité émotionnelle — besoin de connexion, de sécurité et d\'être vraiment compris',
    styleDePhrases: 'Phrases douces et fluides. Vocabulaire émotionnel et intuitif. Créer un espace de confiance.',
    intensiteVocabulaire: 1,
    toneHint: 'Ton doux et enveloppant. Valider l\'émotion avant de guider. Vocabulaire de connexion et de sécurité.',
    toneHintEn: 'Soft, enveloping tone. Validate the emotion before guiding. Vocabulary of connection and safety.',
  },

  // ── Lion / Leo ──────────────────────────────────────────────────────────────
  'lion': {
    tonalite: 'Vibrant, souverain, chaleureux',
    directivite: 'high',
    textureEmotionnelle: 'Émotions expressives — besoin d\'être vu, reconnu et valorisé dans sa singularité',
    styleDePhrases: 'Phrases avec conviction et chaleur. Vocabulaire de grandeur et de singularité. Reconnaître la valeur.',
    intensiteVocabulaire: 3,
    toneHint: 'Ton chaleureux et affirmé. Souligner la singularité et la force. Vocabulaire vibrant. Éviter la banalisation.',
    toneHintEn: 'Warm, affirmed tone. Highlight uniqueness and strength. Vibrant vocabulary. Avoid minimizing.',
  },
  'leo': {
    tonalite: 'Vibrant, sovereign, warm',
    directivite: 'high',
    textureEmotionnelle: 'Expressive emotions — need to be seen, recognized, and valued in one\'s uniqueness',
    styleDePhrases: 'Sentences with conviction and warmth. Vocabulary of greatness and singularity.',
    intensiteVocabulaire: 3,
    toneHint: 'Ton chaleureux et affirmé. Souligner la singularité. Éviter la banalisation.',
    toneHintEn: 'Warm, affirmed tone. Highlight uniqueness and strength. Avoid minimizing.',
  },

  // ── Vierge / Virgo ──────────────────────────────────────────────────────────
  'vierge': {
    tonalite: 'Précis, analytique, nuancé',
    directivite: 'medium',
    textureEmotionnelle: 'Émotions traitées par l\'analyse — besoin de précision, d\'utilité et de comprendre le pourquoi',
    styleDePhrases: 'Phrases structurées, précises. Vocabulaire factuel et nuancé. Éviter le vague.',
    intensiteVocabulaire: 2,
    toneHint: 'Ton précis et factuel. Être concret et nuancé. Structurer clairement. Éviter le vague ou le lyrique excessif.',
    toneHintEn: 'Precise, factual tone. Be concrete and nuanced. Structure clearly. Avoid vagueness or excessive lyricism.',
  },
  'virgo': {
    tonalite: 'Precise, analytical, nuanced',
    directivite: 'medium',
    textureEmotionnelle: 'Emotions processed through analysis — need for precision, utility, and understanding the why',
    styleDePhrases: 'Structured, precise sentences. Factual, nuanced vocabulary.',
    intensiteVocabulaire: 2,
    toneHint: 'Ton précis et factuel. Être concret et nuancé. Éviter le vague.',
    toneHintEn: 'Precise, factual tone. Be concrete and nuanced. Avoid vagueness.',
  },

  // ── Balance / Libra ─────────────────────────────────────────────────────────
  'balance': {
    tonalite: 'Harmonieux, équilibré, pondéré',
    directivite: 'low',
    textureEmotionnelle: 'Émotions liées aux relations — besoin de justice, d\'harmonie et de voir les deux côtés',
    styleDePhrases: 'Phrases pondérées, équilibrées. Tenir compte des deux perspectives. Ton doux mais clair.',
    intensiteVocabulaire: 1,
    toneHint: 'Ton équilibré et doux. Présenter les deux côtés. Vocabulaire de nuance et de relationnel. Éviter les absolus.',
    toneHintEn: 'Balanced, gentle tone. Present both sides. Nuanced relational vocabulary. Avoid absolutes.',
  },
  'libra': {
    tonalite: 'Harmonious, balanced, measured',
    directivite: 'low',
    textureEmotionnelle: 'Relational emotions — need for fairness, harmony, and seeing both sides',
    styleDePhrases: 'Balanced, measured sentences. Consider both perspectives.',
    intensiteVocabulaire: 1,
    toneHint: 'Ton équilibré et doux. Présenter les deux côtés. Éviter les absolus.',
    toneHintEn: 'Balanced, gentle tone. Present both sides. Avoid absolutes.',
  },

  // ── Scorpion / Scorpio ───────────────────────────────────────────────────────
  'scorpion': {
    tonalite: 'Intense, pénétrant, transformatif',
    directivite: 'high',
    textureEmotionnelle: 'Émotions profondes et puissantes — besoin de vérité, de profondeur et de transformation réelle',
    styleDePhrases: 'Phrases directes et denses. Aller en profondeur. Vocabulaire de transformation et de vérité.',
    intensiteVocabulaire: 3,
    toneHint: 'Ton direct et profond. Ne pas rester en surface. Vocabulaire de transformation. Nommer ce qui est vrai, même si inconfortable.',
    toneHintEn: 'Direct, deep tone. Don\'t stay on the surface. Transformation vocabulary. Name what is true, even if uncomfortable.',
  },
  'scorpio': {
    tonalite: 'Intense, penetrating, transformative',
    directivite: 'high',
    textureEmotionnelle: 'Deep, powerful emotions — need for truth, depth, and real transformation',
    styleDePhrases: 'Direct, dense sentences. Going deep. Vocabulary of transformation and truth.',
    intensiteVocabulaire: 3,
    toneHint: 'Ton direct et profond. Ne pas rester en surface. Nommer ce qui est vrai.',
    toneHintEn: 'Direct, deep tone. Don\'t stay on the surface. Name what is true.',
  },

  // ── Sagittaire / Sagittarius ─────────────────────────────────────────────────
  'sagittaire': {
    tonalite: 'Large, visionnaire, libre',
    directivite: 'medium',
    textureEmotionnelle: 'Émotions liées au sens et à la liberté — besoin d\'horizon, de vision et de mouvement',
    styleDePhrases: 'Phrases ouvertes, d\'horizon. Vocabulaire d\'exploration et de vision. Donner du sens.',
    intensiteVocabulaire: 2,
    toneHint: 'Ton ouvert et visionnaire. Relier à un sens plus large. Vocabulaire d\'exploration. Éviter l\'enfermement dans les détails.',
    toneHintEn: 'Open, visionary tone. Connect to a larger meaning. Exploration vocabulary. Avoid getting stuck in details.',
  },
  'sagittarius': {
    tonalite: 'Expansive, visionary, free',
    directivite: 'medium',
    textureEmotionnelle: 'Emotions tied to meaning and freedom — need for horizon, vision, and movement',
    styleDePhrases: 'Open, horizon-oriented sentences. Exploration vocabulary.',
    intensiteVocabulaire: 2,
    toneHint: 'Ton ouvert et visionnaire. Relier à un sens plus large. Éviter l\'enfermement dans les détails.',
    toneHintEn: 'Open, visionary tone. Connect to a larger meaning. Avoid getting stuck in details.',
  },

  // ── Capricorne / Capricorn ───────────────────────────────────────────────────
  'capricorne': {
    tonalite: 'Solide, structuré, sobre',
    directivite: 'high',
    textureEmotionnelle: 'Émotions gérées avec discipline — besoin de maîtrise, de résultats concrets et de durabilité',
    styleDePhrases: 'Phrases concises, structurées. Vocabulaire de maîtrise et de construction. Aller aux faits.',
    intensiteVocabulaire: 2,
    toneHint: 'Ton sobre et concret. Aller aux faits. Vocabulaire de structure et de maîtrise. Éviter le lyrique ou le vague.',
    toneHintEn: 'Sober, concrete tone. Go to the facts. Structure and mastery vocabulary. Avoid lyricism or vagueness.',
  },
  'capricorn': {
    tonalite: 'Solid, structured, sober',
    directivite: 'high',
    textureEmotionnelle: 'Emotions managed with discipline — need for mastery, concrete results, and durability',
    styleDePhrases: 'Concise, structured sentences. Mastery and construction vocabulary.',
    intensiteVocabulaire: 2,
    toneHint: 'Ton sobre et concret. Aller aux faits. Éviter le lyrique ou le vague.',
    toneHintEn: 'Sober, concrete tone. Go to the facts. Avoid lyricism or vagueness.',
  },

  // ── Verseau / Aquarius ───────────────────────────────────────────────────────
  'verseau': {
    tonalite: 'Original, distancié, universel',
    directivite: 'medium',
    textureEmotionnelle: 'Détachement naturel — besoin de recul, d\'objectivité et de voir le tableau global',
    styleDePhrases: 'Phrases analytiques, avec recul. Vocabulaire d\'observation et de système. Ton légèrement détaché.',
    intensiteVocabulaire: 2,
    toneHint: 'Ton analytique et distancié. Valoriser la singularité. Vocabulaire d\'observation. Éviter l\'émotionnel excessif.',
    toneHintEn: 'Analytical, detached tone. Value uniqueness. Observation vocabulary. Avoid excessive emotional language.',
  },
  'aquarius': {
    tonalite: 'Original, detached, universal',
    directivite: 'medium',
    textureEmotionnelle: 'Natural detachment — need for perspective, objectivity, and seeing the big picture',
    styleDePhrases: 'Analytical sentences with perspective. Observation and systems vocabulary.',
    intensiteVocabulaire: 2,
    toneHint: 'Ton analytique et distancié. Valoriser la singularité. Éviter l\'émotionnel excessif.',
    toneHintEn: 'Analytical, detached tone. Value uniqueness. Avoid excessive emotional language.',
  },

  // ── Poissons / Pisces ────────────────────────────────────────────────────────
  'poissons': {
    tonalite: 'Fluide, empathique, résonant',
    directivite: 'low',
    textureEmotionnelle: 'Absorption émotionnelle profonde — besoin de douceur, de poésie et d\'un espace de résonance',
    styleDePhrases: 'Phrases douces et fluides. Vocabulaire de résonance et d\'intuition. Créer un espace contemplatif.',
    intensiteVocabulaire: 1,
    toneHint: 'Ton doux et fluide. Vocabulaire de résonance. Laisser de l\'espace. Éviter la rigidité ou la sécheresse.',
    toneHintEn: 'Soft, fluid tone. Resonance vocabulary. Leave space. Avoid rigidity or dryness.',
  },
  'pisces': {
    tonalite: 'Fluid, empathic, resonant',
    directivite: 'low',
    textureEmotionnelle: 'Deep emotional absorption — need for softness, poetry, and resonance space',
    styleDePhrases: 'Soft, fluid sentences. Resonance and intuition vocabulary.',
    intensiteVocabulaire: 1,
    toneHint: 'Ton doux et fluide. Vocabulaire de résonance. Éviter la rigidité.',
    toneHintEn: 'Soft, fluid tone. Resonance vocabulary. Avoid rigidity.',
  },
}

// ── Normalisation ──────────────────────────────────────────────────────────────

function normalizeSunSign(sign: string): string {
  return sign
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    // Map known variants
    .replace(/^belie[re]r?$/, 'bélier')
    .replace(/^gemeaux?$/, 'gémeaux')
    .replace(/^sagittaire$/, 'sagittaire')
    .replace(/^capricorne$/, 'capricorne')
    .replace(/^verseau$/, 'verseau')
    .replace(/^poisson[s]?$/, 'poissons')
}

// ── API publique ───────────────────────────────────────────────────────────────

/**
 * Retourne le profil de ton solaire pour un signe donné.
 *
 * @param sunSign  Signe solaire ("Scorpion", "Scorpio", "scorpion"...)
 * @param isFr     true pour le français (affect toneHint returned)
 * @returns        SolarToneProfile ou null si signe non reconnu
 */
export function getSolarToneProfile(
  sunSign: string | null | undefined,
  isFr: boolean,
): SolarToneProfile | null {
  if (!sunSign) return null

  // Try direct lookup first (case-insensitive)
  const lower = sunSign.toLowerCase().trim()
  const direct = SOLAR_TONE_MAP[lower]
  if (direct) return direct

  // Try normalized lookup
  const normalized = normalizeSunSign(sunSign)
  return SOLAR_TONE_MAP[normalized] ?? null
}

/**
 * Retourne uniquement le toneHint pour un signe donné.
 * Pratique pour les usages rapides dans les templates.
 */
export function getSolarToneHint(
  sunSign: string | null | undefined,
  isFr: boolean,
): string | null {
  const profile = getSolarToneProfile(sunSign, isFr)
  if (!profile) return null
  return isFr ? profile.toneHint : profile.toneHintEn
}
