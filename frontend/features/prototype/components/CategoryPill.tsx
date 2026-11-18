"use client";

interface CategoryPillProps {
  label: string;
  active?: boolean;
  className?: string;
}

export function CategoryPill({ label, active = false, className = "" }: CategoryPillProps) {
  return (
    <span
      className={`ui-tag inline-flex items-center rounded-full font-medium transition-colors duration-150 border ${
        active
          ? 'bg-[var(--surface-3)] text-[#27624f] border-[#27624f]'
          : 'bg-[var(--surface-2)] border-[var(--border-soft)] text-[var(--text-main)] hover:border-[#27624f]'
      } ${className}`}
    >
      {label}
    </span>
  );
}
