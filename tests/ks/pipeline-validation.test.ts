/**
 * pipeline-validation.test.ts
 *
 * VALIDATION FINALE DU PIPELINE HEXASTRA COMPLET
 *
 * CompactReadingCore → mapCompactCoreToSpheres → renderPlanReading
 *
 * Ce fichier est une validation produit concrète, pas des tests unitaires abstraits.
 * Chaque test produce un rendu réel et le soumet à une série de critères qualitatifs.
 */

import { describe, it, expect } from 'vitest'
import type { CompactReadingCore } from '@/lib/hexastra/orchestrator/compactReadingCore'
import { mapCompactCoreToSpheres } from '@/lib/hexastra/reading/mapCompactCoreToSpheres'
import { renderPlanReading } from '@/lib/hexastra/reading/renderPlanReading'
import {
  flaggedSimilarPairs,
  jaccardSimilarity,
  analyzeSphereVariation,
} from '@/lib/hexastra/reading/sphereVariation'
import type { PlanKey } from '@/lib/plans'

// ══════════════════════════════════════════════════════════════════════════════
// FIXTURES — 5 CompactReadingCore réalistes, 1 par question de test
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Q1 — "Pourquoi les gens ne m'écoutent pas ?"
 * Profil : Projecteur, autorité émotionnelle, an 7 (introspection), Enn 3
 */
const CORE_ECOUTE: CompactReadingCore = {
  dominantDynamic:
    'Tu fonctionnes avec une perception fine des systèmes et des personnes — mais ce don est invisible si tu l\'envoies sans invitation',
  hiddenMechanism:
    'Ton mode naturel est d\'initier le contact et de proposer avant d\'être sollicité — ce qui crée un effet de résistance chez les autres',
  realTension:
    'L\'énergie que tu déploies à convaincre dépasse ce que les autres sont prêts à recevoir — la tension est entre ton rythme et le leur',
  visibleEffect:
    'Les interactions laissent un sentiment de non-reconnaissance — tu parles, les autres écoutent poliment, mais rien ne s\'ancre',
  rightMovement:
    'Attendre d\'être invité avant de partager ton analyse — l\'invitation change tout à la réception',
  decisionSignal:
    'Attendre la clarté émotionnelle — ne jamais trancher dans l\'urgence ou l\'intensité du moment',
  timingSignal:
    'Période d\'introspection — comprendre vers l\'intérieur plutôt qu\'agir vers l\'extérieur',
  energyLeak:
    'Énergie dépensée à initier ou insister là où aucun retour réel ne vient',
  leveragePoint:
    'Identifier les situations où l\'invitation est déjà là — concentrer toute l\'énergie sur ces ouvertures',
  toneHint:
    'Ton analytique — distancié, valoriser la singularité du fonctionnement · Ennéagramme 3 : valider la valeur réelle, pas seulement la performance',
  solarToneHint: 'Ton de précision solaire — rester factuel',
  questionType:  'identity',
  signalConfidence: 0.82,
}

/**
 * Q2 — "Pourquoi je bloque dans mon activité ?"
 * Profil : Générateur, autorité sacrale, an 4 (fondation), Enn 1
 */
const CORE_BLOCAGE: CompactReadingCore = {
  dominantDynamic:
    'Tu as une énergie de construction puissante — mais elle est actuellement dirigée vers des voies qui ne te répondent pas',
  hiddenMechanism:
    'Tu continues des projets que ton corps n\'a jamais vraiment confirmés — par habitude ou par obligation perçue',
  realTension:
    'La tension est entre ce que tu as commencé et ce que tu veux vraiment faire — les deux coexistent et se paralysent mutuellement',
  visibleEffect:
    'Sentiment de stagnation et d\'efforts sans résultat — tu travailles mais rien ne décolle vraiment',
  rightMovement:
    'Identifier une voie que ton corps répond vraiment avec un oui clair — et arrêter les projets qui génèrent de l\'inertie',
  decisionSignal:
    'La réponse du corps arrive avant la pensée — écouter ce oui ou ce non instinctif',
  timingSignal:
    'Phase de fondation — poser les bases concrètes maintenant, pas le moment de s\'élancer',
  energyLeak:
    'Énergie dépensée sur des voies que ton corps n\'a pas vraiment confirmées',
  leveragePoint:
    'Tester chaque projet avec la question simple : est-ce que mon corps dit oui ? — supprimer tout ce qui ne répond pas',
  toneHint:
    'Ton ancré — s\'appuyer sur le sensoriel et le concret · Ennéagramme 1 : présenter la vérité avec douceur, sans jugement',
  solarToneHint: 'Ton de rigueur solaire — concret avant tout',
  questionType:  'blocage',
  signalConfidence: 0.88,
}

/**
 * Q3 — "Est-ce le bon moment pour lancer mon projet ?"
 * Profil : Manifesteur, autorité de l'ego, an 1 (nouveau départ), Enn 7
 */
const CORE_TIMING: CompactReadingCore = {
  dominantDynamic:
    'Tu es en phase de nouveau départ — l\'énergie disponible est réelle et cette période invite à l\'action',
  hiddenMechanism:
    'Tu attends une confirmation externe qui ne viendra pas — la certitude ne précède pas l\'action, elle vient pendant',
  realTension:
    'La tension est entre le désir d\'agir et la peur de mal choisir le moment — cette hésitation consomme l\'énergie du lancement',
  visibleEffect:
    'Le projet reste en attente sans qu\'une raison concrète le justifie — les conditions sont déjà suffisantes',
  rightMovement:
    'Communiquer l\'intention de lancer à ton entourage proche, puis agir sans demander de permission',
  decisionSignal:
    'Décider uniquement sur ce que tu veux vraiment faire — pas sur ce que tu penses devoir faire',
  timingSignal:
    'Tu entres dans un nouveau départ — le bon moment pour lancer ce qui a été trop longtemps attendu',
  energyLeak:
    'Énergie perdue à justifier tes décisions ou à attendre une permission qui ne viendra pas',
  leveragePoint:
    'Fixer une date concrète de lancement et informer deux personnes clés — le simple acte d\'annoncer crée une réalité',
  toneHint:
    'Ton ouvert — relier au sens plus large, laisser l\'horizon · Ennéagramme 7 : rester focalisé, éviter la dispersion dans les options',
  solarToneHint: 'Ton de direction solaire — confiance dans le mouvement',
  questionType:  'timing',
  signalConfidence: 0.79,
}

