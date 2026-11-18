import { createHmac, timingSafeEqual } from "crypto";

const NOTIFICATION_EMAIL_UNSUBSCRIBE_PATH = "/desinscription";
const NOTIFICATION_PREFERENCES_PATH = "/profil/modifier";
const NOTIFICATION_EMAIL_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const NOTIFICATION_EMAIL_TOKEN_PURPOSE = "notification-email-unsubscribe";

function normalizeEmail(value: string) {
  return String(value || "").trim().toLowerCase();
}

function getNotificationEmailPreferencesSecret() {
  const value = process.env.EMAIL_PREFERENCES_SECRET?.trim() || process.env.PLATFORM_SUBMISSIONS_SECRET?.trim();
  if (!value) {
    throw new Error("EMAIL_PREFERENCES_SECRET or PLATFORM_SUBMISSIONS_SECRET must be configured.");
  }
  return value;
}

function getBaseOrigin(siteUrl?: string) {
  const candidate = String(siteUrl || process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_BASE_URL || "https://tanyora.mijary.tech").trim();

  try {
    return new URL(candidate).origin;
  } catch {
    return "https://tanyora.mijary.tech";
  }
}

function signNotificationEmailPayload(email: string, expiresAt: string) {
  return createHmac("sha256", getNotificationEmailPreferencesSecret())
    .update(`${NOTIFICATION_EMAIL_TOKEN_PURPOSE}:${email}:${expiresAt}`)
    .digest("base64url");
}

export function buildNotificationPreferencesUrl(siteUrl?: string) {
  return `${getBaseOrigin(siteUrl)}${NOTIFICATION_PREFERENCES_PATH}`;
}

export function buildNotificationUnsubscribeUrl(email: string, siteUrl?: string) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return buildNotificationPreferencesUrl(siteUrl);
  }

  const expiresAt = new Date(Date.now() + NOTIFICATION_EMAIL_TOKEN_TTL_MS).toISOString();
  const signature = signNotificationEmailPayload(normalizedEmail, expiresAt);
  const url = new URL(NOTIFICATION_EMAIL_UNSUBSCRIBE_PATH, `${getBaseOrigin(siteUrl)}/`);
  url.searchParams.set("email", normalizedEmail);
  url.searchParams.set("expires", expiresAt);
  url.searchParams.set("signature", signature);
  return url.toString();
}

export function verifyNotificationUnsubscribeToken(input: {
  email?: string | null;
  expires?: string | null;
  signature?: string | null;
}) {
  const email = normalizeEmail(input.email || "");
  const expiresAt = String(input.expires || "").trim();
  const signature = String(input.signature || "").trim();

  if (!email || !expiresAt || !signature) {
    return { ok: false as const, error: "missing_params", email };
  }

  const expiryDate = new Date(expiresAt);
  if (Number.isNaN(expiryDate.getTime())) {
    return { ok: false as const, error: "invalid_expiry", email };
  }

  if (expiryDate.getTime() < Date.now()) {
    return { ok: false as const, error: "expired", email };
  }

  const expectedSignature = signNotificationEmailPayload(email, expiresAt);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length) {
    return { ok: false as const, error: "invalid_signature", email };
  }

  if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
    return { ok: false as const, error: "invalid_signature", email };
  }

  return { ok: true as const, email };
}
