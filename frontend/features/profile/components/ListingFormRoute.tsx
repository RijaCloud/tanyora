"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/prototype/app/context/AuthContext";
import { FeatureWorkspacePage, type WorkspaceField, type WorkspaceItem } from "@/features/profile/components/FeatureWorkspacePage";
import type { PublishingAccessStatusResult, TaxonomyTermResult } from "@/lib/api/wordpress-internal";

type ListingFormModule = "classifieds" | "jobs" | "tenders";
type FormMode = "create" | "edit";
type LoadState = "loading" | "ready" | "error";

const FORM_BOOTSTRAP_TIMEOUT_MS = 5000;
const FORM_OPTIONS_LIMIT = 100;

function markFormPerformance(name: string) {
  if (typeof performance === "undefined") return;
  performance.mark(name);
}

function isTerm(value: unknown): value is TaxonomyTermResult {
  if (!value || typeof value !== "object") return false;
  const term = value as Record<string, unknown>;
  return typeof term.id === "number"
    && Number.isInteger(term.id)
    && term.id > 0
    && typeof term.name === "string"
    && term.name.length > 0
    && typeof term.slug === "string"
    && typeof term.count === "number";
}

function normalizeTerms(value: unknown): TaxonomyTermResult[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isTerm).slice(0, FORM_OPTIONS_LIMIT);
}

type FormDefinition = {
  eyebrow: string;
  title: string;
  formTitle: string;
  primaryLabel: string;
  basePath: string;
  checkoutKind: "classified" | "job" | "tender";
  tabs: Array<{ id: string; label: string }>;
  fields: WorkspaceField[];
};

const DEFINITIONS: Record<ListingFormModule, FormDefinition> = {
  classifieds: {
    eyebrow: "Création d'annonce",
    title: "Petites annonces",
    formTitle: "Petites annonces",
    primaryLabel: "Créer une annonce",
    basePath: "/profil/petites-annonces",
    checkoutKind: "classified",
    tabs: [{ id: "classifieds", label: "Petites annonces" }, { id: "contacts", label: "Contacts reçus" }],
    fields: [
      { id: "title", label: "Titre de l'annonce", placeholder: "Titre de l'annonce", required: true },
      { id: "category", label: "Catégorie", placeholder: "Choisir une catégorie", type: "select", options: [], required: true },
      { id: "type", label: "Type", placeholder: "Choisir un type", type: "select", options: [] },
      { id: "city", label: "Ville", placeholder: "Choisir une ville", type: "select", options: [], required: true },
      { id: "area", label: "Zone", placeholder: "Choisir une zone", type: "select", options: [] },
      { id: "price", label: "Prix", placeholder: "Ex: 850000", type: "number", required: true },
      { id: "currency", label: "Devise", placeholder: "Choisir une devise", type: "select", options: ["MGA", "EUR", "USD"], required: true },
      { id: "phone", label: "Téléphone", placeholder: "+261 34 00 000 00", type: "tel", required: true },
      { id: "condition", label: "Condition", placeholder: "Choisir une condition", type: "select", options: ["Neuf", "Comme neuf", "Bon état", "État correct", "À rénover"] },
      { id: "productTag", label: "Tag produit", placeholder: "Choisir un tag produit", type: "select", options: [] },
      { id: "images", label: "Photos", placeholder: "Ajoutez vos photos", type: "image-gallery" },
      { id: "description", label: "Description", placeholder: "Description...", type: "textarea", required: true },
    ],
  },
  jobs: {
    eyebrow: "Création d'offre",
    title: "Offres d'emploi",
    formTitle: "Offres d'emploi",
    primaryLabel: "Ajouter une offre d'emploi",
    basePath: "/profil/offres-emploi",
    checkoutKind: "job",
    tabs: [{ id: "jobs", label: "Offres d'emploi" }, { id: "candidates", label: "Candidats" }],
    fields: [
      { id: "category", label: "Catégorie", placeholder: "Choisir une catégorie", type: "select", options: [] },
      { id: "type", label: "Type", placeholder: "Choisir un type", type: "select", options: [] },
      { id: "title", label: "Titre du poste", placeholder: "Titre du poste", required: true },
      { id: "companyName", label: "Entreprise", placeholder: "Nom de l'entreprise", required: true },
      { id: "city", label: "Ville", placeholder: "Choisir une ville", type: "select", options: [], required: true },
      { id: "area", label: "Zone", placeholder: "Choisir une zone", type: "select", options: [] },
      { id: "skills", label: "Compétences", placeholder: "Ajouter une compétence", type: "tag-input", maxSelections: 5 },
      { id: "experienceYears", label: "Années d'expérience", placeholder: "Ex : 3 ans" },
      { id: "phone", label: "Téléphone", placeholder: "+261 34 00 000 00", type: "tel", required: true },
      { id: "email", label: "Mail", placeholder: "votremail@gmail.com", type: "email", required: true },
      { id: "deadline", label: "Candidatures acceptées jusqu'au", placeholder: "Candidatures acceptées jusqu'au", type: "date" },
      { id: "description", label: "Description emploi", placeholder: "Description...", type: "textarea", required: true },
    ],
  },
  tenders: {
    eyebrow: "Création d'appel d'offres",
    title: "Appels d'offres",
    formTitle: "Appels d'offres",
    primaryLabel: "Ajouter un appel d'offre",
    basePath: "/profil/appels-offres",
    checkoutKind: "tender",
    tabs: [{ id: "tenders", label: "Appels d'offres" }, { id: "responses", label: "Réponses reçues" }],
    fields: [
      { id: "category", label: "Catégorie", placeholder: "Choisir une catégorie", type: "select", options: [] },
      { id: "type", label: "Type", placeholder: "Choisir un type", type: "select", options: [] },
      { id: "title", label: "Intitulé", placeholder: "Intitulé de l'appel d'offre", required: true },
      { id: "companyName", label: "Organisation", placeholder: "Nom de l'organisation", required: true },
      { id: "phone", label: "Téléphone", placeholder: "+261 34 00 000 00", type: "tel", required: true },
      { id: "budget", label: "Budget", placeholder: "Ex: 120 000 000 Ar" },
      { id: "currency", label: "Devise", placeholder: "Choisir une devise", type: "select", options: ["MGA", "EUR", "USD"], required: true },
      { id: "deadline", label: "Date limite", placeholder: "Date limite", type: "date" },
      { id: "detailsPdfUrl", label: "TDR", placeholder: "Ajouter le TDR, cahier des charges ou dossier de consultation", type: "pdf" },
      { id: "location", label: "Lieu", placeholder: "Choisir un lieu", type: "select", options: [], required: true },
      { id: "description", label: "Description du besoin", placeholder: "Description...", type: "textarea", required: true },
    ],
  },
};

