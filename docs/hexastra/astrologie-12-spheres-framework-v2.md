# Architecture astrologique 12 sphères — Hexastra Coach v2

> Référence interne — table-first, sans prose.
> Source de vérité complète : `astrologie-12-spheres-framework.md`
> Schéma TypeScript : `astrologie-12-spheres-schema.ts`

---

## Table des 12 sphères

| # | Sphère | Maison | Planète | Révèle | Déséquilibre | Potentiel |
|---|---|---|---|---|---|---|
| 1 | **Identité** | I | Soleil, ASC | Affirmation, présence | Identité floue ou excessive | Présence naturelle, leadership |
| 2 | **Ressources** | II | Vénus | Valeurs, argent, confiance | Dévalorisation, rapport toxique à l'argent | Abondance alignée, autonomie |
| 3 | **Intelligence** | III | Mercure | Pensée, communication | Surcharge mentale, pensée rigide | Communication précise, curiosité |
| 4 | **Racines** | IV | Lune | Fondations émotionnelles | Insécurité, dépendance aux origines | Ancrage, transmission consciente |
| 5 | **Expression** | V | Soleil, Vénus | Créativité, joie, amour | Blocage créatif, validation excessive | Créativité fluide, joie incarnée |
| 6 | **Équilibre** | VI | Mercure, Saturne | Santé, routines, service | Perfectionnisme, négligence du corps | Efficacité, service aligné |
| 7 | **Relations** | VII | Vénus, Mars | Partenariats, projections | Fusion, dépendance, peur d'engagement | Complémentarité consciente |
| 8 | **Transformation** | VIII | Pluton, Mars | Crises, renaissance, intimité | Contrôle, résistance au changement | Alchimie personnelle, puissance |
| 9 | **Vision** | IX | Jupiter | Sens, philosophie, transmission | Dogmatisme, idéalisme non ancré | Vision articulée, foi productive |
| 10 | **Vocation** | X | Saturne, MC | Mission, réputation, impact | Ambition déconnectée, besoin de reconnaissance | Autorité naturelle, héritage réel |
| 11 | **Collectif** | XI | Uranus | Idéaux, réseaux, innovation | Conformisme ou dispersion | Impact collectif, réseaux fertiles |
| 12 | **Intégration** | XII | Neptune, Nœuds | Inconscient, karma, schémas | Auto-sabotage, peurs non nommées | Intuition, guérison des patterns |

**Clés d'action par sphère** (injection rapide)

| # | Sphère | Clé de compréhension | Clé d'action |
|---|---|---|---|
| 1 | Identité | Soleil = qui je suis. ASC = comment j'arrive. | Aligner présentation et nature profonde. |
| 2 | Ressources | Maison II = ce que je considère comme mien, y compris ma valeur propre. | Construire depuis ce qui nourrit réellement. |
| 3 | Intelligence | Mercure définit *comment* on pense, pas *ce qu'on* pense. | Adapter le canal au style naturel. |
| 4 | Racines | Lune = d'où je viens émotionnellement. Maison IV = où je me sens chez moi. | Séparer l'héritage subi de l'héritage choisi. |
| 5 | Expression | Maison V = créer pour la joie, pas pour produire. | Revenir à ce qui procure du plaisir sans justification. |
| 6 | Équilibre | Maison VI = comment je fonctionne au quotidien, pas la carrière. | Ajuster les routines pour soutenir l'énergie globale. |
| 7 | Relations | Maison VII révèle ce qu'on projette autant que ce qu'on cherche. | Intégrer la part de soi que l'autre incarne. |
| 8 | Transformation | Maison VIII = mourir à une version de soi pour en devenir une autre. | Identifier ce qui doit mourir pour que quelque chose de vrai émerge. |
| 9 | Vision | Maison IX = ce que je crois être vrai sur le monde. | Articuler sa vision de façon transmissible. |
| 10 | Vocation | MC = la qualité que le monde reconnaît, pas le métier. | Construire ce qui laisse une trace. |
| 11 | Collectif | Maison XI = avec qui et pour quoi avancer. | Choisir ses appartenances consciemment. |
| 12 | Intégration | Maison XII = ce qui agit avant que tu aies conscience d'agir. | Rendre conscient un schéma en boucle pour en sortir. |

---

## Mapping astrologique

**Règle** : chaque planète appartient à 1 sphère principale. Elle peut apparaître en secondaire mais n'est jamais analysée deux fois à égale profondeur.

