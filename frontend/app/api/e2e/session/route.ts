import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, type AppSessionUser } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const unique = Date.now();

  const user: AppSessionUser = {
    wpUserId: Number(body?.wpUserId) || 2424000 + (unique % 10000),
    email: typeof body?.email === "string" && body.email.trim() ? body.email.trim() : `playwright+e2e-${unique}@example.com`,
    name: typeof body?.name === "string" && body.name.trim() ? body.name.trim() : "Playwright Theme",
    username:
      typeof body?.username === "string" && body.username.trim() ? body.username.trim() : `playwright_theme_${unique}`,
    role: "subscriber",
    emailVerified: true,
    authProvider: "local",
    onboardingCompleted: true,
    planId: "free",
    subscriptionStatus: "none",
    firstName: "Playwright",
    lastName: "Theme",
  };

  const response = NextResponse.json({ ok: true, user });
  setSessionCookie(response, user);
  return response;
}
