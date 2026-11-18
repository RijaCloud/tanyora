# Testing Coverage

## Résumé

Ce document recense la couverture de tests actuellement en place sur le frontend `2424`.

Il distingue :

- les **tests unitaires** `Vitest`
- les **tests end-to-end** `Playwright`
- les **zones encore non couvertes** ou partiellement couvertes

## Outils

- **Unit tests** : `Vitest`
- **E2E tests** : `Playwright`
- **Type safety** : `TypeScript` via `pnpm typecheck`

## Commandes utiles

```bash
pnpm test:unit
pnpm test:e2e
pnpm typecheck
pnpm build
```

Note :

- `typecheck` passe actuellement
- les tests unitaires passent actuellement
- le `build` compile l'application, mais le packaging `standalone` peut échouer localement sous Windows à cause d'un problème de symlinks `EPERM`

## Inventaire des tests existants

### Tests unitaires

- `tests/unit/subscriptions/plan-catalog.test.ts`
- `tests/unit/subscriptions/checkout-route.test.ts`
- `tests/unit/subscriptions/downgrade-free-route.test.ts`
- `tests/unit/security/login-lockout.test.ts`
- `tests/unit/security/validation.test.ts`
- `tests/unit/features/wordpress-internal-listings.test.ts`
- `tests/unit/profile/auth-profile-route.test.ts`
- `tests/unit/notifications/notifications-route.test.ts`
- `tests/unit/messages/profile-follow-up.test.ts`
- `tests/unit/messages/listing-thread-handlers.test.ts`

### Tests end-to-end

- `tests/e2e/onboarding.spec.ts`
- `tests/e2e/email-verification-banner.spec.ts`
- `tests/e2e/classified-create-flow.spec.ts`
- `tests/e2e/classified-checkout-flow.spec.ts`
- `tests/e2e/public-listings.spec.ts`
- `tests/e2e/theme-smoke.spec.ts`
- `tests/e2e/profile-theme-smoke.spec.ts`

## Matrice de couverture

| Feature | Unit | E2E | Statut | Notes |
|---|---|---|---|---|
| Authentification / onboarding | Oui | Oui | Partiel | Onboarding et bannière email couverts, pas encore tous les cas login/logout/reset |
| Vérification email | Oui partiel | Oui | Partiel | Bannière et gardes testées, pas tout le flow de confirmation complet |
| Sécurité login / lockout | Oui | Non | Partiel | Politique de lockout testée, pas encore de scénario navigateur |
| Profil utilisateur | Oui | Partiel | Partiel | API profil couverte, pas encore tout le parcours UI complet |
| Notifications | Oui | Non | Partiel | Route API couverte, pas encore de test e2e cloche/lecture temps réel |
| Messagerie petites annonces / OE / AO | Oui partiel | Non | Partiel | Helpers de thread et follow-up couverts, pas encore parcours UI complet |
| Abonnements / pricing | Oui | Non | Partiel | Checkout, downgrade et catalogue couverts, pas encore d'e2e tarifs/annuel |
| Paiement petites annonces | Oui partiel | Oui | Partiel | Flow checkout listing couvert côté PA, autres variantes non couvertes |
| Petites annonces création | Oui | Oui | Bon | Validation + création e2e de base couvertes |
| Petites annonces édition / suppression | Non | Non | Manquant | À ajouter |
| Offres d'emploi listing public | Oui partiel | Oui partiel | Partiel | Rendu public couvert, pas création/édition/contact e2e dédié |
| Offres d'emploi création / édition | Oui partiel | Non | Partiel | Validation couverte, pas encore flow UI complet |
| Appels d'offres listing public | Oui partiel | Oui partiel | Partiel | Rendu public couvert, pas flow métier complet |
| Appels d'offres création / réponse | Oui partiel | Non | Partiel | Validation couverte, pas encore flow UI complet |
| Annuaire | Non | Non | Manquant | Pas encore de tests dédiés |
| Recherche globale | Non | Non | Manquant | À ajouter |
| Filtres publics catégories / types / tags / localisation | Oui partiel | Partiel | Partiel | Normalisation WP testée, mais pas encore toute l'interaction e2e |
| Tags produits petites annonces | Oui partiel | Non | Partiel | Validation et taxonomies couvertes, pas encore parcours UI e2e |
| WordPress internal mappings / taxonomies | Oui | Non | Bon | Normalisation listings et taxonomies couverte |
| Pages publiques de listing | Oui partiel | Oui | Bon | Smoke rendu public PA / OE / AO déjà présents |
| Dark mode / thèmes | Non | Oui | Partiel | Smoke visuel présent, pas de couverture métier |

