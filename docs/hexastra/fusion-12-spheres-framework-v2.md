# HexAstra Fusion — Architecture 12 sphères v2

> Standard interne v2.0 — table-first, -60% prose vs v1.
> Schéma TypeScript : `fusion-12-spheres-schema-v2.ts`
> Prompt-ready : `fusion-12-spheres-prompt-ready.md`
> Routing contextuel : `fusion-questions-generales-routing.md`

---

## Principe d'orchestration

| Règle | Application |
|---|---|
| 1-2 sciences leads par sphère | Source primaire du contenu — analyse en profondeur |
| 1-2 sciences support par sphère | Précision ou angle complémentaire non redondant |
| Science absente = 0 mention | Ne pas forcer une science si elle n'apporte rien de distinct |
| Anti-doublon strict | Chaque donnée analysée une seule fois, dans sa sphère principale |
| Mode contextuel | Max 3 sphères actives pour une question libre — jamais la matrice complète |

---

## 12 sphères — table maîtresse

| # | Sphère | Fonction | Révèle | Sciences leads | Sciences support | Déséquilibre | Potentiel |
|---|---|---|---|---|---|---|---|
| 1 | **Identité** | Ancrer qui on est | Nature fondamentale multi-couches | Ennéagramme (type + centre), Astrologie (Soleil + ASC) | HD (Type + Profil), Numérologie (CV) | Masque social, confusion identitaire | Cohérence entre essence et expression |
| 2 | **Ressources** | Identifier ce qu'on mobilise | Énergie disponible, capacités natives | HD (centres définis), Numérologie (Expression) | Kua (Sheng Chi), Astrologie (M2 + Vénus) | Gestion chaotique, sous-utilisation | Énergie juste et durable |
| 3 | **Intelligence** | Cartographier le traitement de l'info | Mode cognitif, biais mentaux | Ennéagramme (fixation + centre mental), Astrologie (Mercure) | HD (Variable/Cognition), Numérologie (Âme) | Surmenage, distorsion perceptive | Clarté cognitive, communication alignée |
| 4 | **Racines** | Exposer les patterns fondateurs | Peurs profondes, blessures héritées | Ennéagramme (peur + blessure), Astrologie (Lune) | Numérologie (dettes/leçons karmiques), Kua (Trigramme + Élément) | Réactivité, conditionnements actifs | Stabilité émotionnelle, ancrage |
| 5 | **Expression créative** | Révéler comment on crée | Canal expressif, vitalité créatrice | Astrologie (M5 + Vénus), Ennéagramme (Vertu) | Kua (élément nourricier), HD (canaux) | Blocage créatif, expression forcée | Fluidité créative, joie d'exprimer |
| 6 | **Équilibre** | Mesurer l'état fonctionnel | Rythmes, tensions, cycle actif | Kua (Ho Hai + étoile annuelle), Ennéagramme (passion + santé) | Numérologie (défis), Astrologie (M6) | Épuisement, boucles d'insatisfaction | Santé durable, rythme soutenable |
| 7 | **Relations** | Décoder les dynamiques relationnelles | Attachement, besoins, patterns | Astrologie (Vénus + M7), Ennéagramme (style rel. + SX) | Kua (Nien Yen + groupe), HD (Stratégie) | Dépendance, évitement, conflits répétés | Relationnel conscient et nourri |
| 8 | **Transformation** | Cartographier les zones de mutation | Ombres actives, mécanismes défensifs | Ennéagramme (mécanisme + flèche désint.), Astrologie (Pluton + M8) | HD (Non-Soi), Kua (directions défavorables) | Résistance, sabotage inconscient | Puissance transformatrice consciente |
| 9 | **Vision** | Orienter vers un sens | Aspirations, boussole de vie | Astrologie (Jupiter + M9), HD (Croix d'Incarnation) | Kua (Tien Yi), Ennéagramme (flèche int. + idée sacrée) | Nihilisme, dispersion | Sens clair, direction alignée |
| 10 | **Vocation** | Définir la contribution | Mission, positionnement, trajectoire | Numérologie (CV + Expression), HD (Type + Profil + Stratégie) | Astrologie (Saturne + M10), Kua (Sheng Chi voc.) | Positionnement faux, effort sans résultat | Contribution maximale, reconnaissable |
| 11 | **Collectif** | Situer dans un réseau | Rôle social, appartenance, timing | HD (circuit dominant), Astrologie (M11 + Uranus) | Ennéagramme (sous-type SO), Kua (groupe + cycle Ki) | Isolement, contribution mal positionnée | Impact collectif conscient |
| 12 | **Intégration** | Synthétiser cycles et contexte | Timing de vie, cycles actifs | Numérologie (Pinnacles + Périodes), Kua (secteur + cycle Ki) | Astrologie (M12 + transits), Ennéagramme (tri-type) | Hors timing, résistance cyclique | Alignement avec les cycles de vie |

**Clés par sphère :**

| # | Clé de compréhension | Clé d'action | Question miroir |
|---|---|---|---|
| 1 | Chaque science révèle une couche différente — aucune n'est la vérité complète. | Nommer ses motivations réelles au-delà des rôles. | En quoi mon identité vécue diffère-t-elle de mon essence ? |
| 2 | Les ressources fiables sont celles inscrites dans la structure — pas celles conditionnées. | Distinguer ce qu'on mobilise nativement de ce qu'on force. | Qu'est-ce que je mobilise versus ce que je compense ? |
| 3 | La fixation cognitive est un filtre — pas la réalité. La reconnaître est déjà de la liberté. | Identifier sa fixation et observer combien de fois elle tourne dans une journée. | Quelle distorsion récurrente filtre ma perception ? |
| 4 | La blessure fondatrice oriente encore les réactions adultes — la reconnaître la désamorce. | Formuler sa peur fondamentale et identifier une décision récente prise pour l'éviter. | De quoi ai-je encore peur que l'adulte en moi a dépassé ? |
| 5 | L'expression authentique vient du centre, pas de la peur de mal faire. | Identifier un espace d'expression qui appartient uniquement à soi — sans public. | Quand est-ce que je crée pour moi seul(e) ? |
| 6 | L'équilibre n'est pas l'absence de tension — c'est gérer la friction avant qu'elle devienne chronique. | Identifier sa passion dominante et noter 3 situations où elle était active sans y être invitée. | Où est-ce que je compense au lieu d'équilibrer ? |
| 7 | Les relations reflètent les croyances sur soi — pas la réalité de l'autre. | Identifier un pattern relationnel récurrent et le relier à sa peur ou passion active. | Qu'est-ce que je cherche réellement dans l'autre ? |
| 8 | Le mécanisme de défense protège une douleur réelle — il s'intègre par la conscience, pas la volonté. | Nommer son mécanisme et identifier une situation récente où il s'est activé. | Où est-ce que je sabote pour ne pas transformer ? |
| 9 | La vision n'est pas un objectif — c'est une boussole qui oriente sans rigidifier. | Articuler sa direction en une phrase et vérifier si les décisions actuelles y convergent. | Quelle vision aurai-je regrettée de ne pas avoir suivie ? |
| 10 | La vocation n'est pas un secteur — c'est une qualité de présence apportée au monde. | Identifier comment CV numérologique et Type HD se croisent dans la trajectoire actuelle. | Comment le monde bénéficie-t-il de ce que je fais ? |
| 11 | Appartenir ne signifie pas se dissoudre — la contribution juste vient de la présence distincte. | Identifier le circuit HD dominant et observer si la contribution actuelle en est une expression. | Qu'est-ce que j'apporte versus ce que je consomme collectivement ? |
| 12 | L'intégration n'est pas la fin du travail — c'est la capacité à se situer dans le grand cycle. | Identifier Pinnacle actif, cycle Ki et étoile annuelle pour contextualiser la phase de vie. | Qu'est-ce qui doit se terminer pour que quelque chose puisse commencer ? |

---

## Mapping sciences par sphère

| Sphère | Sciences leads | Données leads | Sciences support | Données support | Risque doublon | Arbitrage |
|---|---|---|---|---|---|---|
| 1 — Identité | Ennéagramme, Astrologie | Type, Centre, Soleil, ASC | HD, Numérologie | Type HD, Profil, CV (mention) | Kua = fréquence, pas identité | CV en profondeur = sphère 10 |
| 2 — Ressources | HD, Numérologie | Centres définis, Expression, Âme | Kua, Astrologie | Sheng Chi, M2, Vénus | Ennéagramme = désir fondamental sain uniquement | Centres définis ≠ centres ouverts |
| 3 — Intelligence | Ennéagramme, Astrologie | Fixation, Centre mental, Mercure | HD, Numérologie | Variable, Cognition, Âme | Fixation (sphère 3) ≠ Passion (sphère 6) | Kua Fu Wei = lectures orientation only |
| 4 — Racines | Ennéagramme, Astrologie | Peur, Blessure, Lune, M4 | Numérologie, Kua | Dettes/leçons karmiques, Trigramme, Élément | Mécanisme défense = deep only | HD Autorité = mention secondaire |
| 5 — Expression | Astrologie, Ennéagramme | M5, Vénus, Vertu | Kua, HD | Élément nourricier, Canaux | Numérologie Personnalité = contextuel | Vertu Ennéagramme ≠ flèche intégration (sphère 9) |
| 6 — Équilibre | Kua, Ennéagramme | Ho Hai, Étoile ann., Passion, Santé | Numérologie, Astrologie | Défis, AP, M6 | Ho Hai (sphère 6) ≠ Jue Ming/Liu Sha (sphère 8) | HD centres ouverts = conditionnement only |
| 7 — Relations | Astrologie, Ennéagramme | Vénus, M7, Style rel., SX | Kua, HD | Nien Yen, Groupe, Stratégie | Sous-type SO = sphère 11 | Compatibilité Numérologie = secondaire |
| 8 — Transformation | Ennéagramme, Astrologie | Mécanisme, Flèche désint., Pluton, M8 | HD, Kua | Non-Soi, Jue Ming, Liu Sha | Flèche désint. (sphère 8) ≠ Flèche int. (sphère 9) | Kua directions défav. = environnement only |
| 9 — Vision | Astrologie, HD | Jupiter, M9, Croix Incarnation | Kua, Ennéagramme | Tien Yi, Flèche int., Idée sacrée | CV Numérologie = boussole, pas analyse complète | Flèche int. (sphère 9) ≠ flèche désint. (sphère 8) |
| 10 — Vocation | Numérologie, HD | CV, Expression, Pinnacle, Type, Profil, Stratégie | Astrologie, Kua | Saturne, M10, Sheng Chi (voc.) | Ennéagramme = désir fondamental sain only | Sheng Chi Kua = angle matériel — CV = trajectoire |
| 11 — Collectif | HD, Astrologie | Circuit dominant, M11, Uranus | Ennéagramme, Kua | Sous-type SO, Groupe, Cycle Ki | Sous-type SO ≠ SX (sphère 7) ≠ SP (sphère 2) | AP Numérologie = timing secondaire |
| 12 — Intégration | Numérologie, Kua | Pinnacles, Périodes, AP, Secteur, Cycle Ki | Astrologie, Ennéagramme | M12, Transits, Tri-type | HD Variables = contextuel cyclique | Transits = timing only |

**Tiers de priorité :**

| Tier | Sciences | Données | Présence |
|---|---|---|---|
| 1 — Structure identitaire | Ennéagramme, Astrologie | Type, Centre, Soleil, ASC, Peur | Toujours (sphères 1 + 4) |
| 2 — Direction et ressources | HD, Numérologie | Type HD, Profil, Stratégie, CV, Expression | Standard et au-dessus |
| 3 — Environnement et cycles | Kua | Directions, Étoile, Cycle Ki | Lectures cyclique, environnement, orientation |
| 4 — Profondeur | Ennéagramme (mécanismes), Astrologie (Pluton) | Mécanisme, Blessure, Flèches, Tri-type | Lectures transformatrice, défensif, deep |
| 5 — Cyclique | Numérologie (Pinnacles), Kua (étoile), Astrologie (transits) | AP, Pinnacle, Cycle Ki, Transits | Lectures cyclique, décisionnelle, stratégique |

---

## Types de lecture

| ID | Nom | Sphères prioritaires | Sciences prioritaires | Profondeur | Format |
|---|---|---|---|---|---|
| `general` | Fusion générale | 1, 4, 7, 10 | Ennéagramme, Astrologie, HD, Numérologie | standard | synthesis |
| `identitaire` | Identitaire | 1, 4, 3, 5 | Ennéagramme, Astrologie | approfondie | structured |
| `relationnelle` | Relationnelle | 7, 1, 4, 11 | Astrologie, Ennéagramme, HD | standard | structured |
| `vocationnelle` | Vocationnelle | 10, 9, 2, 5 | Numérologie, HD, Astrologie | approfondie | structured |
| `decisionnelle` | Décisionnelle ★ | 3, 2, 10, 6 | HD, Ennéagramme, Kua, Numérologie | approfondie | structured |
| `energetique` | Énergétique ★ | 2, 6, 4, 8 | HD, Kua, Ennéagramme | standard | structured |
| `transformatrice` | Transformatrice ★ | 8, 12, 4, 9 | Ennéagramme, Astrologie, HD | deep | narrative |
| `cyclique` | Cyclique | 6, 11, 12, 10 | Numérologie, Kua, Astrologie | standard | synthesis |
| `contextuelle` | Contextuelle libre ★ | 1–4 sphères détectées | 1–3 sciences détectées | variable | synthesis |

> ★ Types à fort croisement inter-sciences — sans équivalent direct dans les lectures mono-science.

---

## Mode contextuel — Routing questions libres

| Signal détecté | Sphères probables | Sciences utiles | Format réponse |
|---|---|---|---|
| Fatigue / épuisement / vide | 2, 6, 4 | HD, Kua, Ennéagramme | Ce qui draine + posture |
| Blocage / stagnation / tourne en rond | 4, 8, 10 | Ennéagramme, Numérologie, HD | Ce qui bloque + clé d'action |
| Doute / décision / hésitation | 3, 2, 10 | HD, Ennéagramme, Numérologie | Angle clair + directive |
| Sens / direction / perdu(e) | 9, 10, 1 | Numérologie, Astrologie, HD | Boussole + étape concrète |
| Relation / conflit / incompris(e) | 7, 1, 4 | Astrologie, Ennéagramme | Pattern + observation |
| Anxiété / peur / angoisse | 4, 6, 8 | Ennéagramme, Astrologie | Ce qui se joue + posture |
| Identité / qui suis-je | 1, 3, 4 | Ennéagramme, Astrologie | Couche active + clarification |
| Travail / carrière / positionnement | 10, 2, 9 | Numérologie, HD, Astrologie | Direction + ressources |
| Cycle / timing / période | 12, 6, 11 | Numérologie, Kua, Astrologie | Lecture de cycle + timing |
| Transformation / changement / rupture | 8, 12, 4 | Ennéagramme, Astrologie | Zone d'ombre + direction |

**Pipeline contextuel :**

1. Détecter le signal dominant (émotionnel / situationnel / existentiel)
2. Sélectionner 1 à 3 sphères correspondantes
3. Sélectionner 1 à 3 sciences utiles (leads de ces sphères)
4. Ne mobiliser que les données disponibles — jamais inventer
5. Construire : Ce qui se joue → Pourquoi → Observer → Posture → Synthèse

---

## Format standard d'une sphère

```
## [N]. [NOM]
[Révélation — 1 phrase directe]
Sciences leads : [science1 (données)] + [science2 (données)]
Déséquilibre : [1 phrase]
Potentiel : [1 phrase]
Clé : [insight fondamental — 1 phrase]
Action : [directive concrète — 1 phrase impérative]
Question : [optionnelle]
```

---

## Règles de cohérence

1. **Anti-doublon** — CV Numérologie analysé en profondeur en sphère 10. Mention en sphère 1 uniquement.
2. **Tier 1 obligatoire** — Sphères 1 et 4 présentes dans tout rendu standard.
3. **Passion ≠ Fixation** — Passion Ennéagramme (sphère 6) ≠ Fixation mentale (sphère 3). Jamais interverties.
4. **Flèches séparées** — Flèche désintégration (sphère 8, stress) ≠ Flèche intégration (sphère 9, croissance).
5. **HD centres** — Centres définis = ressources (sphère 2). Centres ouverts = conditionnement (sphère 6). Jamais mélangés.
6. **Kua directions** — Favorables (sphères 2/3/7/9/10) ≠ Défavorables (sphères 6/8). Jamais croisées.
7. **Transits = timing** — Transits Astrologie = signal temporel. Pas sources d'identité.
8. **Mécanismes deep only** — Mécanisme de défense + Blessure centrale : lectures transformatrice, défensif, deep uniquement.
9. **Science absente** — Si données manquantes pour une science : nommer l'absence. Ne pas inventer.
10. **Mode contextuel** — Max 3 sphères actives pour une question libre. Réponse en 5 blocs max.

---

## Recommandations produit

| Usage | Logique | Format |
|---|---|---|
| Onboarding gratuit | Sphères 1 + 4 uniquement, 2 sciences max | Synthesis court |
| Lecture essentielle | 4 sphères prioritaires du type choisi | Structured standard |
| Lecture premium | 6-8 sphères, 4-5 sciences croisées | Structured approfondi |
| Lecture praticien | 12 sphères, toutes sciences disponibles | Narrative deep |
| Chat libre / contextuel | `detectDominantSpheres()` → 1-3 sphères | Synthesis court 5 blocs |
| n8n / API | `buildFusionDataBlock()` → `buildFusionFullPrompt()` | Prompt inject |
| UI conversationnelle | `detectDominantSpheres(question)` → routing | Contextuelle |
| Dashboard SaaS | `PRIMARY_SPHERES_BY_READING` + `FUSION_SPHERES` | Feed composants |
| Rapport PDF | Lecture premium + version éditoriale | Narrative structuré |

---

## Duplication cross-science

| Science | Conflit / Point d'attention |
|---|---|
| Ennéagramme × HD | Passion HD (Non-Soi, conditionnement) partiellement superposée avec Passion Ennéagramme. `shadowSignal` ou deux champs distincts — trancher dans l'interface Fusion. |
| Ennéagramme × Astrologie | Centre d'intelligence Ennéagramme (mental/émotionnel/instinctif) ≠ Maison dominante Astrologie. Préfixer `enneaCenter` vs `astroHouseEmphasis`. |
| Numérologie × Kua | Année Personnelle Numérologique (cycle 9 ans) partiellement superposée avec Cycle Ki Kua (cycle 9 ans). Complémentarité ou séparation à trancher. |
| HD × Kua | Variables HD (PHS — environnement/nutrition) partiellement superposées avec orientations Kua. Ne pas mapper directement. |
| Numérologie × Astrologie | Chemin de Vie + Soleil couvrent partiellement la «nature fondamentale». Séparation stricte : CV = vibration chiffrée, Soleil = symbolique archétypal. |
| Toutes sciences | `dataSource` obligatoire dans l'interface commune : `'calculated'` (HD, Numérologie, Kua) vs `'test'/'declared'/'observed'` (Ennéagramme). |
