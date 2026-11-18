import Link from "next/link";

export default function NotFound() {
  return (
    <main className="ui-page-soft min-h-[calc(100vh-160px)] px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto grid max-w-[1320px] gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <section className="rounded-[32px] bg-[linear-gradient(135deg,#111111,#2b2b2b)] p-8 text-white dark:bg-[linear-gradient(135deg,var(--surface-2),var(--page-bg))] md:p-10">
          <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#ffb6b8]">
            Erreur 404
          </p>
          <p className="mt-6 text-7xl font-black leading-none tracking-[-0.08em] text-white md:text-8xl">404</p>
          <h1 className="mt-4 max-w-[9ch] text-4xl font-semibold tracking-[-0.04em] md:text-5xl">Page introuvable</h1>
          <p className="mt-4 max-w-[34ch] text-sm leading-6 text-white/78 md:text-base">
            Cette page n&apos;existe pas ou n&apos;est plus disponible.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Retour rapide</p>
              <p className="mt-2 text-sm leading-6 text-white/70">Accueil, actualités et annuaire restent accessibles.</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Vérification</p>
              <p className="mt-2 text-sm leading-6 text-white/70">Vérifiez simplement l&apos;adresse saisie.</p>
            </div>
          </div>
        </section>

        <section className="ui-card rounded-[32px] p-8 md:p-10">
          <div className="ui-surface-soft ui-border rounded-[28px] border p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#27624f]">Navigation rapide</p>
            <h2 className="ui-text-main mt-3 text-3xl font-semibold tracking-[-0.03em]">Choisissez votre prochain accès</h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Link href="/" className="ui-surface ui-border ui-text-main rounded-[24px] border p-5 transition hover:border-[#27624f] hover:shadow-[0_14px_32px_rgba(17,17,17,0.06)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#27624f]">Accueil</p>
                <p className="mt-3 text-xl font-semibold">Revenir à l&apos;accueil</p>
              </Link>

              <Link href="/actualites" className="ui-surface ui-border ui-text-main rounded-[24px] border p-5 transition hover:border-[#27624f] hover:shadow-[0_14px_32px_rgba(17,17,17,0.06)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#27624f]">Actualités</p>
                <p className="mt-3 text-xl font-semibold">Explorer les articles</p>
              </Link>

              <Link href="/profil" className="ui-surface ui-border ui-text-main rounded-[24px] border p-5 transition hover:border-[#27624f] hover:shadow-[0_14px_32px_rgba(17,17,17,0.06)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#27624f]">Profil</p>
                <p className="mt-3 text-xl font-semibold">Ouvrir votre espace</p>
              </Link>

              <Link href="/annuaire" className="ui-surface ui-border ui-text-main rounded-[24px] border p-5 transition hover:border-[#27624f] hover:shadow-[0_14px_32px_rgba(17,17,17,0.06)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#27624f]">Annuaire</p>
                <p className="mt-3 text-xl font-semibold">Parcourir les services</p>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
