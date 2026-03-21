# Architecture de lecture numérologique à 12 sphères — Hexastra Coach

> Standard interne v1.0 — table-first, sans prose.
> Schéma TypeScript : `numerologie-12-spheres-schema.ts`
> Référence astrologie : `astrologie-12-spheres-framework-v2.md`

---

## Structure mère

```
Lecture numérologique Hexastra
└── 12 sphères (squelette invariant)
    ├── chaque sphère = 1 domaine de vie + données numérologiques + potentiels + clés
    ├── 7 types de lecture (angles variables, structure mère invariante)
    └── mapping numérologique (1 source de vérité : donnée → sphère principale)
```

**Distinction fondamentale :**

| Catégorie | Données | Nature |
|---|---|---|
| Fondation | Chemin de Vie, Nombre de Naissance | Fixe — calculé depuis la date de naissance |
| Identité | Expression, Âme, Personnalité, Héritage | Fixe — calculé depuis le nom complet de naissance |
| Maturation | Maturité (CV + Expression) | Fixe — pertinent à partir de ~35-40 ans |
| Karmique | Dettes karmiques, Leçons karmiques | Fixe — absences et marqueurs dans les calculs |
| Cyclique | Défis, Cycles de vie, Pinnacles | Semi-fixe — calculé depuis naissance, actif par période |
| Temps court | Année / Mois / Jour personnels | Variable — recalculé chaque année/mois/jour |

---

## Partie 1 — Table maîtresse des 12 sphères

| # | Sphère | Source principale | Révèle | Déséquilibre | Potentiel |
|---|---|---|---|---|---|
| 1 | **Identité** | Chemin de Vie, Naissance | Moteur fondamental, nature profonde | Identité niée ou subie, vie hors CV | Vie alignée avec la vibration naturelle |
| 2 | **Ressources** | Expression + Pinnacle 1 | Potentiel matériel, talent à construire | Construction contre nature, argent par peur | Manifestation alignée avec les capacités réelles |
| 3 | **Intelligence** | Personnalité + Expression (style) | Façon de penser, de présenter, d'être reçu | Masque sans substance, image figée | Communication naturelle, impact authentique |
| 4 | **Racines** | Âme + Héritage | Vérité intérieure, fondation émotionnelle | Déni du ressenti profond, héritage non conscient | Ancrage dans sa propre vérité, transmission choisie |
| 5 | **Expression créative** | Âme (désir) + Expression (canal) | Comment je crée, ce qui m'anime | Création sans joie, désir bloqué par la peur | Créativité fluide, canal entre désir et forme |
| 6 | **Équilibre** | Défis 1 & 2 + Cycle de vie 1 | Zones de friction récurrentes, rythme quotidien | Résistance aux défis, surcompensation | Défis comme moteurs de maîtrise, rythme juste |
| 7 | **Relations** | Âme + Personnalité (en relation) | Ce que j'attends des autres, comment j'attire | Fusion, séduction inconsciente, déception répétée | Relations nourries par la complémentarité réelle |
| 8 | **Transformation** | Dettes karmiques + Leçons karmiques | Zones d'ombre, patterns de résistance | Répétition inconsciente, refus des leçons | Alchimie des épreuves, croissance par l'intégration |
| 9 | **Vision** | CV (octave élevé) + Pinnacles 3/4 | Sens de vie, philosophie, capacité à transmettre | Idéalisme sans ancrage, sens non incarné | Vision articulée, transmission fertile |
| 10 | **Vocation** | Expression + Maturité + CV | Mission de vie, alignement carrière/vocation | Métier contre Expression, talent non exprimé | Carrière comme incarnation de la mission |
| 11 | **Collectif** | Personnalité + Année personnelle | Impact dans le groupe, timing collectif | Inadaptation au cycle, réseau par défaut | Contribution juste au bon moment |
| 12 | **Intégration** | Maturité + Leçons karmiques | Synthèse de vie, sagesse à intégrer | Répétition des leçons, refus de maturité | Sagesse intégrée, cohérence entre CV et Expression |

