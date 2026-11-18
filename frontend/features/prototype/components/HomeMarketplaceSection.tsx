"use client";

import { memo, useEffect, useState } from "react";
import { SectionHeading } from "@/features/prototype/components/SectionHeading";
import { ClassifiedGridCard } from "@/features/prototype/components/ClassifiedGridCard";
import { HomeRailCtaCard } from "@/features/prototype/components/HomeRailCtaCard";
import type { PublicListingItem } from "@/lib/api/wordpress-internal";
import { formatListingMoney } from "@/lib/pricing/format-listing-money";

type MarketplaceProduct = {
  id: number;
  name: string;
  image: string;
  subtitle: string;
  price?: string;
  href: string;
};

const PRODUCT_COUNT = 5;
const SIDEBAR_PRODUCT_COUNT = 6;
const HOME_PRODUCT_REQUEST_COUNT = PRODUCT_COUNT + SIDEBAR_PRODUCT_COUNT;

function mapListingToProduct(item: PublicListingItem): MarketplaceProduct {
  return {
    id: item.id,
    name: item.title,
    image: item.image || item.images?.[0] || "/image-placeholder.png",
    subtitle: [item.category, item.location].filter(Boolean).join(" · "),
    price: formatListingMoney(item.price, item.currency),
    href: `/petites-annonces/${item.id}`,
  };
}

function MarketplaceSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-3 h-5 w-56 rounded bg-[var(--surface-4)]" />
      <div className="home-browse-shelf grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: PRODUCT_COUNT }).map((_, index) => (
          <div key={index} className="h-[244px] rounded-[18px] bg-[var(--surface-3)]" />
        ))}
      </div>
    </div>
  );
}

export function HomeMarketplaceRail() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        const response = await fetch(`/api/public/listings/classified?perPage=${HOME_PRODUCT_REQUEST_COUNT}`);
        const payload = (await response.json()) as { items?: PublicListingItem[] };

        if (!response.ok) {
          throw new Error("Unable to load classified listings.");
        }

        const items = Array.isArray(payload.items) ? payload.items : [];

        if (isMounted) {
          setProducts(items.slice(SIDEBAR_PRODUCT_COUNT, HOME_PRODUCT_REQUEST_COUNT).map(mapListingToProduct));
        }
      } catch (error) {
        // Pas de contenu de substitution : une grille vide est preferable a des
        // produits inventes, qui masqueraient la panne au lieu de la signaler.
        console.error("[home] chargement des petites annonces impossible", error);
        if (isMounted) {
          setProducts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <MarketplaceSkeleton />;
  }

  const ctaCount = products.length === 0 ? 1 : 0;

  return (
    <section>
      <SectionHeading title="Petites annonces" href="/petites-annonces" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {products.map((product) => (
          <ClassifiedGridCard
            key={product.id}
            title={product.name}
            image={product.image}
            location={product.subtitle}
            price={product.price}
            href={product.href}
          />
        ))}
        {Array.from({ length: ctaCount }).map((_, index) => (
          <HomeRailCtaCard
            key={`create-classified-${index}`}
            title="Créer votre annonce"
            description="Vendez vos produits à une audience qualifiée."
            href="/profil/petites-annonces/nouveau"
            className="h-[240px]"
          />
        ))}
      </div>
    </section>
  );
}

function MarketplaceSidebarSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-3 h-5 w-40 rounded bg-[var(--surface-4)]" />
      <div className="home-four-column__scroll grid grid-cols-2 gap-3">
        {Array.from({ length: SIDEBAR_PRODUCT_COUNT }).map((_, index) => (
          <div key={index} className="h-[148px] rounded-[18px] bg-[var(--surface-3)]" />
        ))}
      </div>
    </div>
  );
}

/** Compact marketplace rail used beside the editorial opening on the home page. */
export const HomeMarketplaceSidebar = memo(function HomeMarketplaceSidebar({ initialItems }: { initialItems?: PublicListingItem[] }) {
  const [products, setProducts] = useState<MarketplaceProduct[]>(() =>
    initialItems ? initialItems.slice(0, SIDEBAR_PRODUCT_COUNT).map(mapListingToProduct) : [],
  );
  const [isLoading, setIsLoading] = useState(initialItems === undefined);
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    if (initialItems !== undefined) {
      return;
    }

    let isMounted = true;

    async function loadProducts() {
      try {
        const response = await fetch(`/api/public/listings/classified?perPage=${SIDEBAR_PRODUCT_COUNT}`);
        const payload = (await response.json()) as { items?: PublicListingItem[] };

        if (!response.ok) {
          throw new Error("Unable to load classified listings.");
        }

        if (isMounted) {
          setProducts((Array.isArray(payload.items) ? payload.items : []).slice(0, SIDEBAR_PRODUCT_COUNT).map(mapListingToProduct));
        }
      } catch (error) {
        console.error("[home] chargement des petites annonces impossible", error);
        if (isMounted) {
          setProducts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();
    return () => { isMounted = false; };
  }, [initialItems]);

  useEffect(() => {
    setStartIndex(0);
    if (products.length <= 4) return;
    const timer = window.setInterval(() => setStartIndex((current) => (current + 2) % products.length), 4200);
    return () => window.clearInterval(timer);
  }, [products.length]);

  if (isLoading) {
    return <MarketplaceSidebarSkeleton />;
  }

  if (products.length === 0) {
    return null;
  }

  const visibleProducts = Array.from(
    { length: Math.min(4, products.length) },
    (_, offset) => products[(startIndex + offset) % products.length],
  );

  return (
    <section className="home-four-column__marketplace">
      <SectionHeading title="Dernières annonces" href="/petites-annonces" />
      <div className="home-four-column__scroll home-four-column__scroll--grid grid grid-cols-2 gap-3">
        {visibleProducts.map((product) => (
          <ClassifiedGridCard
            key={product.id}
            title={product.name}
            image={product.image}
            location={product.subtitle}
            price={product.price}
            href={product.href}
            compact
          />
        ))}

      </div>
    </section>
  );
});
