import { NextResponse } from "next/server";
import { downgradeWordPressSubscriptionToFree } from "@/lib/api/wordpress-internal";
import { isOnboardingRequired } from "@/lib/auth/flow";
import { getServerSession, setSessionCookie } from "@/lib/auth/session";
import { subscriptionProvider } from "@/lib/billing/subscription-provider";

export async function POST() {
  const session = getServerSession();
  if (!session?.wpUserId) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }
  if (isOnboardingRequired(session)) {
    return NextResponse.json({ error: "Finalisez votre profil avant de gérer votre abonnement." }, { status: 403 });
  }

  try {
    const downgradeResult = await downgradeWordPressSubscriptionToFree({
      wpUserId: session.wpUserId,
      reason: "self-service-downgrade-free",
    });
    const freshSubscription = await subscriptionProvider.getCurrentSubscription(String(session.wpUserId));
    const response = NextResponse.json({
      ok: true,
      planId: freshSubscription.planId,
      status: freshSubscription.status,
      cancelledSubscriptionIds: downgradeResult.cancelledSubscriptionIds,
    });
    setSessionCookie(response, {
      ...session,
      planId: freshSubscription.planId,
      subscriptionStatus: freshSubscription.status,
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible de repasser sur la formule Free pour le moment." },
      { status: 500 },
    );
  }
}
