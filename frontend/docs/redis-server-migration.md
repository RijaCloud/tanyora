# Migration Redis serveur

Next.js utilise Redis uniquement via `REDIS_URL` et `REDIS_KEY_PREFIX`. Le service Redis reste prive sur le VPS, lie a `127.0.0.1`, avec ACL, AOF active et `maxmemory-policy noeviction`.

## Secrets GitHub

Configurer les secrets suivants avant le deploiement :

| Branche | URL | Prefixe |
| --- | --- | --- |
| `main` | `REDIS_URL` | `REDIS_KEY_PREFIX=2424:production:next:` |
| `staging` | `STAGING_REDIS_URL` | `STAGING_REDIS_KEY_PREFIX=2424:staging:next:` |

Chaque URL contient un utilisateur ACL distinct. Ne pas reutiliser les utilisateurs, mots de passe ou prefixes entre environnements.

## Bascule

1. Terminer ou supprimer toute campagne de stress test active pendant qu'Upstash reste branche.
2. Configurer les secrets Redis, puis verifier que Redis est uniquement joignable localement depuis le VPS.
3. Sur le VPS, exporter temporairement les deux variables Upstash source et les deux variables Redis destination.
4. Lancer `pnpm cache:migrate-upstash` pour le rapport, puis `pnpm cache:migrate-upstash -- --apply` pendant la courte fenetre ou PM2 est arrete.
5. Deployer `main`, controler le healthcheck puis les messages, favoris, notifications, rate limits et listes publiques.
6. Conserver Upstash en lecture seule pendant la periode de rollback, puis supprimer ses secrets GitHub.

Le script conserve les TTL, ignore les valeurs de campagnes `stressCampaign` et reconstruit les index de messagerie a partir des messages reels.
