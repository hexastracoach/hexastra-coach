# Architecture de lecture Ennéagramme à 12 sphères — Hexastra Coach

> Standard interne v1.0 — table-first, sans prose.
> Schéma TypeScript : `enneagramme-12-spheres-schema.ts`
> Référence Human Design : `humandesign-12-spheres-framework.md`

---

## Structure mère

```
Lecture Ennéagramme Hexastra
└── 12 sphères (squelette invariant)
    ├── chaque sphère = 1 domaine de vie + données Ennéagramme + potentiels + clés
    ├── 8 types de lecture (angles variables, structure mère invariante)
    └── mapping Ennéagramme (1 source de vérité : donnée → sphère principale)
```

**Distinction fondamentale Ennéagramme :**

| Catégorie | Données | Nature |
|---|---|---|
| Structure caractérielle | Type, Aile, Centre d'intelligence | Fixe — auto-déclaré ou via test validé |
| Dynamique centrale | Passion dominante, Fixation mentale, Peur fondamentale, Désir fondamental | Fixe — invariant selon le type |
| Protection | Mécanisme de défense, Blessure centrale | Fixe — activé sous stress ou régression |
| Évolutif | Flèche d'intégration, Flèche de désintégration, Vertu, Idée sacrée | Fixe — direction de croissance ou de chute inscrite dans le type |
| Relationnel / Cyclique | Sous-type, Style relationnel, Niveaux de santé, Tri-type | Semi-variable — révélé par contexte, période, travail intérieur |

---

## Partie 1 — Table maîtresse des 12 sphères

