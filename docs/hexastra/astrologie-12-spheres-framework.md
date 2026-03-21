# Architecture de lecture astrologique à 12 sphères — Hexastra Coach

> Standard interne v1.0 — usage produit, prompt, contenu, automatisation.
> Ce document est la matrice de référence de la lecture astrologique Hexastra.
> Ne pas modifier sans valider l'impact sur les 7 types de lecture et le mapping produit.

---

## Structure mère

```
Lecture astrologique Hexastra
└── 12 sphères (squelette invariant)
    ├── chaque sphère = 1 domaine de vie + données astrologiques + potentiels + clés
    ├── 7 types de lecture (angles d'entrée variables sur la même structure)
    └── mapping astrologique (1 source de vérité des données ↔ sphères)
```

Un type de lecture ne supprime pas de sphères. Il **pondère** les sphères prioritaires et **oriente** l'angle d'interprétation. La structure mère reste invariante.

---

## Partie 1 — Table maîtresse des 12 sphères

### Conventions de champ

| Champ | Description |
|---|---|
| `fonction` | Ce que cette sphère opère dans une vie |
| `révèle` | Ce qu'on lit dans cette sphère |
| `données` | Éléments astrologiques à analyser |
| `sous-catégories` | Tags internes Hexastra (identifiants système) |
| `déséquilibres` | Manifestations basses ou bloquées |
| `potentiels` | Manifestations élevées ou intégrées |
| `clé de compréhension` | Insight fondamental de cette sphère |
| `clé d'action` | Direction pratique |
| `question miroir` | Question posée à l'utilisateur (optionnelle) |

---

### Sphère 1 — Identité

**Fonction** : Affirmation de soi, présence au monde, moteur d'existence.

**Révèle** : Comment la personne se perçoit, se présente, initie, et se distingue.

**Données astrologiques** :
- Soleil (signe, maison, aspects)
- Ascendant (signe, degrés)
- Maître de l'Ascendant (position, aspects)
- Maison I (planètes, aspects à la cuspide)
- Éléments / Modalités dominants

**Sous-catégories** : `signe_solaire`, `ascendant`, `maisons`

**Déséquilibres** : Identité floue, affirmation excessive ou effacée, dépendance aux regards extérieurs.

**Potentiels** : Présence naturelle, leadership authentique, capacité à initier sans forcer.

**Clé de compréhension** : Le Soleil dit *qui je suis*. L'Ascendant dit *comment j'arrive*. Le maître dit *par où passe mon énergie*.

**Clé d'action** : Aligner la présentation extérieure avec la nature profonde.

**Question miroir** : Comment je veux être perçu, et comment j'arrive réellement ?

---

### Sphère 2 — Ressources

**Fonction** : Rapport à la matière, aux valeurs, à la sécurité construite.

**Révèle** : Comment la personne génère, possède, valorise et sécurise — argent, énergie, confiance en soi.

**Données astrologiques** :
- Vénus (signe, maison, aspects)
- Maison II (planètes, cuspide)
- Júpiter (aspects à Vénus ou la Maison II)
- Maître de la Maison II
- Éléments Terre

**Sous-catégories** : `maisons`, `planetes`

**Déséquilibres** : Dépendance matérielle, dévalorisation de soi, rapport toxique à l'argent.

**Potentiels** : Stabilité construite, abondance alignée avec les valeurs, autonomie réelle.

**Clé de compréhension** : La Maison II n'est pas que l'argent — c'est *ce que je considère comme mien*, y compris ma valeur propre.

**Clé d'action** : Identifier ce qui nourrit réellement et construire à partir de là.

**Question miroir** : Est-ce que je crée depuis l'abondance ou depuis la peur du manque ?

---

### Sphère 3 — Intelligence

**Fonction** : Traitement de l'information, communication, liens de proximité.

**Révèle** : Style de pensée, mode d'apprentissage, rapport aux mots, à la fratrie, aux environnements proches.

