# Audit Light/Dark Mode

## Objectif
- recenser les zones UI qui n'etaient pas encore correctement themees
- corriger les fondations communes
- normaliser les surfaces et etats les plus repetes pour eviter le retour des regressions

## Fondations corrigees
- `app/globals.css`
  - ajout de tokens light/dark pour fonds, surfaces, textes, bordures, overlays et etats
  - ajout d'utilitaires `ui-*` reutilisables pour les pages, cartes, inputs et overlays
- `app/providers.tsx`
  - conservation du theme via `localStorage`
  - fallback automatique sur `prefers-color-scheme` si aucun theme n'est encore enregistre
- `features/prototype/pages/Root.tsx`
  - harmonisation du shell global, de la banniere de verification email, du header sticky et du flash info

## Composants partages corriges
- `components/ui/ArticleCard.tsx`
- `components/ui/ShareSheetModal.tsx`
- `components/ui/RichTextEditor.tsx`
- `features/profile/components/ProfileSettingsCompound.tsx`

## Pages et domaines corriges
- Pages publiques modules
  - `features/classifieds/ClassifiedsPage.tsx`
  - `features/jobs/JobsPage.tsx`
  - `features/directory/DirectoryPage.tsx`
  - `features/news/components/NewsLandingPage.tsx`
- Profil
  - `features/profile/components/ProfilePage.tsx`
  - `features/profile/components/ProfileSavedPage.tsx`
  - `features/profile/components/MessagesDashboardPage.tsx`
  - `features/profile/components/ProfilePageSkeleton.tsx`
  - `features/profile/components/WorkspaceCompound.tsx`
- Checkout / paiement
  - `features/subscriptions/components/CheckoutMethodPage.tsx`
  - `features/subscriptions/components/CheckoutReturnPageClient.tsx`
  - `features/subscriptions/components/CheckoutReturnSync.tsx`
  - `features/submissions/components/ListingCheckoutMethodPage.tsx`
  - `features/submissions/components/ListingCheckoutReturnPageClient.tsx`

## Dettes reperees pendant l'audit
- presence importante de couleurs hex hardcodees dans des composants de page et de profil
- support dark heterogene entre composants prototype et composants metier
- overlays, modales et skeletons souvent oublies dans les premieres integrations
- composants riches comme l'editeur qui ne suivaient pas le changement de theme en direct

## Profil metier : statut detaille
- `/profil`
  - statut : `corrige`
  - points repris : shell principal, surfaces, navigation, skeleton
- `/profil/messages`
  - statut : `corrige`
  - points repris : contraste conversation, cartes, textes secondaires
- `/profil/saved`
  - statut : `corrige`
  - points repris : tabs, cartes, surfaces et etats hover
- `/profil/modifier`
  - statut : `corrige`
  - points repris : formulaires, blocs compound, bordures et placeholders
- `/profil/petites-annonces`
  - statut : `corrige`
  - points repris : liste/detail, cartes selectionnees, pagination, modales, blocs de preview, etats vides
- `/profil/offres-emploi`
  - statut : `a surveiller`
  - points repris : base workspace et surfaces partagees via `FeatureWorkspacePage`
- `/profil/appels-offres`
  - statut : `a surveiller`
  - points repris : base workspace et surfaces partagees via `FeatureWorkspacePage`
- `FeatureWorkspacePage.tsx`
  - statut : `corrige`
  - points repris : conteneurs workspace, cartes, champs, upload zones, pagination, modales de preview et dialogues de confirmation

## Couverture Playwright
- smoke public
  - `tests/e2e/theme-smoke.spec.ts`
  - couvre `/`, `/login`, `/petites-annonces`, `/tarifs`
- smoke connecte avec auth reutilisable
  - `tests/e2e/profile-auth.setup.ts`
  - `tests/e2e/profile-theme-smoke.spec.ts`
  - session persistante via `storageState` pour `/profil`, `/profil/messages`, `/profil/saved`, `/profil/modifier`, `/profil/petites-annonces`

## Convention de maintenance
- les smokes de theme publics restent sans dependance metier
- les smokes de pages connectees reutilisent toujours `storageState`
- toute nouvelle surface generique doit consommer `ui-page`, `ui-surface`, `ui-surface-soft`, `ui-card` ou `ui-card-flat`
- les accents de marque peuvent rester hardcodes uniquement pour les CTA metier intentionnels

## Checklist de validation a utiliser
- aucun texte principal illisible en dark
- aucune surface blanche parasite dans une carte, modal ou drawer dark
- placeholders, bordures et etats hover/focus lisibles dans les deux themes
- overlays et fonds de modales cohérents avec le theme actif
- composants fixes/sticky alignes avec le shell global
- bascule de theme preservee sur les pages publiques critiques
