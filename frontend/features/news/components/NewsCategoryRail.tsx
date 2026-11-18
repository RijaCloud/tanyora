"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type NewsCategoryRailItem = {
  slug: string;
  label: string;
  href?: string;
};

function railLinkClass(isActive: boolean) {
  return `relative shrink-0 pb-1 ${
    isActive
      ? "text-[var(--text-main)] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-[var(--text-main)]"
      : "hover:text-[#27624f]"
  }`;
}

export function NewsCategoryRail({
  categories,
  selectedCategory,
  onSelectCategory,
}: {
  categories: NewsCategoryRailItem[];
  selectedCategory?: string | null;
  onSelectCategory?: (category: NewsCategoryRailItem | null) => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const node = scrollRef.current;
    if (!node) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    setCanScrollLeft(node.scrollLeft > 4);
    setCanScrollRight(node.scrollLeft + node.clientWidth < node.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    const handleScroll = () => updateScrollState();
    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => updateScrollState())
      : null;

    const rafIds = [
      window.requestAnimationFrame(updateScrollState),
      window.requestAnimationFrame(() => window.requestAnimationFrame(updateScrollState)),
    ];

    updateScrollState();
    node.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    resizeObserver?.observe(node);

    return () => {
      node.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      resizeObserver?.disconnect();
      rafIds.forEach((id) => window.cancelAnimationFrame(id));
    };
  }, [categories, updateScrollState]);

  const items = useMemo(() => {
    const deduped = new Map<string, NewsCategoryRailItem>();

    for (const category of categories) {
      const normalizedSlug = category.slug?.trim();
      if (!normalizedSlug || deduped.has(normalizedSlug)) {
        continue;
      }

      deduped.set(normalizedSlug, category);
    }

    return [{ slug: "", label: "Tout" }, ...Array.from(deduped.values())];
  }, [categories]);

  const shiftRail = (direction: "left" | "right") => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollBy({
      left: direction === "left" ? -220 : 220,
      behavior: "smooth",
    });
  };

  return (
    <section className="border-y border-[var(--border-soft)] bg-[var(--surface-2)] py-5">
      <div className="flex items-center gap-4 px-3">
        <button
          type="button"
          onClick={() => shiftRail("left")}
          aria-label="Faire defiler les categories vers la gauche"
          className={`hidden text-[var(--text-soft)] transition-opacity sm:block ${
            canScrollLeft ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div ref={scrollRef} className="ui-scrollbar-hidden flex min-w-0 flex-1 overflow-x-auto scroll-smooth">
          <div className="flex min-w-max items-center gap-6 text-[12px] font-semibold text-[var(--text-main)]">
            {items.map((category) => {
              const isActive = !category.slug ? !selectedCategory : selectedCategory === category.slug;

              return (
                <Link
                  key={category.slug || "all"}
                  href={category.slug ? (category.href ?? `/category/${encodeURIComponent(category.slug)}`) : "/actualites"}
                  onClick={
                    onSelectCategory
                      ? (event) => {
                          event.preventDefault();
                          onSelectCategory(category.slug ? category : null);
                        }
                      : undefined
                  }
                  className={railLinkClass(isActive)}
                >
                  {category.label}
                </Link>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => shiftRail("right")}
          aria-label="Faire defiler les categories vers la droite"
          className={`hidden text-[var(--text-main)] transition-opacity sm:block ${
            canScrollRight ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
