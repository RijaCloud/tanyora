"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { useAuth } from "@/features/prototype/app/context/AuthContext";
import { emitSuccessToast } from "@/features/prototype/lib/client-toast";
import { uploadProfilePhotoToStorage } from "@/lib/client/profile-photo-upload";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import { sanitizeReturnTo } from "@/lib/auth/flow";
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/phone";
import { getFirstPasswordRequirementFailure, getPasswordRequirementResults } from "@/lib/auth/password-policy";

const ONBOARDING_AUTH_DRAFT_KEY = "onboarding-auth-draft";

function Field({
  label,
  required = false,
  error,
  hint,
  isValid = false,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: React.ReactNode;
  isValid?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={`mb-2 block text-sm font-medium ${isValid ? "text-emerald-700" : required ? "text-[#27624f]" : "ui-text-main"}`}>
        {label}
        {required ? <span className={isValid ? "text-emerald-700" : "text-[#27624f]"}> *</span> : null}
      </span>
      {children}
      {error ? <p className="mt-2 text-xs text-[#27624f]">{error}</p> : null}
      {!error && hint ? <div className="ui-text-muted mt-2 text-xs">{hint}</div> : null}
    </label>
  );
}

const onboardingInputClassName =
  "ui-text-main ui-border-strong w-full rounded-2xl border bg-transparent px-4 py-3 text-sm outline-none transition focus:border-[var(--text-muted)] placeholder:text-[var(--text-soft)]";

const onboardingDisabledInputClassName =
  `${onboardingInputClassName} disabled:bg-[var(--surface-2)] disabled:text-[var(--text-muted)]`;

function withValidatedFieldState(className: string, isValid: boolean) {
  return isValid
    ? `${className} border-emerald-500 bg-emerald-50/40 focus:border-emerald-600 dark:bg-emerald-950/20`
    : className;
}

const socialSchema = z.object({
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  x: z.string().optional(),
  youtube: z.string().optional(),
});

const optionalProfilePhotoField = z
  .union([
    z.literal(""),
    z.string().url("Entrez une URL valide."),
  ])
  .optional();

function createOnboardingSchema(skipPasswordChecks: boolean) {
  return z
    .object({
      firstName: z.string().min(2, "Prénom trop court"),
      lastName: z.string().min(2, "Nom trop court"),
      email: z.email("Email invalide"),
      password: z.string().optional(),
      confirmPassword: z.string().optional(),
      phone: z.string().trim().refine((value) => isValidPhoneNumber(value), "Numéro invalide"),
      birthDate: z
        .string()
        .regex(/^(|\d{2}\/\d{2}\/\d{4})$/, "Utilisez le format DD/MM/YYYY")
        .refine((value) => {
          if (!value) return true;
          const date = parseBirthDate(value);
          if (!date) return false;

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return date < today;
        }, "La date de naissance doit être une date valide antérieure à aujourd'hui")
        .optional(),
      address: z.string().optional(),
      businessActivityCategory: z.string().optional(),
      businessRegions: z.array(z.string().min(1)).length(1, "Sélectionnez une région."),
      businessCities: z.array(z.string().min(1)).max(1, "Sélectionnez une seule ville."),
      profilePhoto: optionalProfilePhotoField,
      socialLinks: socialSchema,
    })
    .superRefine((data, context) => {
      if (skipPasswordChecks) {
        return;
      }

      const failedRequirement = getFirstPasswordRequirementFailure(data.password || "");
      if (failedRequirement) {
        context.addIssue({
          code: "custom",
          path: ["password"],
          message: failedRequirement.label,
        });
      }

      if (!data.confirmPassword) {
        context.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: "Confirmez le mot de passe",
        });
      }

      if ((data.password || "") !== (data.confirmPassword || "")) {
        context.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: "Les mots de passe ne correspondent pas.",
        });
      }
    });
}

type OnboardingFormValues = z.infer<ReturnType<typeof createOnboardingSchema>>;

type AvailabilityState = {
  email?: { available: boolean; message: string };
};

type PublicTaxonomyTerm = {
  id?: number;
  name: string;
  slug?: string;
  parentId?: number | null;
  parentName?: string | null;
};

function parseBirthDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;

  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }

  return date;
}

function formatBirthDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function generateDevPassword() {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const specials = "!@#$%^&*";
  const all = `${uppercase}${lowercase}${numbers}${specials}`;

  const picks = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    specials[Math.floor(Math.random() * specials.length)],
  ];

  while (picks.length < 16) {
    picks.push(all[Math.floor(Math.random() * all.length)]);
  }

  return picks.sort(() => Math.random() - 0.5).join("");
}

