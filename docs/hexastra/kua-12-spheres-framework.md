# Architecture de lecture Kua à 12 sphères — Hexastra Coach

> Standard interne v1.0 — table-first, sans prose.
> Schéma TypeScript : `kua-12-spheres-schema.ts`
> Référence Ennéagramme : `enneagramme-12-spheres-framework.md`

---

## Structure mère

```
Lecture Kua Hexastra
└── 12 sphères (squelette invariant)
    ├── chaque sphère = 1 domaine de vie + données Kua + potentiels + clés
    ├── 8 types de lecture (angles variables, structure mère invariante)
    └── mapping Kua (1 source de vérité : donnée → sphère principale)
```

**Distinction fondamentale Kua :**

| Catégorie | Données | Nature |
|---|---|---|
| Structure | Nombre Kua, Groupe Kua (Est/Ouest), Trigramme | Fixe — calculé depuis date de naissance + sexe |
| Élémentaire | Élément Kua, cycles de production/destruction | Fixe — dérivé du nombre Kua |
| Directionnel | 4 directions favorables (Sheng Chi, Tien Yi, Nien Yen, Fu Wei) | Fixe — propre au groupe Kua |
| Directionnel défavorable | 4 directions défavorables (Ho Hai, Wu Gui, Liu Sha, Jue Ming) | Fixe — propre au groupe Kua |
| Spatial | Orientation bureau, orientation lit, secteur maison | Variable — dépend de l'espace physique occupé |
| Cyclique | Étoile annuelle, Cycle Ki (9 étoiles) | Variable — évolue annuellement |

---

## Partie 1 — Table maîtresse des 12 sphères

