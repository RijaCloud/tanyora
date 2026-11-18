// @ts-nocheck
"use client";

import { ArrowUpRight } from "lucide-react";
import { Link } from "@/features/prototype/router-compat";
import { AppImage } from "@/components/ui/AppImage";

interface SmallProductCardProps {
  image?: string;
  name: string;
  subtitle?: string;
  price?: string;
  href?: string;
  compact?: boolean;
}

export function SmallProductCard({
  image,
  name,
  subtitle,
  price,
  href = "/petites-annonces",
  compact = false,
}: SmallProductCardProps) {
  const imageHeight = compact ? "h-[76px]" : "h-[138px]";
  const cardHeight = compact ? "h-[148px]" : "h-[244px]";
  const contentHeight = compact ? "h-[72px]" : "h-[106px]";

  return (
    <Link
      to={href}
      className={`group block ${cardHeight} overflow-hidden rounded-[18px] border border-[color:var(--border-soft)] bg-[color:var(--surface-1)] transition-colors duration-300 hover:border-[#27624f]/45`}
    >
      <div className={`relative ${imageHeight} overflow-hidden bg-[color:var(--surface-3)]`}>
        <AppImage
          defer
          src={image || "/image-placeholder.png"}
          alt=""
          className="h-full w-full object-cover"
        />
        <span className={`absolute inline-flex items-center justify-center rounded-full bg-[#27624f] text-white shadow-[0_6px_16px_rgba(234,40,40,0.3)] ${compact ? "bottom-2 right-2 h-7 w-7" : "bottom-3 right-3 h-9 w-9"}`}>
          <ArrowUpRight className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </span>
      </div>

      <div className={`flex ${contentHeight} flex-col justify-between ${compact ? "p-2.5" : "p-3 sm:p-3.5"}`}>
        <div>
          <p className={`line-clamp-2 font-bold leading-[1.15] tracking-[-0.02em] text-[color:var(--text-main)] ${compact ? "text-[11px]" : "text-[14px]"}`}>{name}</p>
          {subtitle ? <span className={`mt-0.5 block truncate text-[color:var(--text-muted)] ${compact ? "text-[9px]" : "mt-1 text-[11px]"}`}>{subtitle}</span> : null}
        </div>
        {price ? <span className={`${compact ? "text-[10px]" : "text-[12px]"} font-bold text-[#27624f]`}>{price}</span> : null}
      </div>
    </Link>
  );
}
