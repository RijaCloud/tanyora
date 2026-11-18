"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { AppImage } from "@/components/ui/AppImage";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import { WorkspaceCompound as Workspace } from "@/features/profile/components/WorkspaceCompound";
import ListingFadeGallery from "@/features/prototype/components/ListingFadeGallery";
import { extractPlainTextFromListingHtml, looksLikeListingHtml, sanitizeListingHtml } from "@/lib/content/listing-html";
import { optimizeImageFileForUpload } from "@/lib/client/image-optimizer";
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/phone";
import type { FeaturePricingInfo } from "@/lib/pricing/feature-pricing";
import { formatListingMoney } from "@/lib/pricing/format-listing-money";
import { fixMojibake } from "@/lib/text/mojibake";
import type { ListingCheckoutKind, PublishingAccessStatusResult, TaxonomyTermResult } from "@/lib/api/wordpress-internal";
import { trackCheckoutStarted, trackListingFormOpened, trackListingPublished, trackListingSaved } from "@/lib/analytics/ga4";

type WorkspaceTab = {
  id: string;
  label: string;
};

type ListingFormPhase = "list" | "create" | "edit" | "validating" | "uploading" | "saving" | "error" | "success";
const MAX_JOB_SKILL_LENGTH = 40;

function toAnalyticsListingType(tabId: string): "classified" | "job" | "tender" | null {
  if (tabId === "classifieds") return "classified";
  if (tabId === "jobs") return "job";
  if (tabId === "tenders") return "tender";
  return null;
}

export type WorkspaceItem = {
  id: string;
  title: string;
  description: string;
  content?: string;
  meta: string;
  image?: string;
  images?: string[];
  location?: string;
  city?: string;
  area?: string;
  price?: string;
  budget?: string;
  currency?: string;
  contactPhone?: string;
  contactPhoneCountry?: string;
  contactEmail?: string;
  category?: string;
  productTag?: string;
  condition?: string;
  regions?: string[];
  cities?: string[];
  type?: string;
  companyName?: string;
  profilePhoto?: string;
  companyLogo?: string;
  skills?: string[];
  experienceYears?: string;
  needBy?: string;
  deadline?: string;
  detailsPdfUrl?: string;
  detailsPdfName?: string;
  paymentStatus?: string;
  postStatus?: string;
  finalizationStatus?: "processing" | "retrying" | "ready" | "failed";
  featured?: boolean;
  expiresAt?: string;
  isExpired?: boolean;
  scheduledPublishAt?: string;
  isScheduled?: boolean;
  moderationStatus?: string;
  moderationMessage?: string;
  messageCount?: number;
  relatedListingId?: string;
  conversationHref?: string;
  listingHref?: string;
  participantEmail?: string;
  lastMessageAt?: string;
};

export type WorkspaceField =
  | {
      id: string;
      label: string;
      placeholder: string;
      type?: "text" | "email" | "date" | "tel" | "number" | "select";
      options?: string[];
      required?: boolean;
    }
  | { id: string; label: string; placeholder: string; type: "textarea"; required?: boolean }
  | { id: string; label: string; placeholder: string; type: "tag-input"; required?: boolean; options?: string[]; maxSelections?: number }
  | { id: string; label: string; placeholder: string; type: "image" | "image-gallery" | "pdf" };

type FeatureWorkspacePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  tabs: WorkspaceTab[];
  defaultTabId: string;
  primaryButtonLabel: string;
  fields: WorkspaceField[];
  lists: Record<string, { title: string; items: WorkspaceItem[] }>;
  imageFallbackSrc?: string;
  dataEndpoint?: string;
  detailBasePath?: string;
  createEndpoint?: string;
  updateEndpoint?: string;
  deleteEndpoint?: string;
  statusEndpoint?: string;
  pricingInfo?: FeaturePricingInfo;
  taxonomyTerms?: TaxonomyTermResult[];
  locationTerms?: TaxonomyTermResult[];
  checkoutKind?: ListingCheckoutKind;
  publishingAccessStatus?: PublishingAccessStatusResult | null;
  emailVerificationRequired?: boolean;
  onFormSelectionChange?: (fieldId: string, value: string, termId?: number) => void;
};

type PresignUploadPayload = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresInSeconds: number;
};

type WorkspaceSection = { title: string; items: WorkspaceItem[] };

type PendingImageEntry = {
  file: File;
  previewUrl: string;
};

function sanitizeWorkspaceItem(item: unknown): WorkspaceItem {
  const source = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
  const images = Array.isArray(source.images)
    ? source.images.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];

  return {
    id: String(source.id ?? ""),
    title: String(source.title ?? ""),
    description: String(source.description ?? ""),
    content: typeof source.content === "string" ? source.content : undefined,
    meta: String(source.meta ?? ""),
    image: typeof source.image === "string" ? source.image : undefined,
    images,
    location: typeof source.location === "string" ? source.location : undefined,
    city: typeof source.city === "string" ? source.city : undefined,
    area: typeof source.area === "string" ? source.area : undefined,
    price: typeof source.price === "string" ? source.price : undefined,
    budget: typeof source.budget === "string" ? source.budget : undefined,
    currency: typeof source.currency === "string" ? source.currency : undefined,
    contactPhone: typeof source.contactPhone === "string" ? source.contactPhone : undefined,
    contactPhoneCountry: typeof source.contactPhoneCountry === "string" ? source.contactPhoneCountry : undefined,
    contactEmail: typeof source.contactEmail === "string" ? source.contactEmail : undefined,
    category: typeof source.category === "string" ? source.category : undefined,
    productTag: typeof source.productTag === "string" ? source.productTag : undefined,
    condition: typeof source.condition === "string" ? source.condition : undefined,
    regions: Array.isArray(source.regions)
      ? source.regions.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      : undefined,
    cities: Array.isArray(source.cities)
      ? source.cities.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      : undefined,
    type: typeof source.type === "string" ? source.type : undefined,
    companyName: typeof source.companyName === "string" ? source.companyName : undefined,
    profilePhoto: typeof source.profilePhoto === "string" ? source.profilePhoto : undefined,
    companyLogo: typeof source.companyLogo === "string" ? source.companyLogo : undefined,
    skills: Array.isArray(source.skills)
      ? source.skills.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      : undefined,
    experienceYears: typeof source.experienceYears === "string" ? source.experienceYears : undefined,
    needBy: typeof source.needBy === "string" ? source.needBy : undefined,
    deadline: typeof source.deadline === "string" ? source.deadline : undefined,
    detailsPdfUrl: typeof source.detailsPdfUrl === "string" ? source.detailsPdfUrl : undefined,
    detailsPdfName: typeof source.detailsPdfName === "string" ? source.detailsPdfName : undefined,
    paymentStatus: typeof source.paymentStatus === "string" ? source.paymentStatus : undefined,
    postStatus: typeof source.postStatus === "string" ? source.postStatus : undefined,
    finalizationStatus: source.finalizationStatus === "processing" || source.finalizationStatus === "retrying" || source.finalizationStatus === "ready" || source.finalizationStatus === "failed"
      ? source.finalizationStatus
      : undefined,
    featured: Boolean(source.featured),
    expiresAt: typeof source.expiresAt === "string" ? source.expiresAt : undefined,
    isExpired: Boolean(source.isExpired),
    scheduledPublishAt: typeof source.scheduledPublishAt === "string" ? source.scheduledPublishAt : undefined,
    isScheduled: Boolean(source.isScheduled),
    moderationStatus: typeof source.moderationStatus === "string" ? source.moderationStatus : undefined,
    moderationMessage: typeof source.moderationMessage === "string" ? source.moderationMessage : undefined,
    messageCount: typeof source.messageCount === "number" ? source.messageCount : undefined,
    relatedListingId: typeof source.relatedListingId === "string" ? source.relatedListingId : undefined,
    conversationHref: typeof source.conversationHref === "string" ? source.conversationHref : undefined,
    listingHref: typeof source.listingHref === "string" ? source.listingHref : undefined,
    participantEmail: typeof source.participantEmail === "string" ? source.participantEmail : undefined,
    lastMessageAt: typeof source.lastMessageAt === "string" ? source.lastMessageAt : undefined,
  };
}

function normalizeWorkspaceSection(
  section: { title?: string; items?: WorkspaceItem[] | null } | undefined,
  fallbackTitle: string,
): WorkspaceSection {
  return {
    title: typeof section?.title === "string" && section.title.trim().length > 0 ? section.title : fallbackTitle,
    items: Array.isArray(section?.items) ? section.items.map((item) => sanitizeWorkspaceItem(item)) : [],
  };
}

function normalizeWorkspaceLists(
  source: Record<string, { title: string; items: WorkspaceItem[] }>,
  tabs: WorkspaceTab[],
): Record<string, WorkspaceSection> {
  return Object.fromEntries(
    tabs.map((tab) => [
      tab.id,
      normalizeWorkspaceSection(source?.[tab.id], tab.label),
    ]),
  );
}

function formatStructuredLocation(city: string, area = "") {
  const normalizedCity = city.trim();
  const normalizedArea = area.trim();
  if (normalizedArea && normalizedCity) {
    return `${normalizedArea}, ${normalizedCity}`;
  }
  return normalizedCity;
}

async function requestImagePresign(file: File): Promise<PresignUploadPayload> {
  const response = await fetch("/api/media/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mimeType: file.type,
      sizeBytes: file.size,
    }),
  });

  const payload = (await response.json().catch(() => null)) as PresignUploadPayload & { error?: string } | null;
  if (!response.ok || !payload?.uploadUrl || !payload.publicUrl) {
    throw new Error(getUserFacingErrorMessage(payload?.error, "Impossible de preparer l'upload de cette image."));
  }

  return payload;
}

async function uploadImageToStorage(file: File): Promise<string> {
  const optimized = await optimizeImageFileForUpload(file, "upload-image");
  const presign = await requestImagePresign(optimized);

  const uploadResponse = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": optimized.type,
    },
    body: optimized,
  });

  if (!uploadResponse.ok) {
    throw new Error("Echec de l'upload de l'image.");
  }

  return presign.publicUrl;
}

function resolvePdfMimeType(file: File) {
  const normalizedType = String(file.type || "").trim().toLowerCase();
  const normalizedName = String(file.name || "").trim().toLowerCase();

  if (normalizedType === "application/pdf") {
    return normalizedType;
  }

  if (normalizedType === "application/zip" || normalizedType === "application/x-zip-compressed") {
    return normalizedType;
  }

  if (normalizedName.endsWith(".pdf")) {
    return "application/pdf";
  }

  if (normalizedName.endsWith(".zip")) {
    return "application/zip";
  }

  return normalizedType;
}

async function requestPdfPresign(file: File): Promise<PresignUploadPayload> {
  const mimeType = resolvePdfMimeType(file);
  const response = await fetch("/api/media/message-attachment-presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mimeType,
      sizeBytes: file.size,
    }),
  });

  const payload = (await response.json().catch(() => null)) as PresignUploadPayload & { error?: string } | null;
  if (!response.ok || !payload?.uploadUrl || !payload.publicUrl) {
    throw new Error(getUserFacingErrorMessage(payload?.error, "Impossible de préparer l'upload de ce TDR."));
  }

  return payload;
}

async function uploadPdfToStorage(file: File): Promise<{ url: string; fileName: string }> {
  const mimeType = resolvePdfMimeType(file);
  if (!["application/pdf", "application/zip", "application/x-zip-compressed"].includes(mimeType)) {
    throw new Error("Seuls les fichiers PDF et ZIP sont autorisés.");
  }

  if (file.size > 50 * 1024 * 1024) {
    throw new Error("Le TDR dépasse la limite de 50 Mo.");
  }

  const presign = await requestPdfPresign(file);
  const uploadResponse = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": mimeType,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("Impossible de téléverser ce TDR pour le moment.");
  }

  return {
    url: presign.publicUrl,
    fileName: file.name,
  };
}

function normalizeAmountValue(value: string) {
  return value.replace(/[^\d]/g, "");
}

function formatAmountInputValue(value: string) {
  const normalized = normalizeAmountValue(value);
  if (!normalized) {
    return "";
  }

  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function isValidAmountValue(value: string) {
  const normalized = normalizeAmountValue(value);
  if (!normalized) return false;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) && parsed > 0;
}

function stripTrailingDuplicatedPrice(description: string, price: string) {
  if (looksLikeListingHtml(description)) {
    return description.trim();
  }

  const normalizedPrice = normalizeAmountValue(price);
  if (!normalizedPrice) {
    return description;
  }

  const trimmedDescription = description.trim();
  const trailingMatch = trimmedDescription.match(/(\d[\d\s.,]*)$/);
  if (!trailingMatch) {
    return trimmedDescription;
  }

  const trailingDigits = normalizeAmountValue(trailingMatch[1]);
  if (trailingDigits !== normalizedPrice) {
    return trimmedDescription;
  }

  return trimmedDescription.slice(0, trailingMatch.index).trim();
}

function getListingDisplayText(description: string, price = "") {
  const plainText = extractPlainTextFromListingHtml(description);
  return stripTrailingDuplicatedPrice(plainText, price);
}

const SELECTED_ITEM_DESCRIPTION_PREVIEW_LIMIT = 520;

function escapeHtmlText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncatePlainText(value: string, limit: number) {
  const normalized = value.trim();
  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit).trimEnd()}...`;
}

function plainTextToHtml(value: string) {
  const escaped = escapeHtmlText(value);
  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return "";
  }

  return paragraphs.map((part) => `<p>${part.replace(/\n/g, "<br />")}</p>`).join("");
}

function truncateSanitizedHtmlByTextLength(html: string, limit: number) {
  if (!html || typeof DOMParser === "undefined") {
    return "";
  }

  const parser = new DOMParser();
  const documentFragment = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const root = documentFragment.body.firstElementChild;
  if (!root) {
    return "";
  }

  let remaining = limit;
  let didTruncate = false;

  const trimNode = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (remaining <= 0) {
        didTruncate = true;
        child.parentNode?.removeChild(child);
        continue;
      }

      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent || "";
        if (text.length > remaining) {
          child.textContent = `${text.slice(0, remaining).trimEnd()}...`;
          remaining = 0;
          didTruncate = true;
          continue;
        }

        remaining -= text.length;
        continue;
      }

      if (child.nodeType === Node.ELEMENT_NODE) {
        trimNode(child);
      }
    }
  };

  trimNode(root);
  return didTruncate ? root.innerHTML.trim() : html;
}

function getSelectedListingDescriptionPreviewHtml(description: string, price = "", limit = SELECTED_ITEM_DESCRIPTION_PREVIEW_LIMIT) {
  const displayText = getListingDisplayText(description, price);
  if (!displayText) {
    return "";
  }

  if (!looksLikeListingHtml(description)) {
    return plainTextToHtml(truncatePlainText(displayText, limit));
  }

  const sanitizedHtml = sanitizeListingHtml(description);
  if (!sanitizedHtml) {
    return plainTextToHtml(truncatePlainText(displayText, limit));
  }

  return truncateSanitizedHtmlByTextLength(sanitizedHtml, limit) || plainTextToHtml(truncatePlainText(displayText, limit));
}

function isExpiringWithinDays(expiresAt?: string, days = 7) {
  if (!expiresAt) return false;
  const expiresTs = new Date(expiresAt).getTime();
  if (!Number.isFinite(expiresTs)) return false;
  const nowTs = Date.now();
  const diff = expiresTs - nowTs;
  return diff > 0 && diff <= days * 24 * 60 * 60 * 1000;
}

function canEditWorkspaceItem(item: WorkspaceItem) {
  if (item.finalizationStatus === "processing" || item.finalizationStatus === "retrying") {
    return false;
  }
  if (isScheduledWorkspaceItem(item)) {
    return false;
  }

  const status = String(item.postStatus || "").toLowerCase();
  return status === "draft" || status === "pending" || status === "publish";
}

function isScheduledWorkspaceItem(item: WorkspaceItem) {
  if (item.isScheduled) {
    return true;
  }

  const scheduledValue = (item.scheduledPublishAt || "").trim();
  if (!scheduledValue) {
    return false;
  }

  const scheduledTs = new Date(scheduledValue).getTime();
  return Number.isFinite(scheduledTs) && scheduledTs > Date.now();
}

function isPublishedWorkspaceItem(item: WorkspaceItem) {
  return String(item.postStatus || "").toLowerCase() === "publish" && !item.isExpired;
}

function shouldShowWorkspacePublicationMeta(item: WorkspaceItem) {
  return Boolean(item.meta) && isPublishedWorkspaceItem(item);
}

function shouldShowWorkspaceExpiration(item: WorkspaceItem): item is WorkspaceItem & { expiresAt: string } {
  return typeof item.expiresAt === "string" && item.expiresAt.trim().length > 0 && isPublishedWorkspaceItem(item);
}

function getWorkspaceItemStatusLabel(item: WorkspaceItem) {
  if (item.finalizationStatus === "processing" || item.finalizationStatus === "retrying") {
    return "Préparation en cours";
  }

  if (item.finalizationStatus === "failed") {
    return "Préparation à reprendre";
  }
  if (item.moderationStatus === "flagged") {
    return "À corriger";
  }

  if (item.isExpired) {
    return "Expirée";
  }

  if (isScheduledWorkspaceItem(item)) {
    return "Programmée";
  }

  const status = String(item.postStatus || "").toLowerCase();
  if (status === "publish") {
    return "Publiée";
  }
  if (status === "pending") {
    return "En attente";
  }
  if (status === "draft") {
    return "Brouillon";
  }

  return status ? `${status.charAt(0).toUpperCase()}${status.slice(1)}` : "Inconnu";
}

function getWorkspaceItemEditLockReason(item: WorkspaceItem) {
  if (item.finalizationStatus === "processing" || item.finalizationStatus === "retrying") {
    return "Cette annonce est encore en préparation. Vous pourrez la modifier dès que les photos et informations seront prêtes.";
  }
  if (isScheduledWorkspaceItem(item)) {
    const scheduledLabel = formatScheduledPublishDateLabel(item.scheduledPublishAt);
    return scheduledLabel
      ? `Cet élément est déjà programmé. Vous pourrez le modifier une fois sa diffusion terminée ou après l'avoir remis en brouillon. Mise en ligne prévue le ${scheduledLabel}.`
      : "Cet élément est déjà programmé. Vous pourrez le modifier une fois sa diffusion terminée ou après l'avoir remis en brouillon.";
  }

  if (canEditWorkspaceItem(item)) {
    return "";
  }

  return "Modification possible uniquement pour un élément en brouillon, en attente ou déjà publié.";
}

