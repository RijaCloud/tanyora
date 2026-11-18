"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Tag } from "lucide-react";

export type PublicListingCategoryFilterNode = {
  label: string;
  value: string;
  children?: PublicListingCategoryFilterNode[];
};

type PublicListingCategoryFilterProps = {
  title?: string;
  isOpen: boolean;
  isLoading?: boolean;
  isDesktopFilters?: boolean;
  selectedParent: string;
  selectedChild?: string;
  expandedParent: string | null;
  items: PublicListingCategoryFilterNode[];
  onToggleSection: () => void;
  onToggleParent: (value: string) => void;
  onSelectAll: () => void;
  onSelectParent: (value: string) => void;
  onSelectChild?: (parentValue: string, childValue: string) => void;
  emptyLabel?: string;
  allLabel?: string;
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

export default function PublicListingCategoryFilter({
  title = "Catégories",
  isOpen,
  isLoading = false,
  isDesktopFilters = false,
  selectedParent,
  selectedChild = "Tous",
  expandedParent,
  items,
  onToggleSection,
  onToggleParent,
  onSelectAll,
  onSelectParent,
  onSelectChild,
  emptyLabel = "Aucune catégorie disponible.",
  allLabel = "Tous",
}: PublicListingCategoryFilterProps) {
  const [showAllItems, setShowAllItems] = useState(false);
  const contentMaxHeightClassName = "";
  const defaultVisibleCount = 6;

  const shouldAutoExpandItems = useMemo(() => {
    if (expandedParent && items.findIndex((item) => item.value === expandedParent) >= defaultVisibleCount) {
      return true;
    }

    if (selectedParent !== allLabel && items.findIndex((item) => item.value === selectedParent) >= defaultVisibleCount) {
      return true;
    }

    return false;
  }, [allLabel, defaultVisibleCount, expandedParent, items, selectedParent]);

  const visibleItems = useMemo(() => {
    if (showAllItems || shouldAutoExpandItems) {
      return items;
    }

    return items.slice(0, defaultVisibleCount);
  }, [defaultVisibleCount, items, showAllItems, shouldAutoExpandItems]);

  const canToggleItems = items.length > defaultVisibleCount;
  const isShowingAllItems = showAllItems || shouldAutoExpandItems;

  return (
    <div className="public-listing-filter relative shrink-0 w-full pt-1">
      <button
        onClick={onToggleSection}
        className="content-stretch flex flex-col items-start px-2 relative w-full"
      >
        <div className="h-7 relative shrink-0 w-full">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[5px] items-center relative size-full">
            <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative">
              <div className="flex items-center gap-1.5 font-['Roboto_Flex:Bold',sans-serif] font-bold leading-[1.2] not-italic relative shrink-0 text-[#191919] dark:text-white text-[11px] whitespace-nowrap">
                <Tag className="tanyora-filter-section-icon h-3.5 w-3.5 text-[#27624f]" strokeWidth={1.8} aria-hidden="true" />
                <p className="tanyora-filter-section-title leading-[1.2]">{title}</p>
              </div>
            </div>
            <svg
              className={clsx(
                "w-[10px] h-[10px] transition-transform duration-300 ease-in-out",
                isOpen ? "" : "-rotate-90",
                isDesktopFilters ? "block" : "block",
              )}
              fill="none"
              viewBox="0 0 10 10"
            >
              <path
                d="M5 7.5L1.25 3.75H8.75L5 7.5Z"
                fill="#474747"
                className="dark:fill-gray-300"
              />
            </svg>
          </div>
        </div>
      </button>

      <div
        className={clsx(
          "relative shrink-0 w-full transition-all duration-300 ease-in-out",
          isOpen ? "max-h-none overflow-visible opacity-100" : "max-h-0 overflow-hidden opacity-0",
        )}
      >
        <div aria-hidden="true" className="absolute inset-0 border-t border-solid border-[#e8e8e8] dark:border-[#3a3a3a] pointer-events-none" />
        <div className="content-stretch flex flex-col items-start px-2 py-1 relative w-full">
          <div className={clsx("bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-0.5 items-start py-0.5 relative w-full", contentMaxHeightClassName)}>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={`category-skeleton-${index}`} className="w-full rounded-md px-2 py-1.5">
                  <div className="h-4 w-[85%] animate-pulse rounded bg-[#ececec] dark:bg-[#3a3a3a]" />
                </div>
              ))
            ) : (
              <>
                <button
                  onClick={onSelectAll}
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

                {items.length === 0 ? (
                  <div className="px-2 py-1 text-[11px] text-[#7a7a82] dark:text-[#8a8a94]">{emptyLabel}</div>
                ) : (
                  visibleItems.map((item) => {
                    const children = item.children || [];
                    const hasChildren = children.length > 0;
                    const isParentSelected = selectedParent === item.value && selectedChild === "Tous";
                    const isParentExpanded = expandedParent === item.value;
                    const hasSelectedChild = selectedParent === item.value && selectedChild !== "Tous";

                    return (
                      <div key={item.value} className="w-full">
                        <div className="relative flex w-full items-start gap-2 rounded-md px-2 py-1">
                          <button
                            type="button"
                            aria-pressed={isParentSelected || hasSelectedChild}
                            onClick={() => {
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
                              aria-label={isParentExpanded ? "Réduire la catégorie" : "Afficher les sous-catégories"}
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
                              const isChildActive =
                                selectedParent === item.value && selectedChild === child.value;
                              return (
                                <button
                                  key={child.value}
                                  type="button"
                                  aria-pressed={isChildActive}
                                  onClick={() => onSelectChild?.(item.value, child.value)}
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
