export type FusionSubcategoryCopy = {
  opening: string
  explanation: string
}

export const GENERIC_FUSION_SUBCATEGORY_COPY: FusionSubcategoryCopy = {
  opening: 'Quelque chose est en train de se reorganiser dans ta situation actuelle.',
  explanation:
    'Le plus utile maintenant est de lire la dynamique en cours avant de forcer une decision.',
}

export const FUSION_SUBCATEGORY_COPY: Record<string, FusionSubcategoryCopy> = {
  timing_fusion: {
    opening: 'Tu es dans une phase ou le bon moment compte plus que la vitesse.',
    explanation:
      'Ce qui compte maintenant n est pas de forcer, mais de reconnaitre le moment le plus juste pour agir.',
  },
  fusion_timing: {
    opening: 'Tu es dans une phase ou le bon moment compte plus que la vitesse.',
    explanation:
      'Ce qui compte maintenant n est pas de forcer, mais de reconnaitre le moment le plus juste pour agir.',
  },
  fusion_general: {
    opening: 'Un mouvement de fond est en train de se clarifier.',
    explanation:
      'Meme si tout n est pas encore net, quelque chose se reorganise progressivement.',
  },
  fusion_decision: {
    opening: 'Tu es face a un choix qui demande plus de justesse que de precipitation.',
    explanation:
      'La bonne direction viendra moins d un effort mental que d un signal clair et stable.',
  },
  fusion_blockage: {
    opening: 'Quelque chose bloque surtout parce que tu tires encore dans une direction qui ne repond plus.',
    explanation:
      'Le point cle n est pas de forcer davantage, mais d identifier la vraie zone de friction.',
  },
  fusion_life_situation: {
    opening: 'Ce que tu vis en ce moment demande d etre lu comme une situation en train d evoluer.',
    explanation:
      'Il y a une dynamique de fond a comprendre avant de vouloir tout regler d un coup.',
  },
  fusion_energy_state: {
    opening: 'Ton etat actuel demande plus d ecoute que de surmobilisation.',
    explanation:
      'Ce que tu traverses parle d un ajustement de rythme, pas d un manque de valeur ou de volonte.',
  },
  fusion_relationships: {
    opening: 'La dynamique relationnelle du moment demande plus de clarte que de reaction immediate.',
    explanation:
      'Ce qui se joue se comprend mieux en regardant la dynamique entre vous qu en forçant une conclusion trop vite.',
  },
  fusion_transition_phase: {
    opening: 'Tu es dans une phase de transition ou tout n a pas encore retrouve sa bonne forme.',
    explanation:
      'Le plus juste est d accompagner la reorganisation en cours au lieu de vouloir stabiliser trop vite.',
  },
  fusion_career_money: {
    opening: 'Une reorientation se precise autour de ta maniere de contribuer et de gagner ta place.',
    explanation:
      'Le plus utile ici est de lire le bon role et le bon environnement avant de chercher un titre parfait.',
  },
}

export function getFusionSubcategoryCopy(subCategory: string | null | undefined): FusionSubcategoryCopy {
  if (!subCategory) {
    return GENERIC_FUSION_SUBCATEGORY_COPY
  }

  return FUSION_SUBCATEGORY_COPY[subCategory] ?? GENERIC_FUSION_SUBCATEGORY_COPY
}

export type FusionFallbackMode =
  | 'timing_strategic_response'
  | 'fusion_general'
  | 'interpretive_reading'
  | 'calculated_reading'

export const FUSION_SUBCATEGORY_COPY_VARIANTS: Partial<
  Record<FusionFallbackMode, Partial<Record<string, Partial<FusionSubcategoryCopy>>>>
> = {
  timing_strategic_response: {
    timing_fusion: {
      explanation:
        'Le plus juste maintenant est de laisser apparaitre une fenetre claire avant d agir ou de trancher.',
    },
    fusion_timing: {
      explanation:
        'Le plus juste maintenant est de laisser apparaitre une fenetre claire avant d agir ou de trancher.',
    },
    fusion_decision: {
      opening: 'Tu es devant un choix qui demande surtout le bon tempo.',
      explanation:
        'La vraie avance ici viendra d un signal stable et exploitable, pas d une acceleration sous tension.',
    },
  },
  fusion_general: {
    timing_fusion: {
      opening: 'Quelque chose se recale dans ton rythme actuel.',
      explanation:
        'Il y a un temps juste a respecter avant que la suite devienne vraiment lisible.',
    },
    fusion_timing: {
      opening: 'Quelque chose se recale dans ton rythme actuel.',
      explanation:
        'Il y a un temps juste a respecter avant que la suite devienne vraiment lisible.',
    },
    fusion_general: {
      opening: 'Un mouvement de fond prend doucement sa vraie forme.',
      explanation:
        'Tout n est pas encore resolu, mais la dynamique devient assez claire pour etre lue avec plus de calme.',
    },
  },
  interpretive_reading: {
    timing_fusion: {
      opening: 'Tu sens que ca bouge, mais la clarte vient davantage du rythme que de l effort.',
      explanation:
        'Ce moment demande d ecouter ce qui murit en toi avant de vouloir accelerer.',
    },
    fusion_timing: {
      opening: 'Tu sens que ca bouge, mais la clarte vient davantage du rythme que de l effort.',
      explanation:
        'Ce moment demande d ecouter ce qui murit en toi avant de vouloir accelerer.',
    },
    fusion_general: {
      opening: 'Quelque chose cherche a se remettre en ordre plus profondement.',
      explanation:
        'La lecture la plus juste ici passe par ce qui se recompose en profondeur, pas seulement par ce qui est visible tout de suite.',
    },
  },
  calculated_reading: {
    timing_fusion: {
      opening: 'Le signal actuel parle surtout d un ajustement de timing.',
      explanation:
        'Le fait le plus utile ici est que le bon resultat depend davantage du moment choisi que de l intensite mise.',
    },
    fusion_timing: {
      opening: 'Le signal actuel parle surtout d un ajustement de timing.',
      explanation:
        'Le fait le plus utile ici est que le bon resultat depend davantage du moment choisi que de l intensite mise.',
    },
    fusion_general: {
      opening: 'Le signal principal indique une reorganisation de fond.',
      explanation:
        'Le point concret a retenir est qu une dynamique generale se remet en place, meme si tous les effets ne sont pas encore visibles.',
    },
  },
}
