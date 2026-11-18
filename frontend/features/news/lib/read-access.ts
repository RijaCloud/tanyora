import type { NewsArticle } from "@/features/news/types";

export function canReadFullArticle(
  minimumPlanRequired: NewsArticle["minimumPlanRequired"],
  isLoggedIn: boolean,
  userPlan: string,
) {
  const normalizedRequirement = minimumPlanRequired ?? "all";

  if (normalizedRequirement === "all") {
    return true;
  }

  if (!isLoggedIn) {
    return false;
  }

  if (normalizedRequirement === "business") {
    return userPlan === "business";
  }

  return userPlan === "essentiel" || userPlan === "business";
}
