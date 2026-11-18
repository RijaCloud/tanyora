"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PhoneInput } from "react-international-phone";
import { AlertTriangle, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Trash2 } from "lucide-react";
import "react-international-phone/style.css";
import { AppImage } from "@/components/ui/AppImage";
import type { TaxonomyTermResult, WordPressUserProfile } from "@/lib/api/wordpress-internal";
import { ProfileSettingsCompound as Profile } from "@/features/profile/components/ProfileSettingsCompound";
import { useAuth } from "@/features/prototype/app/context/AuthContext";
import { uploadProfilePhotoToStorage } from "@/lib/client/profile-photo-upload";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/phone";
import { getFirstPasswordRequirementFailure, getPasswordRequirementResults } from "@/lib/auth/password-policy";

const optionalProfilePhotoField = z
  .union([
    z.literal(""),
    z.string().url("Entrez une URL valide."),
  ])
  .optional();

const profileSettingsSchema = z.object({
  firstName: z.string().min(2, "Prénom trop court"),
  lastName: z.string().min(2, "Nom trop court"),
  phone: z.string().trim().refine((value) => isValidPhoneNumber(value), "Numéro invalide"),
  birthDate: z.string().regex(/^(|\d{2}\/\d{2}\/\d{4})$/, "Utilisez le format DD/MM/YYYY").optional(),
  address: z.string().optional(),
  businessActivityCategory: z.string().optional(),
  businessRegions: z.array(z.string().min(1)).length(1, "Sélectionnez une région."),
  businessCities: z.array(z.string().min(1)).max(1, "Sélectionnez une seule ville."),
  directoryVisibilityEnabled: z.boolean(),
  profilePhoto: optionalProfilePhotoField,
  companyLogo: optionalProfilePhotoField,
  notificationEmailsEnabled: z.boolean(),
  socialLinks: z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    x: z.string().optional(),
    youtube: z.string().optional(),
  }),
});

const profileInputClassName =
  "ui-text-main ui-border-strong w-full rounded-2xl border bg-transparent px-4 py-3 text-sm outline-none transition focus:border-[var(--text-muted)]";

function withValidatedFieldState(className: string, isValid: boolean) {
  return isValid
    ? `${className} border-emerald-500 bg-emerald-50/40 focus:border-emerald-600 dark:bg-emerald-950/20`
    : className;
}

type ProfileSettingsValues = z.infer<typeof profileSettingsSchema>;

function formatBirthDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

type ProfileSettingsPageProps = {
  profile: WordPressUserProfile;
  planLabel: string;
  planDescription?: string | null;
  businessActivityOptions?: string[];
  regionOptions?: string[];
  cityOptionsByRegion?: Record<string, string[]>;
};

type LocationLoadingState = "idle" | "loading" | "error";

function buildLocationOptions(terms: TaxonomyTermResult[]) {
  const regions = Array.from(
    new Set(
      terms
        .filter((term) => !term.parentId && !term.parentName)
        .map((term) => term.name.trim())
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right, "fr", { sensitivity: "base" }));

  return {
    regions,
    citiesByRegion: Object.fromEntries(
      regions.map((region) => [
        region,
        Array.from(
          new Set(
            terms
              .filter((term) => (term.parentName || "").trim().toLowerCase() === region.toLowerCase())
              .map((term) => term.name.trim())
              .filter(Boolean),
          ),
        ).sort((left, right) => left.localeCompare(right, "fr", { sensitivity: "base" })),
      ]),
    ),
  };
}

