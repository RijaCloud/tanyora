# Migration Note - 2424mgprototype -> frontend Next.js

Date: 2026-03-08

## Why the design looked different before
- Next layout injected a custom shell (header/nav/container) that does not exist in the prototype flow.
- Prototype global styles (slider + theme variables) were not fully mounted in Next.
- Prototype routing relies on a `Root` wrapper and `react-router`; Next initially rendered pages directly without that wrapper.

## What was migrated now
- Full prototype pages copied into `features/prototype/pages`.
- Full prototype app components copied into `features/prototype/components`.
- Figma assets converted from `figma:asset/...` to `/prototype-assets/...` and served from `public/prototype-assets`.
- `react-router` calls adapted through `features/prototype/router-compat.tsx`.
- Next `app/layout.tsx` now wraps pages with prototype `Root` + `AuthProvider`.
- Routes mapped to prototype pages (`/`, `/actualites`, `/offres-emploi`, `/petites-annonces`, `/appels-offres`, `/appel-offres`, `/annuaire`, `/radio`, `/tarifs`, `/programme/[slug]`).
- Global CSS aligned for prototype rendering in `app/globals.css`.

## Important technical compromise (temporary)
- All files under `features/prototype` are marked with `// @ts-nocheck` to keep migration velocity and avoid generated code typing noise.
- This is temporary and should be reduced progressively when refactoring by feature.

## How to integrate future prototype updates
When `2424mgprototype` changes:
1. Copy updated files from:
   - `2424mgprototype/src/app/pages/*` -> `frontend/features/prototype/pages/`
   - `2424mgprototype/src/app/components/*` -> `frontend/features/prototype/components/`
   - `2424mgprototype/src/imports/*` -> `frontend/features/prototype/imports/`
   - `2424mgprototype/src/assets/*` -> `frontend/public/prototype-assets/`
2. Re-run conversion rules:
   - `figma:asset/*` -> `/prototype-assets/*`
   - `react-router` imports -> `@/features/prototype/router-compat`
   - relative imports -> `@/features/prototype/...`
3. Run checks:
   - `pnpm i`
   - `pnpm run typecheck`
4. Validate pages visually in Next before merging.

## Next phase recommendation
- Keep prototype as visual source only.
- Refactor progressively into feature modules (`features/news`, `features/jobs`, etc.) and move business/data logic out of generated blocks.
- Remove `@ts-nocheck` incrementally per module as code is stabilized.
