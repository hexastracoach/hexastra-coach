/**
 * premium-polish — Tests des 5 améliorations premium Hexastra Coach
 *
 * Vérifie :
 * 1. Routing BLOCAGE — questions pro/bloquantes → 'blocage' (pas 'work_money')
 * 2. Routing IDENTITY — questions de fonctionnement → 'identity'
 * 3. Wording contextuel — même profil HD, 5 intents → 5 actions différentes
 * 4. Tone solaire — 3 signes différents → 3 toneHint différents
 * 5. CompactReadingCore — structure complète avec tous les champs
 */

import { describe, it, expect } from 'vitest'
import { classifyUserIntent } from '@/lib/hexastra/orchestration/intentClassifier'
import { getContextualAction, getAllContextualActions } from '@/lib/hexastra/orchestrator/contextualActionWording'
import { getSolarToneProfile, getSolarToneHint } from '@/lib/hexastra/orchestrator/solarToneProfile'
import { buildCompactReadingCore } from '@/lib/hexastra/orchestrator/compactReadingCore'
import { buildFusionContext } from '@/lib/hexastra/orchestrator/buildFusionContext'
import { arbitrateFusionSignals } from '@/lib/hexastra/orchestrator/arbitrateFusionSignals'
import { renderPremiumReading } from '@/lib/hexastra/renderer/renderPremiumReading'

// ── Mock payload ──────────────────────────────────────────────────────────────

const MOCK_RAW: Record<string, unknown> = {
  tropical: {
    sun: 'Scorpion', moon: 'Bélier', ascendant: 'Balance',
    mercury: 'Scorpion', venus: 'Vierge', mars: 'Sagittaire',
    jupiter: 'Capricorne', saturn: 'Poissons',
  },
  type_hd: 'Projecteur', profil_hd: '2/4',
  autorite_hd: 'Autorité Émotionnelle',
  strategie_hd: "Attendre l'invitation",
  hdDefinition: 'Simple',
  hdIncarnationCross: 'Croix des Relations',
  hdDefinedCenters: ['Plexus Solaire', 'Cœur', 'Tête'],
  hdOpenCenters: ['Racine', 'Sacré', 'Gorge', 'G', 'Rate', 'Ajna'],
  numerology: { chemin_de_vie: 7, annee_personnelle: 3, mois_personnel: 8, expression: 5, ame: 2 },
  enneagram: { type_enn: 4, aile_enn: 3, instinct_enn: 'SP', peur: "Ne pas avoir d'identité propre", desir: 'Être authentique', is_heuristic: false },
  kua: { nombre_kua: 6, element: 'Métal', direction_kua: 'Ouest, Nord-Ouest' },
}

// ── M1 — Routing BLOCAGE ──────────────────────────────────────────────────────

describe('M1 — Routing BLOCAGE (questions pro-bloquantes)', () => {
  it('détecte "Pourquoi je bloque dans mon activité ?" → blocage', () => {
    const intent = classifyUserIntent('Pourquoi je bloque dans mon activité ?', null, false)
    expect(intent).toBe('blocage')
  })

  it('détecte "Pourquoi je bloque dans mon travail ?" → blocage', () => {
    const intent = classifyUserIntent('Pourquoi je bloque dans mon travail ?', null, false)
    expect(intent).toBe('blocage')
  })

  it('détecte "Je bloque dans mon business depuis des mois" → blocage', () => {
    const intent = classifyUserIntent('Je bloque dans mon business depuis des mois', null, false)
    expect(intent).toBe('blocage')
  })

  it('détecte "Je me sens freiné mais je ne comprends pas pourquoi" → blocage ou inner_state', () => {
    const intent = classifyUserIntent('Je me sens freiné mais je ne comprends pas pourquoi', null, false)
    expect(['blocage', 'inner_state']).toContain(intent)
  })

  it('conserve "Comment mieux gagner ma vie ?" → pas de blocage', () => {
    const intent = classifyUserIntent('Comment mieux gagner ma vie ?', null, false)
    expect(intent).not.toBe('blocage')
  })

  it('conserve "Dois-je changer de travail ?" → decision ou work_money (pas de blocage)', () => {
    const intent = classifyUserIntent('Dois-je changer de travail ?', null, false)
    expect(intent).not.toBe('blocage')
    expect(['decision', 'work_money']).toContain(intent)
  })

  it('conserve "Comment développer mon activité ?" → pas de blocage', () => {
    const intent = classifyUserIntent('Comment développer mon activité ?', null, false)
    expect(intent).not.toBe('blocage')
  })
})