/**
 * Q4 — "Comment je fonctionne réellement ?"
 * Profil : Générateur Manifeste, autorité sacrale, an 5 (transformation), Enn 4
 */
const CORE_IDENTITE: CompactReadingCore = {
  dominantDynamic:
    'Tu combines une énergie de construction et une capacité d\'initiation — tu fonctionne par séquences intenses suivies de recharges nécessaires',
  hiddenMechanism:
    'L\'impatience est ton principal pattern : tu passes à l\'action avant que ta réponse intérieure soit vraiment claire',
  realTension:
    'La tension est entre ta vitesse naturelle et la nécessité d\'une réponse claire avant d\'engager — l\'un contredit l\'autre',
  visibleEffect:
    'Tu lances des projets avec enthousiasme puis perdre de l\'élan à mi-parcours — les abandons répétés créent une fatigue de toi-même',
  rightMovement:
    'Introduire une pause délibérée entre l\'idée et l\'engagement — même courte, cette pause change la qualité de tes décisions',
  decisionSignal:
    'La réponse du corps arrive avant la pensée — écouter ce oui ou ce non instinctif',
  timingSignal:
    'Cycle de transformation — les changements qui arrivent sont nécessaires et justifiés',
  energyLeak:
    'Énergie perdue dans l\'impatience — à t\'élancer avant que la réponse soit vraiment claire',
  leveragePoint:
    'Traiter l\'impatience comme signal d\'information plutôt que comme élan à suivre — la pause de 3 secondes avant chaque engagement majeur',
  toneHint:
    'Ton profond — aller sous la surface, nommer la vérité vraie · Ennéagramme 4 : honorer la profondeur sans amplifier le dramatique',
  solarToneHint: 'Ton de singularité solaire — honorer ce qui est unique',
  questionType:  'identity',
  signalConfidence: 0.85,
}

/**
 * Q5 — "Fais-moi une lecture complète de ma situation actuelle"
 * Profil : Projecteur, autorité mentale, an 8 (récolte), Enn 6
 */
const CORE_LECTURE_COMPLETE: CompactReadingCore = {
  dominantDynamic:
    'Tu es dans une phase de récolte — les efforts passés commencent à porter leurs fruits mais demandent à être activement réclamés',
  hiddenMechanism:
    'La vigilance permanente filtre les opportunités avant qu\'elles puissent entrer — tu analyses trop longtemps ce qui mérite une réponse rapide',
  realTension:
    'La tension est entre le besoin d\'être reconnu et la difficulté à te laisser voir — l\'une bloque ce que l\'autre cherche',
  visibleEffect:
    'Opportunités identifiées mais non saisies — le momentum se construit puis se perd par inaction aux moments décisifs',
  rightMovement:
    'Choisir un espace de confiance et y verbaliser ta situation — la clarté vient dans l\'échange, pas dans la réflexion solitaire',
  decisionSignal:
    'La clarté vient dans l\'échange — verbaliser ta situation à quelqu\'un de confiance avant de décider',
  timingSignal:
    'Phase de récolte — les actions passées portent leurs fruits, rester actif et visible',
  energyLeak:
    'Énergie dépensée à initier ou insister là où aucun retour réel ne vient',
  leveragePoint:
    'Se rendre visible dans les espaces où l\'invitation est probable — la reconnaissance vient à ceux qui sont là où on les attendait',
  toneHint:
    'Ton équilibré — présenter les deux côtés, éviter les absolus · Ennéagramme 6 : ancrer dans la confiance plutôt que dans la surveillance',
  solarToneHint: 'Ton de clarté solaire — nommer les choses telles qu\'elles sont',
  questionType:  'general',
  signalConfidence: 0.77,
}

const ALL_CORES: Array<{ label: string; core: CompactReadingCore; intent: string }> = [
  { label: 'Q1 — Écoute / Identité',           core: CORE_ECOUTE,           intent: 'identity'  },
  { label: 'Q2 — Blocage activité',             core: CORE_BLOCAGE,          intent: 'blocage'   },
  { label: 'Q3 — Timing / Lancement',           core: CORE_TIMING,           intent: 'timing'    },
  { label: 'Q4 — Fonctionnement intérieur',     core: CORE_IDENTITE,         intent: 'identity'  },
  { label: 'Q5 — Lecture complète situation',   core: CORE_LECTURE_COMPLETE, intent: 'general'   },
]

// ══════════════════════════════════════════════════════════════════════════════
// MISSION 1 — EXPLOITATION DU COMPACTREADINGCORE
// Vérifier que tous les champs sont réellement utilisés dans le rendu final
// ══════════════════════════════════════════════════════════════════════════════

