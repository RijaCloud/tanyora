import { getPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import HomePage from "@/features/prototype/pages/HomePage";

export const revalidate = 60;
export async function generateMetadata() {
  return getPublicPageMetadata("home", "/");
}

export default function Page() {
  return <HomePage />;
}
