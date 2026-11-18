import { describe, expect, it } from "vitest";

import { LIMITED_ARCHIVE_ARTICLE_COUNT, limitEditorialArchive } from "@/features/news/lib/archive-access";
import type { NewsCollectionPageResult } from "@/features/news/types";

const collection: NewsCollectionPageResult = {
  articles: Array.from({ length: 12 }, (_, index) => ({
    id: String(index + 1),
    source: "post" as const,
    slug: `article-${index + 1}`,
    title: `Article ${index + 1}`,
    excerpt: "Resume",
    content: "",
    category: "actualite",
    publishedAt: "2026-09-01T00:00:00.000Z",
    isPremium: false,
  })),
  pagination: { page: 2, perPage: 12, hasNextPage: true },
};

describe("limitEditorialArchive", () => {
  it("limits visitors and Free accounts to the editorial archive preview", () => {
    const visitor = limitEditorialArchive(collection);
    const free = limitEditorialArchive(collection, "free");

    expect(visitor.articles).toHaveLength(LIMITED_ARCHIVE_ARTICLE_COUNT);
    expect(visitor.pagination.hasNextPage).toBe(false);
    expect(visitor.access.actionHref).toBe("/login");
    expect(free.access.actionHref).toBe("/tarifs");
  });

  it("keeps the full collection available to Essentiel and Business", () => {
    expect(limitEditorialArchive(collection, "essentiel")).toMatchObject({
      articles: collection.articles,
      pagination: collection.pagination,
      access: { isLimited: false },
    });
    expect(limitEditorialArchive(collection, "business").articles).toHaveLength(12);
  });
});
