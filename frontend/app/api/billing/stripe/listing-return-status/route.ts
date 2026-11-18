import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { getStripeServerClient } from "@/lib/stripe/server";
import { invalidatePublicWordPressCache, markWordPressListingPaid } from "@/lib/api/wordpress-internal";

type ListingReturnPayload = {
  listingId: number;
  paymentStatus: "paid" | "unpaid";
  isConfirmed: boolean;
  syncErrorMessage: string | null;
};

export async function POST(request: Request) {
  const session = getServerSession();
  if (!session?.wpUserId) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    sessionId?: string;
    listingId?: number;
    performSync?: boolean;
  } | null;

  const sessionId = (body?.sessionId || "").trim();
  const listingId = Number(body?.listingId || 0);
  const performSync = body?.performSync === true;

  if (!sessionId || !Number.isFinite(listingId) || listingId <= 0) {
    return NextResponse.json({ error: "sessionId et listingId sont requis." }, { status: 400 });
  }
  if (sessionId.includes("{") || sessionId.includes("}")) {
    return NextResponse.json({ error: "sessionId invalide (placeholder Stripe non remplace)." }, { status: 400 });
  }

  let syncErrorMessage: string | null = null;
  let isPaid = false;

  try {
    const stripe = getStripeServerClient();
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    const metadataUserId = Number.parseInt(stripeSession.metadata?.wp_user_id || "0", 10);
    const metadataListingId = Number.parseInt(stripeSession.metadata?.listing_id || "0", 10);

    if (metadataUserId <= 0 || metadataUserId !== session.wpUserId) {
      return NextResponse.json({ error: "Session Stripe invalide pour cet utilisateur." }, { status: 403 });
    }

    if (metadataListingId <= 0 || metadataListingId !== listingId) {
      return NextResponse.json({ error: "Session Stripe invalide pour cette annonce." }, { status: 403 });
    }

    isPaid = stripeSession.status === "complete" || stripeSession.payment_status === "paid" || stripeSession.payment_status === "no_payment_required";

    if (isPaid && performSync) {
      const pricingCode = (stripeSession.metadata?.pricing_code || "").trim();
      const wpProductId = Number.parseInt(stripeSession.metadata?.wp_product_id || "0", 10);
      const listingKind = (stripeSession.metadata?.listing_kind || "").trim();
      const scheduledPublishAt = (stripeSession.metadata?.scheduled_publish_at || "").trim();
      await markWordPressListingPaid({
        wpUserId: session.wpUserId,
        listingId,
        sessionId: stripeSession.id,
        pricingCode: pricingCode || undefined,
        wpProductId: Number.isFinite(wpProductId) && wpProductId > 0 ? wpProductId : undefined,
        scheduledPublishAt: scheduledPublishAt || undefined,
      });
      if (listingKind === "classified" || listingKind === "job" || listingKind === "tender") {
        await invalidatePublicWordPressCache(listingKind);
      }
    }
  } catch (error) {
    syncErrorMessage = error instanceof Error ? error.message : "Impossible de finaliser le paiement.";
  }

  const payload: ListingReturnPayload = {
    listingId,
    paymentStatus: isPaid ? "paid" : "unpaid",
    isConfirmed: isPaid && !syncErrorMessage,
    syncErrorMessage,
  };

  return NextResponse.json(payload);
}
