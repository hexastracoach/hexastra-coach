# Automatisation du chat avec n8n

Quand `N8N_WEBHOOK_CHAT_URL` est defini, `POST /api/chat` delegue la reponse du chat a n8n. Le front garde le meme contrat: n8n peut renvoyer `message`, `reply` ou `content`.

## Variables

```env
N8N_WEBHOOK_CHAT_URL=https://ton-instance.n8n.cloud/webhook/hexastra-chat
N8N_WEBHOOK_BIRTH_URL=https://ton-instance.n8n.cloud/webhook/hexastra-birth
N8N_WEBHOOK_SECRET=un_secret_long_a_partager_avec_n8n
N8N_WEBHOOK_TIMEOUT_MS=26000
```

`N8N_WEBHOOK_BIRTH_URL` est optionnel. Si cette variable est vide, l'evenement du formulaire de naissance est envoye sur `N8N_WEBHOOK_CHAT_URL`.

`N8N_WEBHOOK_SECRET` est envoye a n8n dans deux headers:

```text
x-hexastra-webhook-secret: <secret>
Authorization: Bearer <secret>
```

## Payload envoye a n8n

Le webhook recoit un JSON complet:

```json
{
  "source": "hexastra-web",
  "requestId": "uuid",
  "userId": "uuid-ou-null",
  "plan": "free",
  "responseDepth": "short",
  "readingPlan": {
    "plan": "free",
    "label": "Gratuit",
    "responseDepth": "short",
    "maxOutputLength": "short",
    "readingDepth": "discovery",
    "maxParagraphs": 3,
    "maxActions": 1,
    "include": {
      "exactData": true,
      "synthesis": false,
      "phase": false,
      "lifeZone": false,
      "reliability": false,
      "contradictions": false,
      "practitionerMarkers": false
    },
    "styleRules": ["Reponse courte et directe."],
    "finalCoachInstruction": "Plan Gratuit: donner une lecture de decouverte courte, utile et non exhaustive. Ne pas debloquer une analyse profonde."
  },
  "requestType": "chat",
  "conversationId": "conversation-ou-null",
  "language": "fr",
  "messages": [{ "role": "user", "content": "..." }],
  "lastUserMessage": "...",
  "birthData": {},
  "partnerBirthData": null,
  "practitionerUsage": null,
  "contextType": "general",
  "selectedMenuKey": null,
  "selectedSubmenuKey": null,
  "uiAction": "send_message",
  "journeyEnabled": false,
  "analysisMode": "hexastra_fusion",
  "renderMode": null,
  "userIntentKey": null,
  "evolutionProfile": null,
  "quota": {
    "used": 1,
    "limit": 3,
    "remaining": 2,
    "resetAt": "2026-06-02T00:00:00.000Z",
    "windowStartedAt": null
  }
}
```

## Adaptation par plan dans n8n

Le champ `readingPlan` doit etre transmis jusqu'au node `Final HexAstra Coach`.

Dans le message systeme du node final, ajoute cette regle:

```text
Adapte toujours la profondeur de la lecture au champ readingPlan.
- Respecte readingPlan.finalCoachInstruction.
- Respecte readingPlan.maxParagraphs et readingPlan.maxActions.
- N'inclus phase, zone de vie, fiabilite, contradictions ou marqueurs praticien que si readingPlan.include l'autorise.
- Le plan gratuit donne une lecture de decouverte, courte et non exhaustive.
- Le plan Essentiel donne une lecture structuree et personnalisee.
- Le plan Premium donne une lecture approfondie, nuancee et multidimensionnelle.
- Le plan Praticien donne une lecture experte, systemique et exploitable.
```

## Tester les plans en local

Quand `NEXT_PUBLIC_HEXASTRA_ACCESS_OVERRIDE` ou `HEXASTRA_ACCESS_OVERRIDE` est actif, le chat accepte un parametre local `debugPlan` pour tester le rendu des plans sans Supabase:

```text
http://localhost:3000/chat?debugPlan=free
http://localhost:3000/chat?debugPlan=essential
http://localhost:3000/chat?debugPlan=premium
http://localhost:3000/chat?debugPlan=practitioner
```

Le parametre est transmis a `/api/chat`, puis au workflow n8n via `plan`, `responseDepth` et `readingPlan`.

## Reponse attendue

Minimum:

```json
{
  "message": "Ta reponse..."
}
```

Reponse complete recommandee:

```json
{
  "message": "Ta reponse...",
  "type": "analysis",
  "flowState": { "step": "analysis", "completed": true },
  "menu": { "visible": false, "items": [] },
  "metadata": {
    "contextType": "general",
    "intentDetected": "understand_situation"
  }
}
```

Si n8n ne repond pas ou renvoie une erreur HTTP, l'API retourne `502` avec un message lisible dans le chat. Si `N8N_WEBHOOK_CHAT_URL` est vide, l'ancien moteur local reste actif.

## Formulaire de naissance

Quand le formulaire de naissance est sauvegarde, `POST /api/profile/birth` persiste le profil puis envoie un evenement n8n:

```json
{
  "source": "hexastra-web",
  "event": "birth_profile_saved",
  "userId": "uuid",
  "savedMode": "full",
  "updatedFields": ["first_name", "birth_date", "birth_time"],
  "birthData": {
    "firstName": "Alex",
    "birthDate": "1990-01-24",
    "birthTime": "13:10",
    "birthTimeKnown": true,
    "birthCity": "Paris",
    "birthCountryName": "France",
    "birthCountryCode": "FR",
    "birthLat": "48.8566",
    "birthLng": "2.3522",
    "gender": ""
  },
  "partnerBirthData": null,
  "savedAt": "2026-06-01T12:00:00.000Z"
}
```

En mode local, debug ou acces temporaire sans session Supabase, le site declenche quand meme ce webhook avec:

```json
{
  "savedMode": "local_only",
  "userId": null
}
```

Cela permet de tester `hexastra-birth` meme quand le profil n'est pas persiste dans Supabase.

Dans n8n, ajoute un noeud `Webhook`, verifie le header `x-hexastra-webhook-secret`, puis route selon `event`:

```text
birth_profile_saved -> automatisations liees au profil de naissance
```
