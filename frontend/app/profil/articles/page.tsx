import { buildMetadata } from "@/app/metadata";
import Link from "next/link";
import { SubmissionForm } from "@/features/submissions/components/SubmissionForm";
import { getWordPressPricingCatalog, getWordPressUserWorkspaceItems, type UserWorkspaceItemsResult } from "@/lib/api/wordpress-internal";
import { getServerSession } from "@/lib/auth/session";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { buildArticlePricingInfo } from "@/lib/pricing/feature-pricing";

export const metadata = buildMetadata("Mes articles", "Soumettez un article et suivez vos contenus depuis votre profil.");

export default async function ProfilArticlesPage() {
  const session = requireAuthenticatedUser(getServerSession(), { returnTo: "/profil/articles" });
  const wpUserId = Number.parseInt(String(session.wpUserId || "0"), 10);
  let pricingInfo = buildArticlePricingInfo(null);
  let articlesList: UserWorkspaceItemsResult = { title: "Mes articles", items: [] };

  try {
    pricingInfo = buildArticlePricingInfo(await getWordPressPricingCatalog());
  } catch {
    pricingInfo = buildArticlePricingInfo(null);
  }

  if (Number.isFinite(wpUserId) && wpUserId > 0) {
    try {
      articlesList = await getWordPressUserWorkspaceItems("article", { wpUserId });
    } catch {
      articlesList = { title: "Mes articles", items: [] };
    }
  }

  return (
    <main className="mx-auto max-w-[1120px] px-4 py-10 md:px-6 md:py-14">
      <div className="space-y-8">
        <SubmissionForm
          kind="article"
          title="Soumettre un article"
          description="Votre article sera ajouté comme contenu éditorial en attente de validation. La rédaction ou les administrateurs pourront le relire, l'ajuster puis le publier dans les actualités."
          returnHref="/profil"
          returnLabel="Retour au profil"
          pricingInfo={pricingInfo}
        />

        <section className="rounded-[28px] border border-[#EAEAEA] bg-white p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#27624f]">Gestion</p>
              <h2 className="mt-3 text-2xl font-semibold text-[#111]">{articlesList.title || "Mes articles"}</h2>
              <p className="mt-2 text-sm leading-6 text-[#666]">Retrouvez vos articles publiés et activez leur mise en avant quand vous le souhaitez.</p>
            </div>
          </div>

          {articlesList.items.length === 0 ? (
            <div className="mt-6 rounded-[22px] border border-dashed border-[#D9D9D9] bg-[#fafafa] px-5 py-6 text-sm text-[#666]">
              Vous n&apos;avez pas encore d&apos;article dans votre espace.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {articlesList.items.map((item) => {
                const canBoost = item.paymentStatus === "paid" && item.postStatus === "publish" && !item.isExpired;
                const canPay = item.paymentStatus !== "paid" || item.isExpired;
                const checkoutLabel = item.isExpired ? "Renouveler la visibilité" : "Payer maintenant";

                return (
                  <article key={item.id} className="rounded-[22px] border border-[#EAEAEA] bg-[#fcfcfc] p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#8a8a8a]">{item.meta}</p>
                    <h3 className="mt-3 text-xl font-semibold text-[#111]">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#666]">{item.description}</p>
                    {item.expiresAt ? (
                      <p className="mt-3 text-xs text-[#666]">Expiration: {new Date(item.expiresAt).toLocaleDateString("fr-FR")}</p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {canPay ? (
                        <Link
                          href={`/checkout/listing?listingId=${encodeURIComponent(item.id)}&kind=article&action=post&returnTo=${encodeURIComponent("/profil/articles")}`}
                          className="inline-flex items-center justify-center rounded-2xl bg-[#27624f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b6191f]"
                        >
                          {checkoutLabel}
                        </Link>
                      ) : null}
                      {canBoost ? (
                        <Link
                          href={`/checkout/listing?listingId=${encodeURIComponent(item.id)}&kind=article&action=boost&returnTo=${encodeURIComponent("/profil/articles")}`}
                          className="inline-flex items-center justify-center rounded-2xl border border-[#111] px-4 py-2 text-sm font-semibold text-[#111] transition hover:border-[#27624f] hover:text-[#27624f]"
                        >
                          {item.featured ? "Prolonger le boost" : "Booster 7 jours"}
                        </Link>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
