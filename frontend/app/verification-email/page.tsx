import { buildMetadata } from "@/app/metadata";
import { EmailVerificationPage } from "@/features/auth/components/EmailVerificationPage";

export const metadata = buildMetadata(
  "Vérification email",
  "Confirmez votre adresse email pour activer votre compte Tanyora.",
);

type VerificationEmailRouteProps = {
  searchParams?: {
    email?: string;
    token?: string;
  };
};

export default function VerificationEmailRoute({ searchParams }: VerificationEmailRouteProps) {
  const email = String(searchParams?.email || "").trim().toLowerCase();
  const token = String(searchParams?.token || "").trim();

  return <EmailVerificationPage email={email} token={token} />;
}
