# Lambda Skeleton (Stripe + Media)

This folder contains a production-oriented starting point to move critical payment and image workflows out of WordPress/Next runtime.

## Folders

- `stripe-webhook/index.mjs`
Receives Stripe webhooks (API Gateway Lambda), verifies Stripe signature, pushes verified events to SQS.

- `stripe-worker/index.mjs`
Consumes SQS Stripe events and syncs subscription state to WordPress internal API (`/billing/stripe/sync`).

- `media-presign/index.mjs`
Returns S3 presigned upload URL for image files (max 5 MB).

- `media-delete/index.mjs`
Deletes platform-owned image objects and their optimized variants after an ad removes them.

- `media-optimizer/index.mjs`
Triggered by S3 object creation. Generates `.webp` and `.avif` variants from uploaded images.

- `email-dispatcher/index.mjs`
Receives internal HTTP events from Next API routes and sends transactional emails via Amazon SES v2.

## Why this helps

- Stripe flow is no longer tied to browser return timing.
- Retries are safe and asynchronous through queueing.
- Image upload/transform logic can be moved away from WordPress PHP request lifecycle.

## Required env vars

### stripe-webhook

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_EVENTS_QUEUE_URL`

### stripe-worker

- `WORDPRESS_INTERNAL_API_BASE_URL` (example: `https://back.2424.mg/wp-json/2424/v1`)
- `PLATFORM_SUBMISSIONS_SECRET`

### media-presign

- `MEDIA_UPLOAD_BUCKET`
- `MEDIA_PUBLIC_BASE_URL` (CloudFront URL prefix)

### media-delete

- `MEDIA_UPLOAD_BUCKET`
- `MEDIA_DELETE_SHARED_SECRET` (must match WordPress `PLATFORM_MEDIA_DELETE_SECRET`)

### media-inventory

- `MEDIA_UPLOAD_BUCKET`
- `MEDIA_DELETE_SHARED_SECRET` (must match the WordPress media cleanup secret)
- Expose as `POST /media/inventory`.
- Its IAM role must only allow `s3:ListBucket` for the `uploads/` prefix; do not grant `s3:DeleteObject`.

```json
{
  "Effect": "Allow",
  "Action": "s3:ListBucket",
  "Resource": "arn:aws:s3:::<media-bucket>",
  "Condition": { "StringLike": { "s3:prefix": ["uploads/*"] } }
}
```

### media-optimizer

- `MEDIA_UPLOAD_BUCKET`
- `MEDIA_OPTIMIZED_BUCKET` (optional, defaults to `MEDIA_UPLOAD_BUCKET`)
- `MEDIA_WEBP_QUALITY` (optional, defaults to `82`)
- `MEDIA_AVIF_QUALITY` (optional, defaults to `52`)

### email-dispatcher

- `EMAIL_DISPATCHER_SHARED_SECRET`
- `EMAIL_FROM_ADDRESS`
- `EMAIL_REPLY_TO_ADDRESS` (optional)
- `EMAIL_CONFIGURATION_SET_NAME` (optional)

## Deployment order

1. Deploy `stripe-worker` and connect it to SQS queue.
2. Deploy `stripe-webhook` and point Stripe webhook endpoint to API Gateway.
3. Keep current Next routes as fallback during cutover.
4. Switch frontend image flow to call `media-presign` and upload directly to S3.
5. Deploy `media-delete`, expose it as `POST /media/delete`, and grant its role `s3:DeleteObject` on `arn:aws:s3:::<bucket>/uploads/*`.
6. Disable base64 image upload path once traffic is stable.
7. Deploy `email-dispatcher` and set `EMAIL_DISPATCHER_LAMBDA_URL` + `EMAIL_DISPATCHER_SHARED_SECRET` in Next runtime.

## WebP / AVIF conversion setup

1. Deploy `media-optimizer` Lambda with `index.mjs` and dependencies from `package.json`.
2. Add S3 trigger on the upload bucket:
   - Event type: `ObjectCreated:*`
   - Prefix (optional): `uploads/`
3. Grant IAM permissions to `media-optimizer` role:
   - `s3:GetObject` on `arn:aws:s3:::<bucket>/uploads/*`
   - `s3:PutObject` on `arn:aws:s3:::<bucket>/uploads/*`
4. After upload of `uploads/.../image.jpg`, optimizer writes:
   - `uploads/.../image.webp`
   - `uploads/.../image.avif`

## Packaging note (`media-optimizer`)

`sharp` must be packaged with the Lambda deployment artifact. Quick packaging approach:

1. `cd media-optimizer`
2. `npm install --omit=dev`
3. Zip `index.mjs`, `package.json`, and `node_modules/`.

## Email dispatcher payload format

```json
{
  "eventName": "signup.welcome.v1",
  "recipient": {
    "email": "user@example.com",
    "name": "John Doe"
  },
  "templateData": {
    "displayName": "John Doe",
    "loginUrl": "https://2424.mg/login",
    "siteUrl": "https://2424.mg",
    "logoUrl": "https://2424.mg/wp-content/uploads/2018/05/logo_2424_MG_PM_MOBILE.png",
    "supportEmail": "contact@2424.mg",
    "locationLabel": "Antananarivo, Madagascar",
    "youtubeUrl": "https://www.youtube.com/channel/UCcjS1Us2l3yB8lLsDu3Vr6w",
    "xUrl": "https://twitter.com/2424_mg",
    "instagramUrl": "https://www.instagram.com/2424.mg/",
    "facebookUrl": "https://web.facebook.com/2424.mg/"
  }
}
```

Supported builtin events:

- `signup.welcome.v1`
- `signup.new-user-alert.v1`
- `login-otp.requested.v1`
- `password-reset.requested.v1`
- `subscription.confirmed.v1`
- `notification.activity.v1`
- `newsletter.broadcast.v1`

For `password-reset.requested.v1`, reuse the same branding keys and provide:

- `forgotPasswordUrl`
- `firstName` and/or `displayName` and/or `identifier`

For `subscription.confirmed.v1`, reuse the same branding keys and provide:

- `dashboardUrl`
- `firstName` and/or `displayName` and/or `identifier`
- `planLabel` (example: `Essentiel`)
- `planBadgeLabel` (optional, example: `PLAN ESSENTIEL`)
- `priceLabel` (optional, example: `15 000 Ar`)
- `monthlyPriceAr` (optional fallback if `priceLabel` is not passed)

For `notification.activity.v1`, reuse the same branding keys and provide:

- `subject` (optional)
- `preheader` (optional)
- `title`
- `firstName` and/or `displayName` and/or `identifier`
- `introLine`
- `actorName`
- `actorInitials` (optional fallback generated from `actorName`)
- `activityLabel`
- `entityTitle`
- `activityTimeLabel` (example: `Just now`)
- `ctaLabel`
- `ctaUrl`
- `unsubscribeUrl` (optional)
- `preferencesUrl` (optional)

For `newsletter.broadcast.v1`, reuse the same branding keys and provide:

- `subject`
- `preheader`
- `title`
- `introLine`
- `content` (plain text with line breaks) and/or `contentHtml`
- `contentText` (optional explicit text fallback)
- `ctaLabel`
- `ctaUrl`
- `unsubscribeUrl` (optional)
- `preferencesUrl` (optional)

You can also pass raw templates for future events using:

- `subject`
- `text` and/or `html`

## Notes

- `stripe-webhook` assumes FIFO semantics (`MessageGroupId` + `MessageDeduplicationId`).
Use an SQS FIFO queue or adapt the sender for Standard queue.
- For strict idempotency, add a DynamoDB table keyed by Stripe `event.id` in `stripe-worker`.
