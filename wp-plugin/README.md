# Tanyora Platform

Plugin WordPress de la plateforme Tanyora, destine a activer et synchroniser les services metier du site.

## Auteur

- RijaCloud

## Contenu

Ce plugin regroupe les modules suivants :

- auth
- billing
- submissions
- next revalidate webhook

## Structure

```text
2424-platform/
  2424-platform.php
  includes/
    2424-platform-auth.php
    2424-platform-billing.php
    2424-platform-submissions.php
    next-revalidate-webhook.php
```

## Installation

1. Copier le dossier `2424-platform` dans `wp-content/plugins/`
2. Activer le plugin depuis l'administration WordPress

## Notes

- Pendant la transition depuis les `mu-plugins`, des wrappers peuvent continuer a charger ce plugin automatiquement.
- Les secrets et URLs d'environnement doivent etre configures cote serveur.
- Teste en local avec WordPress 6.8 (installation actuelle du projet) et PHP 8.3.30.

## File de suppression media

Les medias des petites annonces sont supprimes par Action Scheduler dans le groupe `2424-media-cleanup`. Staging et production doivent executer cette file chaque minute via WP-CLI, sans dependance au trafic WordPress :

```sh
* * * * * flock -n /tmp/2424-media-cleanup.lock wp --path=/chemin/vers/wordpress action-scheduler run --group=2424-media-cleanup --batch-size=25 --batches=1 --quiet
```

Les actions et leurs erreurs sont visibles dans WooCommerce > Status > Scheduled Actions avec le filtre de groupe `2424-media-cleanup`.

## Regles de release

- A chaque mise a jour plugin, incrementer la version dans `2424-platform.php` et `readme.txt`.
- A chaque mise a jour plugin, mettre aussi a jour `latest.json` (version, download_url, last_updated).
- Le workflow `.github/workflows/publish-wp-plugin.yml` doit rester aligne avec cette regle et publier le meme `latest.json` vers S3/CloudFront.
