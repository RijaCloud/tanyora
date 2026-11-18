import { permanentRedirect } from "next/navigation";

export default async function LegacyNewsCategoryPage({ params }: { params: { slug: string } }) {
  permanentRedirect(`/category/${params.slug}`);
}