// ── M2 — Routing IDENTITY ────────────────────────────────────────────────────

describe('M2 — Routing IDENTITY (questions de fonctionnement)', () => {
  it('détecte "Comment je fonctionne réellement ?" → identity', () => {
    const intent = classifyUserIntent('Comment je fonctionne réellement ?', null, false)
    expect(intent).toBe('identity')
  })

  it('détecte "Quel est mon vrai fonctionnement ?" → identity', () => {
    const intent = classifyUserIntent('Quel est mon vrai fonctionnement ?', null, false)
    expect(intent).toBe('identity')
  })

  it('détecte "Qui je suis vraiment ?" → identity', () => {
    const intent = classifyUserIntent('Qui je suis vraiment ?', null, false)
    expect(intent).toBe('identity')
  })

  it('détecte "Comment je suis câblé ?" → identity', () => {
    const intent = classifyUserIntent('Comment je suis câblé ?', null, false)
    expect(intent).toBe('identity')
  })

  it('détecte "Ma manière naturelle de fonctionner" → identity', () => {
    const intent = classifyUserIntent('Ma manière naturelle de fonctionner', null, false)
    expect(intent).toBe('identity')
  })
})

// ── M3 — Wording contextuel par intent ───────────────────────────────────────

describe('M3 — Contextual Action Wording (Projecteur × 5 intents)', () => {
  const HD_TYPE = 'Projecteur'
  const HD_STRATEGY = "Attendre l'invitation"

  it('retourne un wording différent pour chaque intent (pas de répétition)', () => {
    const intents = ['love', 'work_money', 'blocage', 'timing', 'identity'] as const
    const actions = intents.map((intent) =>
      getContextualAction(HD_TYPE, HD_STRATEGY, intent, true)
    )

    // Tous les actions doivent être non-null
    actions.forEach((a, i) => {
      expect(a, `Action pour intent ${intents[i]} ne doit pas être null`).not.toBeNull()
    })

    // Toutes les actions doivent être différentes les unes des autres
    const uniqueActions = new Set(actions)
    expect(uniqueActions.size).toBe(intents.length)
  })

  it('Projecteur + love → wording spécifique amoureux', () => {
    const action = getContextualAction(HD_TYPE, HD_STRATEGY, 'love', true)
    expect(action).toBeTruthy()
    // Doit mentionner la notion de retour/vrai intérêt, pas "dans le travail"
    expect(action).not.toContain('travail')
    expect(action).not.toContain('expertise')
  })

  it('Projecteur + work_money → wording spécifique travail', () => {
    const action = getContextualAction(HD_TYPE, HD_STRATEGY, 'work_money', true)
    expect(action).toBeTruthy()
    expect(action).toContain('expertise')
  })

  it('Projecteur + blocage → wording spécifique blocage', () => {
    const action = getContextualAction(HD_TYPE, HD_STRATEGY, 'blocage', true)
    expect(action).toBeTruthy()
    expect(action).toContain('invitation')
  })

  it('Projecteur + identity → wording spécifique identité', () => {
    const action = getContextualAction(HD_TYPE, HD_STRATEGY, 'identity', true)
    expect(action).toBeTruthy()
    expect(action).toContain('reconnaissance')
  })

  it('getAllContextualActions retourne toutes les variantes pour Projecteur', () => {
    const all = getAllContextualActions(HD_TYPE, true)
    expect(all).not.toBeNull()
    expect(Object.keys(all!).length).toBeGreaterThanOrEqual(10)
  })

  it('fonctionne aussi pour Générateur', () => {
    const action = getContextualAction('Générateur', null, 'blocage', true)
    expect(action).toBeTruthy()
    expect(action).not.toEqual(getContextualAction(HD_TYPE, HD_STRATEGY, 'blocage', true))
  })

  it('fonctionne en anglais', () => {
    const frAction = getContextualAction(HD_TYPE, HD_STRATEGY, 'timing', true)
    const enAction = getContextualAction(HD_TYPE, HD_STRATEGY, 'timing', false)
    expect(frAction).not.toEqual(enAction)
    expect(enAction).toBeTruthy()
  })
})

// ── M5 — Tone solaire ─────────────────────────────────────────────────────────

