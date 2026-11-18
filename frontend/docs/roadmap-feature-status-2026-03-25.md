# Etat des features vs roadmap (2026-03-25)

## Perimetre

Ce document compare l'etat actuel de l'application avec la roadmap fonctionnelle reconstruite a partir de:

- `docs/migration-continuous-plan.md`
- les routes Next.js presentes dans `app/*`
- les modules `features/*`
- les APIs Next -> WordPress -> WooCommerce actuellement branchees

Statuts utilises:

- `Operationnel`: parcours disponible et branche
- `Partiel`: disponible mais incomplet, temporaire, ou non durable
- `Non livre`: non disponible ou explicitement desactive

## Vue rapide

| Module roadmap | Statut | Etat actuel |
| --- | --- | --- |
| Auth email / Google / onboarding | Partiel | Flow principal present, mais verification email encore en mode debug |
| Actualites | Operationnel | Listing, detail, categories, archives, soumission editorial branchés |
| Abonnements / pricing / Stripe | Operationnel | Checkout, retour, portail Stripe, downgrade, factures branchés |
| Petites annonces public | Operationnel | Listing, detail, sauvegarde, contact et paiement Stripe annonces branchés |
| Workspace petites annonces | Operationnel | Creation, edition, suppression, paiement et suivi utilisateur disponibles |
| Offres d'emploi public | Operationnel | Listing et detail branches sur l'API publique |
| Workspace offres d'emploi | Partiel | Publication et suivi de ses offres OK, candidats recus encore placeholder |
| Appels d'offres public | Operationnel | Listing et detail branches sur l'API publique |
| Workspace appels d'offres | Partiel | Publication et suivi de ses appels d'offre OK, reponses recues encore placeholder |
| Profil / compte / factures | Operationnel | Dashboard, infos perso, factures, portail Stripe, contenus sauvegardes |
| Annuaire | Non livre | Page explicitement desactivee |
| Web radio | Non livre | Page explicitement desactivee |
| Messagerie / contenus sauvegardes | Partiel | UX presente, mais persistance encore en cache memoire |

## Detail par module

### 1. Authentification et onboarding

Statut: `Partiel`

Ce qui fonctionne:

- connexion locale email / mot de passe
- inscription email
- connexion Google
- recuperation de mot de passe
- synchronisation utilisateur Next <-> WordPress
- onboarding profil
- controles de disponibilite email

Ce qui reste incomplet:

- la verification email n'est pas finalisee
- l'endpoint de renvoi active actuellement le compte en debug au lieu d'envoyer/valider un vrai email
- cela veut dire que le bandeau existe, mais la verification transactionnelle n'est pas encore en mode production

Impact roadmap:

- le socle auth est en place
- la brique "compte verifie par email" doit encore etre remise en production proprement

### 2. Actualites

Statut: `Operationnel`

Ce qui fonctionne:

- page listing `/actualites`
- page detail article `/actualites/[slug]`
- categories et archives
- composant editorial home / categories tendances
- soumission d'article depuis l'espace membre
- lecture depuis WordPress via WPGraphQL quand `USE_NEWS_MOCKS=false`

Ce qui reste incomplet:

- les commentaires d'article sont encore locaux dans l'UI et non persistants
- le module peut encore tourner sur mocks si l'environnement n'est pas branche sur WPGraphQL

Impact roadmap:

- le module Actualites est le plus avance fonctionnellement
- la moderation / commentaires backendes restent a finir

### 3. Pricing, abonnements et facturation

Statut: `Operationnel`

Ce qui fonctionne:

- page tarifs / pricing
- catalogues plans et droits
- checkout abonnement Stripe
- retour Stripe et sync WordPress / WooCommerce
- webhook Stripe
- resync abonnement
- downgrade vers free
- portail Stripe
- historique de factures
- resume du compte et etat d'abonnement dans le profil

Ce qui reste incomplet:

- les autres moyens de paiement declares dans le design/types (`mvola`, `orange-money`, `airtel-money`) ne sont pas encore branches

Impact roadmap:

- le flux abonnement Stripe est en production logique
- la diversification des moyens de paiement reste a livrer

### 4. Petites annonces

Statut: `Operationnel`

Ce qui fonctionne:

- listing public `/petites-annonces`
- detail public `/petites-annonces/[id]`
- slug SEO sur les fiches annonces
- filtres / categories / recherche dans l'interface
- creation d'annonce depuis l'espace membre
- edition et suppression dans le workspace utilisateur
- paiement Stripe de publication d'annonce
- retour Stripe annonce et marquage WooCommerce / WordPress
- bouton contacter / conversation annonce
- sauvegarde des annonces

Ce qui reste incomplet:

- la messagerie d'annonce est stockee en cache applicatif, pas encore dans une base/metier durable
- les contenus sauvegardes reposent aussi sur la meme couche cache
- avec la config actuelle, `CACHE_DRIVER=redis` retombe encore sur de la memoire locale

Impact roadmap:

- le coeur marketplace petites annonces fonctionne
- la persistance durable des interactions utilisateur reste a securiser

### 5. Offres d'emploi

Statut: `Partiel`

Ce qui fonctionne:

- listing public `/offres-emploi`
- detail public `/offres-emploi/[id]`
- chargement via l'API publique WordPress
- publication d'une offre via formulaire membre
- espace profil "mes offres d'emploi"
- detail d'un item dans le workspace profil

Ce qui reste incomplet:

- la zone "candidats recus" est encore un placeholder vide
- pas de pipeline de candidature structure / CRM cote app

Impact roadmap:

- le module publication / consultation est la
- la partie recrutement aval est encore a construire

### 6. Appels d'offres

Statut: `Partiel`

Ce qui fonctionne:

- listing public `/appels-offres`
- detail public `/appels-offres/[id]`
- chargement via l'API publique WordPress
- creation d'un appel d'offre depuis l'espace membre
- espace profil "mes appels d'offre"
- detail d'un item dans le workspace profil

Ce qui reste incomplet:

- la zone "reponses recues" est encore un placeholder vide
- pas de vrai workflow de reponse / soumission fournisseur cote app

Impact roadmap:

- la vitrine et la publication existent
- la couche "gestion des reponses" reste a livrer

### 7. Annuaire

Statut: `Non livre`

Etat actuel:

- la page `/annuaire` est explicitement desactivee
- un module `features/directory` existe encore avec donnees mock
- il n'est pas branche en production

Impact roadmap:

- l'annuaire existe en base de travail UI
- il n'est pas encore ouvert aux utilisateurs

### 8. Web radio

Statut: `Non livre`

Etat actuel:

- la page `/radio` est explicitement desactivee
- il n'y a qu'un placeholder de module

Impact roadmap:

- la brique radio n'est pas encore demarree fonctionnellement

### 9. Profil / espace membre

Statut: `Operationnel`

Ce qui fonctionne:

- dashboard profil
- page "mes informations"
- workspace articles
- workspace petites annonces
- workspace appels d'offre
- workspace offres d'emploi
- page contenus enregistres
- page factures
- acces portail Stripe

Ce qui reste incomplet:

- certains sous-espaces secondaires sont encore vides par design (`contacts`, `reponses`, `candidats`)
- une partie des donnees "saved" et messages reste en cache non durable

Impact roadmap:

- l'espace membre est bien etabli
- il manque surtout les workflows secondaires metier

### 10. Emails transactionnels

Statut: `Partiel`

Ce qui fonctionne:

- socle Lambda / dispatcher email
- emails d'inscription
- emails de reset password
- emails de contact / thread pour petites annonces
- logs plugin cote WordPress pour le SMTP / erreurs d'envoi

Ce qui reste incomplet:

- verification email toujours en bypass debug
- la gestion template/provider n'est pas encore stabilisee en mode definitif

Impact roadmap:

- le socle email est la
- la verification email et la stabilisation provider restent a finir

## Ce qui est explicitement en prototype ou en dette connue

- pages publiques listings encore basees sur les composants visuels du prototype Figma Make
- fallback donnees locales dans plusieurs pages publiques si le chargement distant echoue
- `CACHE_DRIVER=redis` n'est pas encore reellement branche a Redis, le code retombe sur `LocalMemoryStore`
- commentaires d'articles non persistants
- verification email temporairement contournee

## Priorites recommandees pour la suite

### Priorite 1

- remettre la verification email en mode production
- brancher une persistance durable pour messages et contenus sauvegardes
- finaliser le tracking "candidats", "reponses", "contacts" dans les workspaces

### Priorite 2

- ouvrir l'annuaire
- lancer la brique radio
- remplacer les derniers fallbacks / mocks par du backend reel quand necessaire

### Priorite 3

- ajouter les autres moyens de paiement
- finaliser commentaires / moderation editoriale enrichie
- faire converger encore plus les pages prototype vers des modules `features/*` natifs

## Conclusion

La roadmap coeur produit est deja bien avancee:

- Actualites: oui
- Abonnements Stripe: oui
- Petites annonces: oui
- Jobs: oui, mais recrutement aval incomplet
- Appels d'offres: oui, mais gestion des reponses incomplete
- Profil membre: oui
- Annuaire: non
- Radio: non

Le principal delta restant n'est plus la vitrine du produit, mais la finition metier:

- verification email definitive
- persistance durable
- workflows secondaires annonceur / recruteur / AO
