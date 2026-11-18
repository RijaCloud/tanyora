"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppImage } from "@/components/ui/AppImage";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import type { FeaturePricingInfo } from "@/lib/pricing/feature-pricing";
import { trackListingFormOpened, trackListingSaved } from "@/lib/analytics/ga4";

type SubmissionKind = "classified" | "tender" | "article";

type SubmissionFormProps = {
  kind: SubmissionKind;
  title: string;
  description: string;
  includeBusinessFields?: boolean;
  enableClassifiedCheckout?: boolean;
  returnHref?: string;
  returnLabel?: string;
  pricingInfo?: FeaturePricingInfo;
};

export function SubmissionForm({
  kind,
  title,
  description,
  includeBusinessFields = false,
  enableClassifiedCheckout = false,
  returnHref,
  returnLabel,
  pricingInfo,
}: SubmissionFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const featuredImageInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    companyName: "",
    contactPhone: "",
    featuredImageUrl: "",
  });
  const [classifiedPhotoPack, setClassifiedPhotoPack] = useState<"1_photo" | "4_photo">("1_photo");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ status: "idle" | "success" | "error"; message?: string }>({
    status: "idle",
  });
  const [featuredImagePreview, setFeaturedImagePreview] = useState("");
  const isArticle = kind === "article";
  const resolvedReturnHref = useMemo(() => {
    if (returnHref) {
      return returnHref;
    }

    switch (kind) {
      case "classified":
        return "/petites-annonces";
      case "tender":
        return "/appel-offres";
      default:
        return "/actualites";
    }
  }, [kind, returnHref]);

  const resolvedReturnLabel = useMemo(() => {
    if (returnLabel) {
      return returnLabel;
    }

    switch (kind) {
      case "classified":
        return "Retour aux petites annonces";
      case "tender":
        return "Retour aux appels d'offres";
      default:
        return "Retour aux actualites";
    }
  }, [kind, returnLabel]);

  const submitLabel = useMemo(() => {
    switch (kind) {
      case "classified":
        return enableClassifiedCheckout ? "Continuer vers le paiement" : "Envoyer la petite annonce";
      case "tender":
        return "Envoyer l'appel d'offre";
      default:
        return "Soumettre l'article";
    }
  }, [enableClassifiedCheckout, kind]);
  const checkoutState = searchParams?.get("checkout") || "";

  useEffect(() => {
    if (kind === "classified" || kind === "tender") {
      trackListingFormOpened(kind);
    }
  }, [kind]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setResult({ status: "idle" });

    try {
      const response = await fetch(`/api/submissions/${kind}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(getUserFacingErrorMessage(payload?.error, "Une erreur est survenue pendant l'envoi."));
      }

      setResult({
        status: "success",
        message: "Votre contenu a bien ete envoye. Il sera examine avant publication.",
      });
      if (kind === "classified" || kind === "tender") {
        trackListingSaved(kind, "created");
      }
      setForm({
        title: "",
        excerpt: "",
        content: "",
        companyName: "",
        contactPhone: "",
        featuredImageUrl: "",
      });
      setFeaturedImagePreview("");
      if (featuredImageInputRef.current) {
        featuredImageInputRef.current.value = "";
      }
      router.refresh();
    } catch (error) {
      setResult({
        status: "error",
        message: getUserFacingErrorMessage(error, "Une erreur est survenue."),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField<Key extends keyof typeof form>(key: Key, value: (typeof form)[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleRemoveFeaturedImage() {
    setFeaturedImagePreview("");
    updateField("featuredImageUrl", "");
    if (featuredImageInputRef.current) {
      featuredImageInputRef.current.value = "";
    }
  }

  function handleFeaturedImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setResult({
        status: "error",
        message: "Choisissez un fichier image valide pour l'image mise en avant.",
      });
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setResult({
        status: "error",
        message: "L'image mise en avant doit faire moins de 5 Mo.",
      });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setFeaturedImagePreview(result);
      updateField("featuredImageUrl", result);
      setResult({ status: "idle" });
    };
    reader.onerror = () => {
      setResult({
        status: "error",
        message: "Impossible de lire cette image.",
      });
      event.target.value = "";
    };
    reader.readAsDataURL(file);
  }

  return (
    <section className="rounded-[28px] border border-[#EAEAEA] bg-white p-8">
      <div className="mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-[#27624f]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#27624f]">
              Soumission
            </p>
            <h1 className="text-3xl font-semibold text-[#111]">{title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#666]">{description}</p>
          </div>
          <Link
            href={resolvedReturnHref}
            className="inline-flex items-center justify-center rounded-2xl border border-[#111] px-5 py-3 text-sm font-semibold text-[#111] transition hover:border-[#27624f] hover:text-[#27624f]"
          >
            {resolvedReturnLabel}
          </Link>
        </div>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {pricingInfo ? (
          <div className="rounded-[24px] border border-[#EAEAEA] bg-[#fafafa] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#27624f]">{pricingInfo.title}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {pricingInfo.items.map((item) => (
                <div key={item.code} className="rounded-[18px] border border-[#E9E9E9] bg-white px-4 py-3">
                  <p className="text-sm font-semibold text-[#111]">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-[#111]">{item.priceLabel}</p>
                  {item.note ? <p className="mt-1 text-xs text-[#666]">{item.note}</p> : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#111]">Titre</span>
            <input
              required
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              className="w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm outline-none transition-colors focus:border-[#27624f]"
              placeholder="Titre de votre contenu"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#111]">Resume</span>
            <input
              value={form.excerpt}
              onChange={(event) => updateField("excerpt", event.target.value)}
              className="w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm outline-none transition-colors focus:border-[#27624f]"
              placeholder="Resume court pour la moderation"
            />
          </label>
        </div>

        {includeBusinessFields ? (
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#111]">Organisation / societe</span>
              <input
                value={form.companyName}
                onChange={(event) => updateField("companyName", event.target.value)}
                className="w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm outline-none transition-colors focus:border-[#27624f]"
                placeholder="Nom de l'organisation"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#111]">Telephone de contact</span>
              <input
                value={form.contactPhone}
                onChange={(event) => updateField("contactPhone", event.target.value)}
                className="w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm outline-none transition-colors focus:border-[#27624f]"
                placeholder="+261 ..."
              />
            </label>
          </div>
        ) : null}

        {kind === "classified" && enableClassifiedCheckout ? (
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#111]">Pack photos</span>
              <select
                value={classifiedPhotoPack}
                onChange={(event) => setClassifiedPhotoPack(event.target.value as "1_photo" | "4_photo")}
                className="w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm outline-none transition-colors focus:border-[#27624f]"
              >
                <option value="1_photo">Annonce de base (1 photo) - 10 000 Ar</option>
                <option value="4_photo">Annonce de base (4 photos) - 25 000 Ar</option>
              </select>
            </label>
          </div>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#111]">Image mise en avant</span>
          <div className="space-y-3">
            <input
              ref={featuredImageInputRef}
              type="file"
              accept="image/*"
              onChange={handleFeaturedImageChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => featuredImageInputRef.current?.click()}
              className="flex w-full items-center justify-between rounded-2xl border border-dashed border-[#DADADA] px-4 py-3 text-left text-sm text-[#111111] transition-colors hover:border-[#27624f]"
            >
              <span>{featuredImagePreview ? "Changer l'image" : "Importer une image"}</span>
              <span className="text-xs uppercase tracking-[0.18em] text-[#666666]">JPG PNG WEBP</span>
            </button>
            {featuredImagePreview ? (
              <div className="overflow-hidden rounded-[24px] border border-[#E5E7EB] bg-[#FAFAFA]">
                <AppImage alt="" className="h-48 w-full object-cover" src={featuredImagePreview} />
              </div>
            ) : null}
            {featuredImagePreview ? (
              <button
                type="button"
                onClick={handleRemoveFeaturedImage}
                className="text-xs font-medium text-[#27624f] transition-opacity hover:opacity-80"
              >
                Supprimer l'image
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-xs leading-5 text-[#666]">
            Ajoutez l&apos;image principale qui representera votre contenu.
          </p>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#111]">Contenu</span>
          {isArticle ? (
            <RichTextEditor
              value={form.content}
              onChange={(value) => updateField("content", value)}
              minHeight={420}
              placeholder="Redigez votre article ici"
            />
          ) : (
            <textarea
              required
              value={form.content}
              onChange={(event) => updateField("content", event.target.value)}
              rows={12}
              className="w-full rounded-[24px] border border-[#E5E7EB] px-4 py-4 text-sm outline-none transition-colors focus:border-[#27624f]"
              placeholder="Texte principal de la soumission"
            />
          )}
          {isArticle ? (
            <p className="mt-2 text-xs leading-5 text-[#666]">
              Utilisez cet editeur riche pour structurer votre article avant moderation. Le contenu sera envoye en
              brouillon editorial a valider par l'administration.
            </p>
          ) : null}
        </label>

        {result.status === "success" ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {result.message}
          </div>
        ) : null}

        {kind === "classified" && enableClassifiedCheckout && checkoutState === "success" ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Paiement confirme. Prochaine etape: brancher la creation finale de l'annonce apres confirmation.
          </div>
        ) : null}

        {kind === "classified" && enableClassifiedCheckout && checkoutState === "cancelled" ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Paiement annule. Vous pouvez relancer le checkout a tout moment.
          </div>
        ) : null}

        {result.status === "error" ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {result.message}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-2xl bg-[#27624f] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#b6191f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Envoi..." : submitLabel}
          </button>
          <p className="text-xs leading-5 text-[#666]">
            {kind === "classified" && enableClassifiedCheckout
              ? "Publiez d'abord votre annonce, puis finalisez le paiement depuis votre profil."
              : "Votre contenu sera relu avant d'etre mis en ligne."}
          </p>
        </div>
      </form>
    </section>
  );
}