## Détail par domaine

### 1. Sécurité et validation

Couvert :

- politique de lockout login
- verrouillage après seuil d'échecs
- expiration et reset
- validation petites annonces
- validation offres d'emploi
- validation appels d'offres
- validation pièces jointes messages
- validation media presign

Manque encore :

- tests d'intégration des routes auth `login`, `forgot-password`, `reset-password`, `resend-verification`
- tests navigateur des messages d'erreur et protections anti-bruteforce

### 2. Abonnements et paiements

Couvert :

- construction du catalogue pricing
- distinction mensuel / annuel
- blocage downgrade `Business -> Essentiel`
- indisponibilité annuelle
- retour vers `Free` avec annulation Stripe
- flow checkout listing petite annonce en e2e

Manque encore :

- e2e page tarifs
- e2e checkout abonnement `Essentiel`
- e2e checkout abonnement `Business`
- e2e bascule mensuel / annuel
- e2e downgrade vers `Free`

### 3. Petites annonces

Couvert :

- schémas de validation
- flow de création simple en e2e
- flow de paiement listing en e2e
- normalisation des catégories / types / tags via WordPress internal

Manque encore :

- édition
- suppression
- multi-photos
- repassage brouillon après changement photo
- tags produits visibles et filtrables en UI e2e

### 4. Offres d'emploi

Couvert :

- validation des payloads
- rendu public de la page
- helpers de messagerie thread

Manque encore :

- création e2e
- édition e2e
- candidature / contact e2e
- workspace complet

### 5. Appels d'offres

Couvert :

- validation des payloads
- rendu public de la page
- helpers de messagerie thread et follow-up

Manque encore :

- création e2e
- réponse / soumission e2e
- workspace complet

### 6. Profil, notifications et messagerie

Couvert :

- route profil
- normalisation région / ville
- conservation de l'état onboarding
- lecture notifications
- `mark-read`
- follow-ups profil
- lecture thread owner
- envoi message + notification + email

Manque encore :

- e2e page profil complète
- e2e cloche notifications
- e2e conversation utilisateur
- e2e conversation propriétaire

### 7. Annuaire

Couvert :

- aucun test dédié actuellement

À prévoir :

- rendu page annuaire
- détail annuaire
- filtres catégorie / région / ville
- comptes Business auto-publiés
- profils mis en avant

### 8. Recherche globale

Couvert :

- aucun test dédié actuellement

À prévoir :

- ouverture modale
- recherche multi-types
- chips filtrantes cliquables
- intégration annuaire

## Priorités recommandées pour les prochains lots Playwright

### Priorité 1

- Offres d'emploi : création + contact
- Appels d'offres : création + réponse
- Tarifs / abonnements : mensuel, annuel, downgrade free

### Priorité 2

- Annuaire : page, filtres, détail
- Notifications : lecture depuis la cloche
- Messagerie : parcours complet candidat / propriétaire

### Priorité 3

- Recherche globale
- Tags produits et filtres avancés petites annonces
- Cas limites d'édition / suppression workspace

## Conclusion

La base actuelle est déjà sérieuse pour une lecture audit :

- une couverture unitaire utile existe sur les blocs métier sensibles
- une première couverture Playwright existe sur les parcours publics et petites annonces

En revanche, la couverture **E2E métier** reste encore **partielle** sur plusieurs modules importants :

- offres d'emploi
- appels d'offres
- annuaire
- abonnements
- notifications
- recherche globale

Le prochain objectif recommandé est donc d'élargir Playwright sur ces parcours critiques pour compléter la base unitaire déjà en place.
