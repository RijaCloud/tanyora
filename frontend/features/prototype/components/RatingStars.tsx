"use client";

import clsx from "clsx";

type RatingStarsProps = {
  value: number;
  max?: number;
  size?: number;
  className?: string;
  interactive?: boolean;
  disabled?: boolean;
  hoverValue?: number;
  onHoverChange?: (value: number) => void;
  onChange?: (value: number) => void;
};

const STAR_PATH =
  "M12 17.27L18.18 21 16.54 13.97 22 9.24 14.81 8.63 12 2 9.19 8.63 2 9.24 7.46 13.97 5.82 21z";

function StarIcon({
  filled,
  size,
}: {
  filled: boolean;
  size: number;
}) {
  return (
    <svg
      aria-hidden="true"
      className={filled ? "text-[#f4b740]" : "text-[#d6d6da] dark:text-[#4a4a52]"}
      fill="currentColor"
      viewBox="0 0 24 24"
      width={size}
      height={size}
    >
      <path d={STAR_PATH} />
    </svg>
  );
}

function ReadonlyStar({
  fill,
  size,
}: {
  fill: number;
  size: number;
}) {
  const clampedFill = Number.isFinite(fill) ? Math.max(0, Math.min(fill, 1)) : 0;

  return (
    <div
      className="relative inline-flex shrink-0"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0">
        <StarIcon filled={false} size={size} />
      </div>
      {clampedFill > 0 ? (
        <div
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${clampedFill * 100}%` }}
        >
          <StarIcon filled size={size} />
        </div>
      ) : null}
    </div>
  );
}

export default function RatingStars({
  value,
  max = 5,
  size = 14,
  className,
  interactive = false,
  disabled = false,
  hoverValue,
  onHoverChange,
  onChange,
}: RatingStarsProps) {
  const resolvedValue = interactive && Number.isFinite(hoverValue) ? Number(hoverValue) : value;
  const safeValue = Number.isFinite(resolvedValue) ? Math.max(0, Math.min(resolvedValue, max)) : 0;
  const gap = Math.max(2, Math.round(size * 0.18));

  if (interactive) {
    return (
      <div
        className={clsx("inline-flex items-center", className, disabled ? "opacity-45" : "")}
        role="radiogroup"
        aria-label="Notation"
        style={{ gap }}
        onMouseLeave={() => onHoverChange?.(0)}
      >
        {Array.from({ length: max }).map((_, index) => {
          const score = index + 1;
          const filled = score <= safeValue;

          return (
            <button
              key={`interactive-${score}`}
              type="button"
              role="radio"
              aria-checked={value === score}
              aria-label={`Noter ${score} sur ${max}`}
              disabled={disabled}
              onMouseEnter={() => onHoverChange?.(score)}
              onFocus={() => onHoverChange?.(score)}
              onClick={() => onChange?.(score)}
              className={clsx(
                "inline-flex items-center justify-center rounded-full transition-transform duration-200",
                disabled ? "cursor-not-allowed" : "cursor-pointer hover:scale-[1.08] focus-visible:scale-[1.08]",
              )}
            >
              <StarIcon filled={filled} size={size} />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={clsx("inline-flex items-center", className)}
      style={{ gap }}
    >
      {Array.from({ length: max }).map((_, index) => {
        const fill = Math.max(0, Math.min(1, safeValue - index));
        return <ReadonlyStar key={`readonly-${index}`} fill={fill} size={size} />;
      })}
    </div>
  );
}
