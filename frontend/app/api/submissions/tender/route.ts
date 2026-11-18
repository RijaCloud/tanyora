import { NextRequest, NextResponse } from "next/server";
import { refreshPublicListingData } from "@/lib/api/listing-mutation";
import { getWordPressPublishingAccessStatus, submitToWordPress } from "@/lib/api/wordpress-internal";
import { isEmailVerificationRequired } from "@/lib/auth/email-verification";
import { isOnboardingRequired } from "@/lib/auth/flow";
import { getServerSession } from "@/lib/auth/session";
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/phone";
import { submissionValidationErrorResponse } from "@/lib/security/submission-validation";
import { tenderCreateSchema } from "@/lib/security/validation";

export async function POST(request: NextRequest) {
  const session = getServerSession();

  if (!session?.email || !session.wpUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isOnboardingRequired(session)) {
    return NextResponse.json({ error: "Onboarding requis avant de publier." }, { status: 403 });
  }

  if (isEmailVerificationRequired(session)) {
    return NextResponse.json({ error: "Verifiez votre email avant de publier un appel d'offre." }, { status: 403 });
  }

  const accessStatus = await getWordPressPublishingAccessStatus({ wpUserId: session.wpUserId });
  if (!accessStatus.tenders.canCreateDraft) {
    return NextResponse.json({ error: "Votre plan actuel ne permet pas de creer un appel d'offres." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = tenderCreateSchema.safeParse(body);
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

  const result = await submitToWordPress("tender", {
    title: payload.title,
    content: payload.content,
    excerpt: payload.excerpt,
    category: payload.category,
    type: payload.type,
    companyName: payload.companyName,
    location: payload.location,
    deadline: payload.deadline,
    budget: payload.budget,
    currency: payload.currency,
    detailsPdfUrl: payload.detailsPdfUrl,
    detailsPdfName: payload.detailsPdfName,
    contactPhone: normalizedPhone,
    contactPhoneCountry: payload.contactPhoneCountry,
    contactEmail: payload.contactEmail,
    featuredImageUrl: payload.featuredImageUrl,
    author: {
      auth0Sub: `wp-local:${session.wpUserId}`,
      email: session.email,
      name: session.name,
    },
    requestId: request.headers.get("x-idempotency-key") || undefined,
  });

  refreshPublicListingData("tender");

  return NextResponse.json(result);
}
