# Audit et refactor initial - 2424.mg

Date: 2026-03-08

## 1) Etat trouve dans C:\laragon\www\2424

- Racine: installation WordPress complete (`wp-admin`, `wp-content`, `wp-includes`).
- Plugins presents et utiles au mode headless:
  - `advanced-custom-fields`
  - `wp-graphql`
- Themes: themes WordPress par defaut uniquement.
- Frontend Next.js: non detecte initialement dans cette racine.

## 1.b) Source Figma Make localisee

- Prototype trouve dans `C:\laragon\www\2424mgprototype`.
- Type: projet Vite React exporte depuis Figma Make.
- Fichiers volumineux auto-generes detectes dans `src/imports/*`.

## 2) Ce qui a ete reorganise

Creation d'un frontend Next.js modulaire dans `frontend/`:
- `app/` routes App Router
- `features/` modules metier
- `lib/` acces data, quotas, cache, sessions
- `config/` configuration centralisee des plans
- `types/` types partages
- `components/` UI reutilisable

## 3) Actualites (prioritaire)

Livre:
- home editoriale (`/`)
- listing (`/actualites`)
- article (`/actualites/[slug]`)
- categories (`/actualites/categorie/[slug]`)
- archives (`/actualites/archives/[year]/[month]`)

Paywall de base:
- consommation quota sur feature `news_full_article_access`
- limites lues depuis `config/subscription-plans.ts`
- preview libre si quota atteint

Adaptation Figma Make:
- extraction et adaptation des patterns visuels utiles (hero/news cards/modules)
- migration vers composants Next.js (sans conserver la structure SPA Vite)

## 4) Abonnements/quotas/cache

Livre:
- interface store commune: `get/set/delete/increment`
- `LocalMemoryStore` (dev local)
- `RedisStore` pret a brancher (non active localement)
- moteur quota centralise (`lib/quotas/engine.ts`)

## 5) Ce qui est mocke

- News data: fallback mock (`USE_NEWS_MOCKS=true` par defaut)
- Web radio: page placeholder (API tierce non finalisee)
- Modules hors Actualites: routes placeholder creees

## 6) Dependances tierces restantes

- Connection effective WPGraphQL avec schema CPT/taxonomies a finaliser
- Redis a brancher plus tard via client Redis reelle
- Import additionnel d'ecrans Figma Make si d'autres modules doivent etre migres