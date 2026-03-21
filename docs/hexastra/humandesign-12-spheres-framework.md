# Architecture de lecture Human Design à 12 sphères — Hexastra Coach

> Standard interne v1.0 — table-first, sans prose.
> Schéma TypeScript : `humandesign-12-spheres-schema.ts`
> Référence numérologie : `numerologie-12-spheres-framework.md`

---

## Structure mère

```
Lecture Human Design Hexastra
└── 12 sphères (squelette invariant)
    ├── chaque sphère = 1 domaine de vie + données HD + potentiels + clés
    ├── 8 types de lecture (angles variables, structure mère invariante)
    └── mapping HD (1 source de vérité : donnée → sphère principale)
```

**Distinction fondamentale HD :**

| Catégorie | Données | Nature |
|---|---|---|
| Structure centrale | Type HD, Stratégie, Autorité, Profil | Fixe — calculé depuis la date + heure de naissance |
| Architecture énergétique | Centres définis/ouverts, Définition, Canaux | Fixe — configuration énergétique invariante |
| Incarnation | Croix d'Incarnation, Portes conscientes, Portes inconscientes | Fixe — inscrit dans le thème natal |
| Expérientiel | Signature, Non-Soi, Circuit dominant | Fixe — découvert par l'expérience du Design |
| Cyclique | Variables, Transits actifs | Semi-fixe / Variable — actif par période ou en temps réel |

---

## Partie 1 — Table maîtresse des 12 sphères

| # | Sphère | Source HD principale | Révèle | Déséquilibre | Potentiel |
|---|---|---|---|---|---|
| 1 | **Identité** | Type HD + Profil (côté Personnalité) | Mécanique naturelle, mode d'être, façon d'initier | Agir contre la Stratégie — frustration, amertume, colère ou déception chroniques | Vie incarnée dans la mécanique naturelle du Type — Signature vécue régulièrement |
| 2 | **Ressources** | Centres moteurs définis + Définition | Énergie fiable, architecture d'alimentation, capacité à construire | Dépenser au-delà des centres définis, attendre une énergie stable que l'on n'a pas | Utilisation juste des ressources énergétiques naturelles — alignement entre capacité réelle et engagement |
| 3 | **Intelligence** | Centre Tête + Ajna + Variable cognitive | Traitement de l'information, style cognitif, gestion de la pression mentale | Utiliser le mental comme décideur, rester dans la pression des questions sans réponse | Mental comme outil de communication et de partage — non de décision |
| 4 | **Racines** | Autorité intérieure + Centre Splénique / Émotionnel | Mécanisme de vérité intérieure, fondation décisionnelle | Décisions prises depuis le mental ou la pression externe, ignorer l'Autorité | Décisions alignées — moins de regret, plus de cohérence entre choix et résultat vécu |
| 5 | **Expression créative** | Centre Gorge + Canaux d'expression + Circuit Individuel | Mode de manifestation, créativité, expression authentique | Forcer l'expression, parler pour être entendu, créer sans impulsion intérieure | Expression fluide et naturelle — ce qui sort sans effort porte la vraie signature énergétique |
| 6 | **Équilibre** | Centre Racine + Circuit Tribal + Gestion quotidienne | Gestion du stress, rythme quotidien, ressources tribales | Stress chronique, Centre Racine conditionné en urgence permanente | Rythme juste, alimentation et environnement alignés avec les Variables |
| 7 | **Relations** | Centres non définis + Profil (lignes) + Conditionnement | Conditionnement relationnel, patterns d'attraction, sagesse des centres ouverts | Fusion dans les centres ouverts, identification à l'énergie de l'autre | Sagesse des centres ouverts — témoin de la diversité humaine sans en être captif |
| 8 | **Transformation** | Thème du Non-Soi + Circuit Individuel mutation | Zones d'ombre, thème du Non-Soi, patterns de résistance | Vivre depuis le Non-Soi sans en avoir conscience, répéter les patterns | Non-Soi comme boussole — chaque signal émotionnel devient une information de réalignement |
| 9 | **Vision** | Croix d'Incarnation + Portes conscientes | Sens de vie, thème d'incarnation, ce que je transmets consciemment | Chercher son sens à l'extérieur, résister la Croix, forcer une mission inventée | Vivre la Croix sans la forcer — la transmission émerge naturellement de qui l'on est |
| 10 | **Vocation** | Centre G + Direction magnétique + Stratégie + Signature | Direction de vie, alignement professionnel, mission vécue | Travail contre la Stratégie, Signature absente du quotidien | Carrière comme incarnation naturelle du Design — Signature comme indicateur quotidien |
| 11 | **Collectif** | Circuit Collectif + Variables environnement + Lignes 5/6 | Impact collectif, contribution naturelle, timing d'entrée dans le groupe | Contribution forcée, timing collectif ignoré, environnement non aligné | Impact naturel dans le bon format et le bon timing |
| 12 | **Intégration** | Côté Design (inconscient) + Variables complètes + Définition | Côté inconscient, maturité de Design, intégration corps-esprit | Suridentification au côté Personnalité, ignorer les signaux du corps | Intégration progressive du côté Design — maturité qui émerge avec le déconditionnement |

