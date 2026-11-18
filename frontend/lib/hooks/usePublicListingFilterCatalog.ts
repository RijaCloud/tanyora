"use client";

import { useEffect, useState } from "react";
import type { TaxonomyTermResult, TaxonomyTermsResult } from "@/lib/api/wordpress-internal";

export type PublicFilterCatalogKind = "classified" | "job" | "tender";

type PublicFilterCatalog = {
  categories: TaxonomyTermResult[];
  locations: TaxonomyTermResult[];
  productTags: TaxonomyTermResult[];
  cachedAt: number;
};

type PublicFilterCatalogState = {
  catalog: PublicFilterCatalog | null;
  isLoading: boolean;
  error: boolean;
};

const FRESH_FOR_MS = 5 * 60 * 1000;
const SESSION_FOR_MS = 24 * 60 * 60 * 1000;
const SESSION_KEY_PREFIX = "2424:public-filter-catalog:v1:";
const catalogs = new Map<PublicFilterCatalogKind, PublicFilterCatalog>();
const inFlight = new Map<PublicFilterCatalogKind, Promise<PublicFilterCatalog>>();

function normalizeTerms(value: unknown): TaxonomyTermResult[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((term): TaxonomyTermResult | null => {
      if (!term || typeof term !== "object") return null;
      const source = term as Record<string, unknown>;
      const name = String(source.name || "").trim();
      const slug = String(source.slug || "").trim();
      if (!name || !slug) return null;

      const normalized: TaxonomyTermResult = {
        id: Number(source.id || 0) || undefined,
        name,
        slug,
        count: Number(source.count || 0),
        order: Number(source.order || 0),
        parentId: Number(source.parentId || 0) || undefined,
        parentName: source.parentName ? String(source.parentName) : undefined,
        parentSlug: source.parentSlug ? String(source.parentSlug) : undefined,
        productTagIds: Array.isArray(source.productTagIds) ? source.productTagIds.map(Number).filter(Number.isFinite) : undefined,
        productTagNames: Array.isArray(source.productTagNames) ? source.productTagNames.map(String).filter(Boolean) : undefined,
        productTagSlugs: Array.isArray(source.productTagSlugs) ? source.productTagSlugs.map(String).filter(Boolean) : undefined,
        productTagsConfigured: Boolean(source.productTagsConfigured),
      };
      return normalized;
    })
    .filter((term): term is TaxonomyTermResult => term !== null);
}

function readSessionCatalog(kind: PublicFilterCatalogKind): PublicFilterCatalog | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(`${SESSION_KEY_PREFIX}${kind}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PublicFilterCatalog>;
    const cachedAt = Number(parsed.cachedAt || 0);
    if (!Number.isFinite(cachedAt) || Date.now() - cachedAt > SESSION_FOR_MS) {
      window.sessionStorage.removeItem(`${SESSION_KEY_PREFIX}${kind}`);
      return null;
    }

    return {
      categories: normalizeTerms(parsed.categories),
      locations: normalizeTerms(parsed.locations),
      productTags: normalizeTerms(parsed.productTags),
      cachedAt,
    };
  } catch {
    return null;
  }
}

function getCatalog(kind: PublicFilterCatalogKind) {
  const catalog = catalogs.get(kind) ?? readSessionCatalog(kind);
  if (catalog) catalogs.set(kind, catalog);
  return catalog ?? null;
}

function storeCatalog(kind: PublicFilterCatalogKind, catalog: PublicFilterCatalog) {
  catalogs.set(kind, catalog);
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(`${SESSION_KEY_PREFIX}${kind}`, JSON.stringify(catalog));
  } catch {
    // A full or unavailable session storage must never block public filters.
  }
}

async function fetchCatalog(kind: PublicFilterCatalogKind): Promise<PublicFilterCatalog> {
  const existing = inFlight.get(kind);
  if (existing) return existing;

  const request = Promise.all([
    fetch(`/api/public/categories/${kind}`),
    fetch(`/api/public/locations/${kind}`),
  ])
    .then(async ([categoriesResponse, locationsResponse]) => {
      const [categoriesPayload, locationsPayload] = await Promise.all([
        categoriesResponse.json().catch(() => null),
        locationsResponse.json().catch(() => null),
      ]);

      if (!categoriesResponse.ok || !locationsResponse.ok) {
        throw new Error("public-filter-catalog-unavailable");
      }

      const categoryResult = (categoriesPayload || {}) as TaxonomyTermsResult;
      const catalog = {
        categories: normalizeTerms(categoryResult.terms),
        locations: normalizeTerms((locationsPayload as { terms?: unknown } | null)?.terms),
        productTags: normalizeTerms(categoryResult.productTags),
        cachedAt: Date.now(),
      } satisfies PublicFilterCatalog;
      storeCatalog(kind, catalog);
      return catalog;
    })
    .finally(() => {
      inFlight.delete(kind);
    });

  inFlight.set(kind, request);
  return request;
}

export function usePublicListingFilterCatalog(kind: PublicFilterCatalogKind, enabled = true): PublicFilterCatalogState {
  const [state, setState] = useState<PublicFilterCatalogState>(() => {
    const catalog = enabled ? getCatalog(kind) : null;
    return { catalog, isLoading: enabled && !catalog, error: false };
  });

  useEffect(() => {
    if (!enabled) {
      setState({ catalog: null, isLoading: false, error: false });
      return;
    }

    let cancelled = false;
    const cached = getCatalog(kind);
    const isFresh = cached ? Date.now() - cached.cachedAt < FRESH_FOR_MS : false;

    setState((current) => ({
      catalog: cached || current.catalog,
      isLoading: !cached,
      error: false,
    }));

    const refresh = () => {
      void fetchCatalog(kind)
        .then((catalog) => {
          if (!cancelled) setState({ catalog, isLoading: false, error: false });
        })
        .catch(() => {
          if (!cancelled) {
            setState((current) => ({
              catalog: current.catalog || cached,
              isLoading: false,
              error: !(current.catalog || cached),
            }));
          }
        });
    };

    let recurringRefreshTimer: number | null = null;
    const startRecurringRefresh = () => {
      recurringRefreshTimer = window.setInterval(refresh, FRESH_FOR_MS);
    };

    const refreshDelay = isFresh && cached ? Math.max(FRESH_FOR_MS - (Date.now() - cached.cachedAt), 1_000) : 0;
    const initialRefreshTimer = window.setTimeout(() => {
      refresh();
      startRecurringRefresh();
    }, refreshDelay);

    return () => {
      cancelled = true;
      window.clearTimeout(initialRefreshTimer);
      if (recurringRefreshTimer !== null) window.clearInterval(recurringRefreshTimer);
    };
  }, [enabled, kind]);

  return state;
}