**Données astrologiques** :
- Mercure (signe, maison, aspects, rétrograde)
- Maison III (planètes, cuspide)
- Maître de la Maison III
- Aspects Mercure / Lune (pensée ↔ émotionnel)
- Aspects Mercure / Uranus (innovant, disruptif)

**Sous-catégories** : `planetes`, `retrograde`, `aspects`

**Déséquilibres** : Surcharge mentale, incommunicabilité, pensée dispersée ou rigide.

**Potentiels** : Pensée claire et adaptable, communication précise, curiosité productive.

**Clé de compréhension** : Mercure définit *comment* la personne pense, pas *ce* qu'elle pense.

**Clé d'action** : Adapter le canal de communication au style naturel plutôt que le forcer.

**Question miroir** : Ma façon de communiquer reflète-t-elle vraiment ce que je veux dire ?

---

### Sphère 4 — Racines

**Fonction** : Fondations émotionnelles, appartenance, foyer intérieur.

**Révèle** : Structure familiale, héritage psychologique, rapport au foyer, capacité à s'ancrer.

**Données astrologiques** :
- Lune (signe, maison, aspects)
- Maison IV (planètes, cuspide — IC)
- Maître de la Maison IV
- Aspects Lune / Saturne (discipline émotionnelle)
- Aspects Lune / Pluton (blessures profondes)

**Sous-catégories** : `signe_lunaire`, `maisons`, `aspects`

**Déséquilibres** : Insécurité émotionnelle, dépendance aux origines, incapacité à créer son propre foyer intérieur.

**Potentiels** : Ancrage solide, transmission consciente, capacité à nourrir sans s'effacer.

**Clé de compréhension** : La Lune dit *d'où je viens émotionnellement*. La Maison IV dit *où je me sens chez moi*.

**Clé d'action** : Séparer l'héritage subi de l'héritage choisi.

**Question miroir** : Qu'est-ce que j'appelle "chez moi" — et est-ce que j'y suis vraiment ?

---

### Sphère 5 — Expression

**Fonction** : Création, joie, amour romantique, projections créatives.

**Révèle** : Rapport au plaisir, à la créativité, à l'enfant intérieur, aux relations amoureuses informelles.

**Données astrologiques** :
- Soleil (force créatrice)
- Maison V (planètes, cuspide)
- Vénus (couleur de la romance)
- Maître de la Maison V
- Aspects Soleil / Mars (élan créatif)
- Aspects Vénus / Neptune (romantisme, idéalisation)

**Sous-catégories** : `signe_solaire`, `planetes`, `aspects`

**Déséquilibres** : Blocage créatif, dépendance à la validation, amour conditionnel à la performance.

**Potentiels** : Créativité fluide, joie de vivre incarnée, amour donné librement.

**Clé de compréhension** : La Maison V est *ce que je crée pour la joie de créer*, pas pour produire.

**Clé d'action** : Revenir à ce qui procure du plaisir sans justification.

**Question miroir** : Quand est-ce que je crée ou j'aime sans calculer le retour ?

---

### Sphère 6 — Équilibre

**Fonction** : Santé, rythme quotidien, rapport au travail opérationnel, service.

**Révèle** : Habitudes, gestion de l'énergie physique, rapport au corps, aux routines, au service rendu.

**Données astrologiques** :
- Mercure (gestion, organisation)
- Maison VI (planètes, cuspide)
- Maître de la Maison VI
- Virgo placements (précision, analyse)
- Aspects Saturne / Maison VI (structure vs rigidité)

**Sous-catégories** : `maisons`, `planetes`, `aspects`

**Déséquilibres** : Perfectionnisme paralysant, négligence du corps, surcharge de service ou refus de servir.

**Potentiels** : Efficacité naturelle, corps comme outil conscient, service aligné avec la vocation.

**Clé de compréhension** : La Maison VI n'est pas la carrière — c'est *comment je fonctionne au quotidien*.