**Clés par sphère :**

| # | Clé de compréhension | Clé d'action | Question miroir |
|---|---|---|---|
| 1 | Le Type n'est pas une identité à performer — c'est une mécanique à laisser opérer. | Identifier sa Stratégie et observer une situation récente où elle n'a pas été suivie. | Est-ce que j'agis depuis ma Stratégie ou depuis la pression de l'extérieur ? |
| 2 | Seuls les centres définis produisent une énergie fiable. Les centres ouverts amplifient et libèrent. | Lister les engagements actuels et identifier ceux qui dépensent de l'énergie non disponible de façon fiable. | Est-ce que je m'engage depuis mon énergie réelle ou depuis ce que j'imagine pouvoir faire ? |
| 3 | Le Centre Tête génère des questions. L'Ajna traite. Aucun des deux ne décide. | Identifier les décisions actuellement tranchées par le mental et les reposer à l'Autorité. | Quelles décisions suis-je en train de prendre depuis la tête plutôt que depuis mon Autorité ? |
| 4 | L'Autorité n'est pas une intuition abstraite — c'est un mécanisme corporel précis à reconnaître. | Décrire en une phrase comment son Autorité fonctionne et identifier la dernière décision prise depuis elle. | Comment est-ce que je sais, dans mon corps, que quelque chose est juste pour moi ? |
| 5 | Le Centre Gorge ne décide pas ce qu'il exprime — il transmet ce qui vient des centres connectés. | Identifier un canal actif relié à la Gorge et observer comment il se manifeste dans la vie quotidienne. | Est-ce que j'exprime depuis une impulsion authentique ou depuis le besoin d'être reconnu ? |
| 6 | Le Centre Racine génère de la pression pour finir — pas pour démarrer. L'urgence constante est du conditionnement. | Identifier un pattern de stress récurrent et tracer sa source dans le design (centre, canal ou conditionnement). | Quelle pression dans ma vie est réelle, et laquelle est conditionnée ? |
| 7 | Les centres ouverts ne définissent pas qui l'on est — ils montrent ce qu'on amplifie chez les autres. | Lister les centres non définis et identifier un comportement récurrent qui vient du conditionnement de chacun. | Dans mes relations actuelles, qu'est-ce qui vient de moi et qu'est-ce qui vient du conditionnement ? |
| 8 | Le thème du Non-Soi n'est pas un défaut — c'est un système d'alerte conçu pour réorienter. | Nommer son thème du Non-Soi et identifier une situation récente où il était actif. | Quel signal émotionnel récurrent indique que je vis hors de mon Design ? |
| 9 | La Croix d'Incarnation n'est pas un destin figé — c'est un thème à traverser pleinement. | Lire le thème de sa Croix et identifier où ce thème se manifeste déjà dans la vie, sans effort. | Quel thème revient dans ma vie dans différents contextes, comme si c'était mon registre naturel ? |
| 10 | La vocation ne se choisit pas depuis le mental — elle émerge quand on suit sa Stratégie suffisamment longtemps. | Évaluer sa trajectoire professionnelle actuelle à l'aune de sa Signature : est-elle présente ou absente ? | Est-ce que ma vie professionnelle génère régulièrement ma Signature ou mon Non-Soi ? |
| 11 | Le Circuit Collectif ne fonctionne pas dans l'urgence — il opère dans le partage et le retour d'expérience. | Identifier son circuit collectif dominant et observer si son format de contribution actuel y correspond. | Est-ce que je contribue dans le format qui me vient naturellement ou dans celui que l'on attend de moi ? |
| 12 | Le côté Design (inconscient) est aussi réel que le côté Personnalité — et opère souvent à l'insu de la personne. | Identifier une qualité ou un pattern qu'on ne se reconnaît pas mais que les autres voient — c'est souvent le Design. | Quelle partie de moi agit de façon constante mais que je ne revendique pas encore ? |

