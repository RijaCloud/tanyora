# Tests 2424 Platform

## Local ou CI

Le plugin utilise PHPUnit avec la suite WordPress officielle et une base MySQL temporaire.

```bash
composer install
bash bin/install-wp-tests.sh wordpress_test root root 127.0.0.1 latest
composer test:lint
composer test
```

La CI GitHub lance ces commandes avec PHP 8.1 et MySQL 8. Les tests couvrent les routes REST internes, les permissions, les taxonomies canoniques et les reglages critiques; chaque regression metier doit ajouter un test ici avant livraison.

## Stress test staging

Les donnees de charge sont pilotees depuis `Reglages > 2424 Platform > Stress test`. L'onglet est visible uniquement sur les hotes staging reconnus par le plugin et reste desactive par defaut.

Activez l'outil, lancez une campagne puis attendez sa finalisation dans Action Scheduler. Chaque campagne porte un UUID ; la simulation et la suppression ne ciblent que les contenus, comptes et donnees Next marques avec cet UUID. Ne lancez jamais cet outil sur production.
