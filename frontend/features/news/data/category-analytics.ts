import "server-only";

import type { NewsCategoryStat } from "@/features/news/types";
import { humanizeCategoryLabel } from "@/features/news/lib/category-label";
import { cacheStore } from "@/lib/cache";

const CATEGORY_INDEX_KEY = "analytics:news:categories:index";

function categoryViewsKey(slug: string): string {
  return `analytics:news:category:${slug}:views`;
}

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

async function getCategoryIndex(): Promise<Record<string, string>> {
  return (await cacheStore.get<Record<string, string>>(CATEGORY_INDEX_KEY)) ?? {};
}

export async function registerNewsCategory(slug: string, label?: string): Promise<void> {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) return;

  const index = await getCategoryIndex();
  const nextLabel = label?.trim() || humanizeCategoryLabel(normalizedSlug);

  if (index[normalizedSlug] === nextLabel) {
    return;
  }

  index[normalizedSlug] = nextLabel;
  await cacheStore.set(CATEGORY_INDEX_KEY, index);
}

export async function trackNewsCategoryView(slug: string, label?: string): Promise<number> {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) return 0;

  await registerNewsCategory(normalizedSlug, label);
  return cacheStore.increment(categoryViewsKey(normalizedSlug));
}

export async function getTopVisitedNewsCategories(limit = 6): Promise<NewsCategoryStat[]> {
  const index = await getCategoryIndex();
  const stats = await Promise.all(
    Object.entries(index).map(async ([slug, label]) => ({
      slug,
      label,
      views: Number((await cacheStore.get<number>(categoryViewsKey(slug))) ?? 0),
    })),
  );

  return stats
    .sort((left, right) => {
      if (right.views !== left.views) {
        return right.views - left.views;
      }

      return left.label.localeCompare(right.label, "fr");
    })
    .slice(0, limit);
}
