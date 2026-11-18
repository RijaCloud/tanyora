# 2424 Frontend

## Demarrage local

1. `cd frontend`
2. `copy .env.example .env.local`
3. `pnpm i`
4. `pnpm dev`

## Variables

- `WP_GRAPHQL_URL`: endpoint WPGraphQL
- `WP_GRAPHQL_LOGS`: `true`/`false` pour afficher les appels SSR WPGraphQL dans le terminal Next
- `USE_NEWS_MOCKS`: `true`/`false`
- `CACHE_DRIVER`: `memory`/`redis`
- `NEXT_PUBLIC_TINYMCE_API_KEY`: optionnelle pour TinyMCE (fallback possible sur le mode public TinyMCE)
- `REDIS_URL`, `REDIS_KEY_PREFIX`: connexion Redis privee et espace de cles lorsque `CACHE_DRIVER=redis`
- `REDIS_OPERATION_TIMEOUT_MS`, `REDIS_CONNECT_TIMEOUT_MS`: limites de temps du client Redis serveur
- `API_GATEWAY_BASE_URL`, `API_GATEWAY_MEDIA_PRESIGN_PATH`: endpoint API Gateway pour le presign upload media
- `APP_BASE_URL`, `AUTH0_*`: configuration Auth0 pour Google OAuth et magic link
- `DEPLOYMENT_ENV`: `development`, `preproduction` ou `production`. Seul `production` avec `APP_BASE_URL` et `NEXT_PUBLIC_SITE_URL` réglés sur `https://www.2424.mg` autorise l'indexation.
- `EMAIL_DISPATCHER_LAMBDA_URL`, `EMAIL_DISPATCHER_SHARED_SECRET`: endpoint + secret pour la Lambda transactionnelle email

## Migration Figma Make

- Source prototype: `C:\laragon\www\2424mgprototype`
- Plan de migration continue: `docs/migration-continuous-plan.md`
- Note migration initiale: `docs/figma-make-migration.md`
- Etat roadmap / features: `docs/roadmap-feature-status-2026-03-25.md`

## Webhook Revalidate

- Guide: `docs/webhook-revalidate.md`
- Endpoint Next: `/api/revalidate`
- Emetteur WordPress: plugin 2424, authentifié avec `PLATFORM_SUBMISSIONS_SECRET`

## Diagnostic WordPress

- Page de verification locale: `/diagnostic/wpgraphql`
- En local Laragon pour ce projet: `WP_GRAPHQL_URL=http://2424.test/index.php?graphql`
- `http://2424.test/graphql` ne fonctionnera qu'une fois les permaliens WordPress actives
- Quand `USE_NEWS_MOCKS=false`, le module news echoue explicitement si WordPress GraphQL ne repond pas
- Avec `WP_GRAPHQL_LOGS=true`, les appels SSR s'affichent dans le terminal Next avec operation, URL, statut et duree

## Authentification

- SDK: `@auth0/nextjs-auth0@4.x`
- Page de connexion: `/login`
- Routes SDK: `/auth/login`, `/auth/logout`, `/auth/callback`, `/auth/profile`
- Pour Google OAuth: activer la connexion Google dans Auth0 et l'autoriser pour l'application
- Pour le magic link: activer `Passwordless Email` dans Auth0 et l'autoriser pour l'application
- URLs a declarer dans Auth0 en local:
  - callback: `http://localhost:3000/auth/callback`
  - logout: `http://localhost:3000`
