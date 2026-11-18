"use client";

import clsx from "clsx";
import { AppImage } from "@/components/ui/AppImage";
import type { PublicAdFeature, PublicAdItem } from "@/lib/api/wordpress-internal";
import type { PublicListingViewMode } from "@/features/prototype/components/PublicListingCollection";

type InlinePublicListingAdCardProps = {
  ad: PublicAdItem;
  feature: Exclude<PublicAdFeature, "all">;
  viewMode: PublicListingViewMode;
};

const AD_BADGE_LABEL = "PUBLICITÉ";

function getButtonLabel(ad: PublicAdItem) {
  return ad.ctaLabel?.trim() || "Ouvrir";
}

function isCompactFeature(feature: Exclude<PublicAdFeature, "all">) {
  return feature === "job" || feature === "tender";
}

function GridMedia({ ad, feature }: { ad: PublicAdItem; feature: Exclude<PublicAdFeature, "all"> }) {
  const heightClass = feature === "classified" ? "h-[132px]" : "h-[116px]";
  const radiusClass = feature === "classified" ? "rounded-[10px]" : "rounded-t-[12px]";

  return (
    <div className={clsx("relative w-full shrink-0 overflow-hidden bg-[#f5f5f7]", heightClass, radiusClass)}>
      {ad.imageUrl ? (
        <AppImage alt={ad.altText || ad.title || "Publicité"} className="absolute inset-0 h-full w-full object-cover" src={ad.imageUrl} eager />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#fff1f2] via-white to-[#f8d7da]" />
      )}
      <div className="absolute left-2 top-2 inline-flex rounded-full bg-[#27624f] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white">{AD_BADGE_LABEL}</div>
    </div>
  );
}

function InlineAdCta({ ad }: { ad: PublicAdItem }) {
  if (!ad.linkUrl) {
    return null;
  }

  return (
    <a
      href={ad.linkUrl}
      target="_blank"
      rel="noreferrer noopener"
      onClick={(event) => event.stopPropagation()}
      className="inline-flex items-center justify-center rounded-[12px] bg-[#27624f] px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-[#a91b24]"
    >
      {getButtonLabel(ad)}
    </a>
  );
}

function GridCard({ ad, feature }: { ad: PublicAdItem; feature: Exclude<PublicAdFeature, "all"> }) {
  const compact = isCompactFeature(feature);
  const cardHeightClass = compact ? "h-[236px]" : "h-[240px]";

  return (
    <div
      className={clsx(
        "group ui-surface relative w-full min-w-0 overflow-hidden rounded-[12px] transition-colors duration-300",
        cardHeightClass,
        feature !== "classified"
          ? "md:basis-[calc(50%-7px)] md:max-w-[calc(50%-7px)] lg:w-[180px] lg:max-w-[180px] lg:basis-[180px] lg:shrink-0"
          : "md:basis-[calc(50%-7px)] md:max-w-[calc(50%-7px)] lg:w-[180px] lg:max-w-[180px] lg:basis-[180px] lg:shrink-0",
      )}
    >
      <div aria-hidden="true" className="ui-border pointer-events-none absolute inset-0 rounded-[12px] border-[2px] transition-colors duration-300 ease-in-out group-hover:border-[#27624f]" />
      <div className={clsx("flex h-full flex-col", compact ? "gap-0" : "gap-3")}>
        <GridMedia ad={ad} feature={feature} />
        <div className={clsx("flex flex-1 flex-col px-[14px] pb-[14px]", compact ? "pt-[12px]" : "justify-between gap-3")}>
          <div className={clsx("flex flex-1 flex-col", compact ? "justify-between gap-3" : "justify-between gap-3")}>
            <div className={clsx(compact ? "space-y-2" : "space-y-2")}>
              <h3 className={clsx("ui-text-main text-[14px] font-bold leading-[1.2]", compact ? "line-clamp-3 min-h-[50px]" : "line-clamp-2")}>{ad.title}</h3>
              {ad.description ? (
                <p className={clsx("ui-text-muted text-[11px] leading-[1.35]", compact ? "line-clamp-2 min-h-[30px]" : "line-clamp-3")}>{ad.description}</p>
              ) : null}
            </div>
            <div className={clsx("mt-auto flex items-center gap-2", compact ? "justify-start pt-1" : "justify-end")}>
              <InlineAdCta ad={ad} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListCard({ ad, feature }: { ad: PublicAdItem; feature: Exclude<PublicAdFeature, "all"> }) {
  const compact = isCompactFeature(feature);

  return (
    <div className="group ui-surface ui-border relative flex w-full flex-col rounded-[16px] border p-4 text-left transition-colors duration-300 hover:border-[#27624f]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
        <div className={clsx("relative w-full overflow-hidden rounded-[12px] bg-[#f5f5f7] sm:h-auto sm:shrink-0 sm:self-stretch", compact ? "h-[160px] sm:min-h-[160px] sm:w-[220px]" : "h-[220px] sm:min-h-[220px] sm:w-[220px]")}>
          {ad.imageUrl ? (
            <AppImage alt={ad.altText || ad.title || "Publicité"} className="absolute inset-0 h-full w-full object-cover" src={ad.imageUrl} eager />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#fff1f2] via-white to-[#f8d7da]" />
          )}
          <div className="absolute left-2 top-2 inline-flex rounded-full bg-[#27624f] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">{AD_BADGE_LABEL}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className={clsx("min-w-0", compact ? "space-y-2" : "space-y-2")}>
              <h3 className={clsx("ui-text-main font-semibold leading-[1.15]", compact ? "text-[18px]" : "text-[22px]")}>{ad.title}</h3>
              {ad.description ? (
                <p className={clsx("ui-text-muted text-[14px] leading-[1.6]", compact ? "line-clamp-3" : "line-clamp-4")}>{ad.description}</p>
              ) : null}
            </div>
            <div className="shrink-0">
              <InlineAdCta ad={ad} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InlinePublicListingAdCard({
  ad,
  feature,
  viewMode,
}: InlinePublicListingAdCardProps) {
  return viewMode === "grid" ? <GridCard ad={ad} feature={feature} /> : <ListCard ad={ad} feature={feature} />;
}
