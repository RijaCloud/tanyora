# Plan de migration continue: 2424mgprototype -> frontend Next.js

Date de base: 2026-03-08

## Objectif

Permettre des integrations regulieres des evolutions du prototype Figma Make (`C:\laragon\www\2424mgprototype`) vers le frontend Next.js (`C:\laragon\www\2424\frontend`) sans recopier le code auto-genere brut.

## Contexte constate

- `2424mgprototype` est un projet Vite React exporte Figma Make.
- Le code genere contient:
  - des pages monolithiques (`src/imports/*.tsx`)
  - des imports `figma:asset/*`
  - du routage `react-router`
- Le frontend cible est Next.js App Router avec architecture par features.

## Regle principale

Ne jamais copier tel quel un fichier volumineux de `src/imports/*.tsx` dans Next.js.

Approche imposee:
1. identifier les patterns UI utiles;
2. extraire les donnees de demo et sections fonctionnelles;
3. reimplementer en composants modulaires Next.js;
4. brancher les donnees via repositories (`features/*/data`) et non dans la vue.

## Mapping de migration (etat actuel)

Source prototype:
- `src/app/pages/HomePage.tsx`
- `src/app/pages/ActualitesPage.tsx`
- `src/app/pages/ArticlePage.tsx`
- `src/app/pages/PricingPage.tsx`
- `src/app/pages/PetitesAnnoncesPage.tsx`
- `src/app/pages/JobsPage.tsx`
- `src/imports/Actu.tsx`
- `src/imports/ActualiteLecture.tsx`
- `src/imports/PricingDesignAll.tsx`

Cible Next.js:
- `frontend/app/page.tsx`
- `frontend/app/actualites/page.tsx`
- `frontend/app/actualites/[slug]/page.tsx`
- `frontend/app/tarifs/page.tsx`
- `frontend/app/pricing/page.tsx`
- `frontend/app/petites-annonces/page.tsx`
- `frontend/app/offres-emploi/page.tsx`
- `frontend/features/news/components/*`
- `frontend/features/subscriptions/components/*`
- `frontend/features/classifieds/*`
- `frontend/features/jobs/*`

## Workflow a chaque nouvelle modif du prototype

1. Audit des deltas
- comparer les ecrans modifies dans `2424mgprototype/src/app/pages` et `src/imports`;
- relever les nouveautes visuelles et interactions.

2. Classification des changements
- `UI only`: changement de style/layout;
- `UI + interaction`: nouveaux etats/animations;
- `data contract`: nouveaux champs metier requis.

3. Integration Next.js
- UI dans `frontend/components` ou `frontend/features/<module>/components`;
- logique metier dans `frontend/features/<module>`;
- acces donnees dans `frontend/features/<module>/data` ou `frontend/lib/wp`.

4. Validation
- verifier navigation App Router (`next/link`), aucun `react-router`;
- verifier absence d'import `figma:asset/*`;
- verifier que les quotas/plans restent lus depuis `config/subscription-plans.ts`.

5. Documentation
- mettre a jour cette note section "Journal des migrations";
- documenter ce qui est en mock et ce qui depend du backend.

## Checklist d'integration rapide

- [ ] Source prototype identifiee
- [ ] Ecrans touches identifies
- [ ] Components Next crees/maj
- [ ] Routage Next branche
- [ ] Data repo branche ou mocke proprement
- [ ] Aucun import `react-router`
- [ ] Aucun import `figma:asset/*`
- [ ] Documentation maj

## Backlog de migration recommande

Priorite 1 (fait):
- Actualites listing + detail article + interactions commentaires
- Pricing / abonnements (catalogue plans + cartes + route tarifs)
- Petites annonces (listing + filtres + modal)
- Offres emploi (listing + filtres + modal)

Priorite 2:
- Appels d'offres
- Annuaire

Priorite 3:
- Web radio (avec abstraction API tierce)
- Dashboards annonceur/recruteur

## Journal des migrations

### 2026-03-08 (phase 1)
- Source Make localisee dans `C:\laragon\www\2424mgprototype`.
- Migration initiale des patterns Actu + Article vers composants Next modulaires.

### 2026-03-08 (phase 2)
- Migration du bloc pricing depuis `PricingPage.tsx` / `PricingDesignAll.tsx`.
- Creation du module `features/subscriptions` et route `/tarifs`.
- Normalisation des prix/cta dans `config/subscription-plans.ts`.

### 2026-03-08 (phase 3)
- Migration des modules `PetitesAnnoncesPage.tsx` et `JobsPage.tsx`.
- Creation des features `classifieds` et `jobs` avec data mocks, filtres, recherche, modal detail.