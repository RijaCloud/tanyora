import { NextResponse } from "next/server";
import { SUBSCRIPTION_PLANS } from "@/config/subscription-plans";
import { syncStripeSubscriptionInWordPress } from "@/lib/api/wordpress-internal";
import { isOnboardingRequired } from "@/lib/auth/flow";
import { getServerSession } from "@/lib/auth/session";
import { subscriptionProvider } from "@/lib/billing/subscription-provider";
import { getStripeServerClient } from "@/lib/stripe/server";
import type { BillingHistoryItem, BillingPeriod, SubscriptionPlanId, UserSubscriptionSnapshot } from "@/types/subscriptions";

function isPlanId(value?: string | null): value is SubscriptionPlanId {
  return value === "free" || value === "essentiel" || value === "business";
}

function toIsoFromUnix(timestamp?: number | null) {
  if (!timestamp) return null;
  return new Date(timestamp * 1000).toISOString();
}

function normalizeBillingPeriod(value?: string | null): BillingPeriod {
  return value === "annual" ? "annual" : "monthly";
}

function findLatestMatchingOrder(history: BillingHistoryItem[], planId: SubscriptionPlanId) {
  return history.find((item) => item.planId === planId);
}

function formatOrderNumber(orderNumber?: string | null) {
  if (!orderNumber) return "-";
  return orderNumber.startsWith("#") ? orderNumber : `#${orderNumber}`;
}

function shouldAttemptStripeSync(params: {
  metadataPlanId?: SubscriptionPlanId;
  metadataUserId: number;
  sessionWpUserId: number;
  stripeSessionStatus?: string | null;
  stripePaymentStatus?: string | null;
  stripeSubscriptionStatus?: string | null;
}) {
  const {
    metadataPlanId,
    metadataUserId,
    sessionWpUserId,
    stripeSessionStatus,
    stripePaymentStatus,
    stripeSubscriptionStatus,
  } = params;

  if (!metadataPlanId || metadataPlanId === "free") {
    return false;
  }

  if (metadataUserId <= 0 || metadataUserId !== sessionWpUserId) {
    return false;
  }

  if (stripeSessionStatus === "complete") {
    return true;
  }

  if (stripePaymentStatus === "paid" || stripePaymentStatus === "no_payment_required") {
    return true;
  }

  if (
    stripeSubscriptionStatus &&
    ["trialing", "active", "past_due", "unpaid", "canceled", "incomplete", "incomplete_expired"].includes(
      stripeSubscriptionStatus,
    )
  ) {
    return true;
  }

  return false;
}

