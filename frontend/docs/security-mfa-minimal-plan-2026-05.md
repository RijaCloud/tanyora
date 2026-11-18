# Plan minimal MFA et durcissement auth pour 2424

Date: 2026-05-04

## Objectif

Mettre en place un premier lot de renforcement securite realiste pour `2424`, oriente dossier MVola, sans surconstruire:

- MFA par email
- durcissement leger mais serieux de l'auth/session
- documentation de preuve exploitable

Ce lot exclut volontairement:

- MFA AWS / IAM / consoles externes
- MFA backoffice WordPress admin
- TOTP / application d'authentification
- RBAC front-office complexe

Ces sujets sont consideres comme geres hors application pour ce premier chantier.

## Resume du fonctionnement cible

Le flow cible est le suivant:

1. l'utilisateur passe le premier facteur:
   - mot de passe local
   - ou Google OAuth
2. si son compte est marque `platform_mfa_required = true`:
   - on cree un challenge MFA temporaire
   - on envoie un code OTP par email
   - on affiche un ecran intermediaire de verification
3. la session applicative complete n'est creee qu'apres validation du code

Le mecanisme ne s'applique pas aux comptes standards dans ce premier lot.

## Perimetre fonctionnel

### Inclus

- MFA par email pour comptes sensibles
- gestion OTP email
- verification OTP apres login local
- verification OTP apres login Google
- challenge MFA temporaire cote session
- rate limiting homogene sur auth et MFA
- invalidation de session apres reset password
- documentation securite associee

### Exclus

- MFA par TOTP
- backup codes
- MFA obligatoire pour tous les utilisateurs
- nouveaux roles front-office complexes
- chantier WordPress admin MFA
- chantier AWS/IAM MFA

## Modele de donnees minimal

Cote WordPress utilisateur, ajouter le stockage suivant:

- `platform_mfa_required`
- `platform_mfa_email_code_hash`
- `platform_mfa_email_expires_at`
- `platform_mfa_email_sent_at`
- `platform_mfa_email_attempt_count`
- `platform_mfa_last_verified_at`

Regles:

- seul le hash du code OTP est stocke
- un nouveau renvoi invalide l'ancien code
- pas de stockage persistant du code en clair

## Regles OTP

Format retenu:

- code numerique a 6 chiffres

Regles retenues:

- expiration: `10 minutes`
- tentative max: `5`
- cooldown renvoi: `60 secondes`
- un renvoi invalide immediatement le code precedent

Le transport email reutilise le systeme d'email existant deja branche au dispatcher.

## Determination des comptes MFA

Pour ce lot, on ne construit pas de systeme de roles front-office.

Le declencheur MFA repose uniquement sur:

- `platform_mfa_required = true|false`

Usage:

- comptes standard: `false`
- comptes sensibles: `true`

## Challenge MFA cote session

La vraie session utilisateur ne doit pas etre creee trop tot.

Approche retenue:

- introduire un cookie de challenge MFA temporaire separe du cookie de session principale
- ce cookie contient seulement les informations minimales necessaires au challenge

Contenu minimal recommande:

- `wpUserId`
- `email`
- `authProvider`
- identifiant de challenge signe
- expiration

Proprietes du cookie:

- `httpOnly`
- `sameSite=lax`
- `secure` en production
- courte duree de vie

Le challenge doit etre supprime:

- apres validation reussie
- a expiration
- apres reset password

## Adaptation du login local

Route concernee:

- `POST /api/auth/login`

Comportement cible:

- identifiants invalides:
  - comportement actuel conserve
- identifiants valides et `platform_mfa_required = false`:
  - session finale creee normalement
- identifiants valides et `platform_mfa_required = true`:
  - ne pas creer la session finale
  - generer un OTP email
  - creer le challenge MFA
  - retourner une reponse indiquant que le MFA est requis

## Adaptation du login Google

Route concernee:

- callback Google

Comportement cible:

- compte Google sans MFA requis:
  - comportement actuel conserve
- compte Google avec MFA requis:
  - ne pas finaliser la session complete
  - creer challenge MFA
  - envoyer OTP email
  - rediriger vers l'ecran de verification MFA

## Routes API a ajouter

### `POST /api/auth/mfa/resend`

Usage:

- renvoyer un nouveau code OTP
- necessite un challenge temporaire valide
- applique le cooldown

### `POST /api/auth/mfa/verify`

Payload minimal:

- `code`

Comportement:

- lit le challenge temporaire
- verifie hash, expiration, nombre de tentatives
- si succes:
  - cree la session complete
  - supprime le challenge
- si echec:
  - incremente les tentatives
  - renvoie une erreur utilisateur propre

## UI frontend

Ajouter un ecran dedie de verification MFA.

Recommandation:

- page dediee plutot qu'un simple mode supplementaire dans `login`

Contenu:

- champ de saisie du code
- bouton de validation
- bouton de renvoi du code
- texte indiquant l'adresse email concernee
- message de cooldown si renvoi indisponible
- retour a la connexion

Erreurs a gerer proprement:

- code invalide
- code expire
- trop de tentatives
- challenge invalide ou expire

## Durcissement auth / session associe

Mesures a mettre en place:

- rendre obligatoire un vrai secret de session en production
- supprimer tout fallback de secret faible en prod
- invalider les sessions actives apres reset password
- invalider aussi les challenges MFA en attente apres reset password

## Rate limiting homogene

A ajouter ou harmoniser sur:

- login
- signup
- forgot password
- confirm reset
- resend verification email
- resend MFA code
- verify MFA code

Valeurs de depart recommandees:

- login: `5 / 10 min / IP+identifier`
- forgot password: `5 / 15 min / IP+email`
- resend verification: `3 / 15 min / user`
- resend MFA: `3 / 10 min / challenge`
- verify MFA: `5 / 10 min / challenge`

## Documentation / preuves pour MVola

Produire les documents suivants:

### 1. Note MFA

- premier facteur
- second facteur email OTP
- expiration
- tentative max
- renvoi / cooldown

### 2. Note session/auth

- secret de session
- cookies
- reset password
- invalidation session
- rate limits

### 3. Checklist perimetre securite

- ce qui est couvert dans l'application
- ce qui est deja gere hors app:
  - AWS MFA
  - WordPress admin MFA
  - acces consoles externes

## Tests et scenarios

### Happy path

- login local avec MFA requis + code correct
- login Google avec MFA requis + code correct

### Cas d'echec

- code invalide
- code expire
- trop de tentatives
- renvoi trop frequent
- ancien code reutilise apres renvoi
- challenge expire

### Durcissement auth

- reset password invalide les sessions
- reset password invalide les challenges MFA
- secret session absent en prod => blocage explicite
- login / signup / reset / MFA bien limites

### Compatibilite

- comptes sans MFA:
  - aucun changement de parcours
- comptes Google non concernes:
  - aucun changement de parcours

## Decisions retenues

- second facteur de ce lot: email OTP uniquement
- comptes concernes: uniquement ceux avec `platform_mfa_required = true`
- OTP: `6 chiffres`, `10 min`, `5 tentatives`, `60 s` de cooldown
- stockage: `user_meta` WordPress + cookie challenge signe cote Next
- UI: page dediee de verification MFA
- pas de TOTP ni backup codes dans ce lot