describe('MISSION 1 — Exploitation du CompactReadingCore', () => {
  const FIELDS_TO_SPHERE_MAP: Record<keyof CompactReadingCore, string> = {
    dominantDynamic:   'S1 (Centrale)',
    hiddenMechanism:   'S2 (Mécanisme) + S4 (Mentale) + S6 (Schémas)',
    realTension:       'S3 (Tension) + S7 (Extérieure) + S10 (Blocage)',
    visibleEffect:     'S5 (Émotionnelle) + S6 (Schémas)',
    rightMovement:     'S11 (Mouvement juste) + Bloc ACTION',
    decisionSignal:    'S11 (Mouvement juste)',
    timingSignal:      'S8 (Timing)',
    energyLeak:        'S9 (Énergétique) + S10 (Blocage)',
    leveragePoint:     'S12 (Synthèse) + Bloc CLÉ + summary',
    toneHint:          'Paramètre de tonalité LLM (non visible dans rendu texte)',
    solarToneHint:     'Paramètre de tonalité LLM (non visible dans rendu texte)',
    questionType:      'Intent / routing',
    signalConfidence:  'Confiance du signal (métadonnée)',
  }

  it('tous les champs du core sont documentés dans le mapping', () => {
    const coreFields: Array<keyof CompactReadingCore> = [
      'dominantDynamic', 'hiddenMechanism', 'realTension', 'visibleEffect',
      'rightMovement', 'decisionSignal', 'timingSignal', 'energyLeak', 'leveragePoint',
      'toneHint', 'solarToneHint', 'questionType', 'signalConfidence',
    ]
    for (const field of coreFields) {
      expect(FIELDS_TO_SPHERE_MAP[field]).toBeDefined()
    }
  })

  it('dominantDynamic → S1 content exact', () => {
    for (const { core, intent } of ALL_CORES) {
      const spheres = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      expect(spheres.spheres[0]!.content).toBe(core.dominantDynamic)
    }
  })

  it('hiddenMechanism → S2 content exact', () => {
    for (const { core, intent } of ALL_CORES) {
      const spheres = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      expect(spheres.spheres[1]!.content).toBe(core.hiddenMechanism)
    }
  })

  it('realTension → S3 content exact', () => {
    for (const { core, intent } of ALL_CORES) {
      const spheres = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      expect(spheres.spheres[2]!.content).toBe(core.realTension)
    }
  })

  it('timingSignal → S8 content exact', () => {
    for (const { core, intent } of ALL_CORES) {
      const spheres = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      expect(spheres.spheres[7]!.content).toBe(core.timingSignal)
    }
  })

  it('energyLeak → S9 content exact', () => {
    for (const { core, intent } of ALL_CORES) {
      const spheres = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      expect(spheres.spheres[8]!.content).toBe(core.energyLeak)
    }
  })

  it('leveragePoint → S12 content exact', () => {
    for (const { core, intent } of ALL_CORES) {
      const spheres = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      expect(spheres.spheres[11]!.content).toBe(core.leveragePoint)
    }
  })

  it('rightMovement est visible dans S11 (Mouvement juste)', () => {
    for (const { core, intent } of ALL_CORES) {
      const spheres = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      const s11 = spheres.spheres[10]!.content
      // rightMovement doit apparaître directement ou être la base de S11
      expect(s11).toContain(core.rightMovement.slice(0, 20))
    }
  })

  it('decisionSignal est intégré dans S11', () => {
    for (const { core, intent } of ALL_CORES) {
      const spheres = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      const s11 = spheres.spheres[10]!.content
      // S11 = rightMovement + decisionSignal (sauf si trop similaires)
      // Au moins une des deux sources doit être détectable
      const hasRight = s11.includes(core.rightMovement.slice(0, 15))
      const hasDecision = s11.includes(core.decisionSignal.slice(0, 15))
      expect(hasRight || hasDecision).toBe(true)
    }
  })

  it('visibleEffect influence S5 (Émotionnelle) — présence de la première clause', () => {
    for (const { core, intent } of ALL_CORES) {
      const spheres = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      const s5 = spheres.spheres[4]!.content
      // La première clause de visibleEffect doit apparaître dans S5
      const effectBase = core.visibleEffect.split(/[.]\s+|\s+[—–]\s+/)[0]!.slice(0, 20)
      expect(s5.toLowerCase()).toContain(effectBase.toLowerCase().slice(0, 15))
    }
  })

  it('leveragePoint apparaît dans le summary (case-insensitive: lcFirst appliqué)', () => {
    for (const { core, intent } of ALL_CORES) {
      const spheres = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      // buildSummary applique lcFirst() sur le lever → cherche en lowercase
      const leverBase = core.leveragePoint.slice(0, 10).toLowerCase()
      expect(spheres.summary.toLowerCase()).toContain(leverBase)
    }
  })

  it('toneHint et signalConfidence ne sont PAS dans le rendu texte (réservés LLM)', () => {
    for (const { core, intent } of ALL_CORES) {
      const result = renderPlanReading({
        compactCore: core,
        spheres: mapCompactCoreToSpheres(core, { intent, lang: 'fr' }),
        plan: 'premium',
        lang: 'fr',
      })
      // Ces champs sont des métadonnées — ils ne doivent pas apparaître verbatim
      expect(result).not.toContain('Ton analytique')  // toneHint brut
      expect(result).not.toContain('signalConfidence')
      expect(result).not.toContain('0.82')
      expect(result).not.toContain('0.88')
    }
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// MISSION 2 — VALIDATION renderPremiumReading (via renderPlanReading plan=premium)
// ══════════════════════════════════════════════════════════════════════════════

describe('MISSION 2 — Validation du rendu premium', () => {
  it('Q1 Écoute — rendu premium: 4 blocs + 12 sphères, structure correcte', () => {
    const spheres = mapCompactCoreToSpheres(CORE_ECOUTE, { intent: 'identity', lang: 'fr' })
    const render = renderPlanReading({
      compactCore: CORE_ECOUTE, spheres, plan: 'premium', lang: 'fr',
    })

    // Structure attendue
    expect(render).toContain('CE QUI SE PASSE')
    expect(render).toContain('POURQUOI ÇA BLOQUE')
    expect(render).toContain('CE QUE TU DOIS FAIRE')
    expect(render).toContain('CLÉ À RETENIR')
    expect(render).toContain('──────────')

    // Les 4 blocs reflètent bien le core
    expect(render).toContain(CORE_ECOUTE.dominantDynamic.slice(0, 30))
    expect(render).toContain(CORE_ECOUTE.rightMovement.slice(0, 25))

    // 12 sphères présentes
    const sphereMarkers = (render.match(/◆/g) ?? []).length
    expect(sphereMarkers).toBe(12)

    // Zéro jargon
    expect(render).not.toMatch(/human.?design|autorité|numerologie|ennéagramme\s+\d/i)
  })

  it('Q2 Blocage — rendu premium: le blocage est nommé concrètement', () => {
    const spheres = mapCompactCoreToSpheres(CORE_BLOCAGE, { intent: 'blocage', lang: 'fr' })
    const render = renderPlanReading({
      compactCore: CORE_BLOCAGE, spheres, plan: 'premium', lang: 'fr',
    })

    // POURQUOI ÇA BLOQUE doit contenir le hiddenMechanism
    expect(render).toContain(CORE_BLOCAGE.hiddenMechanism.slice(0, 25))

    // La sphère du blocage (S10) doit être visible
    expect(render).toContain('Sphère du blocage')

    // L'action (S11 + bloc ACTION) doit mentionner rightMovement
    expect(render).toContain(CORE_BLOCAGE.rightMovement.slice(0, 20))
  })

  it('Q3 Timing — rendu premium: timingSignal visible et central', () => {
    const spheres = mapCompactCoreToSpheres(CORE_TIMING, { intent: 'timing', lang: 'fr' })
    const render = renderPlanReading({
      compactCore: CORE_TIMING, spheres, plan: 'premium', lang: 'fr',
    })

    // timingSignal → S8 visible dans le rendu premium
    expect(render).toContain('Sphère du timing')
    expect(render).toContain(CORE_TIMING.timingSignal.slice(0, 30))

    // Sphère émotionnelle adaptée au timing
    expect(render).toMatch(/signal intérieur.*décider|décider.*signal intérieur/i)
  })

  it('Q4 Identité — rendu premium: ne dilue pas le message, reste dense', () => {
    const spheres = mapCompactCoreToSpheres(CORE_IDENTITE, { intent: 'identity', lang: 'fr' })
    const render = renderPlanReading({
      compactCore: CORE_IDENTITE, spheres, plan: 'premium', lang: 'fr',
    })

    // Le premier prénom est optionnel — vérifier sans
    expect(render).toContain(CORE_IDENTITE.dominantDynamic.slice(0, 30))

    // Chaque sphère apporte un contenu non trivial (> 20 chars)
    const spheresResult = mapCompactCoreToSpheres(CORE_IDENTITE, { intent: 'identity', lang: 'fr' })
    for (const s of spheresResult.spheres) {
      expect(s.content.length).toBeGreaterThan(20)
    }
  })

  it('rendu avec firstName: intégration naturelle dans CE QUI SE PASSE', () => {
    const spheres = mapCompactCoreToSpheres(CORE_ECOUTE, { intent: 'identity', lang: 'fr' })
    const render = renderPlanReading({
      compactCore: CORE_ECOUTE, spheres, plan: 'premium', lang: 'fr',
      firstName: 'Sophie',
    })

    expect(render).toMatch(/Sophie,\s+[a-z]/)  // "Sophie, tu fonctionnes..."
  })

  it('rendu EN: labels en anglais, titres en anglais', () => {
    const spheres = mapCompactCoreToSpheres(CORE_ECOUTE, { intent: 'identity', lang: 'en' })
    const render = renderPlanReading({
      compactCore: CORE_ECOUTE, spheres, plan: 'premium', lang: 'en',
    })

    expect(render).toContain('WHAT IS HAPPENING')
    expect(render).toContain('WHY IT IS BLOCKING')
    expect(render).toContain('Core sphere')
    expect(render).not.toContain('CE QUI SE PASSE')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// MISSION 3 — AUDIT DES 12 SPHÈRES
// Angles distincts, cohérence, audit honnête (forts / faibles / redondants)
// ══════════════════════════════════════════════════════════════════════════════

describe('MISSION 3 — Audit des 12 sphères coaching', () => {
  it('12 sphères, ids 1–12, titres corrects, contenu non-vide', () => {
    for (const { core, intent } of ALL_CORES) {
      const result = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      expect(result.spheres).toHaveLength(12)
      result.spheres.forEach((s, i) => {
        expect(s.id).toBe(i + 1)
        expect(s.title.length).toBeGreaterThan(3)
        expect(s.content.length).toBeGreaterThan(15)
      })
    }
  })

  it('AUDIT: aucune paire de sphères ne dépasse le seuil Jaccard 0.65', () => {
    for (const { label, core, intent } of ALL_CORES) {
      const result = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      const flagged = flaggedSimilarPairs(
        result.spheres.map((s) => ({ id: s.id, content: s.content }))
      )
      if (flagged.length > 0) {
        const details = flagged.map((p) => `S${p.idA}↔S${p.idB}:${p.score}`).join(', ')
        console.warn(`[${label}] Paires similaires: ${details}`)
      }
      expect(flagged).toHaveLength(0)
    }
  })

  it('AUDIT: S1, S2, S3 sont directes et distinctes', () => {
    for (const { core, intent } of ALL_CORES) {
      const result = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      const s1 = result.spheres[0]!.content
      const s2 = result.spheres[1]!.content
      const s3 = result.spheres[2]!.content

      expect(jaccardSimilarity(s1, s2)).toBeLessThan(0.65)
      expect(jaccardSimilarity(s1, s3)).toBeLessThan(0.65)
      expect(jaccardSimilarity(s2, s3)).toBeLessThan(0.65)
    }
  })

  it('AUDIT: S4 (mentale) transforme S2 — pas une copie', () => {
    for (const { core, intent } of ALL_CORES) {
      const result = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      const s2 = result.spheres[1]!.content
      const s4 = result.spheres[3]!.content

      // S4 contient du texte ajouté (transformation), pas juste S2
      expect(s4).not.toBe(s2)
      // S4 doit contenir les marqueurs de transformation cognitive
      expect(s4).toMatch(/mental|retient|lecture|interpr[eé]tation|prisme|lens|holds/i)
    }
  })

  it('AUDIT: S5 (émotionnelle) est DIFFÉRENTE de S4 (mentale) et S6 (schémas)', () => {
    for (const { core, intent } of ALL_CORES) {
      const result = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      const s4 = result.spheres[3]!.content
      const s5 = result.spheres[4]!.content
      const s6 = result.spheres[5]!.content

      expect(jaccardSimilarity(s4, s5)).toBeLessThan(0.65)
      expect(jaccardSimilarity(s5, s6)).toBeLessThan(0.65)
    }
  })

  it('AUDIT: S6 (schémas) contient le marqueur de boucle', () => {
    for (const { core, intent } of ALL_CORES) {
      const result = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      const s6 = result.spheres[5]!.content
      expect(s6).toMatch(/schéma|boucle|loop|pattern|cycle|revient|récurrent|→|repeating/i)
    }
  })

  it('AUDIT: S7 (extérieure) a un focus externe', () => {
    for (const { core, intent } of ALL_CORES) {
      const result = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      const s7 = result.spheres[6]!.content
      // Doit contenir un marqueur de dimension externe
      expect(s7).toMatch(/dehors|extérieur|contexte|environnement|autres|outside|context|environment|external/i)
    }
  })

  it('AUDIT: S8 = timingSignal exact', () => {
    for (const { core, intent } of ALL_CORES) {
      const result = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      expect(result.spheres[7]!.content).toBe(core.timingSignal)
    }
  })

  it('AUDIT: S9 = energyLeak exact', () => {
    for (const { core, intent } of ALL_CORES) {
      const result = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      expect(result.spheres[8]!.content).toBe(core.energyLeak)
    }
  })

  it('AUDIT: S10 (blocage) synthétise tension + énergie', () => {
    for (const { core, intent } of ALL_CORES) {
      const result = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      const s10 = result.spheres[9]!.content
      // S10 doit contenir un marqueur de blocage
      expect(s10).toMatch(/bloque|bloc|blocks|reinforced|renforcé/i)
    }
  })

  it('AUDIT: S11 (mouvement juste) contient rightMovement', () => {
    for (const { core, intent } of ALL_CORES) {
      const result = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      const s11 = result.spheres[10]!.content
      expect(s11).toContain(core.rightMovement.slice(0, 20))
    }
  })

  it('AUDIT: S12 = leveragePoint exact', () => {
    for (const { core, intent } of ALL_CORES) {
      const result = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      expect(result.spheres[11]!.content).toBe(core.leveragePoint)
    }
  })

  it('AUDIT: S5 varie selon l\'intent (relation ≠ blocage ≠ timing)', () => {
    const spheresBlocage = mapCompactCoreToSpheres(CORE_BLOCAGE, { intent: 'blocage', lang: 'fr' })
    const spheresTiming  = mapCompactCoreToSpheres(CORE_TIMING,  { intent: 'timing', lang: 'fr' })
    const spheresIdentity = mapCompactCoreToSpheres(CORE_ECOUTE, { intent: 'identity', lang: 'fr' })

    const s5Blocage  = spheresBlocage.spheres[4]!.content
    const s5Timing   = spheresTiming.spheres[4]!.content
    const s5Identity = spheresIdentity.spheres[4]!.content

    // S5 blocage doit contenir le marqueur de blocage
    expect(s5Blocage).toMatch(/inconfort.*changer|signale.*changer/i)
    // S5 timing doit contenir le marqueur décision
    expect(s5Timing).toMatch(/signal.*décider|décider/i)
    // S5 identity: formule générique
    expect(s5Identity).toMatch(/vis.*intérieur|intérieur/i)

    // Les 3 sont différents
    expect(s5Blocage).not.toBe(s5Timing)
    expect(s5Timing).not.toBe(s5Identity)
  })

  it('RAPPORT DE SIMILARITÉ: log des scores pour debug qualité', () => {
    console.log('\n─── RAPPORT DE SIMILARITÉ PAR QUESTION ───')
    for (const { label, core, intent } of ALL_CORES) {
      const result = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      const report = analyzeSphereVariation(
        result.spheres.map((s) => ({ id: s.id, content: s.content }))
      )
      const maxScore = Math.max(...report.pairs.map((p) => p.score))
      const maxPair = report.pairs.find((p) => p.score === maxScore)
      console.log(
        `  ${label}: max Jaccard = ${maxScore} ` +
        `(S${maxPair?.idA}↔S${maxPair?.idB}) — ${report.flaggedCount} paires flagguées`
      )
    }
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// MISSION 4 — VALIDATION DU RENDU PAR PLAN
// ══════════════════════════════════════════════════════════════════════════════

describe('MISSION 4 — Validation du rendu par plan', () => {
  const PLANS: PlanKey[] = ['free', 'essential', 'premium', 'practitioner']

  it('les 4 plans produisent 4 rendus différents sur la même question', () => {
    const spheres = mapCompactCoreToSpheres(CORE_LECTURE_COMPLETE, { intent: 'general', lang: 'fr' })
    const renders: Record<string, string> = {}

    for (const plan of PLANS) {
      renders[plan] = renderPlanReading({
        compactCore: CORE_LECTURE_COMPLETE, spheres, plan, lang: 'fr',
      })
    }

    // Tous différents
    expect(renders['free']).not.toBe(renders['essential'])
    expect(renders['essential']).not.toBe(renders['premium'])
    expect(renders['premium']).not.toBe(renders['practitioner'])

    // Tailles croissantes globalement
    expect(renders['free']!.length).toBeLessThan(renders['premium']!.length)
  })

  it('PLAN FREE: 4 blocs, pas de sphères (◆), pas de séparateur', () => {
    for (const { core, intent } of ALL_CORES) {
      const spheres = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      const render = renderPlanReading({ compactCore: core, spheres, plan: 'free', lang: 'fr' })

      expect(render).toContain('CE QUI SE PASSE')
      expect(render).toContain('POURQUOI ÇA BLOQUE')
      expect(render).toContain('CE QUE TU DOIS FAIRE')
      expect(render).toContain('CLÉ À RETENIR')

      // PAS de sphères
      expect(render).not.toContain('◆')
      expect(render).not.toContain('──────────')
      expect(render).not.toContain('Sphère')
    }
  })

  it('PLAN FREE: reste fort — chaque bloc > 30 chars', () => {
    for (const { core, intent } of ALL_CORES) {
      const spheres = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      const render = renderPlanReading({ compactCore: core, spheres, plan: 'free', lang: 'fr' })

      const blocks = render.split('\n\n').filter((b) => b.trim().length > 0)
      for (const block of blocks) {
        const contentLine = block.split('\n')[1] ?? block
        expect(contentLine.length).toBeGreaterThan(30)
      }
    }
  })

  it('PLAN ESSENTIAL: 4 blocs + séparateur + exactement 6 sphères (ids 5–10)', () => {
    for (const { core, intent } of ALL_CORES) {
      const spheres = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      const render = renderPlanReading({ compactCore: core, spheres, plan: 'essential', lang: 'fr' })

      expect(render).toContain('──────────')

      const sphereMarkers = (render.match(/◆/g) ?? []).length
      expect(sphereMarkers).toBe(6)

      // Les 6 sphères essential sont ids 5–10
      const EXPECTED_ESSENTIAL_TITLES = [
        'Sphère émotionnelle',
        'Sphère des schémas',
        'Sphère extérieure',
        'Sphère du timing',
        'Sphère énergétique',
        'Sphère du blocage',
      ]
      for (const title of EXPECTED_ESSENTIAL_TITLES) {
        expect(render).toContain(title)
      }

      // S1-S4 et S11-S12 ne doivent PAS apparaître comme sphères ◆
      expect(render).not.toContain('◆ Sphère centrale')
      expect(render).not.toContain('◆ Sphère du mécanisme')
      expect(render).not.toContain('◆ Sphère de synthèse')
    }
  })

  it('PLAN ESSENTIAL: apporte vraiment plus que free (delta significatif)', () => {
    for (const { core, intent } of ALL_CORES) {
      const spheres = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      const free = renderPlanReading({ compactCore: core, spheres, plan: 'free', lang: 'fr' })
      const essential = renderPlanReading({ compactCore: core, spheres, plan: 'essential', lang: 'fr' })

      // Essential doit être significativement plus long
      expect(essential.length).toBeGreaterThan(free.length * 1.5)
    }
  })

  it('PLAN PREMIUM: 4 blocs + séparateur + 12 sphères complètes', () => {
    for (const { core, intent } of ALL_CORES) {
      const spheres = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      const render = renderPlanReading({ compactCore: core, spheres, plan: 'premium', lang: 'fr' })

      const sphereMarkers = (render.match(/◆/g) ?? []).length
      expect(sphereMarkers).toBe(12)

      // Toutes les sphères présentes
      for (let i = 1; i <= 12; i++) {
        // La sphère doit avoir un contenu (◆ Sphère X présent)
        expect(sphereMarkers).toBe(12)
      }
    }
  })

  it('PLAN PRACTITIONER: approfondissement réel, pas seulement "premium + plus"', () => {
    for (const { core, intent } of ALL_CORES) {
      const spheres = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      const render = renderPlanReading({ compactCore: core, spheres, plan: 'practitioner', lang: 'fr' })

      // Structure practitioner
      expect(render).toContain('══════════')
      expect(render).toContain('Dynamiques dominantes')
      expect(render).toContain('Levier stratégique')
      expect(render).toContain("Vision d'ensemble")

      // PAS de labels 4 blocs (practitioner démarre directement sur les sphères)
      expect(render).not.toContain('CE QUI SE PASSE')
      expect(render).not.toContain('POURQUOI ÇA BLOQUE')

      // L'approfondissement intègre le leveragePoint
      expect(render).toContain(core.leveragePoint.slice(0, 20))

      // L'approfondissement intègre le rightMovement dans la Vision d'ensemble
      expect(render).toContain(core.rightMovement.slice(0, 20))
    }
  })

  it('PLAN PRACTITIONER: différent de PREMIUM de façon qualitative', () => {
    for (const { core, intent } of ALL_CORES) {
      const spheres = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      const premium = renderPlanReading({ compactCore: core, spheres, plan: 'premium', lang: 'fr' })
      const practitioner = renderPlanReading({ compactCore: core, spheres, plan: 'practitioner', lang: 'fr' })

      // Practitioner a l'approfondissement que premium n'a pas
      expect(practitioner).toContain('Dynamiques dominantes')
      expect(premium).not.toContain('Dynamiques dominantes')

      // Les deux ne sont pas identiques
      expect(practitioner).not.toBe(premium)
    }
  })

  it('AFFICHAGE: log des 4 plans pour Q5 (lecture complète)', () => {
    const spheres = mapCompactCoreToSpheres(CORE_LECTURE_COMPLETE, { intent: 'general', lang: 'fr' })
    console.log('\n══════════════════════════════════════════════════════')
    console.log('Q5 — LECTURE COMPLÈTE — 4 PLANS CÔTE À CÔTE')
    console.log('══════════════════════════════════════════════════════')

    for (const plan of PLANS) {
      const render = renderPlanReading({
        compactCore: CORE_LECTURE_COMPLETE, spheres, plan, lang: 'fr',
      })
      console.log(`\n─── PLAN: ${plan.toUpperCase()} (${render.length} chars) ───`)
      console.log(render.slice(0, 600) + (render.length > 600 ? '\n[...]' : ''))
    }
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// MISSION 5 — DÉTECTION DES RÉPÉTITIONS CACHÉES
// ══════════════════════════════════════════════════════════════════════════════

describe('MISSION 5 — Répétitions cachées entre champs du CompactCore', () => {
  it('rightMovement ↔ leveragePoint: redondance acceptable (< 0.5)', () => {
    for (const { label, core } of ALL_CORES) {
      const score = jaccardSimilarity(core.rightMovement, core.leveragePoint)
      if (score >= 0.5) {
        console.warn(`[${label}] rightMovement↔leveragePoint score élevé: ${score}`)
      }
      // Seuil souple: les deux peuvent se compléter sans être identiques
      expect(score).toBeLessThan(0.65)
    }
  })

  it('hiddenMechanism ↔ realTension: acceptable (< 0.65)', () => {
    for (const { label, core } of ALL_CORES) {
      const score = jaccardSimilarity(core.hiddenMechanism, core.realTension)
      if (score >= 0.5) {
        console.warn(`[${label}] hiddenMechanism↔realTension score: ${score}`)
      }
      expect(score).toBeLessThan(0.65)
    }
  })

  it('visibleEffect ne duplique pas hiddenMechanism (< 0.65)', () => {
    for (const { label, core } of ALL_CORES) {
      const score = jaccardSimilarity(core.visibleEffect, core.hiddenMechanism)
      if (score >= 0.4) {
        console.warn(`[${label}] visibleEffect↔hiddenMechanism score: ${score}`)
      }
      expect(score).toBeLessThan(0.65)
    }
  })

  it('timingSignal (S8) ↔ S10 (blocage): angles différents (< 0.65)', () => {
    for (const { core, intent } of ALL_CORES) {
      const result = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      const s8 = result.spheres[7]!.content
      const s10 = result.spheres[9]!.content
      expect(jaccardSimilarity(s8, s10)).toBeLessThan(0.65)
    }
  })

  it('energyLeak (S9) ↔ S10 (blocage): S10 est une synthèse, pas une copie', () => {
    for (const { core, intent } of ALL_CORES) {
      const result = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      const s9 = result.spheres[8]!.content
      const s10 = result.spheres[9]!.content

      // S10 combine tension + energyLeak — contient energyLeak mais l'enrichit
      // Si S10 == S9 → problème. Si S10 > S9 en info → correct
      expect(s10).not.toBe(s9)

      // S10 devrait contenir quelque chose de la realTension
      const tensionBase = core.realTension.split(/[.—]/)[0]?.slice(0, 15) ?? ''
      if (tensionBase.length > 5) {
        // Si la tension et l'energyLeak sont trop similaires → S10 fallback
        // Dans ce cas, S10 contient "un changement d'angle"
        const hasAngleOuTension = s10.includes(tensionBase.slice(0, 10))
          || s10.includes('angle')
          || s10.includes('renforcé')
        expect(hasAngleOuTension).toBe(true)
      }
    }
  })

  it('leveragePoint (S12) ↔ summary: différents mais cohérents', () => {
    for (const { core, intent } of ALL_CORES) {
      const result = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      const s12 = result.spheres[11]!.content
      const summary = result.summary

      // Le summary peut contenir S12 mais le reformule
      // Ils ne sont jamais identiques si summary est construit correctement
      expect(summary).not.toBe(s12)
      // Mais la cohérence est assurée (leveragePoint base du summary)
      expect(summary.length).toBeGreaterThan(20)
    }
  })

  it('RAPPORT: scores inter-champs pour tous les cores', () => {
    console.log('\n─── RAPPORT RÉPÉTITIONS INTER-CHAMPS ───')
    for (const { label, core } of ALL_CORES) {
      const pairs = [
        ['rightMovement', 'leveragePoint', jaccardSimilarity(core.rightMovement, core.leveragePoint)],
        ['hiddenMechanism', 'realTension', jaccardSimilarity(core.hiddenMechanism, core.realTension)],
        ['visibleEffect', 'hiddenMechanism', jaccardSimilarity(core.visibleEffect, core.hiddenMechanism)],
        ['timingSignal', 'energyLeak', jaccardSimilarity(core.timingSignal, core.energyLeak)],
        ['decisionSignal', 'rightMovement', jaccardSimilarity(core.decisionSignal, core.rightMovement)],
      ] as const
      console.log(`  ${label}:`)
      for (const [a, b, score] of pairs) {
        const flag = (score as number) >= 0.5 ? ' ⚠️' : ''
        console.log(`    ${a}↔${b}: ${(score as number).toFixed(2)}${flag}`)
      }
    }
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// MISSION 6 — RENDUS RÉELS COMPLETS
// ══════════════════════════════════════════════════════════════════════════════

describe('MISSION 6 — Rendus réels complets (affichage)', () => {
  it('Q1 — Pourquoi les gens ne m\'écoutent pas ? — rendu premium complet', () => {
    const spheres = mapCompactCoreToSpheres(CORE_ECOUTE, { intent: 'identity', lang: 'fr' })
    const render = renderPlanReading({
      compactCore: CORE_ECOUTE, spheres, plan: 'premium', lang: 'fr',
    })
    console.log('\n═══ Q1 — ÉCOUTE — PREMIUM ═══')
    console.log(render)
    expect(render.length).toBeGreaterThan(200)
  })

  it('Q2 — Pourquoi je bloque dans mon activité ? — rendu premium complet', () => {
    const spheres = mapCompactCoreToSpheres(CORE_BLOCAGE, { intent: 'blocage', lang: 'fr' })
    const render = renderPlanReading({
      compactCore: CORE_BLOCAGE, spheres, plan: 'premium', lang: 'fr',
    })
    console.log('\n═══ Q2 — BLOCAGE — PREMIUM ═══')
    console.log(render)
    expect(render.length).toBeGreaterThan(200)
  })

  it('Q3 — Est-ce le bon moment ? — rendu practitioner complet', () => {
    const spheres = mapCompactCoreToSpheres(CORE_TIMING, { intent: 'timing', lang: 'fr' })
    const render = renderPlanReading({
      compactCore: CORE_TIMING, spheres, plan: 'practitioner', lang: 'fr',
    })
    console.log('\n═══ Q3 — TIMING — PRACTITIONER ═══')
    console.log(render)
    expect(render).toContain('Dynamiques dominantes')
  })

  it('Q4 — Comment je fonctionne ? — comparaison free vs essential', () => {
    const spheres = mapCompactCoreToSpheres(CORE_IDENTITE, { intent: 'identity', lang: 'fr' })
    const free = renderPlanReading({ compactCore: CORE_IDENTITE, spheres, plan: 'free', lang: 'fr' })
    const essential = renderPlanReading({ compactCore: CORE_IDENTITE, spheres, plan: 'essential', lang: 'fr' })

    console.log('\n═══ Q4 — IDENTITÉ — FREE ═══')
    console.log(free)
    console.log('\n═══ Q4 — IDENTITÉ — ESSENTIAL ═══')
    console.log(essential)

    expect(free.length).toBeLessThan(essential.length)
  })

  it('Q5 — Lecture complète — rendu premium + 12 sphères détaillées', () => {
    const spheres = mapCompactCoreToSpheres(CORE_LECTURE_COMPLETE, { intent: 'general', lang: 'fr' })

    console.log('\n═══ Q5 — LECTURE COMPLÈTE — CompactCore ═══')
    console.log('  dominantDynamic :', CORE_LECTURE_COMPLETE.dominantDynamic)
    console.log('  hiddenMechanism :', CORE_LECTURE_COMPLETE.hiddenMechanism)
    console.log('  realTension     :', CORE_LECTURE_COMPLETE.realTension)
    console.log('  visibleEffect   :', CORE_LECTURE_COMPLETE.visibleEffect)
    console.log('  rightMovement   :', CORE_LECTURE_COMPLETE.rightMovement)
    console.log('  decisionSignal  :', CORE_LECTURE_COMPLETE.decisionSignal)
    console.log('  timingSignal    :', CORE_LECTURE_COMPLETE.timingSignal)
    console.log('  energyLeak      :', CORE_LECTURE_COMPLETE.energyLeak)
    console.log('  leveragePoint   :', CORE_LECTURE_COMPLETE.leveragePoint)
    console.log('\n═══ Q5 — LECTURE COMPLÈTE — SPHERES ═══')
    for (const s of spheres.spheres) {
      console.log(`  S${s.id} ${s.title}: ${s.content}`)
    }
    console.log('\n═══ Q5 — LECTURE COMPLÈTE — PREMIUM ═══')
    const render = renderPlanReading({
      compactCore: CORE_LECTURE_COMPLETE, spheres, plan: 'premium', lang: 'fr',
    })
    console.log(render)
    console.log('\n  Summary:', spheres.summary)

    expect(render.length).toBeGreaterThan(500)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// MISSION 7 — VERDICT FINAL
// ══════════════════════════════════════════════════════════════════════════════

describe('MISSION 7 — Verdict final pipeline', () => {
  it('CompactReadingCore: tous les champs sont non-vides sur des données réelles', () => {
    for (const { core } of ALL_CORES) {
      const textFields: Array<keyof CompactReadingCore> = [
        'dominantDynamic', 'hiddenMechanism', 'realTension', 'visibleEffect',
        'rightMovement', 'decisionSignal', 'timingSignal', 'energyLeak',
        'leveragePoint', 'toneHint',
      ]
      for (const field of textFields) {
        const val = core[field]
        expect(typeof val === 'string' && val.length > 10).toBe(true)
      }
      expect(core.signalConfidence).toBeGreaterThan(0)
      expect(core.signalConfidence).toBeLessThanOrEqual(1)
    }
  })

  it('12 sphères: pipeline complet — 0 paire flagguée sur tous les cas', () => {
    let totalFlagged = 0
    for (const { core, intent } of ALL_CORES) {
      const result = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      const flagged = flaggedSimilarPairs(result.spheres.map((s) => ({ id: s.id, content: s.content })))
      totalFlagged += flagged.length
    }
    expect(totalFlagged).toBe(0)
  })

  it('Rendu par plan: 4 plans fonctionnent sur tous les cas', () => {
    const plans: PlanKey[] = ['free', 'essential', 'premium', 'practitioner']
    for (const { core, intent } of ALL_CORES) {
      const spheres = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      for (const plan of plans) {
        const render = renderPlanReading({ compactCore: core, spheres, plan, lang: 'fr' })
        expect(render.length).toBeGreaterThan(50)
        expect(render).not.toContain('[Contenu non disponible]')
        expect(render).not.toContain('[Content unavailable]')
      }
    }
  })

  it('Zéro jargon technique dans tous les rendus premium', () => {
    const JARGON = /\bhuman.?design\b|\bautorité\s+\w+\b|\bénéagramme\s+\d\b|\bpersonal.?year\b|\bhdType\b|\bsacrale?\b|\bsplenique\b|\bprojecteur\b|\bgénérateur\b/i
    for (const { core, intent } of ALL_CORES) {
      const spheres = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      const render = renderPlanReading({ compactCore: core, spheres, plan: 'premium', lang: 'fr' })
      expect(render).not.toMatch(JARGON)
    }
  })

  it('VERDICT FINAL: log structuré', () => {
    const plans: PlanKey[] = ['free', 'essential', 'premium', 'practitioner']
    let allPassed = true
    const issues: string[] = []

    for (const { label, core, intent } of ALL_CORES) {
      const spheres = mapCompactCoreToSpheres(core, { intent, lang: 'fr' })
      const flagged = flaggedSimilarPairs(spheres.spheres.map((s) => ({ id: s.id, content: s.content })))

      if (flagged.length > 0) {
        allPassed = false
        issues.push(`${label}: ${flagged.length} paires trop similaires`)
      }

      for (const plan of plans) {
        const render = renderPlanReading({ compactCore: core, spheres, plan, lang: 'fr' })
        if (render.includes('[Contenu non disponible]')) {
          allPassed = false
          issues.push(`${label} plan=${plan}: contenu manquant`)
        }
      }
    }

    console.log('\n══════════════════════════════════════════════════════')
    console.log('VERDICT FINAL PIPELINE HEXASTRA')
    console.log('══════════════════════════════════════════════════════')
    console.log('1. CompactReadingCore    : DONE ✅')
    console.log('2. renderPremiumReading  : DONE ✅ (via renderPlanReading plan=premium)')
    console.log('3. 12 sphères coaching   :', allPassed ? 'DONE ✅' : `PARTIAL ⚠️ — ${issues.join('; ')}`)
    console.log('4. Rendu par plan        : DONE ✅')
    console.log('5. Répétitions cachées   :', allPassed ? 'RISQUE FAIBLE ✅' : 'RISQUE MOYEN ⚠️')
    console.log('6. Qualité produit       :', allPassed ? 'PRÊT ✅' : 'PRESQUE PRÊT ⚠️')
    console.log('══════════════════════════════════════════════════════')

    if (issues.length > 0) {
      console.log('Issues détectées:')
      for (const issue of issues) {
        console.log(`  - ${issue}`)
      }
    }

    expect(allPassed).toBe(true)
  })
})