---

## Partie 2 — Mapping HD

**Règle** : chaque donnée appartient à une sphère principale. Elle peut être lue en secondaire dans d'autres mais n'est jamais analysée deux fois à égale profondeur.

| Donnée HD | Sphère principale | Sphères secondaires | Nature |
|---|---|---|---|
| type_hd | 1 — Identité | 10 — Vocation, 8 — Transformation | structure |
| strategie | 10 — Vocation | 1 — Identité | structure |
| autorite | 4 — Racines | 10 — Vocation | structure |
| profil | 1 — Identité | 7 — Relations, 9 — Vision | structure |
| centres_definis | 2 — Ressources | 5 — Expression créative, 6 — Équilibre | definition |
| centres_ouverts | 7 — Relations | 3 — Intelligence, 8 — Transformation | definition |
| definition_hd | 2 — Ressources | 12 — Intégration | definition |
| canaux | 5 — Expression créative | 2 — Ressources, 11 — Collectif | definition |
| croix_incarnation | 9 — Vision | 12 — Intégration | incarnation |
| portes_conscientes | 9 — Vision | 5 — Expression créative | incarnation |
| portes_inconscientes | 12 — Intégration | 9 — Vision | incarnation |
| signature | 10 — Vocation | 8 — Transformation | dynamique |
| non_soi | 8 — Transformation | 10 — Vocation | dynamique |
| circuit_dominant | 5 — Expression créative | 6 — Équilibre, 11 — Collectif | definition |
| variables | 11 — Collectif | 3 — Intelligence, 12 — Intégration | cyclique |
| transits_actifs | cyclique uniquement | — | cyclique |

**Tiers de priorité des données :**

| Tier | Données | Toujours présent |
|---|---|---|
| 1 — Structure centrale | Type HD, Stratégie, Autorité, Profil | Oui |
| 2 — Architecture énergétique | Centres définis/ouverts, Définition, Canaux | Selon type de lecture |
| 3 — Incarnation | Croix d'Incarnation, Portes conscientes, Portes inconscientes | Lectures identitaire, karmique, profondes |
| 4 — Expérientiel | Signature, Non-Soi, Circuit dominant | Lectures vocationnelle, karmique, énergétique |
| 5 — Cyclique | Variables, Transits actifs | Lecture cyclique uniquement |

---

## Partie 3 — Sous-catégories de lectures Human Design Hexastra

| ID | Nom | Sphères prioritaires | Données prioritaires | Profondeur | Format |
|---|---|---|---|---|---|
| `general` | Générale | 1, 4, 7, 10 | Type, Autorité, Profil, Stratégie | standard | synthesis |
| `identitaire` | Identitaire | 1, 4, 5, 9 | Type, Autorité, Croix, Portes conscientes | approfondie | structured |
| `relationnelle` | Relationnelle | 7, 1, 4, 8 | Centres ouverts, Profil, Non-Soi, Stratégie | standard | structured |
| `decisionnelle` | Décisionnelle | 4, 1, 10, 3 | Autorité, Type, Stratégie, Variables | approfondie | structured |
| `vocationnelle` | Vocationnelle | 10, 9, 2, 5 | Stratégie, Signature, Croix, Canaux | approfondie | structured |
| `karmique` | Karmique / Transformatrice | 8, 12, 4, 1 | Non-Soi, Portes Design, Autorité | deep | narrative |
| `energetique` | Dynamique énergétique | 2, 6, 3, 11 | Centres définis/ouverts, Définition, Variables | standard | structured |
| `cyclique` | Cyclique | 1, 4, 7, 10 | Transits actifs sur centres/portes | standard | synthesis |

