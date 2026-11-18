import { FeatureWorkspacePageSkeleton } from "@/features/profile/components/FeatureWorkspacePageSkeleton";

export default function Loading() {
  return (
    <FeatureWorkspacePageSkeleton
      eyebrow="Espace emploi"
      titleWidthClassName="w-80"
      descriptionLines={2}
      tabCount={2}
      fieldCount={8}
      cardCount={3}
    />
  );
}
