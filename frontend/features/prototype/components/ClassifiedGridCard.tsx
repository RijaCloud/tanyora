"use client";

import type { ReactNode } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Link } from "@/features/prototype/router-compat";
import { AppImage } from "@/components/ui/AppImage";

type ClassifiedGridCardProps = {
  title: string;
  image?: string;
  price?: string;
  location?: string;
  href?: string;
  onClick?: () => void;
  media?: ReactNode;
  badge?: ReactNode;
  compact?: boolean;
  className?: string;
};

export function ClassifiedGridCard({
  title,
  image,
  price,
  location,
  href,
  onClick,
  media,
  badge,
  compact = false,
  className = "",
}: ClassifiedGridCardProps) {
  const imageHeight = compact ? "h-[48px]" : "h-[132px]";
  // Compact cards are used in the home hero. Let the card grow with its title
  // instead of hiding useful listing names behind a line clamp.
  const cardHeight = compact ? "h-[144px]" : "h-[264px]";
  const content = (
    <>
      {!compact ? <div aria-hidden="true" className="ui-border pointer-events-none absolute inset-0 rounded-[12px] border-[2px] transition-colors duration-300 ease-in-out group-hover:border-[#27624f]" /> : null}
      {badge}
      <div className={`flex h-full flex-col ${compact ? "gap-1.5" : "gap-3"} p-[5px]`}>
        {media || (
          <div className={`classified-grid-card__media relative ${imageHeight} w-full shrink-0 overflow-hidden rounded-[6px]`}>
            <AppImage defer src={image || "/image-placeholder.png"} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className={`relative flex min-h-0 flex-1 flex-col gap-1.5 ${compact ? "px-2.5 pb-2" : "px-3.5 pb-3.5"}`}>
          <p className={`${compact ? "line-clamp-2 shrink-0 text-[11px]" : "line-clamp-2 min-h-[36px] shrink-0 text-[14px]"} font-bold leading-[1.28] tracking-[-0.02em] text-[var(--text-main)]`}>{title}</p>
          {price ? <p className={`${compact ? "text-[10px]" : "text-[13px]"} font-semibold leading-[1.2] text-[#5b5fc7]`}>{price}</p> : null}
          {location ? (
            <span className={`mt-auto flex min-w-0 items-center gap-1 text-[var(--text-soft)] ${compact ? "text-[9px]" : "text-[11px]"}`}>
              <MapPin className="h-3 w-3 shrink-0 text-[#27624f]" />
              <span className="truncate">{location}</span>
            </span>
          ) : null}
        </div>
        <span className={`absolute grid place-items-center rounded-full bg-[#27624f] text-white shadow-[0_6px_16px_rgba(234,40,40,0.3)] ${compact ? "right-2 top-[32px] h-7 w-7" : "right-3 top-[96px] h-9 w-9"}`} aria-hidden="true">
          <ArrowUpRight className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </span>
      </div>
    </>
  );

  const classes = `group ui-surface relative ${cardHeight} min-w-0 overflow-hidden rounded-[12px] font-['Roboto_Flex',sans-serif] prototype-listing-card transition-colors duration-300 ${className}`;

  if (href) {
    return <Link to={href} onClick={onClick} className={`block cursor-pointer ${classes}`}>{content}</Link>;
  }

  return <div onClick={onClick} className={`cursor-pointer ${classes}`}>{content}</div>;
}
