import { buildMetadata, toPlainText } from "@/app/metadata";
import { getWordPressPrivacyPolicy } from "@/lib/api/wordpress-internal";

export const revalidate = 300;

export async function generateMetadata() {
  const policy = await getWordPressPrivacyPolicy().catch(() => null);
  const title = policy?.title || "Politique de confidentialité";
  const description = toPlainText(policy?.contentHtml, 160) || "Découvrez comment Tanyora protège et utilise vos données personnelles.";

  return buildMetadata(title, description, { path: "/politique-de-confidentialite" });
}

export default async function PrivacyPolicyPage() {
  const policy = await getWordPressPrivacyPolicy().catch(() => null);

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 lg:py-16">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--brand-red)]">Informations légales</p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[var(--text-main)] sm:text-4xl">
        {policy?.title || "Politique de confidentialité"}
      </h1>
      {policy?.modifiedAt ? (
        <p className="mt-3 text-sm text-[var(--text-soft)]">
          Dernière mise à jour : {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(policy.modifiedAt))}
        </p>
      ) : null}

      {policy?.configured && policy.contentHtml ? (
        <article
          className="legal-content mt-9 rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-1)] px-5 py-7 text-[15px] leading-7 text-[var(--text-main)] shadow-[0_12px_42px_rgba(35,17,17,0.05)] sm:px-9 sm:py-10"
          dangerouslySetInnerHTML={{ __html: policy.contentHtml }}
        />
      ) : (
        <section className="mt-9 rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-1)] p-7 text-[var(--text-soft)]">
          La politique de confidentialité est en cours de publication.
        </section>
      )}
    </main>
  );
}
