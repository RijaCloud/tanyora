import { NextRequest, NextResponse } from "next/server";
import {
  getWordPressListingPayableQuote,
  getWordPressPricingCatalog,
  getWordPressPublishingAccessStatus,
  type ListingCheckoutAction,
} from "@/lib/api/wordpress-internal";
import { getServerSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const session = getServerSession();
  if (!session?.wpUserId) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { listingId?: number; action?: ListingCheckoutAction } | null;
  const listingId = Number(body?.listingId || 0);
  const action: ListingCheckoutAction = body?.action === "boost" ? "boost" : "post";
  if (!Number.isFinite(listingId) || listingId <= 0) {
    return NextResponse.json({ error: "listingId invalide." }, { status: 400 });
  }

  try {
    const accessStatus = await getWordPressPublishingAccessStatus({ wpUserId: session.wpUserId });
    const quote = await getWordPressListingPayableQuote({
      wpUserId: session.wpUserId,
      listingId,
      action,
    });

    if (quote.kind === "classified" && action === "post" && !accessStatus.classifieds.canPublish) {
      return NextResponse.json(
        { error: "Votre plan actuel ne permet pas de publier une petite annonce." },
        { status: 403 },
      );
    }

    if (quote.kind === "job" && action === "post" && !accessStatus.jobs.canPublish) {
      return NextResponse.json(
        { error: "Votre plan actuel ne permet pas de publier une offre d'emploi." },
        { status: 403 },
      );
    }

    if (quote.kind === "tender" && !accessStatus.tenders.canPublish) {
      return NextResponse.json(
        { error: "Votre plan actuel ne permet pas de publier ou booster un appel d'offres." },
        { status: 403 },
      );
    }

    const catalog = await getWordPressPricingCatalog();
    const pricing = catalog.items.find((entry) => entry.code === quote.pricingCode) || null;

    return NextResponse.json({
      quote,
      pricing,
      allPrivileges: accessStatus.accessGrant === "all_privileges",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible de calculer le montant." },
      { status: 502 },
    );
  }
}
