"use client";

import { PublicUnavailableState } from "@/components/errors/PublicUnavailableState";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="ui-page-soft flex min-h-[55vh] w-full items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[760px]">
        <PublicUnavailableState
          title="Une page rencontre un problème"
          description="Le reste de Tanyora reste disponible. Réessayez cette page ou revenez à l'accueil."
          onRetry={reset}
        />
      </div>
    </main>
  );
}
