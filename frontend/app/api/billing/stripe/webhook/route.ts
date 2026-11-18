import { NextResponse } from "next/server";
import Stripe from "stripe";
import { SUBSCRIPTION_PLANS } from "@/config/subscription-plans";
import { syncStripeSubscriptionInWordPress } from "@/lib/api/wordpress-internal";
import { getStripeServerClient, getStripeWebhookSecret } from "@/lib/stripe/server";
import type { BillingPeriod, SubscriptionPlanId } from "@/types/subscriptions";

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

async function syncSubscriptionFromStripe(subscription: Stripe.Subscription) {
  const wpUserId = Number.parseInt(subscription.metadata?.wp_user_id || "0", 10);
  const planId = isPlanId(subscription.metadata?.plan_id) ? subscription.metadata?.plan_id : "free";

  if (wpUserId <= 0 || planId === "free") {
    return;
  }

  await syncStripeSubscriptionInWordPress({
    wpUserId,
    planId,
    billingPeriod: normalizeBillingPeriod(subscription.metadata?.billing_period),
    wpProductSku:
      (subscription.metadata?.wp_product_sku || "").trim() ||
      SUBSCRIPTION_PLANS[planId]?.commerce.productKey ||
      null,
    stripeCheckoutSessionId: null,
    stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id || null,
    stripeSubscriptionId: subscription.id,
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
}

export async function POST(request: Request) {
  const stripe = getStripeServerClient();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, getStripeWebhookSecret());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid Stripe webhook." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const wpUserId = Number.parseInt(session.metadata?.wp_user_id || "0", 10);
      const planId = isPlanId(session.metadata?.plan_id) ? session.metadata?.plan_id : "free";

      if (wpUserId > 0 && planId !== "free") {
        let stripeSubscriptionStatus: string | null = session.payment_status === "paid" ? "active" : session.status || null;
        let stripeCurrentPeriodEnd: string | null = null;

        if (typeof session.subscription === "string" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          stripeSubscriptionStatus = subscription.status || stripeSubscriptionStatus;
          stripeCurrentPeriodEnd = toIsoFromUnix(subscription.items.data[0]?.current_period_end ?? null);
        }

        await syncStripeSubscriptionInWordPress({
          wpUserId,
          planId,
          billingPeriod: normalizeBillingPeriod(session.metadata?.billing_period),
          wpProductSku:
            (session.metadata?.wp_product_sku || "").trim() ||
            SUBSCRIPTION_PLANS[planId]?.commerce.productKey ||
            null,
          stripeCheckoutSessionId: session.id,
          stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id || null,
          stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : session.subscription?.id || null,
          stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || null,
          stripeStatus: stripeSubscriptionStatus,
          stripeCurrentPeriodEnd,
          amountTotal: session.amount_total ?? null,
          currency: session.currency ?? null,
        });

      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await syncSubscriptionFromStripe(event.data.object as Stripe.Subscription);
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const invoiceWithSubscription = invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null };
      if (invoiceWithSubscription.subscription) {
        const subscriptionId =
          typeof invoiceWithSubscription.subscription === "string"
            ? invoiceWithSubscription.subscription
            : invoiceWithSubscription.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await syncSubscriptionFromStripe(subscription);
      }
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Webhook processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