function OnboardingSkeleton({ isGoogleMethod }: { isGoogleMethod: boolean }) {
  return (
    <main className="ui-page min-h-screen px-4 py-8 md:px-6 md:py-12">
      <div className="mx-auto grid max-w-[1400px] gap-8 lg:grid-cols-[0.76fr_1.24fr] lg:items-start">
        <section className="rounded-[32px] bg-[linear-gradient(135deg,#111111,#222222)] p-8 text-white md:min-h-[820px] md:p-10">
          <div className="h-6 w-28 animate-pulse rounded-full bg-white/10" />
          <div className="mt-4 h-14 w-full max-w-[16ch] animate-pulse rounded-[20px] bg-white/10 md:h-16" />
          <div className="mt-5 h-4 w-full max-w-[54ch] animate-pulse rounded-full bg-white/10" />
          <div className="mt-3 h-4 w-11/12 max-w-[48ch] animate-pulse rounded-full bg-white/10" />
          <div className="mt-8 space-y-3 rounded-[24px] bg-white/5 p-5">
            <div className="h-4 w-1/2 animate-pulse rounded-full bg-white/10" />
            <div className="h-4 w-full animate-pulse rounded-full bg-white/10" />
            <div className="h-4 w-10/12 animate-pulse rounded-full bg-white/10" />
          </div>
        </section>

        <section className="ui-card rounded-[28px] p-6 md:min-h-[820px] md:p-8">
          <div className="space-y-5">
            <div className="h-4 w-24 animate-pulse rounded-full bg-[var(--surface-2)]" />
            <div className="h-8 w-64 animate-pulse rounded-2xl bg-[var(--surface-2)]" />
            <div className="h-4 w-full max-w-[44ch] animate-pulse rounded-full bg-[var(--surface-2)]" />
            <div className="grid gap-5 md:grid-cols-2">
              <div className="h-14 animate-pulse rounded-2xl bg-[var(--surface-2)]" />
              <div className="hidden md:block" />
              <div className="h-14 animate-pulse rounded-2xl bg-[var(--surface-2)]" />
              <div className="h-14 animate-pulse rounded-2xl bg-[var(--surface-2)]" />
              <div className="h-14 animate-pulse rounded-2xl bg-[var(--surface-2)]" />
              <div className="h-14 animate-pulse rounded-2xl bg-[var(--surface-2)]" />
              <div className="h-[74px] animate-pulse rounded-2xl bg-[var(--surface-2)]" />
              <div className="h-14 animate-pulse rounded-2xl bg-[var(--surface-2)]" />
            </div>
            <div className="ui-surface-soft ui-border flex items-center gap-4 rounded-[24px] border p-4">
              <div className="h-16 w-16 animate-pulse rounded-2xl bg-[var(--surface-3)]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded-full bg-[var(--surface-3)]" />
                <div className="h-4 w-56 animate-pulse rounded-full bg-[var(--surface-2)]" />
              </div>
            </div>
            {!isGoogleMethod ? (
              <div className="grid gap-5 md:grid-cols-2">
                <div className="h-[110px] animate-pulse rounded-2xl bg-[var(--surface-2)]" />
                <div className="h-14 animate-pulse rounded-2xl bg-[var(--surface-2)]" />
              </div>
            ) : null}
            <div className="grid gap-5 md:grid-cols-2">
              <div className="h-14 animate-pulse rounded-2xl bg-[var(--surface-2)]" />
              <div className="hidden md:block" />
            </div>
            <div className="space-y-4">
              <div className="h-4 w-40 animate-pulse rounded-full bg-[var(--surface-2)]" />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="h-14 animate-pulse rounded-2xl bg-[var(--surface-2)]" />
                <div className="h-14 animate-pulse rounded-2xl bg-[var(--surface-2)]" />
                <div className="h-14 animate-pulse rounded-2xl bg-[var(--surface-2)]" />
                <div className="h-14 animate-pulse rounded-2xl bg-[var(--surface-2)]" />
              </div>
            </div>
            <div className="pt-2">
              <div className="h-12 w-full max-w-[260px] animate-pulse rounded-2xl bg-[#f1c2c4]" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading: isAuthLoading, refreshSession, user } = useAuth();
  const method = searchParams?.get("method") === "google" ? "google" : "email";
  const isGoogleMethod = method === "google";
  const hasAuthenticatedEmailSession = Boolean(!isGoogleMethod && user?.wpUserId);
  const onboardingIntent = user?.onboardingIntent || (isGoogleMethod ? "complete-profile" : "signup");
  const isLocalOnboardingSession = Boolean(user?.authProvider === "local" && user?.onboardingCompleted === false);
  const shouldRequirePassword = !isGoogleMethod && !hasAuthenticatedEmailSession;
  const shouldValidateEmailAvailability = !isGoogleMethod && !hasAuthenticatedEmailSession;
  const returnTo = sanitizeReturnTo(searchParams?.get("returnTo") || "/");
  const [formError, setFormError] = useState("");
  const [availability, setAvailability] = useState<AvailabilityState>({});
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isFinalizingFlow, setIsFinalizingFlow] = useState(false);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");
  const [isUploadingProfilePhoto, setIsUploadingProfilePhoto] = useState(false);
  const [businessActivityOptions, setBusinessActivityOptions] = useState<string[]>([]);
  const [regionOptions, setRegionOptions] = useState<string[]>([]);
  const [cityOptionsByRegion, setCityOptionsByRegion] = useState<Record<string, string[]>>({});
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null);
  const hydratedProfileUserIdRef = useRef<number | null>(null);
  const hasSyncedOnboardingStateRef = useRef(false);
  const isDevMode = process.env.NODE_ENV !== "production";

  const onboardingSchema = useMemo(() => createOnboardingSchema(!shouldRequirePassword), [shouldRequirePassword]);
  const defaultValues = useMemo<OnboardingFormValues>(
    () => ({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "+261",
      birthDate: "",
      address: "",
      businessActivityCategory: "",
      businessRegions: [],
      businessCities: [],
      profilePhoto: "",
      socialLinks: {
        facebook: "",
        instagram: "",
        x: "",
        youtube: "",
      },
    }),
    [],
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    getValues,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting, isValid, dirtyFields },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    mode: "onChange",
    defaultValues,
  });

  const watchedEmail = watch("email");
  const watchedFirstName = watch("firstName");
  const watchedLastName = watch("lastName");
  const watchedPhone = watch("phone");
  const watchedBirthDate = watch("birthDate");
  const watchedAddress = watch("address");
  const watchedBusinessActivityCategory = watch("businessActivityCategory");
  const watchedBusinessCities = watch("businessCities") || [];
  const watchedPassword = watch("password");
  const watchedConfirmPassword = watch("confirmPassword");
  const watchedProfilePhoto = watch("profilePhoto");
  const watchedBusinessRegions = watch("businessRegions") || [];
  const displayedProfilePhoto = profilePhotoPreview || watchedProfilePhoto || "";
  const selectedRegion = watchedBusinessRegions[0] || "";
  const availableCityOptions = useMemo(
    () => (selectedRegion ? cityOptionsByRegion[selectedRegion] || [] : []),
    [cityOptionsByRegion, selectedRegion],
  );
  const shouldHideOnboardingContent =
    isFinalizingFlow ||
    isAuthLoading ||
    (isGoogleMethod && (!user || user.onboardingCompleted !== false));
  const isEmailAvailable = isGoogleMethod
    ? true
    : !shouldValidateEmailAvailability
      ? true
      : watchedEmail?.trim()
      ? availability.email?.available !== false
      : false;
  const canSubmit = isValid && !isSubmitting && !isFinalizingFlow && !isCheckingAvailability && isEmailAvailable;

  const passwordChecks = getPasswordRequirementResults(watchedPassword || "");
  const isLastNameValid = (watchedLastName || "").trim().length >= 2;
  const isFirstNameValid = (watchedFirstName || "").trim().length >= 2;
  const isEmailFieldValid =
    z.email().safeParse(watchedEmail || "").success &&
    !errors.email &&
    !isCheckingAvailability &&
    (!shouldValidateEmailAvailability || availability.email?.available === true);
  const isPhoneFieldValid = isValidPhoneNumber(watchedPhone || "");
  const isBirthDateValid = Boolean(watchedBirthDate && parseBirthDate(watchedBirthDate));
  const isAddressValid = Boolean(watchedAddress?.trim());
  const isBusinessActivityValid = Boolean(watchedBusinessActivityCategory?.trim());
  const isRegionValid = watchedBusinessRegions.length === 1 && Boolean(watchedBusinessRegions[0]);
  const isCityValid = watchedBusinessCities.length === 1 && Boolean(watchedBusinessCities[0]);
  const isPasswordFieldValid = passwordChecks.every((check) => check.ok);
  const isConfirmPasswordValid = Boolean(watchedConfirmPassword) && watchedConfirmPassword === watchedPassword && isPasswordFieldValid;

  function handleGenerateDevPassword() {
    const nextPassword = generateDevPassword();
    setValue("password", nextPassword, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
    setValue("confirmPassword", nextPassword, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
  }

  function handleRemoveProfilePhoto() {
    setProfilePhotoPreview("");
    setValue("profilePhoto", "", { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    clearErrors("profilePhoto");
    if (profilePhotoInputRef.current) {
      profilePhotoInputRef.current.value = "";
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

  useEffect(() => {
    let isCancelled = false;

    async function loadDirectoryProfileOptions() {
      try {
        const [categoriesResponse, locationsResponse] = await Promise.all([
          fetch("/api/public/categories/directory", { cache: "no-store" }),
          fetch("/api/public/locations/directory", { cache: "no-store" }),
        ]);

        const categoriesPayload = await categoriesResponse.json().catch(() => null);
        const locationsPayload = await locationsResponse.json().catch(() => null);

        if (isCancelled) {
          return;
        }

        const nextBusinessActivities = Array.isArray(categoriesPayload?.terms)
          ? Array.from(
              new Set(
                (categoriesPayload.terms as PublicTaxonomyTerm[])
                  .filter((term) => !term.parentId && !term.parentName)
                  .map((term) => String(term.name || "").trim())
                  .filter(Boolean),
              ),
            ).sort((left, right) => left.localeCompare(right, "fr", { sensitivity: "base" }))
          : [];

        const locationTerms = Array.isArray(locationsPayload?.terms)
          ? (locationsPayload.terms as PublicTaxonomyTerm[])
          : [];
        const nextRegionOptions = Array.from(
          new Set(
            locationTerms
              .filter((term) => !term.parentId && !term.parentName)
              .map((term) => String(term.name || "").trim())
              .filter(Boolean),
          ),
        ).sort((left, right) => left.localeCompare(right, "fr", { sensitivity: "base" }));

        const nextCityOptionsByRegion = Object.fromEntries(
          nextRegionOptions.map((region) => {
            const cities = Array.from(
              new Set(
                locationTerms
                  .filter((term) => String(term.parentName || "").trim().toLowerCase() === region.trim().toLowerCase())
                  .map((term) => String(term.name || "").trim())
                  .filter(Boolean),
              ),
            ).sort((left, right) => left.localeCompare(right, "fr", { sensitivity: "base" }));

            return [region, cities];
          }),
        );

        setBusinessActivityOptions(nextBusinessActivities);
        setRegionOptions(nextRegionOptions);
        setCityOptionsByRegion(nextCityOptionsByRegion);
      } catch (error) {
        console.error("[onboarding] directory profile options failed", error);
      }
    }

    loadDirectoryProfileOptions();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isGoogleMethod) {
      return;
    }

    const rawDraft = window.sessionStorage.getItem(ONBOARDING_AUTH_DRAFT_KEY);
    if (!rawDraft) {
      return;
    }

    try {
      const draft = JSON.parse(rawDraft) as { email?: string; password?: string };
      if (draft.email) {
        setValue("email", draft.email, { shouldValidate: true, shouldDirty: true });
      }
      if (draft.password) {
        setValue("password", draft.password, { shouldValidate: true, shouldDirty: true });
        setValue("confirmPassword", draft.password, { shouldValidate: true, shouldDirty: true });
      }
    } catch {
      // ignore malformed drafts
    } finally {
      window.sessionStorage.removeItem(ONBOARDING_AUTH_DRAFT_KEY);
    }
  }, [isGoogleMethod, setValue]);

  useEffect(() => {
    if (!isGoogleMethod || !user) {
      return;
    }

    setValue("email", user.email || "", { shouldValidate: true });
    setValue("firstName", user.firstName || "", { shouldValidate: true });
    setValue("lastName", user.lastName || "", { shouldValidate: true });
    setValue("profilePhoto", user.picture || "", { shouldValidate: true });
    setProfilePhotoPreview(user.picture || "");
  }, [isGoogleMethod, setValue, user]);

  useEffect(() => {
    if (isGoogleMethod || !user || !isLocalOnboardingSession) {
      return;
    }

    setValue("email", user.email || "", { shouldValidate: true });
  }, [isGoogleMethod, isLocalOnboardingSession, setValue, user]);

  useEffect(() => {
    if (!user?.wpUserId) {
      hydratedProfileUserIdRef.current = null;
      return;
    }

    const currentUserId = user.wpUserId;

    if (hydratedProfileUserIdRef.current === currentUserId) {
      return;
    }

    let isCancelled = false;

    async function hydrateExistingProfile() {
      try {
        const response = await fetch("/api/auth/profile", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const profile = data.profile;
        if (!profile || isCancelled) {
          return;
        }

        const currentValues = getValues();

        if (!dirtyFields.email && profile.email) {
          setValue("email", profile.email, { shouldValidate: true });
        }
        if (!dirtyFields.firstName && profile.firstName) {
          setValue("firstName", profile.firstName, { shouldValidate: true });
        }
        if (!dirtyFields.lastName && profile.lastName) {
          setValue("lastName", profile.lastName, { shouldValidate: true });
        }
        if (!dirtyFields.phone && profile.phone) {
          setValue("phone", profile.phone, { shouldValidate: true });
        }
        if (!dirtyFields.birthDate && profile.birthDate) {
          setValue("birthDate", profile.birthDate, { shouldValidate: true });
        }
        if (!dirtyFields.address && profile.address) {
          setValue("address", profile.address, { shouldValidate: true });
        }
        if (!dirtyFields.businessActivityCategory && profile.businessActivityCategory) {
          setValue("businessActivityCategory", profile.businessActivityCategory, { shouldValidate: true });
        }
        if (!dirtyFields.businessRegions && Array.isArray(profile.businessRegions) && profile.businessRegions.length > 0) {
          setValue("businessRegions", profile.businessRegions.slice(0, 1), { shouldValidate: true });
        }
        if (!dirtyFields.businessCities && Array.isArray(profile.businessCities) && profile.businessCities.length > 0) {
          setValue("businessCities", profile.businessCities.slice(0, 1), { shouldValidate: true });
        }
        if (!dirtyFields.profilePhoto && profile.profilePhoto) {
          setValue("profilePhoto", profile.profilePhoto, { shouldValidate: true });
          if (!currentValues.profilePhoto) {
            setProfilePhotoPreview(profile.profilePhoto);
          }
        }

        const profileSocialLinks = profile.socialLinks || {};
        if (!dirtyFields.socialLinks?.facebook && profileSocialLinks.facebook) {
          setValue("socialLinks.facebook", profileSocialLinks.facebook, { shouldValidate: true });
        }
        if (!dirtyFields.socialLinks?.instagram && profileSocialLinks.instagram) {
          setValue("socialLinks.instagram", profileSocialLinks.instagram, { shouldValidate: true });
        }
        if (!dirtyFields.socialLinks?.x && profileSocialLinks.x) {
          setValue("socialLinks.x", profileSocialLinks.x, { shouldValidate: true });
        }
        if (!dirtyFields.socialLinks?.youtube && profileSocialLinks.youtube) {
          setValue("socialLinks.youtube", profileSocialLinks.youtube, { shouldValidate: true });
        }

        hydratedProfileUserIdRef.current = currentUserId;
      } catch (error) {
        console.error("[onboarding] profile hydration failed", error);
      }
    }

    hydrateExistingProfile();

    return () => {
      isCancelled = true;
    };
  }, [dirtyFields, getValues, setValue, user]);

  useEffect(() => {
    const selectedCities = getValues("businessCities") || [];
    const nextCity = selectedCities[0] && availableCityOptions.includes(selectedCities[0]) ? [selectedCities[0]] : [];
    if (nextCity.join("|") !== selectedCities.join("|")) {
      setValue("businessCities", nextCity, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    }
  }, [availableCityOptions, getValues, setValue]);

  useEffect(() => {
    if (
      isAuthLoading ||
      !user?.wpUserId ||
      user.onboardingCompleted !== false ||
      hasSyncedOnboardingStateRef.current
    ) {
      return;
    }

    // A separate browser session may have completed the profile after this
    // cookie was issued. Reconcile once with WordPress before showing the form.
    hasSyncedOnboardingStateRef.current = true;
    void refreshSession().catch(() => undefined);
  }, [isAuthLoading, refreshSession, user?.onboardingCompleted, user?.wpUserId]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (isGoogleMethod && !user) {
      router.replace("/login");
      return;
    }

    if (user?.onboardingCompleted && !isFinalizingFlow) {
      router.replace(returnTo);
    }
  }, [isAuthLoading, isFinalizingFlow, isGoogleMethod, returnTo, router, user]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    const email = watchedEmail?.trim();
    const currentEmail = (user?.email || "").trim();
    const normalize = (value: string) => value.trim().toLowerCase();
    const isCurrentEmail = Boolean(email) && normalize(email || "") === normalize(currentEmail);

    if (!shouldValidateEmailAvailability) {
      if (errors.email?.type === "server") {
        clearErrors("email");
      }
      setAvailability({});
      setIsCheckingAvailability(false);
      return;
    }

    if (!email) {
      setAvailability({});
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsCheckingAvailability(true);
      try {
        const response = await fetch("/api/auth/availability", {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(getUserFacingErrorMessage(data?.error, "Validation impossible."));
        }

        const nextAvailability: AvailabilityState = {};

        if (email && shouldValidateEmailAvailability) {
          const emailAvailable = isCurrentEmail ? true : Boolean(data.email?.available);
          nextAvailability.email = {
            available: emailAvailable,
            message: emailAvailable
              ? isCurrentEmail
                ? "Votre email actuel"
                : "Email disponible"
              : "Cet email est deja utilise",
          };

          if (!emailAvailable) {
            setError("email", { type: "server", message: "Cet email est deja utilise." });
          } else if (errors.email?.type === "server") {
            clearErrors("email");
          }
        }

        setAvailability(nextAvailability);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("[onboarding] availability check failed", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsCheckingAvailability(false);
        }
      }
    }, 450);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [isAuthLoading, watchedEmail, user?.email, clearErrors, errors.email?.type, shouldValidateEmailAvailability, setError]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError("");
    setIsFinalizingFlow(false);

    try {
      const normalizedPhone = normalizePhoneNumber(values.phone);
      if (!normalizedPhone) {
        setError("phone", { type: "manual", message: "Numéro invalide" });
        return;
      }

      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          phone: normalizedPhone,
          birthDate: values.birthDate,
          address: values.address,
          businessActivityCategory: values.businessActivityCategory,
          businessRegions: values.businessRegions.slice(0, 1),
          businessCities: values.businessCities.slice(0, 1),
          profilePhoto: values.profilePhoto,
          socialLinks: values.socialLinks,
          completeOnboarding: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(getUserFacingErrorMessage(data?.error, "Inscription impossible."));
      }

      emitSuccessToast(
        isGoogleMethod
          ? "Profil finalisé. Redirection en cours..."
          : "Inscription réussie. Redirection en cours...",
      );
      setIsFinalizingFlow(true);

      window.setTimeout(() => {
        const destination = onboardingIntent === "signup"
          ? `/bienvenue?returnTo=${encodeURIComponent(returnTo)}`
          : returnTo;
        window.location.assign(destination);
      }, 1800);

      refreshSession().catch(() => undefined);
    } catch (submitError) {
      console.error("[onboarding] submit failed", submitError);
      setFormError(getUserFacingErrorMessage(submitError, "Une erreur s'est produite."));
    }
  });

  if (shouldHideOnboardingContent) {
    return <OnboardingSkeleton isGoogleMethod={isGoogleMethod} />;
  }

  return (
    <main className="ui-page min-h-screen px-4 py-8 md:px-6 md:py-12">
      <div className="mx-auto grid max-w-[1400px] gap-8 lg:grid-cols-[0.76fr_1.24fr] lg:items-start">
        <section className="rounded-[32px] bg-[linear-gradient(135deg,#111111,#222222)] p-8 text-white shadow-[0_28px_80px_rgba(17,17,17,0.18)] md:p-10 dark:border dark:border-white/10">
          <p className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#ffb5b8]">
            Onboarding
          </p>
          <h1 className="max-w-[14ch] text-4xl font-semibold leading-tight md:text-5xl">
            Créez votre profil Tanyora
          </h1>
          <p className="mt-5 max-w-[54ch] text-sm leading-7 text-white/75">
            {isGoogleMethod
              ? "Votre connexion Google est réussie. Complétez les informations obligatoires pour accéder à Tanyora."
              : "Complétez votre profil pour accéder à votre espace personnel, retrouver vos contenus et publier plus tard sur Tanyora."}
          </p>
          <div className="mt-8 space-y-3 rounded-[24px] bg-white/5 p-5 text-sm text-white/80">
            <p>
              Mode d'inscription :{" "}
              <span className="font-semibold uppercase text-white">
                {isGoogleMethod ? "Google" : "Email et mot de passe"}
              </span>
            </p>
            <p className="font-semibold text-white">Cette étape est obligatoire avant de pouvoir utiliser la plateforme.</p>
            <p>
              {isGoogleMethod
                ? "Remplissez les champs marqués d'un * pour continuer."
                : "La disponibilité de l'email est vérifiée automatiquement pendant la saisie."}
            </p>
          </div>
        </section>

        <section className="ui-card rounded-[28px] p-6 md:p-8">
          <div className="mb-8">
            <div className="flex flex-wrap items-start gap-3">
              <h2 className="ui-text-main shrink-0 pt-1 text-2xl font-semibold">
                {isGoogleMethod ? "Activez votre compte Tanyora" : "Informations de profil"}
              </h2>
              <span className="max-w-full rounded-full bg-[#27624f] px-3 py-1.5 text-xs font-semibold leading-5 text-white sm:min-w-[18rem] sm:max-w-[26rem] sm:flex-1">
                Veuillez remplir tous les champs obligatoires pour poursuivre votre navigation sur les autres pages.
              </span>
            </div>
            <p className="ui-text-muted mt-2 text-sm leading-6">
              {isGoogleMethod
                ? "Renseignez les champs obligatoires ci-dessous, puis cliquez sur « Finaliser mon profil »."
                : "Renseignez les champs obligatoires ci-dessous, puis cliquez sur « Enregistrer » pour accéder à Tanyora."}
            </p>
          </div>

          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="grid gap-8 xl:grid-cols-[170px_minmax(0,1fr)] 2xl:grid-cols-[180px_minmax(0,1fr)]">
              <aside className="space-y-5">
                <div className="flex items-center gap-4 xl:block">
                  <div className="relative mx-auto flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-[4px] border-[#27624f] bg-[var(--surface-2)] shadow-[0_10px_30px_rgba(214,31,38,0.14)] xl:mx-0">
                    {displayedProfilePhoto ? (
                      <img alt="" className="h-full w-full object-cover" src={displayedProfilePhoto} />
                    ) : (
                      <span className="text-2xl font-semibold uppercase text-[#27624f]">
                        {(watch("firstName") || watchedEmail || "24").slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 xl:mt-4">
                    <p className="ui-text-main text-sm font-semibold">
                      {isGoogleMethod ? "Photo issue de Google" : "Photo de profil"}
                    </p>
                    <p className="ui-text-muted mt-1 text-xs leading-5">
                      Ajoutez une photo nette pour personnaliser votre compte.
                    </p>
                  </div>
                </div>

                <Field label="Photo de profil" error={errors.profilePhoto?.message} hint="Facultatif">
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
                      onClick={() => profilePhotoInputRef.current?.click()}
                      className="ui-text-main ui-border-strong flex w-full items-center justify-between rounded-2xl border border-dashed bg-transparent px-4 py-3 text-left text-sm transition-colors hover:border-[#27624f]"
                    >
                      <span>{isUploadingProfilePhoto ? "Upload en cours..." : displayedProfilePhoto ? "Changer la photo" : "Importer une photo"}</span>
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
                </Field>

                {!isGoogleMethod ? (
                  <div className="space-y-2 text-sm">
                    <p className="ui-text-main font-medium">
                      {onboardingIntent === "signup" ? "Inscription par email" : "Finalisation du profil"}
                    </p>
                    <p className="ui-text-muted leading-6">Ces informations serviront à compléter votre profil Tanyora.</p>
                  </div>
                ) : null}
              </aside>

              <div className="space-y-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Nom" required error={errors.lastName?.message} isValid={isLastNameValid}>
                    <input
                      {...register("lastName")}
                      className={withValidatedFieldState(onboardingInputClassName, isLastNameValid)}
                      placeholder="NANDRIANINA"
                    />
                  </Field>
                  <Field label="Prénom" required error={errors.firstName?.message} isValid={isFirstNameValid}>
                    <input
                      {...register("firstName")}
                      className={withValidatedFieldState(onboardingInputClassName, isFirstNameValid)}
                      placeholder="Voary Nirina"
                    />
                  </Field>

                  <Field
                    label="Email"
                    required
                    error={errors.email?.message}
                    isValid={isEmailFieldValid}
                    hint={
                      shouldValidateEmailAvailability && availability.email ? (
                        <span className={availability.email.available ? "text-emerald-600" : "text-[#27624f]"}>
                          {availability.email.message}
                        </span>
                      ) : shouldValidateEmailAvailability && isCheckingAvailability && watchedEmail ? (
                        "Vérification..."
                      ) : null
                    }
                  >
                    <input
                      type="email"
                      {...register("email")}
                      disabled={isGoogleMethod || hasAuthenticatedEmailSession || isLocalOnboardingSession}
                      className={withValidatedFieldState(onboardingDisabledInputClassName, isEmailFieldValid)}
                      placeholder="username@gmail.com"
                    />
                  </Field>
                  <Field label="Numéro de téléphone" required error={errors.phone?.message} isValid={isPhoneFieldValid}>
                    <div className={withValidatedFieldState("phone-picker-shell ui-border-strong rounded-2xl border bg-transparent px-2 py-1 transition focus-within:border-[var(--text-muted)]", isPhoneFieldValid)}>
                      <Controller
                        control={control}
                        name="phone"
                        render={({ field }) => (
                            <PhoneInput
                              defaultCountry="mg"
                              value={field.value}
                              onChange={(value) => field.onChange(value)}
                              inputClassName="!w-full !border-0 !bg-transparent !px-3 !py-2 !text-sm !text-[var(--text-main)] placeholder:!text-[var(--text-soft)] focus:!ring-0"
                              countrySelectorStyleProps={{
                                buttonClassName: "!border-0 !bg-transparent hover:!bg-transparent",
                                dropdownStyleProps: { className: "!z-[120]" },
                              }}
                          />
                        )}
                      />
                    </div>
                  </Field>

                  <Field
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
                          className={withValidatedFieldState(onboardingInputClassName, isBirthDateValid)}
                          placeholder="DD/MM/YYYY"
                        />
                      )}
                    />
                  </Field>
                  <Field label="Adresse" error={errors.address?.message} isValid={isAddressValid}>
                    <input
                      {...register("address")}
                      className={withValidatedFieldState(onboardingInputClassName, isAddressValid)}
                      placeholder="Antananarivo, Madagascar"
                    />
                  </Field>

                  <Field label="Catégorie d'activité" error={errors.businessActivityCategory?.message} isValid={isBusinessActivityValid}>
                    <select {...register("businessActivityCategory")} className={withValidatedFieldState(onboardingInputClassName, isBusinessActivityValid)}>
                      <option value="">Sélectionner une catégorie</option>
                      {businessActivityOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label="Région"
                    required
                    error={errors.businessRegions?.message}
                    isValid={isRegionValid}
                    hint="Choisissez la région principale où votre activité est présente."
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
                          className={withValidatedFieldState(onboardingInputClassName, isRegionValid)}
                        >
                          <option value="">Sélectionner une région</option>
                          {regionOptions.map((region) => (
                            <option key={region} value={region}>
                              {region}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                  </Field>

                  <Field
                    label="Ville"
                    error={errors.businessCities?.message}
                    isValid={isCityValid}
                    hint={
                      selectedRegion
                        ? "Optionnel. Choisissez la ville principale associée à cette région."
                        : "Sélectionnez d'abord une région pour choisir une ville."
                    }
                  >
                    <Controller
                      control={control}
                      name="businessCities"
                      render={({ field }) => (
                        <select
                          value={field.value[0] || ""}
                          onChange={(event) => field.onChange(event.target.value ? [event.target.value] : [])}
                          disabled={!selectedRegion || availableCityOptions.length === 0}
                          className={withValidatedFieldState(`${onboardingInputClassName} disabled:cursor-not-allowed disabled:opacity-60`, isCityValid)}
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
                  </Field>
                </div>

                {shouldRequirePassword ? (
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field
                      label="Mot de passe"
                      required
                      error={errors.password?.message}
                      isValid={isPasswordFieldValid}
                      hint={
                        <div className="space-y-2">
                          {passwordChecks.map((check) => (
                            <div key={check.label} className={check.ok ? "text-emerald-600" : "text-[#7a7a7a]"}>
                              {check.ok ? "OK" : "-"} {check.label}
                            </div>
                          ))}
                          {isDevMode ? (
                            <button
                              type="button"
                              onClick={handleGenerateDevPassword}
                              className="rounded-full border border-[#27624f] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#27624f] transition-colors hover:bg-[#27624f] hover:text-white"
                            >
                              Générer un mot de passe de test
                            </button>
                          ) : null}
                        </div>
                      }
                    >
                        <input
                          type="password"
                          {...register("password")}
                          className={withValidatedFieldState(onboardingInputClassName, isPasswordFieldValid)}
                          placeholder="Votre mot de passe"
                        />
                    </Field>
                    <Field label="Confirmer le mot de passe" required error={errors.confirmPassword?.message} isValid={isConfirmPasswordValid}>
                      <input
                        type="password"
                        {...register("confirmPassword")}
                        className={withValidatedFieldState(onboardingInputClassName, isConfirmPasswordValid)}
                        placeholder="Saisissez à nouveau le mot de passe"
                      />
                    </Field>
                  </div>
                ) : null}

                <div>
                  <p className="ui-text-main mb-3 text-sm font-medium">Liens réseaux sociaux</p>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Field label="Facebook">
                      <input
                        {...register("socialLinks.facebook")}
                        className={onboardingInputClassName}
                        placeholder="https://www.facebook.com/..."
                      />
                    </Field>
                    <Field label="Instagram">
                      <input
                        {...register("socialLinks.instagram")}
                        className={onboardingInputClassName}
                        placeholder="https://www.instagram.com/..."
                      />
                    </Field>
                    <Field label="X">
                      <input
                        {...register("socialLinks.x")}
                        className={onboardingInputClassName}
                        placeholder="https://x.com/..."
                      />
                    </Field>
                    <Field label="Youtube">
                      <input
                        {...register("socialLinks.youtube")}
                        className={onboardingInputClassName}
                        placeholder="https://www.youtube.com/..."
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </div>

            {formError ? <p className="text-sm text-[#27624f]">{formError}</p> : null}

            <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="rounded-2xl border border-transparent bg-[#27624f] px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-[#27624f] hover:bg-transparent hover:text-[#27624f] disabled:cursor-not-allowed disabled:border-transparent disabled:bg-[#F1B8BB] disabled:text-white disabled:hover:bg-[#F1B8BB] disabled:hover:text-white"
                >
                  {isSubmitting || isFinalizingFlow
                    ? "Finalisation ..."
                  : isGoogleMethod
                    ? "Finaliser mon profil"
                    : "Enregistrer"}
              </button>
              <Link
                href={returnTo}
                className="ui-text-muted ui-border-strong rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
              >
                Retour
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

