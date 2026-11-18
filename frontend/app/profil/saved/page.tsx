import { buildMetadata } from "@/app/metadata";
import { ProfileSavedPage } from "@/features/profile/components/ProfileSavedPage";
import { getServerSession } from "@/lib/auth/session";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { getSavedItems } from "@/lib/saved-items/store";

export const metadata = buildMetadata("Enregistrements", "Retrouvez vos contenus enregistres par categorie.");

export const dynamic = "force-dynamic";

export default async function ProfilSavedPageRoute() {
  const session = requireAuthenticatedUser(getServerSession(), { returnTo: "/profil/saved" });
  const userKey = String(session.wpUserId || session.email || "").trim();
  const items = userKey ? await getSavedItems(userKey) : [];

  return <ProfileSavedPage initialItems={items} />;
}
