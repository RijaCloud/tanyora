export function getHumanPricingLabel(pricingCode: string, fallbackTitle?: string | null) {
  const normalized = pricingCode.trim();
  if (!normalized) {
    return fallbackTitle?.trim() || "Offre";
  }

  const labels: Record<string, string> = {
    classified_post_30d_1_photo: "Annonce de base - 1 photo",
    classified_boost_7d: "Boost mise en avant (7 jours)",
    job_post_30d: "Poster une annonce de recrutement",
    job_boost_7d: "Boost annonce de recrutement (7 jours)",
    tender_post_30d: "Poster un appel d'offres",
    tender_boost_7d: "Boost appel d'offres (7 jours)",
    news_post_30d: "Article de presse (Communique)",
    news_boost_7d: "Boost article de presse (7 jours)",
  };

  if (normalized === "classified_post_30d_4_photo") {
    return "Annonce de base - Multi-photos";
  }

  return labels[normalized] || fallbackTitle?.trim() || normalized;
}
