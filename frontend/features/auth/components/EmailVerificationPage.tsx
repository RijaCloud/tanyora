"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type VerificationStatus = "loading" | "success" | "invalid" | "failed";

type EmailVerificationPageProps = {
  email: string;
  token: string;
};

const statusCopy: Record<VerificationStatus, { eyebrow: string; title: string; description: string }> = {
  loading: {
    eyebrow: "Vérification en cours",
    title: "Confirmation de votre email",
    description: "Nous validons votre adresse email. Merci de patienter quelques instants.",
  },
  success: {
    eyebrow: "Email confirmé",
    title: "Votre adresse email est confirmée",
    description: "Votre compte Tanyora est maintenant confirmé. Vous pouvez continuer votre navigation.",
  },
  invalid: {
    eyebrow: "Lien invalide",
    title: "Ce lien de vérification est incomplet",
    description: "Le lien utilisé ne contient pas les informations nécessaires. Demandez un nouvel email de vérification.",
  },
  failed: {
    eyebrow: "Vérification impossible",
    title: "Ce lien est invalide ou expiré",
    description: "Demandez un nouvel email de vérification depuis votre espace de connexion pour recevoir un lien à jour.",
  },
};

export function EmailVerificationPage({ email, token }: EmailVerificationPageProps) {
  const router = useRouter();
  const [status, setStatus] = useState<VerificationStatus>(() => (email && token ? "loading" : "invalid"));

  useEffect(() => {
    if (!email || !token) {
      setStatus("invalid");
      return;
    }

    const controller = new AbortController();

    async function confirmEmail() {
      try {
        const response = await fetch("/api/auth/email-verification/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, token }),
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.ok) {
          window.localStorage.setItem("2424-auth-refresh", String(Date.now()));
          window.dispatchEvent(new CustomEvent("2424-auth-refresh"));
          router.refresh();
          setStatus("success");
          return;
        }

        setStatus("failed");
      } catch (error) {
        if (!controller.signal.aborted) {
          setStatus("failed");
        }
      }
    }

    confirmEmail();

    return () => controller.abort();
  }, [email, token]);

  const copy = statusCopy[status];
  const isLoading = status === "loading";
  const loginHref = useMemo(() => {
    if (status === "success") {
      return "/login?verification=success";
    }
    if (status === "failed") {
      return "/login?verification=failed";
    }
    return "/login";
  }, [status]);

  return (
    <main className="ui-page min-h-screen px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[560px] items-center justify-center">
        <section className="ui-card w-full rounded-[28px] px-6 py-8 text-center sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#27624f]">{copy.eyebrow}</p>
          <h1 className="ui-text-main mt-4 text-3xl font-semibold tracking-[-0.03em]">{copy.title}</h1>
          <p className="ui-text-muted mx-auto mt-4 max-w-[44ch] text-sm leading-7">{copy.description}</p>

          {email ? (
            <div className="ui-surface-soft ui-border ui-text-main mt-6 rounded-2xl border px-4 py-4 text-sm">
              <span className="ui-text-muted block text-xs uppercase tracking-[0.18em]">Adresse concernée</span>
              <span className="mt-2 block break-all font-medium">{email}</span>
            </div>
          ) : null}

          {isLoading ? (
            <div className="mx-auto mt-8 h-10 w-10 animate-spin rounded-full border-2 border-[#F3C8CC] border-t-[#27624f]" aria-label="Vérification en cours" />
          ) : (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={loginHref}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-2xl bg-[#111111] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Retour à la connexion
              </Link>
              <Link
                href="/"
                className="ui-text-main ui-border-strong inline-flex min-h-[48px] flex-1 items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition hover:border-[#27624f] hover:text-[#27624f]"
              >
                Accueil
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
