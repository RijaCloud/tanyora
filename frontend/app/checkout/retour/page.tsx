import { buildMetadata } from "@/app/metadata";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { CheckoutReturnPageClient } from "@/features/subscriptions/components/CheckoutReturnPageClient";
import { ListingCheckoutReturnPageClient } from "@/features/submissions/components/ListingCheckoutReturnPageClient";
import type { SubscriptionPlanId } from "@/types/subscriptions";

export const metadata = buildMetadata(
  "Retour de paiement",
  "Vérification de votre paiement et activation de votre abonnement.",
);

function isPlanId(value?: string): value is SubscriptionPlanId {
  return value === "free" || value === "essentiel" || value === "business";
}

function listingReturnPath(target?: string, legacyPath?: string) {
  const targets: Record<string, string> = {
    tenders: "/profil/appels-offres",
    jobs: "/profil/offres-emploi",
    articles: "/profil/articles",
    classifieds: "/profil/petites-annonces",
  };
  if (target && targets[target]) return targets[target];

  // Compatibility for return URLs already transformed by the hosted payment page.
  if (legacyPath === "profilappels-offres") return targets.tenders;
  if (legacyPath === "profiloffres-emploi") return targets.jobs;
  if (legacyPath === "profilarticles") return targets.articles;
  return targets.classifieds;
}

export default function CheckoutReturnPage({
  searchParams,
}: {
  searchParams?: {
    status?: string;
    order_id?: string;
    plan?: string;
    session_id?: string;
    orderId?: string;
    source?: string;
    flow?: string;
    listingId?: string;
    returnTo?: string;
    returnTarget?: string;
    key?: string;
  };
}) {
  const session = getServerSession();
  if (!session) {
    redirect("/login");
  }

  const selectedPlanId = isPlanId(searchParams?.plan) ? searchParams.plan : undefined;
  const flow = (searchParams?.flow || "").trim();
  const orderId = searchParams?.orderId || searchParams?.order_id;

  if (flow === "listing") {
    const listingId = Number(searchParams?.listingId || 0);
    return (
      <ListingCheckoutReturnPageClient
        sessionId={searchParams?.session_id}
        orderId={orderId}
        orderKey={searchParams?.key}
        listingId={Number.isFinite(listingId) && listingId > 0 ? listingId : undefined}
        status={searchParams?.status}
        source={searchParams?.source}
        returnTo={listingReturnPath(searchParams?.returnTarget, searchParams?.returnTo)}
      />
    );
  }

  return (
    <CheckoutReturnPageClient
      selectedPlanId={selectedPlanId}
      orderId={orderId}
      orderKey={searchParams?.key}
      source={searchParams?.source}
    />
  );
}