| # | Sphère | Source Kua principale | Révèle | Déséquilibre | Potentiel |
|---|---|---|---|---|---|
| 1 | **Identité** | Nombre Kua + Groupe Kua | Nature énergétique fondamentale — le nombre Kua et le groupe (Est ou Ouest) structurent toute la lecture et déterminent les directions compatibles | Ignorer l'appartenance de groupe, forcer des directions contraires à la nature Kua — dépense d'énergie constante sans résultat | Alignement conscient avec sa nature Kua — chaque décision et chaque espace amplifient l'énergie naturelle plutôt que de la contrarier |
| 2 | **Ressources** | Direction Sheng Chi + Orientation bureau | Direction d'abondance et orientation matérielle — l'axe le plus favorable pour générer succès, opportunités et abondance, appliqué à l'espace de travail | Bureau orienté vers une direction défavorable, dos à la porte, secteur Sheng Chi bloqué — énergie de réussite constamment freinée | Espace de travail aligné avec Sheng Chi — flux d'opportunités amplifié, énergie de prospérité activée naturellement |
| 3 | **Intelligence** | Direction Fu Wei + Élément Kua | Direction de développement personnel et clarté mentale — l'axe qui soutient la concentration, l'introspection et la croissance intérieure stable | Espace d'étude ou de réflexion orienté vers une direction défavorable — pensée confuse, décisions brouillées, apprentissage ralenti | Concentration amplifiée, clarté dans les choix, croissance personnelle soutenue par l'alignement spatial |
| 4 | **Racines** | Trigramme + Élément Kua | Archétype énergétique profond et nature fondamentale — le trigramme et l'élément Kua révèlent les cycles naturels de renforcement et les besoins d'ancrage élémentaire | Environnement saturé d'éléments destructeurs de l'élément personnel — affaiblissement chronique de l'énergie vitale sans cause apparente | Environnement qui nourrit et renforce l'élément personnel — vitalité naturelle, ancrage solide, cohérence entre nature interne et espace externe |
| 5 | **Expression créative** | Élément Kua | Cycle créatif et élément nourricier — l'élément qui génère l'élément Kua dans le cycle de production, source d'inspiration et d'énergie créatrice naturelle | Espace de création dominé par l'élément destructeur — créativité constamment freinée, expression laborieuse, énergie créative épuisée | Expression fluide, inspiration naturelle, projets créatifs portés par l'énergie de génération |
| 6 | **Équilibre** | Direction Ho Hai + Étoile annuelle | Zone de friction légère et rythme du cycle actuel — Ho Hai (obstacles mineurs) et l'étoile annuelle qui colore le rythme quotidien de l'année en cours | Secteur Ho Hai activé sans neutralisation, étoile annuelle défavorable ignorée — accumulation d'obstacles mineurs qui épuisent sur la durée | Obstacles transformés en apprentissages — Ho Hai neutralisé, cycle annuel intégré dans le rythme de vie pour agir au bon moment |
| 7 | **Relations** | Direction Nien Yen + Groupe Kua | Direction de longévité relationnelle et compatibilité de groupe — l'axe qui favorise les relations durables, la romance et l'harmonie — et la compatibilité Est/Ouest | Chambre ou espace de vie commun mal orienté, relations avec des personnes de groupe opposé sans conscience — tension relationnelle récurrente | Espace de vie aligné avec Nien Yen — relations harmonieuses, attraction naturelle de partenaires compatibles, longévité des liens |
| 8 | **Transformation** | Directions Jue Ming + Liu Sha + Wu Gui | Les trois directions les plus défavorables — Jue Ming (destin brisé), Liu Sha (6 blessures), Wu Gui (5 fantômes) — zones à identifier et neutraliser activement | Secteurs Jue Ming et Liu Sha actifs sans correction — drainage énergétique profond, obstacles majeurs répétés, santé fragilisée | Neutralisation consciente et stratégique des secteurs défavorables — transformation de la vulnérabilité en espace protégé et stable |
| 9 | **Vision** | Direction Tien Yi + Orientation lit | Direction de santé et de bénédiction — l'axe qui soutient la récupération profonde, l'intuition et la vision à long terme | Lit orienté vers une direction défavorable, secteur Tien Yi bloqué — sommeil peu récupérateur, intuition voilée, santé sous-optimale | Sommeil profond et récupérateur, intuition aiguisée, santé naturellement soutenue — le repos aligne corps et trajectoire |
| 10 | **Vocation** | Direction Sheng Chi + Groupe Kua + Élément Kua | Trajectoire professionnelle et alignement vocationnel — comment la nature énergétique (groupe, direction Sheng Chi, élément) oriente la mission de vie | Carrière construite contre le groupe énergétique naturel, trajectoire ignorant la direction Sheng Chi — effort chronique sans résultat proportionnel | Mission de vie incarnée dans l'énergie naturelle — réussite sans résistance, opportunités qui semblent venir naturellement |
| 11 | **Collectif** | Groupe Kua + Cycle Ki | Compatibilité de groupe et dynamiques collectives — groupe Est/Ouest dans les dynamiques collectives et le cycle Ki pour le timing de contribution | Immersion durable dans des groupes de nature énergétique opposée sans conscience — friction collective chronique, contribution mal placée dans le temps | Contribution dans les bons groupes au bon timing cyclique — impact amplifié par l'alignement de groupe et de cycle |
| 12 | **Intégration** | Secteur maison + Cycle Ki + Étoile annuelle | La maison dans sa globalité comme amplificateur de vie — comment l'ensemble des secteurs, l'étoile annuelle et le cycle Ki s'intègrent en un système cohérent | Maison globalement désalignée — plusieurs secteurs défavorables actifs simultanément, cycles ignorés — drainage énergétique diffus et constant | Maison comme système vivant aligné — chaque secteur soutient une dimension de vie, les cycles informent le timing des actions |

**Clés par sphère :**

