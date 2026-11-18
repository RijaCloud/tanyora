import { FeatureWorkspacePage } from "@/features/profile/components/FeatureWorkspacePage";
import {
  getWordPressPublishingAccessStatus,
  getWordPressLocationTerms,
  getWordPressPricingCatalog,
  getWordPressTaxonomyTerms,
  getWordPressUserWorkspaceItems,
} from "@/lib/api/wordpress-internal";
import type { PublishingAccessStatusResult, TaxonomyTermResult, UserWorkspaceItemsResult } from "@/lib/api/wordpress-internal";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { getServerSession } from "@/lib/auth/session";
import { buildClassifiedPricingInfo } from "@/lib/pricing/feature-pricing";

const CLASSIFIEDS_WORKSPACE_CONFIG = {
  eyebrow: "Mes annonces",
  title: "Gérer vos petites annonces",
  description:
    "Publiez rapidement vos annonces, suivez les prises de contact et gardez un espace propre pour vos offres actives.",
  primaryButtonLabel: "Créer une annonce",
  imageFallbackSrc: "/image-placeholder.png",
  dataEndpoint: "/api/profile/workspace/classifieds",
};

export default async function ProfilPetitesAnnoncesPage() {
  const session = requireAuthenticatedUser(getServerSession(), { returnTo: "/profil/petites-annonces" });
  const wpUserId = Number.parseInt(String(session.wpUserId || "0"), 10);

  let classifiedsList: UserWorkspaceItemsResult = { title: "Mes annonces", items: [] };
  let categoryOptions = ["Immobilier", "Voitures", "Services"];
  let classifiedTaxonomyTerms: TaxonomyTermResult[] = [];
  let classifiedLocationTerms: TaxonomyTermResult[] = [];
  let pricingInfo = buildClassifiedPricingInfo(null);
  let publishingAccessStatus: PublishingAccessStatusResult | null = null;

  const [workspaceResult, taxonomyResult, locationResult, pricingResult, accessStatusResult] = await Promise.allSettled([
    Number.isFinite(wpUserId) && wpUserId > 0
      ? getWordPressUserWorkspaceItems("classified", { wpUserId })
      : Promise.resolve<UserWorkspaceItemsResult>({ title: "Mes annonces", items: [] }),
    getWordPressTaxonomyTerms("classified"),
    getWordPressLocationTerms("classified"),
    getWordPressPricingCatalog(),
    Number.isFinite(wpUserId) && wpUserId > 0
      ? getWordPressPublishingAccessStatus({ wpUserId })
      : Promise.resolve<PublishingAccessStatusResult | null>(null),
  ]);

  if (workspaceResult.status === "fulfilled") {
    classifiedsList = workspaceResult.value;
  }

  if (taxonomyResult.status === "fulfilled") {
    const taxonomy = taxonomyResult.value;
    if (Array.isArray(taxonomy.terms) && taxonomy.terms.length > 0) {
      classifiedTaxonomyTerms = taxonomy.terms;
      categoryOptions = taxonomy.terms.filter((term) => !term.parentId && !term.parentName).map((term) => term.name);
    }
  }

  if (locationResult.status === "fulfilled" && Array.isArray(locationResult.value.terms)) {
    classifiedLocationTerms = locationResult.value.terms;
  }

  if (pricingResult.status === "fulfilled") {
    pricingInfo = buildClassifiedPricingInfo(pricingResult.value);
  }

  if (accessStatusResult.status === "fulfilled") {
    publishingAccessStatus = accessStatusResult.value;
  }

  const fields = [
    {
      id: "category",
      label: "Catégorie",
      placeholder: "Choisir une catégorie",
      type: "select" as const,
      options: categoryOptions,
      required: true,
    },
    {
      id: "type",
      label: "Type",
      placeholder: "Choisir un type",
      type: "select" as const,
      options: [],
    },
    { id: "title", label: "Titre de l'annonce", placeholder: "Titre de l'annonce", required: true },
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
    { id: "price", label: "Prix", placeholder: "Ex: 850000", type: "number" as const, required: true },
    {
      id: "currency",
      label: "Devise",
      placeholder: "Choisir une devise",
      type: "select" as const,
      options: ["MGA", "EUR", "USD"],
      required: true,
    },
    { id: "phone", label: "Téléphone", placeholder: "+261 34 00 000 00", type: "tel" as const, required: true },
    {
      id: "condition",
      label: "Condition",
      placeholder: "Choisir une condition",
      type: "select" as const,
      options: ["Neuf", "Comme neuf", "Bon état", "État correct", "À rénover"],
    },
    {
      id: "productTag",
      label: "Tag produit",
      placeholder: "Choisir un tag produit",
      type: "select" as const,
      options: [],
    },
    {
      id: "images",
      label: "Photos",
      placeholder: `Ajoutez jusqu'à ${publishingAccessStatus?.classifieds.maxPhotos ?? 4} photos de l'annonce`,
      type: "image-gallery" as const,
    },
    { id: "description", label: "Description", placeholder: "Description...", type: "textarea" as const, required: true },
  ];

  return (
    <FeatureWorkspacePage
      eyebrow={CLASSIFIEDS_WORKSPACE_CONFIG.eyebrow}
      title={CLASSIFIEDS_WORKSPACE_CONFIG.title}
      description={CLASSIFIEDS_WORKSPACE_CONFIG.description}
      tabs={[
        { id: "classifieds", label: "Petites annonces" },
        { id: "contacts", label: "Contacts recus" },
      ]}
      defaultTabId="classifieds"
      primaryButtonLabel={CLASSIFIEDS_WORKSPACE_CONFIG.primaryButtonLabel}
      imageFallbackSrc={CLASSIFIEDS_WORKSPACE_CONFIG.imageFallbackSrc}
      fields={fields}
      dataEndpoint={CLASSIFIEDS_WORKSPACE_CONFIG.dataEndpoint}
      createEndpoint="/api/submissions/classified"
      updateEndpoint="/api/submissions/classified"
      deleteEndpoint="/api/submissions/classified"
      statusEndpoint="/api/submissions/classified"
      detailBasePath="/profil/petites-annonces"
      pricingInfo={pricingInfo}
      publishingAccessStatus={publishingAccessStatus}
      emailVerificationRequired={session.emailVerified === false}
      taxonomyTerms={classifiedTaxonomyTerms}
      locationTerms={classifiedLocationTerms}
      checkoutKind="classified"
      lists={{
        classifieds: {
          title: classifiedsList.title || "Mes annonces",
          items: classifiedsList.items || [],
        },
        contacts: {
          title: "Demandes reçues",
          items: [],
        },
      }}
    />
  );
}