| # | Sphère | Source Ennéagramme principale | Révèle | Déséquilibre | Potentiel |
|---|---|---|---|---|---|
| 1 | **Identité** | Type + Aile + Centre d'intelligence | Structure de personnalité centrale — le type organise toute la perception, les décisions et les comportements autour d'un axe invariant | Identification totale avec le type — confondre la structure avec l'identité réelle, défendre le personnage contre toute remise en question | Conscience de sa structure sans s'y identifier — voir le type comme un outil de lecture, pas comme une prison |
| 2 | **Ressources** | Désir fondamental + Sous-type Conservation | Comment la personne gère ses ressources vitales (énergie, argent, temps, sécurité physique) — organisé par le sous-type Conservation et le désir fondamental | Accumulation compulsive ou négligence des besoins fondamentaux selon la passion — thésaurisation ou épuisement | Gestion juste des ressources, alignée avec le désir fondamental sain — ni peur du manque ni surcompensation |
| 3 | **Intelligence** | Fixation mentale + Centre d'intelligence | La fixation mentale qui colore la perception et génère le bruit intérieur récurrent — comment le centre d'intelligence du type traite et distord l'information | Mental en boucle sur la fixation, décisions prises depuis le filtre du type sans en avoir conscience | Pensée claire, observation sans distorsion — intelligence au service de la présence plutôt que de la protection |
| 4 | **Racines** | Peur fondamentale + Blessure centrale | La peur fondamentale et la blessure centrale qui organisent toute la structure défensive — ce qui est perçu comme existentiellement menaçant | Vie organisée autour de l'évitement de la peur fondamentale — décisions prises pour ne jamais la rencontrer, au prix de la liberté | Relation consciente à la peur — la reconnaître sans qu'elle décide à la place, la traverser plutôt que la fuir |
| 5 | **Expression créative** | Vertu + Désir fondamental | La vertu et le canal d'expression naturel — ce qui émerge authentiquement quand la passion est transformée et le désir fondamental orienté vers la création | Expression bloquée par la passion ou sur-contrôlée par la fixation — créativité mise au service du mécanisme plutôt que de l'être réel | Créativité fluide, expression depuis la vertu — l'être exprimé sans la distorsion du mécanisme de défense |
| 6 | **Équilibre** | Passion dominante + Niveaux de santé | La passion dominante en action au quotidien — comment le pattern émotionnel central se manifeste dans le rythme ordinaire de vie et quel niveau de santé est actif | Passion non consciente qui colore chaque interaction, génère friction et épuisement chronique sans que la personne ne s'en aperçoive | Passion reconnue et nommée — elle perd de sa force automatique quand elle est observée plutôt que subie |
| 7 | **Relations** | Style relationnel + Sous-type + Aile | Le style relationnel, le pattern d'attachement et les dynamiques interpersonnelles — filtrés par le type, l'aile et le sous-type dominant | Relations organisées autour de la peur fondamentale — attirer ce qu'on craint, rejouer la blessure dans des contextes différents | Relations nourries par la vertu — réciprocité, présence réelle, complémentarité sans projection ni fusion |
| 8 | **Transformation** | Mécanisme de défense + Flèche de désintégration | Le mécanisme de défense principal et la flèche de désintégration — comment la personne réagit sous pression et ce qu'elle fait pour éviter de rencontrer sa peur | Mécanisme activé à répétition — comportements automatiques sous stress qui aggravent la situation plutôt que de la résoudre | Mécanisme reconnu et nommé — l'observer permet de choisir une réponse consciente plutôt que de réagir automatiquement |
| 9 | **Vision** | Flèche d'intégration + Idée sacrée | La flèche d'intégration et l'idée sacrée — la direction naturelle de croissance du type et ce qu'il aspire à incarner à son plus haut niveau de santé | Vision idéalisée sans ancrage — idée sacrée transformée en exigence de perfection plutôt qu'en aspiration vivante | Direction évolutive vécue et incarnée — flèche d'intégration activée consciemment, idée sacrée comme boussole non comme performance |
| 10 | **Vocation** | Type + Centre d'intelligence + Désir fondamental | La direction professionnelle naturelle — désir fondamental sain appliqué à la contribution, centre d'intelligence comme moteur de la mission | Vocation filtrée par la peur — travail mis au service du mécanisme de défense plutôt que de la mission réelle | Carrière comme incarnation du désir fondamental sain — contribution alignée avec le centre d'intelligence et la vertu du type |
| 11 | **Collectif** | Sous-type Social + Style relationnel | L'impact dans les groupes et les systèmes — le sous-type Social comme mode de participation collective, le centre d'intelligence comme registre de contribution | Participation collective filtrée par la passion — chercher validation, pouvoir ou fusion dans le groupe plutôt que de contribuer | Contribution collective depuis la vertu — présence juste dans les systèmes, sans besoin de reconnaissance ni de contrôle |
| 12 | **Intégration** | Tri-type + Niveaux de santé + Vertu | La synthèse du parcours d'intégration — tri-type, niveaux de santé élevés et vertu intégrée comme vision de la maturité caractérielle possible | Intégration confondue avec performance ou guérison — vouloir éliminer le type plutôt que l'habiter consciemment | Maturité caractérielle réelle — le type devient un outil au service de la présence, non une prison ni une carte d'identité figée |

**Clés par sphère :**