| # | Clé de compréhension | Clé d'action | Question miroir |
|---|---|---|---|
| 1 | Le nombre Kua n'est pas une étiquette — c'est la fréquence énergétique naturelle à partir de laquelle tout s'organise. | Calculer son nombre Kua, identifier son groupe et noter les décisions majeures prises contre sa nature de groupe. | Est-ce que mes choix principaux sont alignés avec mon groupe énergétique naturel ? |
| 2 | Sheng Chi est la direction de plus forte potentialisation — s'y orienter au bureau signifie travailler avec le flux énergétique, pas contre lui. | Identifier la direction Sheng Chi personnelle et vérifier l'orientation actuelle du bureau et de la chaise de travail. | Mon espace de travail me soutient-il ou me fatigue-t-il énergétiquement ? |
| 3 | Fu Wei est la direction de stabilité et de croissance douce — idéale pour étudier, réfléchir et construire à long terme sans épuisement. | Identifier la direction Fu Wei et aligner le bureau d'étude, la chaise de méditation ou l'espace de lecture. | Est-ce que j'ai un espace physique qui soutient vraiment ma clarté mentale ? |
| 4 | Le trigramme révèle l'archétype — l'élément révèle la dynamique. Ensemble, ils donnent la clé de l'équilibre intérieur. | Identifier l'élément nourricier de son élément Kua et introduire cet élément dans l'espace de vie principal. | Mon environnement immédiat renforce-t-il mon énergie ou la draine-t-il progressivement ? |
| 5 | Chaque élément est nourri par un autre — travailler avec cet élément nourricier amplifie naturellement la capacité d'expression. | Identifier l'élément qui nourrit son élément Kua et l'intégrer dans l'espace créatif (couleurs, matières, formes). | Mon espace créatif me ressource-t-il ou m'épuise-t-il esthétiquement ? |
| 6 | Ho Hai est la direction la moins défavorable — traitable par des ajustements simples. L'ignorer transforme les petits obstacles en friction chronique. | Identifier le secteur Ho Hai de sa maison ou de son bureau et appliquer un correctif élémentaire (couleur, plante, cristal selon l'élément). | Quels obstacles récurrents pourraient venir d'un secteur énergétique mal géré dans mon espace ? |
| 7 | Nien Yen signifie "prolonger les années" — c'est la direction qui donne de la durée et de la profondeur aux liens. | Identifier la direction Nien Yen et vérifier l'orientation de la chambre et du coin repas — principaux espaces relationnels. | Mon espace de vie soutient-il les relations que je veux construire ? |
| 8 | Ces directions ne sont pas à fuir mais à neutraliser — un secteur défavorable géré est moins problématique qu'un secteur favorable mal utilisé. | Localiser les secteurs Jue Ming, Liu Sha et Wu Gui dans la maison et placer des éléments correctifs dans chacun (selon le cycle d'éléments). | Y a-t-il des zones dans mon espace de vie que j'évite ou qui semblent systématiquement problématiques ? |
| 9 | Tien Yi est la direction du "médecin du ciel" — bien orienté pendant le sommeil, le corps se régénère dans son flux énergétique naturel. | Identifier la direction Tien Yi et aligner la tête du lit dans cette direction pour activer la récupération nocturne. | Mon espace de repos soutient-il vraiment ma récupération et ma santé ? |
| 10 | La vocation n'est pas séparée de la nature énergétique — quand groupe, direction et élément s'alignent, la contribution devient naturelle. | Identifier comment son groupe Kua se manifeste dans sa trajectoire actuelle et si Sheng Chi est activé dans son espace professionnel. | Est-ce que ma trajectoire professionnelle va dans le sens de mon énergie ou contre elle ? |
| 11 | Un groupe Est ne fonctionnera pas toujours harmonieusement avec un groupe Ouest sans conscience — mais la friction peut être transformée en complémentarité. | Identifier le groupe Kua de ses partenaires principaux (associés, proches) et observer si les tensions correspondent à des incompatibilités de groupe. | Est-ce que les groupes dans lesquels j'évolue amplifient mon énergie ou la drainent ? |
| 12 | L'intégration n'est pas la perfection de tous les secteurs — c'est la conscience de l'ensemble et l'ajustement progressif prioritaire. | Faire un audit des 8 secteurs de la maison, identifier les 2-3 plus actifs et prioritaires, et planifier les ajustements dans l'ordre d'urgence. | Est-ce que ma maison reflète et soutient la vie que je veux construire ? |

---

## Partie 2 — Mapping Kua

**Règle** : chaque donnée appartient à une sphère principale. Elle peut être lue en secondaire dans d'autres mais n'est jamais analysée deux fois à égale profondeur.

