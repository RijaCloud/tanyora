# Migration Figma Make -> Next.js

Source identifiee:
- `C:\laragon\www\2424mgprototype` (export Figma Make Vite React)

Ecrans identifies:
- `src/app/pages/HomePage.tsx`
- `src/app/pages/ActualitesPage.tsx`
- `src/app/pages/ArticlePage.tsx`
- `src/app/pages/PricingPage.tsx`
- `src/app/pages/PetitesAnnoncesPage.tsx`
- `src/app/pages/JobsPage.tsx`
- wrappers volumineux dans `src/imports/*`

Adaptation effectuee (sans conserver la structure SPA):
- composants adaptes pour Next.js:
  - `frontend/features/news/components/FeaturedNewsHero.tsx`
  - `frontend/features/news/components/SecondaryNewsCard.tsx`
  - `frontend/components/ui/ModuleCard.tsx`
  - `frontend/features/news/components/NewsLandingPage.tsx`
  - `frontend/features/news/components/ArticleView.tsx`
  - `frontend/features/news/components/ArticleComments.tsx`
  - `frontend/features/subscriptions/components/PricingCard.tsx`
  - `frontend/features/subscriptions/components/PricingGrid.tsx`
  - `frontend/features/classifieds/ClassifiedsPage.tsx`
  - `frontend/features/jobs/JobsPage.tsx`
- pages branchees App Router:
  - `frontend/app/page.tsx`
  - `frontend/app/actualites/page.tsx`
  - `frontend/app/actualites/[slug]/page.tsx`
  - `frontend/app/tarifs/page.tsx`
  - `frontend/app/pricing/page.tsx` (redirect)
  - `frontend/app/petites-annonces/page.tsx`
  - `frontend/app/offres-emploi/page.tsx`

Decision technique:
- les gros fichiers auto-generes `src/imports/*.tsx` ne sont pas copies tels quels (trop volumineux, couplage fort aux assets `figma:asset/*`, structure peu maintenable)
- extraction des patterns UI utiles et reimplementation propre en composants Next.js modulaires