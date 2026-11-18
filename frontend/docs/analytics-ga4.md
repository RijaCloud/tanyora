# Google Analytics 4

## Mise en service

1. Dans Google Analytics, creer une propriete GA4 2424.mg puis un flux Web pour `https://www.2424.mg`.
2. Reporter l'identifiant de mesure `G-...` dans `NEXT_PUBLIC_GA_MEASUREMENT_ID` sur la preproduction puis la production.
3. Deployer et accepter uniquement la categorie `Statistiques` dans le bandeau de cookies.
4. Dans GA4, utiliser DebugView pour verifier les pages et les evenements avant de publier des rapports.

Le script Google n'est charge qu'apres cet accord. Aucun champ libre, coordonnee, identifiant utilisateur ou identifiant de contenu n'est envoye.

## Politique de confidentialite WordPress

Ajouter dans la page de politique de confidentialite configuree dans WordPress :

> Avec votre accord, 2424.mg utilise Google Analytics 4 pour mesurer l'audience et comprendre l'utilisation du site. Les statistiques servent a ameliorer nos contenus et services. Google Analytics n'est active qu'apres l'acceptation de la categorie « Statistiques » dans le bandeau de consentement. Vous pouvez modifier votre choix a tout moment depuis le lien de gestion des cookies dans le pied de page. Les donnees ne comprennent pas les informations saisies dans les formulaires, vos coordonnees, ni les identifiants de votre compte. Pour en savoir plus : https://policies.google.com/privacy
