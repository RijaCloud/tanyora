export default function ListingConditionBadge({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  return (
    <span
      className={`ui-tag inline-flex items-center rounded-full border border-[#e8d9b6] bg-[var(--color-cream)] px-3 py-1.5 text-[11px] font-semibold text-[var(--color-dark)] dark:border-[#5a503b] dark:bg-[#393326] dark:text-[#fff3d2] ${className}`.trim()}
    >
      {children}
    </span>
  );
}
