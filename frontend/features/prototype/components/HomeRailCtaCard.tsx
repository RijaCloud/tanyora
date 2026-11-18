import { ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";

type HomeRailCtaCardProps = {
  title: string;
  description: string;
  href: string;
  className?: string;
};

/** Completes a home rail without presenting missing content as a real listing. */
export function HomeRailCtaCard({ title, description, href, className = "" }: HomeRailCtaCardProps) {
  return (
    <Link
      href={href}
      className={`home-rail-cta flex min-w-0 flex-col justify-between rounded-[12px] border border-dashed border-[#e7c8a6] bg-[#fff8eb] p-4 transition-colors duration-200 hover:border-[#d9aa75] hover:bg-[#fff3df] dark:border-[#8f6d4a] dark:bg-[#2a241d] dark:hover:border-[#b88a5d] dark:hover:bg-[#33291f] ${className}`}
    >
      <span className="grid h-9 w-9 place-items-center rounded-full bg-[#27624f] text-white">
        <Plus className="h-4 w-4" strokeWidth={2.4} />
      </span>
      <div>
        <p className="text-[14px] font-bold leading-[1.15] tracking-[-0.02em] text-[var(--text-main)]">{title}</p>
        <p className="mt-1 text-[11px] leading-[1.35] text-[var(--text-soft)]">{description}</p>
      </div>
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#27624f]">
        Commencer <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}
