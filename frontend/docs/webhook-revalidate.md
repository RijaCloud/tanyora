# Webhook WordPress -> Next Revalidate

Date: 2026-03-08

## 1) Configuration Next.js

Le webhook utilise le secret interne déjà nécessaire à l'application :

```env
PLATFORM_SUBMISSIONS_SECRET=change-me
```

Endpoint expose:
- `POST /api/revalidate`

## 2) Configuration WordPress

Dans les réglages 2424, renseigner l'URL publique du site et le même secret dans
`Secret des échanges internes`. Le plugin envoie automatiquement les requêtes vers
`/api/revalidate`; aucune URL ou clé de revalidation distincte n'est nécessaire.

## 3) Payload envoye par WordPress

Le plugin envoie notamment:
- `event`: `post.created | post.updated | post.deleted`
- `postType`
- `slug`
- `status`
- `categories`
- `taxonomies`

## 4) Ce que Next revalide

L'endpoint Next applique:
- `revalidateTag(...)`
- `revalidatePath(...)`

Mappings actuels principaux:
- `post/news/actualites` -> `/`, `/actualites`, `/actualites/[slug]`, `/actualites/categorie/[slug]`
- `petites_annonces` -> `/petites-annonces`
- `offres_emploi` -> `/offres-emploi`
- `appels_offres` -> `/appels-offres`
- `annuaire` -> `/annuaire`
- `radio` -> `/radio`
- global -> `/tarifs`

## 5) Test manuel

PowerShell:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/revalidate" `
  -Headers @{"x-2424-internal-secret"="change-me"} `
  -ContentType "application/json" `
  -Body '{"event":"post.updated","postType":"post","slug":"economie-locale-antananarivo","categories":["economie"]}'
```
