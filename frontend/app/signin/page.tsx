import { buildMetadata } from "@/app/metadata";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/features/auth/components/AuthPanel";
import { buildOnboardingUrl, isOnboardingRequired } from "@/lib/auth/flow";
import { getServerSession } from "@/lib/auth/session";

export const metadata = buildMetadata("Inscription", "Créez votre compte Tanyora.");

export default function SigninPage() {
  const session = getServerSession();

  if (session) {
    redirect(
      isOnboardingRequired(session)
        ? buildOnboardingUrl("/profil", session.authProvider === "google" ? "google" : "email")
        : "/",
    );
  }

  return (
    <main className="ui-page px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="rounded-[36px] bg-[radial-gradient(circle_at_top_left,_rgba(214,31,38,0.18),_transparent_38%),linear-gradient(135deg,_#ffffff,_#f2f2f2)] p-8 dark:bg-[radial-gradient(circle_at_top_left,_rgba(234,40,40,0.2),_transparent_38%),linear-gradient(135deg,var(--surface-2),var(--page-bg))] md:p-10">
          <h1 className="max-w-[12ch] text-4xl font-semibold leading-tight text-[#111111] dark:text-white md:text-5xl">
            Créez votre accès pour continuer votre onboarding
          </h1>
          <p className="mt-5 max-w-[56ch] text-sm leading-7 text-[#575757] dark:text-[#c8c8c8]">
            Commencez par votre email et mot de passe, puis finalisez votre profil Tanyora en quelques étapes.
          </p>
        </section>

        <div className="flex justify-center lg:justify-end">
          <AuthPanel mode="page" initialView="signup" />
        </div>
      </div>
    </main>
  );
}
