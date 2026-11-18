import { FeatureWorkspacePage } from "@/features/profile/components/FeatureWorkspacePage";
import {
  getWordPressLocationTerms,
  getWordPressPricingCatalog,
  getWordPressPublishingAccessStatus,
  getWordPressTaxonomyTerms,
  getWordPressUserWorkspaceItems,
  type UserWorkspaceItemsResult,
} from "@/lib/api/wordpress-internal";
import { getServerSession } from "@/lib/auth/session";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { buildTenderPricingInfo } from "@/lib/pricing/feature-pricing";
import { redirect } from "next/navigation";

export default async function ProfilAppelsOffresPage() {
  const session = requireAuthenticatedUser(getServerSession(), { returnTo: "/profil/appels-offres" });
  const publishingAccessStatus = await getWordPressPublishingAccessStatus({ wpUserId: Number(session.wpUserId || 0) }).catch(() => null);
  if (!publishingAccessStatus?.tenders?.canCreateDraft) {
    redirect("/tarifs");
  }

  const wpUserId = Number.parseInt(String(session.wpUserId || "0"), 10);

  let tendersList: UserWorkspaceItemsResult = { title: "Mes appels d'offres", items: [] };
  let categoryOptions = ["Construction", "Informatique", "Services"];
  let locationOptions = [
    "Antananarive",
    "Antsirabe",
    "Tamatave",
    "Fianarantsoa",
    "Diego",
    "Majunga",
    "Tuléar",
    "Fort Dauphin",
  ];
  let pricingInfo = buildTenderPricingInfo(null);

  const [workspaceResult, taxonomyResult, locationTermsResult, pricingResult] = await Promise.allSettled([
    Number.isFinite(wpUserId) && wpUserId > 0
      ? getWordPressUserWorkspaceItems("tender", { wpUserId })
      : Promise.resolve<UserWorkspaceItemsResult>({ title: "Mes appels d'offres", items: [] }),
    getWordPressTaxonomyTerms("tender"),
    getWordPressLocationTerms("tender"),
    getWordPressPricingCatalog(),
  ]);

  if (workspaceResult.status === "fulfilled") {
    tendersList = workspaceResult.value;
  }

  if (taxonomyResult.status === "fulfilled") {
    const taxonomy = taxonomyResult.value;
    if (Array.isArray(taxonomy.terms) && taxonomy.terms.length > 0) {
      categoryOptions = taxonomy.terms
        .filter((term) => !term.parentId && !term.parentName)
        .map((term) => term.name);
    }
  }

  if (locationTermsResult.status === "fulfilled") {
    const taxonomy = locationTermsResult.value;
    if (Array.isArray(taxonomy.terms) && taxonomy.terms.length > 0) {
      locationOptions = taxonomy.terms.map((term) => term.name);
    }
  }

  if (pricingResult.status === "fulfilled") {
    pricingInfo = buildTenderPricingInfo(pricingResult.value);
  }

  const fields = [
    { id: "title", label: "Intitulé", placeholder: "Intitulé de l'appel d'offre", required: true },
    {
      id: "category",
      label: "Catégorie",
      placeholder: "Choisir une catégorie",
      type: "select" as const,
      options: categoryOptions,
    },
    {
      id: "type",
      label: "Type",
      placeholder: "Choisir un type",
      type: "select" as const,
      options: [],
    },
    { id: "companyName", label: "Organisation", placeholder: "Nom de l'organisation", required: true },
    { id: "phone", label: "Téléphone", placeholder: "+261 34 00 000 00", type: "tel" as const, required: true },
    { id: "budget", label: "Budget", placeholder: "Ex: 120 000 000 Ar" },
    {
      id: "currency",
      label: "Devise",
      placeholder: "Choisir une devise",
      type: "select" as const,
      options: ["MGA", "EUR", "USD"],
      required: true,
    },
    { id: "deadline", label: "Date limite", placeholder: "Date limite", type: "date" as const },
    { id: "detailsPdfUrl", label: "TDR", placeholder: "Ajouter le TDR, cahier des charges ou dossier de consultation", type: "pdf" as const },
    {
      id: "location",
      label: "Lieu",
      placeholder: "Choisir une localisation",
      type: "select" as const,
      options: locationOptions,
      required: true,
    },
    { id: "description", label: "Description du besoin", placeholder: "Description...", type: "textarea" as const, required: true },
  ];

  return (
    <FeatureWorkspacePage
      eyebrow="Espace appels d'offres"
      title="Gérer vos appels d'offres"
      description="Centralisez vos consultations, suivez les réponses reçues et gardez chaque dossier accessible."
      tabs={[
        { id: "tenders", label: "Appels d'offres" },
        { id: "responses", label: "Reponses" },
      ]}
      defaultTabId="tenders"
      primaryButtonLabel="Ajouter un appel d'offre"
      fields={fields}
      taxonomyTerms={taxonomyResult.status === "fulfilled" ? taxonomyResult.value.terms || [] : []}
      dataEndpoint="/api/profile/workspace/tenders"
      createEndpoint="/api/submissions/tender"
      updateEndpoint="/api/submissions/tender"
      deleteEndpoint="/api/submissions/tender"
      statusEndpoint="/api/submissions/tender"
      detailBasePath="/profil/appels-offres"
      pricingInfo={pricingInfo}
      checkoutKind="tender"
      publishingAccessStatus={publishingAccessStatus}
      emailVerificationRequired={session.emailVerified === false}
      lists={{
        tenders: {
          title: tendersList.title || "Mes appels d'offres",
          items: tendersList.items || [],
        },
        responses: {
          title: "Réponses reçues",
          items: [],
        },
      }}
    />
  );
}
