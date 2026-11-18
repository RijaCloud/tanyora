"use client";

import type { ReactNode } from "react";
import clsx from "clsx";

export type PublicListingViewMode = "grid" | "list";

type PublicListingCollectionProps<T> = {
  viewMode: PublicListingViewMode;
  isLoading: boolean;
  items: T[];
  renderGridItem: (item: T) => ReactNode;
  renderListItem: (item: T) => ReactNode;
  renderGridSkeleton: (index: number) => ReactNode;
  renderListSkeleton: (index: number) => ReactNode;
  skeletonCount?: number;
  emptyState: ReactNode;
  className?: string;
};

type PublicListingViewToggleProps = {
  value: PublicListingViewMode;
  onChange: (mode: PublicListingViewMode) => void;
  className?: string;
};

export function PublicListingViewToggle({ value, onChange, className }: PublicListingViewToggleProps) {
  return (
    <div className={clsx("ui-surface ui-border inline-flex items-center rounded-[10px] border p-0.5", className)} role="radiogroup" aria-label="Mode d’affichage">
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={clsx(
          "inline-flex items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
          value === "grid" ? "bg-[var(--surface-3)] text-[#27624f]" : "ui-text-muted hover:text-[#27624f]",
        )}
        aria-pressed={value === "grid"}
        role="radio"
        aria-checked={value === "grid"}
      >
        <span className="grid grid-cols-2 gap-0.5" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-[2px] bg-current" />
          <span className="h-1.5 w-1.5 rounded-[2px] bg-current" />
          <span className="h-1.5 w-1.5 rounded-[2px] bg-current" />
          <span className="h-1.5 w-1.5 rounded-[2px] bg-current" />
        </span>
        Grille
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        className={clsx(
          "inline-flex items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
          value === "list" ? "bg-[var(--surface-3)] text-[#27624f]" : "ui-text-muted hover:text-[#27624f]",
        )}
        aria-pressed={value === "list"}
        role="radio"
        aria-checked={value === "list"}
      >
        <span className="flex flex-col gap-0.5" aria-hidden="true">
          <span className="h-1 w-4 rounded-full bg-current" />
          <span className="h-1 w-4 rounded-full bg-current" />
          <span className="h-1 w-4 rounded-full bg-current" />
        </span>
        Liste
      </button>
    </div>
  );
}

export default function PublicListingCollection<T>({
  viewMode,
  isLoading,
  items,
  renderGridItem,
  renderListItem,
  renderGridSkeleton,
  renderListSkeleton,
  skeletonCount = 8,
  emptyState,
  className,
}: PublicListingCollectionProps<T>) {
  if (isLoading) {
    return (
      <div
        className={clsx(
          viewMode === "grid" ? "flex w-full flex-wrap items-start gap-[14px]" : "flex w-full flex-col gap-2",
          className,
        )}
      >
        {Array.from({ length: skeletonCount }).map((_, index) =>
          viewMode === "grid" ? renderGridSkeleton(index) : renderListSkeleton(index),
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div
      className={clsx(
        viewMode === "grid" ? "flex w-full flex-wrap items-start gap-[14px]" : "flex w-full flex-col gap-2",
        className,
      )}
    >
      {items.map((item) => (viewMode === "grid" ? renderGridItem(item) : renderListItem(item)))}
    </div>
  );
}
