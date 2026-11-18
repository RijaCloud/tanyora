import { notFound } from "next/navigation";
import { buildMetadata, toPlainText } from "@/app/metadata";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/config/revalidate";
import { PublicUnavailableState } from "@/components/errors/PublicUnavailableState";
import { DirectoryDetail } from "@/features/directory/DirectoryDetail";
import { DIRECTORY_DEMO_COMPANIES } from "@/features/directory/demo-fixtures";
import { mapPublicDirectoryCompany } from "@/features/directory/map-public-company";
import { getWordPressPublicListings } from "@/lib/api/wordpress-internal";

export const dynamic = "force-dynamic";
export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

type Params = { id: string };

async function resolveCompany(id: string) {
  if (id.startsWith("demo-")) {
    const company = DIRECTORY_DEMO_COMPANIES.find((item) => item.id === id);
    return company ? { company, demoMode: true } : null;
  }

  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) return null;
  const result = await getWordPressPublicListings("directory", { id: Number(id), perPage: 1 });
  const source = result.items.find((item) => item.id === Number(id));
  return source ? { company: mapPublicDirectoryCompany(source), demoMode: false } : null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const resolved = await resolveCompany(id).catch(() => null);
  if (!resolved) return buildMetadata("Profil introuvable", "Cette fiche n'est pas disponible.", { path: `/annuaire/${encodeURIComponent(id)}`, noIndex: true });
  return buildMetadata(resolved.company.name, toPlainText(resolved.company.description || `Découvrez ${resolved.company.name} dans l'annuaire Tanyora.`), {
    path: `/annuaire/${encodeURIComponent(id)}`,
    image: resolved.company.imageUrl || undefined,
    noIndex: resolved.demoMode,
  });
}

export default async function DirectoryDetailRoute({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  let resolved;
  try {
    resolved = await resolveCompany(id);
  } catch {
    return <PublicUnavailableState title="Cette fiche est temporairement indisponible" description="Réessayez dans quelques instants ou revenez à l'annuaire." backHref="/annuaire" />;
  }
  if (!resolved) notFound();
  return <DirectoryDetail company={resolved.company} demoMode={resolved.demoMode} />;
}