| # | Clé de compréhension | Clé d'action | Question miroir |
|---|---|---|---|
| 1 | Le type n'est pas ce que l'on est — c'est la façon dont on filtre la réalité pour se protéger d'une peur fondamentale. | Nommer son type et identifier une situation récente où sa logique s'est activée automatiquement, sans choix conscient. | Est-ce que j'habite vraiment ma vie, ou est-ce que mon type la pilote à ma place ? |
| 2 | Le rapport aux ressources est filtré par la passion — il dit quelque chose de la peur, pas de la réalité matérielle. | Observer comment son énergie a été gérée la semaine passée et identifier la passion à l'œuvre dans ces choix. | Est-ce que je gère mes ressources depuis la peur ou depuis la confiance en ce qui est disponible ? |
| 3 | La fixation mentale n'est pas la vérité — c'est un filtre récurrent que l'on peut apprendre à reconnaître sans s'y identifier. | Nommer sa fixation mentale et observer combien de fois elle tourne en boucle dans une journée ordinaire. | Quand mon mental s'emballe, quel est le film qu'il rejoue systématiquement ? |
| 4 | La peur fondamentale n'est pas une faiblesse — c'est le signal qui indique précisément où la croissance est possible. | Formuler sa peur fondamentale en une phrase et identifier une décision récente prise pour l'éviter. | Si je n'avais pas cette peur, qu'est-ce que je ferais différemment en ce moment ? |
| 5 | La vertu n'est pas opposée à la passion — elle en est la transformation naturelle quand la peur est consciente. | Identifier sa vertu et observer un domaine de vie où elle s'exprime déjà, sans effort particulier. | Quand est-ce que je crée ou exprime depuis mon centre plutôt que depuis mon mécanisme de protection ? |
| 6 | La passion n'est pas un ennemi — c'est l'énergie du type cherchant une direction. La nommer est déjà une forme de liberté. | Identifier la passion dominante et noter 3 situations de la semaine passée où elle était active sans y être invitée. | Quel est le pattern émotionnel que je retrouve dans des contextes très différents de ma vie ? |
| 7 | On attire des relations qui correspondent à la croyance qu'on a de soi — pas à la réalité de ce qu'on est. | Identifier le pattern relationnel récurrent et le relier à la peur fondamentale ou à la passion active. | Dans mes relations actuelles, est-ce que je cherche à être protégé, validé, ou vraiment rencontré ? |
| 8 | Le mécanisme de défense protège une douleur réelle — il ne disparaît pas par la volonté, il s'intègre par la conscience. | Nommer son mécanisme de défense principal et identifier une situation récente où il s'est activé sans y être invité. | Qu'est-ce que je fais quand je me sens vraiment menacé — et qu'est-ce que ce comportement protège réellement ? |
| 9 | La flèche d'intégration n'est pas un effort de volonté — c'est une direction qui émerge naturellement quand le mécanisme de défense se relâche. | Lire la flèche d'intégration du type et identifier une qualité de ce type que l'on commence déjà à incarner, même partiellement. | Vers quoi est-ce que je me dirige naturellement quand je suis dans mon meilleur état ? |
| 10 | La vocation n'est pas dans le titre ou le secteur — elle est dans la qualité de présence et de contribution que l'on apporte. | Identifier comment le désir fondamental sain se traduit en contribution professionnelle concrète et observable. | Est-ce que mon travail actuel permet à mon désir fondamental de s'exprimer, ou le contraint-il ? |
| 11 | Le sous-type Social révèle comment on s'inscrit dans les systèmes — pas seulement dans les relations individuelles. | Observer son comportement dans les groupes cette semaine et identifier si la passion ou la vertu guide la participation. | Dans les collectifs auxquels j'appartiens, est-ce que j'apporte quelque chose, ou est-ce que je cherche quelque chose ? |
| 12 | L'intégration n'est pas l'élimination du type — c'est la capacité à choisir comment il s'exprime en fonction du contexte. | Identifier son tri-type si connu et observer comment les trois types interagissent concrètement dans sa vie actuelle. | À quoi ressemblerait ma vie si mon type était un outil plutôt qu'une contrainte — et qu'est-ce que cela changerait concrètement ? |

---

## Partie 2 — Mapping Ennéagramme

**Règle** : chaque donnée appartient à une sphère principale. Elle peut être lue en secondaire dans d'autres mais n'est jamais analysée deux fois à égale profondeur.

| Donnée Ennéagramme | Sphère principale | Sphères secondaires | Nature |
|---|---|---|---|
| type_enneagramme | 1 — Identité | 10 — Vocation, 6 — Équilibre | structure |
| aile | 1 — Identité | 7 — Relations | structure |
| centre_intelligence | 3 — Intelligence | 10 — Vocation, 1 — Identité | structure |
| passion_dominante | 6 — Équilibre | 8 — Transformation, 4 — Racines | dynamique |
| fixation_mentale | 3 — Intelligence | 6 — Équilibre | dynamique |
| peur_fondamentale | 4 — Racines | 8 — Transformation, 7 — Relations | dynamique |
| desir_fondamental | 2 — Ressources | 10 — Vocation, 5 — Expression créative | dynamique |
| mecanisme_defense | 8 — Transformation | 4 — Racines | dynamique |
| blessure_centrale | 4 — Racines | 8 — Transformation | dynamique |
| fleche_desintegration | 8 — Transformation | 6 — Équilibre | evolutif |
| fleche_integration | 9 — Vision | 12 — Intégration | evolutif |
| vertu | 5 — Expression créative | 12 — Intégration, 9 — Vision | evolutif |
| idee_sacree | 9 — Vision | 12 — Intégration | evolutif |
| sous_type | 7 — Relations | 2 — Ressources (SP), 11 — Collectif (SO) | relationnel |
| style_relationnel | 7 — Relations | 11 — Collectif | relationnel |
| niveaux_sante | 6 — Équilibre | 12 — Intégration, 9 — Vision | cyclique |
| tri_type | 12 — Intégration | 1 — Identité | cyclique |