**Clé d'action** : Ajuster les routines pour qu'elles soutiennent l'énergie globale plutôt qu'elles ne la drainent.

**Question miroir** : Mes habitudes quotidiennes me rapprochent-elles de qui je veux être ?

---

### Sphère 7 — Relations

**Fonction** : Partenariats durables, projections sur l'Autre, contrats, miroirs relationnels.

**Révèle** : Modèle de couple, attentes dans la relation, ce qu'on cherche (et fuit) chez l'autre, partenariats professionnels.

**Données astrologiques** :
- Vénus (valeurs en relation)
- Mars (désir, conflit)
- Maison VII (planètes, cuspide — DSC)
- Maître de la Maison VII
- Aspects Vénus / Mars
- Synastrie (si lecture relationnelle)

**Sous-catégories** : `compatibilite_astro`, `maisons`, `aspects`, `planetes`

**Déséquilibres** : Fusion, dépendance, relation miroir non consciente, peur de l'engagement ou surinvestissement.

**Potentiels** : Partenariat comme espace de croissance, complémentarité consciente, contrats équilibrés.

**Clé de compréhension** : La Maison VII révèle *ce qu'on projette sur l'autre* autant que *ce qu'on cherche*.

**Clé d'action** : Identifier la part de soi que l'autre incarne, intégrer plutôt que chercher.

**Question miroir** : Qu'est-ce que j'attends que l'autre fasse pour moi, que je pourrais faire moi-même ?

---

### Sphère 8 — Transformation

**Fonction** : Crises, mort symbolique, renaissance, héritages, intimité profonde.

**Révèle** : Rapport au changement radical, à la perte, aux ressources partagées, à l'intimité sexuelle et émotionnelle.

**Données astrologiques** :
- Pluton (transformation profonde)
- Mars (intensité, désir)
- Maison VIII (planètes, cuspide)
- Maître de la Maison VIII
- Aspects Pluton / Soleil ou Lune (mutation identitaire)
- Nœuds lunaires (karma, axes de croissance)

**Sous-catégories** : `planetes`, `maisons`, `aspects`

**Déséquilibres** : Contrôle, manipulation, peur de la perte, fixation sur ce qui est mort, résistance au changement.

**Potentiels** : Alchimie personnelle, capacité à renaître, puissance née des épreuves.

**Clé de compréhension** : La Maison VIII n'est pas la mort — c'est *la capacité à mourir à une version de soi pour en devenir une autre*.

**Clé d'action** : Identifier ce qui doit mourir pour que quelque chose de plus vrai émerge.

**Question miroir** : Qu'est-ce que je garde en vie par peur, alors que c'est terminé ?

---

### Sphère 9 — Vision

**Fonction** : Quête de sens, philosophie, expansion, enseignement, voyages intérieurs et extérieurs.

**Révèle** : Systèmes de croyances, rapport à l'étranger et aux cultures, capacité à enseigner, vision du monde.

**Données astrologiques** :
- Jupiter (expansion, foi)
- Maison IX (planètes, cuspide)
- Maître de la Maison IX
- Aspects Jupiter / Saturne (foi vs structure)
- Aspects Jupiter / Neptune (foi vs illusion)

**Sous-catégories** : `planetes`, `maisons`, `aspects`

**Déséquilibres** : Dogmatisme, dispersion idéologique, fuite dans l'idéal, incapacité à atterrir.

**Potentiels** : Vision articulée, foi productive, capacité à transmettre une perspective élargie.

**Clé de compréhension** : La Maison IX dit *ce que je crois être vrai sur le monde et sur la vie*.

**Clé d'action** : Articuler sa vision du monde de façon transmissible.

**Question miroir** : Quelle est ma philosophie réelle — celle qui guide mes choix, pas celle que je revendique ?

---

### Sphère 10 — Vocation

**Fonction** : Mission publique, réputation, trajectoire professionnelle, impact visible.

**Révèle** : Rapport à l'autorité, à la réussite, à la contribution au monde, à l'héritage construit.

