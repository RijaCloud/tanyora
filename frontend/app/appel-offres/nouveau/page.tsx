import { SubmissionForm } from "@/features/submissions/components/SubmissionForm";
import { getWordPressPricingCatalog } from "@/lib/api/wordpress-internal";
import { hasActiveBusinessAccess } from "@/lib/auth/business-access";
import { getServerSession } from "@/lib/auth/session";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { buildTenderPricingInfo } from "@/lib/pricing/feature-pricing";
import { redirect } from "next/navigation";

export default async function NewTenderPage() {
  const session = requireAuthenticatedUser(getServerSession(), { returnTo: "/appel-offres/nouveau" });
  if (!(await hasActiveBusinessAccess(session))) {
    redirect("/tarifs");
  }

  let pricingInfo = buildTenderPricingInfo(null);

  try {
    pricingInfo = buildTenderPricingInfo(await getWordPressPricingCatalog());
  } catch {
    pricingInfo = buildTenderPricingInfo(null);
  }

  return (
    <main className="mx-auto max-w-[980px] px-4 py-10 md:px-6">
      <SubmissionForm
        kind="tender"
        title="Créer un appel d'offre"
        description="La soumission sera créée dans votre espace d'administration sous forme d'appel d'offre en attente de validation."
        includeBusinessFields
        pricingInfo={pricingInfo}
      />
    </main>
  );
}
