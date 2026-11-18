# Auth0 <-> WordPress submissions

## Etat actuel

- L'authentification publique passe par Auth0.
- Au premier login, le frontend appelle `POST /api/auth/sync-wordpress-user`.
- Cette route relaie vers WordPress:
  - `POST /index.php?rest_route=/2424/v1/auth/sync-user`
- WordPress cree ou met a jour un utilisateur `subscriber` et conserve le lien avec `auth0_sub`.

## Soumissions utilisateur

Le frontend expose les pages suivantes:

- `/profil/petites-annonces/nouveau`
- `/profil/appels-offres/nouveau`
- `/actualites/soumettre`

Ces pages envoient vers:

- `POST /api/submissions/classified`
- `POST /api/submissions/tender`
- `POST /api/submissions/article`

Puis le bridge interne relaie vers WordPress:

- `POST /index.php?rest_route=/2424/v1/submissions/classified`
- `POST /index.php?rest_route=/2424/v1/submissions/tender`
- `POST /index.php?rest_route=/2424/v1/submissions/article`

## Visibilite dans WordPress

- `article` -> cree un `post` WordPress en statut `pending`
- `classified` -> cree un `classified_ad` en statut `pending`
- `tender` -> cree un `tender_notice` en statut `pending`

Les equipes admin / redaction peuvent ensuite moderer ces contenus dans le dashboard WordPress.

## Variables d'environnement

Frontend:

- `WORDPRESS_INTERNAL_API_BASE_URL=http://2424.test/index.php?rest_route=/2424/v1`
- `PLATFORM_SUBMISSIONS_SECRET=...`

WordPress:

- `PLATFORM_SUBMISSIONS_SECRET=...` doit matcher la valeur frontend

## Etapes suivantes

- Remplacer le role `subscriber` par un mapping de roles metier si necessaire
- Ajouter ACF pour enrichir petites annonces / appels d'offres
- Brancher WooCommerce Subscriptions pour relier plan, droits et soumissions autorisees
- Ajouter un suivi des soumissions utilisateur dans `/profil`
