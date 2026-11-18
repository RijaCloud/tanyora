import { NextResponse } from "next/server";
import Stripe from "stripe";
import { SUBSCRIPTION_PLANS } from "@/config/subscription-plans";
import { syncStripeSubscriptionInWordPress } from "@/lib/api/wordpress-internal";
import { isOnboardingRequired } from "@/lib/auth/flow";
import { getServerSession } from "@/lib/auth/session";
import { subscriptionProvider } from "@/lib/billing/subscription-provider";
import { getStripeServerClient } from "@/lib/stripe/server";
import type { BillingPeriod, SubscriptionPlanId } from "@/types/subscriptions";

function billingResyncLog(message: string, context?: Record<string, unknown>) {
  console.log(`[billing-resync] ${message}`, context ?? {});
}

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

function inferPlanIdFromSubscription(subscription: Stripe.Subscription): SubscriptionPlanId | null {
  if (isPlanId(subscription.metadata?.plan_id) && subscription.metadata?.plan_id !== "free") {
    return subscription.metadata.plan_id;
  }

  const amount = subscription.items.data[0]?.price?.unit_amount ?? null;
  if (amount == null) {
    return null;
  }

  const matchingPlan = Object.values(SUBSCRIPTION_PLANS).find(
    (plan) => plan.id !== "free" && plan.monthlyPriceAr === amount,
  );

  return matchingPlan?.id ?? null;
}

function pickBestSubscription(subscriptions: Stripe.Subscription[], wpUserId: number) {
  const priority = ["active", "trialing", "past_due", "unpaid", "incomplete", "canceled"] as const;

  for (const status of priority) {
    const match = subscriptions
      .filter((subscription) => subscription.status === status)
      .sort((a, b) => b.created - a.created)
      .find((subscription) => {
        const metadataUserId = Number.parseInt(subscription.metadata?.wp_user_id || "0", 10);
        return metadataUserId === wpUserId;
      });

    if (match) {
      return match;
    }
  }

  return null;
}

export async function POST() {
  const session = getServerSession();
  if (!session || !session.wpUserId) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  if (isOnboardingRequired(session)) {
    return NextResponse.json({ error: "Finalisez votre profil avant la synchronisation." }, { status: 403 });
  }

  try {
    const currentSubscription = await subscriptionProvider.getCurrentSubscription(String(session.wpUserId));
    const stripeCustomerId = currentSubscription.stripeCustomerId || null;

    billingResyncLog("Starting Stripe resync.", {
      wpUserId: session.wpUserId,
      email: session.email,
      currentPlanId: session.planId ?? null,
      currentStatus: session.subscriptionStatus ?? null,
      stripeCustomerId,
    });

    if (!stripeCustomerId) {
      billingResyncLog("No persisted Stripe customer id for current user.", {
        wpUserId: session.wpUserId,
        email: session.email,
      });
      return NextResponse.json({ error: "Aucun compte Stripe rattache a cet utilisateur." }, { status: 404 });
    }

    const stripe = getStripeServerClient();
    const subscriptions = await stripe.subscriptions.list({ customer: stripeCustomerId, status: "all", limit: 20 });
    billingResyncLog("Stripe subscriptions fetched.", {
      wpUserId: session.wpUserId,
      customerId: stripeCustomerId,
      subscriptionCount: subscriptions.data.length,
      subscriptions: subscriptions.data.map((item) => ({
        id: item.id,
        status: item.status,
        metadataUserId: item.metadata?.wp_user_id ?? null,
        metadataPlanId: item.metadata?.plan_id ?? null,
        created: item.created,
        priceId: item.items.data[0]?.price?.id ?? null,
        unitAmount: item.items.data[0]?.price?.unit_amount ?? null,
      })),
    });
    const subscription = pickBestSubscription(subscriptions.data, session.wpUserId);

    if (!subscription) {
      billingResyncLog("No Stripe subscription matched current wpUserId.", {
        wpUserId: session.wpUserId,
        customerId: stripeCustomerId,
      });
      return NextResponse.json({ error: "Aucun abonnement Stripe n'a ete retrouve pour ce compte." }, { status: 404 });
    }

    const planId = inferPlanIdFromSubscription(subscription);
    billingResyncLog("Stripe subscription selected.", {
      wpUserId: session.wpUserId,
      customerId: stripeCustomerId,
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      metadataUserId: subscription.metadata?.wp_user_id ?? null,
      metadataPlanId: subscription.metadata?.plan_id ?? null,
      inferredPlanId: planId,
    });

    if (!planId) {
      return NextResponse.json({ error: "Impossible d'identifier la formule associee a cet abonnement." }, { status: 400 });
    }

    const latestInvoice = subscription.latest_invoice;
    const invoiceId = typeof latestInvoice === "string" ? latestInvoice : latestInvoice?.id || null;
    let paymentIntentId: string | null = null;

    if (invoiceId) {
      const invoice = (await stripe.invoices.retrieve(invoiceId, { expand: ["payment_intent"] })) as Stripe.Invoice & {
        payment_intent?: string | Stripe.PaymentIntent | null;
      };
      paymentIntentId = typeof invoice.payment_intent === "string" ? invoice.payment_intent : invoice.payment_intent?.id || null;
    }

    const syncResult = await syncStripeSubscriptionInWordPress({
      wpUserId: session.wpUserId,
      planId,
      billingPeriod: normalizeBillingPeriod(subscription.metadata?.billing_period),
      wpProductSku:
        (subscription.metadata?.wp_product_sku || "").trim() ||
        SUBSCRIPTION_PLANS[planId]?.commerce.productKey ||
        null,
      stripeCheckoutSessionId: null,
      stripeCustomerId,
      stripeSubscriptionId: subscription.id,
      stripePaymentIntentId: paymentIntentId,
      stripePriceId: subscription.items.data[0]?.price?.id || null,
      stripeProductId:
        typeof subscription.items.data[0]?.price?.product === "string"
          ? subscription.items.data[0]?.price?.product
          : subscription.items.data[0]?.price?.product?.id || null,
      stripeStatus: subscription.status || null,
      stripeCurrentPeriodEnd: toIsoFromUnix(subscription.items.data[0]?.current_period_end ?? null),
      amountTotal: subscription.items.data[0]?.price?.unit_amount ?? null,
      currency: subscription.currency ?? null,
    });

    billingResyncLog("Stripe subscription synced to WordPress.", {
      wpUserId: session.wpUserId,
      customerId: stripeCustomerId,
      subscriptionId: subscription.id,
      planId,
      syncResult,
    });

    return NextResponse.json({
      ok: true,
      orderId: syncResult.orderId,
      subscriptionId: syncResult.subscriptionId,
      planId,
      status: syncResult.status,
    });
  } catch (error) {
    billingResyncLog("Stripe resync failed.", {
      wpUserId: session.wpUserId,
      email: session.email,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible de resynchroniser l'abonnement pour le moment." },
      { status: 500 },
    );
  }
}
