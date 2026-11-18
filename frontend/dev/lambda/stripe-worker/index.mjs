import Stripe from "stripe";

const API_BASE = process.env.WORDPRESS_INTERNAL_API_BASE_URL;
const INTERNAL_SECRET = process.env.PLATFORM_SUBMISSIONS_SECRET;

const PLAN_BY_AMOUNT = {
  30000: "essentiel",
  50000: "business",
};

if (!API_BASE || !INTERNAL_SECRET) {
  throw new Error("Missing WORDPRESS_INTERNAL_API_BASE_URL or PLATFORM_SUBMISSIONS_SECRET.");
}

function toIsoFromUnix(timestamp) {
  if (!timestamp) return null;
  return new Date(timestamp * 1000).toISOString();
}

function inferPlanIdFromSubscription(subscription) {
  const metadataPlan = subscription?.metadata?.plan_id;
  if (metadataPlan === "essentiel" || metadataPlan === "business") {
    return metadataPlan;
  }

  const amount = subscription?.items?.data?.[0]?.price?.unit_amount ?? null;
  if (amount == null) {
    return null;
  }

  return PLAN_BY_AMOUNT[amount] ?? null;
}

async function syncStripeSubscriptionToWordPress(payload) {
  const response = await fetch(`${API_BASE.replace(/\/$/, "")}/billing/stripe/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-2424-internal-secret": INTERNAL_SECRET,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`WordPress sync failed (${response.status}): ${body}`);
  }
}

async function processCheckoutSessionCompleted(checkoutSession) {
  const wpUserId = Number.parseInt(checkoutSession?.metadata?.wp_user_id || "0", 10);
  const planId = checkoutSession?.metadata?.plan_id;
  if (wpUserId <= 0 || (planId !== "essentiel" && planId !== "business")) {
    return;
  }

  await syncStripeSubscriptionToWordPress({
    wpUserId,
    planId,
    stripeCheckoutSessionId: checkoutSession.id,
    stripeCustomerId:
      typeof checkoutSession.customer === "string" ? checkoutSession.customer : checkoutSession.customer?.id || null,
    stripeSubscriptionId:
      typeof checkoutSession.subscription === "string"
        ? checkoutSession.subscription
        : checkoutSession.subscription?.id || null,
    stripePaymentIntentId:
      typeof checkoutSession.payment_intent === "string"
        ? checkoutSession.payment_intent
        : checkoutSession.payment_intent?.id || null,
    stripeStatus: checkoutSession.payment_status === "paid" ? "active" : checkoutSession.status || null,
    amountTotal: checkoutSession.amount_total ?? null,
    currency: checkoutSession.currency ?? null,
  });
}

async function processStripeSubscription(subscription) {
  const wpUserId = Number.parseInt(subscription?.metadata?.wp_user_id || "0", 10);
  const planId = inferPlanIdFromSubscription(subscription);

  if (wpUserId <= 0 || !planId) {
    return;
  }

  await syncStripeSubscriptionToWordPress({
    wpUserId,
    planId,
    stripeCheckoutSessionId: null,
    stripeCustomerId:
      typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id || null,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription?.items?.data?.[0]?.price?.id || null,
    stripeProductId:
      typeof subscription?.items?.data?.[0]?.price?.product === "string"
        ? subscription.items.data[0].price.product
        : subscription?.items?.data?.[0]?.price?.product?.id || null,
    stripeStatus: subscription.status || null,
    stripeCurrentPeriodEnd: toIsoFromUnix(subscription?.items?.data?.[0]?.current_period_end ?? null),
    amountTotal: subscription?.items?.data?.[0]?.price?.unit_amount ?? null,
    currency: subscription.currency ?? null,
  });
}

export const handler = async (event) => {
  for (const record of event.Records ?? []) {
    const stripeEvent = JSON.parse(record.body);

    if (stripeEvent.type === "checkout.session.completed") {
      await processCheckoutSessionCompleted(stripeEvent.data.object);
      continue;
    }

    if (
      stripeEvent.type === "customer.subscription.created" ||
      stripeEvent.type === "customer.subscription.updated" ||
      stripeEvent.type === "customer.subscription.deleted"
    ) {
      await processStripeSubscription(stripeEvent.data.object);
      continue;
    }

    if (stripeEvent.type === "invoice.payment_failed") {
      const subscription = stripeEvent.data.object?.subscription;
      if (typeof subscription === "object" && subscription?.id) {
        await processStripeSubscription(subscription);
      }
    }
  }
};
