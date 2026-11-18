"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { MapPin } from "lucide-react";
import type { PublicListingCategoryFilterNode } from "@/features/prototype/components/PublicListingCategoryFilter";
import { trackFilterApplied } from "@/lib/analytics/ga4";

type PublicListingLocationFilterProps = {
  title?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  selectedParent: string;
  selectedChild?: string;
  expandedParent: string | null;
  items: PublicListingCategoryFilterNode[];
  onToggleParent: (value: string) => void;
  onSelectAll: () => void;
  onSelectParent: (value: string) => void;
  onSelectChild?: (parentValue: string, childValue: string) => void;
  emptyLabel?: string;
  allLabel?: string;
  searchPlaceholder?: string;
};

function RadioIndicator({ active }: { active: boolean }) {
  return (
    <div className="tanyora-filter-radio absolute left-0 top-1/2 size-[16px] -translate-y-1/2 transition-all duration-200 ease-in-out">
      <div
        className={clsx(
          "-translate-y-1/2 absolute left-0 top-1/2 size-[16px] rounded-[16px] border border-solid bg-white transition-colors duration-200 ease-in-out dark:bg-[#2a2a2a]",
          active ? "border-[#27624f]" : "border-[#a3a3a3] dark:border-[#5a5a5a]",
        )}
      />
      {active ? (
        <div className="absolute left-[3px] top-[2.94px] size-[10px] rounded-[10px] bg-[#27624f] animate-in fade-in zoom-in duration-200 ease-in-out" />
      ) : null}
    </div>
  );
}

