import { FeatureWorkspacePageSkeleton } from "@/features/profile/components/FeatureWorkspacePageSkeleton";

export default function Loading() {
  return (
    <FeatureWorkspacePageSkeleton
      eyebrow="Mes annonces"
      titleWidthClassName="w-72"
      descriptionLines={2}
      tabCount={2}
      fieldCount={8}
      cardCount={3}
    />
  );
}
