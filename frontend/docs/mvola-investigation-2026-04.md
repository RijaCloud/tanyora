# MVola Investigation Note — April 2026

## Context

We implemented MVola Merchant Pay in the current `2424` headless architecture:

- Next.js frontend checkout
- WordPress internal API bridge
- WordPress plugin as payment source of truth

The current blocking issue is on `initiate_payment` against MVola preprod.

Observed API error:

```json
{
  "errorCategory": "internal",
  "errorCode": "genericError",
  "errorDescription": "Error in getting user language",
  "errorParameters": [
    { "key": "mmErrorCode", "value": "4002" }
  ]
}
```

## Architecture Used

Current flow:

1. User chooses MVola in the web checkout
2. Frontend calls Next API
3. Next API calls WordPress internal API
4. WordPress plugin calls MVola Merchant Pay API
5. MVola should push a payment confirmation to the client phone
6. Our platform confirms payment by polling and/or callback

Important product clarification:

- MVola does **not** redirect the user to a hosted payment web page
- the customer phone number is expected in the merchant request
- customer confirmation happens on the customer phone

## Source Documents Used

Reference material used during implementation:

- [mvola.md](/C:/laragon/www/2424/frontend/docs/mvola.md)
- local plugin prototype under `C:\laragon\www\2424\local-payments\mvola`
- Merchant Pay Postman collection
- Merchant Pay PDF documentation

## Current Request Snapshot

Current request shape sent by the plugin is intentionally very close to the MVola example:

- `POST https://devapi.mvola.mg/mvola/mm/transactions/type/merchantpay/1.0.0/`
- `Version: 1.0`
- `X-CorrelationID: <uuid>`
- `UserLanguage: mg`
- `UserAccountIdentifier: msisdn;<merchantNumber>`
- `partnerName: <configured partner name>`
- `Content-Type: application/json`
- `Authorization: Bearer <token>`
- `Cache-Control: no-cache`
- no callback in sandbox

Payload shape:

```json
{
  "amount": "15000",
  "currency": "Ar",
  "descriptionText": "2424 abonnement 257",
  "requestingOrganisationTransactionReference": "plan-257",
  "requestDate": "2026-04-29T12:20:37.515Z",
  "originalTransactionReference": "plan-257",
  "debitParty": [{ "key": "msisdn", "value": "0343500003" }],
  "creditParty": [{ "key": "msisdn", "value": "0343500004" }],
  "metadata": [
    { "key": "partnerName", "value": "2424.mg" },
    { "key": "fc", "value": "USD" },
    { "key": "amountFc", "value": "1" }
  ]
}
```

## What Has Already Been Verified

The following points were checked and are no longer the primary suspects:

### MVola environment

- sandbox mode is expected to target `https://devapi.mvola.mg`
- test numbers used are within the documented preprod pair:
  - `0343500003`
  - `0343500004`

### HTTP transport

- the plugin now logs the transport used
- confirmed in runtime logs:
  - `transport.name = curl`
  - `curlAvailable = yes`
  - `curlVersion = 7.88.1`

This means the production runtime is really using native cURL, not only `wp_remote_*`.

### Header alignment attempts already tested

We already tested:

- `UserLanguage: MG`
- `UserLanguage: FR`
- `UserLanguage: mg`
- with and without callback in sandbox
- with and without `Accept-Charset`

The current code was brought back to the closest version of the official curl example:

- `UserLanguage: mg`
- no `Accept-Charset`
- no callback in sandbox

### Callback strategy

Sandbox currently uses polling only, which is aligned with the original prototype recommendation.

### Confirmation flow

The payment confirmation logic was also improved beyond initiation:

- callback accepts `PUT`
- polling is supported
- `transaction details` is queried after `status` when possible before final business finalization

This part is not the current blocker. The blocker is still the initial `merchantpay` request.

## Most Likely Remaining Suspects

At this stage, the most likely causes are now outside of the HTTP transport itself.

### 1. `partnerName` is incorrect

This is currently the strongest suspect.

The documentation example uses:

- `partnerName: {{companyName}}`

Our current configured value is:

- `2424.mg`

This may be wrong if MVola expects:

- the exact registered company name
- a partner identifier configured in their platform
- a specific casing or formatting

Because the error mentions:

- `Error in getting user language`

it is possible MVola is doing an internal partner lookup based on merchant identity plus `partnerName`, then failing to retrieve partner profile information such as the configured language.

### 2. MVola preprod provisioning issue

Possible scenario:

- token works
- merchant number is accepted
- but the MVola preprod tenant is incompletely configured on their side
- language/profile lookup fails internally

### 3. Hidden constraint in merchant account configuration

Possible undocumented dependency between:

- `consumer_key`
- `consumer_secret`
- `merchant_number`
- `partnerName`

If one of these values does not belong to the same exact MVola partner setup, the API may fail with a misleading internal error.

## Changes Already Applied in Code

Relevant implementation changes already pushed:

- sandbox uses polling by default
- sandbox callback header removed
- sandbox test phone validation added
- runtime transport logging added
- native cURL transport added
- callback `PUT` support added
- status/details confirmation logic added

## Recommended Next Steps

### Immediate functional check

Before changing more code, verify the exact `partnerName` expected by MVola.

Questions to confirm with MVola:

1. What exact value must be used in `partnerName` for this merchant account?
2. Should it be the company legal name, a portal label, or a technical partner identifier?
3. Is the partner profile correctly provisioned with a language in preprod for merchant `0343500004`?

### Suggested test matrix

Once the correct `partnerName` is known, retry with:

1. sandbox = yes
2. base URL = `https://devapi.mvola.mg`
3. `UserLanguage = mg`
4. `debitParty = 0343500003`
5. `creditParty = 0343500004`
6. no callback header
7. exact MVola-provided `partnerName`

### If escalation to MVola support is needed

Share the following information:

- token retrieval succeeds
- cURL transport is used successfully
- preprod test numbers are used
- request matches the official curl example closely
- only `merchantpay` initiation fails
- returned error is:
  - `errorDescription = "Error in getting user language"`
  - `mmErrorCode = 4002`

## Current Conclusion

The current issue does **not** look like a basic code bug anymore.

The implementation has already been aligned closely with the Merchant Pay example and verified to use native cURL at runtime.

The most likely root cause is now:

- incorrect `partnerName`
- or incomplete MVola-side preprod provisioning for this merchant profile

This note is intentionally meant as a restart point for future investigation.
