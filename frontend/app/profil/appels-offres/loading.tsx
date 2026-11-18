import { FeatureWorkspacePageSkeleton } from "@/features/profile/components/FeatureWorkspacePageSkeleton";

export default function Loading() {
  return (
    <FeatureWorkspacePageSkeleton
      eyebrow="Espace appels d'offres"
      titleWidthClassName="w-[26rem]"
      descriptionLines={2}
      tabCount={2}
      fieldCount={8}
      cardCount={3}
    />
  );
}
