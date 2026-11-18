import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { DEFAULT_AUTH_RETURN_TO, sanitizeReturnTo } from "@/lib/auth/flow";

const GOOGLE_OAUTH_COOKIE = "2424_google_oauth";
const GOOGLE_OAUTH_MAX_AGE = 60 * 10;

type GoogleOauthCookie = {
  state: string;
  returnTo: string;
  appOrigin?: string | null;
  intent?: "login" | "signup";
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

export type GoogleUserProfile = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

function getGoogleClientId() {
  const value = process.env.GOOGLE_CLIENT_ID;
  if (!value) {
    throw new Error("GOOGLE_CLIENT_ID is not configured.");
  }

  return value;
}

function getGoogleClientSecret() {
  const value = process.env.GOOGLE_CLIENT_SECRET;
  if (!value) {
    throw new Error("GOOGLE_CLIENT_SECRET is not configured.");
  }

  return value;
}

function normalizeAppBaseUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.origin.replace(/\/$/, "");
  } catch {
    return value.replace(/\/$/, "");
  }
}

function isLocalOrigin(value?: string | null) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function getPreferredOrigin(...candidates: Array<string | null | undefined>) {
  const normalizedCandidates = candidates
    .map((candidate) => normalizeAppBaseUrl(candidate))
    .filter((candidate): candidate is string => Boolean(candidate));

  if (process.env.NODE_ENV === "production") {
    const publicCandidate = normalizedCandidates.find((candidate) => !isLocalOrigin(candidate));
    if (publicCandidate) {
      return publicCandidate;
    }
  }

  return normalizedCandidates[0] ?? null;
}

function getAppBaseUrl(requestOrigin?: string | null, forwardedOrigin?: string | null) {
  const value = getPreferredOrigin(
    process.env.APP_BASE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    forwardedOrigin,
    requestOrigin,
  );

  if (!value) {
    throw new Error("APP_BASE_URL is not configured.");
  }

  return value;
}

export function getPublicRequestOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const forwardedProto =
    request.headers.get("x-forwarded-proto") ||
    request.nextUrl.protocol.replace(":", "") ||
    "https";

  if (!forwardedHost) {
    return request.nextUrl.origin;
  }

  return `${forwardedProto}://${forwardedHost}`;
}

export function getGoogleCallbackUrl(requestOrigin?: string | null, forwardedOrigin?: string | null) {
  return `${getAppBaseUrl(requestOrigin, forwardedOrigin)}/api/auth/google/callback`;
}

export function createGoogleAuthorizationUrl(
  returnTo?: string | null,
  requestOrigin?: string | null,
  forwardedOrigin?: string | null,
  browserOrigin?: string | null,
  intent: "login" | "signup" = "login",
) {
  const state = randomBytes(24).toString("hex");
  const params = new URLSearchParams({
    client_id: getGoogleClientId(),
    redirect_uri: getGoogleCallbackUrl(requestOrigin, browserOrigin || forwardedOrigin),
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    include_granted_scopes: "true",
    prompt: "select_account",
    state,
  });

  return {
    state,
    returnTo: sanitizeReturnTo(returnTo),
    appOrigin: normalizeAppBaseUrl(browserOrigin),
    intent,
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  };
}

export function attachGoogleOauthCookie(response: NextResponse, payload: GoogleOauthCookie) {
  response.cookies.set({
    name: GOOGLE_OAUTH_COOKIE,
    value: Buffer.from(JSON.stringify(payload), "utf8").toString("base64url"),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: GOOGLE_OAUTH_MAX_AGE,
  });
}

export function clearGoogleOauthCookie(response: NextResponse) {
  response.cookies.set({
    name: GOOGLE_OAUTH_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
  });
}

export function readGoogleOauthCookie() {
  const value = cookies().get(GOOGLE_OAUTH_COOKIE)?.value;
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as GoogleOauthCookie;
  } catch {
    return null;
  }
}

export async function exchangeGoogleCode(
  code: string,
  requestOrigin?: string | null,
  forwardedOrigin?: string | null,
) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: getGoogleClientId(),
      client_secret: getGoogleClientSecret(),
      redirect_uri: getGoogleCallbackUrl(requestOrigin, forwardedOrigin),
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });

  const data = (await response.json()) as GoogleTokenResponse;
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Google token exchange failed.");
  }

  return data.access_token;
}

export async function fetchGoogleUserProfile(accessToken: string) {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const data = (await response.json()) as GoogleUserProfile;
  if (!response.ok || !data.email || !data.sub) {
    throw new Error("Google profile lookup failed.");
  }

  if (data.email_verified === false) {
    throw new Error("Votre email Google doit etre verifie pour continuer.");
  }

  return data;
}

export function getDefaultGoogleReturnTo() {
  return DEFAULT_AUTH_RETURN_TO;
}
