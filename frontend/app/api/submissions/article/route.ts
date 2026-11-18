import { NextRequest, NextResponse } from "next/server";
import { submitToWordPress } from "@/lib/api/wordpress-internal";
import { isOnboardingRequired } from "@/lib/auth/flow";
import { getServerSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const session = getServerSession();

  if (!session?.email || !session.wpUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isOnboardingRequired(session)) {
    return NextResponse.json({ error: "Onboarding requis avant de publier." }, { status: 403 });
  }

  const body = await request.json();
  const result = await submitToWordPress("article", {
    title: body.title,
    content: body.content,
    excerpt: body.excerpt,
    featuredImageUrl: body.featuredImageUrl,
    author: {
      auth0Sub: `wp-local:${session.wpUserId}`,
      email: session.email,
      name: session.name,
    },
  });

  return NextResponse.json(result);
}
