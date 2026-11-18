import { NextRequest, NextResponse } from "next/server";
import { refreshPublicListingData } from "@/lib/api/listing-mutation";
import { isOnboardingRequired } from "@/lib/auth/flow";
import { isEmailVerificationRequired } from "@/lib/auth/email-verification";
import { getServerSession } from "@/lib/auth/session";
import { updateWordPressClassifiedStatus } from "@/lib/api/wordpress-internal";

type RouteContext = {
  params: {
    id: string;
  };
};

function parseListingId(raw: string) {
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const session = getServerSession();
  if (!session?.email || !session.wpUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isOnboardingRequired(session)) {
    return NextResponse.json({ error: "Onboarding requis avant changement de statut." }, { status: 403 });
  }

  if (isEmailVerificationRequired(session)) {
    return NextResponse.json({ error: "Verifiez votre email avant changement de statut." }, { status: 403 });
  }

  const listingId = parseListingId(context.params.id);
  if (!listingId) {
    return NextResponse.json({ error: "Identifiant annonce invalide." }, { status: 400 });
  }

  const result = await updateWordPressClassifiedStatus({
    wpUserId: session.wpUserId,
    listingId,
  });

  refreshPublicListingData("classified");

  return NextResponse.json(result);
}
