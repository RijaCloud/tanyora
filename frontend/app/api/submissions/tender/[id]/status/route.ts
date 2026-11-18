import { NextRequest, NextResponse } from "next/server";
import { refreshPublicListingData } from "@/lib/api/listing-mutation";
import { isEmailVerificationRequired } from "@/lib/auth/email-verification";
import { isOnboardingRequired } from "@/lib/auth/flow";
import { getServerSession } from "@/lib/auth/session";
import { getWordPressPublishingAccessStatus, updateWordPressTenderStatus } from "@/lib/api/wordpress-internal";

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

  const accessStatus = await getWordPressPublishingAccessStatus({ wpUserId: session.wpUserId });
  if (!accessStatus.tenders.canCreateDraft) {
    return NextResponse.json({ error: "Votre plan actuel ne permet pas de gerer un appel d'offres." }, { status: 403 });
  }

  const listingId = parseListingId(context.params.id);
  if (!listingId) {
    return NextResponse.json({ error: "Identifiant appel d'offre invalide." }, { status: 400 });
  }

  const result = await updateWordPressTenderStatus({
    wpUserId: session.wpUserId,
    listingId,
  });

  refreshPublicListingData("tender");

  return NextResponse.json(result);
}
