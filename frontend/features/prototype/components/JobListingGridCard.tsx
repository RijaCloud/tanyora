"use client";

import type { ReactNode } from "react";
import { MapPin } from "lucide-react";
import { Link } from "@/features/prototype/router-compat";
import { AppImage } from "@/components/ui/AppImage";

type JobListingGridCardProps = {
  company: string;
  title: string;
  location?: string;
  logoUrl?: string;
  initial: string;
  color: string;
  href?: string;
  onClick?: () => void;
  badge?: ReactNode;
  footer?: ReactNode;
  compact?: boolean;
  className?: string;
};

export function JobListingGridCard({
  company,
  title,
  location,
  logoUrl,
  initial,
  color,
  href,
  onClick,
  badge,
  footer,
  compact = false,
  className = "",
}: JobListingGridCardProps) {
  const content = (
    <>
      {!compact ? <div aria-hidden="true" className="ui-border pointer-events-none absolute inset-0 rounded-[12px] border-[2px] transition-colors duration-300 ease-in-out group-hover:border-[#27624f]" /> : null}
      {badge}
      <div className={`flex h-full flex-col ${compact ? "gap-2 p-2.5" : "justify-between gap-[18px] p-[5px]"}`}>
        <div className={compact ? "flex h-full min-w-0 flex-col" : "flex h-full flex-col justify-between px-[14px] py-[14px]"}>
          <div className={`flex min-w-0 items-start ${compact ? "gap-2" : "gap-[12px]"}`}>
            {logoUrl ? (
              <AppImage defer src={logoUrl} alt={company} className={`${compact ? "h-8 w-8 rounded-[9px] p-0.5" : "h-[38px] w-[38px] rounded-[10px] p-1"} shrink-0 ${compact ? "" : "border border-[color:var(--border-soft)]"} bg-white object-contain`} />
            ) : (
              <span className={`${compact ? "h-8 w-8 rounded-[9px] text-[11px]" : "h-[38px] w-[38px] rounded-[10px] text-sm"} inline-flex shrink-0 items-center justify-center font-bold text-white`} style={{ backgroundColor: color }}>
                {initial}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className={`${compact ? "line-clamp-2 text-[11px] leading-[1.05] normal-case tracking-[-0.02em] text-[var(--text-main)]" : "line-clamp-1 text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]"} font-bold`}>{company}</p>
              {location ? (
                <span className={`mt-1 flex min-w-0 items-center gap-1 text-[var(--text-soft)] ${compact ? "text-[8px]" : "text-[11px]"}`}>
                  <MapPin className="h-3 w-3 shrink-0 text-[#27624f]" />
                  <span className="truncate">{location}</span>
                </span>
              ) : null}
            </div>
          </div>
          <p className={`${compact ? "mt-2 line-clamp-2 text-[12px]" : "mt-3 line-clamp-2 text-[14px]"} font-semibold leading-[1.2] tracking-[-0.02em] text-[var(--text-main)]`}>{title}</p>
          {footer}
        </div>
      </div>
    </>
  );
  const classes = `group relative ${compact ? "h-[158px] bg-[#f5f5f7] dark:bg-white/10" : "ui-surface h-[236px]"} min-w-0 overflow-hidden rounded-[12px] font-['Roboto_Flex',sans-serif] prototype-listing-card transition-colors duration-300 ${className}`;
  if (href) return <Link to={href} className={`block cursor-pointer ${classes}`}>{content}</Link>;
  return <div onClick={onClick} className={`cursor-pointer ${classes}`}>{content}</div>;
}