| Donnée Kua | Sphère principale | Sphères secondaires | Nature |
|---|---|---|---|
| nombre_kua | 1 — Identité | 10 — Vocation | structure |
| groupe_kua | 1 — Identité | 7 — Relations, 10 — Vocation, 11 — Collectif | structure |
| element_kua | 4 — Racines | 5 — Expression créative, 10 — Vocation | elementaire |
| trigramme | 4 — Racines | 1 — Identité | structure |
| direction_sheng_chi | 2 — Ressources | 10 — Vocation | directionnel |
| direction_tien_yi | 9 — Vision | 7 — Relations | directionnel |
| direction_nien_yen | 7 — Relations | 9 — Vision | directionnel |
| direction_fu_wei | 3 — Intelligence | 12 — Intégration | directionnel |
| direction_ho_hai | 6 — Équilibre | 8 — Transformation | directionnel |
| direction_wu_gui | 8 — Transformation | 6 — Équilibre | directionnel |
| direction_liu_sha | 8 — Transformation | — | directionnel |
| direction_jue_ming | 8 — Transformation | — | directionnel |
| orientation_bureau | 2 — Ressources | 3 — Intelligence | spatial |
| orientation_lit | 9 — Vision | 7 — Relations | spatial |
| secteur_maison | 12 — Intégration | tous secteurs | spatial |
| etoile_annuelle | 6 — Équilibre | 12 — Intégration | cyclique |
| cycle_ki | 11 — Collectif | 12 — Intégration, 6 — Équilibre | cyclique |

**Tiers de priorité des données :**

| Tier | Données | Toujours présent |
|---|---|---|
| 1 — Structure | Nombre Kua, Groupe, Élément, Trigramme | Oui |
| 2 — Directions favorables | Sheng Chi, Tien Yi, Nien Yen, Fu Wei | Standard et au-dessus |
| 3 — Directions défavorables | Ho Hai, Wu Gui, Liu Sha, Jue Ming | Lectures environnement et deep |
| 4 — Spatial | Orientation bureau, orientation lit, secteur maison | Lectures environnement, orientation, stratégique |
| 5 — Cyclique | Étoile annuelle, Cycle Ki | Lectures cyclique, décisionnelle |

---

## Partie 3 — Types de lecture Kua Hexastra

| ID | Nom | Sphères prioritaires | Données prioritaires | Profondeur | Format |
|---|---|---|---|---|---|
| `general` | Générale | 1, 4, 7, 10 | Nombre Kua, Groupe, Trigramme, Nien Yen | standard | synthesis |
| `identitaire` | Identitaire | 1, 4, 5, 3 | Nombre Kua, Trigramme, Élément, Fu Wei | approfondie | structured |
| `relationnelle` | Relationnelle | 7, 1, 4, 11 | Nien Yen, Groupe (compatibilité), Tien Yi | standard | structured |
| `decisionnelle` | Décisionnelle ★ | 3, 2, 10, 6 | Fu Wei, Sheng Chi, Groupe, Étoile annuelle | approfondie | structured |
| `orientation` | Orientation de vie ★ | 2, 9, 3, 10 | Sheng Chi, Tien Yi, Fu Wei, Groupe | approfondie | structured |
| `environnement` | Environnement ★ | 6, 8, 2, 9 | Ho Hai, Jue Ming+Liu Sha+Wu Gui, Bureau, Lit | standard | structured |
| `cyclique` | Cyclique | 6, 11, 10, 12 | Étoile annuelle, Cycle Ki, Groupe | standard | synthesis |
| `strategique` | Alignement stratégique ★ | 10, 2, 9, 7 | Sheng Chi (voc.), Tien Yi, Nien Yen, Groupe | approfondie | structured |

> **NOTE** : les lectures `decisionnelle`, `orientation`, `environnement` et `strategique` sont uniques ou fortement spécifiques au Kua — elles n'ont pas d'équivalent direct dans les autres sciences Hexastra. `decisionnelle` intègre le timing cyclique (étoile annuelle) dans la prise de décision spatiale ; `orientation` cartographie l'espace physique complet (bureau, lit) selon les directions personnelles ; `environnement` est la seule lecture qui déploie les quatre directions défavorables ; `strategique` aligne vocation, santé et relations autour des trois meilleures directions Kua.

**Détail par type :**

### Lecture générale
- **Objectif** : Vue d'ensemble de la configuration Kua — Nombre Kua, Groupe, Trigramme et direction relationnelle Nien Yen
- **Répond à** : Qui suis-je selon mon Kua ? Quelle est ma nature énergétique ? Quelles directions structurent ma vie ?