function FormLoadingShell({ definition, onBack }: { definition: FormDefinition; onBack: () => void }) {
  return (
    <main className="ui-page-shell py-8 sm:py-12">
      <button type="button" onClick={onBack} className="ui-border ui-surface rounded-full border px-4 py-2 text-sm font-semibold">Retour</button>
      <section className="ui-card mt-6 rounded-[28px] p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#27624f]">{definition.eyebrow}</p>
        <h1 className="ui-text-main mt-2 text-3xl font-bold">{definition.formTitle}</h1>
        <p className="ui-text-muted mt-3 text-sm">Chargement de votre publication...</p>
      </section>
    </main>
  );
}

export function ListingFormRoute({ module, mode, listingId }: { module: ListingFormModule; mode: FormMode; listingId?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const definition = DEFINITIONS[module];
  const [terms, setTerms] = useState<TaxonomyTermResult[]>([]);
  const [locations, setLocations] = useState<TaxonomyTermResult[]>([]);
  const [configState, setConfigState] = useState<LoadState>("loading");
  const [configRequest, setConfigRequest] = useState(0);
  const [publishingAccessStatus, setPublishingAccessStatus] = useState<PublishingAccessStatusResult | null>(null);
  const [editingItem, setEditingItem] = useState<WorkspaceItem | null>(null);
  const [editState, setEditState] = useState<LoadState>(mode === "edit" ? "loading" : "ready");

  const retryConfig = useCallback(() => {
    setConfigRequest((request) => request + 1);
  }, []);

  const loadDependentOptions = useCallback(async (fieldId: string, value: string, termId?: number) => {
    if (!value || !termId || !Number.isInteger(termId) || termId <= 0) return;
    const query = fieldId === "category" ? `categoryId=${termId}` : `cityId=${termId}`;
    try {
      const response = await fetch(`/api/profile/listing-form/${module}?${query}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as { terms?: unknown; locations?: unknown } | null;
      if (!response.ok || !payload) return;
      const mergeTerms = (current: TaxonomyTermResult[], incoming: TaxonomyTermResult[]) => {
        const seen = new Set(current.map((term) => term.id));
        return [...current, ...incoming.filter((term) => !seen.has(term.id))].slice(0, FORM_OPTIONS_LIMIT * 2);
      };
      if (fieldId === "category") {
        const childTerms = normalizeTerms(payload.terms);
        setTerms((current) => mergeTerms(current, childTerms));
      }
      if (fieldId === "city") {
        const childLocations = normalizeTerms(payload.locations);
        setLocations((current) => mergeTerms(current, childLocations));
      }
    } catch {
      // The parent choice remains usable; its dependent select simply stays empty.
    }
  }, [module]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), FORM_BOOTSTRAP_TIMEOUT_MS);
    let cancelled = false;
    setConfigState("loading");

    void (async () => {
      try {
        const response = await fetch(`/api/profile/listing-form/${module}`, { cache: "no-store", signal: controller.signal });
        const payload = (await response.json().catch(() => null)) as { terms?: unknown; locations?: unknown } | null;
        if (!response.ok || !payload || cancelled) {
          throw new Error("Listing form configuration is unavailable");
        }

        setTerms(normalizeTerms(payload.terms));
        setLocations(normalizeTerms(payload.locations));
        setConfigState("ready");
        markFormPerformance("listing-form-options-ready");
      } catch {
        if (!cancelled) {
          setConfigState("error");
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [configRequest, module]);

  useEffect(() => {
    markFormPerformance("listing-form-shell-ready");
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), FORM_BOOTSTRAP_TIMEOUT_MS);
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/auth/publishing-access-status", { cache: "no-store", signal: controller.signal });
        const payload = (await response.json().catch(() => null)) as { status?: PublishingAccessStatusResult } | null;
        if (!response.ok || !payload?.status || cancelled) return;
        setPublishingAccessStatus(payload.status);
      } catch {
        // Access is always validated server-side when saving. A temporary
        // status failure must not prevent the user from completing the form.
      } finally {
        window.clearTimeout(timeoutId);
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !listingId) return;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), FORM_BOOTSTRAP_TIMEOUT_MS);
    let cancelled = false;
    setEditState("loading");
    void (async () => {
      try {
        const response = await fetch(`/api/profile/listing-form/${module}/${listingId}`, { cache: "no-store", signal: controller.signal });
        const payload = (await response.json().catch(() => null)) as { item?: WorkspaceItem } | null;
        if (!response.ok || !payload?.item || cancelled) {
          throw new Error("Listing is unavailable");
        }
        setEditingItem(payload.item);
        setEditState("ready");
        markFormPerformance("listing-form-edit-ready");
      } catch {
        if (!cancelled) setEditState("error");
      } finally {
        window.clearTimeout(timeoutId);
      }
    })();
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [listingId, mode, module]);

  const lists = useMemo(() => {
    const primaryTab = definition.tabs[0];
    const secondaryTab = definition.tabs[1];
    return {
      [primaryTab.id]: { title: definition.title, items: editingItem ? [editingItem] : [] },
      [secondaryTab.id]: { title: secondaryTab.label, items: [] },
    };
  }, [definition, editingItem]);

  const endpoint = module === "classifieds" ? "classified" : module === "jobs" ? "job" : "tender";
  const fields = useMemo(() => definition.fields.map((field) => {
    if (configState !== "error" || !["category", "city", "area", "location", "type", "productTag"].includes(field.id)) return field;
    return { ...field, placeholder: "Options indisponibles. Réessayez." };
  }), [configState, definition.fields]);

  if (mode === "edit" && editState === "loading") {
    return <FormLoadingShell definition={definition} onBack={() => router.push(definition.basePath)} />;
  }

  if (mode === "edit" && editState === "error") {
    return (
      <main className="ui-page-shell py-8 sm:py-12">
        <button type="button" onClick={() => router.push(definition.basePath)} className="ui-border ui-surface rounded-full border px-4 py-2 text-sm font-semibold">Retour</button>
        <section className="ui-card mt-6 rounded-[28px] p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#27624f]">Édition indisponible</p>
          <h1 className="ui-text-main mt-2 text-3xl font-bold">Impossible de charger cette publication</h1>
          <p className="ui-text-muted mt-3 text-sm">Réessayez dans un instant ou revenez à votre liste.</p>
          <button type="button" onClick={() => router.refresh()} className="mt-5 rounded-full bg-[#27624f] px-5 py-2.5 text-sm font-semibold text-white">Réessayer</button>
        </section>
      </main>
    );
  }

  return (
    <>
      {configState === "error" ? (
        <div className="ui-page-shell pt-6">
          <div role="alert" className="ui-border ui-surface flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm">
            <span>Les catégories et localisations ne sont pas disponibles pour le moment.</span>
            <button type="button" onClick={retryConfig} className="font-semibold text-[#27624f]">Réessayer</button>
          </div>
        </div>
      ) : null}
      <FeatureWorkspacePage
        key={`${module}:${mode}:${editingItem?.id || "new"}`}
        eyebrow={definition.eyebrow}
        title={definition.title}
        description=""
        tabs={definition.tabs}
        defaultTabId={definition.tabs[0].id}
        primaryButtonLabel={definition.primaryLabel}
        fields={fields}
        lists={lists}
        imageFallbackSrc="/image-placeholder.png"
        createEndpoint={`/api/submissions/${endpoint}`}
        updateEndpoint={`/api/submissions/${endpoint}`}
        deleteEndpoint={`/api/submissions/${endpoint}`}
        statusEndpoint={`/api/submissions/${endpoint}`}
        detailBasePath={definition.basePath}
        taxonomyTerms={terms}
        locationTerms={locations}
        onFormSelectionChange={loadDependentOptions}
        checkoutKind={definition.checkoutKind}
        publishingAccessStatus={publishingAccessStatus}
        emailVerificationRequired={user?.emailVerified === false}
      />
    </>
  );
}
