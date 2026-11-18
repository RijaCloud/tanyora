import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "2424_session";

type MiddlewareSession = {
  authProvider?: "local" | "google";
  onboardingCompleted?: boolean;
};

function sanitizeReturnToPath(value?: string | null) {
  if (!value) {
    return "/";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

function normalizeOrigin(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isLocalOrigin(origin?: string | null) {
  if (!origin) {
    return false;
  }

  try {
    const url = new URL(origin);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function getPublicOriginFromRequest(request: NextRequest) {
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

function canonicalHost() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_BASE_URL || "").hostname.toLowerCase();
  } catch {
    return "";
  }
}

function resolveRedirectOrigin(request: NextRequest) {
  const candidates = [
    normalizeOrigin(process.env.APP_BASE_URL),
    normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL),
    normalizeOrigin(getPublicOriginFromRequest(request)),
    request.nextUrl.origin,
  ].filter((value): value is string => Boolean(value));

  if (process.env.NODE_ENV === "production") {
    const nonLocal = candidates.find((origin) => !isLocalOrigin(origin));
    if (nonLocal) {
      return nonLocal;
    }
  }

  return candidates[0] ?? request.nextUrl.origin;
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

function readSessionFromCookie(token?: string): MiddlewareSession | null {
  if (!token) {
    return null;
  }

  const [payload] = token.split(".");
  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(payload)) as MiddlewareSession;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Nginx performs the primary redirect. Keeping this guard in Next protects
  // direct upstream traffic from creating a second indexed host.
  const requestedHost = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").split(":")[0].toLowerCase();
  if (requestedHost === "2424.mg" && process.env.DEPLOYMENT_ENV === "production" && canonicalHost() === "www.2424.mg") {
    const redirectUrl = new URL(`${pathname}${search}`, "https://www.2424.mg");
    return NextResponse.redirect(redirectUrl, 301);
  }

  const session = readSessionFromCookie(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (pathname.startsWith("/onboarding")) {
    if (session && session.onboardingCompleted !== false) {
      const returnTo = sanitizeReturnToPath(request.nextUrl.searchParams.get("returnTo"));
      const redirectUrl = new URL(returnTo, resolveRedirectOrigin(request));
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  if (!session || session.onboardingCompleted !== false) {
    return NextResponse.next();
  }

  const redirectUrl = new URL("/onboarding", resolveRedirectOrigin(request));
  redirectUrl.searchParams.set("method", session.authProvider === "google" ? "google" : "email");
  redirectUrl.searchParams.set("returnTo", `${pathname}${search}`);

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|service-worker.js).*)",
  ],
};