describe('M5 — Solar Tone Profile (3 signes différents)', () => {
  it('Scorpion → profil intense, directivité high', () => {
    const profile = getSolarToneProfile('Scorpion', true)
    expect(profile).not.toBeNull()
    expect(profile!.directivite).toBe('high')
    expect(profile!.intensiteVocabulaire).toBe(3)
    expect(profile!.toneHint).toBeTruthy()
  })

  it('Cancer → profil doux, directivité low', () => {
    const profile = getSolarToneProfile('Cancer', true)
    expect(profile).not.toBeNull()
    expect(profile!.directivite).toBe('low')
    expect(profile!.intensiteVocabulaire).toBe(1)
  })

  it('Balance → profil équilibré, directivité low', () => {
    const profile = getSolarToneProfile('Balance', true)
    expect(profile).not.toBeNull()
    expect(profile!.directivite).toBe('low')
  })

  it('3 signes différents → 3 toneHint différents', () => {
    const scorpion = getSolarToneHint('Scorpion', true)
    const cancer = getSolarToneHint('Cancer', true)
    const balance = getSolarToneHint('Balance', true)

    expect(scorpion).not.toBeNull()
    expect(cancer).not.toBeNull()
    expect(balance).not.toBeNull()

    // Les 3 toneHints doivent être distincts
    expect(scorpion).not.toBe(cancer)
    expect(cancer).not.toBe(balance)
    expect(scorpion).not.toBe(balance)
  })

  it('fonctionne case-insensitive et avec accent', () => {
    const lower = getSolarToneProfile('scorpion', true)
    const upper = getSolarToneProfile('Scorpion', true)
    const english = getSolarToneProfile('scorpio', true)
    expect(lower).toEqual(upper)
    expect(english).toBeTruthy()
  })

  it('retourne null pour un signe inconnu', () => {
    const unknown = getSolarToneProfile('Pluton', true)
    expect(unknown).toBeNull()
  })

  it('toneHint EN est différent du FR', () => {
    const fr = getSolarToneHint('Scorpion', true)
    const en = getSolarToneHint('Scorpion', false)
    expect(fr).not.toBe(en)
  })

  it('Aries → profil direct, directivité high', () => {
    const profile = getSolarToneProfile('Aries', true)
    expect(profile).not.toBeNull()
    expect(profile!.directivite).toBe('high')
  })
})

// ── M4 — CompactReadingCore ───────────────────────────────────────────────────

describe('M4 — CompactReadingCore (structure complète)', () => {
  it('buildCompactReadingCore retourne tous les champs requis', () => {
    const ctx = buildFusionContext('identity', MOCK_RAW, 'fr')
    const arb = arbitrateFusionSignals(ctx, 'fr')
    const core = buildCompactReadingCore(arb, ctx, 'fr')

    expect(core.dominantDynamic).toBeTruthy()
    expect(core.hiddenMechanism).toBeTruthy()
    expect(core.realTension).toBeTruthy()
    expect(core.visibleEffect).toBeTruthy()
    expect(core.rightMovement).toBeTruthy()
    expect(core.toneHint).toBeTruthy()
    expect(core.solarToneHint).toBeTruthy()
    expect(core.questionType).toBe('identity')
    expect(core.signalConfidence).toBeGreaterThan(0)
  })

  it('solarToneHint est spécifique au signe Scorpion (profil mock)', () => {
    const ctx = buildFusionContext('love', MOCK_RAW, 'fr')
    const arb = arbitrateFusionSignals(ctx, 'fr')
    const core = buildCompactReadingCore(arb, ctx, 'fr')

    // Le mock a Soleil Scorpion — le solarToneHint doit mentionner la profondeur
    expect(core.solarToneHint.toLowerCase()).toMatch(/profond|surface|vrai/i)
  })

  it('toneHint reflète la Lune Bélier (profil mock)', () => {
    const ctx = buildFusionContext('inner_state', MOCK_RAW, 'fr')
    const arb = arbitrateFusionSignals(ctx, 'fr')
    const core = buildCompactReadingCore(arb, ctx, 'fr')

    // Le mock a Lune Bélier — le toneHint doit mentionner directness ou émotion vive
    expect(core.toneHint.toLowerCase()).toMatch(/direct|vif|émotion/i)
  })

  it('rightMovement = priorityAction (contextual, pas générique)', () => {
    const ctx = buildFusionContext('blocage', MOCK_RAW, 'fr')
    const arb = arbitrateFusionSignals(ctx, 'fr')
    const core = buildCompactReadingCore(arb, ctx, 'fr')

    // Pour Projecteur + blocage, le wording contextuel doit mentionner "invitation"
    expect(core.rightMovement).toContain('invitation')
  })

  it('hiddenMechanism ≠ dominantDynamic (deux infos différentes)', () => {
    const ctx = buildFusionContext('work_money', MOCK_RAW, 'fr')
    const arb = arbitrateFusionSignals(ctx, 'fr')
    const core = buildCompactReadingCore(arb, ctx, 'fr')

    expect(core.hiddenMechanism).not.toBe(core.dominantDynamic)
  })

  it('fonctionne pour les 10 intents principaux sans erreur', () => {
    const intents = [
      'relationship', 'love', 'work_money', 'blocage', 'timing',
      'identity', 'inner_state', 'life_period', 'exact_profile', 'fusion_general_question',
    ]
    for (const intent of intents) {
      expect(() => {
        const ctx = buildFusionContext(intent, MOCK_RAW, 'fr')
        const arb = arbitrateFusionSignals(ctx, 'fr')
        buildCompactReadingCore(arb, ctx, 'fr')
      }).not.toThrow()
    }
  })
})

