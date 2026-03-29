/**
 * Behavior Engine — Hexastra Coach
 *
 * Génère un profil de décision et une stratégie comportementale
 * à partir du CompactReadingCore et de l'intent détecté.
 *
 * Appelé quand intent === 'timing_decision' ou 'behavior_change'.
 * Le résultat est injecté dans le system prompt comme bloc contextuel.
 */

import type { CompactReadingCore } from './compactReadingCore'
import type { UserIntent } from '../orchestration/intentClassifier'

// ── Types ─────────────────────────────────────────────────────────────────────

export type DecisionProfile = {
  /** Style de décision — dérivé du decisionSignal du CompactCore */
  decisionStyle: string
  /** Dynamique d'énergie dominante — dérivé du dominantDynamic */
  energyPattern: string
  /** Risque principal — dérivé de la realTension */
  risk: string
  /** Meilleure stratégie — dérivé du rightMovement */
  bestStrategy: string
  /** Pire stratégie — dérivé du hiddenMechanism (le piège interne) */
  worstStrategy: string
  /** Signal de timing — dérivé du timingSignal */
  timingSignal: string
}

export type BehaviorStrategy = {
  /** Le déclencheur du comportement compulsif ou de l'impasse décisionnelle */
  trigger: string
  /** Le vrai besoin sous-jacent (pas le symptôme) */
  realNeed: string
  /** Le meilleur moment pour agir ou changer */
  bestMoment: string
  /** États / contextes à éviter absolument */
  avoid: string[]
  /** Actions de substitution ou d'ancrage */
  replacement: string[]
}

// ── Decision Profile ──────────────────────────────────────────────────────────

/**
 * Construit un profil de décision à partir du CompactReadingCore.
 * Les champs du core sont des textes riches — on les utilise directement
 * comme source de vérité pour le profil.
 */
export function buildDecisionProfile(compactCore: CompactReadingCore): DecisionProfile {
  return {
    decisionStyle: compactCore.decisionSignal,
    energyPattern: compactCore.dominantDynamic,
    risk: compactCore.realTension,
    bestStrategy: compactCore.rightMovement,
    worstStrategy: compactCore.hiddenMechanism,
    timingSignal: compactCore.timingSignal,
  }
}

// ── Behavior Strategy ─────────────────────────────────────────────────────────

/**
 * Construit la stratégie comportementale adaptée à l'intent et au profil.
 * Le profil de décision sert de base pour personnaliser les signaux.
 */
export function buildBehaviorStrategy(
  intent: UserIntent,
  decisionProfile: DecisionProfile,
): BehaviorStrategy {
  if (intent === 'behavior_change') {
    return {
      trigger: 'tension interne → besoin de décharge immédiate',
      realNeed: 'régulation interne — calmer le système nerveux sans dépendre d\'un comportement externe',
      bestMoment:
        decisionProfile.timingSignal ||
        'après saturation naturelle — quand le rejet vient de l\'intérieur, pas de la volonté',
      avoid: [
        'ennui et vide intérieur non occupé',
        'décision mentale pure sans ancrage corporel',
        'pression extérieure ou ultimatum',
        'période de stress maximal',
      ],
      replacement: [
        'respiration et retour au corps',
        'mouvement physique court (marche, froid, étirement)',
        'action immédiate dans un autre registre',
        'pause de 10 minutes avant de réagir',
      ],
    }
  }

  // timing_decision
  return {
    trigger: 'pression extérieure → besoin de décider vite',
    realNeed: 'signal interne clair — la décision juste émerge quand la pression est retirée',
    bestMoment:
      decisionProfile.timingSignal ||
      'quand la clarté émerge sans effort — signal : légèreté, pas soulagement forcé',
    avoid: [
      'urgence émotionnelle ou état de surcharge',
      'pression de l\'entourage ou délai artificiel',
      'décision par défaut ou par élimination mentale',
      'moment de fatigue ou de doute actif',
    ],
    replacement: [
      'attendre le signal interne décrit ci-dessus',
      'agir dès que l\'élan est présent — ne pas retarder une fois le signal reçu',
      'tester avec une micro-action avant la décision finale',
    ],
  }
}