### Lecture identitaire
- **Objectif** : Clarifier l'identité profonde via Nombre Kua + Trigramme + Élément + direction Fu Wei
- **Répond à** : Quelle est ma nature vibratoire fondamentale ? Comment l'élément Kua se manifeste dans ma vie ?

### Lecture relationnelle
- **Objectif** : Dynamiques relationnelles via Nien Yen, compatibilité de groupe Est/Ouest et Tien Yi
- **Répond à** : Comment mon énergie naturelle influence mes relations ? Y a-t-il compatibilité de groupe avec mes proches ?

### Lecture décisionnelle
- **Objectif** : Aligner les décisions avec Fu Wei (clarté), Sheng Chi (opportunités), groupe et timing cyclique
- **Répond à** : Dans quelle direction orienter mes décisions clés ? Le timing actuel (étoile annuelle) est-il favorable ?

### Lecture orientation de vie
- **Objectif** : Cartographier l'espace physique complet — Sheng Chi (travail), Tien Yi (santé), Fu Wei (étude), groupe (trajectoire)
- **Répond à** : Mes espaces physiques (bureau, chambre) soutiennent-ils mes objectifs de vie ? Comment les optimiser ?

### Lecture environnement
- **Objectif** : Audit complet des directions — favorables (Sheng Chi, Tien Yi) et défavorables (Ho Hai, Jue Ming, Liu Sha, Wu Gui) — dans l'espace de vie
- **Répond à** : Quels secteurs de ma maison ou de mon bureau drainent mon énergie ? Comment neutraliser les zones défavorables ?

### Lecture cyclique
- **Objectif** : Lire le timing de vie à travers l'étoile annuelle, le cycle Ki et le groupe Kua
- **Répond à** : Quelle est l'énergie de l'année en cours pour mon Kua ? Quel est le bon timing pour agir, consolider ou me retirer ?

### Lecture alignement stratégique
- **Objectif** : Aligner vocation (Sheng Chi), santé (Tien Yi), relations (Nien Yen) et groupe pour une stratégie de vie cohérente
- **Répond à** : Comment aligner ma trajectoire professionnelle, ma santé et mes relations dans une stratégie unifiée ?

---

## Partie 4 — Format standard d'une sphère

```
SPHÈRE [N] — [NOM EN MAJUSCULE]

id          : sphere_[n]
source      : [données Kua principales]
nature      : structure | directionnel | elementaire | spatial | cyclique

// ── Analyse ──────────────────────────
révèle      : [Ce que cette sphère montre — 1 phrase]
données     : [Données Kua à injecter]
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
  "framework": "hexastra_kua_12_spheres",
  "version": "1.0",
  "science": "kua",
  "spheres": [
    {
      "id": "sphere_1",
      "name": "Identité",
      "primaryData": ["nombre_kua", "groupe_kua"],
      "dataNature": "structure",
      "axis": "Nature énergétique fondamentale, appartenance de groupe, vibration personnelle",
      "reveals": "Le nombre Kua et le groupe (Est ou Ouest) — la nature énergétique qui structure toute la lecture et détermine les directions compatibles avec la personne.",
      "imbalance": "Ignorer l'appartenance de groupe, forcer des directions contraires à la nature Kua — dépense d'énergie constante sans résultat.",
      "potential": "Alignement conscient avec sa nature Kua — chaque décision et chaque espace amplifient l'énergie naturelle plutôt que de la contrarier.",
      "keyUnderstanding": "Le nombre Kua n'est pas une étiquette — c'est la fréquence énergétique naturelle à partir de laquelle tout s'organise.",
      "keyAction": "Calculer son nombre Kua, identifier son groupe et noter les décisions majeures prises contre sa nature de groupe.",
      "mirrorQuestion": "Est-ce que mes choix principaux sont alignés avec mon groupe énergétique naturel ?"
    }
  ],
  "readingTypes": [
    {
      "id": "strategique",
      "prioritySpheres": [10, 2, 9, 7],
      "priorityData": ["direction_sheng_chi", "direction_tien_yi", "direction_nien_yen", "groupe_kua"],
      "depth": "approfondie",
      "render": "structured"
    }
  ],
  "dataMapping": [
    {
      "key": "nombre_kua",
      "primarySphere": "sphere_1",
      "secondarySpheres": ["sphere_10"],
      "nature": "structure"
    }
  ]
}
```

