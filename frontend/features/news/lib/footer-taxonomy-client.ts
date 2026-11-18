"use client";

import type { NewsFooterTaxonomy } from "@/features/news/data/news.repository";

let cachedTaxonomy: NewsFooterTaxonomy | null = null;
let pendingTaxonomy: Promise<NewsFooterTaxonomy> | null = null;

/** Shares the public editorial taxonomy across header, footer and home sections. */
export async function getFooterTaxonomyClient(): Promise<NewsFooterTaxonomy> {
  if (cachedTaxonomy) {
    return cachedTaxonomy;
  }

  if (!pendingTaxonomy) {
    pendingTaxonomy = fetch("/api/news/footer-taxonomy")
      .then(async (response) => {
        const payload = await response.json().catch(() => null) as NewsFooterTaxonomy | null;
        if (!response.ok || !payload || !Array.isArray(payload.categories) || !Array.isArray(payload.tags)) {
          throw new Error("Unable to load editorial taxonomy.");
        }
        cachedTaxonomy = payload;
        return payload;
      })
      .finally(() => {
        pendingTaxonomy = null;
      });
  }

  return pendingTaxonomy;
}