export default function PublicListingLocationFilter({
  title = "Villes et zones",
  searchValue,
  onSearchChange,
  selectedParent,
  selectedChild = "Toutes",
  expandedParent,
  items,
  onToggleParent,
  onSelectAll,
  onSelectParent,
  onSelectChild,
  emptyLabel = "Aucune localisation disponible.",
  allLabel = "Toutes",
  searchPlaceholder = "Ville ou zone",
}: PublicListingLocationFilterProps) {
  const [showAllItems, setShowAllItems] = useState(false);
  // Let the listing sidebar own vertical scrolling to avoid nested scrollbars.
  const contentMaxHeightClassName = "";
  const normalizedSearch = searchValue.trim().toLowerCase();
  const defaultVisibleCount = 6;

  const filteredItems = useMemo(() => {
    if (!normalizedSearch) {
      return items;
    }

    return items
      .map((item) => {
        const children = item.children || [];
        const matchingChildren = children.filter((child) => {
          const childHaystack = `${item.label} ${child.label}`.toLowerCase();
          return childHaystack.includes(normalizedSearch);
        });

        const parentMatch = item.label.toLowerCase().includes(normalizedSearch);
        if (parentMatch) {
          return item;
        }

        if (matchingChildren.length > 0) {
          return {
            ...item,
            children: matchingChildren,
          };
        }

        return null;
      })
      .filter(Boolean) as PublicListingCategoryFilterNode[];
  }, [items, normalizedSearch]);

  const shouldAutoExpandItems = useMemo(() => {
    if (normalizedSearch) {
      return true;
    }

    if (expandedParent && filteredItems.findIndex((item) => item.value === expandedParent) >= defaultVisibleCount) {
      return true;
    }

    if (selectedParent !== allLabel && filteredItems.findIndex((item) => item.value === selectedParent) >= defaultVisibleCount) {
      return true;
    }

    return false;
  }, [allLabel, defaultVisibleCount, expandedParent, filteredItems, normalizedSearch, selectedParent]);

  const visibleItems = useMemo(() => {
    if (showAllItems || shouldAutoExpandItems) {
      return filteredItems;
    }

    return filteredItems.slice(0, defaultVisibleCount);
  }, [defaultVisibleCount, filteredItems, showAllItems, shouldAutoExpandItems]);

  const canToggleItems = !normalizedSearch && filteredItems.length > defaultVisibleCount;
  const isShowingAllItems = showAllItems || shouldAutoExpandItems;

  return (
    <div className="public-listing-filter relative mt-2 w-full border-t border-solid border-[#e8e8e8] pt-2 dark:border-[#3a3a3a]">
      <div className="content-stretch flex flex-col items-start px-2 pb-1 pt-0 relative w-full">
        <div className="content-stretch flex w-full items-center min-h-px min-w-px relative">
          <div className="flex items-center gap-1.5 font-['Roboto_Flex:Bold',sans-serif] font-bold leading-[1.2] not-italic relative shrink-0 text-[#191919] dark:text-white text-[11px] whitespace-nowrap">
            <MapPin className="tanyora-filter-section-icon h-3.5 w-3.5 text-[#27624f]" strokeWidth={1.8} aria-hidden="true" />
            <p className="tanyora-filter-section-title leading-[1.2]">{title}</p>
          </div>
        </div>

        <div className="mt-2 w-full">
          <div className="public-listing-filter-control ui-border-strong ui-surface ui-text-main flex h-8 items-center gap-2 rounded-[10px] border px-2.5">
            <svg className="size-4 shrink-0 text-[#707070] dark:text-gray-400" fill="none" viewBox="0 0 18 18">
              <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 12L16.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
              aria-label={`${title} : rechercher une ville ou une zone`}
              className="h-full min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#8c8c93] dark:placeholder:text-[#8a8a94]"
            />
          </div>
        </div>

        <div className={clsx("mt-2 flex w-full flex-col gap-0.5", contentMaxHeightClassName)}>
          <button
            onClick={() => {
              trackFilterApplied("listing", "location");
              onSelectAll();
            }}
            aria-pressed={selectedParent === allLabel}
            className="tanyora-filter-choice relative flex w-full cursor-pointer flex-col items-start rounded-md px-2 py-1 text-left"
          >
            <div className="relative shrink-0 w-full">
              <div className="content-stretch flex items-start pl-[25px] pt-[2px] relative w-full">
                <div
                  className={clsx(
                    "flex min-w-0 flex-1 flex-col justify-center text-[11px] leading-[1.3]",
                    selectedParent === allLabel
                      ? "font-medium text-[#171717] dark:text-white"
                      : "text-[#171717] dark:text-gray-300",
                  )}
                >
                  <p className="leading-[1.4] whitespace-normal break-words">{allLabel}</p>
                </div>
              </div>
              <RadioIndicator active={selectedParent === allLabel} />
            </div>
          </button>

          {filteredItems.length === 0 ? (
            <div className="px-2 py-1 text-[11px] text-[#7a7a82] dark:text-[#8a8a94]">{emptyLabel}</div>
          ) : (
            visibleItems.map((item) => {
              const children = item.children || [];
              const hasChildren = children.length > 0;
              const isParentSelected = selectedParent === item.value && selectedChild === allLabel;
              const isParentExpanded = expandedParent === item.value;
              const hasSelectedChild = selectedParent === item.value && selectedChild !== allLabel;

              return (
                <div key={item.value} className="w-full">
                  <div className="relative flex w-full items-start gap-2 rounded-md px-2 py-1">
                    <button
                      type="button"
                      aria-pressed={isParentSelected || hasSelectedChild}
                      onClick={() => {
                        trackFilterApplied("listing", "location");
                        onSelectParent(item.value);
                        if (hasChildren) {
                          onToggleParent(item.value);
                        }
                      }}
                      className="tanyora-filter-choice relative min-w-0 flex-1 text-left"
                    >
                      <div className="content-stretch flex items-start pl-[25px] pt-[2px] relative w-full">
                        <div
                          className={clsx(
                          "flex min-w-0 flex-1 flex-col justify-center text-[11px] leading-[1.3]",
                            isParentSelected || hasSelectedChild
                              ? "font-medium text-[#171717] dark:text-white"
                              : "text-[#171717] dark:text-gray-300",
                          )}
                        >
                          <p className="leading-[1.4] whitespace-normal break-words">{item.label}</p>
                        </div>
                      </div>
                      <RadioIndicator active={isParentSelected} />
                    </button>

                    {hasChildren ? (
                      <button
                        type="button"
                        aria-label={isParentExpanded ? "Réduire la localisation" : "Afficher les zones"}
                        onClick={() => onToggleParent(item.value)}
                        className="mt-[3px] inline-flex shrink-0 items-center justify-center rounded-full p-1 text-[#474747] transition-transform duration-200 dark:text-gray-300"
                      >
                        <svg
                          className={clsx("h-[10px] w-[10px] transition-transform duration-300 ease-in-out", isParentExpanded ? "rotate-180" : "")}
                          fill="none"
                          viewBox="0 0 10 10"
                        >
                          <path d="M5 7.5L1.25 3.75H8.75L5 7.5Z" fill="currentColor" />
                        </svg>
                      </button>
                    ) : null}
                  </div>

                  {hasChildren && isParentExpanded ? (
                    <div className="ml-[22px] mt-0.5 flex flex-col gap-0.5 border-l border-[#ececec] pl-3 dark:border-[#3a3a3a]">
                      {children.map((child) => {
                        const isChildActive = selectedParent === item.value && selectedChild === child.value;
                        return (
                          <button
                            key={child.value}
                            type="button"
                            aria-pressed={isChildActive}
                            onClick={() => {
                              trackFilterApplied("listing", "location");
                              onSelectChild?.(item.value, child.value);
                            }}
                            className={clsx(
                              "tanyora-filter-choice rounded-md px-2 py-1 text-left text-[11px]",
                              isChildActive
                                ? "bg-[#27624f] font-medium text-white"
                                : "text-[#5d5d64] dark:text-[#b4b4bb]",
                            )}
                          >
                            {child.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}

          {canToggleItems ? (
            <button
              type="button"
              onClick={() => setShowAllItems((current) => !current)}
              className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-[11px] font-medium text-[#5d5d64] dark:text-[#b4b4bb]"
            >
              <span>{isShowingAllItems ? "Voir moins" : "Voir plus"}</span>
              <svg
                className={clsx("h-[10px] w-[10px] transition-transform duration-300 ease-in-out", isShowingAllItems ? "rotate-180" : "")}
                fill="none"
                viewBox="0 0 10 10"
              >
                <path d="M5 7.5L1.25 3.75H8.75L5 7.5Z" fill="currentColor" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