> **NOTE** : les lectures `decisionnelle` et `energetique` sont uniques au Human Design — elles n'ont pas d'équivalent direct dans les autres sciences Hexastra. `decisionnelle` centralise le mécanisme d'Autorité (absent en numérologie) ; `energetique` lit les flux de centres (logique propre au BodyGraph HD).

**Détail par type :**

### Lecture générale
- **Objectif** : Vue d'ensemble de la configuration HD — Type, Autorité, Profil et direction de vie
- **Répond à** : Qui suis-je selon mon Design ? Quelle est ma mécanique naturelle ? Comment dois-je prendre mes décisions ?

### Lecture identitaire
- **Objectif** : Clarifier l'identité profonde via Type + Autorité + Croix d'Incarnation + Portes conscientes
- **Répond à** : Qui je suis vraiment selon mon Design ? Y a-t-il cohérence entre mon vécu et ma configuration ?

### Lecture relationnelle
- **Objectif** : Dynamiques de conditionnement, patterns d'attraction via centres ouverts et Profil
- **Répond à** : Comment je conditionne et suis conditionné ? Quels patterns relationnels viennent de mon Design ?

### Lecture décisionnelle
- **Objectif** : Approfondir le mécanisme d'Autorité et la Stratégie comme système de décision incarné
- **Répond à** : Comment je décide juste ? Quelle est mon Autorité précise ? Comment la mettre en pratique ?

### Lecture vocationnelle
- **Objectif** : Identifier la direction de vie via Centre G, Stratégie, Signature et Croix d'Incarnation
- **Répond à** : Quelle est ma direction naturelle ? Comment aligner carrière et Design ? Ma Signature est-elle présente ?

### Lecture karmique / transformatrice
- **Objectif** : Cartographier le Non-Soi, les portes inconscientes (Design) et les patterns de résistance
- **Répond à** : D'où viennent mes blocages ? Quel est mon thème du Non-Soi ? Qu'est-ce que mon inconscient porte ?

### Lecture énergétique
- **Objectif** : Lire le BodyGraph comme système — flux des centres définis et ouverts, Définition, Variables
- **Répond à** : Comment fonctionne mon énergie ? Qu'est-ce qui est fiable ? Comment optimiser mon rythme ?

### Lecture cyclique
- **Objectif** : Situer dans les transits actifs et leur impact sur les centres et portes du Design
- **Répond à** : Quel transit est actif ? Comment interagit-il avec mon Design personnel ? Quel est le timing ?

---

## Partie 4 — Format standard d'une sphère

```
SPHÈRE [N] — [NOM EN MAJUSCULE]

id          : sphere_[n]
source      : [données HD principales]
nature      : structure | definition | incarnation | dynamique | cyclique

// ── Analyse ──────────────────────────
révèle      : [Ce que cette sphère montre — 1 phrase]
données     : [Données HD à injecter]
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
  "framework": "hexastra_hd_12_spheres",
  "version": "1.0",
  "science": "humandesign",
  "spheres": [
    {
      "id": "sphere_1",
      "name": "Identité",
      "primaryData": ["type_hd", "profil"],
      "dataNature": "structure",
      "axis": "Nature fondamentale, mode d'être, façon d'initier",
      "reveals": "La mécanique naturelle de la personne — son Type détermine sa stratégie d'interaction et son Profil son rôle dans la vie.",
      "imbalance": "Agir contre sa Stratégie — frustration, amertume, colère ou déception chroniques selon le Type.",
      "potential": "Vie incarnée dans la mécanique naturelle du Type — Signature vécue régulièrement.",
      "keyUnderstanding": "Le Type n'est pas une identité à performer — c'est une mécanique à laisser opérer.",
      "keyAction": "Identifier sa Stratégie et observer une situation récente où elle n'a pas été suivie.",
      "mirrorQuestion": "Est-ce que j'agis depuis ma Stratégie ou depuis la pression de l'extérieur ?"
    }
  ],
  "readingTypes": [
    {
      "id": "vocationnelle",
      "prioritySpheres": [10, 9, 2, 5],
      "priorityData": ["strategie", "signature", "croix_incarnation", "canaux"],
      "depth": "approfondie",
      "render": "structured"
    }
  ],
  "dataMapping": [
    {
      "key": "type_hd",
      "primarySphere": "sphere_1",
      "secondarySpheres": ["sphere_10", "sphere_8"],
      "nature": "structure"
    }
  ]
}
```

