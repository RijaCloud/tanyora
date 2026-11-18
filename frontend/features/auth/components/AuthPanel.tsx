"use client";

import type { ButtonHTMLAttributes, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "@/features/prototype/app/context/AuthContext";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import { getPasswordRequirementResults } from "@/lib/auth/password-policy";
import { trackAuthCompleted, trackAuthOpened } from "@/lib/analytics/ga4";

type AuthPanelProps = {
  mode?: "modal" | "page";
  onClose?: () => void;
  initialView?: "login" | "signup" | "forgot";
  onViewModeChange?: (view: AuthViewMode) => void;
};

type AuthViewMode = "login" | "signup" | "forgot" | "otp";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 18 18">
      <path d="M17.64 9.2045C17.64 8.56632 17.5827 7.95268 17.4764 7.36359H9V10.8454H13.8436C13.635 11.9704 12.9995 12.9232 12.0468 13.5613V15.8204H14.9564C16.6582 14.2531 17.64 11.9459 17.64 9.2045Z" fill="#4285F4" />
      <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8204L12.0468 13.5614C11.2409 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67273 12.8373 3.96409 10.71H0.956818V13.0427C2.43773 15.9832 5.48182 18 9 18Z" fill="#34A853" />
      <path d="M3.96409 10.71C3.78368 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78368 7.83 3.96409 7.29V4.95727H0.956818C0.347727 6.17182 0 7.54545 0 9C0 10.4545 0.347727 11.8282 0.956818 13.0427L3.96409 10.71Z" fill="#FBBC05" />
      <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.889091 11.4259 0 9 0C5.48182 0 2.43773 2.01682 0.956818 4.95727L3.96409 7.29C4.67273 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335" />
    </svg>
  );
}

function AuthButton({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`w-full rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 outline-none focus:outline-none focus:ring-0 ${className || ""}`.trim()}
    >
      {children}
    </button>
  );
}

function formatOtpExpiry(timestamp: number | null) {
  if (!timestamp) return "Valable 15 minutes.";
  return `Valable jusqu'à ${new Date(timestamp).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })}.`;
}

