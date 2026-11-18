import { NextRequest, NextResponse } from "next/server";
import { confirmWordPressEmailVerification } from "@/lib/api/wordpress-internal";
import { getServerSession, setSessionCookie } from "@/lib/auth/session";

function getRedirectBase(request: NextRequest) {
  const appBase = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (appBase) {
    try {
      return new URL(appBase).origin;
    } catch {
      // noop
    }
  }
  return request.nextUrl.origin;
}

async function confirmEmailVerification(email: string, token: string) {
  await confirmWordPressEmailVerification({ email, token });

  const session = getServerSession();
  return session && session.email.toLowerCase() === email
    ? {
        ...session,
        emailVerified: true,
      }
    : null;
}

export async function GET(request: NextRequest) {
  const token = String(request.nextUrl.searchParams.get("token") || "").trim();
  const email = String(request.nextUrl.searchParams.get("email") || "")
    .trim()
    .toLowerCase();
  const redirectBase = getRedirectBase(request);

  if (!token || !email) {
    return NextResponse.redirect(new URL("/login?verification=invalid", redirectBase));
  }

  try {
    const updatedSession = await confirmEmailVerification(email, token);
    const response = NextResponse.redirect(new URL("/login?verification=success", redirectBase));
    if (updatedSession) {
      setSessionCookie(response, updatedSession);
    }

    return response;
  } catch {
    return NextResponse.redirect(new URL("/login?verification=failed", redirectBase));
  }
}

export async function POST(request: NextRequest) {
  let payload: { email?: string; token?: string };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
  }

  const token = String(payload.token || "").trim();
  const email = String(payload.email || "")
    .trim()
    .toLowerCase();

  if (!token || !email) {
    return NextResponse.json({ error: "Lien de vérification invalide." }, { status: 400 });
  }

  try {
    const updatedSession = await confirmEmailVerification(email, token);
    const response = NextResponse.json({ ok: true, emailVerified: true });
    if (updatedSession) {
      setSessionCookie(response, updatedSession);
    }

    return response;
  } catch {
    return NextResponse.json({ error: "Lien de vérification invalide ou expiré." }, { status: 400 });
  }
}
