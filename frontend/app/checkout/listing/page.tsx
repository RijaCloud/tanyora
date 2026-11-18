import { buildMetadata } from "@/app/metadata";
import { redirect } from "next/navigation";
import { ListingCheckoutMethodPage } from "@/features/submissions/components/ListingCheckoutMethodPage";
import { getServerSession } from "@/lib/auth/session";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import type { ListingCheckoutAction, ListingCheckoutKind } from "@/lib/api/wordpress-internal";

export const metadata = buildMetadata("Paiement annonce", "Finalisez le paiement de votre publication en toute sécurité.");

export default function ListingCheckoutPage({
  searchParams,
}: {
  searchParams?: { listingId?: string; returnTo?: string; kind?: string; action?: string; scheduledPublishAt?: string };
}) {
  requireAuthenticatedUser(getServerSession(), { returnTo: "/checkout/listing" });

  const listingId = Number(searchParams?.listingId || 0);
  if (!Number.isFinite(listingId) || listingId <= 0) {
    redirect("/profil/petites-annonces");
  }

  const returnTo = (searchParams?.returnTo || "/profil/petites-annonces").trim();
  const kind = ["classified", "article", "job", "tender"].includes(searchParams?.kind || "")
    ? (searchParams?.kind as ListingCheckoutKind)
    : "classified";
  const action = searchParams?.action === "boost" ? ("boost" as ListingCheckoutAction) : ("post" as ListingCheckoutAction);
  return (
    <ListingCheckoutMethodPage
      listingId={listingId}
      returnTo={returnTo}
      kind={kind}
      action={action}
      scheduledPublishAt={(searchParams?.scheduledPublishAt || "").trim()}
    />
  );
}
