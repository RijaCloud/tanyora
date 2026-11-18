import { permanentRedirect } from "next/navigation";

export default async function LegacyPluralNewsCategoryPage({ params }: { params: { slug: string[] } }) {
  const normalizedSlug = Array.isArray(params.slug) ? params.slug.join("/") : params.slug;
  permanentRedirect(`/category/${normalizedSlug}`);
}
