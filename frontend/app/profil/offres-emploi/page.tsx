import { FeatureWorkspacePage } from "@/features/profile/components/FeatureWorkspacePage";
import {
  getWordPressPublishingAccessStatus,
  getWordPressLocationTerms,
  getWordPressPricingCatalog,
  getWordPressTaxonomyTerms,
  getWordPressUserWorkspaceItems,
  type PublishingAccessStatusResult,
  type TaxonomyTermResult,
  type UserWorkspaceItemsResult,
} from "@/lib/api/wordpress-internal";
import { getServerSession } from "@/lib/auth/session";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { buildJobPricingInfo } from "@/lib/pricing/feature-pricing";

export default async function ProfilOffresEmploiPage() {
  const session = requireAuthenticatedUser(getServerSession(), { returnTo: "/profil/offres-emploi" });
  const wpUserId = Number.parseInt(String(session.wpUserId || "0"), 10);

  let jobsList: UserWorkspaceItemsResult = { title: "Mes offres", items: [] };
  let categoryOptions = ["Temps plein", "Temps partiel", "Freelance", "Stage"];
  let locationTerms: TaxonomyTermResult[] = [];
  let pricingInfo = buildJobPricingInfo(null);
  let publishingAccessStatus: PublishingAccessStatusResult | null = null;
  const [workspaceResult, taxonomyResult, locationTermsResult, pricingResult, accessStatusResult] = await Promise.allSettled([
    Number.isFinite(wpUserId) && wpUserId > 0
      ? getWordPressUserWorkspaceItems("job", { wpUserId })
      : Promise.resolve<UserWorkspaceItemsResult>({ title: "Mes offres", items: [] }),
    getWordPressTaxonomyTerms("job"),
    getWordPressLocationTerms("job"),
    getWordPressPricingCatalog(),
    Number.isFinite(wpUserId) && wpUserId > 0
      ? getWordPressPublishingAccessStatus({ wpUserId })
      : Promise.resolve<PublishingAccessStatusResult | null>(null),
  ]);

  if (workspaceResult.status === "fulfilled") {
    jobsList = workspaceResult.value;
  }

  if (taxonomyResult.status === "fulfilled") {
    const taxonomy = taxonomyResult.value;
    if (Array.isArray(taxonomy.terms) && taxonomy.terms.length > 0) {
      categoryOptions = taxonomy.terms
        .filter((term) => !term.parentId && !term.parentName)
        .map((term) => term.name);
    }
  }

  if (locationTermsResult.status === "fulfilled" && Array.isArray(locationTermsResult.value.terms)) {
    locationTerms = locationTermsResult.value.terms;
  }

  if (pricingResult.status === "fulfilled") {
    pricingInfo = buildJobPricingInfo(pricingResult.value);
  }

  if (accessStatusResult.status === "fulfilled") {
    publishingAccessStatus = accessStatusResult.value;
  }

  const fields = [
    { id: "title", label: "Titre du poste", placeholder: "Titre du poste", required: true },
    { id: "companyName", label: "Entreprise", placeholder: "Nom de l'entreprise", required: true },
    {
      id: "category",
      label: "Catégorie",
      placeholder: "Choisir une catégorie",
      type: "select" as const,
      options: categoryOptions,
    },
    {
      id: "city",
      label: "Ville",
      placeholder: "Choisir une ville",
      type: "select" as const,
      options: [],
      required: true,
    },
    {
      id: "area",
      label: "Zone",
      placeholder: "Choisir une zone",
      type: "select" as const,
      options: [],
    },
    {
      id: "skills",
      label: "Compétences",
      placeholder: "Ajouter une compétence",
      type: "tag-input" as const,
      maxSelections: 5,
    },
    {
      id: "experienceYears",
      label: "Années d'expérience",
      placeholder: "Ex : 3 ans",
    },
    { id: "phone", label: "Téléphone", placeholder: "+261 34 00 000 00", type: "tel" as const, required: true },
    { id: "email", label: "Mail", placeholder: "votremail@gmail.com", type: "email" as const, required: true },
    { id: "deadline", label: "Candidatures acceptées jusqu'au", placeholder: "Candidatures acceptées jusqu'au", type: "date" as const },
    { id: "description", label: "Description emploi", placeholder: "Description...", type: "textarea" as const, required: true },
  ];

  return (
    <FeatureWorkspacePage
      eyebrow="Espace emploi"
      title="Gérer vos offres d'emploi"
      description="Créez vos offres, suivez les candidatures et gardez tout votre recrutement dans un espace dédié."
      tabs={[
        { id: "jobs", label: "Offres d'emploi" },
        { id: "candidates", label: "Candidats" },
      ]}
      defaultTabId="jobs"
      primaryButtonLabel="Ajouter une offre d'emploi"
      fields={fields}
      taxonomyTerms={taxonomyResult.status === "fulfilled" ? taxonomyResult.value.terms || [] : []}
      locationTerms={locationTerms}
      dataEndpoint="/api/profile/workspace/jobs"
      createEndpoint="/api/submissions/job"
      updateEndpoint="/api/submissions/job"
      deleteEndpoint="/api/submissions/job"
      statusEndpoint="/api/submissions/job"
      detailBasePath="/profil/offres-emploi"
      pricingInfo={pricingInfo}
      publishingAccessStatus={publishingAccessStatus}
      emailVerificationRequired={session.emailVerified === false}
      checkoutKind="job"
      lists={{
        jobs: {
          title: jobsList.title || "Mes offres",
          items: jobsList.items || [],
        },
        candidates: {
          title: "Candidats reçus",
          items: [],
        },
      }}
    />
  );
}



