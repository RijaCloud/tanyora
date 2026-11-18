"use client";

import { usePathname } from "next/navigation";
import { FeatureWorkspacePageSkeleton } from "@/features/profile/components/FeatureWorkspacePageSkeleton";
import { ProfilePageSkeleton } from "@/features/profile/components/ProfilePageSkeleton";

export default function Loading() {
  const pathname = usePathname() || "";

  if (pathname.startsWith("/profil/petites-annonces")) {
    return <FeatureWorkspacePageSkeleton eyebrow="Mes annonces" titleWidthClassName="w-72" descriptionLines={2} tabCount={2} fieldCount={8} cardCount={3} />;
  }

  if (pathname.startsWith("/profil/offres-emploi")) {
    return <FeatureWorkspacePageSkeleton eyebrow="Espace emploi" titleWidthClassName="w-80" descriptionLines={2} tabCount={2} fieldCount={8} cardCount={3} />;
  }

  if (pathname.startsWith("/profil/appels-offres")) {
    return <FeatureWorkspacePageSkeleton eyebrow="Espace appels d'offres" titleWidthClassName="w-[26rem]" descriptionLines={2} tabCount={2} fieldCount={8} cardCount={3} />;
  }

  return <ProfilePageSkeleton />;
}