**Tiers de priorité des données :**

| Tier | Données | Toujours présent |
|---|---|---|
| 1 — Structure | Type, Aile, Centre d'intelligence | Oui |
| 2 — Dynamique centrale | Passion, Fixation, Peur, Désir | Oui (sauf lecture évolutive) |
| 3 — Protection | Mécanisme de défense, Blessure centrale | Lectures défensif, transformatrice, deep |
| 4 — Évolutif | Flèches, Vertu, Idée sacrée | Lectures vocationnelle, transformatrice, évolutive |
| 5 — Relationnel/Cyclique | Sous-type, Style rel., Niveaux santé, Tri-type | Selon type de lecture |

---

## Partie 3 — Sous-catégories de lectures Ennéagramme Hexastra

| ID | Nom | Sphères prioritaires | Données prioritaires | Profondeur | Format |
|---|---|---|---|---|---|
| `general` | Générale | 1, 4, 7, 10 | Type, Peur, Aile, Style relationnel | standard | synthesis |
| `identitaire` | Identitaire | 1, 4, 5, 3 | Type, Peur, Vertu, Fixation | approfondie | structured |
| `relationnelle` | Relationnelle | 7, 1, 4, 11 | Style rel., Sous-type, Peur, Aile | standard | structured |
| `emotionnelle` | Émotionnelle ★ | 6, 4, 8, 3 | Passion, Peur, Mécanisme, Fixation | standard | structured |
| `vocationnelle` | Vocationnelle | 10, 9, 2, 5 | Type (voc.), Flèche intégr., Désir, Vertu | approfondie | structured |
| `transformatrice` | Transformatrice ★ | 8, 12, 4, 9 | Mécanisme, Tri-type, Peur, Flèche intégr. | deep | narrative |
| `defensif` | Mécanismes de défense ★ | 8, 3, 4, 6 | Mécanisme, Fixation, Peur, Passion | approfondie | structured |
| `evolutive` | Évolutive ★ | 9, 12, 5, 1 | Flèche intégr., Vertu, Idée sacrée, Type | approfondie | structured |

> **NOTE** : les lectures `emotionnelle`, `transformatrice`, `defensif` et `evolutive` sont uniques à l'Ennéagramme — elles n'ont pas d'équivalent direct dans les autres sciences Hexastra. `emotionnelle` centralise le travail sur la passion (absent en HD) ; `defensif` cartographie les mécanismes de protection (logique propre à la psychologie de l'Ennéagramme) ; `evolutive` lit les flèches d'intégration comme direction consciente ; `transformatrice` associe mécanisme, blessure et tri-type en lecture profonde.

**Détail par type :**

### Lecture générale
- **Objectif** : Vue d'ensemble de la configuration Ennéagramme — Type, Peur, Aile et style relationnel
- **Répond à** : Qui suis-je selon mon type ? Quelle est ma structure caractérielle ? Comment ma peur fondamentale organise-t-elle ma vie ?

### Lecture identitaire
- **Objectif** : Clarifier l'identité profonde via Type + Peur fondamentale + Vertu + Fixation mentale
- **Répond à** : Qui je suis vraiment selon l'Ennéagramme ? Y a-t-il cohérence entre mon vécu et ma structure caractérielle ?

