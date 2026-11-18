import { NextResponse } from "next/server";
import { isOnboardingRequired } from "@/lib/auth/flow";
import { isEmailVerificationRequired } from "@/lib/auth/email-verification";
import { getServerSession } from "@/lib/auth/session";
import {
  getWordPressListingPayableQuote,
  getWordPressPublishingAccessStatus,
  getWordPressRequestStatus,
  startPapiPaymentInWordPress,
  useWordPressAllPrivilegesListingAccess,
  type ListingCheckoutAction,
} from "@/lib/api/wordpress-internal";

type ListingCheckoutBody = {
  listingId?: number;
  action?: ListingCheckoutAction;
  returnTo?: string;
  scheduledPublishAt?: string;
  requestId?: string;
};

function sanitizeReturnTo(pathname?: string) {
  return pathname?.startsWith("/") && !pathname.startsWith("//")
    ? pathname
    : "/profil/petites-annonces";
}

function returnTargetFor(pathname: string) {
  if (pathname === "/profil/appels-offres") return "tenders";
  if (pathname === "/profil/offres-emploi") return "jobs";
  if (pathname === "/profil/articles") return "articles";
  return "classifieds";
}

export async function POST(request: Request) {
  const session = getServerSession();
  if (!session?.wpUserId) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }
  if (isOnboardingRequired(session) || isEmailVerificationRequired(session)) {
    return NextResponse.json(
      { error: "Finalisez votre profil et vérifiez votre email avant de payer ce contenu." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as ListingCheckoutBody | null;
  const listingId = Number(body?.listingId || 0);
  const action: ListingCheckoutAction = body?.action === "boost" ? "boost" : "post";
  if (!Number.isInteger(listingId) || listingId <= 0) {
    return NextResponse.json({ error: "listingId requis." }, { status: 400 });
  }

  try {
    const [access, quote] = await Promise.all([
      getWordPressPublishingAccessStatus({ wpUserId: session.wpUserId }),
      getWordPressListingPayableQuote({ wpUserId: session.wpUserId, listingId, action }),
    ]);
    if (quote.kind === "classified" && action === "post" && !access.classifieds.canPublish) {
      return NextResponse.json({ error: "Votre plan actuel ne permet pas de publier une petite annonce." }, { status: 403 });
    }
    if (quote.kind === "job" && action === "post" && !access.jobs.canPublish) {
      return NextResponse.json({ error: "Votre plan actuel ne permet pas de publier une offre d'emploi." }, { status: 403 });
    }
    if (quote.kind === "tender" && !access.tenders.canPublish) {
      return NextResponse.json({ error: "Votre plan actuel ne permet pas de publier ou booster un appel d'offres." }, { status: 403 });
    }

    const returnTo = sanitizeReturnTo(body?.returnTo);
    const returnTarget = returnTargetFor(returnTo);
    if (access.accessGrant === "all_privileges") {
      const requestId = typeof body?.requestId === "string" && body.requestId.trim() !== ""
        ? body.requestId.trim().slice(0, 120)
        : crypto.randomUUID();
      const result = await useWordPressAllPrivilegesListingAccess({
        wpUserId: session.wpUserId,
        listingId: quote.listingId,
        action,
        requestId,
        scheduledPublishAt: body?.scheduledPublishAt || "",
      });
      return NextResponse.json({ ...result, listingId: quote.listingId, returnTo });
    }
    const checkout = await startPapiPaymentInWordPress({
      wpUserId: session.wpUserId,
      flow: "listing",
      listingId: quote.listingId,
      action,
      scheduledPublishAt: body?.scheduledPublishAt || "",
      returnTarget,
    });
    if (!checkout.checkoutUrl) {
      throw new Error("Le lien de paiement n'a pas pu être créé.");
    }

    return NextResponse.json({ ...checkout, listingId: quote.listingId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible de lancer le paiement." },
      { status: getWordPressRequestStatus(error) ?? 502 },
    );
  }
}