// ── M6 — decisionStyle sans doublon ─────────────────────────────────────────

describe('M6 — DecisionStyle sans doublon "Autorité Autorité"', () => {
  it('arbitrateFusionSignals pour Projecteur ne produit pas "Autorité Autorité"', () => {
    const ctx = buildFusionContext('decision', MOCK_RAW, 'fr')
    const arb = arbitrateFusionSignals(ctx, 'fr')

    expect(arb.decisionStyle).not.toMatch(/autorit[eé]\s+autorit[eé]/i)
    expect(arb.decisionStyle).toBeTruthy()
  })

  it('decisionStyle contient bien "Émotionnelle" (l\'autorité du mock)', () => {
    const ctx = buildFusionContext('decision', MOCK_RAW, 'fr')
    const arb = arbitrateFusionSignals(ctx, 'fr')

    expect(arb.decisionStyle.toLowerCase()).toContain('émotionnelle')
  })
})

// ── M7 — Renderer Premium ─────────────────────────────────────────────────────

describe('M7 — renderPremiumReading (structure + style + jargon)', () => {
  // Helper : construit un core réel depuis le pipeline
  function buildCore(intent: string) {
    const ctx = buildFusionContext(intent, MOCK_RAW, 'fr')
    const arb = arbitrateFusionSignals(ctx, 'fr')
    return buildCompactReadingCore(arb, ctx, 'fr')
  }

  // ── Structure ────────────────────────────────────────────────────────────────

  it('contient toujours les 5 sections obligatoires (FR)', () => {
    const core = buildCore('blocage')
    const output = renderPremiumReading({ core, lang: 'fr', sunSign: 'Scorpion' })

    expect(output).toContain('CE QUI SE PASSE')
    expect(output).toContain('POURQUOI ÇA SE JOUE')
    expect(output).toContain('CE QUE ÇA PRODUIT DANS TA VIE')
    expect(output).toContain('CE QUE TU DOIS FAIRE MAINTENANT')
    expect(output).toContain('CLÉ À RETENIR')
  })

  it('contient toujours les 5 sections obligatoires (EN)', () => {
    const ctx = buildFusionContext('blocage', MOCK_RAW, 'en')
    const arb = arbitrateFusionSignals(ctx, 'en')
    const core = buildCompactReadingCore(arb, ctx, 'en')
    const output = renderPremiumReading({ core, lang: 'en', sunSign: 'Scorpio' })

    expect(output).toContain('WHAT IS HAPPENING')
    expect(output).toContain('WHY IT PLAYS OUT THIS WAY')
    expect(output).toContain('WHAT IT PRODUCES IN YOUR LIFE')
    expect(output).toContain('WHAT YOU NEED TO DO NOW')
    expect(output).toContain('KEY TO REMEMBER')
  })

  it('les 5 sections sont présentes pour chaque intent principal', () => {
    const intents = ['love', 'work_money', 'blocage', 'timing', 'identity', 'inner_state', 'life_period']
    const REQUIRED_SECTIONS_FR = [
      'CE QUI SE PASSE',
      'POURQUOI ÇA SE JOUE',
      'CE QUE ÇA PRODUIT DANS TA VIE',
      'CE QUE TU DOIS FAIRE MAINTENANT',
      'CLÉ À RETENIR',
    ]

    for (const intent of intents) {
      const core = buildCore(intent)
      const output = renderPremiumReading({ core, lang: 'fr', sunSign: 'Scorpion' })

      for (const section of REQUIRED_SECTIONS_FR) {
        expect(output, `Section "${section}" absente pour intent "${intent}"`).toContain(section)
      }
    }
  })

  // ── Zéro jargon technique ────────────────────────────────────────────────────

  it('ne contient pas "Human Design" dans la sortie', () => {
    const core = buildCore('identity')
    const output = renderPremiumReading({ core, lang: 'fr', sunSign: 'Scorpion' })

    expect(output).not.toContain('Human Design')
  })

  it('ne contient pas "Ennéagramme" dans la sortie', () => {
    const core = buildCore('inner_state')
    const output = renderPremiumReading({ core, lang: 'fr', sunSign: 'Scorpion' })

    expect(output).not.toMatch(/[Ee]nn[eé]agramme/)
  })

  it('ne contient pas "Autorité Émotionnelle" dans la sortie (humanisé)', () => {
    const core = buildCore('decision')
    const output = renderPremiumReading({ core, lang: 'fr', sunSign: 'Scorpion' })

    expect(output).not.toContain('Autorité Émotionnelle')
  })

  it('ne contient pas "Projecteur" dans la sortie (humanisé)', () => {
    // Les types HD doivent être traduits en langage humain
    const core = buildCore('fusion_general_question')
    const output = renderPremiumReading({ core, lang: 'fr', sunSign: 'Scorpion' })

    // "Projecteur" peut rester si la phrase entière est déjà humaine,
    // mais "Projecteur 2/4" (jargon brut) ne doit pas apparaître
    expect(output).not.toMatch(/Projecteur\s+\d\/\d/)
  })

  // ── Adaptation au ton solaire ─────────────────────────────────────────────────

  it('Scorpion → méta-ton présent dans la sortie (directivité high)', () => {
    const core = buildCore('blocage')
    const output = renderPremiumReading({ core, lang: 'fr', sunSign: 'Scorpion' })

    // Le bloc méta-ton doit être présent pour un signe reconnu
    expect(output).toContain('[TON SOLAIRE:')
    expect(output).toContain('high')
  })

  it('Cancer → méta-ton directivité low', () => {
    const core = buildCore('love')
    const output = renderPremiumReading({ core, lang: 'fr', sunSign: 'Cancer' })

    expect(output).toContain('[TON SOLAIRE:')
    expect(output).toContain('low')
  })

  it('signe inconnu → pas de méta-ton, structure toujours présente', () => {
    const core = buildCore('timing')
    const output = renderPremiumReading({ core, lang: 'fr', sunSign: 'Pluton' })

    // Pas de méta-ton pour un signe inconnu
    expect(output).not.toContain('[TON SOLAIRE:')
    // Mais les 5 sections sont toujours là
    expect(output).toContain('CE QUI SE PASSE')
    expect(output).toContain('CLÉ À RETENIR')
  })

  it('sans signe solaire → pas de méta-ton, structure intacte', () => {
    const core = buildCore('work_money')
    const output = renderPremiumReading({ core, lang: 'fr', sunSign: null })

    expect(output).not.toContain('[TON SOLAIRE:')
    expect(output).toContain('CE QUI SE PASSE')
  })

  // ── Prénom et personnalisation ────────────────────────────────────────────────

  it('avec prénom → section 1 commence par le prénom', () => {
    const core = buildCore('blocage')
    const output = renderPremiumReading({ core, lang: 'fr', sunSign: 'Scorpion', firstName: 'Marie' })

    // La section 1 (après le label) doit commencer par "Marie, ..."
    const s1Start = output.indexOf('CE QUI SE PASSE\n') + 'CE QUI SE PASSE\n'.length
    const s1Content = output.slice(s1Start, s1Start + 10)
    expect(s1Content).toMatch(/^Marie,/)
  })

  it('sans prénom → section 1 commence directement par le contenu', () => {
    const core = buildCore('blocage')
    const output = renderPremiumReading({ core, lang: 'fr', sunSign: 'Scorpion', firstName: null })

    const s1Start = output.indexOf('CE QUI SE PASSE\n') + 'CE QUI SE PASSE\n'.length
    const s1Content = output.slice(s1Start, s1Start + 6)
    // Ne commence pas par une virgule
    expect(s1Content).not.toMatch(/^,/)
  })

  // ── Clé mémorable (mantra) ────────────────────────────────────────────────────

  it('CLÉ À RETENIR se termine par un point', () => {
    const core = buildCore('relation')
    const output = renderPremiumReading({ core, lang: 'fr', sunSign: 'Scorpion' })

    const keyIndex = output.indexOf('CLÉ À RETENIR\n') + 'CLÉ À RETENIR\n'.length
    const keyContent = output.slice(keyIndex).split('\n\n')[0]?.trim() ?? ''
    expect(keyContent).toMatch(/\.$/)
  })

  it('CLÉ À RETENIR est ≤ 90 caractères', () => {
    const intents = ['blocage', 'timing', 'love', 'identity']
    for (const intent of intents) {
      const core = buildCore(intent)
      const output = renderPremiumReading({ core, lang: 'fr', sunSign: 'Scorpion' })

      const keyIndex = output.indexOf('CLÉ À RETENIR\n') + 'CLÉ À RETENIR\n'.length
      const keyContent = output.slice(keyIndex).split('\n\n')[0]?.trim() ?? ''
      expect(keyContent.length, `Mantra trop long pour intent "${intent}"`).toBeLessThanOrEqual(90)
    }
  })

  // ── Fiabilité ─────────────────────────────────────────────────────────────────

  it('note de fiabilité absente si signalConfidence ≥ 0.6', () => {
    const core = buildCore('exact_profile')
    // Le profil complet a une haute confiance — pas de note d'avertissement
    if (core.signalConfidence >= 0.6) {
      const output = renderPremiumReading({ core, lang: 'fr', sunSign: 'Scorpion' })
      expect(output).not.toContain('⚠')
    }
  })

  it('note de fiabilité présente si signalConfidence < 0.6', () => {
    const core = buildCore('timing')
    // Injecter une confiance artificellement basse
    const lowConfCore = { ...core, signalConfidence: 0.4 }
    const output = renderPremiumReading({ core: lowConfCore, lang: 'fr', sunSign: 'Scorpion' })

    expect(output).toContain('⚠')
    expect(output).toContain('Données partielles')
  })

  // ── Comparaison avant/après — 3 cas ──────────────────────────────────────────

  it('[EXEMPLE 1 — RELATION] output est structuré et sans jargon', () => {
    const core = buildCore('love')
    const output = renderPremiumReading({ core, lang: 'fr', sunSign: 'Scorpion' })

    // Structure présente
    expect(output).toContain('CE QUI SE PASSE')
    expect(output).toContain('CLÉ À RETENIR')
    // Sans jargon
    expect(output).not.toContain('Human Design')
    // Contenu non vide
    expect(output.length).toBeGreaterThan(200)
  })

  it('[EXEMPLE 2 — BLOCAGE] output actionnable (rightMovement present)', () => {
    const core = buildCore('blocage')
    const output = renderPremiumReading({ core, lang: 'fr', sunSign: 'Scorpion' })

    // La section action doit contenir du contenu (pas vide)
    const actionIndex = output.indexOf('CE QUE TU DOIS FAIRE MAINTENANT\n') + 'CE QUE TU DOIS FAIRE MAINTENANT\n'.length
    const actionContent = output.slice(actionIndex).split('\n\n')[0]?.trim() ?? ''
    expect(actionContent.length).toBeGreaterThan(10)
  })

  it('[EXEMPLE 3 — TIMING] output différent avec signe Cancer vs Scorpion', () => {
    const core = buildCore('timing')

    const outputScorpion = renderPremiumReading({ core, lang: 'fr', sunSign: 'Scorpion' })
    const outputCancer   = renderPremiumReading({ core, lang: 'fr', sunSign: 'Cancer' })

    // Les méta-tons doivent être différents (directivité différente)
    expect(outputScorpion).not.toEqual(outputCancer)
    // Mais les 5 sections sont toujours présentes pour les deux
    expect(outputCancer).toContain('CE QUI SE PASSE')
    expect(outputCancer).toContain('CLÉ À RETENIR')
  })
})
