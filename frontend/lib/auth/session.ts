import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { SubscriptionPlanId, UserSubscriptionSnapshot } from "@/types/subscriptions";

export type AppSessionUser = {
  wpUserId: number;
  email: string;
  name: string;
  username?: string;
  role?: string;
  emailVerified?: boolean;
  businessActivityCategory?: string;
  picture?: string | null;
  planId?: SubscriptionPlanId;
  subscriptionStatus?: UserSubscriptionSnapshot["status"];
  accessGrant?: UserSubscriptionSnapshot["accessGrant"];
  authProvider?: "local" | "google";
  providerSubject?: string;
  onboardingCompleted?: boolean;
  onboardingIntent?: "signup" | "complete-profile";
  firstName?: string;
  lastName?: string;
};

const SESSION_COOKIE_NAME = "2424_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 14;
const SAFE_COOKIE_VALUE_MAX_LENGTH = 3500;

function sanitizeString(value: string | undefined, maxLength: number) {
  if (!value) return value;
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function sanitizeSessionUserForCookie(user: AppSessionUser): AppSessionUser {
  const rawPicture = user.picture || null;
  const isDataUrl = typeof rawPicture === "string" && rawPicture.trim().toLowerCase().startsWith("data:");
  const normalizedPicture = isDataUrl ? null : sanitizeString(rawPicture || undefined, 2048) || null;

  return {
    ...user,
    email: sanitizeString(user.email, 254) || user.email,
    name: sanitizeString(user.name, 120) || user.name,
    username: sanitizeString(user.username, 60),
    firstName: sanitizeString(user.firstName, 80),
    lastName: sanitizeString(user.lastName, 80),
    businessActivityCategory: sanitizeString(user.businessActivityCategory, 120),
    providerSubject: sanitizeString(user.providerSubject, 200),
    picture: normalizedPicture,
  };
}

function getSessionSecret() {
  return process.env.APP_SESSION_SECRET || process.env.AUTH0_SECRET || "2424-local-session-secret";
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function serializeSession(user: AppSessionUser) {
  const payload = base64UrlEncode(JSON.stringify(user));
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function parseSession(token?: string | null): AppSessionUser | null {
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    return JSON.parse(base64UrlDecode(payload)) as AppSessionUser;
  } catch {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, user: AppSessionUser) {
  let safeUser = sanitizeSessionUserForCookie(user);
  let token = serializeSession(safeUser);

  if (token.length > SAFE_COOKIE_VALUE_MAX_LENGTH) {
    safeUser = {
      ...safeUser,
      providerSubject: undefined,
      firstName: undefined,
      lastName: undefined,
    };
    token = serializeSession(safeUser);
  }

  if (token.length > SAFE_COOKIE_VALUE_MAX_LENGTH) {
    safeUser = {
      ...safeUser,
      picture: null,
    };
    token = serializeSession(safeUser);
  }

  if (token.length > SAFE_COOKIE_VALUE_MAX_LENGTH) {
    safeUser = {
      wpUserId: safeUser.wpUserId,
      email: safeUser.email,
      name: safeUser.name,
      username: safeUser.username,
      role: safeUser.role,
      planId: safeUser.planId,
      subscriptionStatus: safeUser.subscriptionStatus,
      accessGrant: safeUser.accessGrant,
      authProvider: safeUser.authProvider,
      onboardingCompleted: safeUser.onboardingCompleted,
    };
    token = serializeSession(safeUser);
  }

  if (token.length > SAFE_COOKIE_VALUE_MAX_LENGTH) {
    console.warn("[session] cookie payload remains large after sanitization", {
      length: token.length,
      wpUserId: safeUser.wpUserId,
    });
  }

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
  });
}

export function getServerSession(): AppSessionUser | null {
  const store = cookies();
  return parseSession(store.get(SESSION_COOKIE_NAME)?.value);
}
