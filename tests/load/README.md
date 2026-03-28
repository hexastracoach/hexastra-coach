# Load Testing — Hexastra Coach

Test de charge pour l'endpoint critique `/api/chat`.

## Prérequis

```bash
# Installation k6
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Windows
winget install k6
```

---

## Configuration

### Variables d'environnement

| Variable | Requis | Description |
|---|---|---|
| `BASE_URL` | Oui | URL du site (`https://hexastra-coach.vercel.app`) |
| `AUTH_TOKEN` | Non | Cookie `sb-access-token` d'une session Supabase valide |
| `SCENARIO` | Non | `smoke` \| `baseline` \| `stress` \| `spike` \| `soak` |
| `PLAN` | Non | `free` \| `essential` \| `premium` \| `practitioner` |

### Obtenir un token AUTH_TOKEN

1. Se connecter sur le site
2. Ouvrir DevTools → Application → Cookies
3. Copier la valeur de `sb-access-token`

```bash
export AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Exécution des tests

### 1. Smoke test (toujours commencer par là)

Valide que l'environnement fonctionne avant tout test de charge.

```bash
k6 run \
  --env SCENARIO=smoke \
  --env BASE_URL=https://hexastra-coach.vercel.app \
  tests/load/k6-chat.js
```

### 2. Baseline (charge nominale)

Simule une utilisation normale. À faire en premier sur staging.

```bash
k6 run \
  --env SCENARIO=baseline \
  --env BASE_URL=https://hexastra-coach.vercel.app \
  --env AUTH_TOKEN=$AUTH_TOKEN \
  tests/load/k6-chat.js
```

### 3. Stress test (point de rupture)

Identifie à quel niveau de charge les erreurs commencent.

```bash
k6 run \
  --env SCENARIO=stress \
  --env BASE_URL=https://hexastra-coach.vercel.app \
  --env AUTH_TOKEN=$AUTH_TOKEN \
  tests/load/k6-chat.js
```

### 4. Spike test (pic brutal)

Simule un lancement ou un afflux soudain.

```bash
k6 run \
  --env SCENARIO=spike \
  --env BASE_URL=https://hexastra-coach.vercel.app \
  --env AUTH_TOKEN=$AUTH_TOKEN \
  tests/load/k6-chat.js
```

### 5. Soak test (endurance)

Détecte les fuites mémoire et la dégradation progressive. Durée : 30 min.

```bash
k6 run \
  --env SCENARIO=soak \
  --env BASE_URL=https://hexastra-coach.vercel.app \
  --env AUTH_TOKEN=$AUTH_TOKEN \
  tests/load/k6-chat.js
```

---

## Sauvegarder les résultats

```bash
mkdir -p tests/load/results

k6 run \
  --env SCENARIO=baseline \
  --env BASE_URL=https://hexastra-coach.vercel.app \
  --out json=tests/load/results/baseline-$(date +%Y%m%d-%H%M).json \
  tests/load/k6-chat.js
```

---

## Seuils de validation

| Métrique | ✅ Acceptable | ⚠️ Fragile | 🔴 Critique |
|---|---|---|---|
| `p95 latence` | < 15 000ms | 15 000–25 000ms | > 25 000ms |
| `p99 latence` | < 25 000ms | 25 000–30 000ms | > 30 000ms (timeout Vercel) |
| `taux d'erreur HTTP` | < 2% | 2–5% | > 5% |
| `timeouts (504/0)` | < 1% | 1–3% | > 3% |
| `erreurs 5xx` | < 1% | 1–3% | > 3% |
| `quota 429` | variable | > 20% = config KO | > 50% = tous bloqués |

---

## Plan de test recommandé

### Ordre d'exécution

```
1. smoke      → 2 min    → valider que ça marche
2. baseline   → 19 min   → mesurer la performance nominale
3. stress     → 24 min   → trouver le point de rupture
4. spike      → 8 min    → tester la résilience aux pics
5. soak       → 30 min   → tester l'endurance (optionnel)
```

### Environnements à tester

| Étape | Environnement | Pourquoi |
|---|---|---|
| 1 | Local (`localhost:3000`) | Valider le script |
| 2 | Preview Vercel | Sans risquer la prod |
| 3 | Production (faible charge) | Smoke uniquement |
| 4 | Production (stress) | Uniquement après optimisations |

---

## Interpréter les résultats

### Ce qu'on cherche à mesurer séparément

```
Temps total = Supabase (auth + quota) + Railway API + OpenAI + persistance
            ≈    100-300ms          +   2000-5000ms + 3000-15000ms + 200ms
```

Les fonctions k6 `chatDuration`, `openaiLatency` et `supabaseLatency` permettent d'identifier où le temps est passé si les headers de réponse custom sont ajoutés côté serveur.

### Signaux d'alarme à surveiller

- **p95 > 20s** : Les appels OpenAI commencent à timeout sous charge
- **Erreurs 504 > 1%** : Vercel serverless saturé ou Railway API lente
- **Erreurs 429 > 5%** : Quota utilisateur ou rate limit OpenAI atteint
- **Erreurs 500 croissantes** : Fuite mémoire probable (cache non borné)
- **Dégradation soak** : p95 qui augmente au fil du temps = fuite mémoire

---

## Notes importantes

1. **Ne pas lancer stress/spike en production** sans avoir prévenu Vercel et sans avoir un plan de rollback.
2. **OpenAI a ses propres rate limits** (TPM/RPM selon le tier). À 100 VU actifs, chaque VU envoie ~3 req/min = 300 req/min vers OpenAI. Vérifier le tier actuel.
3. **Railway API** : Vérifier les limites du plan Railway. Si l'instance est en plan gratuit, elle peut être éteinte sous charge.
4. **Supabase** : Le plan gratuit limite à 500 connexions simultanées. Le plan Pro monte à 10 000. Vérifier avant stress test.
5. **Le `sleep(20-40s)`** dans le script est intentionnel : il simule le temps de lecture de la réponse. Une conversation IA n'est pas une API REST rapide — les utilisateurs réels espacent leurs messages.