// ── Strategy Block Builder ────────────────────────────────────────────────────

/**
 * Construit le bloc contextuel à injecter dans le system prompt.
 * Ce bloc fournit au LLM le profil de décision personnalisé et la stratégie comportementale,
 * ancré dans les données réelles de l'utilisateur.
 */
export function buildBehaviorBlock(
  intent: UserIntent,
  decisionProfile: DecisionProfile,
  isFr: boolean,
): string {
  if (!isFr) {
    return buildBehaviorBlockEn(intent, decisionProfile)
  }

  const strategy = buildBehaviorStrategy(intent, decisionProfile)
  const intentLabel =
    intent === 'timing_decision'
      ? 'TIMING & DÉCISION'
      : 'CHANGEMENT DE COMPORTEMENT'

  return [
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `CONTEXTE STRATÉGIQUE — ${intentLabel}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    '',
    '## PROFIL DE DÉCISION (source : données réelles du profil fusionné)',
    '',
    `● Style de décision : ${decisionProfile.decisionStyle}`,
    `● Dynamique d'énergie : ${decisionProfile.energyPattern}`,
    `● Risque principal : ${decisionProfile.risk}`,
    `● Meilleure stratégie : ${decisionProfile.bestStrategy}`,
    `● Piège à éviter : ${decisionProfile.worstStrategy}`,
    `● Signal de timing : ${decisionProfile.timingSignal}`,
    '',
    '## STRATÉGIE COMPORTEMENTALE',
    '',
    `● Déclencheur : ${strategy.trigger}`,
    `● Vrai besoin : ${strategy.realNeed}`,
    `● Meilleur moment : ${strategy.bestMoment}`,
    `● À éviter absolument : ${strategy.avoid.join(' / ')}`,
    `● Actions d'ancrage : ${strategy.replacement.join(' / ')}`,
    '',
    '## RÈGLE D\'UTILISATION',
    'Ces données sont ta SOURCE DE VÉRITÉ pour cette réponse.',
    'Ne les décris pas — utilise-les pour produire : stratégie, timing, action.',
    'Chaque conseil doit être IMPOSSIBLE à donner sans ce profil.',
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
  ].join('\n')
}

function buildBehaviorBlockEn(
  intent: UserIntent,
  decisionProfile: DecisionProfile,
): string {
  const strategy = buildBehaviorStrategy(intent, decisionProfile)
  const intentLabel = intent === 'timing_decision' ? 'TIMING & DECISION' : 'BEHAVIOR CHANGE'

  return [
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `STRATEGIC CONTEXT — ${intentLabel}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    '',
    '## DECISION PROFILE (source: actual fusion profile data)',
    '',
    `● Decision style: ${decisionProfile.decisionStyle}`,
    `● Energy pattern: ${decisionProfile.energyPattern}`,
    `● Main risk: ${decisionProfile.risk}`,
    `● Best strategy: ${decisionProfile.bestStrategy}`,
    `● Trap to avoid: ${decisionProfile.worstStrategy}`,
    `● Timing signal: ${decisionProfile.timingSignal}`,
    '',
    '## BEHAVIORAL STRATEGY',
    '',
    `● Trigger: ${strategy.trigger}`,
    `● Real need: ${strategy.realNeed}`,
    `● Best moment: ${strategy.bestMoment}`,
    `● Absolutely avoid: ${strategy.avoid.join(' / ')}`,
    `● Anchor actions: ${strategy.replacement.join(' / ')}`,
    '',
    '## USAGE RULE',
    'This data is your SOURCE OF TRUTH for this response.',
    "Don't describe it — use it to produce: strategy, timing, action.",
    'Every recommendation must be impossible to give without this profile.',
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
  ].join('\n')
}