**Clés par sphère :**

| # | Clé de compréhension | Clé d'action | Question miroir |
|---|---|---|---|
| 1 | Le CV n'est pas un rôle à jouer — c'est la vibration naturelle de qui je suis. | Identifier les domaines où je vis contre mon CV. | Suis-je en train de vivre ma vibration ou de la fuir ? |
| 2 | L'Expression dit ce que je suis capable de construire — pas ce que je construis déjà. | Activer le potentiel du Pinnacle 1 avant sa date d'expiration. | Est-ce que je construis depuis ma force ou depuis ma peur ? |
| 3 | La Personnalité est comment j'arrive — l'Expression est ce que je livre. Ils doivent s'aligner. | Ajuster la façon de se présenter pour qu'elle reflète ce qu'on est vraiment. | Comment je veux être reçu, et comment j'arrive réellement ? |
| 4 | L'Âme est ce que je ressens quand plus personne ne regarde. | Valider ses désirs profonds avant de les justifier. | Qu'est-ce que je veux vraiment, sous tout ce que je montre ? |
| 5 | La tension Âme/Expression est la tension entre désir et forme. | Trouver le canal qui permet à l'Âme de s'exprimer via l'Expression. | Est-ce que je crée ce que je veux vraiment créer ? |
| 6 | Les Défis ne sont pas des faiblesses — ce sont des zones de maîtrise disponibles. | Nommer le Défi actif et choisir une action consciente face à lui. | Quel défi récurrent est en train de se rejouer dans ma vie en ce moment ? |
| 7 | L'Âme attire ce qu'elle vibre — la Personnalité filtre ce qui reste. | Observer ce que j'attire et ce que je garde — les deux disent quelque chose. | Les relations que j'ai maintenant sont-elles cohérentes avec ce que je veux vraiment ? |
| 8 | Les Dettes karmiques ne sont pas des punitions — ce sont des zones à maîtriser dans cette vie. | Identifier la dette active et son mode d'expression actuel. | Quel schéma est-ce que je retrouve dans tous les contextes différents ? |
| 9 | Le CV à son octave élevé = ce que je dois transmettre, pas juste vivre. | Articuler sa philosophie personnelle en une phrase transmissible. | Quel est le sens que je veux donner à ma vie, pas seulement à ma carrière ? |
| 10 | La Maturité est le nombre où CV et Expression convergent — ce qu'on devient quand on est vraiment soi. | Construire vers la Maturité maintenant, pas après. | Est-ce que ma trajectoire actuelle converge vers ma Maturité ? |
| 11 | L'Année personnelle donne le ton collectif — la Personnalité donne le rôle dans ce ton. | Identifier l'Année personnelle actuelle et ajuster son positionnement collectif. | Est-ce que je suis dans le bon timing pour ce que j'essaie de faire ? |
| 12 | Les Leçons karmiques sont les nombres absents dans le nom — ce que la vie va faire revenir jusqu'à intégration. | Nommer les leçons encore actives et observer où elles se manifestent. | Quelle leçon revient encore et encore, dans différents contextes de ma vie ? |

---

## Partie 2 — Mapping numérologique

**Règle** : chaque donnée appartient à une sphère principale. Elle peut être lue en secondaire dans d'autres mais n'est jamais analysée deux fois à égale profondeur.

