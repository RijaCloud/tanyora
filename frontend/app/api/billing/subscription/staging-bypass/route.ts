import { NextResponse } from "next/server";
import { SUBSCRIPTION_PLANS } from "@/config/subscription-plans";
import { getServerSession, setSessionCookie } from "@/lib/auth/session";
import { isOnboardingRequired } from "@/lib/auth/flow";
import { isEmailVerificationRequired } from "@/lib/auth/email-verification";
import {
  activateWordPressStagingSubscriptionBypass,
  getWordPressSubscriptionPricingConfig,
} from "@/lib/api/wordpress-internal";
import { subscriptionProvider } from "@/lib/billing/subscription-provider";
import type { BillingPeriod, SubscriptionPlanId } from "@/types/subscriptions";

export async function POST(request: Request) {
  const session = getServerSession();
  if (!session?.wpUserId) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }
  if (isOnboardingRequired(session) || isEmailVerificationRequired(session)) {
    return NextResponse.json(
      { error: "Finalisez votre profil et vérifiez votre email avant d'activer cet accès." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    planId?: SubscriptionPlanId;
    billingPeriod?: BillingPeriod;
  } | null;
  const planId = body?.planId;
  const billingPeriod = body?.billingPeriod === "annual" ? "annual" : "monthly";
  if (!planId || planId === "free" || !SUBSCRIPTION_PLANS[planId]) {
    return NextResponse.json({ error: "Plan invalide." }, { status: 400 });
  }

  const pricing = await getWordPressSubscriptionPricingConfig().catch(() => null);
  if (!pricing?.stagingBypassAvailable) {
    return NextResponse.json({ error: "L'accès de test est indisponible." }, { status: 403 });
  }
  if (billingPeriod === "annual" && !pricing.plans?.[planId]?.annual?.available) {
    return NextResponse.json({ error: "Le tarif annuel n'est pas disponible." }, { status: 400 });
  }

  const current = await subscriptionProvider.getCurrentSubscription(String(session.wpUserId));
  if (current.planId === "business" && planId === "essentiel" && current.status !== "none") {
    return NextResponse.json(
      { error: "Le plan Essentiel n'est pas disponible lorsque votre compte est déjà en formule Business." },
      { status: 403 },
    );
  }

  try {
    const result = await activateWordPressStagingSubscriptionBypass({
      wpUserId: session.wpUserId,
      planId,
      billingPeriod,
    });
    const response = NextResponse.json(result);
    setSessionCookie(response, {
      ...session,
      planId: result.planId,
      subscriptionStatus: "active",
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible d'activer l'accès de test." },
      { status: 502 },
    );
  }
}
