import { NextRequest, NextResponse } from "next/server";
import { getServerSession, setSessionCookie } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const session = getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Session introuvable." }, { status: 401 });
  }

  if (session.authProvider !== "google") {
    return NextResponse.json({ error: "Cette finalisation est reservee au flow Google." }, { status: 400 });
  }

  const body = await request.json();
  const resolvedUsername =
    typeof body.username === "string" && body.username.trim().length > 0
      ? body.username.trim()
      : session.username || null;

  if (!body.firstName || !body.lastName || !body.email || !body.phone) {
    return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
  }

  if (body.email !== session.email) {
    return NextResponse.json({ error: "L'email Google ne peut pas etre modifie." }, { status: 400 });
  }

  const response = NextResponse.json({
    user: {
      ...session,
      username: resolvedUsername,
      name: `${body.firstName} ${body.lastName}`.trim(),
      picture: body.profilePhoto || session.picture || null,
      onboardingCompleted: true,
      firstName: body.firstName,
      lastName: body.lastName,
    },
  });

  setSessionCookie(response, {
    ...session,
    username: resolvedUsername,
    name: `${body.firstName} ${body.lastName}`.trim(),
    picture: body.profilePhoto || session.picture || null,
    onboardingCompleted: true,
    firstName: body.firstName,
    lastName: body.lastName,
  });

  return response;
}