**Données astrologiques** :
- Saturne (responsabilité, structure)
- Milieu du Ciel / MC (signe, planètes proches)
- Maison X (planètes)
- Maître du MC
- Aspects Saturne / Soleil (autorité personnelle)
- Aspects MC / Nœud Nord (vocation ↔ karma)

**Sous-catégories** : `vocation_astro`, `maisons`, `planetes`, `aspects`

**Déséquilibres** : Ambition déconnectée du sens, besoin de reconnaissance, peur de la visibilité ou de l'échec public.

**Potentiels** : Contribution alignée, autorité naturelle, construction d'un héritage réel.

**Clé de compréhension** : Le MC n'est pas le métier — c'est *la qualité que le monde reconnaît en toi*.

**Clé d'action** : Construire vers ce qui laisse une trace, pas ce qui impressionne à court terme.

**Question miroir** : Quelle est la contribution pour laquelle je veux être reconnu dans 20 ans ?

---

### Sphère 11 — Collectif

**Fonction** : Appartenance à un groupe, idéaux partagés, innovation, réseaux, projets collectifs.

**Révèle** : Rapport aux causes, aux amis, aux communautés, aux utopies personnelles, à la disruption.

**Données astrologiques** :
- Uranus (rupture, innovation)
- Maison XI (planètes, cuspide)
- Maître de la Maison XI
- Aspects Uranus / Soleil (individualité vs collectif)
- Saturne en Maison XI (structure dans le collectif)

**Sous-catégories** : `planetes`, `maisons`, `aspects`

**Déséquilibres** : Individualisme excessif, conformisme, idéalisme sans ancrage, dispersion entre trop de causes.

**Potentiels** : Impact collectif réel, réseaux fertiles, innovation utile.

**Clé de compréhension** : La Maison XI dit *avec qui et pour quoi je veux avancer*, pas juste *qui sont mes amis*.

**Clé d'action** : Choisir ses appartenances consciemment, pas par défaut.

**Question miroir** : Les gens que je fréquente tirent-ils ma vision vers le haut ou vers la moyenne ?

---

### Sphère 12 — Intégration

**Fonction** : Inconscient, karma, retraite intérieure, dissolution des frontières du moi.

**Révèle** : Peurs enfouies, schémas répétitifs invisibles, ressources cachées, rapport au transcendant.

**Données astrologiques** :
- Neptune (dissolution, mystique)
- Maison XII (planètes — notamment stellium)
- Nœud Sud (karma passé)
- Aspects Neptune / Lune (sensibilité extrême)
- Chiron (blessure fondatrice)

**Sous-catégories** : `maisons`, `planetes`, `aspects`

**Déséquilibres** : Auto-sabotage, victimisation, fuite dans l'addiction ou l'idéal, peurs non nommées.

**Potentiels** : Intuition profonde, guérison des schémas répétitifs, connexion au sens plus large.

**Clé de compréhension** : La Maison XII est *ce qui agit en toi avant que tu aies conscience d'agir*.

**Clé d'action** : Rendre conscient un schéma qui tourne en boucle pour en sortir.

**Question miroir** : Quel pattern est-ce que je retrouve dans tous les contextes de ma vie ?

---

## Partie 2 — Mapping astrologique

> Règle : chaque donnée astrologique est assignée à **une sphère principale**. Elle peut apparaître en secondaire dans d'autres mais n'est jamais analysée deux fois à égale profondeur dans un même rendu.

