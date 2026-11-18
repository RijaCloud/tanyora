# Bonnes pratiques - Workspaces profil

Date: 2026-04-09

## Contexte

L'incident sur `Mes petites annonces` a montre qu'un workspace profil peut vite devenir fragile quand on ajoute des couches UI sans garder un point d'entree clair et une logique de liste purement derivee.

## Ce qui a casse

- derive hors du point d'entree historique de la feature
- reconstruction temporaire parallele devenue une seconde implementation
- melange server/client fragile sur le shell de page
- ajout de logique de filtre/pagination sans garde-fous suffisants

## Regles de structure

- garder un seul point d'entree metier par feature
- eviter les reconstructions paralleles "temporairement"
- ne pas injecter de composants client composes (`WorkspaceCompound.*`) depuis une page server
- reconnecter une feature cassee a son composant historique avant de la reconstruire
- ne jamais injecter un bloc de filtres dense dans un header de panneau etroit si le workspace a deja un split list/detail

## Regles de filtre dashboard

- les filtres doivent rester 100% client-side sur des items deja charges
- aucun fetch supplementaire ne doit etre declenche par un filtre
- la pagination doit etre derivee du resultat filtre, jamais l'inverse
- le reset de page doit se faire uniquement quand un filtre change
- `selectedItem` doit toujours etre recalcule depuis la liste filtree visible
- `Type` doit dependre de `Categorie` et se resetter si la categorie revient a `Toutes`

## Regles de stabilite React

- mettre les listes derivees en `useMemo`
- ne pas utiliser `useEffect` pour recalculer des listes filtrees
- garder les `useEffect` uniquement pour la synchronisation UI minimale
- le skeleton ne doit dependre que du chargement initial, jamais des filtres
- tester chaque couche ajoutee separement avant de continuer

## Checklist avant merge

- la page charge sans blocage
- la page reste interactive apres hydration
- les filtres sont stables
- la pagination est stable
- `selectedItem` reste coherent apres filtrage et pagination
- aucune regression sur creation, edition, preview, publication et programmation