function getScheduledPublishDateMin() {
  const nextDay = new Date();
  nextDay.setDate(nextDay.getDate() + 1);
  const year = nextDay.getFullYear();
  const month = String(nextDay.getMonth() + 1).padStart(2, "0");
  const day = String(nextDay.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultScheduledPublishTime() {
  return "09:00";
}

function buildScheduledPublishValue(dateValue: string, timeValue: string) {
  const normalizedDate = dateValue.trim();
  const normalizedTime = timeValue.trim();
  if (!normalizedDate || !normalizedTime) {
    return "";
  }

  return `${normalizedDate}T${normalizedTime}`;
}

function getTodayDateInputMin() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getListingDescriptionMaxLength(tabId: string) {
  if (tabId === "jobs" || tabId === "tenders") {
    return 5000;
  }

  return 1500;
}

function getSubmissionFieldKey(fieldId: string) {
  if (fieldId === "description") return "content";
  if (fieldId === "phone") return "contactPhone";
  if (fieldId === "email") return "contactEmail";
  return fieldId;
}

function isWorkspaceCardControl(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("button, a, input, select, textarea, label"));
}

function resolveWorkspaceEditCategoryAndType(
  item: WorkspaceItem,
  taxonomyTerms: TaxonomyTermResult[],
  usesHierarchicalTypes: boolean,
) {
  const fallback = {
    category: String(item.category || "").trim(),
    type: String(item.type || "").trim(),
  };

  if (!usesHierarchicalTypes) {
    return fallback;
  }

  const normalizedCategory = fallback.category;
  const normalizedType = fallback.type;
  const matchingParentCategory = normalizedCategory
    ? taxonomyTerms.find((term) => term.name === normalizedCategory && !term.parentId && !term.parentName)
    : null;

  if (matchingParentCategory) {
    return fallback;
  }

  if (normalizedType) {
    const matchingChild = taxonomyTerms.find((term) => term.name === normalizedType && (term.parentId || term.parentName));
    if (matchingChild?.parentName) {
      return {
        category: matchingChild.parentName,
        type: matchingChild.name,
      };
    }
  }

  if (normalizedCategory) {
    const matchingTerm = taxonomyTerms.find((term) => term.name === normalizedCategory);
    if (matchingTerm?.parentName) {
      return {
        category: matchingTerm.parentName,
        type: matchingTerm.name,
      };
    }
  }

  return fallback;
}

function formatScheduledPublishDateLabel(value?: string) {
  const rawValue = (value || "").trim();
  if (!rawValue) {
    return "";
  }

  const parsed = new Date(rawValue);
  if (!Number.isFinite(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function UploadSpinner({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      <span>{label}</span>
    </div>
  );
}

function getWorkspaceRequestTimeoutMs() {
  const raw = process.env.NEXT_PUBLIC_WORKSPACE_REQUEST_TIMEOUT_MS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  // A completed WordPress request can need one idempotent retry before its
  // result reaches the browser, so leave time for that recovery path.
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60000;
}

function waitForWorkspaceRequest(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

const WORKSPACE_SUBMISSION_MAX_ATTEMPTS = 24;
const WORKSPACE_SUBMISSION_RETRY_DELAY_MS = 1000;
const CLASSIFIED_CREATE_RECOVERY_ATTEMPTS = 6;

function normalizeWorkspaceFilterValue(value: string | undefined) {
  return normalizeWorkspaceText(value);
}

function decodeEscapedUnicode(value: string) {
  return value
    .replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\x([0-9a-fA-F]{2})/g, (_match, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/([A-Za-z])u([0-9a-fA-F]{4})/g, (_match, prefix: string, hex: string) => `${prefix}${String.fromCharCode(Number.parseInt(hex, 16))}`);
}

function normalizeWorkspaceText(value: string | undefined) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "";
  }

  return fixMojibake(decodeEscapedUnicode(trimmed)).trim();
}

function buildSortedWorkspaceOptions(values: string[]) {
  return Array.from(new Set(values.map((value) => normalizeWorkspaceText(value)).filter((value) => value.length > 0))).sort(
    (left, right) => left.localeCompare(right, "fr"),
  );
}

export function FeatureWorkspacePage({
  eyebrow,
  title,
  description,
  tabs,
  defaultTabId,
  primaryButtonLabel,
  fields,
  lists,
  imageFallbackSrc,
  dataEndpoint,
  detailBasePath,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
  statusEndpoint,
  pricingInfo,
  taxonomyTerms = [],
  locationTerms = [],
  checkoutKind = "classified",
  publishingAccessStatus = null,
  emailVerificationRequired = false,
  onFormSelectionChange,
}: FeatureWorkspacePageProps) {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isStandaloneCreateRoute = (pathname || "").endsWith("/nouveau");
  const standaloneEditItemId = useMemo(() => (pathname || "").match(/\/([^/]+)\/modifier$/)?.[1] || "", [pathname]);
  const isStandaloneEditRoute = standaloneEditItemId.length > 0;
  const createFormRef = useRef<HTMLFormElement | null>(null);
  const submissionRequestIdRef = useRef<string | null>(null);
  // Normalize server data only once. Rebuilding every item on each keystroke
  // made opening a form rerun the whole workspace list pipeline.
  const [itemsByTab, setItemsByTab] = useState(() => normalizeWorkspaceLists(lists, tabs));
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);
  const [formPhase, setFormPhase] = useState<ListingFormPhase>(isStandaloneCreateRoute ? "create" : "list");
  const [isCreateMode, setIsCreateMode] = useState(isStandaloneCreateRoute);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [activeDetailTabId, setActiveDetailTabId] = useState(tabs[1]?.id || "");
  const imageInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const initialFormState = fields.reduce<Record<string, string | string[]>>((accumulator, field) => {
    accumulator[field.id] = field.type === "image-gallery" || field.type === "tag-input" ?[] : "";
    return accumulator;
  }, {});
  const [form, setForm] = useState<Record<string, string | string[]>>(initialFormState);
  const [tagDrafts, setTagDrafts] = useState<Record<string, string>>({});
  const [tagFieldErrors, setTagFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [formMessageTone, setFormMessageTone] = useState<"error" | "notice">("error");
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isPayingItemId, setIsPayingItemId] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isDeletingItemId, setIsDeletingItemId] = useState("");
  const [isUpdatingStatusItemId, setIsUpdatingStatusItemId] = useState("");
  const [pendingDeleteItem, setPendingDeleteItem] = useState<WorkspaceItem | null>(null);
  const [pendingFeaturedImage, setPendingFeaturedImage] = useState<PendingImageEntry | null>(null);
  const [pendingGalleryImages, setPendingGalleryImages] = useState<PendingImageEntry[]>([]);
  const [livePublishingAccessStatus, setLivePublishingAccessStatus] = useState<PublishingAccessStatusResult | null>(publishingAccessStatus);

  useEffect(() => {
    setIsClient(true);
  }, []);
  useEffect(() => {
    setLivePublishingAccessStatus(publishingAccessStatus);
  }, [publishingAccessStatus]);
  useEffect(() => {
    if (!isStandaloneCreateRoute || isCreateMode) {
      return;
    }

    setFormPhase("create");
    setIsCreateMode(true);
  }, [isCreateMode, isStandaloneCreateRoute]);
  const [isClassifiedPreviewOpen, setIsClassifiedPreviewOpen] = useState(false);
  const [hasConfirmedClassifiedPreview, setHasConfirmedClassifiedPreview] = useState(false);
  const [classifiedPreviewMode, setClassifiedPreviewMode] = useState<"form" | "publish">("form");
  const [classifiedPreviewTargetItem, setClassifiedPreviewTargetItem] = useState<WorkspaceItem | null>(null);
  const [previewPublishChoice, setPreviewPublishChoice] = useState<"now" | "later">("now");
  const [scheduledPublishDate, setScheduledPublishDate] = useState(getScheduledPublishDateMin());
  const [scheduledPublishTime, setScheduledPublishTime] = useState(getDefaultScheduledPublishTime());
  const [queuedCreatePublishChoice, setQueuedCreatePublishChoice] = useState<"none" | "now" | "later">("none");
  const [queuedCreateScheduledAt, setQueuedCreateScheduledAt] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [phonePreference, setPhonePreference] = useState<"profile" | "custom">("custom");
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState("");
  const [workspaceStatusFilter, setWorkspaceStatusFilter] = useState("Tous");
  const [workspaceCategoryFilter, setWorkspaceCategoryFilter] = useState("Toutes");
  const [workspaceTypeFilter, setWorkspaceTypeFilter] = useState("Tous");
  const [workspacePage, setWorkspacePage] = useState(1);

  const primaryTab = tabs.find((tab) => tab.id === defaultTabId) || tabs[0];
  const submissionRequestStorageKey = `2424:submission-request:${primaryTab.id}`;
  const detailTabs = tabs.filter((tab) => tab.id !== primaryTab.id);
  const primaryList = useMemo(
    () => itemsByTab[primaryTab.id] || { title: primaryTab.label, items: [] },
    [itemsByTab, primaryTab.id, primaryTab.label],
  );
  const activeDetailTab = detailTabs.find((tab) => tab.id === activeDetailTabId) || detailTabs[0] || null;
  const activeDetailList = activeDetailTab
    ? itemsByTab[activeDetailTab.id] || { title: activeDetailTab.label, items: [] }
    : null;
  const shouldShowWorkspaceSkeleton = isLoadingWorkspace && primaryList.items.length === 0;
  const isListingWorkspace = primaryTab.id === "classifieds" || primaryTab.id === "jobs" || primaryTab.id === "tenders";
  const locationParentTerms = useMemo(
    () => locationTerms.filter((term) => !term.parentId && !term.parentName),
    [locationTerms],
  );
  const locationChildTerms = useMemo(
    () => locationTerms.filter((term) => term.parentId || term.parentName),
    [locationTerms],
  );
  const supportsTypeSelection = fields.some((field) => field.id === "type");
  const usesHierarchicalTypes = supportsTypeSelection &&
    (primaryTab.id === "classifieds" || primaryTab.id === "jobs" || primaryTab.id === "tenders");
  const selectedFormCategory = String(form.category || "").trim();
  const selectedFormType = String(form.type || "").trim();
  const selectedFormCity = String(form.city || "").trim();
  const topLevelTaxonomyTerms = useMemo(
    () => taxonomyTerms.filter((term) => !term.parentId && !term.parentName),
    [taxonomyTerms],
  );
  const childTaxonomyTerms = useMemo(
    () => (usesHierarchicalTypes ? taxonomyTerms.filter((term) => term.parentId || term.parentName) : []),
    [taxonomyTerms, usesHierarchicalTypes],
  );
  const availableFormTypeOptions = useMemo(
    () =>
      usesHierarchicalTypes && selectedFormCategory
        ? buildSortedWorkspaceOptions(
            childTaxonomyTerms
              .filter((term) => term.parentName === selectedFormCategory)
              .filter((term) => {
                if (primaryTab.id !== "classifieds") {
                  return true;
                }

                const normalizedSlug = String(term.slug || "").trim().toLowerCase();
                const normalizedName = String(term.name || "").trim().toLowerCase();

                return normalizedSlug !== "offres-d-emploi" && normalizedName !== "offres d'emploi";
              })
              .map((term) => term.name),
          ).slice(0, 100)
        : [],
    [childTaxonomyTerms, primaryTab.id, selectedFormCategory, usesHierarchicalTypes],
  );
  const visibleFormFields = useMemo(
    () =>
      fields.filter((field) => field.id !== "type" || !usesHierarchicalTypes || availableFormTypeOptions.length > 0),
    [availableFormTypeOptions.length, fields, usesHierarchicalTypes],
  );
  const orderedVisibleFormFields = useMemo(() => {
    if (primaryTab.id !== "classifieds") {
      return visibleFormFields;
    }

    const classifiedFieldOrder = [
      "category",
      "type",
      "title",
      "city",
      "area",
      "price",
      "currency",
      "phone",
      "condition",
      "productTag",
      "images",
      "description",
    ];

    return [...visibleFormFields].sort((left, right) => {
      const leftIndex = classifiedFieldOrder.indexOf(left.id);
      const rightIndex = classifiedFieldOrder.indexOf(right.id);
      return (leftIndex < 0 ? Number.MAX_SAFE_INTEGER : leftIndex) - (rightIndex < 0 ? Number.MAX_SAFE_INTEGER : rightIndex);
    });
  }, [primaryTab.id, visibleFormFields]);
  const availableProductTagOptions = useMemo(() => {
    if (primaryTab.id !== "classifieds" || selectedFormCategory.length === 0) {
      return [];
    }

    const selectedCategoryTerm = topLevelTaxonomyTerms.find(
      (term) => term.name.trim().toLowerCase() === selectedFormCategory.trim().toLowerCase(),
    );
    const selectedTypeTerm = selectedFormType
      ? childTaxonomyTerms.find(
          (term) =>
            term.name.trim().toLowerCase() === selectedFormType.trim().toLowerCase() &&
            term.parentName?.trim().toLowerCase() === selectedFormCategory.trim().toLowerCase(),
        )
      : null;

    const resolvedTagNames =
      (selectedTypeTerm?.productTagNames && selectedTypeTerm.productTagNames.length > 0)
        ? selectedTypeTerm.productTagNames
        : (selectedCategoryTerm?.productTagNames || []);

    return buildSortedWorkspaceOptions(resolvedTagNames).slice(0, 100);
  }, [childTaxonomyTerms, primaryTab.id, selectedFormCategory, selectedFormType, topLevelTaxonomyTerms]);
  const availableFormAreaOptions = useMemo(
    () =>
      selectedFormCity
        ? buildSortedWorkspaceOptions(
            locationChildTerms
              .filter((term) => term.parentName === selectedFormCity)
              .map((term) => term.name),
          )
        : [],
    [locationChildTerms, selectedFormCity],
  );
  useEffect(() => {
    if (!isListingWorkspace) {
      return;
    }

    const selectedProductTag = String(form.productTag || "").trim();
    if (selectedProductTag.length === 0) {
      return;
    }

    if (availableProductTagOptions.includes(selectedProductTag)) {
      return;
    }

    setForm((current) => ({
      ...current,
      productTag: "",
    }));
  }, [availableProductTagOptions, form.productTag, primaryTab.id]);
  const availableSkillsOptions = useMemo(() => {
    const configuredSkills = fields
      .filter((field): field is Extract<WorkspaceField, { type: "tag-input" }> => field.type === "tag-input" && field.id === "skills")
      .flatMap((field) => field.options || []);
    const itemSkills = primaryList.items.flatMap((item) => item.skills || []);
    return buildSortedWorkspaceOptions([...configuredSkills, ...itemSkills]);
  }, [fields, primaryList.items]);
  useEffect(() => {
    const selectedArea = String(form.area || "").trim();
    if (!selectedArea) {
      return;
    }

    if (availableFormAreaOptions.includes(selectedArea)) {
      return;
    }

    setForm((current) => ({
      ...current,
      area: "",
    }));
  }, [availableFormAreaOptions, form.area]);
  const workspaceCategoryOptions = useMemo(
    () =>
      isListingWorkspace
        ? buildSortedWorkspaceOptions(primaryList.items.map((item) => normalizeWorkspaceFilterValue(item.category)))
        : [],
    [isListingWorkspace, primaryList.items],
  );
  const workspaceTypeOptions = useMemo(() => {
    if (!isListingWorkspace || !supportsTypeSelection) {
      return [];
    }

    if (usesHierarchicalTypes && workspaceCategoryFilter === "Toutes") {
      return [];
    }

    const taxonomyTypes =
      usesHierarchicalTypes && workspaceCategoryFilter !== "Toutes"
        ? childTaxonomyTerms
            .filter((term) => term.parentName === workspaceCategoryFilter)
            .map((term) => term.name)
        : [];
    const itemTypes = primaryList.items
      .filter((item) =>
        workspaceCategoryFilter === "Toutes"
          ? true
          : normalizeWorkspaceFilterValue(item.category) === workspaceCategoryFilter,
      )
      .map((item) => normalizeWorkspaceFilterValue(item.type));

    return buildSortedWorkspaceOptions([...taxonomyTypes, ...itemTypes]);
  }, [childTaxonomyTerms, isListingWorkspace, primaryList.items, supportsTypeSelection, usesHierarchicalTypes, workspaceCategoryFilter]);
  const shouldShowTypeFilter = workspaceTypeOptions.length > 0;
  const workspaceTypeOptionsKey = useMemo(() => workspaceTypeOptions.join("||"), [workspaceTypeOptions]);
  const classifiedAccess = livePublishingAccessStatus?.classifieds ?? null;
  const jobsAccess = livePublishingAccessStatus?.jobs ?? null;
  const tendersAccess = livePublishingAccessStatus?.tenders ?? null;
  const classifiedMaxPhotos = Math.max(1, classifiedAccess?.maxPhotos ?? 4);
  // An unavailable access snapshot is not a refusal. WordPress remains the
  // authority at save/publish time and explicit false values lock the UI.
  const canPublishClassifieds = classifiedAccess?.canPublish ?? true;
  const canCreateJobDraft = jobsAccess?.canCreateDraft ?? true;
  const canPublishJobs = jobsAccess?.canPublish ?? true;
  const canCreateTenderDraft = tendersAccess?.canCreateDraft ?? true;
  const canPublishTenders = tendersAccess?.canPublish ?? true;
  const normalizedWorkspaceSearch = workspaceSearchQuery.trim().toLowerCase();
  const filteredPrimaryItems = useMemo(() => {
    if (!isListingWorkspace) {
      return primaryList.items;
    }

    return primaryList.items.filter((item) => {
      const matchesSearch =
        normalizedWorkspaceSearch.length === 0 ||
        [
          item.title,
          item.description,
          item.location,
          item.category,
          item.type,
          item.meta,
        ]
          .map((value) => String(value || "").toLowerCase())
          .some((value) => value.includes(normalizedWorkspaceSearch));

      const matchesStatus =
        workspaceStatusFilter === "Tous" || getWorkspaceItemStatusLabel(item) === workspaceStatusFilter;
      const matchesCategory =
        workspaceCategoryFilter === "Toutes" ||
        normalizeWorkspaceFilterValue(item.category) === workspaceCategoryFilter;
      const matchesType =
        !shouldShowTypeFilter ||
        workspaceTypeFilter === "Tous" ||
        normalizeWorkspaceFilterValue(item.type) === workspaceTypeFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesType;
    });
  }, [
    normalizedWorkspaceSearch,
    primaryList.items,
    isListingWorkspace,
    shouldShowTypeFilter,
    workspaceCategoryFilter,
    workspaceStatusFilter,
    workspaceTypeFilter,
  ]);
  const hasActiveClassifiedFilters = isListingWorkspace &&
    (workspaceSearchQuery.trim().length > 0 ||
      workspaceStatusFilter !== "Tous" ||
      workspaceCategoryFilter !== "Toutes" ||
      (shouldShowTypeFilter && workspaceTypeFilter !== "Tous"));
  const shouldShowClassifiedListTools = isListingWorkspace;
  const filteredResultsLabel = useMemo(() => {
    const resultCount = filteredPrimaryItems.length;
    return `${resultCount} resultat${resultCount > 1 ? "s" : ""}`;
  }, [filteredPrimaryItems.length]);
  const primaryItemsPerPage = isListingWorkspace ? 6 : Math.max(primaryList.items.length, 1);
  const totalWorkspacePages = Math.max(1, Math.ceil(filteredPrimaryItems.length / primaryItemsPerPage));
  const safeWorkspacePage = Math.min(workspacePage, totalWorkspacePages);
  const paginatedPrimaryItems = useMemo(
    () =>
      isListingWorkspace
        ? filteredPrimaryItems.slice((safeWorkspacePage - 1) * primaryItemsPerPage, safeWorkspacePage * primaryItemsPerPage)
        : filteredPrimaryItems,
    [filteredPrimaryItems, isListingWorkspace, primaryItemsPerPage, safeWorkspacePage],
  );
  const selectablePrimaryItems = isListingWorkspace ? paginatedPrimaryItems : primaryList.items;
  const selectedItem = useMemo(
    () => selectablePrimaryItems.find((item) => item.id === selectedItemId) || null,
    [selectablePrimaryItems, selectedItemId],
  );
  const shouldShowWorkspaceSidePanel = isCreateMode || Boolean(selectedItem);
  const selectedItemDescriptionPreviewHtml = useMemo(() => {
    if (!selectedItem || !isClient) {
      return "";
    }

    return getSelectedListingDescriptionPreviewHtml(
      String(selectedItem.content || selectedItem.description || ""),
      String(selectedItem.price || ""),
    );
  }, [isClient, selectedItem]);
  const previewDetailItems = useMemo(
    () =>
      (activeDetailList?.items || [])
        .filter((item) => {
          if (!selectedItem || !item.relatedListingId) {
            return true;
          }
          return String(item.relatedListingId) === String(selectedItem.id);
        })
        .slice(0, 3),
    [activeDetailList?.items, selectedItem],
  );
  const descriptionForValidationRaw = String(form.description || form.content || "");
  const descriptionForValidation = extractPlainTextFromListingHtml(descriptionForValidationRaw).trim();
  const listingDescriptionMaxLength = getListingDescriptionMaxLength(primaryTab.id);
  const titleForValidation = String(form.title || "").trim();
  const categoryForValidation = String(form.category || "").trim();
  const cityForValidation = String(form.city || "").trim();
  const priceForValidation = String(form.price || "");
  const phoneCountryForValidation = String(form.phoneCountry || form.contactCountry || "");
  const rawPhoneForValidation = String(form.phone || form.contact || "");
  const normalizedPhoneForValidation = normalizePhoneNumber(rawPhoneForValidation, phoneCountryForValidation);
  const hasPhoneField = fields.some((field) => field.id === "phone" || field.id === "contactPhone" || field.type === "tel");
  const classifiedFieldErrors: Record<string, string> = {};
  if (isListingWorkspace) {
    if (titleForValidation.length === 0) {
      classifiedFieldErrors.title = "Le titre est requis.";
    } else if (titleForValidation.length < 3) {
      classifiedFieldErrors.title = "Le titre doit contenir au moins 3 caractères.";
    } else if (primaryTab.id === "classifieds" && titleForValidation.length > 40) {
      classifiedFieldErrors.title = "Le titre ne peut pas dépasser 40 caractères.";
    }

    if (primaryTab.id === "classifieds" && categoryForValidation.length === 0) {
      classifiedFieldErrors.category = "La catégorie est requise.";
    }

    if ((primaryTab.id === "classifieds" || primaryTab.id === "jobs") && cityForValidation.length === 0) {
      classifiedFieldErrors.city = "La ville est requise.";
    }

    if (primaryTab.id === "tenders" && String(form.location || "").trim().length === 0) {
      classifiedFieldErrors.location = "Le lieu est requis.";
    }

    if (primaryTab.id === "classifieds" && !isValidAmountValue(priceForValidation)) {
      classifiedFieldErrors.price = "Le prix est invalide. Entrez un montant supérieur à 0.";
    }

    if (primaryTab.id === "classifieds" && String(form.currency || "").trim().length === 0) {
      classifiedFieldErrors.currency = "La devise est requise.";
    }

    const minimumDescriptionLength = primaryTab.id === "classifieds" ? 30 : 80;
    if (descriptionForValidation.length < minimumDescriptionLength || descriptionForValidation.length > listingDescriptionMaxLength) {
      classifiedFieldErrors.description = `La description doit contenir entre ${minimumDescriptionLength} et ${listingDescriptionMaxLength} caractères.`;
    }

    if (hasPhoneField && rawPhoneForValidation.trim().length > 0 && !isValidPhoneNumber(rawPhoneForValidation, phoneCountryForValidation)) {
      classifiedFieldErrors.phone = "Le numéro de téléphone est invalide. Utilisez un format international valide.";
    }

    for (const field of fields) {
      if (!("required" in field) || !field.required || ["title", "description", "content"].includes(field.id)) {
        continue;
      }
      const value = form[field.id];
      const isEmpty = Array.isArray(value) ? value.length === 0 : String(value || "").trim().length === 0;
      if (isEmpty) {
        classifiedFieldErrors[field.id] = `${field.label} est requis.`;
      }
    }

    const emailValue = String(form.email || "").trim();
    if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      classifiedFieldErrors.email = "Saisissez une adresse email valide.";
    }
  }
  const isClassifiedFormValid = Object.keys(classifiedFieldErrors).length === 0;
  const getFieldError = (fieldId: string) => {
    if (!hasAttemptedSubmit || !isListingWorkspace) return "";
    return classifiedFieldErrors[fieldId] || serverFieldErrors[getSubmissionFieldKey(fieldId)] || "";
  };
  const photoUploaderErrors = new Set([
    `Vous pouvez ajouter jusqu'à ${classifiedMaxPhotos} photos maximum.`,
    "Chaque photo doit etre une image de moins de 5 Mo.",
    "Impossible d'envoyer une des photos.",
  ]);
  const photoUploaderError = photoUploaderErrors.has(formError) ? formError : "";
  const previewTitle = String(form.title || "").trim();
  const previewDescription = String(form.description || form.content || "");
  const previewLocation = formatStructuredLocation(String(form.city || ""), String(form.area || "")) || String(form.location || "").trim();
  const previewCategory = String(form.category || "").trim();
  const previewPrice = String(form.price || "");
  const previewBudget = String(form.budget || "").trim();
  const previewDeadline = String(form.deadline || "").trim();
  const previewEmail = String(form.email || "").trim();
  const previewType = String(form.type || "").trim();
  const previewCurrency = String(form.currency || "").trim() || "MGA";
  const previewPhone = normalizePhoneNumber(String(form.phone || form.contact || ""), String(form.phoneCountry || form.contactCountry || ""));
  const previewImages = (Array.isArray(form.images) ?form.images : []).filter((value): value is string => typeof value === "string" && value.length > 0);
  const previewPrimaryImage = previewImages[0] || String(form.image || form.photo || form.coverImage || "");
  const shouldShowPreviewHeroImage = primaryTab.id === "classifieds";
  const isEditingListingItem = isListingWorkspace && Boolean(editingItemId);
  const editingItem = useMemo(
    () => primaryList.items.find((item) => item.id === editingItemId) || null,
    [editingItemId, primaryList.items],
  );
  const isEditingPublishedListingItem =
    isListingWorkspace && String(editingItem?.postStatus || "").toLowerCase() === "publish";
  const isPublishPreview = classifiedPreviewMode === "publish" && Boolean(classifiedPreviewTargetItem);
  const shouldShowPublishOptionsInFormPreview =
    !isEditingListingItem && (primaryTab.id === "jobs" || primaryTab.id === "tenders");
  const showPreviewPublishControls = isPublishPreview || shouldShowPublishOptionsInFormPreview;
  const activePreviewItem = isPublishPreview ? classifiedPreviewTargetItem : null;
  const previewFallbackTitle =
    primaryTab.id === "jobs" ? "Offre sans titre" : primaryTab.id === "tenders" ? "Appel d'offres sans titre" : "Annonce sans titre";
  const resolvedPreviewTitle = activePreviewItem ? activePreviewItem.title || previewFallbackTitle : previewTitle || previewFallbackTitle;
  const getListingFieldClassName = useCallback(
    (fieldId: string) => {
      if (primaryTab.id === "classifieds" && fieldId === "title") {
        return "block md:col-span-2";
      }

      if ((primaryTab.id === "jobs" || primaryTab.id === "tenders") && (fieldId === "skills" || fieldId === "description" || fieldId === "detailsPdfUrl")) {
        return "block md:col-span-2";
      }

      return "block";
    },
    [primaryTab.id],
  );
  const resolvedPreviewDescription = activePreviewItem
    ? String(activePreviewItem.content || activePreviewItem.description || "").trim() || "Aucune description saisie."
    : previewDescription || "Aucune description saisie.";
  const resolvedPreviewLocation = activePreviewItem ? String(activePreviewItem.location || "").trim() : previewLocation;
  const resolvedPreviewCategory = activePreviewItem ? String(activePreviewItem.category || "").trim() : previewCategory;
  const resolvedPreviewPrice = activePreviewItem ? String(activePreviewItem.price || "") : previewPrice;
  const previewDescriptionHtml = isClient ? sanitizeListingHtml(resolvedPreviewDescription) : "";
  const previewDescriptionText = getListingDisplayText(resolvedPreviewDescription, resolvedPreviewPrice);
  const resolvedPreviewBudget = activePreviewItem
    ? String((activePreviewItem as WorkspaceItem).budget || (activePreviewItem as WorkspaceItem).price || "")
    : previewBudget;
  const resolvedPreviewDeadline = activePreviewItem ? String(activePreviewItem.deadline || "").trim() : previewDeadline;
  const resolvedPreviewEmail = activePreviewItem ? String(activePreviewItem.contactEmail || "").trim() : previewEmail;
  const resolvedPreviewSkills = activePreviewItem
    ? (Array.isArray(activePreviewItem.skills) ? activePreviewItem.skills : []).map((skill) => String(skill || "").trim()).filter(Boolean)
    : (Array.isArray(form.skills) ? form.skills : []).map((skill) => String(skill || "").trim()).filter(Boolean);
  const resolvedPreviewType = supportsTypeSelection
    ? activePreviewItem ? String(activePreviewItem.type || "").trim() : previewType
    : "";
  const resolvedPreviewCurrency = activePreviewItem ? String(activePreviewItem.currency || "").trim() || "MGA" : previewCurrency;
  const resolvedPreviewPhone = activePreviewItem
    ? normalizePhoneNumber(String(activePreviewItem.contactPhone || ""), String(activePreviewItem.contactPhoneCountry || ""))
    : previewPhone;
  const resolvedPreviewImages = activePreviewItem
    ? (Array.isArray(activePreviewItem.images) ? activePreviewItem.images : []).filter((value): value is string => typeof value === "string" && value.length > 0)
    : previewImages;
  const resolvedPreviewPrimaryImage = activePreviewItem
    ? resolvedPreviewImages[0] || String(activePreviewItem.image || "")
    : previewPrimaryImage;
  const previewHeroValue =
    primaryTab.id === "classifieds"
      ? resolvedPreviewPrice
        ? formatListingMoney(resolvedPreviewPrice, resolvedPreviewCurrency)
        : ""
      : primaryTab.id === "tenders"
      ? resolvedPreviewBudget
      : supportsTypeSelection
        ? resolvedPreviewType
        : resolvedPreviewCategory;
  const previewPrimaryInfoLabel =
    primaryTab.id === "classifieds" ? "Prix" : primaryTab.id === "tenders" ? "Budget" : supportsTypeSelection ? "Type" : "Catégorie";
  const previewPrimaryInfoValue =
    primaryTab.id === "classifieds"
      ? resolvedPreviewPrice
        ? formatListingMoney(resolvedPreviewPrice, resolvedPreviewCurrency)
        : "Non renseigné"
      : primaryTab.id === "tenders"
        ? resolvedPreviewBudget || "Non renseigné"
        : supportsTypeSelection
          ? resolvedPreviewType || "Non renseigné"
          : resolvedPreviewCategory || "Non renseignée";
  const previewSecondaryInfoLabel = primaryTab.id === "jobs" || primaryTab.id === "tenders" ? "Date limite" : "Catégorie";
  const previewSecondaryInfoValue =
    primaryTab.id === "jobs" || primaryTab.id === "tenders"
      ? resolvedPreviewDeadline || "Non renseignée"
      : resolvedPreviewCategory || "Non renseignée";
  useEffect(() => {
    // The server-rendered workspace is the initial source of truth. Reloading it
    // here retriggered every conversation lookup after each route transition.
    setIsLoadingWorkspace(false);
  }, []);

  useEffect(() => {
    if (workspaceTypeFilter === "Tous") {
      return;
    }

    if (supportsTypeSelection && primaryTab.id === "classifieds" && workspaceCategoryFilter === "Toutes") {
                        setWorkspaceTypeFilter("Tous");
      return;
    }

    if (!workspaceTypeOptions.includes(workspaceTypeFilter)) {
      setWorkspaceTypeFilter("Tous");
    }
  }, [primaryTab.id, supportsTypeSelection, workspaceCategoryFilter, workspaceTypeFilter, workspaceTypeOptions, workspaceTypeOptionsKey]);

  useEffect(() => {
    setWorkspacePage(1);
  }, [workspaceSearchQuery, workspaceStatusFilter, workspaceCategoryFilter, workspaceTypeFilter]);

  useEffect(() => {
    if (workspacePage > totalWorkspacePages) {
      setWorkspacePage(totalWorkspacePages);
    }
  }, [totalWorkspacePages, workspacePage]);

  useEffect(() => {
    if (selectedItemId && !selectablePrimaryItems.some((item) => item.id === selectedItemId)) {
      setSelectedItemId("");
    }
  }, [selectablePrimaryItems, selectedItemId]);

  useEffect(() => {
    if (!activeDetailTabId && detailTabs[0]) {
      setActiveDetailTabId(detailTabs[0].id);
    }
  }, [activeDetailTabId, detailTabs]);

  useEffect(() => {
    // Dedicated create/edit routes keep phone input manual. Fetching the full
    // profile here made opening a form depend on an unrelated network request.
    if (isStandaloneCreateRoute || isStandaloneEditRoute) {
      return;
    }

    if (primaryTab.id !== "classifieds") {
      return;
    }

    if (!isCreateMode) {
      return;
    }

    let isCancelled = false;
    async function loadProfilePhone() {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), getWorkspaceRequestTimeoutMs());
      try {
        const response = await fetch("/api/auth/profile", { cache: "no-store", signal: controller.signal });
        const payload = (await response.json().catch(() => null)) as { profile?: { phone?: string } } | null;
        const phone = (payload?.profile?.phone || "").trim();
        if (!response.ok || !phone || isCancelled) {
          return;
        }

        setProfilePhone(phone);
        setPhonePreference("profile");
        setForm((current) => {
          const currentPhone = String(current.phone || "").trim();
          if (currentPhone.length > 0) {
            return current;
          }
          return {
            ...current,
            phone: phone,
          };
        });
      } catch {
        return;
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    loadProfilePhone();
    return () => {
      isCancelled = true;
    };
  }, [isCreateMode, isListingWorkspace, isStandaloneCreateRoute, isStandaloneEditRoute, primaryTab.id]);

  const reloadPublishingAccessStatus = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), getWorkspaceRequestTimeoutMs());
    try {
      const response = await fetch("/api/auth/publishing-access-status", { cache: "no-store", signal: controller.signal });
      const payload = (await response.json().catch(() => null)) as { status?: PublishingAccessStatusResult } | null;
      if (!response.ok || !payload?.status) {
        return;
      }

      setLivePublishingAccessStatus(payload.status);
    } catch {
      return;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }, []);

  useEffect(() => {
    if (!isCreateMode || typeof window === "undefined") {
      return;
    }

    performance.mark("listing-form-ready");
    try {
      performance.measure("listing-form-open", "listing-form-opened", "listing-form-ready");
    } catch {
      // The marker is diagnostic only and must never affect the form.
    }
  }, [isCreateMode]);

  useEffect(() => {
    if (!isStandaloneEditRoute || isCreateMode) {
      return;
    }

    const item = primaryList.items.find((entry) => entry.id === standaloneEditItemId);
    if (item) {
      openEditForm(item);
    }
  }, [isCreateMode, isStandaloneEditRoute, primaryList.items, standaloneEditItemId]);

  function renderFieldLabel(field: WorkspaceField) {
    return (
      <>
        {field.label}
        {"required" in field && field.required ?<span className="ml-1 text-[#27624f]">*</span> : null}
      </>
    );
  }

  function updateField(fieldId: string, value: string | string[], termId?: number) {
    setHasConfirmedClassifiedPreview(false);
    setForm((current) => {
      const nextForm = { ...current, [fieldId]: value };
      if (fieldId === "category") {
        const nextCategory = typeof value === "string" ? value.trim() : "";
        const nextTypeOptions = nextCategory
          ? childTaxonomyTerms.filter((term) => term.parentName === nextCategory).map((term) => term.name)
          : [];
        const currentType = typeof current.type === "string" ? current.type : "";
        if (!nextTypeOptions.includes(currentType)) {
          nextForm.type = "";
        }
      }

      if (fieldId === "city") {
        nextForm.area = "";
        nextForm.location = "";
      }

      if (fieldId === "area" || fieldId === "city") {
        const nextCity = fieldId === "city" ? String(value || "").trim() : String(current.city || "").trim();
        const nextArea = fieldId === "area" ? String(value || "").trim() : String(current.area || "").trim();
        nextForm.location = formatStructuredLocation(nextCity, nextArea);
      }
      return nextForm;
    });
    if (hasAttemptedSubmit) {
      setFormError("");
    }
    setServerFieldErrors((current) => {
      const submissionFieldId = getSubmissionFieldKey(fieldId);
      if (!current[submissionFieldId]) return current;
      const next = { ...current };
      delete next[submissionFieldId];
      return next;
    });
    if (typeof value === "string" && (fieldId === "category" || fieldId === "city")) {
      onFormSelectionChange?.(fieldId, value, termId);
    }
  }

  function addTagValue(fieldId: string, rawValue: string, maxSelections = 5) {
    const normalizedValue = normalizeWorkspaceText(rawValue).replace(/\s+/g, " ");
    if (!normalizedValue) {
      return;
    }

    if (fieldId === "skills" && normalizedValue.length > MAX_JOB_SKILL_LENGTH) {
      setTagFieldErrors((current) => ({
        ...current,
        [fieldId]: `Chaque compétence est limitée à ${MAX_JOB_SKILL_LENGTH} caractères.`,
      }));
      return;
    }

    setForm((current) => {
      const currentValues = Array.isArray(current[fieldId]) ? current[fieldId].map((value) => String(value || "").trim()).filter(Boolean) : [];
      const alreadyExists = currentValues.some((value) => value.toLowerCase() === normalizedValue.toLowerCase());
      if (alreadyExists || currentValues.length >= maxSelections) {
        return current;
      }

      return {
        ...current,
        [fieldId]: [...currentValues, normalizedValue],
      };
    });
    setTagDrafts((current) => ({ ...current, [fieldId]: "" }));
    setTagFieldErrors((current) => {
      if (!current[fieldId]) return current;
      const next = { ...current };
      delete next[fieldId];
      return next;
    });
    if (hasAttemptedSubmit) {
      setFormError("");
    }
  }

  function removeTagValue(fieldId: string, tagValue: string) {
    setForm((current) => {
      const currentValues = Array.isArray(current[fieldId]) ? current[fieldId].map((value) => String(value || "").trim()).filter(Boolean) : [];
      return {
        ...current,
        [fieldId]: currentValues.filter((value) => value.toLowerCase() !== tagValue.toLowerCase()),
      };
    });
    if (hasAttemptedSubmit) {
      setFormError("");
    }
  }

  async function handleImageChange(fieldId: string, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFormError("Choisissez un fichier image valide.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError("L'image doit faire moins de 5 Mo.");
      event.target.value = "";
      return;
    }

    if (primaryTab.id === "classifieds") {
      if (pendingFeaturedImage?.previewUrl) {
        URL.revokeObjectURL(pendingFeaturedImage.previewUrl);
      }

      const previewUrl = URL.createObjectURL(file);
      setPendingFeaturedImage({ file, previewUrl });
      updateField(fieldId, previewUrl);
      setFormError("");
      return;
    }

    setIsUploadingImages(true);

    try {
      const uploadedPublicUrl = await uploadImageToStorage(file);
      updateField(fieldId, uploadedPublicUrl);
      setFormError("");
    } catch (error) {
      setFormError(error instanceof Error ?error.message : "Impossible d'envoyer cette image.");
      event.target.value = "";
    } finally {
      setIsUploadingImages(false);
    }
  }



  async function handleImageGalleryChange(fieldId: string, event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      return;
    }

    const currentImages = Array.isArray(form[fieldId]) ?form[fieldId] : [];
    const remainingSlots = Math.max(0, classifiedMaxPhotos - currentImages.length);
    if (remainingSlots <= 0) {
      setFormError(`Vous pouvez ajouter jusqu'à ${classifiedMaxPhotos} photos maximum.`);
      event.target.value = "";
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);
    const invalidFile = selectedFiles.find((file) => !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024);
    if (invalidFile) {
      setFormError("Chaque photo doit etre une image de moins de 5 Mo.");
      event.target.value = "";
      return;
    }

    if (primaryTab.id === "classifieds") {
      const nextEntries = selectedFiles.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      setPendingGalleryImages((current) => [...current, ...nextEntries].slice(0, classifiedMaxPhotos));
      updateField(fieldId, [...currentImages, ...nextEntries.map((entry) => entry.previewUrl)].slice(0, classifiedMaxPhotos));
      setFormError("");
      event.target.value = "";
      return;
    }

    try {
      setIsUploadingImages(true);
      const nextImages = await Promise.all(selectedFiles.map((file) => uploadImageToStorage(file)));
      updateField(fieldId, [...currentImages, ...nextImages].slice(0, classifiedMaxPhotos));
      setFormError("");
    } catch {
      setFormError("Impossible d'envoyer une des photos.");
    } finally {
      setIsUploadingImages(false);
      event.target.value = "";
    }
  }

  function removeImageFromGallery(fieldId: string, indexToRemove: number) {
    const currentImages = Array.isArray(form[fieldId]) ?form[fieldId] : [];
    if (primaryTab.id === "classifieds") {
      const removedImage = currentImages[indexToRemove];
      setPendingGalleryImages((current) => {
        const matchingEntry = current.find((entry) => entry.previewUrl === removedImage);
        if (matchingEntry) {
          URL.revokeObjectURL(matchingEntry.previewUrl);
        }
        return current.filter((entry) => entry.previewUrl !== removedImage);
      });
    }
    updateField(
      fieldId,
      currentImages.filter((_, index) => index !== indexToRemove),
    );
  }

  async function handlePdfChange(fieldId: string, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setIsUploadingImages(true);
      const uploaded = await uploadPdfToStorage(file);
      updateField(fieldId, uploaded.url);
      updateField("detailsPdfName", uploaded.fileName);
      setFormError("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Impossible d'envoyer ce TDR.");
      event.target.value = "";
    } finally {
      setIsUploadingImages(false);
    }
  }

  function isPendingItem(item: WorkspaceItem) {
    if (item.finalizationStatus === "processing" || item.finalizationStatus === "retrying") {
      return true;
    }
    const postStatus = String(item.postStatus || "").toLowerCase();
    if (item.isExpired) {
      return true;
    }
    if (postStatus === "draft" || postStatus === "pending") {
      return true;
    }
    return (item.paymentStatus || "").toLowerCase() !== "paid";
  }

  async function reloadWorkspace(includeDetails = false) {
    if (!dataEndpoint) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), getWorkspaceRequestTimeoutMs());

    try {
      const workspaceUrl = includeDetails ? `${dataEndpoint}${dataEndpoint.includes("?") ? "&" : "?"}includeDetails=1` : dataEndpoint;
      const workspaceResponse = await fetch(workspaceUrl, { cache: "no-store", signal: controller.signal });
      const workspaceData = await workspaceResponse.json();
      if (workspaceResponse.ok && workspaceData.workspace) {
        const nextWorkspace = normalizeWorkspaceLists(
          workspaceData.workspace as Record<string, { title: string; items: WorkspaceItem[] }>,
          tabs,
        );
        setItemsByTab((current) => {
          const next = {
            ...current,
            [primaryTab.id]: nextWorkspace[primaryTab.id],
          };
          if (includeDetails) {
            for (const tab of detailTabs) {
              next[tab.id] = nextWorkspace[tab.id];
            }
          }
          return next;
        });
        return true;
      }
      return false;
    } catch {
      // A completed mutation remains successful if the follow-up list refresh fails.
      return false;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  useEffect(() => {
    if (primaryTab.id !== "classifieds" || !dataEndpoint) {
      return;
    }

    const pendingIds = (itemsByTab[primaryTab.id]?.items || [])
      .filter((item) => item.finalizationStatus === "processing" || item.finalizationStatus === "retrying")
      .map((item) => item.id)
      .filter((id) => /^\d+$/.test(id));
    if (pendingIds.length === 0) {
      return;
    }

    let cancelled = false;
    const pollFinalization = async () => {
      const statuses = await Promise.all(
        pendingIds.map(async (listingId) => {
          const response = await fetch(`/api/submissions/classified/${listingId}/finalization-status`, { cache: "no-store" }).catch(() => null);
          return response?.ok ? response.json().catch(() => null) : null;
        }),
      );
      if (cancelled) {
        return;
      }

      const byId = new Map(
        statuses
          .filter((status): status is { listingId: number; finalizationStatus: WorkspaceItem["finalizationStatus"] } =>
            Number.isFinite(Number(status?.listingId)) && typeof status?.finalizationStatus === "string",
          )
          .map((status) => [String(status.listingId), status]),
      );
      if (byId.size === 0) {
        return;
      }

      let reachedTerminalStatus = false;
      setItemsByTab((current) => {
        const section = current[primaryTab.id];
        if (!section) {
          return current;
        }
        const items = section.items.map((item) => {
          const status = byId.get(item.id);
          if (!status || status.finalizationStatus === item.finalizationStatus) {
            return item;
          }
          if (status.finalizationStatus === "ready" || status.finalizationStatus === "failed") {
            reachedTerminalStatus = true;
          }
          return { ...item, finalizationStatus: status.finalizationStatus };
        });
        return { ...current, [primaryTab.id]: { ...section, items } };
      });
      if (reachedTerminalStatus) {
        void reloadWorkspace();
      }
    };

    void pollFinalization();
    const intervalId = window.setInterval(() => void pollFinalization(), 2500);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [dataEndpoint, primaryTab.id, (itemsByTab[primaryTab.id]?.items || [])
    .filter((item) => item.finalizationStatus === "processing" || item.finalizationStatus === "retrying")
    .map((item) => item.id)
    .filter((id) => /^\d+$/.test(id))
    .join(",")]);

  function canMoveItemToDraft(item: WorkspaceItem) {
    return item.paymentStatus === "paid" && item.postStatus === "publish" && !item.isExpired;
  }

  function canBoostItem(item: WorkspaceItem) {
    return item.finalizationStatus === "ready" && item.paymentStatus === "paid" && item.postStatus === "publish" && !item.isExpired && !isScheduledWorkspaceItem(item);
  }

  async function handleMoveToDraft(item: WorkspaceItem) {
    if (!statusEndpoint) {
      return;
    }

    setFormError("");
    setPaymentError("");
    setIsUpdatingStatusItemId(item.id);

    try {
      const response = await fetch(`${statusEndpoint}/${item.id}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const errorBody = typeof payload?.error === "string" ?payload.error : "";
        throw new Error(errorBody || "Impossible de changer le statut.");
      }

      await reloadWorkspace();
    } catch (error) {
      setFormError(getUserFacingErrorMessage(error, "Impossible de changer le statut."));
    } finally {
      setIsUpdatingStatusItemId("");
    }
  }

  async function handlePublish(item: WorkspaceItem, scheduledPublishAt?: string): Promise<boolean> {
    setPaymentError("");

    if (primaryTab.id === "tenders" && !canPublishTenders) {
      setPaymentError("Votre plan actuel ne permet pas de publier un appel d'offres.");
      return false;
    }

    setIsPayingItemId(item.id);

    try {
      const includedPublicationKind = primaryTab.id === "classifieds"
        ? "classified"
        : primaryTab.id === "jobs"
          ? "job"
          : primaryTab.id === "tenders"
            ? "tender"
            : null;
      if (includedPublicationKind) {
        const response = await fetch("/api/submissions/listing/publish-included", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            listingId: Number.parseInt(item.id, 10),
            kind: includedPublicationKind,
            scheduledPublishAt,
          }),
        });

        const payload = (await response.json().catch(() => null)) as {
          error?: string;
          paymentRequired?: boolean;
          paymentStatus?: string;
          postStatus?: string;
          isScheduled?: boolean;
          scheduledPublishAt?: string | null;
          expiresAt?: string;
          publishingAccessStatus?: PublishingAccessStatusResult | null;
        } | null;
        if (response.ok) {
          const contentType = toAnalyticsListingType(primaryTab.id);
          if (contentType) {
            trackListingPublished(contentType, scheduledPublishAt ? "scheduled" : "immediate");
          }
          setItemsByTab((current) => {
            const currentSection = current[primaryTab.id];
            if (!currentSection) {
              return current;
            }

            return {
              ...current,
              [primaryTab.id]: {
                ...currentSection,
                items: currentSection.items.map((workspaceItem) =>
                  workspaceItem.id === item.id
                    ? {
                        ...workspaceItem,
                        paymentStatus: payload?.paymentStatus || "paid",
                        postStatus: payload?.postStatus || "publish",
                        isScheduled: payload?.isScheduled,
                        scheduledPublishAt: payload?.scheduledPublishAt || undefined,
                        expiresAt: payload?.expiresAt || workspaceItem.expiresAt,
                        isExpired: false,
                      }
                    : workspaceItem,
                ),
              },
            };
          });

          if (payload?.publishingAccessStatus) {
            setLivePublishingAccessStatus(payload.publishingAccessStatus);
          } else {
            await reloadPublishingAccessStatus();
          }
          await reloadWorkspace();
          return true;
        }

        if (!payload?.paymentRequired) {
          const fallbackMessage = includedPublicationKind === "job"
            ? "Impossible de publier cette offre."
            : includedPublicationKind === "tender"
              ? "Impossible de publier cet appel d'offres."
              : "Impossible de publier cette annonce.";
          throw new Error(payload?.error || fallbackMessage);
        }
      }

      const checkoutUrl = new URL("/checkout/listing", window.location.origin);
      checkoutUrl.searchParams.set("listingId", item.id);
      checkoutUrl.searchParams.set("kind", checkoutKind);
      checkoutUrl.searchParams.set("action", "post");
      checkoutUrl.searchParams.set("returnTo", window.location.pathname || "/profil");
      if (scheduledPublishAt) {
        checkoutUrl.searchParams.set("scheduledPublishAt", scheduledPublishAt);
      }
      const contentType = toAnalyticsListingType(primaryTab.id);
      if (contentType) {
        trackCheckoutStarted("listing", contentType);
      }
      window.location.href = checkoutUrl.toString();
      return true;
    } catch (error) {
      setPaymentError(getUserFacingErrorMessage(error, "Impossible de lancer le paiement."));
      return false;
    } finally {
      setIsPayingItemId("");
    }
  }

  function closeClassifiedPreview() {
    setIsClassifiedPreviewOpen(false);
    setClassifiedPreviewMode("form");
    setClassifiedPreviewTargetItem(null);
    setPreviewPublishChoice("now");
    setScheduledPublishDate(getScheduledPublishDateMin());
    setScheduledPublishTime(getDefaultScheduledPublishTime());
  }

  function openPublishPreview(item: WorkspaceItem) {
    setSelectedItemId(item.id);
    setEditingItemId(null);
    setIsCreateMode(false);
    setPaymentError("");
    setClassifiedPreviewMode("publish");
    setClassifiedPreviewTargetItem(item);
    setPreviewPublishChoice("now");
    setScheduledPublishDate(getScheduledPublishDateMin());
    setScheduledPublishTime(getDefaultScheduledPublishTime());
    setIsClassifiedPreviewOpen(true);
  }

  async function confirmClassifiedPreviewAction(choiceOverride?: "now" | "later") {
    if (isPublishPreview && classifiedPreviewTargetItem) {
      const publishChoice = choiceOverride ?? previewPublishChoice;
      const scheduledValue =
        publishChoice === "later" ? buildScheduledPublishValue(scheduledPublishDate, scheduledPublishTime) : "";
      if (publishChoice === "later" && !scheduledValue) {
        setPreviewPublishChoice("later");
        setPaymentError("Choisissez une date et une heure de publication.");
        return;
      }

      setPreviewPublishChoice(publishChoice);
      closeClassifiedPreview();
      await handlePublish(classifiedPreviewTargetItem, scheduledValue || undefined);
      return;
    }

    if (shouldShowPublishOptionsInFormPreview) {
      const publishChoice = choiceOverride ?? previewPublishChoice;
      const scheduledValue =
        publishChoice === "later" ? buildScheduledPublishValue(scheduledPublishDate, scheduledPublishTime) : "";
      if (publishChoice === "later" && !scheduledValue) {
        setPreviewPublishChoice("later");
        setFormError("Choisissez une date et une heure de publication.");
        return;
      }

      setQueuedCreatePublishChoice(publishChoice);
      setQueuedCreateScheduledAt(scheduledValue);
      setHasConfirmedClassifiedPreview(true);
      closeClassifiedPreview();
      window.setTimeout(() => {
        createFormRef.current?.requestSubmit();
      }, 0);
      return;
    }

    setQueuedCreatePublishChoice("none");
    setQueuedCreateScheduledAt("");
    setHasConfirmedClassifiedPreview(true);
    closeClassifiedPreview();
    window.setTimeout(() => {
      createFormRef.current?.requestSubmit();
    }, 0);
  }

  async function handleBoost(item: WorkspaceItem) {
    setPaymentError("");
    setIsPayingItemId(item.id);

    try {
      const checkoutUrl = new URL("/checkout/listing", window.location.origin);
      checkoutUrl.searchParams.set("listingId", item.id);
      checkoutUrl.searchParams.set("kind", checkoutKind);
      checkoutUrl.searchParams.set("action", "boost");
      checkoutUrl.searchParams.set("returnTo", window.location.pathname || "/profil");
      const contentType = toAnalyticsListingType(primaryTab.id);
      if (contentType) {
        trackCheckoutStarted("listing", contentType);
      }
      window.location.href = checkoutUrl.toString();
    } catch (error) {
      setPaymentError(getUserFacingErrorMessage(error, "Impossible de lancer le boost."));
    } finally {
      setIsPayingItemId("");
    }
  }

  function handleWorkspaceItemPrimaryAction(item: WorkspaceItem) {
    if (updateEndpoint) {
      setSelectedItemId(item.id);
      setEditingItemId(null);
      setIsCreateMode(false);
      setFormError(canEditWorkspaceItem(item) ? "" : getWorkspaceItemEditLockReason(item));
      return;
    }

    if (detailBasePath) {
      router.push(`${detailBasePath}/${item.id}`);
      return;
    }

    setSelectedItemId(item.id);
    setEditingItemId(null);
    setIsCreateMode(false);
    setFormError("");
  }
  function renderPublishActions(item: WorkspaceItem, compact = false, scope: "selected" | "list" = "list") {
    const buttonClassName = compact
      ? "mt-3 inline-flex items-center justify-center rounded-xl bg-[#22c55e] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#16a34a] disabled:cursor-not-allowed disabled:opacity-60"
      : "mt-4 inline-flex items-center justify-center rounded-2xl bg-[#22c55e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#16a34a] disabled:cursor-not-allowed disabled:opacity-60";

    return (
      <div className={`${compact ? "mt-3" : "mt-4"} inline-flex flex-col items-start`}>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openPublishPreview(item);
          }}
          disabled={isPayingItemId === item.id || item.finalizationStatus === "processing" || item.finalizationStatus === "retrying"}
          className={buttonClassName}
        >
          {isPayingItemId === item.id ? "Publication..." : item.finalizationStatus === "processing" || item.finalizationStatus === "retrying" ? "Préparation..." : "Publier"}
        </button>
      </div>
    );
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormPhase("validating");
    setHasAttemptedSubmit(true);
    setFormError("");
    setFormMessageTone("error");
    setServerFieldErrors({});

    if (emailVerificationRequired) {
      setFormError("Activez votre compte depuis l'email de confirmation avant de créer un contenu.");
      return;
    }

    const titleValue = String(form.title || form.position || form.subject || "").trim();
        const descriptionValue = String(form.description || form.content || form.summary || "").trim();
        const descriptionPlainText = extractPlainTextFromListingHtml(descriptionValue).trim();
    const metaSource =
      String(form.contact || form.location || form.email || form.deadline || form.category || form.phone || "Brouillon");
    const imageValue = String(form.image || form.photo || form.coverImage || "");
    const imagesValue = Array.isArray(form.images) ? form.images : [];
    const nextItemId = `${primaryTab.id}-${Date.now()}`;

    if (createEndpoint) {
      try {
        const isUpdatingExistingItem = Boolean(editingItemId);
        if (isListingWorkspace) {
          const normalizedDescription = descriptionValue.trim();
          const minimumDescriptionLength = primaryTab.id === "classifieds" ? 30 : 80;
          if (descriptionPlainText.length < minimumDescriptionLength || descriptionPlainText.length > listingDescriptionMaxLength) {
            setFormError(`La description doit contenir entre ${minimumDescriptionLength} et ${listingDescriptionMaxLength} caractères.`);
            setIsCreating(false);
            return;
          }

          if (!isClassifiedFormValid) {
            setFormError("Veuillez corriger les champs en rouge.");
            setIsCreating(false);
            return;
          }
        }

        const featuredImageUrl = imagesValue[0] || imageValue || "";
        const galleryImageUrls = imagesValue.slice(0, classifiedMaxPhotos);

        const companyNameValue = String(form.companyName || form.organization || "");
        const categoryValue = String(form.category || form.employmentType || "").trim();
        const productTagValue = String(form.productTag || "").trim();
        const conditionValue = String(form.condition || "").trim();
        const typeValue = String(form.type || "").trim();
        const cityValue = String(form.city || "").trim();
        const areaValue = String(form.area || "").trim();
        const locationValue = primaryTab.id === "tenders"
          ? String(form.location || "").trim()
          : formatStructuredLocation(cityValue, areaValue);
        const contactEmailValue = String(form.email || "").trim();
        const rawPriceValue = String(form.price || "");
        const priceValue = normalizeAmountValue(rawPriceValue);
        const budgetValue = normalizeAmountValue(String(form.budget || ""));
        const rawContactPhoneValue = String(form.phone || form.contact || "");
        const contactPhoneCountryValueRaw = String(form.phoneCountry || form.contactCountry || "").trim();
        const contactPhoneCountryValue = contactPhoneCountryValueRaw ?contactPhoneCountryValueRaw.toUpperCase() : "";
        const contactPhoneValue = normalizePhoneNumber(rawContactPhoneValue, contactPhoneCountryValue);
        const normalizedDescription =
          primaryTab.id === "classifieds"
            ? stripTrailingDuplicatedPrice(descriptionValue, rawPriceValue)
            : descriptionValue.trim();
        const contentPayload = normalizedDescription;

        if (primaryTab.id === "classifieds" && !isValidAmountValue(rawPriceValue)) {
          setFormError("Le prix est invalide. Entrez un montant numerique superieur a 0.");
          setIsCreating(false);
          return;
        }

        if (primaryTab.id === "classifieds" && titleValue.length > 40) {
          setFormError("Le titre ne peut pas dépasser 40 caractères.");
          setIsCreating(false);
          return;
        }

        if (rawContactPhoneValue.trim().length > 0 && !isValidPhoneNumber(rawContactPhoneValue, contactPhoneCountryValue)) {
          setFormError("Le numéro de téléphone est invalide. Utilisez un format international valide.");
          setIsCreating(false);
          return;
        }

        setIsCreating(true);
        setFormPhase(pendingFeaturedImage || pendingGalleryImages.length > 0 ? "uploading" : "saving");

        let resolvedFeaturedImageUrl = featuredImageUrl;
        let resolvedGalleryImageUrls = galleryImageUrls;
        if (primaryTab.id === "classifieds") {
          try {
            if (pendingFeaturedImage) {
              resolvedFeaturedImageUrl = await uploadImageToStorage(pendingFeaturedImage.file);
            }

            if (pendingGalleryImages.length > 0) {
              const existingGalleryImages = galleryImageUrls.filter(
                (imageUrl) => !pendingGalleryImages.some((entry) => entry.previewUrl === imageUrl),
              );
              const uploadedGalleryImages = await Promise.all(
                pendingGalleryImages.map((entry) => uploadImageToStorage(entry.file)),
              );
              resolvedGalleryImageUrls = [...existingGalleryImages, ...uploadedGalleryImages].slice(0, classifiedMaxPhotos);
              if (resolvedGalleryImageUrls.length > 0) {
                resolvedFeaturedImageUrl = resolvedGalleryImageUrls[0] || "";
              }
            }
          } catch (error) {
            setFormError(error instanceof Error ? error.message : "Impossible d'envoyer une des photos.");
            setIsCreating(false);
            return;
          }
        }

        const endpoint = editingItemId && updateEndpoint ?`${updateEndpoint}/${editingItemId}` : createEndpoint;
        const method = editingItemId && updateEndpoint ?"PATCH" : "POST";
        setFormPhase("saving");
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), getWorkspaceRequestTimeoutMs());
        const savedRequestId = !editingItemId ? window.sessionStorage.getItem(submissionRequestStorageKey) : null;
        const requestId = submissionRequestIdRef.current || savedRequestId || crypto.randomUUID();
        submissionRequestIdRef.current = requestId;
        if (!editingItemId) {
          window.sessionStorage.setItem(submissionRequestStorageKey, requestId);
        }
        let response: Response | null = null;
        let responsePayload: any = null;
        const isTrackedClassifiedCreate = primaryTab.id === "classifieds" && !editingItemId;
        try {
          const maxAttempts = isTrackedClassifiedCreate
            ? CLASSIFIED_CREATE_RECOVERY_ATTEMPTS
            : WORKSPACE_SUBMISSION_MAX_ATTEMPTS;
          for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
            response = await fetch(endpoint, {
              method,
              signal: controller.signal,
              headers: {
                "Content-Type": "application/json",
                "X-Idempotency-Key": requestId,
              },
              body: JSON.stringify({
                title: titleValue,
                excerpt: descriptionPlainText.slice(0, 180),
                content: contentPayload || descriptionValue,
                companyName: companyNameValue,
                category: categoryValue,
                productTag: productTagValue || undefined,
                condition: conditionValue || undefined,
                type: typeValue || undefined,
                location: locationValue || undefined,
                city: cityValue || undefined,
                area: areaValue || undefined,
                skills: Array.isArray(form.skills)
                  ? form.skills.map((value) => String(value || "").trim()).filter(Boolean)
                  : undefined,
                experienceYears: String(form.experienceYears || "").trim() || undefined,
                needBy:
                  primaryTab.id === "jobs" ? undefined : String(form.needBy || "").trim() || undefined,
                price: priceValue,
                currency: String(form.currency || "").trim() || undefined,
                budget: budgetValue,
                deadline: String(form.deadline || ""),
                detailsPdfUrl: String(form.detailsPdfUrl || "").trim() || undefined,
                detailsPdfName: String(form.detailsPdfName || "").trim() || undefined,
                contactPhone: contactPhoneValue,
                contactPhoneCountry: contactPhoneCountryValue || undefined,
                contactEmail: contactEmailValue || undefined,
                featuredImageUrl: resolvedFeaturedImageUrl,
                galleryImageUrls: primaryTab.id === "classifieds" ? resolvedGalleryImageUrls : [],
              }),
            });
            responsePayload = await response.json().catch(() => null);
            const errorBody = typeof responsePayload?.error === "string" ? responsePayload.error : "";
            const isStillProcessing =
              response.status === 202 ||
              (response.status === 409 && errorBody.toLowerCase().includes("deja en cours de traitement"));

            if (!isStillProcessing || attempt === maxAttempts - 1) {
              break;
            }

            const retryAfterMs = Number(responsePayload?.retryAfterMs);
            await waitForWorkspaceRequest(
              Number.isFinite(retryAfterMs) && retryAfterMs > 0
                ? retryAfterMs
                : WORKSPACE_SUBMISSION_RETRY_DELAY_MS,
            );
          }
        } finally {
          window.clearTimeout(timeoutId);
        }

        const errorBody = typeof responsePayload?.error === "string" ? responsePayload.error : "";
        const isStillProcessing =
          response?.status === 202 ||
          (response?.status === 409 && errorBody.toLowerCase().includes("deja en cours de traitement"));
        if (!response || !response.ok || isStillProcessing) {
          // A response was received, so the server rejected this submission.
          const isUnknownServerOutcome = response?.status === undefined || response.status >= 500;
          // Keep the idempotency key after a timeout or an in-progress response.
          // A retry can then retrieve the already-created listing instead of making a duplicate.
          if (!isStillProcessing && !isUnknownServerOutcome) {
            submissionRequestIdRef.current = null;
            window.sessionStorage.removeItem(submissionRequestStorageKey);
          }
          const responseFieldErrors = responsePayload?.fieldErrors;
          if (responseFieldErrors && typeof responseFieldErrors === "object" && !Array.isArray(responseFieldErrors)) {
            setServerFieldErrors(
              Object.fromEntries(
                Object.entries(responseFieldErrors).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
              ),
            );
          }
          if (isStillProcessing || isUnknownServerOutcome) {
            setFormMessageTone("notice");
          }
          throw new Error(
            isStillProcessing || isUnknownServerOutcome
              ? "Nous finalisons l'enregistrement de votre annonce. Vos informations sont conservées : elle apparaîtra dans Mes annonces dans quelques instants."
              : errorBody || "Impossible d'enregistrer cette annonce.",
          );
        }

        submissionRequestIdRef.current = null;
        window.sessionStorage.removeItem(submissionRequestStorageKey);

        const createdListingId = Number.parseInt(String(responsePayload?.id || responsePayload?.listingId || ""), 10);
        if (isTrackedClassifiedCreate && Number.isFinite(createdListingId) && createdListingId > 0) {
          const finalizationStatus = ["processing", "retrying", "ready", "failed"].includes(responsePayload?.finalizationStatus)
            ? responsePayload.finalizationStatus as WorkspaceItem["finalizationStatus"]
            : "ready";
          setItemsByTab((current) => {
            const section = current[primaryTab.id] || { title: primaryTab.label, items: [] };
            if (section.items.some((item) => item.id === String(createdListingId))) {
              return current;
            }
            return {
              ...current,
              [primaryTab.id]: {
                ...section,
                items: [
                  {
                    id: String(createdListingId),
                    title: titleValue,
                    description: descriptionPlainText,
                    content: contentPayload || descriptionValue,
                    meta: finalizationStatus === "ready" ? "Brouillon" : "Finalisation en cours",
                    image: resolvedFeaturedImageUrl || resolvedGalleryImageUrls[0] || "",
                    images: resolvedGalleryImageUrls,
                    location: previewLocation,
                    city: cityForValidation,
                    area: String(form.area || "").trim(),
                    category: categoryValue,
                    type: typeValue,
                    productTag: productTagValue,
                    condition: conditionValue,
                    price: priceValue,
                    currency: String(form.currency || "MGA"),
                    contactPhone: normalizedPhoneForValidation,
                    contactPhoneCountry: contactPhoneCountryValue,
                    contactEmail: contactEmailValue,
                    companyName: companyNameValue,
                    postStatus: "draft",
                    paymentStatus: "unpaid",
                    finalizationStatus,
                  },
                  ...section.items,
                ],
              },
            };
          });
          // Keep the acknowledgement independent from the slower workspace list.
          void reloadWorkspace();
        } else {
          await reloadWorkspace();
        }
        setFormPhase("success");
        const contentType = toAnalyticsListingType(primaryTab.id);
        if (contentType) {
          trackListingSaved(contentType, isUpdatingExistingItem ? "updated" : "created");
        }

        if (
          !isUpdatingExistingItem &&
          queuedCreatePublishChoice !== "none" &&
          Number.isFinite(createdListingId) &&
          createdListingId > 0
        ) {
          const didStartPublication = await handlePublish(
            { id: String(createdListingId), title: titleValue, description: descriptionPlainText, meta: metaSource },
            queuedCreatePublishChoice === "later" ? queuedCreateScheduledAt || undefined : undefined,
          );
          if (didStartPublication) {
            closeWorkspaceForm();
          }
          return;
        }

        setForm(initialFormState);
        setHasAttemptedSubmit(false);
        setFormPhase("list");
        setIsCreateMode(false);
        setEditingItemId(null);
        setHasConfirmedClassifiedPreview(false);
        setQueuedCreatePublishChoice("none");
        setQueuedCreateScheduledAt("");
        if (pendingFeaturedImage?.previewUrl) {
          URL.revokeObjectURL(pendingFeaturedImage.previewUrl);
        }
        pendingGalleryImages.forEach((entry) => URL.revokeObjectURL(entry.previewUrl));
        setPendingFeaturedImage(null);
        setPendingGalleryImages([]);
        closeClassifiedPreview();
        Object.values(imageInputRefs.current).forEach((input) => {
          if (input) {
            input.value = "";
          }
        });
        if (isStandaloneCreateRoute || isStandaloneEditRoute) {
          router.replace(detailBasePath || "/profil");
        }
        return;
      } catch (error) {
        setFormPhase("error");
        setFormError(error instanceof Error ?error.message : "Impossible d'enregistrer cette annonce.");
        return;
      } finally {
        setIsCreating(false);
      }
    }

    setItemsByTab((current) => ({
      ...current,
      [primaryTab.id]: {
        ...primaryList,
        items: [
          {
            id: nextItemId,
            title: titleValue,
            description: descriptionPlainText,
            meta: metaSource,
            image: imageValue || imagesValue[0] || "",
            images: imagesValue.slice(0, 10),
          },
          ...primaryList.items,
        ],
      },
    }));

    setForm(initialFormState);
    setFormPhase("list");
    setIsCreateMode(false);
    setEditingItemId(null);
    setHasConfirmedClassifiedPreview(false);
    setQueuedCreatePublishChoice("none");
    setQueuedCreateScheduledAt("");
    if (pendingFeaturedImage?.previewUrl) {
      URL.revokeObjectURL(pendingFeaturedImage.previewUrl);
    }
    pendingGalleryImages.forEach((entry) => URL.revokeObjectURL(entry.previewUrl));
    setPendingFeaturedImage(null);
    setPendingGalleryImages([]);
    closeClassifiedPreview();
    setSelectedItemId(nextItemId);
    Object.values(imageInputRefs.current).forEach((input) => {
      if (input) {
        input.value = "";
      }
    });
    setIsCreating(false);
  }

  function openEditForm(item: WorkspaceItem) {
    if (emailVerificationRequired) {
      setPaymentError("Activez votre compte depuis l'email de confirmation avant de modifier un contenu.");
      return;
    }
    if (!canEditWorkspaceItem(item)) {
      setFormError(getWorkspaceItemEditLockReason(item));
      setIsCreateMode(false);
      return;
    }

    const taxonomySelection = resolveWorkspaceEditCategoryAndType(item, taxonomyTerms, usesHierarchicalTypes);
    setSelectedItemId(item.id);
    setEditingItemId(item.id);
    const fullDescriptionRaw = String(item.content || item.description || "");
    const fullDescription = stripTrailingDuplicatedPrice(fullDescriptionRaw, String(item.price || ""));
    setForm((current) => ({
      ...current,
      title: item.title || "",
      description: fullDescription,
      content: fullDescription,
      companyName: item.companyName || "",
      email: item.contactEmail || "",
      location: item.location || "",
      city: item.city || item.regions?.[0] || "",
      area: item.area || item.cities?.[0] || "",
      price: item.price || "",
        currency: item.currency || "MGA",
        phone: item.contactPhone || "",
        phoneCountry: item.contactPhoneCountry || "",
        category: taxonomySelection.category,
        productTag: item.productTag || "",
        condition: item.condition || "",
        type: taxonomySelection.type,
        skills: Array.isArray(item.skills) ? item.skills : [],
        experienceYears: item.experienceYears || "",
        needBy: primaryTab.id === "jobs" ? "" : item.needBy || "",
        deadline: item.deadline || item.needBy || "",
        detailsPdfUrl: item.detailsPdfUrl || "",
        detailsPdfName: item.detailsPdfName || "",
        budget: item.budget || item.price || "",
        images: Array.isArray(item.images) ?item.images : [],
        image: item.image || "",
    }));
    performance.mark("listing-form-opened");
    setFormPhase("edit");
    setIsCreateMode(true);
    setHasAttemptedSubmit(false);
    setFormError("");
    setHasConfirmedClassifiedPreview(false);
    setQueuedCreatePublishChoice("none");
    setQueuedCreateScheduledAt("");
    setClassifiedPreviewMode("form");
    setClassifiedPreviewTargetItem(null);
    setPreviewPublishChoice("now");
    setIsClassifiedPreviewOpen(false);
    setPendingFeaturedImage(null);
    setPendingGalleryImages([]);
  }

  function closeWorkspaceForm() {
    submissionRequestIdRef.current = null;
    window.sessionStorage.removeItem(submissionRequestStorageKey);
    setFormPhase("list");
    setForm(initialFormState);
    setIsCreateMode(false);
    setEditingItemId(null);
    setHasAttemptedSubmit(false);
    setFormError("");
    setHasConfirmedClassifiedPreview(false);
    setQueuedCreatePublishChoice("none");
    setQueuedCreateScheduledAt("");
    if (pendingFeaturedImage?.previewUrl) {
      URL.revokeObjectURL(pendingFeaturedImage.previewUrl);
    }
    pendingGalleryImages.forEach((entry) => URL.revokeObjectURL(entry.previewUrl));
    setPendingFeaturedImage(null);
    setPendingGalleryImages([]);
    closeClassifiedPreview();
    Object.values(imageInputRefs.current).forEach((input) => {
      if (input) {
        input.value = "";
      }
    });
    if (isStandaloneCreateRoute || isStandaloneEditRoute) {
      router.push(detailBasePath || "/profil");
    }
  }

  function openCreateForm() {
    if (emailVerificationRequired) {
      setPaymentError("Activez votre compte depuis l'email de confirmation avant de créer un contenu.");
      return;
    }

    if (primaryTab.id === "jobs" && !canCreateJobDraft) {
      setPaymentError("Votre plan actuel ne permet pas de créer une offre d'emploi.");
      return;
    }

    if (primaryTab.id === "tenders" && !canCreateTenderDraft) {
      setPaymentError("Votre plan actuel ne permet pas de créer un appel d'offres.");
      return;
    }

    const contentType = toAnalyticsListingType(primaryTab.id);
    if (contentType) {
      trackListingFormOpened(contentType);
    }

    // Opening a form is a navigation, not a state change inside the listing workspace.
    router.push(`${detailBasePath}/nouveau`);
  }

  async function handleDeleteItem(item: WorkspaceItem) {
    if (!deleteEndpoint) {
      return;
    }

    setIsDeletingItemId(item.id);
    setFormError("");

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), getWorkspaceRequestTimeoutMs());
      let response: Response | null = null;
      let responsePayload: { error?: string; retryAfterMs?: number } | null = null;
      try {
        for (let attempt = 0; attempt < WORKSPACE_SUBMISSION_MAX_ATTEMPTS; attempt += 1) {
          response = await fetch(`${deleteEndpoint}/${item.id}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          });
          responsePayload = await response.json().catch(() => null);

          if (response.status !== 202 || attempt === WORKSPACE_SUBMISSION_MAX_ATTEMPTS - 1) {
            break;
          }

          const retryAfterMs = Number(responsePayload?.retryAfterMs);
          await waitForWorkspaceRequest(
            Number.isFinite(retryAfterMs) && retryAfterMs > 0
              ? retryAfterMs
              : WORKSPACE_SUBMISSION_RETRY_DELAY_MS,
          );
        }
      } finally {
        window.clearTimeout(timeoutId);
      }

      if (!response?.ok) {
        throw new Error(getUserFacingErrorMessage(responsePayload?.error, "Suppression impossible."));
      }

      if (dataEndpoint) {
        await reloadWorkspace();
      } else {
        setItemsByTab((current) => ({
          ...current,
          [primaryTab.id]: {
            ...primaryList,
            items: primaryList.items.filter((entry) => entry.id !== item.id),
          },
        }));
      }

      if (selectedItemId === item.id) {
        setSelectedItemId("");
      }
      setPendingDeleteItem(null);
    } catch (error) {
      setFormError(error instanceof Error ?error.message : "Suppression impossible.");
    } finally {
      setIsDeletingItemId("");
    }
  }

  const shouldPrioritizeClassifiedLayout = isListingWorkspace;
  const isJobCreationBlockedForFree = primaryTab.id === "jobs" && jobsAccess?.canCreateDraft === false;
  const isTenderCreationBlocked = primaryTab.id === "tenders" && tendersAccess?.canCreateDraft === false;
  const isCurrentFormCreationBlocked =
    !editingItemId && (isJobCreationBlockedForFree || isTenderCreationBlocked);
  const shouldShowInlineWorkspacePricing =
    primaryTab.id === "classifieds"
      ? !classifiedAccess || classifiedAccess.monthlyRemaining <= 0
      : primaryTab.id === "jobs"
        ? !jobsAccess || jobsAccess.monthlyRemaining <= 0
        : primaryTab.id === "tenders"
          ? !tendersAccess || tendersAccess.monthlyRemaining <= 0
          : true;
  const shouldShowFormPricing =
    primaryTab.id === "classifieds"
      ? Boolean(pricingInfo) && (!classifiedAccess || classifiedAccess.monthlyRemaining <= 0)
      : primaryTab.id === "jobs"
        ? Boolean(pricingInfo) && (!jobsAccess || jobsAccess.monthlyRemaining <= 0)
        : primaryTab.id === "tenders"
          ? Boolean(pricingInfo) && (!tendersAccess || tendersAccess.monthlyRemaining <= 0)
          : false;
  const activeWorkspaceQuota =
    primaryTab.id === "classifieds" ? classifiedAccess
    : primaryTab.id === "jobs" ? jobsAccess
    : primaryTab.id === "tenders" ? tendersAccess
    : null;
  const workspaceQuotaUsed = activeWorkspaceQuota?.monthlyLimit
    ? Math.max(0, activeWorkspaceQuota.monthlyLimit - activeWorkspaceQuota.monthlyRemaining)
    : 0;

  return (
    <Workspace>
      {isCreateMode ? (
        <div className="mb-3 flex items-center justify-start">
          <button
            type="button"
            onClick={closeWorkspaceForm}
            className="inline-flex min-h-[40px] items-center justify-center rounded-2xl border border-[#d7d7d7] bg-white px-3.5 py-2 text-sm font-semibold text-[#1b1b1b] transition hover:border-[#111111] hover:bg-[#f7f7f7] dark:border-white/12 dark:bg-[#1b1b1b] dark:text-white dark:hover:border-white/28 dark:hover:bg-[#222222]"
        >
            Retour
          </button>
        </div>
      ) : null}

      {!isCreateMode ? (
        <Workspace.Hero eyebrow={eyebrow} title={title} description="">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 flex-1" />

            <div className="flex min-w-0 flex-col gap-2 xl:items-end">
              <div className="flex w-full flex-wrap items-center justify-end gap-2 text-white">
                {activeWorkspaceQuota?.monthlyLimit ? (
                  <div className="rounded-2xl border border-[#1ed760]/30 bg-[#1ed760]/12 px-3 py-2 text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c7ffd9]/70">Quota</p>
                    <p className="mt-0.5 text-sm font-bold text-[#c7ffd9]">
                      {workspaceQuotaUsed}/{activeWorkspaceQuota.monthlyLimit} <span className="font-medium text-xs">ce mois</span>
                    </p>
                    {activeWorkspaceQuota.monthlyRemaining <= 0 ? (
                      <p className="mt-0.5 text-[10px] font-medium text-white/60">Atteint</p>
                    ) : null}
                  </div>
                ) : null}
                  <button
                    type="button"
                    onClick={openCreateForm}
                    disabled={emailVerificationRequired || isJobCreationBlockedForFree || isTenderCreationBlocked}
                    className="inline-flex min-h-[42px] items-center justify-center rounded-2xl bg-[#18A957] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#128347] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {emailVerificationRequired ? "Activer le compte" : "Créer"}
                  </button>
              </div>
            </div>
          </div>
          {shouldPrioritizeClassifiedLayout && pricingInfo && shouldShowInlineWorkspacePricing ?(
            <div className="mt-3 flex flex-wrap justify-end gap-2">
                {pricingInfo.items.map((item) => (
                  <div key={item.code} className="inline-flex items-center gap-2 rounded-xl bg-white/8 px-3 py-2 text-xs text-white backdrop-blur-sm">
                    <p className="font-medium text-white/72">
                      {item.code.includes("1_photo")
                        ? "1 photo"
                        : item.code.includes("4_photo")
                          ? "2-4 photos"
                          : item.code.includes("boost")
                            ? "Boost 7 j"
                            : item.label}
                    </p>
                    <p className="whitespace-nowrap font-semibold">{item.priceLabel}</p>
                  </div>
                ))}
            </div>
          ) : null}
        </Workspace.Hero>
      ) : null}

      <Workspace.Surface>
        {!isCreateMode ? (
          <Workspace.Toolbar>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#27624f]">Gestion</p>
              <h2 className="ui-text-main mt-1.5 text-[1.85rem] font-semibold">{primaryList.title}</h2>
            </div>
            {!shouldPrioritizeClassifiedLayout ? (
              <button
                type="button"
                onClick={openCreateForm}
                disabled={emailVerificationRequired || isJobCreationBlockedForFree || isTenderCreationBlocked}
                className="inline-flex items-center justify-center rounded-2xl bg-[#18A957] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#128347] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {emailVerificationRequired ? "Compte à activer" : primaryButtonLabel}
              </button>
            ) : null}
          </Workspace.Toolbar>
        ) : null}

        {emailVerificationRequired ? (
          <div className="mt-4 rounded-2xl border border-[#fde1b5] bg-[#fff9ed] px-4 py-3 text-sm text-[#8a5a16]">
            Activez votre compte depuis l&apos;email de confirmation avant de créer une annonce, une offre d&apos;emploi ou un appel d&apos;offres.
          </div>
        ) : null}

        {isJobCreationBlockedForFree ? (
          <div className="mt-4 rounded-2xl border border-[#ffd7d9] bg-[#fff5f5] px-4 py-3 text-sm text-[#b91c1c]">
            Votre plan actuel ne permet pas de créer une offre d&apos;emploi.
          </div>
        ) : null}

        {isTenderCreationBlocked ? (
          <div className="mt-4 rounded-2xl border border-[#ffd7d9] bg-[#fff5f5] px-4 py-3 text-sm text-[#b91c1c]">
            Votre plan actuel ne permet pas de créer un appel d&apos;offres.
          </div>
        ) : null}

        {shouldShowClassifiedListTools && !isCreateMode ? (
          <div className="mt-4 ui-border ui-surface-soft rounded-[22px] border p-4">
            <div className="grid gap-3 xl:grid-cols-[minmax(260px,_1.55fr)_minmax(160px,_0.65fr)_minmax(200px,_0.8fr)_minmax(200px,_0.8fr)_auto] xl:items-end">
              <label className="block min-w-0 xl:min-w-0">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a8a8a]">
                  Recherche
                </span>
                <input
                  type="text"
                  value={workspaceSearchQuery}
                  onChange={(event) => setWorkspaceSearchQuery(event.target.value)}
                  placeholder={supportsTypeSelection ? "Titre, lieu, categorie, type..." : "Titre, lieu, categorie..."}
                  className="ui-input w-full placeholder:ui-text-soft"
                />
              </label>

              <label className="hidden xl:block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a8a8a]">
                  Statut
                </span>
                <select
                  value={workspaceStatusFilter}
                  onChange={(event) => setWorkspaceStatusFilter(event.target.value)}
                  className="ui-input w-full"
                >
                  {["Tous", "Brouillon", "En attente", "Publiée", "Programmée", "Expirée"].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="hidden xl:block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a8a8a]">
                  Catégorie
                </span>
                <select
                  value={workspaceCategoryFilter}
                  onChange={(event) => {
                    setWorkspaceCategoryFilter(event.target.value);
                    setWorkspaceTypeFilter("Tous");
                  }}
                  className="ui-input w-full"
                >
                  <option value="Toutes">Toutes</option>
                  {workspaceCategoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              {shouldShowTypeFilter ? (
                <label className="hidden xl:block">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a8a8a]">
                    Type
                  </span>
                  <select
                    value={workspaceTypeFilter}
                    onChange={(event) => setWorkspaceTypeFilter(event.target.value)}
                    disabled={workspaceCategoryFilter === "Toutes" && primaryTab.id === "classifieds"}
                    className="w-full rounded-2xl border border-[#D9D9D9] bg-white px-4 py-3 text-sm text-[#111111] outline-none transition focus:border-[#27624f] disabled:cursor-not-allowed disabled:bg-[#f3f3f3] disabled:text-[#9a9a9a] dark:border-[#444444] dark:bg-[#181818] dark:text-white dark:disabled:bg-[#202020] dark:disabled:text-[#777777]"
                  >
                    <option value="Tous">
                      {workspaceCategoryFilter === "Toutes" && primaryTab.id === "classifieds"
                        ? "Choisir d'abord une catégorie"
                        : "Tous"}
                    </option>
                    {workspaceTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="hidden xl:block" />
              )}

              <div className="flex shrink-0 flex-wrap items-center gap-2 xl:justify-end">
                {hasActiveClassifiedFilters ? (
                  <span className="ui-surface ui-text-muted hidden rounded-full px-3 py-2 text-xs font-semibold shadow-[0_8px_24px_rgba(17,17,17,0.05)] lg:inline-flex">
                    {filteredResultsLabel}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setWorkspaceSearchQuery("");
                    setWorkspaceStatusFilter("Tous");
                    setWorkspaceCategoryFilter("Toutes");
                    setWorkspaceTypeFilter("Tous");
                    setWorkspacePage(1);
                  }}
                  className="ui-text-main ui-surface ui-border inline-flex items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition hover:border-[#27624f] hover:text-[#27624f]"
                >
                  Réinitialiser
                </button>
              </div>
            </div>

            {hasActiveClassifiedFilters ? (
              <div className="mt-3 lg:hidden">
                <span className="ui-surface ui-text-muted inline-flex rounded-full px-3 py-2 text-xs font-semibold shadow-[0_8px_24px_rgba(17,17,17,0.05)]">
                  {filteredResultsLabel}
                </span>
              </div>
            ) : null}

            <div className="mt-4">
              <div className="grid gap-3 md:grid-cols-3 xl:hidden">
                <label className="block">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a8a8a]">
                    Statut
                  </span>
                  <select
                    value={workspaceStatusFilter}
                    onChange={(event) => setWorkspaceStatusFilter(event.target.value)}
                    className="ui-input w-full"
                  >
                    {["Tous", "Brouillon", "En attente", "Publiée", "Programmée", "Expirée"].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a8a8a]">
                    Catégorie
                  </span>
                  <select
                    value={workspaceCategoryFilter}
                    onChange={(event) => {
                      setWorkspaceCategoryFilter(event.target.value);
                      setWorkspaceTypeFilter("Tous");
                    }}
                    className="ui-input w-full"
                  >
                    <option value="Toutes">Toutes</option>
                    {workspaceCategoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                {shouldShowTypeFilter ? (
                  <label className="block">
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a8a8a]">
                      Type
                    </span>
                    <select
                      value={workspaceTypeFilter}
                      onChange={(event) => setWorkspaceTypeFilter(event.target.value)}
                      disabled={workspaceCategoryFilter === "Toutes" && primaryTab.id === "classifieds"}
                      className="w-full rounded-2xl border border-[#D9D9D9] bg-white px-4 py-3 text-sm text-[#111111] outline-none transition focus:border-[#27624f] disabled:cursor-not-allowed disabled:bg-[#f3f3f3] disabled:text-[#9a9a9a] dark:border-[#444444] dark:bg-[#181818] dark:text-white dark:disabled:bg-[#202020] dark:disabled:text-[#777777]"
                    >
                      <option value="Tous">
                        {workspaceCategoryFilter === "Toutes" && primaryTab.id === "classifieds"
                          ? "Choisir d'abord une catégorie"
                          : "Tous"}
                      </option>
                      {workspaceTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {shouldShowWorkspaceSidePanel ? (
          <Workspace.TwoColumn
            className={[
              shouldShowClassifiedListTools ? "mt-4" : "",
              isCreateMode ? "xl:grid-cols-1" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <Workspace.Panel
              muted
              className={[
                shouldPrioritizeClassifiedLayout ? "xl:order-2" : "",
                isCreateMode ? "xl:col-span-2 w-full" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {isCreateMode ?(
                <form ref={createFormRef} onSubmit={handleCreate}>
                  {shouldShowFormPricing && pricingInfo ?(
                    <div className="ui-card-flat mb-5 rounded-[22px] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#27624f]">{pricingInfo.title}</p>
                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {pricingInfo.items.map((item) => (
                          <div key={item.code} className="ui-border ui-surface-soft rounded-[18px] border px-4 py-3">
                            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 text-sm">
                              <p className="ui-text-main min-w-0 font-semibold leading-5">{item.label}</p>
                              <p className="ui-text-main shrink-0 whitespace-nowrap font-semibold">{item.priceLabel}</p>
                              {item.note ?<p className="ui-text-muted shrink-0 whitespace-nowrap text-xs">{item.note}</p> : <span />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="ui-border mb-6 flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#27624f]">
                          {isEditingListingItem ? "Édition" : "Création"}
                        </p>
                        <h2 className="ui-text-main mt-2 text-[1.85rem] font-semibold">{primaryTab.label}</h2>
                      </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {orderedVisibleFormFields.map((field) => {
                      if (field.id === "type" && usesHierarchicalTypes && availableFormTypeOptions.length === 0) {
                        return null;
                      }

                      if (field.type === "textarea") {
                        const isListingDescriptionField = isListingWorkspace && (field.id === "description" || field.id === "content");
                        const rawTextareaValue = form[field.id];
                        const textareaValue = typeof rawTextareaValue === "string" ? rawTextareaValue : "";
                        const textareaPlainTextLength = extractPlainTextFromListingHtml(textareaValue).trim().length;
                        const maxDescriptionLength = listingDescriptionMaxLength;
                        const textareaError =
                          hasAttemptedSubmit && isListingWorkspace && (field.id === "description" || field.id === "content")
                            ? getFieldError(field.id)
                            : "";
                        return (
                          <label key={field.id} className="block md:col-span-2">
                            <span className="ui-text-main mb-2 block text-sm font-medium">{renderFieldLabel(field)}</span>
                            {isListingDescriptionField ? (
                              <div>
                                <RichTextEditor
                                  value={textareaValue}
                                  onChange={(value) => updateField(field.id, value)}
                                  placeholder={field.placeholder}
                                  minHeight={primaryTab.id === "classifieds" ? 320 : 360}
                                  variant="listing"
                                />
                              </div>
                            ) : (
                              <textarea
                                rows={6}
                                value={textareaValue}
                                onChange={(event) => updateField(field.id, event.target.value)}
                                className={`ui-input w-full placeholder:ui-text-soft ${
                                  textareaError ? "border-[#27624f]" : "ui-border-strong"
                                }`}
                                placeholder={field.placeholder}
                              />
                            )}
                            {isListingDescriptionField ? (
                              <p className="ui-text-muted mt-2 text-xs">
                                Description : {textareaPlainTextLength}/{maxDescriptionLength} caractères (minimum {primaryTab.id === "classifieds" ? 30 : 80}).
                              </p>
                            ) : null}
                            {textareaError ? <p className="mt-1 text-xs text-[#27624f]">{textareaError}</p> : null}
                          </label>
                        );
                      }

                      if (field.type === "tag-input") {
                        const selectedTags = Array.isArray(form[field.id])
                          ? (form[field.id] as string[]).map((value: string) => normalizeWorkspaceText(value)).filter(Boolean)
                          : [];
                        const fieldSuggestions = field.id === "skills" ? availableSkillsOptions : field.options || [];
                        const tagSuggestions = fieldSuggestions.filter(
                          (option) => !selectedTags.some((selected: string) => selected.toLowerCase() === option.toLowerCase()),
                        );
                        const tagDraft = typeof tagDrafts[field.id] === "string" ? tagDrafts[field.id] : "";
                        const maxSelections = field.maxSelections ?? 5;
                        const canAddMoreTags = selectedTags.length < maxSelections;
                        const tagError = tagFieldErrors[field.id] || getFieldError(field.id);

                        return (
                          <label key={field.id} className="block md:col-span-2">
                            <span className="ui-text-main mb-2 block text-sm font-medium">{renderFieldLabel(field)}</span>
                            <div className="ui-border-strong ui-surface rounded-[22px] border p-4">
                              <div className="flex flex-wrap gap-2">
                                {selectedTags.map((tag: string) => (
                                  <button
                                    key={`${field.id}-${tag}`}
                                    type="button"
                                    onClick={() => removeTagValue(field.id, tag)}
                                    className="inline-flex items-center gap-2 rounded-full border border-[#d7dbe5] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(221,226,236,0.95))] px-3 py-1.5 text-xs font-semibold text-[#374151] transition-colors hover:border-[#94a3b8] hover:bg-[linear-gradient(135deg,rgba(255,255,255,1),rgba(235,239,245,1))] dark:border-[#3f4654] dark:bg-[#232834] dark:text-[#f3f4f6]"
                                  >
                                    <span>{tag}</span>
                                    <span aria-hidden="true" className="text-sm leading-none">×</span>
                                  </button>
                                ))}
                                {selectedTags.length === 0 ? (
                                  <span className="ui-text-muted text-xs">Aucune compétence sélectionnée pour le moment.</span>
                                ) : null}
                              </div>

                              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                                <input
                                  type="text"
                                  value={tagDraft}
                                  onChange={(event) => {
                                    const nextValue = event.target.value;
                                    setTagDrafts((current) => ({
                                      ...current,
                                      [field.id]: nextValue,
                                    }));
                                    if (field.id === "skills" && nextValue.trim().length <= MAX_JOB_SKILL_LENGTH) {
                                      setTagFieldErrors((current) => {
                                        if (!current[field.id]) return current;
                                        const next = { ...current };
                                        delete next[field.id];
                                        return next;
                                      });
                                    }
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === ",") {
                                      event.preventDefault();
                                      addTagValue(field.id, tagDraft, maxSelections);
                                    }
                                  }}
                                  className="ui-input ui-border-strong w-full"
                                  placeholder={field.placeholder}
                                  disabled={!canAddMoreTags}
                                />
                                <button
                                  type="button"
                                  onClick={() => addTagValue(field.id, tagDraft, maxSelections)}
                                  disabled={!canAddMoreTags || tagDraft.trim().length === 0}
                                  className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-[#111111] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#27624f] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-[#111111] dark:hover:bg-[#FFD7D9]"
                                >
                                  Ajouter
                                </button>
                              </div>

                              <div className="mt-2 flex items-center justify-between gap-3">
                                <p className="ui-text-muted text-xs">
                                  {selectedTags.length}/{maxSelections} compétences
                                </p>
                                <p className="ui-text-muted text-xs">
                                  Appuyez sur Entrée ou sur virgule pour ajouter une compétence (40 caractères maximum).
                                </p>
                              </div>
                              {tagError ? <p className="mt-2 text-xs text-[#27624f]">{tagError}</p> : null}

                              {tagSuggestions.length > 0 ? (
                                <div className="mt-4">
                                  <p className="ui-text-muted mb-2 text-xs font-medium uppercase tracking-[0.14em]">
                                    Suggestions
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {tagSuggestions.slice(0, 12).map((option) => (
                                      <button
                                        key={`${field.id}-option-${option}`}
                                        type="button"
                                        onClick={() => addTagValue(field.id, option, maxSelections)}
                                        disabled={!canAddMoreTags}
                                        className="ui-border ui-surface ui-text-main rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:border-[#27624f] hover:text-[#27624f] disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        {option}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </label>
                        );
                      }

                      if (field.type === "image") {
                        const fieldValue = form[field.id];
                        const imageValue = typeof fieldValue === "string" ?fieldValue : "";
                        const previewImage = imageValue || imageFallbackSrc || "";

                        return (
                          <label key={field.id} className="block md:col-span-2">
                            <span className="ui-text-main mb-2 block text-sm font-medium">{renderFieldLabel(field)}</span>
                            <input
                              ref={(node) => {
                                imageInputRefs.current[field.id] = node;
                              }}
                              type="file"
                              accept="image/*"
                              onChange={(event) => handleImageChange(field.id, event)}
                              className="hidden"
                            />
                            <div className="ui-border-strong ui-surface rounded-[22px] border border-dashed p-4">
                              {isUploadingImages ? (
                                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[22px] bg-white/78 backdrop-blur-[1px] dark:bg-black/50">
                                  <div className="ui-card-flat ui-text-main rounded-2xl px-4 py-3 text-sm font-semibold shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                                    <UploadSpinner label="Import en cours..." />
                                  </div>
                                </div>
                              ) : null}
                              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-[#f4f4f4] dark:bg-[#2a2a2a]">
                                    {previewImage ?(
                                      <AppImage alt="" src={previewImage} className="h-full w-full object-cover" />
                                    ) : (
                                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a8a8a]">Photo</span>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="ui-text-main text-sm font-medium">{field.placeholder}</p>
                                    <p className="ui-text-muted mt-1 text-xs leading-5">
                                      JPG, PNG ou WEBP pour illustrer votre contenu.
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    disabled={isUploadingImages}
                                    onClick={() => imageInputRefs.current[field.id]?.click()}
                                    className="ui-surface ui-text-main ui-border rounded-2xl border px-4 py-2 text-sm font-semibold transition hover:border-[#27624f] hover:text-[#27624f]"
                                  >
                                    {isUploadingImages ? <UploadSpinner label="Import..." /> : imageValue ? "Changer la photo" : "Ajouter une photo"}
                                  </button>
                                  {imageValue ?(
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (pendingFeaturedImage?.previewUrl) {
                                          URL.revokeObjectURL(pendingFeaturedImage.previewUrl);
                                        }
                                        setPendingFeaturedImage(null);
                                        updateField(field.id, "");
                                        const input = imageInputRefs.current[field.id];
                                        if (input) {
                                          input.value = "";
                                        }
                                      }}
                                      className="ui-border ui-text-muted rounded-2xl border px-4 py-2 text-sm font-semibold transition hover:border-[#27624f] hover:text-[#27624f]"
                                    >
                                      Supprimer
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </label>
                        );
                      }

                      if (field.type === "image-gallery") {
                        const fieldValue = form[field.id];
                        const images: string[] = Array.isArray(fieldValue) ?fieldValue : [];

                        return (
                          <label key={field.id} className="block md:col-span-2">
                            <span className="ui-text-main mb-2 block text-sm font-medium">{renderFieldLabel(field)}</span>
                            <input
                              ref={(node) => {
                                imageInputRefs.current[field.id] = node;
                              }}
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(event) => void handleImageGalleryChange(field.id, event)}
                              className="hidden"
                            />
                            <div className="ui-border-strong ui-surface rounded-[22px] border border-dashed p-4">
                              {isUploadingImages ? (
                                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[22px] bg-white/78 backdrop-blur-[1px] dark:bg-black/50">
                                  <div className="ui-card-flat ui-text-main rounded-2xl px-4 py-3 text-sm font-semibold shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                                    <UploadSpinner label="Import des photos..." />
                                  </div>
                                </div>
                              ) : null}
                              <div className="flex flex-col gap-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <p className="ui-text-main text-sm font-medium">{field.placeholder}</p>
                                    <p className="ui-text-muted mt-1 text-xs leading-5">
                                      JPG, PNG ou WEBP. {classifiedMaxPhotos} photos maximum.
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    disabled={isUploadingImages}
                                    onClick={() => imageInputRefs.current[field.id]?.click()}
                                    className="ui-surface ui-text-main ui-border rounded-2xl border px-4 py-2 text-sm font-semibold transition hover:border-[#27624f] hover:text-[#27624f]"
                                  >
                                    {isUploadingImages ? <UploadSpinner label="Import..." /> : "Ajouter des photos"}
                                  </button>
                                </div>

                                {photoUploaderError ? (
                                  <div role="alert" className="rounded-xl border border-[#ffd7d9] bg-[#fff5f5] px-3 py-2 text-xs text-[#b91c1c]">
                                    {photoUploaderError}
                                  </div>
                                ) : null}
                                {images.length > 0 ?(
                                  <>
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                                      {images.map((image, index) => (
                                        <div key={`${field.id}-${index}`} className="ui-border relative overflow-hidden rounded-[14px] border">
                                          <AppImage alt="" src={image} className="h-24 w-full object-cover" />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              removeImageFromGallery(field.id, index);
                                            }}
                                            title="Supprimer cette photo"
                                            aria-label="Supprimer cette photo"
                                            className="absolute right-2 top-2 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-black/60 px-2 text-[11px] font-semibold text-white transition hover:bg-black/75 disabled:cursor-not-allowed disabled:opacity-45"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <p className="ui-text-muted text-xs">{images.length}/{classifiedMaxPhotos} photos</p>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          updateField(field.id, []);
                                        }}
                                        title="Supprimer toutes les photos"
                                        className="text-xs font-semibold text-[#27624f]"
                                      >
                                        Tout supprimer
                                      </button>
                                    </div>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </label>
                        );
                      }

                      if (field.type === "pdf") {
                        const fieldValue = form[field.id];
                        const pdfUrl = typeof fieldValue === "string" ? fieldValue : "";
                        const pdfNameValue = form.detailsPdfName;
                        const pdfName = typeof pdfNameValue === "string" && pdfNameValue.trim().length > 0
                          ? pdfNameValue
                          : pdfUrl
                            ? "Document TDR"
                            : "";

                        return (
                          <label key={field.id} className="block md:col-span-2">
                            <span className="ui-text-main mb-2 block text-sm font-medium">{renderFieldLabel(field)}</span>
                            <input
                              ref={(node) => {
                                imageInputRefs.current[field.id] = node;
                              }}
                              type="file"
                              accept=".pdf,.zip,application/pdf,application/zip,application/x-zip-compressed"
                              onChange={(event) => void handlePdfChange(field.id, event)}
                              className="hidden"
                            />
                            <div className="ui-border-strong ui-surface rounded-[22px] border border-dashed p-4">
                              {isUploadingImages ? (
                                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[22px] bg-white/78 backdrop-blur-[1px] dark:bg-black/50">
                                  <div className="ui-card-flat ui-text-main rounded-2xl px-4 py-3 text-sm font-semibold shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                                    <UploadSpinner label="Import du TDR..." />
                                  </div>
                                </div>
                              ) : null}
                              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="min-w-0">
                                  <p className="ui-text-main text-sm font-medium">{pdfName || field.placeholder}</p>
                                  <p className="ui-text-muted mt-1 text-xs leading-5">
                                    PDF ou ZIP, jusqu'à 50 Mo. Il sera affiché sur la page détail de l'appel d'offres.
                                  </p>
                                  {pdfUrl ? (
                                    <a
                                      href={pdfUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mt-2 inline-flex text-xs font-semibold text-[#27624f] hover:underline"
                                    >
                                      Ouvrir le TDR actuel
                                    </a>
                                  ) : null}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    disabled={isUploadingImages}
                                    onClick={() => imageInputRefs.current[field.id]?.click()}
                                    className="ui-surface ui-text-main ui-border rounded-2xl border px-4 py-2 text-sm font-semibold transition hover:border-[#27624f] hover:text-[#27624f]"
                                  >
                                    {isUploadingImages ? <UploadSpinner label="Import..." /> : pdfUrl ? "Remplacer le TDR" : "Ajouter un TDR"}
                                  </button>
                                  {pdfUrl ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        updateField(field.id, "");
                                        updateField("detailsPdfName", "");
                                        const input = imageInputRefs.current[field.id];
                                        if (input) {
                                          input.value = "";
                                        }
                                      }}
                                      className="ui-border ui-text-muted rounded-2xl border px-4 py-2 text-sm font-semibold transition hover:border-[#27624f] hover:text-[#27624f]"
                                    >
                                      Supprimer
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </label>
                        );
                      }

                      if (field.type === "select") {
                        const selectError =
                          getFieldError(field.id);
                        const selectOptions =
                          field.id === "category"
                            ? topLevelTaxonomyTerms.map((term) => term.name)
                            : field.id === "productTag"
                              ? availableProductTagOptions
                            : field.id === "city" || field.id === "location"
                              ? locationParentTerms.map((term) => term.name)
                            : field.id === "area"
                              ? availableFormAreaOptions
                            : field.id === "type" && usesHierarchicalTypes
                              ? availableFormTypeOptions
                              : field.options || [];
                        const boundedSelectOptions = selectOptions.slice(0, 100);
                        if (field.id === "productTag" && selectOptions.length === 0) {
                          return null;
                        }
                        return (
                          <label key={field.id} className={getListingFieldClassName(field.id)}>
                            <span className="ui-text-main mb-2 block text-sm font-medium">{renderFieldLabel(field)}</span>
                            <select
                              value={typeof form[field.id] === "string" ?form[field.id] : ""}
                              onChange={(event) => {
                                const value = event.target.value;
                                const selectedTerm = field.id === "category"
                                  ? topLevelTaxonomyTerms.find((term) => term.name === value)
                                  : field.id === "city" || field.id === "location"
                                    ? locationParentTerms.find((term) => term.name === value)
                                    : undefined;
                                updateField(field.id, value, selectedTerm?.id);
                              }}
                              disabled={field.id === "area" && !selectedFormCity}
                              className={`ui-input w-full ${
                                selectError ?"border-[#27624f]" : "ui-border-strong"
                              } ${field.id === "area" && !selectedFormCity ? "cursor-not-allowed opacity-70" : ""}`}
                            >
                              <option value="">{field.placeholder}</option>
                              {boundedSelectOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                              ))}
                            </select>
                            {field.id === "area" && !selectedFormCity ? (
                              <p className="ui-text-muted mt-2 text-xs">Choisissez d&apos;abord une ville.</p>
                            ) : null}
                            {field.id === "area" && selectedFormCity && availableFormAreaOptions.length === 0 ? (
                              <p className="ui-text-muted mt-2 text-xs">Aucune zone n&apos;est encore renseignée pour cette ville. Ce champ est facultatif.</p>
                            ) : null}
                            {field.id === "location" && selectOptions.length === 0 ? (
                              <p className="ui-text-muted mt-2 text-xs">Aucun lieu n&apos;est encore configuré. Réessayez dans un instant ou contactez l&apos;administrateur.</p>
                            ) : null}
                            {selectError ?<p className="mt-1 text-xs text-[#27624f]">{selectError}</p> : null}
                          </label>
                        );
                      }

                      if (field.type === "tel" || field.id === "phone" || field.id === "contactPhone") {
                        const rawPhoneValue = form[field.id];
                        const phoneValue = typeof rawPhoneValue === "string" ?rawPhoneValue : "+261";
                        const shouldShowProfilePhoneChoice = isListingWorkspace && profilePhone.trim().length > 0;
                        return (
                          <label key={field.id} className={getListingFieldClassName(field.id)}>
                            <span className="ui-text-main mb-2 block text-sm font-medium">{renderFieldLabel(field)}</span>
                            {shouldShowProfilePhoneChoice ?(
                              <div className="mb-2 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPhonePreference("profile");
                                    updateField(field.id, profilePhone);
                                  }}
                                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                    phonePreference === "profile"
                                      ?"border-[#111111] bg-[#F5F5F5] text-[#111111] dark:border-[#666666] dark:bg-[#303030] dark:text-white"
                                      : "ui-border-strong ui-surface ui-text-main"
                                  }`}
                                >
                                  Utiliser mon numéro ({profilePhone})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPhonePreference("custom");
                                    updateField(field.id, "");
                                  }}
                                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                    phonePreference === "custom"
                                      ?"border-[#111111] bg-[#F5F5F5] text-[#111111] dark:border-[#666666] dark:bg-[#303030] dark:text-white"
                                      : "ui-border-strong ui-surface ui-text-main"
                                  }`}
                                >
                                  Utiliser un autre numéro
                                </button>
                              </div>
                            ) : null}
                            <div
                              className={`phone-picker-shell ui-border-strong ui-surface rounded-2xl border px-2 py-1 focus-within:border-[#27624f] ${
                                getFieldError(field.id)
                                  ?"border-[#27624f]"
                                  : "border-[#DADADA] dark:border-[#444444]"
                              }`}
                            >
                              <PhoneInput
                                defaultCountry="mg"
                                value={phoneValue}
                                onChange={(value, country) => {
                                  updateField(field.id, value);
                                  const countryCode =
                                    typeof country?.country?.iso2 === "string" ?country.country.iso2.toUpperCase() : "MG";
                                  updateField(`${field.id}Country`, countryCode);
                                }}
                                inputClassName="!w-full !border-0 !bg-transparent !px-3 !py-2 !text-sm !text-[#111111] dark:!text-white focus:!ring-0"
                                countrySelectorStyleProps={{
                                  buttonClassName: "!border-0 !bg-transparent hover:!bg-transparent dark:!text-white",
                                  dropdownStyleProps: { className: "!z-[120] dark:!bg-[#1f1f1f] dark:!text-white" },
                                }}
                              />
                            </div>
                            {isListingWorkspace ?(
                              <p className="ui-text-muted mt-2 text-xs">
                                Format attendu: +XXXXXXXX (8 a 15 chiffres).
                              </p>
                            ) : null}
                            {getFieldError(field.id) ?(
                              <p className="mt-1 text-xs text-[#27624f]">{getFieldError(field.id)}</p>
                            ) : null}
                          </label>
                        );
                      }

                      const fieldError = getFieldError(field.id);
                      return (
                        <label key={field.id} className={getListingFieldClassName(field.id)}>
                          <span className="ui-text-main mb-2 block text-sm font-medium">{renderFieldLabel(field)}</span>
                          {(() => {
                            const isNumericField = field.type === "number" || field.id === "price" || field.id === "budget";
                            const isDateField = field.type === "date";
                            const rawFieldValue = form[field.id];
                            const fieldValue: string = typeof rawFieldValue === "string" ?rawFieldValue : "";
                            const isLockedPublishedTitle = field.id === "title" && isEditingPublishedListingItem;
                            return (
                              <>
                                <input
                                  type={isNumericField ?"text" : field.type || "text"}
                                  value={isNumericField ?formatAmountInputValue(fieldValue) : fieldValue}
                                  onChange={(event) =>
                                    updateField(
                                      field.id,
                                      isNumericField ?normalizeAmountValue(event.target.value) : event.target.value,
                                    )
                                  }
                                  disabled={isLockedPublishedTitle}
                                  readOnly={isLockedPublishedTitle}
                                  inputMode={isNumericField ?"numeric" : undefined}
                                  min={isNumericField ? 0 : isDateField && !isEditingListingItem ? getTodayDateInputMin() : undefined}
                                  step={isNumericField ?1 : undefined}
                                  maxLength={primaryTab.id === "classifieds" && field.id === "title" ? 40 : undefined}
                                  className={`ui-input w-full placeholder:ui-text-soft ${
                                    fieldError ?"border-[#27624f]" : "ui-border-strong"
                                  } ${isLockedPublishedTitle ? "cursor-not-allowed opacity-70" : ""}`}
                                  placeholder={field.placeholder}
                                />
                                {primaryTab.id === "classifieds" && field.id === "title" ? (
                                  <p className="ui-text-muted mt-2 text-xs">
                                    40 caractères maximum.
                                  </p>
                                ) : null}
                                {isLockedPublishedTitle ?(
                                  <p className="ui-text-muted mt-2 text-xs">
                                    Le titre d&apos;un contenu déjà publié est verrouillé pour préserver son URL et son référencement.
                                  </p>
                                ) : null}
                              </>
                            );
                          })()}
                          {fieldError ?<p className="mt-1 text-xs text-[#27624f]">{fieldError}</p> : null}
                        </label>
                      );
                    })}
                  </div>

                  {formError && !photoUploaderError ?(
                    <div
                      className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                        formMessageTone === "notice"
                          ? "border-[#d9cdfd] bg-[#f7f4ff] text-[#55428f]"
                          : "border-[#ffd7d9] bg-[#fff5f5] text-[#b91c1c]"
                      }`}
                    >
                      {formError}
                    </div>
                  ) : null}

                  {isCreating ? (
                    <p className="ui-text-muted mt-4 text-sm" role="status">
                      {formPhase === "uploading" ? "Envoi des photos en cours..." : "Finalisation de l'annonce en cours..."}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isCreating || isUploadingImages || isCurrentFormCreationBlocked}
                    className="mt-5 w-full rounded-2xl bg-[#2F57D9] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2447ba] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCreating
                      ?formPhase === "uploading"
                        ? "Envoi des photos..."
                        : "Finalisation de l'annonce..."
                      : isUploadingImages
                        ?"Upload des images..."
                        : editingItemId
                            ? "Mettre à jour cet élément"
                          : isCurrentFormCreationBlocked
                            ? "Création indisponible"
                            : primaryTab.id === "classifieds"
                              ? "Créer l'annonce"
                              : primaryTab.id === "jobs"
                                ? "Créer l'offre d'emploi"
                                : primaryTab.id === "tenders"
                                  ? "Créer l'appel d'offres"
                                  : "Enregistrer cet élément"}
                  </button>
                </form>
              ) : selectedItem ?(
                <div className="min-w-0 space-y-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#27624f]">Élément sélectionné</p>
                        <h2 className="ui-text-main mt-3 text-2xl font-semibold [overflow-wrap:anywhere]">{selectedItem.title}</h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedItemId("")}
                        className="ui-border ui-text-main inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition hover:border-[#27624f] hover:text-[#27624f]"
                        aria-label="Fermer l'aperçu"
                        title="Fermer l'aperçu"
                      >
                        <span aria-hidden="true" className="text-xl leading-none">×</span>
                      </button>
                    </div>
                    {selectedItem.price ?(
                      <p className="ui-text-main mt-3 text-sm font-semibold [overflow-wrap:anywhere]">
                        {formatListingMoney(selectedItem.price, selectedItem.currency)}
                      </p>
                    ) : null}
                    {selectedItemDescriptionPreviewHtml ? (
                      <div
                        className="prose prose-p:my-2 prose-ul:my-2 prose-li:my-1 mt-3 max-w-none text-sm leading-6 text-[color:var(--text-muted)] [overflow-wrap:anywhere] dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: selectedItemDescriptionPreviewHtml }}
                      />
                    ) : (
                      <p className="ui-text-muted mt-3 text-sm leading-6 [overflow-wrap:anywhere]">
                        Aucune description.
                      </p>
                    )}
                    {shouldShowWorkspacePublicationMeta(selectedItem) ? (
                      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[#8a8a8a] [overflow-wrap:anywhere]">{selectedItem.meta}</p>
                    ) : null}
                    {shouldShowWorkspaceExpiration(selectedItem) ?(
                      <p className="ui-text-muted mt-2 text-xs">
                        Expiration: {new Date(selectedItem.expiresAt).toLocaleDateString("fr-FR")}
                      </p>
                    ) : null}
                    {isScheduledWorkspaceItem(selectedItem) ?(
                      <div className="mt-3 rounded-xl border border-[#D7E4FF] bg-[#F5F8FF] px-3 py-2 text-xs text-[#2447BA] dark:border-[#3151a6] dark:bg-[#1b2340] dark:text-[#dbe6ff]">
                        Diffusion programmée à partir du {formatScheduledPublishDateLabel(selectedItem.scheduledPublishAt)}.
                      </div>
                    ) : null}
                    {selectedItem.moderationStatus === "flagged" && selectedItem.moderationMessage ? (
                      <div className="mt-3 rounded-xl border border-[#F3D5B2] bg-[#FFF7ED] px-3 py-2 text-xs leading-5 text-[#9A3412]">
                        <p className="font-semibold">Action requise par la modération</p>
                        <p className="mt-1 whitespace-pre-wrap">{selectedItem.moderationMessage}</p>
                      </div>
                    ) : null}
                    {primaryTab.id === "classifieds" && isExpiringWithinDays(selectedItem.expiresAt) && !selectedItem.isExpired ?(
                      <div className="mt-3 rounded-xl border border-[#F3D5B2] bg-[#FFF7ED] px-3 py-2 text-xs text-[#9A3412]">
                        Cette annonce expire bientôt. Vous pourrez la republier via le paiement habituel pour garder sa visibilité.
                      </div>
                    ) : null}
                    {isPendingItem(selectedItem) ? renderPublishActions(selectedItem, false, "selected") : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {canBoostItem(selectedItem) ?(
                        <button
                          type="button"
                          onClick={() => handleBoost(selectedItem)}
                          disabled={isPayingItemId === selectedItem.id}
                          className="inline-flex items-center justify-center rounded-2xl bg-[#22c55e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#16a34a] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isPayingItemId === selectedItem.id ?"Redirection..." : selectedItem.featured ?"Prolonger le boost" : "Booster 7 jours"}
                        </button>
                      ) : null}
                      {canMoveItemToDraft(selectedItem) ?(
                        <button
                          type="button"
                          onClick={() => void handleMoveToDraft(selectedItem)}
                          disabled={isUpdatingStatusItemId === selectedItem.id}
                          className="inline-flex items-center justify-center ui-surface ui-text-main ui-border inline-flex rounded-2xl border px-4 py-2 text-sm font-semibold transition hover:border-[#27624f] hover:text-[#27624f] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isUpdatingStatusItemId === selectedItem.id ? "Mise à jour..." : "Mettre en brouillon"}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {(selectedItem.images?.[0] || selectedItem.image || imageFallbackSrc) ?(
                    <div className="ui-card-flat overflow-hidden rounded-[22px]">
                      <AppImage alt="" src={selectedItem.images?.[0] || selectedItem.image || imageFallbackSrc} className="h-52 w-full object-cover" />
                    </div>
                  ) : null}

                  {activeDetailTab && activeDetailList ?(
                    primaryTab.id === "classifieds" && activeDetailTab.id === "contacts" && detailBasePath && selectedItem ? (
                      <div className="ui-card-flat space-y-4 rounded-[22px] p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#27624f]">Messagerie</p>
                            <h3 className="ui-text-main mt-3 text-xl font-semibold">
                              Messages pour {selectedItem.title}
                            </h3>
                          </div>
                          <span className="ui-surface-soft ui-text-muted rounded-full px-3 py-1 text-xs font-semibold">
                            {selectedItem.messageCount || 0} message{(selectedItem.messageCount || 0) > 1 ? "s" : ""}
                          </span>
                        </div>

                        <p className="ui-text-muted text-sm leading-6">
                          Ouvrez directement la messagerie de cette annonce pour consulter les echanges et repondre a un contact precis.
                        </p>

                        <Link
                          href={`/profil/messages?listingId=${encodeURIComponent(String(selectedItem.id || ""))}`}
                          className="inline-flex items-center justify-center rounded-2xl bg-[#111] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#27624f] dark:bg-white dark:text-[#111] dark:hover:bg-[var(--surface-3)]"
                        >
                          Ouvrir la messagerie
                        </Link>
                      </div>
                    ) : (
                      <div className="ui-card-flat space-y-4 rounded-[22px] p-5">
                        <div className="flex flex-wrap gap-2">
                          {detailTabs.map((tab) => {
                            const isActive = tab.id === activeDetailTab.id;
                            return (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveDetailTabId(tab.id)}
                                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                                  isActive
                                    ?"bg-[#111] text-white dark:bg-white dark:text-[#111]"
                                    : "ui-surface-soft ui-text-muted hover:bg-[var(--surface-4)] hover:text-[var(--text-main)]"
                                }`}
                              >
                                {tab.label}
                              </button>
                            );
                          })}
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#27624f]">Suivi</p>
                          <h3 className="ui-text-main mt-3 text-xl font-semibold">
                            {activeDetailList.title} pour {selectedItem.title}
                          </h3>
                        </div>

                        <div className="space-y-3">
                          {previewDetailItems.length === 0 ?(
                            <Workspace.EmptyState label={activeDetailList.title} />
                          ) : (
                            previewDetailItems.map((item) => (
                              <article key={item.id} className="ui-border ui-surface-soft rounded-[18px] border p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <h4 className="ui-text-main text-sm font-semibold">{item.title}</h4>
                                    {item.participantEmail ? (
                                      <p className="ui-text-soft mt-1 text-xs">{item.participantEmail}</p>
                                    ) : null}
                                  </div>
                                  {typeof item.messageCount === "number" ? (
                                    <span className="ui-surface ui-text-muted rounded-full px-3 py-1 text-[11px] font-semibold">
                                      {item.messageCount} message{item.messageCount > 1 ? "s" : ""}
                                    </span>
                                  ) : null}
                                </div>
                                <p className="mt-2 ui-text-muted text-sm leading-6">{item.description}</p>
                                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[#8a8a8a]">{item.meta}</p>
                                {item.conversationHref || item.listingHref ? (
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    {item.conversationHref ? (
                                      <Link
                                        href={item.conversationHref}
                                        className="inline-flex items-center justify-center rounded-2xl bg-[#111] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#27624f] dark:bg-white dark:text-[#111] dark:hover:bg-[var(--surface-3)]"
                                      >
                                        Ouvrir la conversation
                                      </Link>
                                    ) : null}
                                    {item.listingHref ? (
                                      <Link
                                        href={item.listingHref}
                                        className="ui-text-main ui-surface ui-border inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-xs font-semibold transition hover:border-[#27624f] hover:text-[#27624f]"
                                      >
                                        Voir la publication
                                      </Link>
                                    ) : null}
                                  </div>
                                ) : null}
                              </article>
                            ))
                          )}
                        </div>

                        {detailBasePath && selectedItem ?(
                          <Link
                            href={`${detailBasePath}/${selectedItem.id}`}
                            className="ui-text-main ui-surface ui-border inline-flex items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition hover:border-[#27624f] hover:text-[#27624f]"
                          >
                            Voir toute la liste
                          </Link>
                        ) : null}
                      </div>
                    )
                  ) : null}
                </div>
              ) : null}
            </Workspace.Panel>

            {!isCreateMode ? (
            <Workspace.Panel className={`${shouldPrioritizeClassifiedLayout ? "xl:order-1 " : ""}!border-0 bg-transparent p-0 shadow-none`}>
              <Workspace.PanelHeader
                eyebrow={shouldPrioritizeClassifiedLayout ?"Liste des annonces" : "Liste"}
                title={primaryList.title}
                aside={
                  <span className="ui-surface-soft ui-text-muted rounded-full px-3 py-1 text-xs font-semibold">
                    {hasActiveClassifiedFilters ? filteredResultsLabel : `${primaryList.items.length} element${primaryList.items.length > 1 ? "s" : ""}`}
                  </span>
                }
              />

              <div className="space-y-4">
                {paymentError ?(
                  <div className="rounded-2xl border border-[#ffd7d9] bg-[#fff5f5] px-4 py-3 text-sm text-[#b91c1c]">
                    {paymentError}
                  </div>
                ) : null}
                {shouldShowWorkspaceSkeleton ?(
                  Array.from({ length: 3 }).map((_, index) => (
                    <article key={index} className="ui-border ui-surface-soft animate-pulse rounded-[22px] border p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 gap-4">
                          <div className="ui-surface h-16 w-16 shrink-0 rounded-[14px] sm:h-20 sm:w-20 sm:rounded-[18px]" />
                          <div className="min-w-0 space-y-3">
                            <div className="h-5 w-40 rounded bg-[#ededed]" />
                            <div className="h-4 w-full rounded bg-[#ededed]" />
                            <div className="h-4 w-3/4 rounded bg-[#ededed]" />
                            <div className="h-3 w-28 rounded bg-[#ededed]" />
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col gap-2">
                          <div className="ui-card-flat h-9 w-9 rounded-xl" />
                          <div className="ui-card-flat h-9 w-9 rounded-xl" />
                        </div>
                      </div>
                    </article>
                  ))
                ) : null}
                {filteredPrimaryItems.length === 0 ?(
                  shouldShowWorkspaceSkeleton ? null : hasActiveClassifiedFilters ? (
                    <div className="ui-border-strong ui-surface-soft ui-text-muted rounded-[22px] border border-dashed px-5 py-8 text-sm leading-6">
                      Aucune annonce ne correspond a vos filtres pour le moment.
                    </div>
                  ) : (
                    <Workspace.EmptyState label={primaryList.title} />
                  )
                ) : (
                  paginatedPrimaryItems.map((item) => {
                    const editLockReason = getWorkspaceItemEditLockReason(item);
                    const effectiveEditLockReason = emailVerificationRequired
                      ? "Activez votre compte depuis l'email de confirmation avant de modifier un contenu."
                      : editLockReason;
                    const isEditLocked = effectiveEditLockReason.length > 0;
                    return (
                    <article
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        if (isWorkspaceCardControl(event.target)) {
                          return;
                        }
                        handleWorkspaceItemPrimaryAction(item);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleWorkspaceItemPrimaryAction(item);
                        }
                      }}
                      className={`rounded-[22px] border p-5 transition-all duration-200 delay-75 ease-out ${
                        item.id === editingItemId
                          ?"ui-surface border-2 border-[#27624f] shadow-[0_12px_32px_rgba(17,17,17,0.08)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.35)]"
                          : "ui-border ui-surface-soft border hover:border-2 hover:border-[#27624f] hover:bg-[var(--surface-1)]"
                      } cursor-pointer focus:outline-none focus-visible:border-2 focus-visible:border-[#27624f] focus-visible:bg-[var(--surface-1)]`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 gap-4">
                          {(item.images?.[0] || item.image || imageFallbackSrc) ?(
                          <div className="ui-surface h-16 w-16 shrink-0 overflow-hidden rounded-[14px] sm:h-20 sm:w-20 sm:rounded-[18px]">
                            <AppImage alt="" src={item.images?.[0] || item.image || imageFallbackSrc} className="h-full w-full object-cover" />
                          </div>
                          ) : null}
                          <div className="min-w-0">
                            <h3 className="ui-text-main text-base font-semibold [overflow-wrap:anywhere]">{item.title}</h3>
                            {item.price ?(
                              <p className="mt-2 ui-text-main text-sm font-semibold">
                                {formatListingMoney(item.price, item.currency)}
                              </p>
                            ) : null}
                            <p className="mt-2 line-clamp-2 ui-text-muted text-sm leading-6">
                              {getListingDisplayText(String(item.content || item.description || ""), String(item.price || ""))}
                            </p>
                            {shouldShowWorkspacePublicationMeta(item) ? (
                              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[#8a8a8a] [overflow-wrap:anywhere]">{item.meta}</p>
                            ) : null}
                            {shouldShowWorkspaceExpiration(item) ?(
                              <p className="ui-text-muted mt-2 text-xs">
                                Expiration: {new Date(item.expiresAt).toLocaleDateString("fr-FR")}
                              </p>
                            ) : null}
                            {primaryTab.id === "classifieds" && isExpiringWithinDays(item.expiresAt) && !item.isExpired ?(
                              <div className="mt-2 rounded-xl border border-[#F3D5B2] bg-[#FFF7ED] px-3 py-2 text-xs text-[#9A3412]">
                                Expire bientôt : vous pourrez renouveler sa visibilité via le paiement habituel.
                              </div>
                            ) : null}
                            {isScheduledWorkspaceItem(item) ?(
                              <div className="mt-2 rounded-xl border border-[#D7E4FF] bg-[#F5F8FF] px-3 py-2 text-xs text-[#2447BA] dark:border-[#3151a6] dark:bg-[#1b2340] dark:text-[#dbe6ff]">
                                Visible a partir du {formatScheduledPublishDateLabel(item.scheduledPublishAt)}.
                              </div>
                            ) : null}
                            {item.moderationStatus === "flagged" && item.moderationMessage ? (
                              <div className="mt-2 rounded-xl border border-[#F3D5B2] bg-[#FFF7ED] px-3 py-2 text-xs leading-5 text-[#9A3412]">
                                <span className="font-semibold">Action requise: </span>{item.moderationMessage}
                              </div>
                            ) : null}
                            {isPendingItem(item) ? renderPublishActions(item, true, "list") : null}
                            <div className="mt-3 flex flex-wrap gap-2">
                              {canBoostItem(item) ?(
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleBoost(item);
                                  }}
                                  disabled={isPayingItemId === item.id}
                                  className="inline-flex items-center justify-center rounded-xl bg-[#22c55e] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#16a34a] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {isPayingItemId === item.id ?"Redirection..." : item.featured ?"Prolonger le boost" : "Booster 7 jours"}
                                </button>
                              ) : null}
                              {canMoveItemToDraft(item) ?(
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void handleMoveToDraft(item);
                                  }}
                                  disabled={isUpdatingStatusItemId === item.id}
                                  className="ui-surface ui-text-main ui-border inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition hover:border-[#27624f] hover:text-[#27624f] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                              {isUpdatingStatusItemId === item.id ? "Mise à jour..." : "Mettre en brouillon"}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col gap-2">
                          <button
                            type="button"
                            aria-label="Ouvrir"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleWorkspaceItemPrimaryAction(item);
                            }}
                          >
                            <Workspace.ActionIcon>
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14" />
                                <path d="m12 5 7 7-7 7" />
                              </svg>
                            </Workspace.ActionIcon>
                          </button>
                          <button
                            type="button"
                            aria-label="Supprimer"
                            onClick={(event) => {
                              event.stopPropagation();
                              setPendingDeleteItem(item);
                            }}
                            disabled={isDeletingItemId === item.id}
                          >
                            <Workspace.ActionIcon>
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18" />
                                <path d="M8 6V4h8v2" />
                                <path d="M19 6l-1 14H6L5 6" />
                              </svg>
                            </Workspace.ActionIcon>
                          </button>
                          <span title={isEditLocked ? effectiveEditLockReason : undefined}>
                            <button
                              type="button"
                              aria-label="Modifier"
                              onClick={(event) => {
                                event.stopPropagation();
                                router.push(`${detailBasePath}/${item.id}/modifier`);
                              }}
                              disabled={isEditLocked}
                            >
                              <Workspace.ActionIcon disabled={isEditLocked}>
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 20h9" />
                                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                </svg>
                              </Workspace.ActionIcon>
                            </button>
                          </span>
                        </div>
                      </div>
                    </article>
                    );
                  })
                )}
                {shouldShowClassifiedListTools && totalWorkspacePages > 1 ?(
                  <div className="ui-card-flat flex flex-wrap items-center justify-between gap-3 rounded-[18px] px-4 py-3">
                    <p className="ui-text-muted text-xs font-medium">
                      Page {safeWorkspacePage} sur {totalWorkspacePages}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setWorkspacePage((current) => Math.max(1, current - 1))}
                        disabled={safeWorkspacePage === 1}
                        className="ui-surface ui-text-main ui-border inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition hover:border-[#27624f] hover:text-[#27624f] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Precedent
                      </button>
                      {Array.from({ length: totalWorkspacePages }).map((_, index) => {
                        const page = index + 1;
                        const isActive = page === safeWorkspacePage;
                        return (
                          <button
                            key={page}
                            type="button"
                            onClick={() => setWorkspacePage(page)}
                            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-3 text-xs font-semibold transition ${
                              isActive
                                ? "bg-[#111] text-white dark:bg-white dark:text-[#111]"
                                : "ui-border ui-text-main border hover:border-[#27624f] hover:text-[#27624f]"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setWorkspacePage((current) => Math.min(totalWorkspacePages, current + 1))}
                        disabled={safeWorkspacePage === totalWorkspacePages}
                        className="ui-surface ui-text-main ui-border inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition hover:border-[#27624f] hover:text-[#27624f] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </Workspace.Panel>
            ) : null}
          </Workspace.TwoColumn>
        ) : (
          <div className={shouldShowClassifiedListTools ? "mt-4" : ""}>
            <Workspace.Panel className="!border-0 bg-transparent p-0 shadow-none">
              <Workspace.PanelHeader
                eyebrow={shouldPrioritizeClassifiedLayout ?"Liste des annonces" : "Liste"}
                title={primaryList.title}
                aside={
                  <span className="ui-surface-soft ui-text-muted rounded-full px-3 py-1 text-xs font-semibold">
                    {hasActiveClassifiedFilters ? filteredResultsLabel : `${primaryList.items.length} element${primaryList.items.length > 1 ? "s" : ""}`}
                  </span>
                }
              />

              <div className="space-y-4">
                {paymentError ?(
                  <div className="rounded-2xl border border-[#ffd7d9] bg-[#fff5f5] px-4 py-3 text-sm text-[#b91c1c]">
                    {paymentError}
                  </div>
                ) : null}
                {shouldShowWorkspaceSkeleton ?(
                  Array.from({ length: 3 }).map((_, index) => (
                    <article key={index} className="ui-border ui-surface-soft animate-pulse rounded-[22px] border p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 gap-4">
                          <div className="ui-surface h-16 w-16 shrink-0 rounded-[14px] sm:h-20 sm:w-20 sm:rounded-[18px]" />
                          <div className="min-w-0 space-y-3">
                            <div className="h-5 w-40 rounded bg-[#ededed]" />
                            <div className="h-4 w-full rounded bg-[#ededed]" />
                            <div className="h-4 w-3/4 rounded bg-[#ededed]" />
                            <div className="h-3 w-28 rounded bg-[#ededed]" />
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col gap-2">
                          <div className="ui-card-flat h-9 w-9 rounded-xl" />
                          <div className="ui-card-flat h-9 w-9 rounded-xl" />
                        </div>
                      </div>
                    </article>
                  ))
                ) : null}
                {filteredPrimaryItems.length === 0 ?(
                  shouldShowWorkspaceSkeleton ? null : hasActiveClassifiedFilters ? (
                    <div className="ui-border-strong ui-surface-soft ui-text-muted rounded-[22px] border border-dashed px-5 py-8 text-sm leading-6">
                      Aucune annonce ne correspond a vos filtres pour le moment.
                    </div>
                  ) : (
                    <Workspace.EmptyState label={primaryList.title} />
                  )
                ) : (
                  paginatedPrimaryItems.map((item) => {
                    const editLockReason = getWorkspaceItemEditLockReason(item);
                    const effectiveEditLockReason = emailVerificationRequired
                      ? "Activez votre compte depuis l'email de confirmation avant de modifier un contenu."
                      : editLockReason;
                    const isEditLocked = effectiveEditLockReason.length > 0;
                    return (
                    <article
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        if (isWorkspaceCardControl(event.target)) {
                          return;
                        }
                        handleWorkspaceItemPrimaryAction(item);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleWorkspaceItemPrimaryAction(item);
                        }
                      }}
                      className={`rounded-[22px] border p-5 transition-all duration-200 delay-75 ease-out ${
                        item.id === editingItemId
                          ?"ui-surface border-2 border-[#27624f] shadow-[0_12px_32px_rgba(17,17,17,0.08)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.35)]"
                          : "ui-border ui-surface-soft border hover:border-2 hover:border-[#27624f] hover:bg-[var(--surface-1)]"
                      } cursor-pointer focus:outline-none focus-visible:border-2 focus-visible:border-[#27624f] focus-visible:bg-[var(--surface-1)]`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 gap-4">
                          {(item.images?.[0] || item.image || imageFallbackSrc) ?(
                          <div className="ui-surface h-16 w-16 shrink-0 overflow-hidden rounded-[14px] sm:h-20 sm:w-20 sm:rounded-[18px]">
                            <AppImage alt="" src={item.images?.[0] || item.image || imageFallbackSrc} className="h-full w-full object-cover" />
                          </div>
                          ) : null}
                          <div className="min-w-0">
                            <h3 className="ui-text-main text-base font-semibold [overflow-wrap:anywhere]">{item.title}</h3>
                            {item.price ?(
                              <p className="mt-2 ui-text-main text-sm font-semibold">
                                {formatListingMoney(item.price, item.currency)}
                              </p>
                            ) : null}
                            <p className="mt-2 line-clamp-2 ui-text-muted text-sm leading-6">
                              {getListingDisplayText(String(item.content || item.description || ""), String(item.price || ""))}
                            </p>
                            {shouldShowWorkspacePublicationMeta(item) ? (
                              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[#8a8a8a] [overflow-wrap:anywhere]">{item.meta}</p>
                            ) : null}
                            {shouldShowWorkspaceExpiration(item) ?(
                              <p className="ui-text-muted mt-2 text-xs">
                                Expiration: {new Date(item.expiresAt).toLocaleDateString("fr-FR")}
                              </p>
                            ) : null}
                            {primaryTab.id === "classifieds" && isExpiringWithinDays(item.expiresAt) && !item.isExpired ?(
                              <div className="mt-2 rounded-xl border border-[#F3D5B2] bg-[#FFF7ED] px-3 py-2 text-xs text-[#9A3412]">
                                Expire bientôt : vous pourrez renouveler sa visibilité via le paiement habituel.
                              </div>
                            ) : null}
                            {isScheduledWorkspaceItem(item) ?(
                              <div className="mt-2 rounded-xl border border-[#D7E4FF] bg-[#F5F8FF] px-3 py-2 text-xs text-[#2447BA] dark:border-[#3151a6] dark:bg-[#1b2340] dark:text-[#dbe6ff]">
                                Visible a partir du {formatScheduledPublishDateLabel(item.scheduledPublishAt)}.
                              </div>
                            ) : null}
                            {item.moderationStatus === "flagged" && item.moderationMessage ? (
                              <div className="mt-2 rounded-xl border border-[#F3D5B2] bg-[#FFF7ED] px-3 py-2 text-xs leading-5 text-[#9A3412]">
                                <span className="font-semibold">Action requise: </span>{item.moderationMessage}
                              </div>
                            ) : null}
                            {isPendingItem(item) ? renderPublishActions(item, true, "list") : null}
                            <div className="mt-3 flex flex-wrap gap-2">
                              {canBoostItem(item) ?(
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleBoost(item);
                                  }}
                                  disabled={isPayingItemId === item.id}
                                  className="inline-flex items-center justify-center rounded-xl bg-[#22c55e] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#16a34a] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {isPayingItemId === item.id ?"Redirection..." : item.featured ?"Prolonger le boost" : "Booster 7 jours"}
                                </button>
                              ) : null}
                              {canMoveItemToDraft(item) ?(
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void handleMoveToDraft(item);
                                  }}
                                  disabled={isUpdatingStatusItemId === item.id}
                                  className="ui-surface ui-text-main ui-border inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition hover:border-[#27624f] hover:text-[#27624f] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                              {isUpdatingStatusItemId === item.id ? "Mise à jour..." : "Mettre en brouillon"}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col gap-2">
                          <button
                            type="button"
                            aria-label="Ouvrir"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleWorkspaceItemPrimaryAction(item);
                            }}
                          >
                            <Workspace.ActionIcon>
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14" />
                                <path d="m12 5 7 7-7 7" />
                                       <path d="m12 5 7 7-7 7" />
                              </svg>
                            </Workspace.ActionIcon>
                          </button>
                          <button
                            type="button"
                            aria-label="Supprimer"
                            onClick={(event) => {
                              event.stopPropagation();
                              setPendingDeleteItem(item);
                            }}
                            disabled={isDeletingItemId === item.id}
                          >
                            <Workspace.ActionIcon>
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18" />
                                <path d="M8 6V4h8v2" />
                                <path d="M19 6l-1 14H6L5 6" />
                              </svg>
                            </Workspace.ActionIcon>
                          </button>
                          <span title={isEditLocked ? effectiveEditLockReason : undefined}>
                            <button
                              type="button"
                              aria-label="Modifier"
                              onClick={(event) => {
                                event.stopPropagation();
                                openEditForm(item);
                              }}
                              disabled={isEditLocked}
                            >
                              <Workspace.ActionIcon disabled={isEditLocked}>
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 20h9" />
                                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                </svg>
                              </Workspace.ActionIcon>
                            </button>
                          </span>
                        </div>
                      </div>
                    </article>
                    );
                  })
                )}
                {shouldShowClassifiedListTools && totalWorkspacePages > 1 ?(
                  <div className="ui-card-flat flex flex-wrap items-center justify-between gap-3 rounded-[18px] px-4 py-3">
                    <p className="ui-text-muted text-xs font-medium">
                      Page {safeWorkspacePage} sur {totalWorkspacePages}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setWorkspacePage((current) => Math.max(1, current - 1))}
                        disabled={safeWorkspacePage === 1}
                        className="ui-surface ui-text-main ui-border inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition hover:border-[#27624f] hover:text-[#27624f] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Precedent
                      </button>
                      {Array.from({ length: totalWorkspacePages }).map((_, index) => {
                        const page = index + 1;
                        const isActive = page === safeWorkspacePage;
                        return (
                          <button
                            key={page}
                            type="button"
                            onClick={() => setWorkspacePage(page)}
                            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-3 text-xs font-semibold transition ${
                              isActive
                                ? "bg-[#111] text-white dark:bg-white dark:text-[#111]"
                                : "ui-border ui-text-main border hover:border-[#27624f] hover:text-[#27624f]"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setWorkspacePage((current) => Math.min(totalWorkspacePages, current + 1))}
                        disabled={safeWorkspacePage === totalWorkspacePages}
                        className="ui-surface ui-text-main ui-border inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition hover:border-[#27624f] hover:text-[#27624f] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </Workspace.Panel>
          </div>
        )}
        </Workspace.Surface>
        {isClassifiedPreviewOpen && isClient ? createPortal((
          <div
            className="profile-workspace-modal fixed inset-0 z-[165] overflow-y-auto bg-black/80 px-4 py-8 sm:px-6 lg:px-8"
            onMouseDown={() => closeClassifiedPreview()}
          >
            <div className="mx-auto w-full max-w-[1120px]">
              <button
                type="button"
                onClick={() => closeClassifiedPreview()}
                className="sticky right-4 top-4 z-10 ml-auto mb-3 flex rounded-full bg-white p-2 transition-colors hover:bg-gray-100 dark:bg-[#2a2a2a] dark:hover:bg-[#3a3a3a]"
                aria-label="Fermer la prévisualisation"
              >
                <svg className="h-6 w-6 dark:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12" />
                  <path d="M18 6 6 18" />
                </svg>
              </button>

              <div
                className="ui-surface content-stretch flex w-full flex-col items-start overflow-clip rounded-[24px] p-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.22)]"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div className="content-stretch relative flex w-full flex-col items-start gap-[24px]">
                  {formError ? (
                    <div className="w-full rounded-[12px] border border-[#f7cfd3] bg-[#fff2f3] px-4 py-2 text-[12px] text-[#8c1d24]">
                      {formError}
                    </div>
                  ) : null}

                  <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="flex min-w-0 flex-col gap-5">
                      {shouldShowPreviewHeroImage ? (
                        <ListingFadeGallery
                          title={resolvedPreviewTitle}
                          meta={previewHeroValue || "Annonce"}
                          location={resolvedPreviewLocation || ""}
                          images={resolvedPreviewImages.length > 0 ? resolvedPreviewImages : resolvedPreviewPrimaryImage ? [resolvedPreviewPrimaryImage] : []}
                          containerClassName="min-h-[260px] sm:min-h-[360px]"
                          thumbnailsClassName="grid grid-cols-4 gap-2 md:grid-cols-1 md:auto-rows-[72px]"
                          thumbnailSizeClassName="md:h-[72px] md:w-[72px]"
                          overlayContentWidthClassName="max-w-[420px]"
                        />
                      ) : (
                        <div className="ui-card-flat rounded-[20px] p-5">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded-full bg-[#111111] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                              {primaryTab.id === "jobs" ? "Offre d'emploi" : "Appel d'offres"}
                            </span>
                            {previewHeroValue ? (
                              <span className="ui-surface-soft ui-text-main rounded-full px-4 py-2 text-sm font-semibold">
                                {previewHeroValue}
                              </span>
                            ) : null}
                            {resolvedPreviewLocation ? <span className="ui-text-muted text-sm">{resolvedPreviewLocation}</span> : null}
                          </div>
                          <h4 className="ui-text-main mt-5 max-w-3xl text-[2rem] font-semibold leading-tight">
                            {resolvedPreviewTitle}
                          </h4>
                        </div>
                      )}

                      <div className="ui-card-flat rounded-[20px] p-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[16px] bg-[#27624f] text-[18px] font-bold text-white">
                            {resolvedPreviewTitle.trim().charAt(0).toUpperCase() || "A"}
                          </div>
                          <div className="min-w-0">
                            <p className="ui-text-main line-clamp-1 text-[18px] font-bold">
                              {primaryTab.id === "classifieds" ? "Aperçu de votre annonce" : "Aperçu de votre publication"}
                            </p>
                            <p className="ui-text-muted text-[12px]">
                              {resolvedPreviewLocation || "Tanyora"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="ui-card-flat rounded-[20px] p-5">
                        <p className="text-[12px] font-bold uppercase tracking-[0.24em] text-[#27624f]">
                          Description
                        </p>
                        <h5 className="mt-3 ui-text-main text-[18px] font-bold leading-[1.2]">
                          {resolvedPreviewTitle}
                        </h5>
                        <div className="ui-text-main mt-4 space-y-4 break-words text-[15px] leading-[1.7] [overflow-wrap:anywhere]">
                          {previewDescriptionHtml ? (
                            <div
                              className="prose prose-p:my-3 prose-ul:my-3 prose-li:my-1 max-w-none text-[15px] leading-[1.7] text-[color:var(--text-main)] dark:prose-invert"
                              dangerouslySetInnerHTML={{ __html: previewDescriptionHtml }}
                            />
                          ) : (
                            <p className="whitespace-pre-wrap">{previewDescriptionText}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="ui-card-flat rounded-[18px] p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#27624f]">
                          {isPublishPreview ? "Publication" : "Prévisualisation"}
                        </p>
                        <p className="ui-text-muted mt-2 text-[14px] leading-[1.5]">
                          {showPreviewPublishControls
                            ? "Choisissez directement si vous souhaitez publier maintenant ou programmer la mise en ligne."
                            : isEditingListingItem
                              ? "Vérifiez le rendu final de votre publication avant d'enregistrer les modifications."
                              : "Vérifiez le rendu final de votre publication avant la publication."}
                        </p>
                      </div>

                      <div className="ui-card-flat rounded-[20px] p-5">
                        <div className="space-y-5">
                          <div>
                            <p className="ui-text-main text-[12px] font-bold">{previewPrimaryInfoLabel}</p>
                            <p className="ui-text-muted mt-1 text-[14px]">{previewPrimaryInfoValue}</p>
                          </div>
                          <div>
                            <p className="ui-text-main text-[12px] font-bold">{previewSecondaryInfoLabel}</p>
                            <p className="ui-text-muted mt-1 text-[14px]">{previewSecondaryInfoValue}</p>
                          </div>
                          {primaryTab.id !== "classifieds" ? (
                            <div>
                              <p className="ui-text-main text-[12px] font-bold">
                                {primaryTab.id === "jobs" ? "Compétences" : "Catégorie"}
                              </p>
                              {primaryTab.id === "jobs" && resolvedPreviewSkills.length > 0 ? (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {resolvedPreviewSkills.map((skill) => (
                                    <span key={skill} className="ui-surface-soft ui-text-main rounded-full px-2.5 py-1 text-xs font-medium">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="ui-text-muted mt-1 text-[14px]">
                                  {primaryTab.id === "jobs" ? "Aucune compétence renseignée" : resolvedPreviewCategory || "Non renseignée"}
                                </p>
                              )}
                            </div>
                          ) : null}
                          <div>
                            <p className="ui-text-main text-[12px] font-bold">Lieu</p>
                            <p className="ui-text-muted mt-1 text-[14px]">{resolvedPreviewLocation || "Non renseigné"}</p>
                          </div>
                          <div>
                            <p className="ui-text-main text-[12px] font-bold">Téléphone de contact</p>
                            <p className="ui-text-muted mt-1 text-[14px]">{resolvedPreviewPhone || "Non renseigné"}</p>
                          </div>
                          <div>
                            <p className="ui-text-main text-[12px] font-bold">Email de contact</p>
                            <p className="ui-text-muted mt-1 break-words text-[14px]">{resolvedPreviewEmail || "Non renseigné"}</p>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-3">
                          {showPreviewPublishControls ? (
                            <>
                              <button
                                type="button"
                                onClick={() => closeClassifiedPreview()}
                                className="ui-surface ui-text-main ui-border inline-flex h-[46px] w-full items-center justify-center rounded-[8px] border px-4 text-[13px] font-semibold transition hover:border-[#27624f] hover:text-[#27624f]"
                              >
                                {isPublishPreview ? "Annuler" : "Retour à l'édition"}
                              </button>
                              <button
                                type="button"
                                onClick={() => void confirmClassifiedPreviewAction("now")}
                                disabled={isPayingItemId === classifiedPreviewTargetItem?.id}
                                className={`inline-flex min-h-[46px] w-full items-center justify-center rounded-[8px] text-[13px] font-semibold text-white transition-colors ${
                                  previewPublishChoice === "now"
                                    ? "bg-[#18A957] hover:bg-[#15924b]"
                                    : "bg-[#111111] hover:bg-[#18A957]"
                                } disabled:cursor-not-allowed disabled:opacity-60`}
                              >
                                {isPayingItemId === classifiedPreviewTargetItem?.id && previewPublishChoice === "now"
                                  ? "Publication..."
                                  : "Publier maintenant"}
                              </button>
                              <div className="ui-surface-soft rounded-[16px] p-4">
                                <div className="grid gap-3">
                                  <label className="block">
                                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a8a8a]">
                                      Date de publication
                                    </span>
                                    <input
                                      type="date"
                                      min={getScheduledPublishDateMin()}
                                      value={scheduledPublishDate}
                                      onChange={(event) => {
                                        setPreviewPublishChoice("later");
                                        setScheduledPublishDate(event.target.value);
                                      }}
                                      className="ui-input w-full rounded-[12px]"
                                    />
                                  </label>
                                  <label className="block">
                                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a8a8a]">
                                      Heure de publication
                                    </span>
                                    <input
                                      type="time"
                                      value={scheduledPublishTime}
                                      onChange={(event) => {
                                        setPreviewPublishChoice("later");
                                        setScheduledPublishTime(event.target.value);
                                      }}
                                      className="ui-input w-full rounded-[12px]"
                                    />
                                  </label>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => void confirmClassifiedPreviewAction("later")}
                                disabled={isPayingItemId === classifiedPreviewTargetItem?.id}
                                className={`inline-flex min-h-[46px] w-full items-center justify-center rounded-[8px] text-[13px] font-semibold text-white transition-colors ${
                                  previewPublishChoice === "later"
                                    ? "bg-[#2F57D9] hover:bg-[#2447ba]"
                                    : "bg-[#111111] hover:bg-[#2F57D9]"
                                } disabled:cursor-not-allowed disabled:opacity-60`}
                              >
                                {isPayingItemId === classifiedPreviewTargetItem?.id && previewPublishChoice === "later"
                                  ? "Publication..."
                                  : "Publier plus tard"}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => closeClassifiedPreview()}
                                className="ui-surface ui-text-main ui-border inline-flex h-[46px] w-full items-center justify-center rounded-[8px] border px-4 text-[13px] font-semibold transition hover:border-[#27624f] hover:text-[#27624f]"
                              >
                                Retour à l'édition
                              </button>
                              <button
                                type="button"
                                onClick={() => void confirmClassifiedPreviewAction()}
                                className="inline-flex h-[46px] w-full items-center justify-center rounded-[8px] bg-[#2F57D9] px-4 text-[13px] font-semibold text-white transition hover:bg-[#2447ba]"
                              >
                                {isEditingListingItem ? "Enregistrer les modifications" : "Valider la publication"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ), document.body) : null}
        {pendingDeleteItem && isClient ? createPortal((
          <div
            className="profile-workspace-modal fixed inset-0 z-[160] flex items-center justify-center bg-[#111111]/60 backdrop-blur-[1px] p-4"
            onMouseDown={() => {
              if (isDeletingItemId !== pendingDeleteItem.id) {
                setPendingDeleteItem(null);
              }
            }}
          >
            <div
              className="ui-card w-full max-w-md rounded-[24px] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)]"
              onMouseDown={(event) => {
                event.stopPropagation();
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#27624f]">Confirmer la suppression</p>
              <h3 className="ui-text-main mt-3 text-xl font-semibold">{pendingDeleteItem.title}</h3>
              <p className="mt-3 ui-text-muted text-sm leading-6">
                Ce contenu sera supprimé de votre espace et ne sera plus visible sur la plateforme. Vérifiez bien avant de confirmer.
              </p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPendingDeleteItem(null)}
                  disabled={isDeletingItemId === pendingDeleteItem.id}
                  className="ui-surface ui-text-main ui-border inline-flex rounded-2xl border px-4 py-2 text-sm font-semibold transition hover:border-[#27624f] hover:text-[#27624f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteItem(pendingDeleteItem).catch(() => undefined);
                  }}
                  disabled={isDeletingItemId === pendingDeleteItem.id}
                  className="rounded-2xl bg-[#27624f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b6191f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeletingItemId === pendingDeleteItem.id ?"Suppression..." : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        ), document.body) : null}
    </Workspace>
  );
}



























