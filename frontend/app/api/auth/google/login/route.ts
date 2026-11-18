import { NextRequest, NextResponse } from "next/server";
import { attachGoogleOauthCookie, createGoogleAuthorizationUrl, getPublicRequestOrigin } from "@/lib/auth/google";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const publicOrigin = getPublicRequestOrigin(request);
    const browserOrigin = request.nextUrl.searchParams.get("origin");
    const intent = request.nextUrl.searchParams.get("intent") === "signup" ? "signup" : "login";
    const { state, returnTo, url } = createGoogleAuthorizationUrl(
      request.nextUrl.searchParams.get("returnTo"),
      request.nextUrl.origin,
      publicOrigin,
      browserOrigin,
      intent,
    );
    const response = NextResponse.redirect(url);

    attachGoogleOauthCookie(response, { state, returnTo, appOrigin: browserOrigin, intent });
    return response;
  } catch (error) {
    console.error("[auth/google/login] unexpected error", error);
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent("Connexion Google temporairement indisponible. Veuillez réessayer.")}`,
        request.url,
      ),
    );
  }
}
