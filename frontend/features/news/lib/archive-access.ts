import type { NewsCollectionPageResult } from "@/features/news/types";

export const LIMITED_ARCHIVE_ARTICLE_COUNT = 6;

export type EditorialArchiveAccess = {
  isLimited: boolean;
  visibleArticleCount?: number;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
};

export type EditorialArchiveResult = NewsCollectionPageResult & {
  access: EditorialArchiveAccess;
};

function hasArchiveAccess(planId?: string) {
  return planId === "essentiel" || planId === "business";
}

export function limitEditorialArchive(
  collection: NewsCollectionPageResult,
  planId?: string,
): EditorialArchiveResult {
  if (hasArchiveAccess(planId)) {
    return {
      ...collection,
      access: { isLimited: false },
    };
  }

  const isFreeAccount = planId === "free";
  return {
    articles: collection.articles.slice(0, LIMITED_ARCHIVE_ARTICLE_COUNT),
    pagination: {
      page: 1,
      perPage: Math.min(collection.pagination.perPage, LIMITED_ARCHIVE_ARTICLE_COUNT),
      hasNextPage: false,
    },
    access: {
      isLimited: true,
      visibleArticleCount: LIMITED_ARCHIVE_ARTICLE_COUNT,
      message: isFreeAccount
        ? "Votre formule Free affiche un aperçu des archives et catégories."
        : "Connectez-vous pour consulter davantage d'articles dans les archives et catégories.",
      actionLabel: isFreeAccount ? "Passer à Essentiel" : "Se connecter",
      actionHref: isFreeAccount ? "/tarifs" : "/login",
    },
  };
}
