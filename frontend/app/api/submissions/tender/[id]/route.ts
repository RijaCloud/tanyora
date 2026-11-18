import { NextRequest, NextResponse } from "next/server";
import { refreshPublicListingData } from "@/lib/api/listing-mutation";
import { isEmailVerificationRequired } from "@/lib/auth/email-verification";
import { isOnboardingRequired } from "@/lib/auth/flow";
import { getServerSession } from "@/lib/auth/session";
import {
  deleteWordPressTender,
  getWordPressPublishingAccessStatus,
  isWordPressPublishingTimeoutError,
  updateWordPressTender,
} from "@/lib/api/wordpress-internal";
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/phone";
import { submissionValidationErrorResponse } from "@/lib/security/submission-validation";
import { tenderUpdateSchema } from "@/lib/security/validation";

type RouteContext = {
  params: {
    id: string;
  };
};

function parseListingId(raw: string) {
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = getServerSession();
  if (!session?.email || !session.wpUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isOnboardingRequired(session)) {
    return NextResponse.json({ error: "Onboarding requis avant modification." }, { status: 403 });
  }

  if (isEmailVerificationRequired(session)) {
    return NextResponse.json({ error: "Verifiez votre email avant de modifier un appel d'offre." }, { status: 403 });
  }

  const accessStatus = await getWordPressPublishingAccessStatus({ wpUserId: session.wpUserId });
  if (!accessStatus.tenders.canCreateDraft) {
    return NextResponse.json({ error: "Votre plan actuel ne permet pas de gerer un appel d'offres." }, { status: 403 });
  }

  const listingId = parseListingId(context.params.id);
  if (!listingId) {
    return NextResponse.json({ error: "Identifiant appel d'offre invalide." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = tenderUpdateSchema.safeParse(body);
  if (!parsedBody.success) {
    return submissionValidationErrorResponse(parsedBody.error, "Veuillez corriger les champs signalés.");
  }

  const payload = parsedBody.data;
  const normalizedPhone = payload.contactPhone
    ? normalizePhoneNumber(payload.contactPhone, payload.contactPhoneCountry)
    : "";
  if (payload.contactPhone && !isValidPhoneNumber(payload.contactPhone, payload.contactPhoneCountry)) {
    return NextResponse.json({ error: "Numero de telephone invalide." }, { status: 400 });
  }

  const result = await updateWordPressTender({
    wpUserId: session.wpUserId,
    listingId,
    title: payload.title,
    content: payload.content,
    excerpt: payload.excerpt,
    category: payload.category,
    type: payload.type,
    companyName: payload.companyName,
    location: payload.location,
    budget: payload.budget,
    currency: payload.currency,
    detailsPdfUrl: payload.detailsPdfUrl,
    detailsPdfName: payload.detailsPdfName,
    deadline: payload.deadline,
    contactPhone: normalizedPhone || undefined,
    contactPhoneCountry: payload.contactPhoneCountry || undefined,
    contactEmail: payload.contactEmail,
    featuredImageUrl: payload.featuredImageUrl,
  });

  refreshPublicListingData("tender");

  return NextResponse.json(result);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = getServerSession();
  if (!session?.email || !session.wpUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isOnboardingRequired(session)) {
    return NextResponse.json({ error: "Onboarding requis avant suppression." }, { status: 403 });
  }

  if (isEmailVerificationRequired(session)) {
    return NextResponse.json({ error: "Verifiez votre email avant de supprimer un appel d'offre." }, { status: 403 });
  }

  const accessStatus = await getWordPressPublishingAccessStatus({ wpUserId: session.wpUserId });
  if (!accessStatus.tenders.canCreateDraft) {
    return NextResponse.json({ error: "Votre plan actuel ne permet pas de gerer un appel d'offres." }, { status: 403 });
  }

  const listingId = parseListingId(context.params.id);
  if (!listingId) {
    return NextResponse.json({ error: "Identifiant appel d'offre invalide." }, { status: 400 });
  }

  let result;
  try {
    result = await deleteWordPressTender({
      wpUserId: session.wpUserId,
      listingId,
    });
  } catch (error) {
    if (isWordPressPublishingTimeoutError(error)) {
      return NextResponse.json(
        { status: "processing", retryAfterMs: 1000 },
        { status: 202, headers: { "Retry-After": "1" } },
      );
    }
    throw error;
  }

  refreshPublicListingData("tender");

  return NextResponse.json(result);
}
