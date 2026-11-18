"use client";

import { AppImage } from "@/components/ui/AppImage";
import ListingOwnerPlanBadge, { type ListingOwnerPlanId } from "@/features/prototype/components/ListingOwnerPlanBadge";
import svgPaths from "@/features/prototype/imports/svg-efimawrs95";
import { formatListingMoney } from "@/lib/pricing/format-listing-money";
import { useCallback, useEffect, useMemo, useState } from "react";

export type ClassifiedRelatedCardItem = {
  id: number;
  title: string;
  location: string;
  image: string;
  images?: string[];
  price: string;
  currency?: string;
  ownerPlanId?: ListingOwnerPlanId;
};

type ClassifiedRelatedCardProps = {
  item: ClassifiedRelatedCardItem;
  href?: string;
  onClick?: () => void;
};

function getGalleryImages(item: ClassifiedRelatedCardItem) {
  return Array.from(new Set([...(item.images || []), item.image].filter(Boolean)));
}

function GalleryChevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
      <path
        d={direction === "left" ? "M14.5 6.5 9 12l5.5 5.5" : "M9.5 6.5 15 12l-5.5 5.5"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg aria-hidden="true" className="h-[13px] w-[8px] shrink-0 text-[#737373]" fill="none" viewBox="0 0 8 12">
      <path d={svgPaths.p133f400} fill="currentColor" />
    </svg>
  );
}

function ClassifiedRelatedCardMedia({ item }: { item: ClassifiedRelatedCardItem }) {
  const galleryImages = useMemo(() => getGalleryImages(item), [item]);
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultipleImages = galleryImages.length > 1;
  const activeImage = galleryImages[activeIndex] || item.image || "/image-placeholder.png";

  useEffect(() => {
    setActiveIndex(0);
  }, [item.id, item.image, galleryImages.length]);

  const showPreviousImage = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setActiveIndex((current) => (current - 1 + galleryImages.length) % galleryImages.length);
  }, [galleryImages.length]);

  const showNextImage = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setActiveIndex((current) => (current + 1) % galleryImages.length);
  }, [galleryImages.length]);

  return (
    <div className="relative h-[132px] w-full shrink-0 overflow-hidden rounded-[6px]">
      <AppImage alt={item.title} className="absolute inset-0 size-full rounded-[6px] object-cover" src={activeImage} />
      <div className="absolute left-[10px] top-[10px] inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
        <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
          <path d="M4 7.75A2.75 2.75 0 0 1 6.75 5h1.43c.54 0 1.05-.25 1.38-.68l.47-.6c.33-.43.84-.68 1.38-.68h1.18c.54 0 1.05.25 1.38.68l.47.6c.33.43.84.68 1.38.68h1.43A2.75 2.75 0 0 1 20 7.75v8.5A2.75 2.75 0 0 1 17.25 19h-10.5A2.75 2.75 0 0 1 4 16.25v-8.5Z" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="12" cy="12" r="3.25" stroke="currentColor" strokeWidth="1.7" />
        </svg>
        <span>{galleryImages.length}</span>
      </div>
      {hasMultipleImages ? (
        <>
          <div className="pointer-events-none absolute bottom-[10px] left-1/2 inline-flex -translate-x-1/2 items-center rounded-full bg-black/45 px-2 py-1 text-[10px] font-semibold text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
            {activeIndex + 1}/{galleryImages.length}
          </div>
          <button aria-label="Photo précédente" className="gallery-nav-control absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#111111] opacity-0 transition-[opacity,background-color] duration-300 group-hover:opacity-100 focus:opacity-100 hover:bg-[#f7f7f7]" onClick={showPreviousImage} type="button">
            <GalleryChevron direction="left" />
          </button>
          <button aria-label="Photo suivante" className="gallery-nav-control absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#111111] opacity-0 transition-[opacity,background-color] duration-300 group-hover:opacity-100 focus:opacity-100 hover:bg-[#f7f7f7]" onClick={showNextImage} type="button">
            <GalleryChevron direction="right" />
          </button>
        </>
      ) : null}
    </div>
  );
}

export default function ClassifiedRelatedCard({ item, href, onClick }: ClassifiedRelatedCardProps) {
  const content = (
    <>
      <div aria-hidden="true" className="ui-border absolute inset-0 rounded-[12px] border-[2px] transition-colors duration-300 ease-in-out group-hover:border-[#27624f]" />
      {item.ownerPlanId ? <ListingOwnerPlanBadge className="absolute right-3 top-3 z-20" planId={item.ownerPlanId} /> : null}
      <div className="flex h-full flex-col gap-[16px] p-[5px]">
        <ClassifiedRelatedCardMedia item={item} />
        <div className="relative flex shrink-0 flex-1 px-[14px] pb-[14px]">
          <div className="flex w-full min-w-0 items-start">
            <div className="flex min-h-px min-w-0 flex-[1_0_0] flex-col items-start gap-[6px]">
              <p className="ui-text-main line-clamp-2 w-full break-words font-['Roboto_Flex:Bold',sans-serif] text-[14px] font-bold leading-[1.18]">{item.title}</p>
              <p className="w-full break-words font-['Roboto_Flex:Bold',sans-serif] text-[13px] font-bold leading-[1.2] text-[#27624f]">{formatListingMoney(item.price, item.currency) || item.price}</p>
              <div className="flex w-full min-w-0 items-center gap-1">
                <LocationIcon />
                <span className="ui-text-soft truncate font-['Roboto_Flex:Regular',sans-serif] text-[11px]">{item.location}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const className = "group ui-surface relative block h-[240px] w-[min(280px,82vw)] shrink-0 overflow-hidden rounded-[12px] font-['Roboto_Flex',sans-serif] prototype-listing-card sm:w-[180px]";
  return href ? <a className={className} href={href}>{content}</a> : <div className={`${className} cursor-pointer`} onClick={onClick}>{content}</div>;
}
