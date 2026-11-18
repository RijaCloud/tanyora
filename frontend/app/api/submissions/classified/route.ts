import { NextRequest, NextResponse } from "next/server";
import { refreshPublicListingData } from "@/lib/api/listing-mutation";
import { isSubmissionStillProcessing } from "@/lib/api/submission-recovery";
import { submitToWordPress } from "@/lib/api/wordpress-internal";
import { isOnboardingRequired } from "@/lib/auth/flow";
import { isEmailVerificationRequired } from "@/lib/auth/email-verification";
import { getServerSession } from "@/lib/auth/session";
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/phone";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { submissionValidationErrorResponse } from "@/lib/security/submission-validation";
import { classifiedCreateSchema } from "@/lib/security/validation";

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const session = getServerSession();

  if (!session?.email || !session.wpUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isOnboardingRequired(session)) {
    return NextResponse.json({ error: "Onboarding requis avant de publier." }, { status: 403 });
  }

  if (isEmailVerificationRequired(session)) {
    return NextResponse.json({ error: "Verifiez votre email avant de publier une annonce." }, { status: 403 });
  }

  const publishRateLimit = await consumeRateLimit({
    scope: "classified-create",
    subject: `${session.wpUserId}:${getClientIp(request)}`,
    // A slow media finalization is retried with the same idempotency key.
    // Leave room for those safe retries without removing create-rate protection.
    limit: 30,
    windowSeconds: 10 * 60,
  });
  if (!publishRateLimit.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives de publication. Merci de patienter." },
      { status: 429, headers: { "Retry-After": String(publishRateLimit.retryAfterSeconds) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsedBody = classifiedCreateSchema.safeParse(body);
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

  let result;
  try {
    result = await submitToWordPress("classified", {
      wpUserId: session.wpUserId,
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
      // The session is signed server-side. WordPress uses this trusted plan only
      // to read the configured photo cap, avoiding a second WooCommerce lookup.
      trustedPlanId: session.planId || "free",
      author: {
        auth0Sub: `wp-local:${session.wpUserId}`,
        email: session.email,
        name: session.name,
      },
      requestId: request.headers.get("x-idempotency-key") || undefined,
    });
  } catch (error) {
    // WordPress can complete after the upstream request times out. The client
    // retries with the same idempotency key and receives that single result.
    if (isSubmissionStillProcessing(error)) {
      return NextResponse.json(
        { status: "processing", retryAfterMs: 1500 },
        { status: 202, headers: { "Retry-After": "2" } },
      );
    }
    throw error;
  }

  if (result.finalizationStatus === "ready") {
    refreshPublicListingData("classified");
  }

  console.info("[classified-create] draft accepted", {
    listingId: result.id,
    requestId: request.headers.get("x-idempotency-key") || "",
    finalizationStatus: result.finalizationStatus || "ready",
    durationMs: Date.now() - startedAt,
  });

  return NextResponse.json(result);
}