function PasswordSecuritySection({ isGoogleAccount }: { isGoogleAccount: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const requirementResults = useMemo(() => getPasswordRequirementResults(newPassword), [newPassword]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Renseignez votre mot de passe actuel et confirmez le nouveau.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    const failedRequirement = getFirstPasswordRequirementFailure(newPassword);
    if (failedRequirement) {
      setError(`Mot de passe invalide : ${failedRequirement.label}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/password/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(getUserFacingErrorMessage(payload?.error, "Impossible de modifier votre mot de passe."));
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(payload?.message || "Votre mot de passe a été mis à jour.");
    } catch (submitError) {
      setError(getUserFacingErrorMessage(submitError, "Impossible de modifier votre mot de passe."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isGoogleAccount) {
    return (
      <section className="ui-surface-soft ui-border rounded-[28px] border px-5 py-5">
        <p className="ui-text-main text-sm font-semibold">Mot de passe</p>
        <p className="ui-text-muted mt-2 text-sm leading-6">
          Vous vous connectez avec Google. Votre mot de passe est géré directement par votre compte Google.
        </p>
      </section>
    );
  }

  const passwordFieldClassName =
    "ui-text-main ui-border-strong w-full rounded-2xl border bg-transparent py-3 pl-11 pr-12 text-sm outline-none transition focus:border-[var(--text-muted)]";

  return (
    <section className="ui-surface-soft ui-border rounded-[28px] border px-5 py-5">
      <div className="max-w-[58ch]">
        <p className="ui-text-main text-sm font-semibold">Sécurité</p>
        <p className="ui-text-muted mt-2 text-sm leading-6">
          Modifiez votre mot de passe en renseignant votre mot de passe actuel. Votre session restera active.
        </p>
      </div>

      <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <Profile.Field label="Mot de passe actuel" required>
          <div className="relative">
            <LockKeyhole className="ui-text-muted pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2" />
            <input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              className={passwordFieldClassName}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword((value) => !value)}
              className="ui-text-muted absolute right-4 top-1/2 -translate-y-1/2 transition hover:text-[#27624f]"
              aria-label={showCurrentPassword ? "Masquer le mot de passe actuel" : "Afficher le mot de passe actuel"}
            >
              {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Profile.Field>

        <div className="hidden md:block" />

        <Profile.Field label="Nouveau mot de passe" required>
          <div className="relative">
            <LockKeyhole className="ui-text-muted pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2" />
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              className={passwordFieldClassName}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((value) => !value)}
              className="ui-text-muted absolute right-4 top-1/2 -translate-y-1/2 transition hover:text-[#27624f]"
              aria-label={showNewPassword ? "Masquer le nouveau mot de passe" : "Afficher le nouveau mot de passe"}
            >
              {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Profile.Field>

        <Profile.Field label="Confirmer le nouveau mot de passe" required>
          <div className="relative">
            <LockKeyhole className="ui-text-muted pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              className={passwordFieldClassName}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((value) => !value)}
              className="ui-text-muted absolute right-4 top-1/2 -translate-y-1/2 transition hover:text-[#27624f]"
              aria-label={showConfirmPassword ? "Masquer la confirmation" : "Afficher la confirmation"}
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Profile.Field>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 md:col-span-2">
          <p className="ui-text-muted mb-3 text-xs font-semibold uppercase tracking-[0.18em]">Exigences</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {requirementResults.map((requirement) => (
              <div key={requirement.key} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className={`size-4 ${requirement.ok ? "text-emerald-700 dark:text-emerald-400" : "ui-text-muted"}`} />
                <span className={requirement.ok ? "text-emerald-700 dark:text-emerald-400" : "ui-text-muted"}>{requirement.label}</span>
              </div>
            ))}
          </div>
        </div>

        {error ? <p className="text-sm text-[#27624f] md:col-span-2">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-700 dark:text-emerald-400 md:col-span-2">{success}</p> : null}

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-2xl border border-transparent bg-[#27624f] px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-[#27624f] hover:bg-transparent hover:text-[#27624f] disabled:cursor-not-allowed disabled:bg-[#F1B8BB]"
          >
            {isSubmitting ? "Mise à jour..." : "Mettre à jour mon mot de passe"}
          </button>
        </div>
      </form>
    </section>
  );
}

function AccountDeletionSection({ isGoogleAccount, onDeleted }: { isGoogleAccount: boolean; onDeleted: () => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function close() {
    if (isSubmitting) return;
    setIsOpen(false);
    setConfirmation("");
    setCurrentPassword("");
    setChallengeId("");
    setVerificationCode("");
    setError("");
    setNotice("");
  }

  async function sendCode() {
    setError("");
    setNotice("");
    setIsSendingCode(true);
    try {
      const response = await fetch("/api/auth/account-deletion/request-code", { method: "POST" });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.challengeId) {
        throw new Error(getUserFacingErrorMessage(payload?.error, "Impossible d'envoyer le code pour le moment."));
      }
      setChallengeId(payload.challengeId);
      setNotice("Un code de confirmation a été envoyé à votre adresse email.");
    } catch (reason) {
      setError(getUserFacingErrorMessage(reason, "Impossible d'envoyer le code pour le moment."));
    } finally {
      setIsSendingCode(false);
    }
  }

  async function confirmDeletion() {
    setError("");
    if (confirmation.trim() !== "SUPPRIMER") {
      setError('Saisissez « SUPPRIMER » pour confirmer.');
      return;
    }
    if (isGoogleAccount && (!challengeId || !verificationCode.trim())) {
      setError("Demandez puis saisissez le code reçu par email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/account-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation,
          currentPassword: isGoogleAccount ? undefined : currentPassword,
          challengeId: isGoogleAccount ? challengeId : undefined,
          verificationCode: isGoogleAccount ? verificationCode : undefined,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(getUserFacingErrorMessage(payload?.error, "Impossible de supprimer votre compte pour le moment."));
      }
      await onDeleted();
    } catch (reason) {
      setError(getUserFacingErrorMessage(reason, "Impossible de supprimer votre compte pour le moment."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-6 rounded-[28px] border border-[#f1b4b7] bg-[#fff7f7] px-5 py-5 dark:border-[#7f2731] dark:bg-[#2a171b]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-[58ch]">
          <div className="flex items-center gap-2 text-[#c5212a] dark:text-[#ff9da3]">
            <AlertTriangle className="size-5" aria-hidden="true" />
            <p className="text-sm font-semibold">Zone dangereuse</p>
          </div>
          <h2 className="ui-text-main mt-3 text-xl font-semibold">Supprimer mon compte</h2>
          <p className="ui-text-muted mt-2 text-sm leading-6">
            Cette action est définitive. Votre profil et vos contenus publiés seront supprimés. Les factures restent conservées pour les obligations comptables.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-[#d3232d] px-4 py-3 text-sm font-semibold text-[#c5212a] transition hover:bg-[#c5212a] hover:text-white dark:text-[#ffb1b5] dark:hover:text-white"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Supprimer mon compte
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="account-deletion-title">
          <div className="ui-surface ui-border w-full max-w-[560px] rounded-[28px] border p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#27624f]">Suppression définitive</p>
            <h3 id="account-deletion-title" className="ui-text-main mt-3 text-2xl font-semibold tracking-[-0.03em]">Supprimer votre compte Tanyora ?</h3>
            <p className="ui-text-muted mt-3 text-sm leading-6">Vos annonces, offres d&apos;emploi, appels d&apos;offres et informations de profil seront retirés. Cette action ne peut pas être annulée.</p>

            <div className="mt-5 space-y-4">
              {isGoogleAccount ? (
                <div className="ui-surface-soft rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 size-4 text-[#27624f]" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="ui-text-main text-sm font-semibold">Confirmez avec votre adresse Google</p>
                      <p className="ui-text-muted mt-1 text-xs leading-5">Un code à usage unique est nécessaire pour protéger votre compte.</p>
                      <button type="button" onClick={() => void sendCode()} disabled={isSendingCode || isSubmitting} className="mt-3 text-sm font-semibold text-[#27624f] hover:underline disabled:cursor-not-allowed disabled:opacity-60">
                        {isSendingCode ? "Envoi du code..." : challengeId ? "Renvoyer le code" : "Envoyer le code"}
                      </button>
                    </div>
                  </div>
                  {challengeId ? (
                    <input value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="Code à 6 chiffres" className="ui-text-main ui-border-strong mt-4 w-full rounded-2xl border bg-transparent px-4 py-3 text-sm outline-none transition focus:border-[var(--text-muted)]" />
                  ) : null}
                </div>
              ) : (
                <label className="block">
                  <span className="ui-text-main mb-2 block text-sm font-medium">Mot de passe actuel</span>
                  <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" className="ui-text-main ui-border-strong w-full rounded-2xl border bg-transparent px-4 py-3 text-sm outline-none transition focus:border-[var(--text-muted)]" />
                </label>
              )}

              <label className="block">
                <span className="ui-text-main mb-2 block text-sm font-medium">Saisissez <strong>SUPPRIMER</strong> pour confirmer</span>
                <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" className="ui-text-main ui-border-strong w-full rounded-2xl border bg-transparent px-4 py-3 text-sm outline-none transition focus:border-[var(--text-muted)]" />
              </label>
            </div>

            {notice ? <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300">{notice}</p> : null}
            {error ? <p role="alert" className="mt-4 rounded-2xl border border-[#f1b4b7] bg-[#fff4f5] px-4 py-3 text-sm text-[#9f1f28] dark:border-[#7f2731] dark:bg-[#35181d] dark:text-[#ffb1b5]">{error}</p> : null}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={close} disabled={isSubmitting} className="ui-text-main ui-border inline-flex justify-center rounded-2xl border px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">Annuler</button>
              <button type="button" onClick={() => void confirmDeletion()} disabled={isSubmitting} className="inline-flex justify-center rounded-2xl bg-[#c5212a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9e1b22] disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? "Suppression..." : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function ProfileSettingsPage({
  profile,
  planLabel,
  planDescription,
  businessActivityOptions = [],
  regionOptions = [],
  cityOptionsByRegion = {},
}: ProfileSettingsPageProps) {
  const router = useRouter();
  const { refreshSession, userPlan, user, logout } = useAuth();
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null);
  const companyLogoInputRef = useRef<HTMLInputElement | null>(null);
  const [formError, setFormError] = useState("");
  const [successToast, setSuccessToast] = useState("");
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(profile.profilePhoto || profile.avatarUrl || "");
  const [companyLogoPreview, setCompanyLogoPreview] = useState(profile.companyLogo || "");
  const [isUploadingProfilePhoto, setIsUploadingProfilePhoto] = useState(false);
  const [isUploadingCompanyLogo, setIsUploadingCompanyLogo] = useState(false);
  const [fallbackLocationOptions, setFallbackLocationOptions] = useState<{
    regions: string[];
    citiesByRegion: Record<string, string[]>;
  }>(() => ({ regions: [], citiesByRegion: {} }));
  const [locationLoadingState, setLocationLoadingState] = useState<LocationLoadingState>(regionOptions.length ? "idle" : "loading");

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileSettingsValues>({
    resolver: zodResolver(profileSettingsSchema),
    mode: "onChange",
    defaultValues: {
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      phone: profile.phone || "+261",
      birthDate: profile.birthDate || "",
      address: profile.address || "",
      businessActivityCategory: profile.businessActivityCategory || "",
      businessRegions: Array.isArray(profile.businessRegions) ? profile.businessRegions.slice(0, 1) : [],
      businessCities: Array.isArray(profile.businessCities) ? profile.businessCities.slice(0, 1) : [],
      directoryVisibilityEnabled: profile.directoryVisibilityEnabled !== false,
      profilePhoto: profile.profilePhoto || "",
      companyLogo: profile.companyLogo || "",
      notificationEmailsEnabled: profile.notificationEmailsEnabled !== false,
      socialLinks: {
        facebook: profile.socialLinks?.facebook || "",
        instagram: profile.socialLinks?.instagram || "",
        x: profile.socialLinks?.x || "",
        youtube: profile.socialLinks?.youtube || "",
      },
    },
  });

  const watchedFirstName = watch("firstName");
  const watchedLastName = watch("lastName");
  const watchedPhone = watch("phone");
  const watchedBirthDate = watch("birthDate");
  const watchedAddress = watch("address");
  const watchedBusinessActivityCategory = watch("businessActivityCategory");
  const displayedProfilePhoto = profilePhotoPreview || watch("profilePhoto") || "";
  const displayedCompanyLogo = companyLogoPreview || watch("companyLogo") || "";
  const selectedRegions = watch("businessRegions") || [];
  const selectedCities = watch("businessCities") || [];
  const selectedRegion = selectedRegions[0] || "";
  const effectiveRegionOptions = Array.from(
    new Set([...(regionOptions.length ? regionOptions : fallbackLocationOptions.regions), ...selectedRegions]),
  ).sort((left, right) => left.localeCompare(right, "fr", { sensitivity: "base" }));
  const effectiveCityOptionsByRegion = regionOptions.length ? cityOptionsByRegion : fallbackLocationOptions.citiesByRegion;
  const availableCityOptions = useMemo(
    () => (selectedRegion ? effectiveCityOptionsByRegion[selectedRegion] || [] : []),
    [effectiveCityOptionsByRegion, selectedRegion],
  );
  const canManageCompanyLogo = useMemo(() => {
    const normalizedPlan = String(userPlan || planLabel || "").trim().toLowerCase();
    return normalizedPlan === "essentiel" || normalizedPlan === "business";
  }, [planLabel, userPlan]);
  const isLastNameValid = (watchedLastName || "").trim().length >= 2;
  const isFirstNameValid = (watchedFirstName || "").trim().length >= 2;
  const isPhoneFieldValid = isValidPhoneNumber(watchedPhone || "");
  const isBirthDateValid = /^\d{2}\/\d{2}\/\d{4}$/.test(watchedBirthDate || "");
  const isAddressValid = Boolean(watchedAddress?.trim());
  const isBusinessActivityValid = Boolean(watchedBusinessActivityCategory?.trim());
  const isRegionValid = selectedRegions.length === 1 && Boolean(selectedRegions[0]);
  const isCityValid = selectedCities.length === 1 && Boolean(selectedCities[0]);

  useEffect(() => {
    const nextCity = selectedCities[0] && availableCityOptions.includes(selectedCities[0]) ? [selectedCities[0]] : [];
    if (nextCity.join("|") !== selectedCities.join("|")) {
      setValue("businessCities", nextCity, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    }
  }, [availableCityOptions, selectedCities, setValue]);

  useEffect(() => {
    if (regionOptions.length) return;

    const controller = new AbortController();

    async function loadLocations() {
      try {
        const response = await fetch("/api/public/locations/directory", { signal: controller.signal });
        if (!response.ok) throw new Error("Unable to load directory locations.");

        const payload = (await response.json()) as { terms?: TaxonomyTermResult[] };
        const options = buildLocationOptions(Array.isArray(payload.terms) ? payload.terms : []);
        if (!options.regions.length) throw new Error("No directory regions returned.");

        setFallbackLocationOptions(options);
        setLocationLoadingState("idle");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLocationLoadingState("error");
      }
    }

    void loadLocations();
    return () => controller.abort();
  }, [regionOptions.length]);

  function handleRemoveProfilePhoto() {
    setProfilePhotoPreview("");
    setValue("profilePhoto", "", { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    clearErrors("profilePhoto");
    if (profilePhotoInputRef.current) {
      profilePhotoInputRef.current.value = "";
    }
  }

  function handleRemoveCompanyLogo() {
    setCompanyLogoPreview("");
    setValue("companyLogo", "", { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    clearErrors("companyLogo");
    if (companyLogoInputRef.current) {
      companyLogoInputRef.current.value = "";
    }
  }

  async function handleProfilePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("profilePhoto", { type: "manual", message: "Choisissez un fichier image valide." });
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("profilePhoto", { type: "manual", message: "L'image doit faire moins de 5 Mo." });
      event.target.value = "";
      return;
    }

    setIsUploadingProfilePhoto(true);

    try {
      const uploadedPublicUrl = await uploadProfilePhotoToStorage(file);
      setProfilePhotoPreview(uploadedPublicUrl);
      setValue("profilePhoto", uploadedPublicUrl, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
      clearErrors("profilePhoto");
    } catch (error) {
      setError("profilePhoto", {
        type: "manual",
        message: getUserFacingErrorMessage(error, "Impossible d'envoyer cette image."),
      });
      event.target.value = "";
    } finally {
      setIsUploadingProfilePhoto(false);
    }
  }

  async function handleCompanyLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("companyLogo", { type: "manual", message: "Choisissez un fichier image valide." });
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("companyLogo", { type: "manual", message: "L'image doit faire moins de 5 Mo." });
      event.target.value = "";
      return;
    }

    setIsUploadingCompanyLogo(true);

    try {
      const uploadedPublicUrl = await uploadProfilePhotoToStorage(file);
      setCompanyLogoPreview(uploadedPublicUrl);
      setValue("companyLogo", uploadedPublicUrl, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
      clearErrors("companyLogo");
    } catch (error) {
      setError("companyLogo", {
        type: "manual",
        message: getUserFacingErrorMessage(error, "Impossible d'envoyer ce logo."),
      });
      event.target.value = "";
    } finally {
      setIsUploadingCompanyLogo(false);
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError("");

    try {
      const normalizedPhone = normalizePhoneNumber(values.phone);
      if (!normalizedPhone) {
        setError("phone", { type: "manual", message: "Numéro invalide" });
        return;
      }

      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          phone: normalizedPhone,
          notificationEmailsEnabled: values.notificationEmailsEnabled,
          businessActivityCategory: values.businessActivityCategory,
          businessRegions: values.businessRegions.slice(0, 1),
          businessCities: values.businessCities.slice(0, 1),
          directoryVisibilityEnabled: values.directoryVisibilityEnabled,
          companyLogo: values.companyLogo,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(getUserFacingErrorMessage(data?.error, "Impossible de mettre à jour le profil."));
      }

      setSuccessToast("Vos informations ont été mises à jour.");
      await refreshSession();
      window.setTimeout(() => {
        setSuccessToast("");
      }, 2800);
      router.refresh();
    } catch (error) {
      setFormError(getUserFacingErrorMessage(error, "Impossible de mettre à jour le profil."));
    }
  });

  return (
    <Profile>
      {successToast ? <Profile.Toast title="Modification enregistrée" message={successToast} /> : null}

      <Profile.TwoColumn>
        <Profile.Hero>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ffb5b8]">Mes informations</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em]">Gérez votre compte Tanyora</h1>
          <p className="mt-4 max-w-[48ch] text-sm leading-7 text-white/75">
            Mettez à jour votre identité, vos coordonnées et vos liens sociaux depuis un espace dédié.
          </p>

          <Profile.HeroCard>
            <p className="text-xs uppercase tracking-[0.18em] text-white/50">Plan actuel</p>
            <p className="mt-3 text-3xl font-semibold text-white">{planLabel}</p>
            <p className="mt-3 text-sm leading-6 text-white/70">
              {planDescription || "Votre formule actuelle détermine vos accès et vos services sur la plateforme."}
            </p>
          </Profile.HeroCard>

          <Profile.HeroCard>
            <p className="text-xs uppercase tracking-[0.18em] text-white/50">Compte</p>
            <p className="mt-3 text-base font-semibold text-white">{profile.displayName}</p>
            <p className="mt-2 text-sm text-white/70">{profile.email}</p>
            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-white/50">Identifiant</p>
            <p className="mt-2 text-sm text-white/80">{profile.username}</p>
          </Profile.HeroCard>
        </Profile.Hero>

        <Profile.FormCard>
          <Profile.HeaderRow>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#27624f]">Formulaire compte</p>
              <h2 className="ui-text-main mt-3 text-3xl font-semibold tracking-[-0.03em]">Informations personnelles</h2>
            </div>
            <Link
              href="/profil"
              className="ui-text-main ui-border-strong inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold transition hover:border-[#27624f] hover:text-[#27624f]"
            >
              Retour au dashboard
            </Link>
          </Profile.HeaderRow>

          <form className="space-y-6" onSubmit={onSubmit}>
            <Profile.FormGrid>
              <Profile.Sidebar>
                <div className="flex items-center gap-4 xl:block">
                  <Profile.AvatarFrame>
                    {displayedProfilePhoto ? (
                      <AppImage alt="" className="h-full w-full object-cover" src={displayedProfilePhoto} eager />
                    ) : (
                      <span className="text-2xl font-semibold uppercase text-[#27624f]">
                        {(profile.firstName || profile.displayName || "24").slice(0, 2)}
                      </span>
                    )}
                  </Profile.AvatarFrame>
                  <div className="min-w-0 xl:mt-4">
                    <p className="ui-text-main text-sm font-semibold">Photo de profil</p>
                  </div>
                </div>

                <Profile.Field label="Photo de profil" error={errors.profilePhoto?.message} hint="Facultatif">
                  <input type="hidden" {...register("profilePhoto")} />
                  <div className="space-y-3">
                    <input
                      ref={profilePhotoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploadingProfilePhoto}
                      onClick={() => profilePhotoInputRef.current?.click()}
                      className="ui-text-main ui-border-strong flex w-full items-center justify-between rounded-2xl border border-dashed bg-transparent px-4 py-3 text-left text-sm transition-colors hover:border-[#27624f] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span>
                        {isUploadingProfilePhoto
                          ? "Upload en cours..."
                          : displayedProfilePhoto
                            ? "Changer la photo"
                            : "Importer une photo"}
                      </span>
                      <span className="ui-text-muted text-xs uppercase tracking-[0.18em]">JPG PNG WEBP</span>
                    </button>
                    {displayedProfilePhoto ? (
                      <button
                        type="button"
                        onClick={handleRemoveProfilePhoto}
                        className="text-xs font-medium text-[#27624f] transition-opacity hover:opacity-80"
                      >
                        Supprimer la photo
                      </button>
                    ) : null}
                  </div>
                </Profile.Field>

                {canManageCompanyLogo ? (
                  <Profile.Field
                    label="Logo d'entreprise"
                    error={errors.companyLogo?.message}
                    hint="Affiché sur vos offres et appels d'offres."
                  >
                    <input type="hidden" {...register("companyLogo")} />
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 xl:block">
                        <Profile.AvatarFrame>
                          {displayedCompanyLogo ? (
                            <AppImage alt="" className="h-full w-full object-cover" src={displayedCompanyLogo} eager />
                          ) : (
                            <span className="text-2xl font-semibold uppercase text-[#27624f]">
                              {(profile.displayName || "24").slice(0, 2)}
                            </span>
                          )}
                        </Profile.AvatarFrame>
                        <div className="min-w-0 xl:mt-4">
                          <p className="ui-text-main text-sm font-semibold">Logo d'entreprise</p>
                        </div>
                      </div>
                      <input
                        ref={companyLogoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCompanyLogoChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={isUploadingCompanyLogo}
                        onClick={() => companyLogoInputRef.current?.click()}
                        className="ui-text-main ui-border-strong flex w-full items-center justify-between rounded-2xl border border-dashed bg-transparent px-4 py-3 text-left text-sm transition-colors hover:border-[#27624f] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span>
                          {isUploadingCompanyLogo
                            ? "Upload en cours..."
                            : displayedCompanyLogo
                              ? "Changer le logo"
                              : "Importer un logo"}
                        </span>
                        <span className="ui-text-muted text-xs uppercase tracking-[0.18em]">JPG PNG WEBP</span>
                      </button>
                      {displayedCompanyLogo ? (
                        <button
                          type="button"
                          onClick={handleRemoveCompanyLogo}
                          className="text-xs font-medium text-[#27624f] transition-opacity hover:opacity-80"
                        >
                          Supprimer le logo
                        </button>
                      ) : null}
                    </div>
                  </Profile.Field>
                ) : null}
              </Profile.Sidebar>

              <Profile.Content>
                <div className="grid gap-5 md:grid-cols-2">
                  <Profile.StaticField
                    label="Nom d'utilisateur"
                    required
                    value={profile.username || "-"}
                    isValid={Boolean(profile.username)}
                  />

                  <Profile.StaticField label="Email" required value={profile.email} isValid={Boolean(profile.email)} />

                  <Profile.Field label="Nom" required error={errors.lastName?.message} isValid={isLastNameValid}>
                    <input
                      {...register("lastName")}
                      className={withValidatedFieldState(profileInputClassName, isLastNameValid)}
                      placeholder="NANDRIANINA"
                    />
                  </Profile.Field>

                  <Profile.Field label="Prénom" required error={errors.firstName?.message} isValid={isFirstNameValid}>
                    <input
                      {...register("firstName")}
                      className={withValidatedFieldState(profileInputClassName, isFirstNameValid)}
                      placeholder="Voary Nirina"
                    />
                  </Profile.Field>

                  <Profile.Field label="Numéro de téléphone" required error={errors.phone?.message} isValid={isPhoneFieldValid}>
                    <div className={withValidatedFieldState("phone-picker-shell ui-border-strong rounded-2xl border bg-transparent px-2 py-1 transition focus-within:border-[var(--text-muted)]", isPhoneFieldValid)}>
                      <Controller
                        control={control}
                        name="phone"
                        render={({ field }) => (
                          <PhoneInput
                            defaultCountry="mg"
                            value={field.value}
                            onChange={(value) => field.onChange(value)}
                            inputClassName="!w-full !border-0 !bg-transparent !px-3 !py-2 !text-sm !text-[var(--text-primary)] focus:!ring-0"
                            countrySelectorStyleProps={{
                              buttonClassName: "!border-0 !bg-transparent hover:!bg-transparent",
                              dropdownStyleProps: { className: "!z-[120]" },
                            }}
                          />
                        )}
                      />
                    </div>
                  </Profile.Field>

                  <Profile.Field
                    label="Date de naissance"
                    error={errors.birthDate?.message}
                    isValid={isBirthDateValid}
                    hint="Saisissez uniquement les chiffres, par exemple 12081990. Les / s’ajoutent automatiquement."
                  >
                    <Controller
                      control={control}
                      name="birthDate"
                      render={({ field }) => (
                        <input
                          type="text"
                          inputMode="numeric"
                          value={field.value || ""}
                          onChange={(event) => field.onChange(formatBirthDateInput(event.target.value))}
                          className={withValidatedFieldState(profileInputClassName, isBirthDateValid)}
                          placeholder="DD/MM/YYYY"
                        />
                      )}
                    />
                  </Profile.Field>

                  <div className="md:col-span-2">
                    <Profile.Field label="Adresse" error={errors.address?.message} isValid={isAddressValid}>
                      <input
                        {...register("address")}
                        className={withValidatedFieldState(profileInputClassName, isAddressValid)}
                        placeholder="Antananarivo, Madagascar"
                      />
                    </Profile.Field>
                  </div>

                  <div className="md:col-span-2">
                    <Profile.Field label="Catégorie d'activité" error={errors.businessActivityCategory?.message} isValid={isBusinessActivityValid}>
                      <select
                        {...register("businessActivityCategory")}
                        className={withValidatedFieldState(profileInputClassName, isBusinessActivityValid)}
                      >
                        <option value="">Sélectionner une catégorie</option>
                        {businessActivityOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </Profile.Field>
                  </div>

                  <div className="md:col-span-2">
                    <Profile.Field
                      label="Régions"
                      required
                      error={errors.businessRegions?.message}
                      isValid={isRegionValid}
                      hint={
                        locationLoadingState === "loading"
                          ? "Chargement des régions..."
                          : locationLoadingState === "error"
                            ? "Les régions ne sont pas disponibles pour le moment. Réessayez dans quelques instants."
                            : undefined
                      }
                    >
                      <Controller
                        control={control}
                        name="businessRegions"
                        render={({ field }) => (
                          <select
                            value={field.value[0] || ""}
                            onChange={(event) => {
                              const nextRegion = event.target.value;
                              field.onChange(nextRegion ? [nextRegion] : []);
                              setValue("businessCities", [], { shouldDirty: true, shouldTouch: true, shouldValidate: true });
                            }}
                            disabled={locationLoadingState === "loading"}
                            className={withValidatedFieldState(`${profileInputClassName} disabled:cursor-wait disabled:opacity-60`, isRegionValid)}
                          >
                            <option value="">
                              {locationLoadingState === "loading" ? "Chargement des régions..." : "Sélectionner une région"}
                            </option>
                            {effectiveRegionOptions.map((region) => (
                              <option key={region} value={region}>
                                {region}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                    </Profile.Field>
                  </div>

                  <div className="md:col-span-2">
                    <Profile.Field
                      label="Villes"
                      hint={
                        selectedRegion ? undefined : "Sélectionnez d'abord une région."
                      }
                      error={errors.businessCities?.message}
                      isValid={isCityValid}
                    >
                      <Controller
                        control={control}
                        name="businessCities"
                        render={({ field }) => (
                          <select
                            value={field.value[0] || ""}
                            onChange={(event) => field.onChange(event.target.value ? [event.target.value] : [])}
                            disabled={!selectedRegion || availableCityOptions.length === 0}
                            className={withValidatedFieldState(`${profileInputClassName} disabled:cursor-not-allowed disabled:opacity-60`, isCityValid)}
                          >
                            <option value="">
                              {!selectedRegion
                                ? "Sélectionnez d'abord une région"
                                : availableCityOptions.length === 0
                                  ? "Aucune ville disponible"
                                  : "Sélectionner une ville"}
                            </option>
                            {availableCityOptions.map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                    </Profile.Field>
                  </div>
                </div>

                <div>
                  <p className="ui-text-main mb-3 text-sm font-medium">Liens réseaux sociaux</p>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Profile.Field label="Facebook">
                      <input
                        {...register("socialLinks.facebook")}
                        className="ui-text-main ui-border-strong w-full rounded-2xl border bg-transparent px-4 py-3 text-sm outline-none transition focus:border-[var(--text-muted)]"
                        placeholder="https://www.facebook.com/..."
                      />
                    </Profile.Field>
                    <Profile.Field label="Instagram">
                      <input
                        {...register("socialLinks.instagram")}
                        className="ui-text-main ui-border-strong w-full rounded-2xl border bg-transparent px-4 py-3 text-sm outline-none transition focus:border-[var(--text-muted)]"
                        placeholder="https://www.instagram.com/..."
                      />
                    </Profile.Field>
                    <Profile.Field label="X">
                      <input
                        {...register("socialLinks.x")}
                        className="ui-text-main ui-border-strong w-full rounded-2xl border bg-transparent px-4 py-3 text-sm outline-none transition focus:border-[var(--text-muted)]"
                        placeholder="https://x.com/..."
                      />
                    </Profile.Field>
                    <Profile.Field label="Youtube">
                      <input
                        {...register("socialLinks.youtube")}
                        className="ui-text-main ui-border-strong w-full rounded-2xl border bg-transparent px-4 py-3 text-sm outline-none transition focus:border-[var(--text-muted)]"
                        placeholder="https://www.youtube.com/..."
                      />
                    </Profile.Field>
                  </div>
                </div>

                <div className="ui-surface-soft ui-border rounded-[28px] border px-5 py-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="max-w-[44ch]">
                      <p className="ui-text-main text-sm font-semibold">Visibilité dans l&apos;annuaire</p>
                      <p className="ui-text-muted mt-2 text-sm leading-6">
                        Affichez votre entreprise, sa catégorie et sa localisation dans l&apos;annuaire public et sur l&apos;accueil.
                      </p>
                    </div>
                    <label className="ui-card-flat ui-border flex min-w-[220px] items-start gap-3 rounded-2xl border px-4 py-3">
                      <input
                        type="checkbox"
                        {...register("directoryVisibilityEnabled")}
                        className="mt-1 h-4 w-4 rounded border-[#DADADA] text-[#27624f] focus:ring-[#27624f]"
                      />
                      <span>
                        <span className="ui-text-main block text-sm font-semibold">Afficher mon entreprise</span>
                        <span className="ui-text-muted mt-1 block text-xs leading-5">
                          Vous pouvez désactiver cette option à tout moment.
                        </span>
                      </span>
                    </label>
                  </div>
                </div>

                <div className="ui-surface-soft ui-border rounded-[28px] border px-5 py-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="max-w-[44ch]">
                      <p className="ui-text-main text-sm font-semibold">Emails de notification</p>
                      <p className="ui-text-muted mt-2 text-sm leading-6">
                        Recevez un email quand quelqu&apos;un vous envoie un message sur vos annonces. Vous pourrez aussi vous désinscrire à tout moment via le lien présent dans les emails.
                      </p>
                    </div>
                    <label className="ui-card-flat ui-border flex min-w-[220px] items-start gap-3 rounded-2xl border px-4 py-3">
                      <input
                        type="checkbox"
                        {...register("notificationEmailsEnabled")}
                        className="mt-1 h-4 w-4 rounded border-[#DADADA] text-[#27624f] focus:ring-[#27624f]"
                      />
                      <span>
                        <span className="ui-text-main block text-sm font-semibold">Recevoir ces emails</span>
                        <span className="ui-text-muted mt-1 block text-xs leading-5">
                          Si vous désactivez cette option, la cloche dans l&apos;app continuera de fonctionner mais plus aucun email de message ne sera envoyé.
                        </span>
                      </span>
                    </label>
                  </div>
                </div>

              </Profile.Content>
            </Profile.FormGrid>

            {formError ? <p className="text-sm text-[#27624f]">{formError}</p> : null}

            <Profile.Actions>
              <button
                type="submit"
                disabled={!isDirty || isSubmitting || isUploadingProfilePhoto}
                className="rounded-2xl border border-transparent bg-[#27624f] px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-[#27624f] hover:bg-transparent hover:text-[#27624f] disabled:cursor-not-allowed disabled:border-transparent disabled:bg-[#F1B8BB] disabled:text-white"
              >
                {isSubmitting ? "Enregistrement..." : isUploadingProfilePhoto ? "Upload de la photo..." : "Enregistrer les modifications"}
              </button>
              <Link
                href="/profil"
                className="ui-text-muted ui-border-strong rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
              >
                Annuler
              </Link>
            </Profile.Actions>
          </form>

          <div className="mt-6">
            <PasswordSecuritySection isGoogleAccount={user?.authProvider === "google"} />
          </div>
          <AccountDeletionSection isGoogleAccount={user?.authProvider === "google"} onDeleted={logout} />
        </Profile.FormCard>
      </Profile.TwoColumn>
    </Profile>
  );
}
