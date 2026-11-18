# Matrice de couverture qualite 2424.mg

Ce document est la source de verite entre les tests automatises, la recette de staging et la recette manuelle client. Chaque nouvelle fonctionnalite doit y etre rattachee avant livraison.

## Niveaux de test

| Niveau | Objectif | Environnement |
| --- | --- | --- |
| Unitaire | Regles, validations, normalisation et affichage | CI |
| Contrat | Compatibilite Next.js vers REST WordPress | CI avec fixtures versionnees |
| Integration plugin | REST, permissions, metas, quotas et taxonomies | WordPress de test |
| E2E smoke | Navigation et parcours critiques | CI Chromium desktop et mobile |
| E2E complet | Parcours multi-services et paiements | Staging de recette |
| Recette client | Validation metier et rendu final | Staging de recette |

## Inventaire par fonctionnalite

| Fonctionnalite | Unitaire / contrat | E2E | Recette client |
| --- | --- | --- | --- |
| Navigation, recherche, menus, filtres, pagination, 404 et themes | Oui | Oui | Oui |
| SEO, metadata, OpenGraph, robots et URLs editoriales | Oui | Oui | Oui |
| Articles, news, fil d'info, categories, tags, archives et CTA | Oui | Oui | Oui |
| Commentaires, vues, favoris et acces premium | Oui | Oui | Oui |
| Annonces, emplois et appels d'offres: liste, detail, filtres et contact | Oui | Oui | Oui |
| Formulaires: creation, edition, medias, validation et suppression | Oui | Oui | Oui |
| Referentiels: categories, sous-categories, ville et zone | Oui | Oui | Oui |
| Annuaire et evaluations | Oui | Oui | Oui |
| Inscription, email, Google, OTP, mot de passe et onboarding | Oui | Oui | Oui |
| Profil, preferences, notifications, factures et elements sauvegardes | Oui | Oui | Oui |
| Tarifs, abonnements, Stripe, MVola, credits et quotas | Oui | Oui | Oui |
| Messagerie, pieces jointes et notifications email | Oui | Oui | Oui |
| Publicite, meteo, taux de change et radio | Oui | Oui | Oui |
| Backoffice: tarifs, acces, configuration, sauvegarde et logs | Oui | Oui | Oui |
| Resilience WordPress, Redis, cache et revalidation | Oui | Oui | Non |

## Donnees de recette

Les comptes et contenus de test portent le marqueur `platform_2424_test_data`. Les profils de reference sont: administrateur, utilisateur non verifie, utilisateur Google verifie, Free, Essentiel et Business. Les remises a zero sont autorisees uniquement lorsque `PLATFORM_2424_TEST_ENVIRONMENT=1` et l'option WordPress `platform_2424_test_environment` vaut `enabled`.

## Regles de livraison

- Une pull request doit passer `typecheck`, les tests unitaires, les contrats, PHPUnit plugin et le smoke Chromium desktop/mobile.
- Le staging de recette execute les parcours complets apres deploiement. Stripe test mode et MVola sandbox ne sont jamais appeles depuis les tests de pull request.
- Firefox et WebKit, les scenarios de degradation et les paiements sandbox sont executes la nuit ou manuellement.
- Toute anomalie client ajoute un scenario dans cette matrice et, quand elle est reproductible, un test automatise de non-regression.
