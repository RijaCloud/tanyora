import { SubmissionForm } from "@/features/submissions/components/SubmissionForm";
import { getWordPressPricingCatalog } from "@/lib/api/wordpress-internal";
import { getServerSession } from "@/lib/auth/session";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { buildArticlePricingInfo } from "@/lib/pricing/feature-pricing";

export default async function SubmitArticlePage() {
  requireAuthenticatedUser(getServerSession(), { returnTo: "/actualites/soumettre" });
  let pricingInfo = buildArticlePricingInfo(null);

  try {
    pricingInfo = buildArticlePricingInfo(await getWordPressPricingCatalog());
  } catch {
    pricingInfo = buildArticlePricingInfo(null);
  }

  return (
    <main className="mx-auto max-w-[980px] px-4 py-10 md:px-6">
      <SubmissionForm
        kind="article"
        title="Soumettre un article"
        description="L'article est envoyé comme contenu éditorial en attente de validation. Il sera relu, corrigé si besoin, puis validé par l'administration."
        pricingInfo={pricingInfo}
      />
    </main>
  );
}
