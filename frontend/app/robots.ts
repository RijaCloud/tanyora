import type { MetadataRoute } from "next";
import { SITE_URL, isNonProductionSite } from "@/app/metadata";

export default function robots(): MetadataRoute.Robots {
  if (isNonProductionSite()) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/profil/", "/login", "/signin", "/checkout/", "/verification-email", "/reinitialiser-mot-de-passe", "/desinscription"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