| Planète / Point | Sphère principale | Sphères secondaires |
|---|---|---|
| Soleil | 1 — Identité | 5 — Expression, 10 — Vocation |
| Lune | 4 — Racines | 6 — Équilibre, 12 — Intégration |
| ASC | 1 — Identité | 7 — Relations (DSC miroir) |
| Mercure | 3 — Intelligence | 6 — Équilibre |
| Vénus | 2 — Ressources | 5 — Expression, 7 — Relations |
| Mars | 8 — Transformation | 7 — Relations, 5 — Expression |
| Jupiter | 9 — Vision | 2 — Ressources |
| Saturne | 10 — Vocation | 6 — Équilibre, 12 — Intégration |
| Uranus | 11 — Collectif | 3 — Intelligence |
| Neptune | 12 — Intégration | 9 — Vision |
| Pluton | 8 — Transformation | 1 — Identité |
| Chiron | 12 — Intégration | sphère de la maison occupée |
| Nœud Nord | 10 — Vocation | sphère de la maison occupée |
| Nœud Sud | 12 — Intégration | sphère de la maison occupée |
| MC | 10 — Vocation | 4 — Racines (axe IC/MC) |
| Transits | sphère de la maison transitée | — |
| Aspects | sphère des planètes en jeu | — |
| Éléments / Modalités | 1 — Identité (profil global) | distribués selon dominance |

**Tiers de priorité des données** (valable cross-type de lecture) :

| Tier | Données | Toujours présent |
|---|---|---|
| 1 — Fondation | Soleil, Lune, ASC | Oui |
| 2 — Personnel | Mercure, Vénus, Mars | Selon type |
| 3 — Social | Jupiter, Saturne | Lectures vocationnelle, cyclique |
| 4 — Transpersonnel | Uranus, Neptune, Pluton | Lectures profondes |
| 5 — Karmique | Nœuds, Chiron, Progressions | Lectures deep uniquement |

---

## Types de lecture

| ID | Nom | Sphères prioritaires | Données clés | Profondeur | Format |
|---|---|---|---|---|---|
| `general` | Générale | 1, 4, 7, 10 | Soleil, Lune, ASC, MC | standard | synthesis |
| `identitaire` | Identitaire | 1, 2, 5, 9 | Soleil, ASC, Vénus, Jupiter | approfondie | structured |
| `relationnelle` | Relationnelle | 7, 5, 4, 8 | Vénus, Mars, Maison VII | standard | structured |
| `vocationnelle` | Vocationnelle | 10, 6, 2, 9 | Saturne, MC, Nœud Nord | approfondie | structured |
| `karmique` | Karmique / Transformatrice | 8, 12, 4, 1 | Pluton, Nœuds, Chiron | deep | narrative |
| `creative` | Créative | 5, 3, 9, 11 | Maison V, Soleil, Uranus | standard | narrative |
| `cyclique` | Cyclique | sphères transitées | Transits, Progressions | standard | synthesis |

**Routing vers types existants :**

| Type de lecture | `contextType` | `domainRoute` |
|---|---|---|
| Générale | `general` | `science` |
| Identitaire | `general` | `science` |
| Relationnelle | `relationship` | `relationship` |
| Vocationnelle | `career` | `career` |
| Karmique | `energy` | `science` |
| Créative | `general` | `science` |
| Cyclique | `timing` | `timing` |

---

## Règles de cohérence

1. **Anti-doublon** — une planète est analysée en profondeur dans sa sphère principale uniquement. En sphère secondaire : mention ou angle spécifique, jamais analyse complète.
2. **Sphères Tier 1 obligatoires** — sphères 1 et 4 (Soleil, Lune, ASC) sont toujours présentes dans tout rendu, quel que soit le type.
3. **Profondeur variable, structure invariante** — les 12 sphères existent toujours. Ce qui change : sphères développées vs condensées selon le type.
4. **1 sphère = 1 bloc de rendu** — contient exactement : révélation + déséquilibre + potentiel + clé de compréhension + clé d'action.
5. **Aspects cross-sphères** — traités dans la sphère de la planète la plus active du transit (pas dans les deux sphères).
6. **Duplication cross-science** — même squelette de 12 sphères. Seuls `astroInputs` changent. Les fonctions `reveals`, `imbalance`, `potential`, `keyAction` sont réécrites par science.

---

## Recommandations produit (résumé)

| Action | Priorité | Fichier cible |
|---|---|---|
| Créer `buildAstroReadingDataBlock(...)` | Haute | `lib/hexastra/prompts/buildAstroPrompt.ts` |
| Créer `ASTRO_READING_REQUIRED_BLOCKS[readingType]` | Haute | `lib/hexastra/prompts/buildAstroPrompt.ts` |
| Ajouter `astroReadingKind` dans `universalClassification.ts` | Haute | `lib/hexastra/orchestration/universalClassification.ts` |
| Étendre le sous-menu Astrologie avec les 7 types | Moyenne | `lib/hexastra/menus/getMenuForMode.ts` |
| Créer `buildAstroReadingSystemPrompt()` depuis le schema | Moyenne | `lib/hexastra/prompts/buildSystemPrompt.ts` |
| Dupliquer le framework vers Numérologie | Basse | `docs/hexastra/numerologie-12-spheres-schema.ts` |

---

*V2 — table-first. Pour la version narrative complète : `astrologie-12-spheres-framework.md`*
