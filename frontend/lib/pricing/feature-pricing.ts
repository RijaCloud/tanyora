import type { PricingCatalogItem, PricingCatalogResult } from "@/lib/api/wordpress-internal";
import { formatMoneyAmount } from "@/lib/pricing/format-money";

export type FeaturePricingInfoItem = {
  code: string;
  label: string;
  priceLabel: string;
  note?: string;
};

export type FeaturePricingInfo = {
  title: string;
  items: FeaturePricingInfoItem[];
};

function formatPricingAmount(item: PricingCatalogItem | undefined): string {
  if (!item?.exists || item.price == null || item.price <= 0) {
    return "Tarif a configurer";
  }

  return formatMoneyAmount(item.price, { currency: item.currency || "MGA" });
}

function findCatalogItem(
  catalog: PricingCatalogResult | null,
  kind: PricingCatalogItem["kind"],
  action: PricingCatalogItem["action"] = "post",
  variant?: string,
): PricingCatalogItem | undefined {
  return catalog?.items.find((item) => item.kind === kind && item.action === action && (variant ? item.variant === variant : !item.variant));
}

export function buildArticlePricingInfo(catalog: PricingCatalogResult | null): FeaturePricingInfo {
  const item = findCatalogItem(catalog, "news", "post");
  const boost = findCatalogItem(catalog, "news", "boost");
  return {
    title: "Tarif actuel",
    items: [
      {
        code: item?.code || "news_post_30d",
        label: "Article de presse (Communique)",
        priceLabel: formatPricingAmount(item),
      },
      {
        code: boost?.code || "news_boost_7d",
        label: "Boost mise en avant (7 jours)",
        priceLabel: formatPricingAmount(boost),
      },
    ],
  };
}

export function buildJobPricingInfo(catalog: PricingCatalogResult | null): FeaturePricingInfo {
  const item = findCatalogItem(catalog, "job", "post");
  const boost = findCatalogItem(catalog, "job", "boost");
  return {
    title: "Tarif recrutement",
    items: [
      {
        code: item?.code || "job_post_30d",
        label: "Poster une annonce de recrutement",
        priceLabel: formatPricingAmount(item),
      },
      {
        code: boost?.code || "job_boost_7d",
        label: "Boost mise en avant (7 jours)",
        priceLabel: formatPricingAmount(boost),
      },
    ],
  };
}

export function buildTenderPricingInfo(catalog: PricingCatalogResult | null): FeaturePricingInfo {
  const item = findCatalogItem(catalog, "tender", "post");
  const boost = findCatalogItem(catalog, "tender", "boost");
  return {
    title: "Tarif appel d'offre",
    items: [
      {
        code: item?.code || "tender_post_30d",
        label: "Poster un appel d'offres",
        priceLabel: formatPricingAmount(item),
      },
      {
        code: boost?.code || "tender_boost_7d",
        label: "Boost mise en avant (7 jours)",
        priceLabel: formatPricingAmount(boost),
      },
    ],
  };
}

export function buildClassifiedPricingInfo(catalog: PricingCatalogResult | null): FeaturePricingInfo {
  const singlePhoto = findCatalogItem(catalog, "classified", "post", "1_photo");
  const fourPhotos = findCatalogItem(catalog, "classified", "post", "4_photo");
  const boost = findCatalogItem(catalog, "classified", "boost");

  return {
    title: "Tarification photos",
    items: [
      {
        code: singlePhoto?.code || "classified_post_30d_1_photo",
        label: "Annonce de base avec 1 photo",
        priceLabel: formatPricingAmount(singlePhoto),
        note: "1 photo maximum",
      },
      {
        code: fourPhotos?.code || "classified_post_30d_4_photo",
        label: "Annonce de base avec 4 photos",
        priceLabel: formatPricingAmount(fourPhotos),
        note: "De 2 a 4 photos",
      },
      {
        code: boost?.code || "classified_boost_7d",
        label: "Boost mise en avant (7 jours)",
        priceLabel: formatPricingAmount(boost),
      },
    ],
  };
}

