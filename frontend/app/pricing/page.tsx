import { getPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import { permanentRedirect } from "next/navigation";

export async function generateMetadata() {
  return getPublicPageMetadata("pricing", "/pricing", "Tarifs", "Découvrez les différentes formules et abonnements disponibles.");
}

export default function PricingRedirectPage() {
  permanentRedirect("/tarifs");
}
