# Tanyora commerce v1 foundation

This is an inactive foundation for the mineral marketplace. It does not turn a
classified listing into a compliant sale, authorize a seller, verify a buyer,
reserve stock, create an order, or collect a payment. Existing classifieds,
directory and book catalog behavior is unchanged.

## Current implementation

- `wp-plugin/includes/tanyora-commerce.php` defines twelve dedicated MariaDB
  tables for organizations, memberships, verification references, seller scopes,
  listing compliance, quantity pools and movements, reservations, RFQs, offers,
  orders and audit events. No NIF, permit, KYC file, QR code or raw institutional
  reference is stored by this foundation.
- Schema installation is explicit, versioned (currently version 3) and idempotent.
  It checks the twelve tables, InnoDB engine, essential columns and organization
  idempotency index before marking the schema ready. Existing organization rows
  from an older schema require a reviewed manual migration. No public request,
  plugin activation or update invokes it. The CLI command requires
  `TANYORA_COMMERCE_MIGRATION_ALLOWED=1` and a verified backup.
- The internal WordPress capability endpoint requires the existing internal
  secret. The Next.js endpoint `/api/commerce/capabilities` fails closed when
  WordPress is unavailable. Every commercial capability is false by default,
  even after the tables exist. Online mineral payment remains false regardless
  of an upstream response.
- `frontend/lib/commerce/verification-adapters.ts` defines separate seller and
  buyer verification contracts. Both default adapters return `unavailable`;
  they do not generate or simulate an approval.
- `tanyora_commerce_evaluate_policy()` is a pure internal guard over trusted
  server-side facts. It rejects missing or expired direct official seller
  confirmation, same-person review and approval, scope and organization
  mismatch, internal-only buyer approval, unavailable quantity, and gold export
  without an authorized comptoir. It is not yet wired to a publication or
  transaction route; returning eligible does not activate a feature.
- These flags describe global feature readiness only. They do not represent
  an individual user's seller or buyer authorization.
- A signed-in, onboarded, email-verified user may declare an organization via
  `POST /api/commerce/organizations` with a UUID `x-idempotency-key`; the
  WordPress write and founder membership are atomic. `GET` returns only active
  memberships for that session user. The declaration status is `pending` and
  confers no commercial rights. Both routes return 503 until schema migration;
  there is no public organization UI yet. The internal WordPress routes are
  protected by the existing server-to-server secret, not a browser-supplied
  WordPress user ID.

## Safe migration sequence

1. Preserve the current uncommitted Tanyora frontend and plugin changes in a
   reviewable snapshot. Never copy 2424.mg accounts, payments or credentials.
2. On an isolated clone of Tanyora WordPress and MariaDB, restore a recent
   backup and run the WordPress PHPUnit suite. Verify the existing classifieds,
   directory and book catalog still work.
3. Only on that isolated clone, run the CLI migration with the explicit
   migration flag. Check all tables, their InnoDB engine and indexes, then
   repeat the command to confirm idempotency. Test restoration from the backup.
4. Review the schema and retention policy with the institution and privacy
   owner before migrating the Winford instance. Do not run the migration on
   2424.mg or its database.
5. Leave commercial capabilities closed until institutional seller verification,
   buyer KYC/KYB provider, legal rules and concurrent reservation tests are
   implemented and approved.

## Next implementation increments

1. Add member invitations and role-specific, tenant-scoped authorization for
   every future commercial action. A seller confirmation must originate from a
   documented official channel and require separate recorder and approver
   identities; it must not be labeled as an automatic ministry validation.
   Keep raw evidence outside the platform.
2. Add a configurable institutional adapter. No OIDC, SAML, token, QR format or
   ministerial URL may be assumed before the DSI confirms the protocol. Fail
   closed on invalid, expired or unavailable verification.
3. Add the buyer KYC/KYB provider adapter. Until a provider is integrated,
   neither RFQ nor order creation is enabled. Store only references and status
   in Tanyora, with supporting documents outside the platform.
4. Add substance-specific catalog fields and per-listing compliance. For gold,
   distinguish actor types and require a licensed gold comptoir for commercial
   export. Review the current law and future changes with legal counsel.
5. Implement atomic quantity-pool operations and an append-only movement
   ledger. Lock the shared seller/substance authorization pool inside a MariaDB
   transaction for publishing, reserving, committing, selling, cancelling and
   reducing a limit. Never count off-platform sales.
6. Add RFQ, offer, negotiation and fixed-price order APIs with server-side
   status transitions, idempotency and tenant isolation. Orders remain blocked
   until both parties and the listing are eligible.
7. Add payment-method policy and external-settlement references only after
   approval. Do not reuse classified-submission or subscription PAPI/Stripe
   flows. Tanyora must never hold mineral-sale funds.

## Required test gates

Cover the fourteen TDR scenarios, especially two concurrent reservations,
shared-limit oversubscription across listings, limit reduction, suspension,
cross-organization access, a forged payment callback and reservation release.
Verify that unavailable external services block new commercial actions while
catalog browsing remains available. No production rollout before backup and
restore validation.
