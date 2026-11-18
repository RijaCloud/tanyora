import { buildMetadata } from "@/app/metadata";
import { ProfileSettingsPage } from "@/features/profile/components/ProfileSettingsPage";
import { buildPricingPlans } from "@/features/subscriptions/plan-catalog";
import { getWordPressLocationTerms, getWordPressTaxonomyTerms, getWordPressUserProfile } from "@/lib/api/wordpress-internal";
import { getServerSession } from "@/lib/auth/session";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { subscriptionProvider } from "@/lib/billing/subscription-provider";

export const metadata = buildMetadata("Mes informations", "Mettez a jour vos informations personnelles et vos reseaux sociaux.");

export default async function EditProfilePage() {
  const session = requireAuthenticatedUser(getServerSession(), { returnTo: "/profil/modifier" });
  const [profileResult, subscriptionResult, directoryCategoriesResult, directoryLocationsResult] = await Promise.allSettled([
    getWordPressUserProfile({ wpUserId: session.wpUserId }),
    subscriptionProvider.getCurrentSubscription(String(session.wpUserId)),
    getWordPressTaxonomyTerms("directory"),
    getWordPressLocationTerms("directory"),
  ]);

  const profile =
    profileResult.status === "fulfilled"
      ? profileResult.value
      : {
          wpUserId: Number(session.wpUserId || 0),
          email: session.email,
          displayName: session.name,
          username: session.username || "",
          firstName: session.firstName || "",
          lastName: session.lastName || "",
          phone: "",
          birthDate: "",
          address: "",
          businessActivityCategory: "",
          businessRegions: [],
          businessCities: [],
          directoryVisibilityEnabled: true,
          profilePhoto: session.picture || "",
          socialLinks: {},
          notificationEmailsEnabled: true,
        };
  const subscription =
    subscriptionResult.status === "fulfilled"
      ? subscriptionResult.value
      : await subscriptionProvider.getCurrentSubscription("0");

  const mergedProfile = {
    ...profile,
    username: profile.username || session.username,
    firstName: profile.firstName || session.firstName || "",
    lastName: profile.lastName || session.lastName || "",
    profilePhoto: profile.profilePhoto || session.picture || "",
  };

  const effectivePlanId = subscription.status === "none" ? session.planId || "free" : subscription.planId;
  const currentPlan = buildPricingPlans().find((plan) => plan.id === effectivePlanId);
  const businessActivityOptions = Array.from(
    new Set(
      [
        ...(directoryCategoriesResult.status === "fulfilled"
          ? directoryCategoriesResult.value.terms
              .filter((term) => !term.parentId && !term.parentName)
              .map((term) => term.name)
              .filter(Boolean)
          : []),
        mergedProfile.businessActivityCategory || "",
      ].filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right, "fr", { sensitivity: "base" }));

  const directoryLocationTerms =
    directoryLocationsResult.status === "fulfilled" ? directoryLocationsResult.value.terms : [];

  const savedRegions = Array.isArray(mergedProfile.businessRegions) ? mergedProfile.businessRegions : [];
  const savedCities = Array.isArray(mergedProfile.businessCities) ? mergedProfile.businessCities : [];

  const regionOptions = Array.from(
    new Set(
      [
        ...directoryLocationTerms
          .filter((term) => !term.parentId && !term.parentName)
          .map((term) => term.name)
          .filter(Boolean),
        ...savedRegions,
      ].filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right, "fr", { sensitivity: "base" }));

  const cityOptionsByRegion = Object.fromEntries(
    regionOptions.map((region) => {
      const cities = Array.from(
        new Set(
          [
            ...directoryLocationTerms
              .filter((term) => (term.parentName || "").trim().toLowerCase() === region.trim().toLowerCase())
              .map((term) => term.name)
              .filter(Boolean),
            ...savedCities.filter((city) =>
              directoryLocationTerms.some(
                (term) =>
                  term.name.trim().toLowerCase() === city.trim().toLowerCase() &&
                  (term.parentName || "").trim().toLowerCase() === region.trim().toLowerCase(),
              ),
            ),
          ].filter(Boolean),
        ),
      ).sort((left, right) => left.localeCompare(right, "fr", { sensitivity: "base" }));

      return [region, cities];
    }),
  );

  return (
    <ProfileSettingsPage
      profile={mergedProfile}
      planLabel={currentPlan?.label || "Free"}
      planDescription={currentPlan?.description || ""}
      businessActivityOptions={businessActivityOptions}
      regionOptions={regionOptions}
      cityOptionsByRegion={cityOptionsByRegion}
    />
  );
}