export function AuthPanel({ mode = "page", onClose, initialView = "login", onViewModeChange }: AuthPanelProps) {
  const {
    login,
    verifyLoginOtp,
    resendLoginOtp,
    signupWithEmailPassword,
    loginWithGoogle,
    signupWithGoogle,
  } = useAuth();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<AuthViewMode>(initialView);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isGoogleRedirecting, setIsGoogleRedirecting] = useState(false);
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [isOtpSubmitting, setIsOtpSubmitting] = useState(false);
  const [isOtpResending, setIsOtpResending] = useState(false);
  const [signupMethod, setSignupMethod] = useState<"choice" | "email">("choice");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpChallengeId, setOtpChallengeId] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [otpResendAvailableAt, setOtpResendAvailableAt] = useState<number | null>(null);

  const isSignup = viewMode === "signup";
  const isForgot = viewMode === "forgot";
  const isLogin = viewMode === "login";
  const isOtp = viewMode === "otp";
  const secondaryActionClass =
    "border-2 border-[#E5E7EB] bg-white text-[#111111] transition-all duration-300 hover:border-[#27624f] hover:text-[#27624f] focus:outline-none focus:ring-0 dark:border-[#3a3a3a] dark:bg-[#262626] dark:text-white";
  const passwordChecks = getPasswordRequirementResults(password);
  const isSignupEmailFlow = isSignup && signupMethod === "email";
  const hasPasswordMismatch = isSignupEmailFlow && confirmPassword.length > 0 && password !== confirmPassword;
  const isResendCoolingDown = otpResendAvailableAt !== null && otpResendAvailableAt > Date.now();

  useEffect(() => {
    setViewMode(initialView);
  }, [initialView]);

  useEffect(() => {
    if (viewMode === "signup") {
      setSignupMethod("choice");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      setError("");
      setSuccessMessage("");
    }
  }, [viewMode]);

  useEffect(() => {
    onViewModeChange?.(viewMode);
  }, [onViewModeChange, viewMode]);

  useEffect(() => {
    if (viewMode === "login" || viewMode === "signup" || viewMode === "forgot") {
      trackAuthOpened(viewMode);
    }
  }, [viewMode]);

  useEffect(() => {
    if (searchParams?.get("passwordReset") === "success" && viewMode === "login") {
        setSuccessMessage("Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.");
      setError("");
    }
  }, [searchParams, viewMode]);

  const title = useMemo(() => {
    if (isForgot) {
      return "Réinitialiser votre mot de passe";
    }
    if (isOtp) {
      return "Code de connexion";
    }
    if (isSignup) {
      return mode === "modal" ? "Inscription Tanyora" : "Créez votre compte Tanyora";
    }
    return mode === "modal" ? "Connexion à Tanyora" : "Connectez-vous à votre compte Tanyora";
  }, [isForgot, isOtp, isSignup, mode]);

  const description = useMemo(() => {
    if (isForgot) {
      return "Entrez votre email et nous vous enverrons un lien de réinitialisation.";
    }
    if (isOtp) {
      return "Saisissez le code reçu.";
    }
    if (isSignup) {
      return "Inscrivez-vous avec votre email et votre mot de passe pour commencer sur Tanyora.";
    }
    return "Connectez-vous avec Google ou avec votre email et mot de passe.";
  }, [isForgot, isOtp, isSignup, otpEmail]);

  function resetOtpState(nextView: AuthViewMode = "login") {
    setOtpCode("");
    setOtpChallengeId("");
    setOtpEmail("");
    setOtpExpiresAt(null);
    setOtpResendAvailableAt(null);
    setError("");
    setSuccessMessage("");
    setViewMode(nextView);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (isOtp) {
      if (otpCode.trim().length !== 6 || !otpChallengeId) {
        setError("Entrez le code de connexion à 6 chiffres.");
        return;
      }

      try {
        setIsOtpSubmitting(true);
        await verifyLoginOtp(otpChallengeId, otpCode);
        trackAuthCompleted("login", "email_otp");
        onClose?.();
      } catch (submitError) {
        setError(getUserFacingErrorMessage(submitError, "Vérification du code impossible."));
      } finally {
        setIsOtpSubmitting(false);
      }
      return;
    }

    if (isForgot) {
      if (!forgotEmail) {
        setError("Renseignez votre email.");
        return;
      }

      setIsForgotSubmitting(true);
      try {
        const response = await fetch("/api/auth/password-reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: forgotEmail }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(getUserFacingErrorMessage(data?.error, "Impossible d'envoyer l'email de réinitialisation."));
        }
        setSuccessMessage(data.message || "Si un compte existe, un email de réinitialisation a été envoyé.");
      } catch (submitError) {
        setError(getUserFacingErrorMessage(submitError, "Impossible d'envoyer l'email."));
      } finally {
        setIsForgotSubmitting(false);
      }
      return;
    }

    if (!email || !password) {
      setError("Renseignez votre email et votre mot de passe.");
      return;
    }

    if (isSignup) {
      if (signupMethod !== "email") {
        setError("Choisissez une methode d'inscription.");
        return;
      }
      if (!confirmPassword) {
        setError("Confirmez votre mot de passe.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Les mots de passe ne correspondent pas.");
        return;
      }
      const firstFailedRule = passwordChecks.find((rule) => !rule.ok);
      if (firstFailedRule) {
        setError(`Mot de passe invalide : ${firstFailedRule.label}.`);
        return;
      }

      try {
        setIsEmailSubmitting(true);
        await signupWithEmailPassword(email, password);
        trackAuthCompleted("sign_up", "email");
      } catch (submitError) {
        setError(getUserFacingErrorMessage(submitError, "Inscription impossible."));
      } finally {
        setIsEmailSubmitting(false);
      }
      return;
    }

    try {
      setIsEmailSubmitting(true);
      const result = await login(email, password);
      if (result.status === "otp_required") {
        const now = Date.now();
        setOtpChallengeId(result.challengeId);
        setOtpEmail(result.email);
        setOtpCode("");
        setOtpExpiresAt(now + result.expiresInSeconds * 1000);
        setOtpResendAvailableAt(result.resendAvailableInSeconds ? now + result.resendAvailableInSeconds * 1000 : null);
        setSuccessMessage(result.message || "Un code de connexion vous a été envoyé.");
        setViewMode("otp");
        return;
      }
      trackAuthCompleted("login", "email");
      onClose?.();
    } catch (submitError) {
      setError(getUserFacingErrorMessage(submitError, "Connexion impossible."));
    } finally {
      setIsEmailSubmitting(false);
    }
  }

  async function handleResendOtp() {
    if (!otpChallengeId) {
      return;
    }

    setError("");
    setSuccessMessage("");

    try {
      setIsOtpResending(true);
      const result = await resendLoginOtp(otpChallengeId);
      const now = Date.now();
      setOtpEmail(result.email || otpEmail);
      setOtpExpiresAt(now + result.expiresInSeconds * 1000);
      setOtpResendAvailableAt(result.resendAvailableInSeconds ? now + result.resendAvailableInSeconds * 1000 : null);
      setSuccessMessage(result.message || "Un nouveau code vous a été envoyé.");
    } catch (resendError) {
      setError(getUserFacingErrorMessage(resendError, "Impossible de renvoyer le code."));
    } finally {
      setIsOtpResending(false);
    }
  }

  function handleGoogleClick() {
    setError("");
    setSuccessMessage("");
    setIsGoogleRedirecting(true);

    if (isSignup) {
      signupWithGoogle();
      return;
    }

    loginWithGoogle();
  }

  return (
    <div
      className={
        mode === "modal"
          ? "ui-surface w-full max-w-md rounded-[28px] p-8 shadow-2xl"
          : "ui-card w-full max-w-[520px] rounded-[32px] p-8"
      }
    >
      <div className={mode === "modal" ? "mb-8 pr-10" : "mb-8"}>
        <h1 className="text-3xl font-semibold text-[#111111] dark:text-white">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-[#5f5f5f] dark:text-[#c8c8c8]">{description}</p>
      </div>

      <div className="space-y-4">
        {!isForgot && !isOtp && !(isSignup && signupMethod === "email") ? (
          <>
            {isSignup ? (
              <div className="grid grid-cols-1 gap-3">
                <AuthButton
                  type="button"
                  onClick={handleGoogleClick}
                  disabled={isGoogleRedirecting}
                  className={secondaryActionClass}
                >
                  <span className="inline-flex items-center gap-2">
                    <GoogleIcon />
                    {isGoogleRedirecting ? "Redirection..." : "S'inscrire avec Google"}
                  </span>
                </AuthButton>
                <AuthButton
                  type="button"
                  onClick={() => {
                    setSignupMethod("email");
                    setError("");
                    setSuccessMessage("");
                  }}
                  className={secondaryActionClass}
                >
                  S'inscrire par email
                </AuthButton>
              </div>
            ) : (
              <AuthButton
                type="button"
                onClick={handleGoogleClick}
                disabled={isGoogleRedirecting}
                className={secondaryActionClass}
              >
                <span className="inline-flex items-center gap-2">
                  <GoogleIcon />
                  {isGoogleRedirecting ? "Redirection vers Google..." : "Continuer avec Google"}
                </span>
              </AuthButton>
            )}

            {!isSignup ? (
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[#E5E7EB] dark:bg-[#3a3a3a]" />
                <span className="text-xs uppercase tracking-[0.2em] text-[#8A8A8A]">ou</span>
                <div className="h-px flex-1 bg-[#E5E7EB] dark:bg-[#3a3a3a]" />
              </div>
            ) : null}
          </>
        ) : null}

        {!isSignup || signupMethod === "email" ? (
          <form
            onSubmit={handleSubmit}
            className="space-y-3 rounded-[24px] border border-[#E5E7EB] bg-[#FAFAFA] p-4 dark:border-[#3a3a3a] dark:bg-[#262626]"
          >
            {isSignup ? (
              <button
                type="button"
                onClick={() => {
                  setSignupMethod("choice");
                  setPassword("");
                  setConfirmPassword("");
                  setError("");
                }}
                className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#27624f]"
              >
                Retour
              </button>
            ) : null}

            <div className="flex items-center gap-3 text-[#111111] dark:text-white">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-white text-[#27624f] shadow-sm dark:bg-[#1b1b1b]">
                {isOtp ? <LockKeyhole className="size-4" /> : <Mail className="size-4" />}
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {isOtp ? "Code de connexion" : isForgot ? "Récupération de compte" : isSignup ? "Inscription par email" : "Connexion par email"}
                </p>
                <p className="text-xs text-[#777777]">
                  {isOtp
                    ? "Valable 15 minutes"
                    : isForgot
                      ? "Nous envoyons un lien de réinitialisation à votre adresse email"
                      : isSignup
                        ? "Entrez vos identifiants puis continuez"
                        : "Utilisez votre email et votre mot de passe"}
                </p>
              </div>
            </div>

            {isOtp ? (
              <div className="space-y-3">
                <label className="block text-sm text-[#111111] dark:text-white">
                  <span className="mb-2 block font-medium">Code de connexion</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 py-4 text-center text-2xl font-semibold tracking-[0.5em] text-[#111111] outline-none transition-colors focus:border-[#27624f] dark:border-[#3a3a3a] dark:bg-[#1b1b1b] dark:text-white"
                  />
                  <span className="mt-2 block text-xs text-[#777777]">
                    {otpEmail || "votre adresse email"} • {formatOtpExpiry(otpExpiresAt)}
                  </span>
                </label>

                <div className="flex items-center justify-between gap-3 text-xs text-[#777777]">
                  <button
                    type="button"
                    onClick={() => resetOtpState("login")}
                    className="font-medium text-[#27624f] hover:underline"
                  >
                    Changer d'email
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isOtpResending || isResendCoolingDown}
                    className="font-medium text-[#27624f] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isOtpResending
                      ? "Renvoi..."
                      : isResendCoolingDown
                        ? "Patientez"
                        : "Renvoyer le code"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <label className="block text-sm text-[#111111] dark:text-white">
                  <span className="mb-2 block font-medium">Email</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#8A8A8A]" />
                    <input
                      type="email"
                      value={isForgot ? forgotEmail : email}
                      onChange={(event) => (isForgot ? setForgotEmail(event.target.value) : setEmail(event.target.value))}
                      placeholder="vous@example.invalid"
                      className="w-full rounded-2xl border border-[#E5E7EB] bg-white py-3 pl-11 pr-4 text-sm text-[#111111] outline-none transition-colors focus:border-[#27624f] dark:border-[#3a3a3a] dark:bg-[#1b1b1b] dark:text-white"
                    />
                  </div>
                </label>

                {!isForgot ? (
                  <label className="block text-sm text-[#111111] dark:text-white">
                    <span className="mb-2 block font-medium">Mot de passe</span>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#8A8A8A]" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Votre mot de passe"
                        className="w-full rounded-2xl border border-[#E5E7EB] bg-white py-3 pl-11 pr-12 text-sm text-[#111111] outline-none transition-colors focus:border-[#27624f] dark:border-[#3a3a3a] dark:bg-[#1b1b1b] dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A8A] transition-colors hover:text-[#27624f]"
                        aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </label>
                ) : null}

                {isSignup ? (
                  <label className="block text-sm text-[#111111] dark:text-white">
                    <span className="mb-2 block font-medium">Confirmer le mot de passe</span>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#8A8A8A]" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Retapez le mot de passe"
                        className="w-full rounded-2xl border border-[#E5E7EB] bg-white py-3 pl-11 pr-12 text-sm text-[#111111] outline-none transition-colors focus:border-[#27624f] dark:border-[#3a3a3a] dark:bg-[#1b1b1b] dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((current) => !current)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A8A] transition-colors hover:text-[#27624f]"
                        aria-label={showConfirmPassword ? "Masquer la confirmation" : "Afficher la confirmation"}
                      >
                        {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {hasPasswordMismatch ? (
                      <p className="mt-2 text-xs text-[#27624f]">Les mots de passe ne correspondent pas.</p>
                    ) : null}
                  </label>
                ) : null}

                {isSignup ? (
                  <div className="rounded-2xl border border-[#EFEFEF] bg-white/70 px-3 py-2 text-[11px] leading-5 text-[#666] dark:border-[#3a3a3a] dark:bg-[#1b1b1b] dark:text-[#c8c8c8]">
                    {passwordChecks.map((rule) => (
                      <p
                        key={rule.key}
                        className={`flex items-center gap-1.5 transition-colors ${
                          rule.ok ? "text-emerald-600 dark:text-emerald-400" : "text-[#666] dark:text-[#c8c8c8]"
                        }`}
                      >
                        <Check className="size-3" />
                        <span>{rule.label}</span>
                      </p>
                    ))}
                  </div>
                ) : null}
              </>
            )}

            {error ? <p className="text-sm text-[#27624f]">{error}</p> : null}
            {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}

            <AuthButton
              type="submit"
              disabled={
                isEmailSubmitting ||
                isOtpSubmitting ||
                isForgotSubmitting ||
                (isOtp ? otpCode.trim().length !== 6 : false) ||
                (!isOtp && (isForgot ? !forgotEmail : !email || !password || (isSignupEmailFlow && (!confirmPassword || hasPasswordMismatch))))
              }
              className="bg-[#27624f] text-white hover:bg-[#b7191f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2">
                {(isForgot && isForgotSubmitting) || (isOtp && isOtpSubmitting) || (!isForgot && !isOtp && isEmailSubmitting) ? (
                  <span className="inline-block size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : isForgot ? (
                  <Mail className="size-4" />
                ) : (
                  <LockKeyhole className="size-4" />
                )}
                {isForgot
                  ? isForgotSubmitting
                    ? "Envoi en cours..."
                    : "Envoyer le lien"
                  : isOtp
                    ? isOtpSubmitting
                      ? "Vérification..."
                      : "Valider le code"
                    : isSignup
                      ? isEmailSubmitting
                        ? "Inscription en cours..."
                        : "S'inscrire"
                      : isEmailSubmitting
                        ? "Connexion en cours..."
                        : "Se connecter"}
                <ArrowRight className="size-4" />
              </span>
            </AuthButton>
          </form>
        ) : null}
      </div>

      {isLogin ? (
        <div className="mt-4 text-center text-sm text-[#666666] dark:text-[#c8c8c8]">
          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccessMessage("");
              setViewMode("forgot");
            }}
            className="font-medium text-[#27624f] hover:underline"
          >
            Mot de passe oublie ?
          </button>
          <p className="mt-3">
            Vous n&apos;avez pas encore un compte ?{" "}
            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccessMessage("");
                setViewMode("signup");
              }}
              className="font-semibold text-[#27624f] hover:underline"
            >
              S&apos;inscrire
            </button>
          </p>
        </div>
      ) : null}

      {isSignup ? (
        <p className="mt-4 text-center text-sm text-[#666666] dark:text-[#c8c8c8]">
          Vous avez déjà un compte ?{" "}
          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccessMessage("");
              setViewMode("login");
            }}
            className="font-semibold text-[#27624f] hover:underline"
          >
            Se connecter
          </button>
        </p>
      ) : null}

      {isForgot ? (
        <p className="mt-4 text-center text-sm text-[#666666] dark:text-[#c8c8c8]">
          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccessMessage("");
              setViewMode("login");
            }}
            className="font-semibold text-[#27624f] hover:underline"
          >
            Retour à la connexion
          </button>
        </p>
      ) : null}

      {isOtp ? (
        <p className="mt-4 text-center text-sm text-[#666666] dark:text-[#c8c8c8]">
          Besoin de recommencer ?{" "}
          <button
            type="button"
            onClick={() => resetOtpState("login")}
            className="font-semibold text-[#27624f] hover:underline"
          >
            Retour à la connexion
          </button>
        </p>
      ) : null}
    </div>
  );
}
