import { buildMetadata } from "@/app/metadata";
import { redirect } from "next/navigation";
import { SUBSCRIPTION_PLANS } from "@/config/subscription-plans";
import { CheckoutMethodPage } from "@/features/subscriptions/components/CheckoutMethodPage";
import { getServerSession } from "@/lib/auth/session";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import type { BillingPeriod, SubscriptionPlanId } from "@/types/subscriptions";

export const metadata = buildMetadata("Paiement", "Finalisez votre abonnement en toute sécurité.");

function normalizeBillingPeriod(value?: string): BillingPeriod {
  return value === "annual" ? "annual" : "monthly";
}

export default function CheckoutPage({ searchParams }: { searchParams?: { plan?: string; period?: string } }) {
  requireAuthenticatedUser(getServerSession(), { returnTo: "/checkout" });

  const planId = (searchParams?.plan || "") as SubscriptionPlanId;
  if (!(planId in SUBSCRIPTION_PLANS) || planId === "free") {
    redirect("/tarifs");
  }

  const billingPeriod = normalizeBillingPeriod(searchParams?.period);
  return <CheckoutMethodPage planId={planId} billingPeriod={billingPeriod} />;
}