---

## Partie 6 — Règles de cohérence

1. **Anti-doublon** — Type analysé en sphère 1 uniquement. En sphère 10 : c'est la Stratégie et la Signature qui sont lus, pas le Type redécrit.
2. **Tier 1 obligatoire** — Type, Stratégie, Autorité, Profil présents dans tout rendu, quel que soit le type.
3. **Centres ouverts ≠ centres définis** — sphère 2 lit les centres définis (énergie fiable) ; sphère 7 lit les centres ouverts (conditionnement). Jamais mélangés.
4. **Karmique = deep only** — Non-Soi approfondi et portes Design uniquement en lecture karmique ou deep.
5. **Variables = sphère 11 / 12** — ne pas injecter les Variables dans les lectures standard courtes.
6. **Croix d'Incarnation = sphère 9** — ne pas dupliquer en sphère 10. En sphère 10, c'est la Signature et la Direction qui comptent.
7. **1 sphère = 1 bloc** — révélation + déséquilibre + potentiel + clé + action. Jamais de conclusion générique.

---

## Recommandations produit

| Action | Priorité | Fichier cible |
|---|---|---|
| Créer `buildHDDataBlock(raw)` | Haute | `lib/hexastra/prompts/buildHDPrompt.ts` |
| Ajouter `hdReadingKind` dans `universalClassification.ts` | Haute | `lib/hexastra/orchestration/universalClassification.ts` |
| Routing 8 types → `contextType` / `domainRoute` | Haute | `lib/hexastra/orchestration/universalClassification.ts` |
| Sous-menu Human Design — 8 types | Moyenne | `lib/hexastra/menus/getMenuForMode.ts` |
| Créer `buildHDReadingSystemPrompt()` dans buildSystemPrompt | Moyenne | `lib/hexastra/prompts/buildSystemPrompt.ts` |
| `validateHDOutput(text, readingType)` — post-render observability | Haute | `lib/hexastra/prompts/buildHDPrompt.ts` |

**Routing vers types existants :**

| Type | `contextType` | `domainRoute` |
|---|---|---|
| Générale | `general` | `science` |
| Identitaire | `general` | `science` |
| Relationnelle | `relationship` | `relationship` |
| Décisionnelle | `general` | `science` |
| Vocationnelle | `career` | `career` |
| Karmique | `energy` | `science` |
| Énergétique | `energy` | `science` |
| Cyclique | `timing` | `timing` |

---

## Section "Duplication cross-science"

Points à résoudre avant HD → Ennéagramme / Kua / Fusion :

| Priorité | Sujet |
|---|---|
| Haute | Terminologie "Profil" : existe en HD (lignes 1-6) et peut prêter à confusion avec "profil" au sens général. Préfixer `hdProfil` vs `enneaProfil` dans les interfaces partagées. |
| Haute | `dataSource` : en HD les données viennent d'un calcul de date+heure (comme numérologie) ; en Ennéagramme via test ou observation. Prévoir `dataSource: 'calculated' \| 'declared' \| 'observed'` dans l'interface commune. |
| Haute | "Centres" HD ↔ "Centres" Kua : terminologie partiellement partagée, sémantique différente. Préfixer `hdCentre` vs `kuaCentre` dans les interfaces partagées. |
| Moyenne | Leçons karmiques cross-science : gates manquantes en HD, angles de croissance en Ennéagramme, direction de défaut en Kua. Centraliser dans une interface `KarmicSignal` partagée. |
| Moyenne | Cycles en Kua et Ennéagramme : pas définis de la même façon qu'en HD. Prévoir que `cyclicData` peut être null ou une structure différente selon la science. |
| Basse | Fusion HD + Numérologie : Croix d'Incarnation (HD) et Chemin de Vie (Num) couvrent des territoires partiellement superposés (sens de vie). Décider d'un mapping ou d'une séparation stricte avant la lecture fusion. |
| Basse | `maturite` (Numérologie) ↔ `definition_hd` (HD) : deux façons différentes de lire la "convergence" énergétique. Ne pas mapper directement — créer des champs distincts. |
