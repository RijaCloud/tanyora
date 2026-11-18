import { buildMetadata } from "@/app/metadata";
import { PasswordResetPage } from "@/features/auth/components/PasswordResetPage";

export const metadata = buildMetadata(
  "Réinitialiser le mot de passe",
  "Définissez un nouveau mot de passe pour votre compte Tanyora.",
);

type PasswordResetRouteProps = {
  searchParams?: {
    login?: string;
    key?: string;
  };
};

export default function ReinitialiserMotDePassePage({ searchParams }: PasswordResetRouteProps) {
  const login = String(searchParams?.login || "").trim();
  const resetKey = String(searchParams?.key || "").trim();

  return <PasswordResetPage login={login} resetKey={resetKey} />;
}
