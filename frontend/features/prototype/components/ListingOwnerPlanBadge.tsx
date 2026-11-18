import clsx from "clsx";

export type ListingOwnerPlanId = "essentiel" | "business";

const PLAN_STYLES: Record<ListingOwnerPlanId, { label: string; className: string }> = {
  essentiel: {
    label: "Compte Pro vérifié",
    className: "text-[#1d9bf0]",
  },
  business: {
    label: "Compte Entreprise vérifié",
    className: "text-[#d99a18]",
  },
};

export default function ListingOwnerPlanBadge({
  planId,
  className,
}: {
  planId?: ListingOwnerPlanId;
  className?: string;
}) {
  if (!planId) {
    return null;
  }

  const config = PLAN_STYLES[planId];

  return (
    <span
      aria-label={config.label}
      className={clsx(
        "inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center",
        config.className,
        className,
      )}
      role="img"
      title={config.label}
    >
      <svg aria-hidden="true" className="h-full w-full" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="currentColor" />
        <path d="m8.2 12.1 2.35 2.35 5.3-5.3" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.15" />
      </svg>
    </span>
  );
}