---

## Partie 6 — Règles de cohérence

1. **Anti-doublon** — Sheng Chi analysé en sphère 2 (espace bureau) uniquement. En sphère 10 : c'est la trajectoire vocationnelle globale (groupe + élément), pas Sheng Chi redécrit.
2. **Tier 1 obligatoire** — Nombre Kua + Groupe présents dans tout rendu. Trigramme + Élément au minimum en mention secondaire.
3. **Directions favorables ≠ défavorables** — Sphères 2/3/7/9 lisent les directions favorables. Sphère 8 lit les directions défavorables. Jamais mélangées dans la même sphère.
4. **Deep only** — Liu Sha, Wu Gui et Jue Ming détaillés uniquement en lecture environnement ou deep.
5. **Spatial = données Tier 4** — Orientations bureau/lit uniquement en lectures orientation, environnement, stratégique. Pas en lecture générale.
6. **Cyclique = contextuel** — Étoile annuelle et cycle Ki uniquement en lecture cyclique, décisionnelle ou stratégique.
7. **1 sphère = 1 bloc** — révélation + déséquilibre + potentiel + clé + action. Pas de liste de directions sans ancrage humain.

---

## Recommandations produit

| Action | Priorité | Fichier cible |
|---|---|---|
| Créer `buildKuaDataBlock(raw)` | Haute | `lib/hexastra/prompts/buildKuaPrompt.ts` |
| Ajouter `kuaReadingKind` dans `universalClassification.ts` | Haute | `lib/hexastra/orchestration/universalClassification.ts` |
| Routing 8 types → `contextType` / `domainRoute` | Haute | `lib/hexastra/orchestration/universalClassification.ts` |
| Sous-menu Kua — 8 types | Moyenne | `lib/hexastra/menus/getMenuForMode.ts` |
| Créer `buildKuaReadingSystemPrompt()` dans buildSystemPrompt | Moyenne | `lib/hexastra/prompts/buildSystemPrompt.ts` |
| `validateKuaOutput(text, readingType)` — post-render observability | Haute | `lib/hexastra/prompts/buildKuaPrompt.ts` |

**Routing vers types existants :**

| Type | `contextType` | `domainRoute` |
|---|---|---|
| Générale | `general` | `science` |
| Identitaire | `general` | `science` |
| Relationnelle | `relationship` | `relationship` |
| Décisionnelle | `general` | `science` |
| Orientation de vie | `general` | `science` |
| Environnement | `energy` | `science` |
| Cyclique | `timing` | `timing` |
| Alignement stratégique | `career` | `career` |

---

## Section "Duplication cross-science"

Points à résoudre avant Kua → Fusion Hexastra :

| Science | Conflit / Point d'attention |
|---|---|
| Ennéagramme | "Centre" Kua (directions cardinales) ≠ "Centre d'intelligence" Ennéagramme (Corps / Cœur / Tête). Préfixer `kuaDirection` vs `enneaCenter` dans les interfaces partagées. |
| Human Design | `variable` HD (PHS — environnement/nutrition) partiellement superposé avec `orientation_bureau` Kua. Ne pas mapper directement — logiques différentes (corporelle vs directionnelle). |
| Numérologie | Cycle Ki 9 étoiles Kua (annuel) partiellement superposé avec Année personnelle Numérologique. Décider d'une complémentarité ou séparation stricte dans Fusion avant implémentation. |
| Fusion Hexastra | `dataSource: 'calculated'` pour le Kua (date de naissance + sexe). Champ obligatoire dans l'interface commune cross-science — différent de `'observed'` (Ennéagramme). |
| Fusion Hexastra | Sheng Chi (Kua) + Chemin de Vie (Numérologie) + Stratégie (HD) couvrent tous partiellement la "direction de réussite". Décider d'un arbitrage ou d'une complémentarité dans la lecture Fusion avant de mutualiser le champ. |
