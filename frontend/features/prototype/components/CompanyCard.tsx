// @ts-nocheck
"use client";

import { MapPin } from "lucide-react";
import { Link } from "@/features/prototype/router-compat";

interface CompanyCardProps {
  initial: string;
  companyName: string;
  position: string;
  color: string;
  location?: string;
  href?: string;
  logoUrl?: string;
  compact?: boolean;
  dense?: boolean;
  tone?: "default" | "cream" | "purple";
  emphasizePosition?: boolean;
  emphasizeCompany?: boolean;
}

export function CompanyCard({
  initial,
  companyName,
  position,
  color,
  location,
  href = "/offres-emploi",
  logoUrl,
  compact = false,
  dense = false,
  tone = "default",
  emphasizePosition = false,
  emphasizeCompany = false,
}: CompanyCardProps) {
  const isDense = compact && dense;
  const hasLightTone = tone !== "default";
  const emphasizePrimaryLabel = emphasizePosition || emphasizeCompany;
  const eyebrow = emphasizeCompany ? position : companyName;
  const primaryLabel = emphasizeCompany ? companyName : position;
  const sizeClassName = isDense
    ? "min-h-[85px] p-2"
    : compact
      ? "min-h-[112px] p-3"
      : "min-h-[132px] p-4 shadow-[0_14px_32px_rgba(15,23,42,0.08)]";
  const toneClassName = tone === "cream"
    ? "border-[#ead9aa] bg-[var(--color-cream)]"
    : tone === "purple"
      ? "border-[#c1adeb] bg-[var(--color-purple)]"
      : "border-[color:var(--border-soft)] bg-[color:var(--surface-1)]";
  const content = (
    <div className={`rounded-[18px] border transition-colors duration-300 group-hover:border-[#27624f]/45 group-focus-visible:border-[#27624f]/45 ${toneClassName} ${sizeClassName}`}>
      <div className={`flex items-start ${isDense ? "gap-2" : compact ? "gap-2.5" : "gap-3.5"}`}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={companyName}
            className={`${isDense ? "h-8 w-8 rounded-[9px] p-0.5" : compact ? "h-9 w-9 rounded-[10px] p-1" : "h-12 w-12 rounded-[14px] p-1.5"} shrink-0 border border-[color:var(--border-soft)] bg-white object-contain`}
          />
        ) : (
          <div
            className={`flex shrink-0 items-center justify-center font-bold text-white ${isDense ? "h-8 w-8 rounded-[9px] text-xs" : compact ? "h-9 w-9 rounded-[10px] text-sm" : "h-12 w-12 rounded-[14px] text-base"}`}
            style={{ backgroundColor: color }}
          >
            {initial}
          </div>
        )}
        <div className={`min-w-0 flex-1 ${emphasizePrimaryLabel ? "flex min-h-[67px] flex-col" : ""}`}>
          <p className={`line-clamp-1 font-bold uppercase tracking-[0.08em] ${hasLightTone ? "text-[#67552d]" : "text-[color:var(--text-muted)]"} ${isDense ? "text-[8px]" : compact ? "text-[9px]" : "text-[11px]"}`}>{eyebrow}</p>
          {emphasizePrimaryLabel && location ? (
            <p className={`flex items-center ${hasLightTone ? "text-[#67552d]" : "text-[color:var(--text-muted)]"} ${isDense ? "mt-0.5 gap-1 text-[8px]" : compact ? "mt-1 gap-1 text-[9px]" : "mt-2 gap-1.5 text-[11px]"}`}>
              <MapPin className={`${isDense || compact ? "h-3 w-3" : "h-3.5 w-3.5"} text-[#27624f]`} />
              <span className="truncate">{location}</span>
            </p>
          ) : null}
          <h4 className={`${emphasizePrimaryLabel ? "line-clamp-1" : "line-clamp-2"} font-bold leading-[1.1] tracking-[-0.025em] ${hasLightTone ? "text-[#190a0a]" : "text-[color:var(--text-main)]"} ${emphasizePrimaryLabel ? "mt-auto" : isDense ? "mt-0.5" : compact ? "mt-0.5" : "mt-1"} ${isDense ? "text-[11px]" : compact ? "text-[12px]" : "text-[16px]"}`}>{primaryLabel}</h4>
          {!emphasizePrimaryLabel && location ? (
            <p className={`flex items-center ${hasLightTone ? "text-[#67552d]" : "text-[color:var(--text-muted)]"} ${isDense ? "mt-0.5 gap-1 text-[8px]" : compact ? "mt-1 gap-1 text-[9px]" : "mt-2 gap-1.5 text-[11px]"}`}>
              <MapPin className={`${isDense || compact ? "h-3 w-3" : "h-3.5 w-3.5"} text-[#27624f]`} />
              <span className="truncate">{location}</span>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <Link
      to={href}
      className="group block cursor-pointer rounded-[18px] outline-none focus-visible:ring-2 focus-visible:ring-[#27624f] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#190a0a]"
    >
      {content}
    </Link>
  );
}
