import Stripe from "stripe";

let stripeClient: Stripe | null = null;

function getStripeSecretKey() {
  const value = process.env.STRIPE_SECRET_KEY;
  if (!value) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  return value;
}

export function getStripeServerClient() {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey(), {
      apiVersion: "2026-02-25.clover",
      typescript: true,
    });
  }

  return stripeClient;
}

export function getStripeWebhookSecret() {
  const value = process.env.STRIPE_WEBHOOK_SECRET;
  if (!value) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }
  return value;
}

export function getBaseAppUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_BASE_URL || "http://localhost:3000";
}