| Donnée astrologique | Sphère principale | Sphère(s) secondaire(s) |
|---|---|---|
| Soleil | 1 — Identité | 5 — Expression, 10 — Vocation |
| Lune | 4 — Racines | 6 — Équilibre, 12 — Intégration |
| Ascendant (ASC) | 1 — Identité | 7 — Relations (DSC miroir) |
| Maître de l'Ascendant | 1 — Identité | variable selon signe/maison |
| Mercure | 3 — Intelligence | 6 — Équilibre |
| Vénus | 2 — Ressources | 5 — Expression, 7 — Relations |
| Mars | 8 — Transformation | 7 — Relations, 5 — Expression |
| Jupiter | 9 — Vision | 2 — Ressources |
| Saturne | 10 — Vocation | 6 — Équilibre, 12 — Intégration |
| Uranus | 11 — Collectif | 3 — Intelligence |
| Neptune | 12 — Intégration | 9 — Vision |
| Pluton | 8 — Transformation | 1 — Identité (mutations) |
| Chiron | 12 — Intégration | sphère de la maison occupée |
| Nœud Nord | 10 — Vocation | sphère de la maison occupée |
| Nœud Sud | 12 — Intégration | sphère de la maison occupée |
| Milieu du Ciel (MC) | 10 — Vocation | 4 — Racines (axe IC/MC) |
| Maisons (I–XII) | sphère correspondante | — |
| Aspects majeurs | sphère des planètes en jeu | — |
| Éléments (Feu/Eau/Air/Terre) | 1 — Identité (profil global) | distribués selon dominance |
| Modalités (Cardinal/Fixe/Mutable) | 1 — Identité (profil global) | distribués selon dominance |
| Transits | sphère de la maison transitée | — |
| Progressions | sphère de la maison progressée | — |

---

## Partie 3 — Sous-catégories de lectures astrologiques Hexastra

### 3.1 Lecture générale

| Champ | Valeur |
|---|---|
| **Objectif** | Vue d'ensemble de la configuration natale, potentiels et dynamiques dominantes |
| **Sphères prioritaires** | 1, 4, 7, 10 (axes du thème natal) |
| **Données prioritaires** | Soleil, Lune, Ascendant, MC, aspects majeurs |
| **Répond à** | Qui suis-je ? Quelles sont mes forces et défis fondamentaux ? |
| **Profondeur** | Standard (toutes sphères présentes, 4 prioritaires développées) |
| **Format conseillé** | Synthèse narrative + points clés par axe |

### 3.2 Lecture identitaire

| Champ | Valeur |
|---|---|
| **Objectif** | Clarifier l'identité profonde, la présence, les ressources personnelles |
| **Sphères prioritaires** | 1, 2, 5, 9 |
| **Données prioritaires** | Soleil, Ascendant, maître ASC, Vénus, Jupiter |
| **Répond à** | Qui je suis vraiment ? Comment m'affirmer sans me trahir ? |
| **Profondeur** | Approfondie (sphères 1 et 2 en détail) |
| **Format conseillé** | Profil structuré + clés d'action |

### 3.3 Lecture relationnelle

