"use client";

import { Link } from "@/features/prototype/router-compat";
import { useEffect, useState } from "react";

import { CategoryPill } from "@/features/prototype/components/CategoryPill";
import type { NewsFooterTaxonomyItem } from "@/features/news/data/news.repository";
import { normalizeEditorialUriToPath } from "@/features/news/lib/editorial-permalinks";
import { getFooterTaxonomyClient } from "@/features/news/lib/footer-taxonomy-client";

const fallbackCategories = [
  { label: "Politique", uri: "/category/politique/" },
  { label: "Business", uri: "/category/business/" },
  { label: "Nature", uri: "/category/nature/" },
  { label: "International", uri: "/category/international/" },
  { label: "Europe", uri: "/category/europe/" },
  { label: "Africa", uri: "/category/africa/" },
];

// Cinq pastilles : la colonne s’aligne ainsi sur la hauteur des six cartes
// de droite, au lieu de la dépasser.
const INITIAL_VISIBLE_CATEGORIES = 5;

function TopicsSkeleton() {
  return (
    <div className="lg:col-span-2 animate-pulse">
      <div className="mb-4 h-8 w-56 rounded bg-[var(--surface-4)]" />
      <div className="flex flex-wrap gap-2 mb-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-9 w-24 rounded-full bg-[var(--surface-3)]" />
        ))}
      </div>
      <div className="h-[343px] rounded-[20px] bg-[var(--surface-3)]" />
    </div>
  );
}

export function HomeTopicsSection() {
  const [categories, setCategories] = useState<Array<{ label: string; uri: string }>>(fallbackCategories);
  const [isLoading, setIsLoading] = useState(true);
  const visibleCategories = categories.slice(0, INITIAL_VISIBLE_CATEGORIES);
  const hasMoreCategories = categories.length > INITIAL_VISIBLE_CATEGORIES;

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const payload = await getFooterTaxonomyClient();

        if (isMounted && payload.categories?.length) {
          setCategories(
            payload.categories.map((category) => ({
              label: category.label,
              uri: normalizeEditorialUriToPath(category.uri),
            })),
          );
        }
      } catch {
        if (isMounted) {
          setCategories(fallbackCategories);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <TopicsSkeleton />;
  }

  return (
    <div className="lg:col-span-2">
      <div className="mb-4">
        <h2 className="text-[#1A1A1A] dark:text-white text-xl font-bold">Les sujets qui font l'actu :</h2>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {visibleCategories.map((category) => (
          <Link
            key={`${category.label}:${category.uri}`}
            to={category.uri}
            className="inline-flex"
          >
            <CategoryPill label={category.label} active={false} />
          </Link>
        ))}
      </div>
      {hasMoreCategories ? (
        <Link
          to="/actualites"
          className="mb-6 inline-flex items-center rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-1)] px-4 py-2 text-sm font-medium text-[color:var(--text-main)] transition-all duration-300 ease-[var(--motion-ease-standard)] hover:border-[#27624f]/45 hover:text-[#27624f]"
        >
          {`Voir plus (${categories.length - INITIAL_VISIBLE_CATEGORIES})`}
        </Link>
      ) : null}
    </div>
  );
}
