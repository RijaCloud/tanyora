import { NextResponse } from "next/server";
import { isOnboardingRequired } from "@/lib/auth/flow";
import { getServerSession } from "@/lib/auth/session";
import { subscriptionProvider } from "@/lib/billing/subscription-provider";
import { getBaseAppUrl, getStripeServerClient } from "@/lib/stripe/server";

export async function GET() {
  const session = getServerSession();
  if (!session || !session.wpUserId) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  if (isOnboardingRequired(session)) {
    return NextResponse.json({ error: "Finalisez votre profil avant de gerer votre abonnement." }, { status: 403 });
  }

  const subscription = await subscriptionProvider.getCurrentSubscription(String(session.wpUserId));
  if (!subscription.stripeCustomerId) {
    return NextResponse.json({ error: "Aucun compte Stripe rattache a cet utilisateur." }, { status: 404 });
  }

  try {
    const stripe = getStripeServerClient();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${getBaseAppUrl()}/profil/factures`,
    });

    return NextResponse.redirect(portalSession.url);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible d'ouvrir le portail Stripe." },
      { status: 500 },
    );
  }
}
