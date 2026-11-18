import { buildMetadata } from "@/app/metadata";
import Link from "next/link";
import WebRadioPage from "@/features/prototype/pages/WebRadioPage";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/config/revalidate";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;
export const metadata = buildMetadata("Web radio", "Ecoutez la radio et suivez la programmation.");
const RADIO_TEMPORARILY_UNAVAILABLE = true;

export default function Page() {
  if (RADIO_TEMPORARILY_UNAVAILABLE) {
    return (
      <main className="ui-page mx-auto w-full max-w-[1120px] px-4 py-12 md:px-6 md:py-16">
        <section className="ui-card rounded-[28px] p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#27624f]">Information</p>
          <h1 className="ui-text-main mt-4 text-3xl font-semibold md:text-4xl">Web radio indisponible pour le moment</h1>
          <p className="ui-text-muted mt-4 max-w-[62ch] text-sm leading-7">
            Cette section est en preparation. Merci de revenir bientot pour profiter de la version finale.
          </p>
          <div className="mt-8">
            <Link
              href="/"
              className="ui-text-main ui-border-strong inline-flex rounded-2xl border px-5 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-[1px] hover:border-[#27624f] hover:outline hover:outline-2 hover:outline-[#27624f] hover:text-[#27624f]"
            >
              Retour a l&apos;accueil
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return <WebRadioPage />;
}
