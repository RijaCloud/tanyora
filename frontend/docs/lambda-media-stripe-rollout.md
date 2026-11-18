# Lambda Rollout Summary (Stripe + Media)

## Scope covered

This document summarizes the migration work completed to harden Stripe payment flow and move media upload/optimization toward AWS Lambda + S3 + CloudFront.

## 1) Stripe reliability hardening

### Code changes (frontend)

- `app/api/billing/stripe/return-status/route.ts`
  - Sync trigger logic was broadened beyond `payment_status === "paid"`.
  - Added safer sync eligibility checks based on Stripe session/subscription states.
  - Confirmation now depends on active subscription state, not strictly order number availability.

- `features/subscriptions/components/CheckoutReturnPageClient.tsx`
  - Removed premature redirect.
  - Added retry polling loop before redirect to profile.
  - Improved status messaging for "activation in progress".

### Goal

Avoid payment success pages appearing broken when Stripe/WordPress sync timing is delayed.

## 2) Lambda skeleton added (repo)

Folder: `dev/lambda`

- `stripe-webhook/index.mjs`
  - Verifies Stripe signature.
  - Pushes events to SQS.

- `stripe-worker/index.mjs`
  - Consumes SQS events.
  - Calls WordPress internal billing sync endpoint.

- `media-presign/index.mjs`
  - Generates signed S3 upload URL.
  - Returns upload URL + public CloudFront URL.

- `media-optimizer/index.mjs`
  - S3-triggered conversion job.
  - Generates `.webp` and `.avif` variants using `sharp`.

- `media-optimizer/package.json`
  - Includes `sharp` and `@aws-sdk/client-s3`.

## 3) Profile photo upload flow migrated from base64 to signed upload

### Code changes

- `features/profile/components/ProfileSettingsPage.tsx`
  - Replaced base64 avatar upload with:
    1. POST `/api/media/presign`
    2. PUT file to signed S3 URL
    3. Save CloudFront URL in `profilePhoto`
  - Added UI state for photo upload progress.
  - Removed base64-specific validation for profile photo.

- `app/api/media/presign/route.ts`
  - Added server-side proxy route to call API Gateway media presign endpoint.

- `lib/env/server.ts`
  - Added reusable env helpers to compose API Gateway URL from base + path.

## 4) Environment variables (current convention)

### Frontend server env

- `API_GATEWAY_BASE_URL`
  - Example: `https://110qimrnq3.execute-api.eu-north-1.amazonaws.com/2424-eu-north-1`

- `API_GATEWAY_MEDIA_PRESIGN_PATH`
  - Example: `/media/presign`

### Lambda media-presign env

- `MEDIA_UPLOAD_BUCKET`
- `MEDIA_PUBLIC_BASE_URL`

### Lambda media-optimizer env

- `MEDIA_UPLOAD_BUCKET`
- `MEDIA_OPTIMIZED_BUCKET` (optional)
- `MEDIA_WEBP_QUALITY` (optional)
- `MEDIA_AVIF_QUALITY` (optional)

## 5) AWS setup decisions and fixes made

### Region alignment

API Gateway and Lambda must be in the same region.

### IAM upload fix

Error fixed by allowing Lambda role to perform `s3:PutObject` on upload path.

Recommended statement:

```json
{
  "Effect": "Allow",
  "Action": ["s3:PutObject"],
  "Resource": "arn:aws:s3:::2424-storage/uploads/*"
}
```

### Sharp runtime fix

`sharp` failed initially due incompatible package/runtime.

Resolved by:

1. Runtime set to Node.js 20.x (x86_64)
2. Repackaging with Linux-compatible dependencies:

```powershell
Remove-Item -Recurse -Force node_modules,package-lock.json,media-optimizer.zip -ErrorAction SilentlyContinue
npm install --omit=dev --include=optional --os=linux --cpu=x64
Compress-Archive -Force -Path index.mjs,package.json,node_modules -DestinationPath media-optimizer.zip
```

### S3 trigger for conversion

`media-optimizer` should be triggered by S3 `ObjectCreated:*` on `uploads/` prefix.

## 6) CORS and access notes

- Signed upload requires correct S3 CORS for browser PUT.
- Public CloudFront URL access may require CloudFront response headers policy + correct bucket access policy/OAC.

## 7) Cost observation

AWS cost forecast showed WAF as dominant cost driver. Recommendation discussed:

- remove Web ACL where unnecessary, or
- keep minimal rules/rate-limit only.

## 8) Current status

- Profile photo upload through signed URL: working.
- URL storage in profile: working.
- Next step: validate end-to-end `.webp/.avif` generation in S3 after upload event.

## 9) Suggested next actions

1. Verify `media-optimizer` CloudWatch logs after real upload.
2. Confirm `.webp`/`.avif` objects are created next to original.
3. Add image delivery helper (`<picture>` / format negotiation) in frontend for consumption.
4. Apply same signed-upload flow to classifieds/gallery forms.
