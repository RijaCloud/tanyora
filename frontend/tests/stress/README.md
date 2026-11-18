# Stress test public 2424

Les scripts k6 ne visent que les pages publiques. Ils ne se connectent pas et ne creent aucun contenu.

## Preparation staging

1. Dans WordPress, ouvrez `Reglages > 2424 Platform > Stress test`.
2. Activez explicitement l'outil, puis lancez `Generer la campagne`.
3. Attendez l'etat `ready` : la generation utilise Action Scheduler par lots.
4. Lancez un profil k6 depuis une machine disposant de k6.
5. Consultez `tests/stress/reports/latest-summary.json`, puis supprimez la campagne depuis le meme onglet WordPress.

## Execution

```bash
k6 run -e BASE_URL=https://staging.2424.mg -e PROFILE=smoke tests/stress/public-platform.k6.js
k6 run -e BASE_URL=https://staging.2424.mg -e PROFILE=standard tests/stress/public-platform.k6.js
k6 run -e BASE_URL=https://staging.2424.mg -e PROFILE=intensive tests/stress/public-platform.k6.js
```

`smoke` monte a 2 utilisateurs virtuels, `standard` a 25 et `intensive` a 75. Le rapport contient le debit, les percentiles p50/p95/p99, le taux d'erreur et les URLs taguees en echec. Les seuils sont informatifs pour la premiere campagne ; ils doivent etre ajustes apres une mesure de reference staging.

Ne lancez jamais le script sur production. Les donnees de charge sont marquees par une campagne et se suppriment uniquement depuis le backoffice staging.
