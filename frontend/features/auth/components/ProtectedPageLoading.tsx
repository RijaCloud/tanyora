type ProtectedPageLoadingProps = {
  label: string;
};

/** Keeps protected route transitions informative while the server checks access. */
export function ProtectedPageLoading({ label }: ProtectedPageLoadingProps) {
  return (
    <main className="ui-page flex min-h-[48vh] items-center px-4 py-10 md:px-6 md:py-14">
      <section className="ui-card mx-auto w-full max-w-[560px] rounded-[28px] p-7 text-center md:p-9">
        <span className="mx-auto mb-5 inline-block h-7 w-7 animate-spin rounded-full border-2 border-[#27624f] border-r-transparent" aria-hidden="true" />
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#27624f]">Acces securise</p>
        <h1 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-[var(--text-main)]">Verification de votre acces</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
          Nous preparons {label}. Vous serez redirige vers la connexion si necessaire.
        </p>
      </section>
    </main>
  );
}