| Donnée numérique | Sphère principale | Sphères secondaires | Nature |
|---|---|---|---|
| Chemin de Vie | 1 — Identité | 9 — Vision, 10 — Vocation | Fixe — fondation |
| Nombre de Naissance | 1 — Identité | — | Fixe — fondation |
| Expression | 10 — Vocation | 2 — Ressources, 3 — Intelligence | Fixe — identité |
| Âme / Intime | 4 — Racines | 5 — Expression créative, 7 — Relations | Fixe — identité |
| Personnalité | 3 — Intelligence | 7 — Relations, 11 — Collectif | Fixe — identité |
| Héritage (nom de famille) | 4 — Racines | — | Fixe — identité |
| Maturité (CV + Expression) | 12 — Intégration | 10 — Vocation | Fixe — maturation |
| Dettes karmiques | 8 — Transformation | 12 — Intégration | Karmique |
| Leçons karmiques | 8 — Transformation | 12 — Intégration | Karmique |
| Défi 1 | 6 — Équilibre | 8 — Transformation | Semi-fixe — cyclique |
| Défi 2 | 6 — Équilibre | — | Semi-fixe — cyclique |
| Défi 3 | 6 — Équilibre | 9 — Vision | Semi-fixe — cyclique |
| Défi 4 | 6 — Équilibre | 12 — Intégration | Semi-fixe — cyclique |
| Cycle de vie 1 | 6 — Équilibre | 1 — Identité (jeunesse) | Semi-fixe — cyclique |
| Cycle de vie 2 | 9 — Vision | 10 — Vocation | Semi-fixe — cyclique |
| Cycle de vie 3 | 9 — Vision | 12 — Intégration | Semi-fixe — cyclique |
| Pinnacle 1 | 2 — Ressources | 1 — Identité | Semi-fixe — cyclique |
| Pinnacle 2 | 11 — Collectif | 7 — Relations | Semi-fixe — cyclique |
| Pinnacle 3 | 9 — Vision | 10 — Vocation | Semi-fixe — cyclique |
| Pinnacle 4 | 12 — Intégration | 9 — Vision | Semi-fixe — cyclique |
| Année personnelle | 11 — Collectif | 6 — Équilibre | Variable — temps court |
| Mois personnel | 6 — Équilibre | 11 — Collectif | Variable — temps court |
| Jour personnel | 6 — Équilibre | — | Variable — temps court |

**Tiers de priorité des données :**

| Tier | Données | Toujours présent |
|---|---|---|
| 1 — Fondation | Chemin de Vie, Expression | Oui |
| 2 — Identité complète | Âme, Personnalité, Naissance | Selon type de lecture |
| 3 — Karmique | Dettes, Leçons | Lectures karmiques et profondes |
| 4 — Cyclique | Défis, Cycles, Pinnacles | Lectures vocationnelle, cyclique |
| 5 — Temps court | Année / Mois / Jour personnels | Lecture cyclique uniquement |

---

## Partie 3 — Sous-catégories de lectures numérologique Hexastra

| ID | Nom | Sphères prioritaires | Données prioritaires | Profondeur | Format |
|---|---|---|---|---|---|
| `general` | Générale | 1, 4, 7, 10 | CV, Expression, Âme, Personnalité | standard | synthesis |
| `identitaire` | Identitaire | 1, 4, 5, 3 | CV, Âme, Naissance, Personnalité | approfondie | structured |
| `relationnelle` | Relationnelle | 7, 4, 5, 8 | Âme, Personnalité, Expression, Dettes | standard | structured |
| `vocationnelle` | Vocationnelle | 10, 2, 9, 6 | Expression, CV, Maturité, Pinnacles | approfondie | structured |
| `karmique` | Karmique / Transformatrice | 8, 12, 4, 1 | Dettes, Leçons, Âme, CV | deep | narrative |
| `cyclique` | Cyclique | 11, 6, 9, 2 | Année perso, Cycle actif, Pinnacle actif | standard | synthesis |
| `potentiel` | Potentiel | 10, 2, 12, 9 | Expression, Maturité, Pinnacle 4, CV | approfondie | structured |

**Détail par type :**

### Lecture générale
- **Objectif** : Vue d'ensemble de la configuration numérique, potentiels et dynamiques dominantes
- **Répond à** : Qui suis-je selon les nombres ? Quelles sont mes forces et fragilités numériques ?

