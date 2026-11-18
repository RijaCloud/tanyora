"use client";

import { PublicUnavailableState } from "@/components/errors/PublicUnavailableState";

export default function GlobalErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body className="ui-page prototype-app min-h-screen bg-[var(--page-bg)] px-4 py-10 sm:px-6 lg:px-8">
        <main className="mx-auto flex min-h-[70vh] w-full max-w-[760px] items-center">
          <PublicUnavailableState
            title="Tanyora est temporairement indisponible"
            description="Nous rencontrons un problème technique global. Réessayez dans quelques instants."
            onRetry={reset}
          />
        </main>
      </body>
    </html>
  );
}