export async function POST(request: Request) {
  const session = getServerSession();
  if (!session || !session.wpUserId) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  if (isOnboardingRequired(session)) {
    return NextResponse.json({ error: "Finalisez votre profil avant le suivi de paiement." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    sessionId?: string;
    selectedPlanId?: string | null;
    selectedBillingPeriod?: BillingPeriod | null;
    performSync?: boolean;
  } | null;
  const sessionId = body?.sessionId || null;
  const selectedPlanId = isPlanId(body?.selectedPlanId) ? body?.selectedPlanId : undefined;
  const performSync = body?.performSync === true;

  if (!sessionId) {
    return NextResponse.json({ error: "Session de paiement manquante." }, { status: 400 });
  }

  let syncedOrderId: number | null = null;
  let syncedPlanId: SubscriptionPlanId | null = null;
  let syncedStatus: UserSubscriptionSnapshot["status"] | null = null;
  let syncErrorMessage: string | null = null;
  let detectedBillingPeriod: BillingPeriod = normalizeBillingPeriod(body?.selectedBillingPeriod);

  try {
    const stripe = getStripeServerClient();
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "payment_intent"],
    });

    const metadataPlanId = isPlanId(stripeSession.metadata?.plan_id) ? stripeSession.metadata?.plan_id : selectedPlanId;
    const metadataUserId = Number.parseInt(stripeSession.metadata?.wp_user_id || "0", 10);
    const metadataWpProductSku = (stripeSession.metadata?.wp_product_sku || "").trim() || null;
    detectedBillingPeriod = normalizeBillingPeriod(stripeSession.metadata?.billing_period);
    const stripeSubscription =
      typeof stripeSession.subscription === "string"
        ? await stripe.subscriptions.retrieve(stripeSession.subscription)
        : stripeSession.subscription;

    const shouldSync = shouldAttemptStripeSync({
      metadataPlanId,
      metadataUserId,
      sessionWpUserId: session.wpUserId,
      stripeSessionStatus: stripeSession.status,
      stripePaymentStatus: stripeSession.payment_status,
      stripeSubscriptionStatus: stripeSubscription?.status ?? null,
    });

    if (shouldSync && metadataPlanId && performSync) {
      const planConfig = SUBSCRIPTION_PLANS[metadataPlanId];
      const syncResult = await syncStripeSubscriptionInWordPress({
        wpUserId: session.wpUserId,
        planId: metadataPlanId,
        billingPeriod: detectedBillingPeriod,
        wpProductSku: metadataWpProductSku || planConfig?.commerce.productKey || null,
        stripeCheckoutSessionId: stripeSession.id,
        stripeCustomerId:
          typeof stripeSession.customer === "string" ? stripeSession.customer : stripeSession.customer?.id || null,
        stripeSubscriptionId:
          typeof stripeSession.subscription === "string"
            ? stripeSession.subscription
            : stripeSession.subscription?.id || null,
        stripePaymentIntentId:
          typeof stripeSession.payment_intent === "string"
            ? stripeSession.payment_intent
            : stripeSession.payment_intent?.id || null,
        stripeStatus:
          stripeSubscription?.status ||
          (stripeSession.payment_status === "paid" || stripeSession.payment_status === "no_payment_required"
            ? "active"
            : stripeSession.status || null),
        stripeCurrentPeriodEnd: toIsoFromUnix(stripeSubscription?.items.data[0]?.current_period_end ?? null),
        amountTotal: stripeSession.amount_total ?? null,
        currency: stripeSession.currency ?? null,
      });

      syncedOrderId = syncResult.orderId;
      syncedPlanId = syncResult.planId;
      syncedStatus = syncResult.status as UserSubscriptionSnapshot["status"];
    }
  } catch (error) {
    syncErrorMessage = error instanceof Error ? error.message : "Impossible de finaliser l'activation pour le moment.";
  }

  // La synchronisation WordPress est la confirmation faisant autorite. Ne pas
  // reinterroger immediatement WooCommerce : sur une instance chargee, cette
  // lecture peut depasser son timeout alors que le paiement est deja actif.
  if (syncedOrderId && syncedPlanId && syncedStatus) {
    return NextResponse.json({
      planId: syncedPlanId,
      billingPeriod: detectedBillingPeriod,
      status: syncedStatus,
      orderNumber: `#${syncedOrderId}`,
      isConfirmed: syncedStatus === "active",
      syncErrorMessage: null,
      latestKnownOrderNumber: String(syncedOrderId),
    });
  }

  let subscription: UserSubscriptionSnapshot;
  let billingHistory: BillingHistoryItem[];
  try {
    [subscription, billingHistory] = await Promise.all([
      subscriptionProvider.getCurrentSubscription(String(session.wpUserId)),
      subscriptionProvider.getBillingHistory(String(session.wpUserId)),
    ]);
  } catch (error) {
    const fallbackPlanId = selectedPlanId || "free";
    const fallbackErrorMessage =
      syncErrorMessage ||
      "Votre paiement est en cours de confirmation. Votre accès sera mis à jour automatiquement.";

    return NextResponse.json({
      planId: fallbackPlanId,
      billingPeriod: detectedBillingPeriod,
      status: "trialing" as const,
      orderNumber: "-",
      isConfirmed: false,
      syncErrorMessage: fallbackErrorMessage,
      latestKnownOrderNumber: null,
    });
  }

  const expectedPlanId = selectedPlanId || subscription.planId;
  const currentPlanMatchesReturn = !selectedPlanId || subscription.planId === selectedPlanId;
  const latestMatchingOrder = findLatestMatchingOrder(billingHistory, expectedPlanId);
  const hasConfirmedSubscription = currentPlanMatchesReturn && subscription.status !== "none";
  const hasSyncFailure = Boolean(syncErrorMessage) && !syncedOrderId && !hasConfirmedSubscription;

  const displayPlanId = currentPlanMatchesReturn ? subscription.planId : expectedPlanId;
  const displayStatus: UserSubscriptionSnapshot["status"] =
    hasConfirmedSubscription ? subscription.status : hasSyncFailure ? "none" : "trialing";
  const displayOrderNumber = syncedOrderId
    ? `#${syncedOrderId}`
    : hasSyncFailure
      ? "-"
      : formatOrderNumber(latestMatchingOrder?.orderNumber || null);
  const isConfirmed = currentPlanMatchesReturn && subscription.status === "active";

  return NextResponse.json({
    planId: displayPlanId,
    billingPeriod: subscription.billingPeriod || detectedBillingPeriod,
    status: displayStatus,
    orderNumber: displayOrderNumber,
    isConfirmed,
    syncErrorMessage,
    latestKnownOrderNumber: hasSyncFailure ? null : latestMatchingOrder?.orderNumber || null,
  });
}