| Champ | Valeur |
|---|---|
| **Objectif** | Dynamiques relationnelles, modèle de couple, projections, compatibilité |
| **Sphères prioritaires** | 7, 5, 4, 8 |
| **Données prioritaires** | Vénus, Mars, Maison VII, DSC, synastrie (si 2 thèmes) |
| **Répond à** | Comment j'aime ? Quels patterns relationnels me définissent ? |
| **Profondeur** | Standard à approfondie |
| **Format conseillé** | Axe relationnel (soi → l'autre) + projections + dynamiques |

### 3.4 Lecture vocationnelle

| Champ | Valeur |
|---|---|
| **Objectif** | Identifier la mission, le chemin de carrière aligné, les ressources professionnelles |
| **Sphères prioritaires** | 10, 6, 2, 9 |
| **Données prioritaires** | Saturne, MC, Maison X, Soleil, Nœud Nord |
| **Répond à** | Quelle est ma mission ? Vers quoi construire ? Comment utiliser mes talents ? |
| **Profondeur** | Approfondie |
| **Format conseillé** | Trajectoire + potentiels + actions concrètes |

### 3.5 Lecture karmique / transformatrice

| Champ | Valeur |
|---|---|
| **Objectif** | Patterns répétitifs, blessures fondatrices, axes de croissance profonde |
| **Sphères prioritaires** | 8, 12, 4, 1 |
| **Données prioritaires** | Pluton, Nœuds (N/S), Chiron, Saturne, Maison XII |
| **Répond à** | D'où viennent mes blocages ? Quels schémas tourner en boucle ? |
| **Profondeur** | Deep (lecture lente, symbolique, intégrative) |
| **Format conseillé** | Analyse d'axes + schémas + intégration possible |

### 3.6 Lecture créative

| Champ | Valeur |
|---|---|
| **Objectif** | Potentiel créatif, expression authentique, rapport au plaisir et à la joie |
| **Sphères prioritaires** | 5, 3, 9, 11 |
| **Données prioritaires** | Maison V, Soleil, Vénus, Uranus, Mercure |
| **Répond à** | Comment je crée ? Qu'est-ce qui me donne de la joie ? Quel est mon style ? |
| **Profondeur** | Standard |
| **Format conseillé** | Style créatif + bloquants + canaux d'expression |

### 3.7 Lecture cyclique

| Champ | Valeur |
|---|---|
| **Objectif** | Évaluer la période actuelle, les opportunités et tensions du moment |
| **Sphères prioritaires** | sphères transitées en ce moment |
| **Données prioritaires** | Transits planétaires, progressions, retrogrades actives, année personnelle |
| **Répond à** | Où en suis-je dans mon cycle ? Que fait le ciel sur mon thème maintenant ? |
| **Profondeur** | Standard (temporelle) |
| **Format conseillé** | Fenêtre temporelle + tensions + opportunités + action recommandée |

---

## Partie 4 — Format standard d'une sphère

> Format stable utilisé dans les prompts, la UI, les exports JSON/TS et les documents produit.

```
SPHÈRE [N] — [NOM EN MAJUSCULE]

id          : sphere_[n]
maison      : [I à XII]
planète     : [planète maîtresse]
axe         : [thème de vie central]

// ── Analyse ──────────────────────────
révèle      : [Ce que cette sphère montre — 1 phrase]
données     : [Données astrologiques à lire]
déséquilibres : [Manifestations basses]
potentiels  : [Manifestations élevées]

// ── Clés ──────────────────────────────
compréhension : [Insight fondamental — 1 phrase]
action        : [Direction pratique — 1 phrase impérative]
question      : [Question miroir — optionnelle]
```

---

## Partie 5 — Versions produit / système

### 5A — Version éditoriale (document stratégique)

La lecture astrologique Hexastra repose sur 12 sphères correspondant aux 12 maisons du thème natal, chaque sphère couvrant un domaine de vie précis. L'analyse part toujours des données astrologiques primaires (Soleil, Lune, Ascendant, Maîtres, aspects majeurs) et les répartit selon la sphère concernée.

Chaque type de lecture (identitaire, relationnelle, vocationnelle, etc.) active un sous-ensemble de sphères prioritaires sans supprimer les autres. Le résultat est une lecture cohérente, non répétitive, et directement exploitable par l'utilisateur.

Le système est conçu pour être duplicable : la même logique de 12 sphères peut être appliquée à d'autres sciences (Numérologie, Human Design, Ennéagramme) en substituant les données sources mais en conservant la structure d'interprétation.

### 5B — Version prompt système (injection directe)

```
SYSTÈME DE LECTURE ASTROLOGIQUE HEXASTRA — 12 SPHÈRES

Structure invariante : 12 sphères = 12 domaines de vie = squelette de toute lecture.
Chaque lecture active des sphères prioritaires et pondère les autres.
Règle absolue : aucune donnée astrologique n'est analysée deux fois dans un même rendu.

Sphères et planètes maîtresses :
1-IDENTITÉ (Soleil, Ascendant) | 2-RESSOURCES (Vénus) | 3-INTELLIGENCE (Mercure)
4-RACINES (Lune) | 5-EXPRESSION (Soleil/Vénus) | 6-ÉQUILIBRE (Mercure/Saturne)
7-RELATIONS (Vénus/Mars) | 8-TRANSFORMATION (Pluton/Mars) | 9-VISION (Jupiter)
10-VOCATION (Saturne/MC) | 11-COLLECTIF (Uranus) | 12-INTÉGRATION (Neptune/Nœuds)

Pour chaque sphère analysée :
→ Donnée(s) source : [planète ou maison concernée]
→ Révèle : [ce qu'on lit]
→ Déséquilibre possible : [ombre]
→ Potentiel : [élévation]
→ Clé de compréhension : [insight]
→ Clé d'action : [direction]
```

### 5C — Version pseudo-JSON (intégration produit)

```json
{
  "framework": "hexastra_astro_12_spheres",
  "version": "1.0",
  "spheres": [
    {
      "id": "sphere_1",
      "name": "Identité",
      "house": 1,
      "ruler": ["Soleil", "Ascendant"],
      "reveals": "Affirmation de soi, présence, moteur d'existence",
      "astro_inputs": ["signe_solaire", "ascendant", "maison_I", "maitre_asc"],
      "imbalance": "Identité floue ou excessive, dépendance aux regards",
      "potential": "Présence naturelle, leadership authentique",
      "key_understanding": "Soleil = qui je suis. ASC = comment j'arrive.",
      "key_action": "Aligner présentation extérieure et nature profonde",
      "mirror_question": "Comment je veux être perçu, et comment j'arrive réellement ?"
    }
    // ... sphères 2 à 12
  ],
  "reading_types": [
    {
      "id": "general",
      "name": "Lecture générale",
      "priority_spheres": [1, 4, 7, 10],
      "priority_data": ["signe_solaire", "signe_lunaire", "ascendant", "theme_natal"],
      "depth": "standard",
      "render": "synthesis"
    }
    // ... autres types
  ]
}
```

---

## Partie 6 — Règles de cohérence

### 6.1 Éviter les doublons entre sphères

- Chaque planète est assignée à **une sphère principale** dans le mapping (Partie 2).
- Dans un rendu, une planète n'est jamais analysée deux fois à égale profondeur.
- Exception légitime : les planètes qui participent à un aspect majeur (ex : Vénus carré Pluton touche à la fois la sphère 2 et la sphère 8) — l'aspect est traité dans la sphère la plus active du transit.

### 6.2 Répartir les données astrologiques

- Priorité 1 : Soleil, Lune, Ascendant → toujours présents (sphères 1 et 4 systématiquement lues).
- Priorité 2 : planètes personnelles (Mercure, Vénus, Mars) → activées selon le type de lecture.
- Priorité 3 : planètes sociales (Jupiter, Saturne) → activées sur lectures vocationnelle, cyclique, transformatrice.
- Priorité 4 : planètes transpersonnelles (Uranus, Neptune, Pluton) → activées sur lectures de fond (karma, vision, collectif).
- Priorité 5 : Nœuds, Chiron, progressions → lectures approfondies uniquement.

### 6.3 Garder profondeur et lisibilité

- En lecture standard : 4 sphères prioritaires développées + 8 autres en mention ou aperçu.
- En lecture approfondie : 6–8 sphères développées + synthèse.
- En lecture deep : toutes les sphères pertinentes, tempo lent, intégration.
- Règle : 1 sphère = 1 bloc de rendu = 1 clé de compréhension + 1 clé d'action. Jamais de conclusion générique.

### 6.4 Faire varier l'angle sans casser la structure

- La structure des 12 sphères ne change pas selon le type de lecture.
- Ce qui varie : les sphères activées en prioritaire, le ton (analyse vs action vs transformation), et la profondeur par sphère.
- Un système de pondération (sphères primaires / secondaires / contextuelles) suffit à couvrir tous les cas sans multiplication de templates.

### 6.5 Réutilisation sur d'autres sciences

- La structure des 12 sphères peut s'appliquer à Numérologie, Human Design, Ennéagramme, Kua.
- Ce qui change : les `astro_inputs` → remplacés par les données sources de chaque science.
- Ce qui reste : les 12 domaines de vie, les fonctions des sphères, les types de lecture.
- Principe : **même squelette, données différentes** → produit cohérent cross-science.

---

## Recommandations produit

### Comment intégrer cette architecture dans Hexastra Coach

1. **Menu astrologie** — ajouter les 7 types de lecture comme entrées de sous-menu (remplace ou complète les entrées actuelles Signes / Maisons / Aspects).

2. **Routing** — mapper chaque type de lecture à un `DomainRoute` et `ContextType` existants :
   - `lecture_identitaire` → `contextType: 'general'`, `domainRoute: 'science'`
   - `lecture_relationnelle` → `contextType: 'relationship'`, `domainRoute: 'relationship'`
   - `lecture_vocationnelle` → `contextType: 'career'`, `domainRoute: 'career'`
   - `lecture_cyclique` → `contextType: 'timing'`, `domainRoute: 'timing'`
   - `lecture_transformatrice` → `contextType: 'energy'`, `domainRoute: 'science'`

3. **Prompt système** — injecter la version 5B (prompt-ready) dans `buildSystemPrompt` quand `science = 'astrologie'` et `flowStep = 'analysis'` ou `'deep_reading'`.

4. **Données sources** — `buildHoroscopeDataBlock` est le modèle à suivre pour `buildAstroReadingDataBlock` (à créer). Mêmes champs : Soleil, Lune, Ascendant, MC, aspects majeurs, transits actifs.

5. **Validation** — créer un `ASTRO_READING_REQUIRED_BLOCKS` par type de lecture (sur le modèle de `DAILY_REQUIRED_BLOCKS`), utilisable dans un `validateAstroOutput` post-render.

6. **Duplication** — avant de dupliquer sur Numérologie / HD / Ennéagramme / Kua :
   - Valider que les 12 domaines de vie sont stables et non redondants.
   - Créer une interface `SphereDefinition` générique (voir `astrologie-12-spheres-schema.ts`).
   - Construire un `ScienceFramework` qui contient : `scienceKey` + `spheres[]` + `readingTypes[]` + `dataMapping`.

---

## V2 — Points à développer

| Priorité | Sujet |
|---|---|
| Haute | `buildAstroReadingDataBlock(...)` — equivalent de `buildHoroscopeDataBlock` pour les lectures thème natal |
| Haute | `ASTRO_READING_REQUIRED_BLOCKS` par type de lecture — validation post-render |
| Haute | Routing enrichi : `astroReadingKind` comme champ de classification (analogue à `requestKind`) |
| Moyenne | Système de pondération des sphères dans le payload — sphères actives vs contextuelles |
| Moyenne | Duplication du framework vers Numérologie (chemin de vie ↔ 12 sphères de vie) |
| Basse | UI : sphère selector — permettre à l'utilisateur de choisir son axe d'entrée |
| Basse | Export PDF structuré par sphère (rendu premium) |

## Points à résoudre avant duplication vers autres sciences

1. **Stabilité des 12 domaines** : s'assurer que les 12 domaines de vie sont universels (non spécifiques à l'astrologie) avant de les réutiliser comme squelette cross-science.
2. **Nomenclature** : nommer les sphères de façon neutre (non-astrologique) dans l'interface `SphereDefinition` → les noms actuels peuvent rester en `label` mais l'`id` doit être générique (`sphere_1` à `sphere_12`).
3. **Données sources** : chaque science doit fournir son propre `dataMapping` (Numérologie : chemin de vie → sphère 10 / Vocation, etc.).
4. **Types de lecture** : certains types sont cross-science (relationnelle, vocationnelle, cyclique) — à centraliser dans un fichier de configuration partagé.
5. **Test de cohérence** : une fois le deuxième framework créé (ex : Numérologie), vérifier qu'aucun `id` ou `readingType` n'entre en conflit dans le routeur.
