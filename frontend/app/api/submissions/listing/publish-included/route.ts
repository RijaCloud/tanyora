import { NextRequest, NextResponse } from "next/server";
import { refreshPublicListingData } from "@/lib/api/listing-mutation";
import {
  getWordPressPublishingAccessStatus,
  useWordPressAllPrivilegesListingAccess,
  useWordPressIncludedListingAccess,
} from "@/lib/api/wordpress-internal";
import { isEmailVerificationRequired } from "@/lib/auth/email-verification";
import { isOnboardingRequired } from "@/lib/auth/flow";
import { getServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
};

type PublishIncludedBody = {
  listingId?: number;
  kind?: "classified" | "job" | "tender";
  scheduledPublishAt?: string;
  requestId?: string;
};

export async function POST(request: NextRequest) {
  const session = getServerSession();
  if (!session?.wpUserId || !session.email) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  if (isOnboardingRequired(session)) {
    return NextResponse.json({ error: "Finalisez votre profil avant de publier." }, { status: 403 });
  }

  if (isEmailVerificationRequired(session)) {
    return NextResponse.json({ error: "Vérifiez votre email avant de publier." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as PublishIncludedBody | null;
  const listingId = Number(body?.listingId || 0);
  const kind = body?.kind === "job" || body?.kind === "tender" ? body.kind : "classified";
  if (!Number.isFinite(listingId) || listingId <= 0) {
    return NextResponse.json({ error: "listingId invalide." }, { status: 400 });
  }

  // All-privileges accounts are authorized and quota-checked by WordPress in
  // one operation. Do not make them wait for the separate included-credit read.
  if (session.accessGrant === "all_privileges") {
    try {
      const requestId = typeof body?.requestId === "string" && body.requestId.trim()
        ? body.requestId.trim().slice(0, 120)
        : crypto.randomUUID();
      const result = await useWordPressAllPrivilegesListingAccess({
        wpUserId: session.wpUserId,
        listingId,
        action: "post",
        requestId,
        scheduledPublishAt: body?.scheduledPublishAt,
      });
      refreshPublicListingData(kind);
      return NextResponse.json(result, { headers: NO_STORE_HEADERS });
    } catch (error) {
      const status = error instanceof Error && "status" in error && Number.isInteger((error as Error & { status?: number }).status)
        ? (error as Error & { status: number }).status
        : 500;
      const message = error instanceof Error ? error.message : "Impossible de publier ce contenu.";
      return NextResponse.json({ error: message }, { status });
    }
  }

  const accessStatus = await getWordPressPublishingAccessStatus({ wpUserId: session.wpUserId });
  const access = kind === "job"
    ? accessStatus.jobs
    : kind === "tender"
      ? accessStatus.tenders
      : accessStatus.classifieds;
  if (!access.canPublish) {
    return NextResponse.json({ error: "Votre plan actuel ne permet pas cette publication incluse." }, { status: 403 });
  }

  if (access.monthlyRemaining <= 0) {
    return NextResponse.json(
      {
        error: "Votre quota mensuel inclus est déjà atteint.",
        // The client may only continue to the paid checkout when the server confirms the quota is exhausted.
        paymentRequired: true,
      },
      { status: 403 },
    );
  }

  let result: Awaited<ReturnType<typeof useWordPressIncludedListingAccess>>;
  try {
    result = await useWordPressIncludedListingAccess({
      wpUserId: session.wpUserId,
      listingId,
      scheduledPublishAt: body?.scheduledPublishAt,
    });
  } catch (error) {
    const status = error instanceof Error && "status" in error && Number.isInteger((error as Error & { status?: number }).status)
      ? (error as Error & { status: number }).status
      : 500;
    const message = error instanceof Error ? error.message : "Impossible de publier ce contenu.";
    return NextResponse.json({ error: message }, { status });
  }

  refreshPublicListingData(kind);

  return NextResponse.json(result, { headers: NO_STORE_HEADERS });
}
