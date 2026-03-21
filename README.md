# Hexastra Coach

Coach personnel multi-sciences basé sur l'IA — astrologie, Human Design, numérologie, Kua, ennéagramme et Yi-King.

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router) |
| Auth / DB | Supabase (Auth + PostgreSQL) |
| IA | OpenAI GPT-4o (streaming) + vector store RAG |
| Paiements | Stripe (Checkout + Webhooks + Portal) |
| Calculs | Hexastra API (Railway) |
| Géocodage | OpenCage |
| Email | Resend |
| Tests unitaires | Vitest |
| Tests E2E | Playwright |
| Déploiement | Vercel |

## Architecture

```
app/
  api/              Routes API Next.js (chat, astro, hd, numerology, kua, ...)
  chat/             Interface de chat principale
  pricing/          Pages plans Free / Essentiel / Premium / Praticien
  auth/             Auth Supabase (login, callback, reset)
lib/
  hexastra/
    orchestrator/   runHexastraFlow — flux principal de traitement
    orchestration/  Classification, plans, modes de réponse, politiques
    prompts/        buildSystemPrompt + directives spécialisées
    guards/         Hallucination guard, exact data guard
    router/         classifyQuery, lightRouter
    vector/         Politique de recherche vectorielle RAG
  supabase/         Clients Supabase (server, client, admin)
  plans.ts          Capacités par plan (source : PLAN_CONTRACTS)
tests/ks/           Tests unitaires Vitest (~480 tests)
tests/e2e/          Tests E2E Playwright
```

### Flux de traitement d'un message

1. `app/api/chat/route.ts` — réception + auth + quota check
2. `runHexastraFlow()` — orchestrateur principal
   - `universalClassification` → intent, science, requestKind
   - `normalizeInput` → message normalisé + contexte session
   - Appel Railway (calculs exacts si besoin)
   - `selectResponseMode()` → calculated / interpretive / guided / pedagogical
   - `buildSystemPrompt()` → prompt système avec directives adaptées
   - Appel OpenAI streaming → réponse SSE au client

## Plans

| Plan | Quota | Profondeur | Praticien |
|---|---|---|---|
| Free | 10 msg/jour | light | — |
| Essentiel | 60 msg/jour | guidée | — |
| Premium | illimité | deep | — |
| Praticien | illimité | expert | ✓ |

Toutes les capacités sont définies dans `lib/hexastra/orchestration/planContracts.ts`.

## Installation locale

### Prérequis

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Compte Supabase, OpenAI, Stripe, OpenCage

### Étapes

```bash
# 1. Cloner le dépôt
git clone https://github.com/ton-org/hexastra-coach.git
cd hexastra-coach

# 2. Installer les dépendances
pnpm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Remplir chaque valeur dans .env.local

# 4. Lancer le serveur de développement
pnpm dev
```

L'application est disponible sur `http://localhost:3000`.

## Variables d'environnement

Voir [.env.example](.env.example) pour la liste complète et documentée.

Variables requises au minimum pour démarrer :

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
HEXASTRA_API_KEY
OPENCAGE_API_KEY
```

## Scripts

```bash
pnpm dev          # Serveur de développement
pnpm build        # Build de production
pnpm start        # Démarrage production
pnpm lint         # ESLint
pnpm test:ks      # Tests unitaires Vitest (tests/ks/)
pnpm test:e2e     # Tests E2E Playwright
```

## Tests

```bash
# Tests unitaires (Vitest)
pnpm test:ks

# Tests E2E (Playwright) — nécessite le serveur Next.js lancé
pnpm test:e2e

# Vérification TypeScript
npx tsc --noEmit
```

Les tests unitaires couvrent : classification, plans, modes de réponse, routing, RAG policy, hallucination guard, horoscope, Human Design, etc.

## Déploiement (Vercel)

### Variables d'environnement Vercel

Ajouter toutes les variables de `.env.example` dans `Settings → Environment Variables` du projet Vercel. Les variables `NEXT_PUBLIC_*` doivent être disponibles en environnement `Production`, `Preview` et `Development`.

### Stripe Webhooks

1. Dans le dashboard Stripe, créer un endpoint webhook pointant vers `https://hexastra.coach/api/stripe/webhook`
2. Activer les events : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
3. Copier le `Signing secret` dans `STRIPE_WEBHOOK_SECRET`

### Checklist mise en production

- [ ] Toutes les variables d'environnement renseignées dans Vercel
- [ ] Webhook Stripe configuré et secret copié
- [ ] Base Supabase migrée (tables `profiles`, `readings`, `subscriptions`)
- [ ] Domaine custom configuré dans Supabase Auth (Site URL + Redirect URLs)
- [ ] `NEXT_PUBLIC_APP_URL` mis à jour avec l'URL de production
- [ ] Vérification du build : `pnpm build` sans erreur
- [ ] Tests unitaires : `pnpm test:ks` — 0 échec
- [ ] Route de santé accessible : `GET /api/health` → `{"status":"ok"}`
- [ ] Test de paiement en mode Stripe live

### Vérification post-déploiement

```bash
# Santé de l'API
curl https://hexastra.coach/api/health

# Réponse attendue
{"status":"ok","timestamp":"..."}
```

## Sécurité

- CSP configuré dans `next.config.mjs` (voir TODO nonce pour `unsafe-inline`)
- Clés Supabase service role exclusivement côté serveur
- Clé OpenAI exclusivement côté serveur
- Validation Zod sur toutes les entrées API
- Sentinel (`lib/hexastra/security/sentinel.ts`) — protection contre les injections

## Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| `Error: NEXT_PUBLIC_SUPABASE_URL is not set` | Variable manquante | Vérifier `.env.local` |
| Chat bloqué en "loading" | HEXASTRA_API_KEY invalide ou Railway down | Vérifier la clé + status Railway |
| Paiement échoue silencieusement | STRIPE_WEBHOOK_SECRET incorrect | Reconfigurer le webhook Stripe |
| Géocodage ne fonctionne pas | OPENCAGE_API_KEY manquante | Ajouter la clé OpenCage |
| `504 Gateway Timeout` en production | Réponse OpenAI trop longue | Vérifier les limites de timeout Vercel |

## Prochaines étapes techniques

- [ ] Nonce CSP dynamique (Next.js 15 + Vercel Edge Config) — remplacer `unsafe-inline`
- [ ] Tests E2E sur les flux de paiement Stripe (mode test)
- [ ] Internationalisation complète EN/FR côté prompts
- [ ] Monitoring OpenAI usage (cost tracking)
