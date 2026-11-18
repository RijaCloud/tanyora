import { NextRequest, NextResponse } from "next/server";
import { refreshPublicListingData } from "@/lib/api/listing-mutation";
import { isOnboardingRequired } from "@/lib/auth/flow";
import { isEmailVerificationRequired } from "@/lib/auth/email-verification";
import { getServerSession } from "@/lib/auth/session";
import {
  deleteWordPressClassified,
  getWordPressPublishingAccessStatus,
  updateWordPressClassified,
} from "@/lib/api/wordpress-internal";
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/phone";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { submissionValidationErrorResponse } from "@/lib/security/submission-validation";
import { classifiedUpdateSchema } from "@/lib/security/validation";

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
    return NextResponse.json({ error: "Verifiez votre email avant de modifier une annonce." }, { status: 403 });
  }

  const listingId = parseListingId(context.params.id);
  if (!listingId) {
    return NextResponse.json({ error: "Identifiant annonce invalide." }, { status: 400 });
  }

  const updateRateLimit = await consumeRateLimit({
    scope: "classified-update",
    subject: `${session.wpUserId}:${getClientIp(request)}`,
    limit: 20,
    windowSeconds: 10 * 60,
  });
  if (!updateRateLimit.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives de modification. Merci de patienter." },
      { status: 429, headers: { "Retry-After": String(updateRateLimit.retryAfterSeconds) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsedBody = classifiedUpdateSchema.safeParse(body);
  if (!parsedBody.success) {
    return submissionValidationErrorResponse(parsedBody.error, "Veuillez corriger les champs signalés.");
  }

  const payload = parsedBody.data;
  const accessStatus = await getWordPressPublishingAccessStatus({ wpUserId: session.wpUserId });
  const galleryImageCount = Array.isArray(payload.galleryImageUrls) ? payload.galleryImageUrls.length : 0;
  if (galleryImageCount > accessStatus.classifieds.maxPhotos) {
    return NextResponse.json(
      { error: `Votre plan permet jusqu'à ${accessStatus.classifieds.maxPhotos} photo(s) par annonce.` },
      { status: 403 },
    );
  }
  const normalizedPhone = payload.contactPhone
    ? normalizePhoneNumber(payload.contactPhone, payload.contactPhoneCountry)
    : "";
  if (payload.contactPhone && !isValidPhoneNumber(payload.contactPhone, payload.contactPhoneCountry)) {
    return NextResponse.json({ error: "Numero de telephone invalide." }, { status: 400 });
  }

  const result = await updateWordPressClassified({
    wpUserId: session.wpUserId,
    listingId,
    title: payload.title,
    content: payload.content,
    excerpt: payload.excerpt,
    category: payload.category,
    productTag: payload.productTag,
    type: payload.type,
    companyName: payload.companyName,
    location: payload.location,
    city: payload.city,
    area: payload.area,
    condition: payload.condition,
    price: payload.price,
    currency: payload.currency,
    contactPhone: normalizedPhone,
    contactPhoneCountry: payload.contactPhoneCountry,
    featuredImageUrl: payload.featuredImageUrl,
    galleryImageUrls: payload.galleryImageUrls ?? [],
  });

  refreshPublicListingData("classified");

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
    return NextResponse.json({ error: "Verifiez votre email avant de supprimer une annonce." }, { status: 403 });
  }

  const listingId = parseListingId(context.params.id);
  if (!listingId) {
    return NextResponse.json({ error: "Identifiant annonce invalide." }, { status: 400 });
  }

  const deleteRateLimit = await consumeRateLimit({
    scope: "classified-delete",
    subject: `${session.wpUserId}`,
    limit: 20,
    windowSeconds: 10 * 60,
  });
  if (!deleteRateLimit.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives de suppression. Merci de patienter." },
      { status: 429, headers: { "Retry-After": String(deleteRateLimit.retryAfterSeconds) } },
    );
  }

  const result = await deleteWordPressClassified({
    wpUserId: session.wpUserId,
    listingId,
  });

  refreshPublicListingData("classified");

  return NextResponse.json(result);
}
