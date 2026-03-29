# Load Testing — Hexastra Coach

Test de charge pour l'endpoint critique `/api/chat`.

---

## Pré-requis

### 1. Installer k6

```bash
# Windows (winget)
winget install k6

# macOS
brew install k6

# Linux (Ubuntu/Debian)
sudo gpg --no-default-keyring \
  --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 \
  --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

Vérification :
```bash
k6 version
# → k6 v0.54.0 (...)
```

### 2. Variables d'environnement obligatoires pour les tests

| Variable | Requis | Description |
|---|---|---|
| `BASE_URL` | **Oui** | URL du site (`https://hexastra-coach.vercel.app` ou `http://localhost:3000`) |
| `AUTH_TOKEN` | Non | Cookie `sb-access-token` d'une session Supabase (sans token = plan free) |
| `SCENARIO` | Non | `smoke` \| `baseline` \| `stress` (défaut: `smoke`) |
| `PLAN` | Non | `free` \| `essential` \| `premium` \| `practitioner` (pour les logs seulement) |

### 3. Pour tester en local

Le serveur Next.js doit être opérationnel **ET** avoir un `.env.local` avec les vraies valeurs :

```bash
# Variables obligatoires dans .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
HEXASTRA_API_URL=https://hexastra-api-production.up.railway.app
HEXASTRA_API_KEY=...

# Lancer le serveur
npm run dev
# Attendre "Ready in Xms" dans les logs

# Tester manuellement avant k6 (voir section ci-dessous)
```

> ⚠️ Sans `NEXT_PUBLIC_SUPABASE_URL` réel, le middleware Next.js crashe et retourne HTTP 500
> avant même d'atteindre `/api/chat`. Configurer les vraies credentials Supabase en premier.

---

## Tester manuellement l'endpoint avant k6

**Toujours valider manuellement avant de lancer k6.** Si le serveur répond incorrectement,
k6 produira des métriques invalides.

```bash
# Test minimal (pas d'auth, plan free, FR)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "messages": [{"role":"user","content":"Fais-moi une lecture de ma situation"}],
    "language": "fr"
  }' \
  --max-time 30 \
  -w "\n\nSTATUS: %{http_code} | TIME: %{time_total}s\n"
```

**Réponse attendue :**
```json
{
  "message": "...",
  "plan": "free",
  "mode": "free",
  ...
}
```
→ Si tu reçois du HTML ou une page d'erreur Next.js → le serveur local n'est pas configuré.

---

## Exécution des tests

### Toujours commencer par le smoke test

```bash
# Smoke test : 1 VU, 2 min
k6 run \
  --env SCENARIO=smoke \
  --env BASE_URL=https://hexastra-coach.vercel.app \
  tests/load/k6-chat.js
```

### Baseline (charge nominale)

```bash
k6 run \
  --env SCENARIO=baseline \
  --env BASE_URL=https://hexastra-coach.vercel.app \
  --env AUTH_TOKEN=$AUTH_TOKEN \
  tests/load/k6-chat.js
```

### Stress (point de rupture)

```bash
k6 run \
  --env SCENARIO=stress \
  --env BASE_URL=https://hexastra-coach.vercel.app \
  --env AUTH_TOKEN=$AUTH_TOKEN \
  tests/load/k6-chat.js
```

### Avec export JSON pour archivage

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
| `erreurs réseau` | < 1% | 1–3% | > 3% (= test invalide) |
| `erreurs HTTP 4xx/5xx` | < 2% | 2–5% | > 5% |
| `timeouts 504/30s` | < 1% | 1–3% | > 3% |
| `429 quota` | variable | > 20% = config KO | > 50% = tous bloqués |

---

## Plan de test recommandé

```
Étape 1 : curl manuel       → valider que l'endpoint répond 200 avant tout
Étape 2 : smoke (2 min)     → valider que k6 peut appeler l'API
Étape 3 : baseline (19 min) → mesurer la performance nominale
Étape 4 : stress (24 min)   → trouver le point de rupture
```

**Environnements :**

| Étape | Environnement | Pourquoi |
|---|---|---|
| 1–2 | Staging / Preview Vercel | Sans risquer la prod |
| 3 | Staging | Après validation smoke |
| 4 | Production (faible charge) | Smoke uniquement |
| 5 | Production (stress) | Seulement après optimisations confirmées |

---

## Interprétation du rapport final

```
Temps total = Supabase (auth + quota) + Railway API + OpenAI + persistance
            ≈    100-300ms          +   2000-5000ms + 3000-15000ms + 200ms
```

### Signaux d'alarme

| Signal | Cause probable |
|---|---|
| p95 > 20s | Appels OpenAI qui timeout sous charge |
| Erreurs 504 > 1% | Vercel serverless saturé ou Railway API lente |
| Erreurs 429 > 5% | Quota utilisateur ou rate limit OpenAI atteint |
| Erreurs réseau > 0% | Serveur inaccessible (URL wrong, serveur mort) |
| `N/A (non enregistrée)` dans le rapport | Métriques custom non collectées = serveur inaccessible |

### Pourquoi le `sleep(20-40s)` est intentionnel

Ne pas supprimer ce sleep. `/api/chat` n'est pas une API REST rapide :
- L'appel OpenAI prend 3-15s
- L'utilisateur réel lit la réponse 30-60s avant d'écrire la suivante
- Sans sleep : 50 VU = 50 requêtes simultanées en permanence → charge irréaliste
- Avec sleep : 50 VU ≈ 1 requête/20s/VU = ~150 req/min = scénario réaliste

---

## Notes importantes

1. **Ne jamais lancer stress/spike en production** sans avoir configuré les limites Vercel.
2. **OpenAI a ses propres rate limits** (TPM/RPM selon le tier). À 50 VU actifs avec sleep 20s : ~150 req/min vers OpenAI. Vérifier ton tier.
3. **Railway** : L'instance doit être "awake". Un cold start peut prendre 30s+ sur le plan Hobby.
4. **Supabase** : Plan gratuit = 500 connexions max. Plan Pro = 10 000. Vérifier avant stress test.
5. **Le verdict k6 (exit code)** et le **verdict textuel** (`handleSummary`) sont indépendants. Un verdict "ACCEPTABLE" dans la console n'implique pas que k6 a exit 0 — vérifier `echo $?` après le run.
