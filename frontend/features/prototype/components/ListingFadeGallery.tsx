"use client";

import Image from "next/image";
import { ChevronDown, ChevronUp } from "lucide-react";
import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import ListingConditionBadge from "@/features/prototype/components/ListingConditionBadge";

type ListingFadeGalleryProps = {
  title: string;
  meta: string;
  location: string;
  images: string[];
  conditionLabel?: string;
  imageAltPrefix?: string;
  containerClassName?: string;
  imageClassName?: string;
  thumbnailsClassName?: string;
  thumbnailSizeClassName?: string;
  thumbnailRailHeightClassName?: string;
  overlayContentWidthClassName?: string;
};

export default function ListingFadeGallery({
  title,
  meta,
  location,
  images,
  conditionLabel,
  imageAltPrefix,
  containerClassName = "min-h-[300px] sm:min-h-[420px]",
  imageClassName = "",
  thumbnailsClassName = "grid grid-cols-4 gap-3 lg:grid-cols-1 lg:auto-rows-[96px]",
  thumbnailSizeClassName = "lg:h-[96px] lg:w-[96px]",
  thumbnailRailHeightClassName = "lg:h-[420px]",
  overlayContentWidthClassName = "max-w-[560px]",
}: ListingFadeGalleryProps) {
  const galleryImages = useMemo(() => Array.from(new Set(images.filter(Boolean))), [images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const thumbnailRailRef = useRef<HTMLDivElement>(null);
  const activeThumbnailRef = useRef<HTMLButtonElement>(null);
  const hasScrollableThumbnails = galleryImages.length > 4;

  useEffect(() => {
    setActiveIndex(0);
  }, [galleryImages]);

  useEffect(() => {
    if (!hasScrollableThumbnails) {
      return;
    }

    const rail = thumbnailRailRef.current;
    const thumbnail = activeThumbnailRef.current;
    if (!rail || !thumbnail) {
      return;
    }

    rail.scrollTo({
      top: Math.max(0, thumbnail.offsetTop - (rail.clientHeight - thumbnail.clientHeight) / 2),
      behavior: "smooth",
    });
  }, [activeIndex, hasScrollableThumbnails]);

  function scrollThumbnailRail(direction: "up" | "down") {
    const rail = thumbnailRailRef.current;
    if (!rail) {
      return;
    }

    rail.scrollBy({
      top: direction === "up" ? -Math.max(rail.clientHeight * 0.75, 96) : Math.max(rail.clientHeight * 0.75, 96),
      behavior: "smooth",
    });
  }

  useEffect(() => {
    if (galleryImages.length <= 1 || isImageZoomed) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % galleryImages.length);
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [galleryImages, isImageZoomed]);

  function updateZoomOrigin(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    setZoomOrigin(`${Math.max(0, Math.min(100, x))}% ${Math.max(0, Math.min(100, y))}%`);
  }

  const activeImage = galleryImages[activeIndex] || "";

  return (
    <div className={`grid items-start gap-3 ${galleryImages.length > 1 ? "lg:grid-cols-[minmax(0,1fr)_104px]" : ""}`}>
      <div
        className={`relative overflow-hidden rounded-[20px] bg-[#f5f5f7] ${isImageZoomed ? "cursor-zoom-out" : "cursor-zoom-in"} ${containerClassName}`}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") {
            updateZoomOrigin(event);
            setIsImageZoomed(true);
          }
        }}
        onPointerMove={updateZoomOrigin}
        onPointerLeave={() => setIsImageZoomed(false)}
      >
        {galleryImages.map((imageUrl, index) => (
          <div
            key={`${imageUrl}-${index}`}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${index === activeIndex ? "opacity-100" : "opacity-0"}`}
          >
            <Image
              alt={index === activeIndex ? title : ""}
              src={imageUrl}
              fill
              className={`object-cover transition-transform duration-150 ease-out ${index === activeIndex && isImageZoomed ? "scale-[1.85]" : "scale-100"} ${imageClassName}`}
              style={index === activeIndex ? { transformOrigin: zoomOrigin } : undefined}
              sizes="(max-width: 1024px) 100vw, 760px"
              priority={index === 0}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/62 to-black/12" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className={overlayContentWidthClassName}>
            {conditionLabel ? (
              <ListingConditionBadge className="mb-3 border-white/35 !bg-[#201c1f]/95 !text-white shadow-[0_8px_20px_rgba(0,0,0,0.35)] backdrop-blur-sm">
                {conditionLabel}
              </ListingConditionBadge>
            ) : null}
            <p className="break-words text-[26px] font-bold leading-[1.1] text-white [overflow-wrap:anywhere] [text-shadow:0_2px_14px_rgba(0,0,0,0.45)]">
              {title}
            </p>
            <div className="mt-3 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 backdrop-blur-md">
              <p className="break-words text-[13px] font-semibold !text-white [overflow-wrap:anywhere] [text-shadow:0_1px_8px_rgba(0,0,0,0.4)]">
                {meta}
              </p>
              {location ? <span className="h-1 w-1 rounded-full bg-white/70" /> : null}
              {location ? <p className="break-words text-[12px] !text-white/90 [overflow-wrap:anywhere]">{location}</p> : null}
            </div>
          </div>
        </div>
      </div>

      {galleryImages.length > 1 ? (
        <>
          <div className={`${thumbnailsClassName} lg:hidden`}>
            {galleryImages.map((imageUrl, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={`${imageUrl}-thumb-mobile-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`relative aspect-square overflow-hidden rounded-[16px] border transition ${isActive ? "border-[#27624f] shadow-[0_0_0_2px_rgba(204,32,42,0.12)]" : "border-[#ececf0] hover:border-[#27624f]/40"}`}
                >
                  <Image alt={`${imageAltPrefix || title} ${index + 1}`} src={imageUrl} fill className="object-cover" sizes="25vw" />
                </button>
              );
            })}
          </div>

          <div className={`relative hidden lg:block ${hasScrollableThumbnails ? thumbnailRailHeightClassName : ""}`}>
            {hasScrollableThumbnails ? (
              <button
                type="button"
                onClick={() => scrollThumbnailRail("up")}
                className="thumbnail-rail-control absolute left-1/2 top-1 z-10 grid h-7 w-7 -translate-x-1/2 place-items-center rounded-full border border-black/10 bg-white/95 text-[#171719] shadow-sm transition-colors hover:bg-white"
                aria-label="Voir les photos précédentes"
              >
                <ChevronUp size={16} strokeWidth={2.5} />
              </button>
            ) : null}
            <div
              ref={thumbnailRailRef}
              className={`grid gap-3 ${hasScrollableThumbnails ? "h-full snap-y snap-mandatory overflow-y-auto py-9 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : ""}`}
            >
              {galleryImages.map((imageUrl, index) => {
                const isActive = index === activeIndex;
                return (
                  <button
                    key={`${imageUrl}-thumb-${index}`}
                    ref={isActive ? activeThumbnailRef : null}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`relative aspect-square shrink-0 snap-start overflow-hidden rounded-[16px] border transition ${thumbnailSizeClassName} ${isActive ? "border-[#27624f] shadow-[0_0_0_2px_rgba(204,32,42,0.12)]" : "border-[#ececf0] hover:border-[#27624f]/40"}`}
                  >
                    <Image alt={`${imageAltPrefix || title} ${index + 1}`} src={imageUrl} fill className="object-cover" sizes="96px" />
                  </button>
                );
              })}
            </div>
            {hasScrollableThumbnails ? (
              <button
                type="button"
                onClick={() => scrollThumbnailRail("down")}
                className="thumbnail-rail-control absolute bottom-1 left-1/2 z-10 grid h-7 w-7 -translate-x-1/2 place-items-center rounded-full border border-black/10 bg-white/95 text-[#171719] shadow-sm transition-colors hover:bg-white"
                aria-label="Voir les photos suivantes"
              >
                <ChevronDown size={16} strokeWidth={2.5} />
              </button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