### Lecture relationnelle
- **Objectif** : Dynamiques d'attachement, patterns relationnels via style relationnel, sous-type et aile
- **Répond à** : Comment est-ce que je me lie aux autres ? Quels patterns relationnels viennent de mon type ?

### Lecture émotionnelle
- **Objectif** : Cartographier la passion dominante, son impact sur l'équilibre quotidien et le niveau de santé actif
- **Répond à** : Quel est mon pattern émotionnel central ? Comment la passion colore-t-elle mes journées ? Quel niveau de santé est actif ?

### Lecture vocationnelle
- **Objectif** : Identifier la direction professionnelle naturelle via désir fondamental, flèche d'intégration et vertu
- **Répond à** : Quelle est ma mission naturelle ? Comment aligner carrière et désir fondamental sain ? Ma vertu est-elle exprimée dans mon travail ?

### Lecture transformatrice
- **Objectif** : Cartographier le mécanisme de défense, la blessure centrale et le tri-type comme carte de transformation profonde
- **Répond à** : D'où viennent mes blocages ? Comment ma flèche de désintégration se manifeste-t-elle sous stress ? Que protège mon mécanisme de défense ?

### Lecture mécanismes de défense
- **Objectif** : Approfondir le mécanisme de défense principal, la fixation mentale et la passion comme système de résistance
- **Répond à** : Quel est mon mécanisme de défense précis ? Comment la fixation et la passion s'alimentent-elles mutuellement ? Comment reconnaître l'activation sans s'y identifier ?

### Lecture évolutive
- **Objectif** : Activer la flèche d'intégration, la vertu et l'idée sacrée comme direction de croissance incarnée
- **Répond à** : Vers quoi suis-je naturellement en train de croître ? Comment incarner la vertu sans en faire une performance ? Quelle est mon idée sacrée comme boussole ?

---

## Partie 4 — Format standard d'une sphère

```
SPHÈRE [N] — [NOM EN MAJUSCULE]

id          : sphere_[n]
source      : [données Ennéagramme principales]
nature      : structure | dynamique | evolutif | relationnel | cyclique

// ── Analyse ──────────────────────────
révèle      : [Ce que cette sphère montre — 1 phrase]
données     : [Données Ennéagramme à injecter]
déséquilibre : [Manifestation basse]
potentiel   : [Manifestation élevée]

// ── Clés ──────────────────────────────
compréhension : [Insight fondamental — 1 phrase]
action        : [Direction pratique — 1 phrase impérative]
question      : [Question miroir — optionnelle]
```

---

## Partie 5 — Version pseudo-JSON

```json
{
  "framework": "hexastra_ennea_12_spheres",
  "version": "1.0",
  "science": "enneagramme",
  "spheres": [
    {
      "id": "sphere_1",
      "name": "Identité",
      "primaryData": ["type_enneagramme", "aile", "centre_intelligence"],
      "dataNature": "structure",
      "axis": "Structure caractérielle fondamentale, filtre de réalité, mode d'être",
      "reveals": "La structure de personnalité centrale — le type organise toute la perception, les décisions et les comportements autour d'un axe invariant.",
      "imbalance": "Identification totale avec le type — confondre la structure avec l'identité réelle, défendre le personnage contre toute remise en question.",
      "potential": "Conscience de sa structure sans s'y identifier — voir le type comme un outil de lecture, pas comme une prison.",
      "keyUnderstanding": "Le type n'est pas ce que l'on est — c'est la façon dont on filtre la réalité pour se protéger d'une peur fondamentale.",
      "keyAction": "Nommer son type et identifier une situation récente où sa logique s'est activée automatiquement, sans choix conscient.",
      "mirrorQuestion": "Est-ce que j'habite vraiment ma vie, ou est-ce que mon type la pilote à ma place ?"
    }
  ],
  "readingTypes": [
    {
      "id": "vocationnelle",
      "prioritySpheres": [10, 9, 2, 5],
      "priorityData": ["type_enneagramme", "fleche_integration", "desir_fondamental", "vertu"],
      "depth": "approfondie",
      "render": "structured"
    }
  ],
  "dataMapping": [
    {
      "key": "type_enneagramme",
      "primarySphere": "sphere_1",
      "secondarySpheres": ["sphere_10", "sphere_6"],
      "nature": "structure"
    }
  ]
}
```

