import { NextResponse } from "next/server";
import { SUBSCRIPTION_PLANS } from "@/config/subscription-plans";
import { getServerSession } from "@/lib/auth/session";
import { isOnboardingRequired } from "@/lib/auth/flow";
import { isEmailVerificationRequired } from "@/lib/auth/email-verification";
import {
  getWordPressSubscriptionPricingConfig,
  getWordPressRequestStatus,
  startPapiPaymentInWordPress,
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
      { error: "Finalisez votre profil et vérifiez votre email avant de souscrire." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    planId?: SubscriptionPlanId;
    billingPeriod?: BillingPeriod;
    expectedZeroPrice?: boolean;
  } | null;
  const planId = body?.planId;
  const billingPeriod = body?.billingPeriod === "annual" ? "annual" : "monthly";
  if (!planId || planId === "free" || !SUBSCRIPTION_PLANS[planId]) {
    return NextResponse.json({ error: "Plan invalide." }, { status: 400 });
  }

  const pricing = await getWordPressSubscriptionPricingConfig().catch(() => null);
  if (billingPeriod === "annual" && !pricing?.plans?.[planId]?.annual?.available) {
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
    const plan = SUBSCRIPTION_PLANS[planId];
    const checkout = await startPapiPaymentInWordPress({
      wpUserId: session.wpUserId,
      flow: "subscription",
      planId,
      billingPeriod,
      wpProductId: billingPeriod === "annual" ? plan.commerce.annualProductId : plan.commerce.productId,
      wpProductSku: billingPeriod === "annual" ? plan.commerce.annualProductKey : plan.commerce.productKey,
      expectedZeroPrice: body?.expectedZeroPrice === true,
    });
    if (checkout.activated === true && checkout.planId === planId) {
      return NextResponse.json({ activated: true, planId });
    }
    if (!checkout.checkoutUrl) {
      throw new Error("Le lien de paiement n'a pas pu être créé.");
    }

    return NextResponse.json(checkout);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible de lancer le paiement." },
      { status: getWordPressRequestStatus(error) ?? 502 },
    );
  }
}