### Lecture identitaire
- **Objectif** : Clarifier l'identité profonde (CV), le ressenti intérieur (Âme) et la présentation (Personnalité)
- **Répond à** : Qui je suis vraiment ? Y a-t-il cohérence entre mon intérieur, mon extérieur et ma trajectoire ?

### Lecture relationnelle
- **Objectif** : Dynamiques attractives, modèle relationnel, zones de compatibilité et de friction
- **Répond à** : Comment j'aime ? Qu'est-ce que j'attire ? Quels patterns relationnels reviennent ?

### Lecture vocationnelle
- **Objectif** : Identifier la mission via l'Expression et la trajectoire via CV + Maturité + Pinnacles
- **Répond à** : Quelle est ma mission ? Comment construire une carrière alignée ? Où en suis-je dans mes Pinnacles ?

### Lecture karmique / transformatrice
- **Objectif** : Cartographier les Dettes et Leçons actives, nommer les zones d'ombre et de répétition
- **Répond à** : D'où viennent mes blocages ? Quels schémas tournent en boucle ? Quelle leçon dois-je intégrer ?

### Lecture cyclique
- **Objectif** : Situer la personne dans son cycle actuel (Année, Pinnacle, Cycle de vie) et lire le timing
- **Répond à** : Quelle est l'énergie de l'année actuelle ? Suis-je dans un Pinnacle favorable ? Quel est le thème du cycle actif ?

### Lecture de potentiel
- **Objectif** : Lire ce qui est disponible mais non encore actualisé (Expression, Maturité, Pinnacle 4)
- **Répond à** : Quel est mon potentiel complet ? Qu'est-ce que je n'ai pas encore exprimé ? Où converge ma trajectoire de vie ?

---

## Partie 4 — Format standard d'une sphère

```
SPHÈRE [N] — [NOM EN MAJUSCULE]

id          : sphere_[n]
source      : [données numériques principales]
nature      : fixe | karmique | cyclique | variable

// ── Analyse ──────────────────────────
révèle      : [Ce que cette sphère montre — 1 phrase]
données     : [Données numériques à calculer]
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
  "framework": "hexastra_num_12_spheres",
  "version": "1.0",
  "science": "numerologie",
  "spheres": [
    {
      "id": "sphere_1",
      "name": "Identité",
      "primaryData": ["chemin_de_vie", "naissance"],
      "nature": "fixe",
      "reveals": "Moteur fondamental, nature profonde, façon d'initier",
      "imbalance": "Vie vécue contre le CV — fatigue chronique, sentiment de fausseté",
      "potential": "Vie alignée avec la vibration naturelle — élan sans effort",
      "keyUnderstanding": "Le CV n'est pas un rôle — c'est la vibration naturelle de qui je suis.",
      "keyAction": "Identifier les domaines où je vis contre mon CV.",
      "mirrorQuestion": "Suis-je en train de vivre ma vibration ou de la fuir ?"
    }
  ],
  "readingTypes": [
    {
      "id": "vocationnelle",
      "prioritySpheres": [10, 2, 9, 6],
      "priorityData": ["expression", "chemin_de_vie", "maturite", "pinnacle"],
      "depth": "approfondie",
      "render": "structured"
    }
  ],
  "dataMapping": [
    {
      "key": "chemin_de_vie",
      "primarySphere": "sphere_1",
      "secondarySpheres": ["sphere_9", "sphere_10"],
      "nature": "fixe"
    }
  ]
}
```

---

## Partie 6 — Règles de cohérence