---

## Partie 6 — Règles de cohérence

1. **Anti-doublon** — Type analysé en sphère 1 uniquement. En sphère 10 : c'est le désir fondamental sain appliqué à la mission qui est lu, pas le type redécrit.
2. **Tier 1 obligatoire** — Type + Peur fondamentale (sphères 1 et 4) présents dans tout rendu, quel que soit le type de lecture.
3. **Passion ≠ Fixation** — Passion (sphère 6, émotionnel) ≠ Fixation (sphère 3, mental). Jamais intervertis dans la même sphère.
4. **Karmique/deep only** — Mécanisme de défense approfondi et blessure centrale uniquement en lecture défensif, transformatrice ou deep.
5. **Flèches séparées** — Flèche de désintégration (sphère 8, stress) ≠ Flèche d'intégration (sphère 9, croissance). Jamais dans la même sphère.
6. **Sous-types distincts** — SP → sphère 2 (ressources), SO → sphère 11 (collectif), SX → sphère 7 (relations). Ne pas analyser les 3 sous-types dans la même sphère.
7. **1 sphère = 1 bloc** — révélation + déséquilibre + potentiel + clé + action. Pas de conclusion générique.

---

## Recommandations produit

| Action | Priorité | Fichier cible |
|---|---|---|
| Créer `buildEnneaDataBlock(raw)` | Haute | `lib/hexastra/prompts/buildEnneaPrompt.ts` |
| Ajouter `enneaReadingKind` dans `universalClassification.ts` | Haute | `lib/hexastra/orchestration/universalClassification.ts` |
| Routing 8 types → `contextType` / `domainRoute` | Haute | `lib/hexastra/orchestration/universalClassification.ts` |
| Sous-menu Ennéagramme — 8 types | Moyenne | `lib/hexastra/menus/getMenuForMode.ts` |
| Créer `buildEnneaReadingSystemPrompt()` dans buildSystemPrompt | Moyenne | `lib/hexastra/prompts/buildSystemPrompt.ts` |
| `validateEnneaOutput(text, readingType)` — post-render observability | Haute | `lib/hexastra/prompts/buildEnneaPrompt.ts` |

**Routing vers types existants :**

| Type | `contextType` | `domainRoute` |
|---|---|---|
| Générale | `general` | `science` |
| Identitaire | `general` | `science` |
| Relationnelle | `relationship` | `relationship` |
| Émotionnelle | `energy` | `science` |
| Vocationnelle | `career` | `career` |
| Transformatrice | `energy` | `science` |
| Mécanismes de défense | `energy` | `science` |
| Évolutive | `general` | `science` |

---

## Section "Duplication cross-science"

Points à résoudre avant Ennéagramme → Kua / HD / Fusion :

| Science | Conflit / Point d'attention |
|---|---|
| Kua | "Centre" Kua (directions cardinales) ≠ "Centre d'intelligence" Ennéagramme (Corps / Cœur / Tête). Préfixer par science dans les interfaces partagées : `kuaCentre` vs `enneaCenter`. |
| Kua | Cycles Kua (annuels, Lo Shu) ≠ niveaux de santé Ennéagramme (intégration/désintégration psychologique). `dataSource` différent — ne pas mapper dans la même interface cyclique. |
| Fusion Hexastra | Passion Ennéagramme + Non-Soi HD partiellement superposés (signal d'alarme émotionnel chronique). Décider d'un seul champ `shadowSignal` partagé ou deux champs distincts avant la lecture fusion. |
| Fusion Hexastra | Flèche d'intégration Ennéagramme + Croix d'Incarnation HD couvrent partiellement le "sens de vie". Séparation stricte recommandée — deux champs distincts dans l'interface commune. |
| Fusion Hexastra | `dataSource: 'observed'` (Ennéagramme via test/auto-déclaration) ≠ `'calculated'` (HD, Numérologie). Champ `dataSource` obligatoire dans l'interface commune pour toute donnée fusionnée. |
