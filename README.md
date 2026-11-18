# Tanyora

Tanyora is a mineral marketplace project built from an isolated copy of the 2424 platform. This repository is a source snapshot of the Tanyora workspace; it does not contain production databases, credentials, uploaded media, installed dependencies or deployment archives.

## Projects

| Path | Purpose |
| --- | --- |
| `frontend/` | Next.js public application, including Exchange and directory pages |
| `wp-plugin/` | Tanyora WordPress platform plugin |
| `assistant-service/` | Prepared Node.js AI assistant service |
| `media-service/` | Prepared Node.js/Cloudinary media service |
| `web/`, `plugin/` | Earlier marketplace prototype, retained as a rollback reference |
| `compose*.yaml`, `deploy/` | Winford stack and deployment configuration templates |

`frontend/` and `wp-plugin/` were separate local repositories before this monorepo snapshot. Their original deployment workflows remain in their respective `legacy-workflows/` directories and must not be treated as an active Tanyora deployment pipeline. The GitHub repository starts with a new history to avoid carrying over inherited 2424 commits or generated dependencies.

## Local development

The frontend uses Node.js and pnpm. Copy `frontend/.env.example` to `frontend/.env.local` and supply **Tanyora-only** service settings. Do not use 2424 production credentials, endpoints or payment providers.

```sh
cd frontend
pnpm install
pnpm dev
```

The WordPress plugin requires a separate Tanyora WordPress and MariaDB instance. See `wp-plugin/README.md` and the Compose files for its integration points. The prepared assistant and media services each have their own README and are not assumed to be active in production.

## Deployment boundary

This repository transfer does not deploy or change the Winford VPS. Runtime secrets remain on the server and are not committed. Review the Compose overlays and environment examples against the live Winford paths before any future deployment. Never deploy this repository to 2424.mg.
