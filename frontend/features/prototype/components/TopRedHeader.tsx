// @ts-nocheck
"use client";

import { AdSlot } from "@/components/ads/AdSlot";
import { useAdSlots } from "@/components/ads/AdSlotProvider";

export function TopRedHeader({ className = '' }: { className?: string }) {
  const { mode, showPlaceholders, getFirstItem } = useAdSlots();
  const hasTopBannerSlot = Boolean(getFirstItem("topBanner"));
  const showTestBanner = mode === "placeholder" && showPlaceholders;

  if (!hasTopBannerSlot && !showTestBanner) {
    return null;
  }

  return (
    <div
      className={`top-banner-bar flex items-center justify-center bg-[var(--page-bg)] py-2 ${className}`}
    >
      {hasTopBannerSlot ? (
        <div className="mx-auto w-full max-w-[1680px] px-3 sm:px-4 lg:px-6">
          <AdSlot slotKey="topBanner" className="top-banner-slot w-full" />
        </div>
      ) : (
        <div className="mx-auto w-full max-w-[1680px] px-3 sm:px-4 lg:px-6">
          <AdSlot slotKey="topBanner" className="top-banner-slot w-full" />
        </div>
      )}
    </div>
  );
}