1. **Anti-doublon** — CV est analysé en profondeur dans la sphère 1 uniquement. En sphère 9 ou 10 : mention de son octave élevé ou de sa convergence avec l'Expression, jamais réanalyse complète.
2. **Tier 1 obligatoire** — CV et Expression sont toujours présents dans tout rendu, quel que soit le type.
3. **Données fixes vs cycliques** — dans une lecture standard, les données fixes (CV, Expression, Âme, Personnalité) précèdent les cycliques (Année, Cycle, Pinnacle). Dans une lecture cyclique, l'ordre est inversé.
4. **Karmique = optionnel sauf deep** — Dettes et Leçons ne s'injectent qu'en lecture karmique ou en deep reading. Ne pas les forcer dans une lecture générale ou vocationnelle.
5. **1 sphère = 1 bloc de rendu** — contient exactement : révélation + déséquilibre + potentiel + clé + action. Jamais de conclusion générique.
6. **Maturité = donnée de synthèse** — La Maturité (CV + Expression) est le nombre de convergence. Elle n'est pertinente que si les deux données sources sont connues et calculées.
7. **Duplication cross-science** — même squelette de 12 sphères. Seuls `numInputs` changent. Les fonctions `reveals`, `imbalance`, `potential`, `keyAction` sont réécrites pour chaque science mais respectent le même format de champ.

---

## Recommandations produit

| Action | Priorité | Fichier cible |
|---|---|---|
| Créer `buildNumDataBlock(raw, birthData)` | Haute | `lib/hexastra/prompts/buildNumPrompt.ts` |
| Créer `NUM_READING_REQUIRED_BLOCKS[readingType]` | Haute | `lib/hexastra/prompts/buildNumPrompt.ts` |
| Ajouter `numReadingKind` dans `universalClassification.ts` | Haute | `lib/hexastra/orchestration/universalClassification.ts` |
| Étendre le sous-menu Numérologie avec les 7 types | Moyenne | `lib/hexastra/menus/getMenuForMode.ts` |
| Créer `buildNumReadingSystemPrompt()` depuis le schema | Moyenne | `lib/hexastra/prompts/buildSystemPrompt.ts` |
| Routing : mapper 7 types → `contextType`/`domainRoute` existants | Haute | `lib/hexastra/orchestration/universalClassification.ts` |

**Routing vers types existants :**

| Type | `contextType` | `domainRoute` |
|---|---|---|
| Générale | `general` | `science` |
| Identitaire | `general` | `science` |
| Relationnelle | `relationship` | `relationship` |
| Vocationnelle | `career` | `career` |
| Karmique | `energy` | `science` |
| Cyclique | `timing` | `timing` |
| Potentiel | `general` | `science` |

---

## V2 — Points à développer

| Priorité | Sujet |
|---|---|
| Haute | Calculateur numérique intégré (CV, Expression, Âme depuis nom + date) — aujourd'hui calcul côté client ou externe |
| Haute | `validateNumOutput(text, readingType)` — post-render observability |
| Moyenne | `buildNumReadingSystemPrompt()` — équivalent de `buildHoroscopeSystemPrompt` |
| Moyenne | Lecteur de Dettes karmiques intégré (détecter 13/4, 14/5, 16/7, 19/1 dans les calculs) |
| Basse | Comparaison de compatibilité numérique (Âme + CV entre deux personnes) |
| Basse | UI : nombre selector — permettre de choisir le niveau d'entrée |

## Points à résoudre avant duplication vers Human Design, Ennéagramme, Kua, Fusion

1. **CV numérologique ↔ CV HD** : conflit de terminologie. Le "Chemin de vie" existe en numérologie et en Human Design (sous forme différente). Nommer clairement les sources par science.
2. **Données calculées vs reçues** : en HD, les données viennent d'un calcul de date (comme numérologie) ; en Ennéagramme, elles viennent d'un test ou d'observation. Prévoir un champ `dataSource: 'calculated' | 'declared' | 'observed'` dans l'interface.
3. **Leçons karmiques cross-science** : l'idée de "leçon récurrente" existe dans HD (gates manquantes), Ennéagramme (angle de croissance), Kua (direction de défaut). Centraliser dans une interface `KarmicSignal` partagée.
4. **Cycles en Ennéagramme et Kua** : les cycles ne sont pas définis de la même façon. Prévoir que `cyclicData` peut être null ou une structure différente selon la science.
5. **Maturité en HD** : analogue = "définition" ou "autorité". Mapper avant duplication.
