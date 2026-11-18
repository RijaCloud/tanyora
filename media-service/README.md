# Tanyora media service (prepared, not active)

This Node 22 service is the first stage of replacing the inherited AWS media Lambdas. It does not use or access 2424.mg infrastructure. It is intentionally **not** included in the active Compose command or connected to frontend/WordPress routes yet.

## Responsibilities

- `POST /media/sign-upload`: sign a direct Cloudinary image upload for an authenticated internal caller. The caller must forward the fields and the actual file in a multipart POST to `uploadUrl`, then persist Cloudinary's returned `secure_url` and `public_id`. Do not use the old S3 PUT contract.
- `POST /media/delete`: delete only `tanyora/` image public IDs; report partial failures so the caller can retry.
- `GET /health`: liveness, not proof of Cloudinary connectivity.

Both POST routes require `x-tanyora-media-secret`. Keep this secret server-side; never expose the service through Nginx or to the browser. The signed upload API returns an API key and signature, not the API secret. The Cloudinary signed upload preset **must** itself enforce the permitted image formats and a 5 MB maximum; request metadata is not proof of the actual file size or type.

## Activation prerequisites

1. Create a Cloudinary product environment dedicated to Tanyora. Do not reuse 2424 credentials or storage.
2. Create a **signed** image upload preset with a 5 MB limit and JPEG, PNG, WebP and AVIF allowed. Confirm upload and delete quotas and billing alerts.
3. Store `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_SIGNED_UPLOAD_PRESET`, and a new `TANYORA_MEDIA_SERVICE_SECRET` only in the Winford VPS private environment file. Do not commit values.
4. Run `node --test media-service/cloudinary.test.mjs` locally. Launch the separate overlay only after backing up the stack configuration: `docker compose -f compose.yaml -f compose.winford.yaml -f compose.base.yaml -f compose.media.yaml up -d media-service`.
5. Test a real signed upload and deletion against the Tanyora Cloudinary environment. Then migrate the browser upload clients, WordPress ads/submissions, deletion queue, and inventory one at a time behind a provider switch. Preserve S3 URLs in old records; never reinterpret or delete them as Cloudinary assets.
6. Replace the separate transactional email Lambda only after a Tanyora-specific sender, domain authentication, delivery provider, and error/retry policy are configured. Stripe Lambdas in the inherited tree are not a payment integration for Tanyora.

To roll back this preparation, omit `compose.media.yaml` from the Compose command; no existing container or route depends on it. Once clients are migrated, roll back the provider switch first and preserve already-uploaded Cloudinary URLs.
