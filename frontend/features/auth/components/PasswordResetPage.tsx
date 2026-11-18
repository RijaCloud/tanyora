"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole } from "lucide-react";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import { getPasswordRequirementResults } from "@/lib/auth/password-policy";

type PasswordResetPageProps = {
  login: string;
  resetKey: string;
};

export function PasswordResetPage({ login, resetKey }: PasswordResetPageProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ruleResults = useMemo(
    () => getPasswordRequirementResults(password),
    [password],
  );
  const isLinkValid = login.trim().length > 0 && resetKey.trim().length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!isLinkValid) {
      setError("Ce lien de réinitialisation est invalide ou incomplet.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Renseignez et confirmez votre nouveau mot de passe.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    const failedRule = ruleResults.find((rule) => !rule.ok);
    if (failedRule) {
      setError(`Mot de passe invalide : ${failedRule.label}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login,
          key: resetKey,
          password,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(getUserFacingErrorMessage(payload?.error, "Impossible de réinitialiser le mot de passe."));
      }

      setSuccess(payload?.message || "Votre mot de passe a été réinitialisé avec succès.");
      window.setTimeout(() => {
        router.push("/login?passwordReset=success");
      }, 1200);
    } catch (submitError) {
      setError(getUserFacingErrorMessage(submitError, "Impossible de réinitialiser le mot de passe."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="ui-page px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="rounded-[36px] bg-[radial-gradient(circle_at_top_left,_rgba(214,31,38,0.18),_transparent_38%),linear-gradient(135deg,_#ffffff,_#f2f2f2)] p-8 dark:bg-[radial-gradient(circle_at_top_left,_rgba(234,40,40,0.2),_transparent_38%),linear-gradient(135deg,var(--surface-2),var(--page-bg))] md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#27624f]">Sécurité</p>
          <h1 className="mt-4 max-w-[12ch] text-4xl font-semibold leading-tight text-[#111111] dark:text-white md:text-5xl">
            Définissez un nouveau mot de passe
          </h1>
          <p className="mt-5 max-w-[54ch] text-sm leading-7 text-[#575757] dark:text-[#c8c8c8]">
            Choisissez un mot de passe solide pour continuer à utiliser votre compte Tanyora sans revenir sur l'interface WordPress.
          </p>

          <div className="mt-8 rounded-[24px] border border-[#E5E7EB] bg-white/90 p-5 dark:border-[#343434] dark:bg-[#1d1d1d]/85">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#27624f]/10 text-[#27624f]">
                <KeyRound className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111111] dark:text-white">Lien de réinitialisation</p>
                <p className="text-xs text-[#6b7280] dark:text-[#b5b5b5]">
                  {isLinkValid ? `Compte : ${login}` : "Ce lien semble invalide."}
                </p>
              </div>
            </div>
          </div>

          {!isLinkValid ? (
            <div className="mt-5 rounded-[24px] border border-[#27624f]/20 bg-[#fff5f5] p-5 text-sm leading-6 text-[#8a1c23] dark:bg-[#311517] dark:text-[#ffd2d6]">
              Ce lien de réinitialisation est invalide, incomplet ou expiré. Retournez à la connexion pour demander un
              nouvel email de réinitialisation.
            </div>
          ) : null}
        </section>

        <section className="ui-card rounded-[32px] p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-[#111111] dark:text-white">Nouveau mot de passe</h2>
            <p className="mt-3 text-sm leading-6 text-[#5f5f5f] dark:text-[#c8c8c8]">
              Votre nouveau mot de passe doit respecter les exigences de sécurité de la plateforme.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8A8A8A]">Mot de passe</span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#8A8A8A]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Votre nouveau mot de passe"
                  className="w-full rounded-2xl border-2 border-[#E5E7EB] bg-white px-12 py-3 text-sm text-[#111111] outline-none transition-all duration-200 placeholder:text-[#8A8A8A] focus:border-[#27624f] dark:border-[#3a3a3a] dark:bg-[#262626] dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A8A8A] transition hover:text-[#27624f]"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8A8A8A]">Confirmation</span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#8A8A8A]" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirmez votre mot de passe"
                  className="w-full rounded-2xl border-2 border-[#E5E7EB] bg-white px-12 py-3 text-sm text-[#111111] outline-none transition-all duration-200 placeholder:text-[#8A8A8A] focus:border-[#27624f] dark:border-[#3a3a3a] dark:bg-[#262626] dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A8A8A] transition hover:text-[#27624f]"
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>

            <div className="rounded-[24px] border border-[#E5E7EB] bg-[#fafafa] p-4 dark:border-[#343434] dark:bg-[#262626]">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#8A8A8A]">Exigences</p>
              <div className="grid gap-2">
                {ruleResults.map((rule) => (
                  <div key={rule.key} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className={`size-4 ${rule.ok ? "text-[#27624f]" : "text-[#B5B5B5] dark:text-[#666666]"}`} />
                    <span className={rule.ok ? "text-[#111111] dark:text-white" : "text-[#6B7280] dark:text-[#C8C8C8]"}>
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-[#27624f]/20 bg-[#fff5f5] px-4 py-3 text-sm text-[#B42318] dark:bg-[#3a1717] dark:text-[#ffb4b4]">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-2xl border border-[#27624f]/20 bg-[#fff7f7] px-4 py-3 text-sm text-[#7a1a1f] dark:bg-[#311517] dark:text-[#ffd2d6]">
                {success}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || !isLinkValid}
              className="w-full rounded-2xl bg-[#27624f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#b81b21] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Réinitialisation..." : "Mettre à jour mon mot de passe"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#5f5f5f] dark:text-[#c8c8c8]">
            <Link className="font-medium text-[#27624f] hover:underline" href="/login">
              Retour à la connexion
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
