"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type PublicListQuickCreateButtonProps = {
  href: string;
  label: string;
  dropdownMode?: boolean;
};

const classifiedsQuickActions = [
  { href: "/profil/petites-annonces", label: "Mes petites annonces" },
  { href: "/profil/offres-emploi", label: "Mes offres d'emploi" },
];

export default function PublicListQuickCreateButton({
  href,
  label,
  dropdownMode = false,
}: PublicListQuickCreateButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!dropdownMode) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current) {
        return;
      }

      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [dropdownMode]);

  if (!dropdownMode) {
    return (
      <a
        href={href}
        className="ui-motion-colors inline-flex min-h-[38px] w-auto shrink-0 self-start items-center justify-center whitespace-nowrap rounded-full bg-[var(--color-purple)] px-5 py-2 text-[12px] font-semibold leading-none text-[var(--color-dark)] transition hover:brightness-95"
      >
        {label}
      </a>
    );
  }

  return (
    <div ref={wrapperRef} className="relative inline-flex shrink-0 self-start">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="ui-motion-colors inline-flex min-h-[38px] w-auto items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[var(--color-purple)] px-5 py-2 text-[12px] font-semibold leading-none text-[var(--color-dark)] transition hover:brightness-95"
      >
        <span>{label}</span>
        <svg
          className={`ui-motion-transform h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 12 12"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
        </svg>
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute left-0 top-[calc(100%+8px)] z-30 min-w-[220px] overflow-hidden rounded-[18px] border border-black/10 bg-white p-2 shadow-[0_16px_40px_rgba(0,0,0,0.16)] animate-in fade-in-0 zoom-in-95 duration-300 dark:border-white/10 dark:bg-[#202124]"
        >
          {classifiedsQuickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="ui-motion-colors flex items-center rounded-[12px] px-3 py-2.5 text-[12px] font-medium text-[#171717] transition hover:bg-[#f3f4f6] dark:text-white dark:hover:bg-white/5"
            >
              <span>{action.label}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
