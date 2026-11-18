"use client";

import Link from "next/link";
import { useState } from "react";

type PublicUnavailableStateProps = {
  title?: string;
  description?: string;
  retryLabel?: string;
  retryHref?: string;
  backHref?: string;
  backLabel?: string;
  compact?: boolean;
  onRetry?: () => void;
  className?: string;
};

export function PublicUnavailableState({
  title = "Ce contenu est temporairement indisponible",
  description = "Nos services rencontrent un contretemps. Vous pouvez réessayer dans quelques instants.",
  retryLabel = "Réessayer",
  retryHref = "?retry=1",
  backHref = "/",
  backLabel = "Retour à l'accueil",
  compact = false,
  onRetry,
  className = "",
}: PublicUnavailableStateProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const Heading = compact ? "h2" : "h1";

  const retry = () => {
    setIsRetrying(true);
    onRetry?.();
  };

  return (
    <section
      role="alert"
      className={`ui-card-flat ui-border flex w-full flex-col items-start rounded-[24px] border bg-[var(--surface-1)] ${compact ? "gap-3 p-5" : "gap-5 p-7 sm:p-10"} ${className}`.trim()}
    >
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#27624f]">Tanyora</p>
        <Heading className={`ui-text-main mt-2 font-semibold ${compact ? "text-[18px]" : "text-[28px]"}`}>{title}</Heading>
        <p className={`ui-text-muted mt-2 max-w-[620px] leading-[1.6] ${compact ? "text-[13px]" : "text-[15px]"}`}>{description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {onRetry ? (
          <button
            type="button"
            onClick={retry}
            disabled={isRetrying}
            className="public-unavailable-retry rounded-full bg-[#27624f] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#c91f1f] disabled:cursor-wait disabled:opacity-70"
          >
            {isRetrying ? "Nouvel essai..." : retryLabel}
          </button>
        ) : (
          // Native navigation remains available when the degraded page has not hydrated yet.
          <a
            href={retryHref}
            onClick={(event) => {
              event.preventDefault();
              const retryUrl = new URL(window.location.href);
              retryUrl.searchParams.set("retry", String(Date.now()));
              window.location.assign(retryUrl.toString());
            }}
            className="public-unavailable-retry rounded-full bg-[#27624f] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#c91f1f]"
          >
            {retryLabel}
          </a>
        )}
        <Link href={backHref} className="ui-border ui-text-main rounded-full border px-5 py-2.5 text-[13px] font-semibold transition hover:border-[#27624f] hover:text-[#27624f]">
          {backLabel}
        </Link>
      </div>
    </section>
  );
}
