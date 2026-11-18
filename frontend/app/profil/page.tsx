import { buildMetadata } from "@/app/metadata";
import { ProfilePage } from "@/features/profile/components/ProfilePage";
import { getWordPressPublicSiteConfig, getWordPressSubscriptionPricingConfig } from "@/lib/api/wordpress-internal";
import { getServerSession } from "@/lib/auth/session";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { subscriptionProvider } from "@/lib/billing/subscription-provider";

export const metadata = buildMetadata("Profil", "Retrouvez votre tableau de bord, vos factures et vos contenus.");

export default async function ProfilPage() {
  const session = requireAuthenticatedUser(getServerSession(), { returnTo: "/profil" });
  const userId = String(session.wpUserId || session.email || "anonymous");
  const [subscriptionResult, billingHistoryResult, pricingConfigResult, siteConfigResult] = await Promise.allSettled([
    subscriptionProvider.getCurrentSubscription(userId),
    subscriptionProvider.getBillingHistory(userId),
    getWordPressSubscriptionPricingConfig(),
    getWordPressPublicSiteConfig(),
  ]);

  const subscription =
    subscriptionResult.status === "fulfilled"
      ? subscriptionResult.value
      : await subscriptionProvider.getCurrentSubscription("0");
  const billingHistory = billingHistoryResult.status === "fulfilled" ? billingHistoryResult.value : [];
  const pricingConfig = pricingConfigResult.status === "fulfilled" ? pricingConfigResult.value : null;
  const accessMatrix = siteConfigResult.status === "fulfilled" ? siteConfigResult.value.accessMatrix : null;

  return (
    <ProfilePage
      user={{
        name: session.name,
        email: session.email,
        picture: session.picture,
      }}
      subscription={subscription}
      billingHistory={billingHistory}
      pricingConfig={pricingConfig}
      accessMatrix={accessMatrix}
    />
  );
}
