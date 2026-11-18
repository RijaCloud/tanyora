import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/config/revalidate";
import { cacheStore } from "@/lib/cache";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";
import {
  dedupeTaxonomyTermsByHierarchy,
  type TaxonomyTermResult,
  type TaxonomyTermsResult,
} from "@/lib/taxonomy/terms";
import { cache } from "react";

export {
  dedupeTaxonomyTermsByHierarchy,
  type TaxonomyTermResult,
  type TaxonomyTermsResult,
} from "@/lib/taxonomy/terms";

export type AuthSyncPayload = {
  auth0Sub: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
};

type SubmissionKind = "classified" | "tender" | "article" | "job";

type BillingPayload = {
  wpUserId: number;
};

export type EmailDispatcherConfigResult = {
  configured: boolean;
  endpoint?: string;
  sharedSecret?: string;
};

export type WordPressWebPushConfigResult = {
  configured: boolean;
  publicKey?: string;
  privateKey?: string;
  subject?: string;
};

export type AccessPlanId = "free" | "essentiel" | "business";

export type WordPressAccessMatrix = {
  news: {
    minimumPlanOptions: Array<{
      value: "all" | "essentiel" | "business";
      label: string;
    }>;
  };
  classifieds: {
    monthlyPosts: Record<AccessPlanId, number>;
    maxPhotos: Record<AccessPlanId, number>;
  };
  jobs: {
    monthlyPosts: Record<AccessPlanId, number>;
  };
  tenders: {
    monthlyPosts: Record<AccessPlanId, number>;
    minimumPlan: AccessPlanId;
    responseMinimumPlan: AccessPlanId;
  };
};

export type WordPressPublicSiteConfigResult = {
  classifiedJobBlendEnabled: boolean;
  annoncesDisplayMode: "separate" | "blended";
  editorialSourceGraphqlUrl?: string | null;
  seo?: {
    siteName?: string | null;
    siteTagline?: string | null;
    siteIconUrl?: string | null;
    logoUrl?: string | null;
    pages?: Partial<Record<"home" | "news" | "classifieds" | "jobs" | "tenders" | "directory" | "pricing", {
      title?: string | null;
      description?: string | null;
      imageUrl?: string | null;
      noIndex?: boolean;
    }>>;
  };
  footer?: {
    description?: string | null;
    socialLinks?: {
      facebook?: string | null;
      tiktok?: string | null;
      instagram?: string | null;
      youtube?: string | null;
      linkedin?: string | null;
      x?: string | null;
    };
  };
  adsense?: {
    mode?: "disabled" | "placeholder" | "adsense";
    enabled: boolean;
    showPlaceholders?: boolean;
    articleInlineStartAfterBlocks?: number;
    articleInlineRepeatEveryBlocks?: number;
    clientId?: string | null;
    slots?: {
      topBanner?: string | null;
      homeTop?: string | null;
      homeAfterEditorial?: string | null;
      archiveInline?: string | null;
      articleInline?: string | null;
      articleRail?: string | null;
    };
  };
  accessMatrix: WordPressAccessMatrix;
};

export type WordPressPrivacyPolicyResult = {
  configured: boolean;
  title?: string;
  contentHtml?: string;
  modifiedAt?: string;
};

export type PublishingAccessStatusResult = {
  wpUserId: number;
  planId: AccessPlanId;
  accessGrant?: "all_privileges" | null;
  classifieds: {
    canCreateDraft: boolean;
    canPublish: boolean;
    monthlyLimit: number;
    monthlyUsed: number;
    monthlyRemaining: number;
    maxPhotos: number;
  };
  jobs: {
    canCreateDraft: boolean;
    canPublish: boolean;
    monthlyLimit: number;
    monthlyUsed: number;
    monthlyRemaining: number;
  };
  tenders: {
    canCreateDraft: boolean;
    canPublish: boolean;
    monthlyLimit: number;
    monthlyUsed: number;
    monthlyRemaining: number;
    canRespond: boolean;
    minimumPlan: AccessPlanId;
    responseMinimumPlan: AccessPlanId;
  };
  period: {
    monthKey: string;
    resetsAt: string;
  };
};

export type WordPressAuthUser = {
  wpUserId: number;
  email: string;
  displayName: string;
  username?: string;
  role?: string;
  emailVerified?: boolean;
  onboardingCompleted?: boolean;
};

export type WordPressLoginOtpChallenge = {
  otpRequired: true;
  challengeId: string;
  email: string;
  expiresInSeconds: number;
  resendAvailableInSeconds?: number;
  message?: string;
};

export type WordPressLoginVerifyResult = {
  ok: boolean;
  user: WordPressAuthUser;
};

export type RegisterPayload = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  profilePhoto?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    x?: string;
    youtube?: string;
  };
};

export type RegisterResult = {
  user: WordPressAuthUser;
  emailSent: boolean;
  emailMessage: string;
};

export type WordPressUserProfile = WordPressAuthUser & {
  firstName?: string;
  lastName?: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  businessActivityCategory?: string;
  businessRegions?: string[];
  businessCities?: string[];
  directoryVisibilityEnabled?: boolean;
  profilePhoto?: string;
  companyLogo?: string;
  avatarUrl?: string;
  notificationEmailsEnabled?: boolean;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    x?: string;
    youtube?: string;
  };
};

export type SubmissionPayload = {
  /** A client-generated key used by WordPress to make create retries safe. */
  requestId?: string;
  /** Trusted WordPress user resolved from the server session. */
  wpUserId?: number;
  /** Signed server-session plan, used for the classified photo cap. */
  trustedPlanId?: "free" | "essentiel" | "business";
  title: string;
  content: string;
  excerpt?: string;
  category?: string;
  productTag?: string;
  type?: string;
  companyName?: string;
  location?: string;
  city?: string;
  area?: string;
  condition?: string;
  price?: string;
  currency?: string;
  budget?: string;
  detailsPdfUrl?: string;
  detailsPdfName?: string;
  skills?: string[];
  experienceYears?: string;
  needBy?: string;
  deadline?: string;
  contactPhone?: string;
  contactPhoneCountry?: string;
  contactEmail?: string;
  featuredImageUrl?: string;
  galleryImageUrls?: string[];
  author: AuthSyncPayload;
};

export type PublicListingKind = "classified" | "tender" | "job" | "directory";
export type PublicAdPlacement = "boost_list" | "inline_list";
export type PublicAdFeature = "all" | "classified" | "job" | "tender";

export type PublicAdItem = {
  id: number;
  title: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  ctaLabel?: string;
  altText?: string;
  placement: PublicAdPlacement;
  feature: PublicAdFeature;
  position: number;
};

export type PublicAdsResult = {
  placement: PublicAdPlacement;
  feature?: PublicAdFeature;
  items: PublicAdItem[];
};

export type PublicListingsPayload = {
  page?: number;
  perPage?: number;
  featured?: boolean;
  search?: string;
  category?: string;
  regions?: string[];
  cities?: string[];
  type?: string;
  productTag?: string;
  location?: string;
  city?: string;
  area?: string;
  company?: string;
  priceMin?: string;
  priceMax?: string;
  currency?: string;
  ownerWpUserId?: number;
  id?: number;
};

export type PublicListingItem = {
  id: number;
  title: string;
  description: string;
  excerpt?: string;
  content: string;
  location: string;
  city?: string;
  area?: string;
  date: string;
  lastModified?: string;
  category: string;
  productTag?: string;
  condition?: string;
  regions?: string[];
  cities?: string[];
  type?: string;
  featured?: boolean;
  image?: string;
  images?: string[];
  contactPhone?: string;
  contactPhoneCountry?: string;
  contactEmail?: string;
  companyName?: string;
  publisherName?: string;
  profilePhoto?: string;
  companyLogo?: string;
  budget?: string;
  detailsPdfUrl?: string;
  detailsPdfName?: string;
  skills?: string[];
  experienceYears?: string;
  needBy?: string;
  deadline?: string;
  price?: string;
  currency?: string;
  expiresAt?: string;
  isAdminCreated?: boolean;
  ownerWpUserId?: number;
  ownerEmail?: string;
  ownerRatingAverage?: number;
  ownerRatingCount?: number;
  website?: string;
  viewCount?: number;
};

export type PublicListingsResult = {
  items: PublicListingItem[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
};

export type SitemapListingItem = {
  id: number;
  slug: string;
  lastModified?: string;
};

export type SitemapListingsResult = {
  items: SitemapListingItem[];
  pagination: PublicListingsResult["pagination"];
};

export type WordPressTypesenseSearchResult = {
  groups: {
    article: Array<Record<string, unknown>>;
    classified: Array<Record<string, unknown>>;
    job: Array<Record<string, unknown>>;
    tender: Array<Record<string, unknown>>;
    directory: Array<Record<string, unknown>>;
  };
};


export type PricingCatalogItem = {
  code: string;
  sku: string;
  kind: "news" | "job" | "classified" | "tender";
  action: "post" | "boost" | "extend";
  variant?: string;
  durationDays: number;
  wcProductId: number | null;
  name: string | null;
  price: number | null;
  currency: string | null;
  status: string | null;
  exists: boolean;
};

export type PricingCatalogResult = {
  generatedAt: string;
  items: PricingCatalogItem[];
};

export type ListingCheckoutKind = "classified" | "article" | "job" | "tender";

export type ListingCheckoutAction = "post" | "boost";

export type ListingPayableQuotePayload = {
  wpUserId: number;
  listingId: number;
  action?: ListingCheckoutAction;
};

export type ListingPayableQuoteResult = {
  listingId: number;
  kind: ListingCheckoutKind;
  action: ListingCheckoutAction;
  postStatus: string;
  paymentStatus: string;
  imageCount: number;
  photoPack: "1_photo" | "4_photo";
  pricingCode: string;
  title: string;
};

export type MarkListingPaidPayload = {
  wpUserId: number;
  listingId: number;
  sessionId: string;
  pricingCode?: string;
  wpProductId?: number;
  scheduledPublishAt?: string;
};

export type StartMvolaSubscriptionPayload = {
  wpUserId: number;
  planId: import("@/types/subscriptions").SubscriptionPlanId;
  billingPeriod?: import("@/types/subscriptions").BillingPeriod;
  customerNumber: string;
  wpProductSku?: string;
  wpProductId?: number | null;
  returnTo?: string;
};

export type StartMvolaListingPayload = {
  wpUserId: number;
  listingId: number;
  customerNumber: string;
  action?: ListingCheckoutAction;
  returnTo?: string;
  scheduledPublishAt?: string;
};

export type GetMvolaStatusPayload = {
  wpUserId: number;
  orderId: number;
  listingId?: number;
};

export type RelayMvolaCallbackPayload = Record<string, unknown>;

export type StartMvolaCheckoutResult = {
  orderId: number;
  status: "pending";
  checkoutUrl: string;
  listingId?: number;
};


export type GetPapiStatusPayload = {
  wpUserId: number;
  orderId: number;
  key: string;
};

export type MvolaStatusResult = {
  orderId: number;
  status: "pending" | "completed" | "failed";
  isConfirmed: boolean;
  flow?: "subscription" | "listing";
  listingId?: number;
  planId?: import("@/types/subscriptions").SubscriptionPlanId;
  billingPeriod?: import("@/types/subscriptions").BillingPeriod;
  renewsAt?: string | null;
  paymentStatus?: string | null;
  postStatus?: string | null;
  kind?: PublicListingKind | null;
};

export type MarkListingPaidResult = {
  listingId: number;
  paymentStatus: "paid";
  alreadyPaid: boolean;
  postStatus?: string;
  scheduledPublishAt?: string | null;
  isScheduled?: boolean;
};

export type UseAllPrivilegesListingAccessPayload = {
  wpUserId: number;
  listingId: number;
  action?: ListingCheckoutAction;
  requestId: string;
  scheduledPublishAt?: string;
};

export type UseAllPrivilegesListingAccessResult = {
  listingId: number;
  action: ListingCheckoutAction;
  paymentStatus: string;
  postStatus: string;
  accessGrant: "all_privileges";
  alreadyProcessed: boolean;
};

export type UseIncludedListingAccessPayload = {
  wpUserId: number;
  listingId: number;
  scheduledPublishAt?: string;
};

export type UseIncludedListingAccessResult = {
  listingId: number;
  paymentStatus: "paid";
  postStatus: string;
  scheduledPublishAt?: string | null;
  isScheduled?: boolean;
  expiresAt?: string;
  pricingCode?: string;
  usedIncludedAccess: true;
  alreadyPaid?: boolean;
  includedCreditConsumed?: boolean;
  publishingAccessStatus?: PublishingAccessStatusResult | null;
};

export type LoginPayload = {
  identifier: string;
  password: string;
};

export type LoginOtpVerifyPayload = {
  challengeId: string;
  code: string;
};

export type LoginOtpResendPayload = {
  challengeId: string;
};

export type PasswordResetPayload = {
  identifier: string;
};

export type PasswordResetConfirmPayload = {
  login: string;
  key: string;
  password: string;
};

export type PasswordChangePayload = {
  wpUserId: number;
  currentPassword: string;
  newPassword: string;
};

export type AccountDeletionCodePayload = {
  wpUserId: number;
};

export type DeleteWordPressAccountPayload = {
  wpUserId: number;
  confirmation: string;
  currentPassword?: string;
  challengeId?: string;
  verificationCode?: string;
};

export type EmailVerificationSendPayload = {
  wpUserId?: number;
  email?: string;
};

export type EmailVerificationConfirmPayload = {
  email: string;
  token: string;
};

export type AvailabilityPayload = {
  username?: string;
  email?: string;
};

export type AvailabilityResult = {
  username: {
    value: string;
    available: boolean;
  };
  email: {
    value: string;
    available: boolean;
  };
};

export type SubscriptionSnapshotPayload = BillingPayload;
export type BillingHistoryPayload = BillingPayload;

export type SyncStripeSubscriptionPayload = BillingPayload & {
  planId: import("@/types/subscriptions").SubscriptionPlanId;
  billingPeriod?: import("@/types/subscriptions").BillingPeriod;
  wpProductId?: number | null;
  wpProductSku?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePaymentIntentId?: string | null;
  stripePriceId?: string | null;
  stripeProductId?: string | null;
  stripeStatus?: string | null;
  stripeCurrentPeriodEnd?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
};

export type SaveStripeCustomerPayload = BillingPayload & {
  stripeCustomerId: string;
};

export type DowngradeToFreePayload = BillingPayload & {
  reason?: string | null;
};

export type UserProfilePayload = BillingPayload;

export type UpdateUserProfilePayload = BillingPayload & {
  username?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  businessActivityCategory?: string;
  businessRegions?: string[];
  businessCities?: string[];
  directoryVisibilityEnabled?: boolean;
  profilePhoto?: string;
  companyLogo?: string;
  notificationEmailsEnabled?: boolean;
  completeOnboarding?: boolean;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    x?: string;
    youtube?: string;
  };
};

export type UpdateUserProfilePhotoPayload = BillingPayload & {
  profilePhoto: string;
};

export type NotificationPreferencePayload = {
  wpUserId?: number;
  email?: string;
};

export type NotificationPreferenceResult = {
  found: boolean;
  wpUserId?: number;
  email?: string;
  notificationEmailsEnabled: boolean;
};

export type UpdateNotificationPreferencePayload = {
  wpUserId?: number;
  email?: string;
  notificationEmailsEnabled: boolean;
};

export type UserWorkspaceItemsPayload = BillingPayload;

export type UserWorkspaceItemsResult = {
  title: string;
  items: Array<{
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
    budget?: string;
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
  }>;
};

export type ListingFormConfigResult = {
  terms: TaxonomyTermResult[];
  locations: TaxonomyTermResult[];
  pricing: PricingCatalogResult | null;
};

export type UpdateClassifiedPayload = {
  wpUserId: number;
  listingId: number;
  title: string;
  content: string;
  excerpt?: string;
  category?: string;
  productTag?: string;
  type?: string;
  companyName?: string;
  location?: string;
  city?: string;
  area?: string;
  condition?: string;
  price?: string;
  currency?: string;
  contactPhone?: string;
  contactPhoneCountry?: string;
  featuredImageUrl?: string;
  galleryImageUrls?: string[];
};

export type DeleteClassifiedPayload = {
  wpUserId: number;
  listingId: number;
};

export type UpdateJobPayload = {
  wpUserId: number;
  listingId: number;
  title: string;
  content: string;
  excerpt?: string;
  category?: string;
  type?: string;
  companyName?: string;
  location?: string;
  city?: string;
  area?: string;
  skills?: string[];
  experienceYears?: string;
  needBy?: string;
  deadline?: string;
  contactPhone?: string;
  contactPhoneCountry?: string;
  contactEmail?: string;
  featuredImageUrl?: string;
};

export type DeleteJobPayload = {
  wpUserId: number;
  listingId: number;
};

export type UpdateTenderPayload = {
  wpUserId: number;
  listingId: number;
  title: string;
  content: string;
  excerpt?: string;
  category?: string;
  productTag?: string;
  type?: string;
  companyName?: string;
  location?: string;
  budget?: string;
  currency?: string;
  detailsPdfUrl?: string;
  detailsPdfName?: string;
  deadline?: string;
  contactPhone?: string;
  contactPhoneCountry?: string;
  contactEmail?: string;
  featuredImageUrl?: string;
};

export type DeleteTenderPayload = {
  wpUserId: number;
  listingId: number;
};

export type UpsertUserRatingPayload = {
  sellerUserId: number;
  raterUserId: number;
  listingId: number;
  score: number;
  threadKey?: string;
};

export type UserRatingSummaryPayload = {
  sellerUserId: number;
};

export type UpdateSubmissionStatusPayload = {
  wpUserId: number;
  listingId: number;
};

export type NewsArticleCommentItem = {
  id: number;
  author: string;
  date: string;
  content: string;
};

export type NewsArticleCommentsResult = {
  postId: number;
  slug: string;
  commentCount: number;
  commentsOpen: boolean;
  items: NewsArticleCommentItem[];
};

type WordPressRequestError = Error & {
  status?: number;
  body?: string;
  path?: string;
  requestUrl?: string;
};

export function getWordPressRequestStatus(error: unknown) {
  if (!(error instanceof Error) || !("status" in error)) {
    return null;
  }
  const status = (error as WordPressRequestError).status;
  return typeof status === "number" && status >= 400 && status <= 599 ? status : null;
}

function getWordPressInternalBaseUrl() {
  const value = process.env.WORDPRESS_INTERNAL_API_BASE_URL;
  if (!value) {
    throw new Error("WORDPRESS_INTERNAL_API_BASE_URL is not configured.");
  }
  return value.replace(/\/$/, "");
}

export type WordPressHealthProbe = {
  status: "up" | "down";
  latencyMs: number;
  httpStatus?: number;
  details?: unknown;
  error?: string;
};

/**
 * Sonde `GET 2424/v1/health` du plugin. Volontairement independante de
 * `performWordPressInternalRequest` : elle doit mesurer la disponibilite de
 * WordPress, pas emprunter le chemin metier ni son timeout de 8 s.
 */
export async function probeWordPressHealth(timeoutMs: number): Promise<WordPressHealthProbe> {
  const startedAt = Date.now();

  let requestUrl: string;
  let secret: string;
  try {
    requestUrl = `${getWordPressInternalBaseUrl()}/health`;
    secret = getInternalSecret();
  } catch (error) {
    return {
      status: "down",
      latencyMs: 0,
      error: error instanceof Error ? error.message : "Configuration WordPress incomplete.",
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "x-2424-internal-secret": secret,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    const latencyMs = Date.now() - startedAt;
    const payload = (await response.json().catch(() => null)) as { ok?: boolean; details?: unknown } | null;

    if (!response.ok || payload?.ok !== true) {
      return {
        status: "down",
        latencyMs,
        httpStatus: response.status,
        details: payload?.details,
        error: `WordPress a repondu ${response.status}.`,
      };
    }

    return {
      status: "up",
      latencyMs,
      httpStatus: response.status,
      details: payload.details,
    };
  } catch (error) {
    const isAbortError = error instanceof Error && error.name === "AbortError";
    return {
      status: "down",
      latencyMs: Date.now() - startedAt,
      error: isAbortError
        ? `Aucune reponse en moins de ${timeoutMs} ms.`
        : error instanceof Error
          ? error.message
          : "Echec de la sonde WordPress.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function mapEditorialGraphqlUrlToRestBaseUrl(graphqlUrl: string) {
  const normalized = graphqlUrl.trim();
  if (!normalized) {
    return getWordPressInternalBaseUrl();
  }

  try {
    const url = new URL(normalized);
    url.pathname = "/index.php";
    url.search = "rest_route=/2424/v1";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return getWordPressInternalBaseUrl();
  }
}

const getEditorialInternalBaseUrl = cache(async () => {
  try {
    const config = await getWordPressPublicSiteConfig();
    const configuredUrl = config.editorialSourceGraphqlUrl?.trim();
    if (configuredUrl) {
      return mapEditorialGraphqlUrlToRestBaseUrl(configuredUrl);
    }
  } catch {
    // Fall back below when the public site config is temporarily unavailable.
  }

  return mapEditorialGraphqlUrlToRestBaseUrl(process.env.WP_GRAPHQL_URL?.trim() || "");
});

const getEditorialWpRestBaseUrl = cache(async () => {
  try {
    const config = await getWordPressPublicSiteConfig();
    const configuredUrl = config.editorialSourceGraphqlUrl?.trim();
    if (configuredUrl) {
      return mapEditorialGraphqlUrlToWpRestBaseUrl(configuredUrl);
    }
  } catch {
    // Fall back below when the public site config endpoint is temporarily unavailable.
  }

  return mapEditorialGraphqlUrlToWpRestBaseUrl(process.env.WP_GRAPHQL_URL?.trim() || "");
});

function mapEditorialGraphqlUrlToWpRestBaseUrl(graphqlUrl: string) {
  const normalized = graphqlUrl.trim();
  if (!normalized) {
    throw new Error("Editorial GraphQL URL is not configured.");
  }

  const url = new URL(normalized);
  url.pathname = "/wp-json/wp/v2";
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function getInternalSecret() {
  const value = process.env.PLATFORM_SUBMISSIONS_SECRET;
  if (!value) {
    throw new Error("PLATFORM_SUBMISSIONS_SECRET is not configured.");
  }
  return value;
}

function getWordPressInternalRequestTimeoutMs(path?: string) {
  const raw = process.env.WORDPRESS_INTERNAL_API_TIMEOUT_MS;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  // Public reads must fail fast under backend pressure so page-level fallbacks
  // can render instead of keeping the response stream open for half a minute.
  const configuredTimeoutMs = Number.isFinite(parsed) && parsed > 0 ? parsed : 8000;

  const isPublicSubmissionRead = path?.startsWith("/submissions/public/");
  const isTransactionalAccessRead =
    path === "/auth/publishing-access-status" ||
    path === "/billing/subscription-snapshot";
  const isAuthenticationEmailRequest =
    path === "/auth/login" ||
    path === "/auth/login/resend-otp" ||
    path === "/auth/password-reset";

  // Submission writes can still be processing after a normal read timeout.
  // Public listings share the /submissions prefix but must retain the fast
  // read timeout so an overloaded WordPress instance cannot hold page render.
  if ((path?.startsWith("/submissions/") && !isPublicSubmissionRead) || isTransactionalAccessRead) {
    return Math.max(configuredTimeoutMs, 30000);
  }

  // A cold transactional-email Lambda can take a few seconds to acknowledge.
  // This margin applies only to authentication emails, never to page reads.
  if (isAuthenticationEmailRequest) {
    return Math.max(configuredTimeoutMs, 15000);
  }

  return configuredTimeoutMs;
}

function decodeHtmlEntities(value: string) {
  const decoded = value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&prime;/gi, "′")
    .replace(/&Prime;/gi, "″")
    .replace(/&#039;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&ndash;/gi, "–")
    .replace(/&mdash;/gi, "—")
    .replace(/&hellip;/gi, "…")
    .replace(/&eacute;/gi, "é")
    .replace(/&egrave;/gi, "è")
    .replace(/&ecirc;/gi, "ê")
    .replace(/&agrave;/gi, "à")
    .replace(/&acirc;/gi, "â")
    .replace(/&ccedil;/gi, "ç")
    .replace(/&ugrave;/gi, "ù")
    .replace(/&ucirc;/gi, "û")
    .replace(/&ocirc;/gi, "ô")
    .replace(/&icirc;/gi, "î")
    .replace(/&iuml;/gi, "ï")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

  const withNumericEntities = decoded
    .replace(/&#(\d+);/g, (_match, code) => {
      const parsed = Number.parseInt(code, 10);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : _match;
    })
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => {
      const parsed = Number.parseInt(code, 16);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : _match;
    });

  const withEscapedUnicode = withNumericEntities
    .replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/\\x([0-9a-fA-F]{2})/g, (_match, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/([A-Za-z])u([0-9a-fA-F]{4})/g, (_match, prefix, hex) => `${prefix}${String.fromCodePoint(Number.parseInt(hex, 16))}`);

  return fixMojibake(withEscapedUnicode);
}

type PublicCacheEnvelope<T> = {
  cachedAt: number;
  data: T;
};

const PUBLIC_WP_CACHE_TTL_SECONDS = Math.max(PUBLIC_PAGE_REVALIDATE_SECONDS, 60);
const PUBLIC_WP_CACHE_STALE_TTL_SECONDS = Math.max(PUBLIC_PAGE_REVALIDATE_SECONDS * 12, 3600);
const PUBLIC_WP_CACHE_VERSION_TTL_SECONDS = Math.max(PUBLIC_PAGE_REVALIDATE_SECONDS * 24, 86400);
const publicL1Cache = new Map<string, PublicCacheEnvelope<unknown>>();
const publicVersionL1Cache = new Map<string, { value: number; cachedAt: number }>();

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`).join(",")}}`;
}

function buildPublicWpCacheKey(scope: string, payload: unknown, version: number) {
  return `wp-public:${scope}:v${version}:${stableStringify(payload)}`;
}

function buildPublicWpVersionKey(scope: string) {
  return `wp-public-version:${scope}`;
}

async function getPublicWpScopeVersion(scope: string) {
  const l1Entry = publicVersionL1Cache.get(scope);
  if (l1Entry && Date.now() - l1Entry.cachedAt <= PUBLIC_PAGE_REVALIDATE_SECONDS * 1000) {
    return l1Entry.value;
  }

  const versionKey = buildPublicWpVersionKey(scope);
  const version = (await cacheStore.get<number>(versionKey)) ?? 1;
  publicVersionL1Cache.set(scope, {
    value: version,
    cachedAt: Date.now(),
  });
  return version;
}

async function getFreshPublicCache<T>(key: string, ttlSeconds: number) {
  const envelope = await cacheStore.get<PublicCacheEnvelope<T>>(key);
  if (!envelope) return null;

  const ageMs = Date.now() - envelope.cachedAt;
  if (ageMs > ttlSeconds * 1000) {
    return null;
  }

  return envelope.data;
}

async function getAnyPublicCache<T>(key: string) {
  const envelope = await cacheStore.get<PublicCacheEnvelope<T>>(key);
  return envelope?.data ?? null;
}

function getFreshL1PublicCache<T>(key: string, ttlSeconds: number) {
  const envelope = publicL1Cache.get(key) as PublicCacheEnvelope<T> | undefined;
  if (!envelope) return null;

  const ageMs = Date.now() - envelope.cachedAt;
  if (ageMs > ttlSeconds * 1000) {
    publicL1Cache.delete(key);
    return null;
  }

  return envelope.data;
}

function getAnyL1PublicCache<T>(key: string) {
  const envelope = publicL1Cache.get(key) as PublicCacheEnvelope<T> | undefined;
  return envelope?.data ?? null;
}

async function setPublicCache<T>(key: string, data: T) {
  const envelope: PublicCacheEnvelope<T> = {
    cachedAt: Date.now(),
    data,
  };
  publicL1Cache.set(key, envelope as PublicCacheEnvelope<unknown>);
  await cacheStore.set(key, envelope, PUBLIC_WP_CACHE_STALE_TTL_SECONDS);
}

/**
 * Requetes identiques en vol, partagees. Sans cela, N requetes concurrentes
 * sur un cache froid declenchent N appels WordPress simultanes : c'est ce qui
 * sature les workers PHP apres un redemarrage ou une invalidation massive.
 */
const publicInFlight = new Map<string, Promise<unknown>>();

async function getCachedPublicWordPressData<T>(scope: string, payload: unknown, fetcher: () => Promise<T>): Promise<T> {
  const version = await getPublicWpScopeVersion(scope);
  const cacheKey = buildPublicWpCacheKey(scope, payload, version);
  const freshL1Cache = getFreshL1PublicCache<T>(cacheKey, PUBLIC_WP_CACHE_TTL_SECONDS);
  if (freshL1Cache) {
    return freshL1Cache;
  }

  const freshCache = await getFreshPublicCache<T>(cacheKey, PUBLIC_WP_CACHE_TTL_SECONDS);
  if (freshCache) {
    publicL1Cache.set(cacheKey, {
      cachedAt: Date.now(),
      data: freshCache,
    } as PublicCacheEnvelope<unknown>);
    return freshCache;
  }

  const inFlight = publicInFlight.get(cacheKey) as Promise<T> | undefined;
  if (inFlight) {
    return inFlight;
  }

  const pending = fetchAndCachePublicWordPressData<T>(cacheKey, fetcher).finally(() => {
    publicInFlight.delete(cacheKey);
  });
  publicInFlight.set(cacheKey, pending);

  return pending;
}

async function fetchAndCachePublicWordPressData<T>(cacheKey: string, fetcher: () => Promise<T>): Promise<T> {
  try {
    const data = await fetcher();
    await setPublicCache(cacheKey, data);
    return data;
  } catch (error) {
    const staleL1Cache = getAnyL1PublicCache<T>(cacheKey);
    if (staleL1Cache) {
      return staleL1Cache;
    }
    const staleCache = await getAnyPublicCache<T>(cacheKey);
    if (staleCache) {
      publicL1Cache.set(cacheKey, {
        cachedAt: Date.now(),
        data: staleCache,
      } as PublicCacheEnvelope<unknown>);
      return staleCache;
    }
    throw error;
  }
}

function clearPublicL1CacheForScopes(scopes: string[]) {
  for (const key of Array.from(publicL1Cache.keys())) {
    if (scopes.some((scope) => key.startsWith(`wp-public:${scope}:`))) {
      publicL1Cache.delete(key);
    }
  }
}

export async function invalidatePublicWordPressCache(kind: PublicListingKind) {
  const listingScope = kind === "directory" ? "listings:directory:v3" : `listings:${kind}`;
  const taxonomyScope = kind === "directory" ? "taxonomies:directory:v2" : `taxonomies:${kind}`;
  const scopes = [listingScope, `listings-all:${kind}`, taxonomyScope];

  if (kind === "classified" || kind === "job" || kind === "tender" || kind === "directory") {
    scopes.push(`locations:${kind}`);
  }

  // Ne vider que les scopes concernes. Un clear global transforme chaque
  // webhook de revalidation en purge totale du cache du process, ce qui
  // renvoie l'integralite du trafic vers WordPress.
  clearPublicL1CacheForScopes(scopes);

  await Promise.all(
    scopes.map(async (scope) => {
      const versionKey = buildPublicWpVersionKey(scope);
      const nextVersion = await cacheStore.increment(versionKey, PUBLIC_WP_CACHE_VERSION_TTL_SECONDS);
      publicVersionL1Cache.set(scope, {
        value: nextVersion,
        cachedAt: Date.now(),
      });
    }),
  );
}

export async function invalidatePublicSiteConfigCache() {
  const scope = "site-config:v2";
  clearPublicL1CacheForScopes([scope]);

  const versionKey = buildPublicWpVersionKey(scope);
  const nextVersion = await cacheStore.increment(versionKey, PUBLIC_WP_CACHE_VERSION_TTL_SECONDS);
  publicVersionL1Cache.set(scope, {
    value: nextVersion,
    cachedAt: Date.now(),
  });
}

export async function invalidatePublicPrivacyPolicyCache() {
  const scope = "privacy-policy:v1";
  clearPublicL1CacheForScopes([scope]);

  const versionKey = buildPublicWpVersionKey(scope);
  const nextVersion = await cacheStore.increment(versionKey, PUBLIC_WP_CACHE_VERSION_TTL_SECONDS);
  publicVersionL1Cache.set(scope, {
    value: nextVersion,
    cachedAt: Date.now(),
  });
}

async function wpInternalRequest<T>(path: string, payload: unknown): Promise<T> {
  const requestUrl = `${getWordPressInternalBaseUrl()}${path}`;
  return performWordPressInternalRequest<T>(requestUrl, path, payload);
}

async function wpEditorialRequest<T>(path: string, payload: unknown): Promise<T> {
  const requestUrl = `${await getEditorialInternalBaseUrl()}${path}`;
  return performWordPressInternalRequest<T>(requestUrl, path, payload);
}

export function isWordPressPublishingTimeoutError(error: unknown) {
  return error instanceof Error && error.message === "Le service de publication met trop de temps a repondre.";
}

async function performWordPressInternalRequest<T>(requestUrl: string, path: string, payload: unknown): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = getWordPressInternalRequestTimeoutMs(path);
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-2424-internal-secret": getInternalSecret(),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    const isAbortError =
      error instanceof Error &&
      (error.name === "AbortError" || error.message.toLowerCase().includes("aborted"));
    const reason = error instanceof Error ? error.message : "unknown";
    console.error("[wordpress-internal] request failed", {
      path,
      requestUrl,
      timeoutMs,
      isAbortError,
      reason,
    });
    throw new Error(
      isAbortError
        ? "Le service de publication met trop de temps a repondre."
        : "Impossible de joindre le service de publication.",
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const body = await response.text();
    const isBestEffortNewsViewMiss =
      path === "/news/article/view" &&
      response.status === 404 &&
      body.includes('"platform_news_post_not_found"');
    if (!isBestEffortNewsViewMiss) {
      console.error("[wordpress-internal] request returned a non-ok response", {
        path,
        requestUrl,
        status: response.status,
        body,
      });
    }
    const requestError: WordPressRequestError = new Error(
      getUserFacingErrorMessage(body, "Service de publication indisponible."),
    );
    requestError.status = response.status;
    requestError.body = body;
    requestError.path = path;
    requestError.requestUrl = requestUrl;
    throw requestError;
  }
  return response.json() as Promise<T>;
}

function isMissingRestRouteError(error: unknown) {
  return (
    error instanceof Error &&
    "status" in error &&
    (error as WordPressRequestError).status === 404 &&
    typeof (error as WordPressRequestError).body === "string" &&
    ((error as WordPressRequestError).body ?? "").includes('"rest_no_route"')
  );
}

function isMissingNewsPostError(error: unknown) {
  return (
    error instanceof Error &&
    "status" in error &&
    (error as WordPressRequestError).status === 404 &&
    typeof (error as WordPressRequestError).body === "string" &&
    ((error as WordPressRequestError).body ?? "").includes('"platform_news_post_not_found"')
  );
}

async function editorialWpRestRequest(path: string, init?: RequestInit) {
  const requestUrl = `${await getEditorialWpRestBaseUrl()}${path}`;
  const controller = new AbortController();
  const timeoutMs = getWordPressInternalRequestTimeoutMs();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(requestUrl, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function resolveEditorialNewsPost(payload: { slug?: string; postId?: number }) {
  if (typeof payload.postId === "number" && payload.postId > 0) {
    const response = await editorialWpRestRequest(`/posts/${payload.postId}?_fields=id,slug,comment_status`);
    if (response.ok) {
      const post = (await response.json()) as { id: number; slug: string; comment_status?: string };
      return {
        postId: post.id,
        slug: post.slug,
        commentsOpen: post.comment_status !== "closed",
      };
    }
  }

  const slug = typeof payload.slug === "string" ? payload.slug.trim() : "";
  if (!slug) {
    throw new Error("Article introuvable.");
  }

  const response = await editorialWpRestRequest(
    `/posts?slug=${encodeURIComponent(slug)}&_fields=id,slug,comment_status&per_page=1`,
  );
  const items = (await response.json()) as Array<{ id: number; slug: string; comment_status?: string }>;
  const post = items[0];

  if (!post) {
    throw new Error("Article introuvable.");
  }

  return {
    postId: post.id,
    slug: post.slug,
    commentsOpen: post.comment_status !== "closed",
  };
}

export async function syncWordPressUser(payload: AuthSyncPayload) {
  return wpInternalRequest<{
    wpUserId: number;
    email: string;
    displayName: string;
    role: string;
    username?: string;
    platformUsername?: string;
    onboardingCompleted?: boolean;
    emailVerified?: boolean;
  }>("/auth/sync-user", payload);
}

export async function checkWordPressAuthAvailability(payload: AvailabilityPayload) {
  return wpInternalRequest<AvailabilityResult>("/auth/availability", payload);
}

export async function registerWordPressUser(payload: RegisterPayload) {
  return wpInternalRequest<RegisterResult>("/auth/register", payload);
}

export async function loginWordPressUser(payload: LoginPayload) {
  return wpInternalRequest<WordPressLoginOtpChallenge>("/auth/login", payload);
}

export async function verifyWordPressLoginOtp(payload: LoginOtpVerifyPayload) {
  return wpInternalRequest<WordPressLoginVerifyResult>("/auth/login/verify-otp", payload);
}

export async function resendWordPressLoginOtp(payload: LoginOtpResendPayload) {
  return wpInternalRequest<WordPressLoginOtpChallenge>("/auth/login/resend-otp", payload);
}

export async function requestWordPressPasswordReset(payload: PasswordResetPayload) {
  return wpInternalRequest<{ ok: boolean; message: string }>("/auth/password-reset", payload);
}

export async function confirmWordPressPasswordReset(payload: PasswordResetConfirmPayload) {
  return wpInternalRequest<{ ok: boolean; message: string }>("/auth/password-reset/confirm", payload);
}

export async function changeWordPressPassword(payload: PasswordChangePayload) {
  return wpInternalRequest<{ ok: boolean; message: string }>("/auth/password/change", payload);
}

export async function requestWordPressAccountDeletionCode(payload: AccountDeletionCodePayload) {
  return wpInternalRequest<{ ok: true; challengeId: string; expiresInSeconds: number; email: string }>(
    "/auth/account-deletion/request-code",
    payload,
  );
}

export async function deleteWordPressAccount(payload: DeleteWordPressAccountPayload) {
  return wpInternalRequest<{ ok: true; message: string }>("/auth/account-deletion", payload);
}

export async function sendWordPressEmailVerification(payload: EmailVerificationSendPayload) {
  return wpInternalRequest<{ ok: boolean; message?: string; emailSent?: boolean; alreadyVerified?: boolean }>(
    "/auth/email-verification/send",
    payload,
  );
}

export async function confirmWordPressEmailVerification(payload: EmailVerificationConfirmPayload) {
  return wpInternalRequest<{ ok: boolean; emailVerified: boolean; user?: WordPressAuthUser; message?: string }>(
    "/auth/email-verification/confirm",
    payload,
  );
}

export async function getWordPressUserProfile(payload: UserProfilePayload) {
  return wpInternalRequest<WordPressUserProfile>("/auth/profile", payload);
}

export async function updateWordPressUserProfile(payload: UpdateUserProfilePayload) {
  return wpInternalRequest<WordPressUserProfile>("/auth/profile/update", payload);
}

export async function updateWordPressUserProfilePhoto(payload: UpdateUserProfilePhotoPayload) {
  return wpInternalRequest<WordPressUserProfile>("/auth/profile/photo", payload);
}

export async function getWordPressNotificationPreference(payload: NotificationPreferencePayload) {
  return wpInternalRequest<NotificationPreferenceResult>("/auth/notification-preferences", payload);
}

export async function updateWordPressNotificationPreference(payload: UpdateNotificationPreferencePayload) {
  return wpInternalRequest<NotificationPreferenceResult>("/auth/notification-preferences/update", payload);
}

export async function getWordPressEmailDispatcherConfig() {
  return wpInternalRequest<EmailDispatcherConfigResult>("/auth/email-dispatcher-config", {});
}

export async function getWordPressWebPushConfig() {
  return wpInternalRequest<WordPressWebPushConfigResult>("/auth/web-push-config", {});
}

/**
 * Configuration quasi statique, mais demandee plusieurs fois par page (header,
 * footer, contexte AdSense) et par chaque resolution de source editoriale.
 * Sans cache elle represente a elle seule l'essentiel des appels WordPress.
 */
export async function getWordPressPublicSiteConfig() {
  return getCachedPublicWordPressData(
    "site-config:v2",
    {},
    () => wpInternalRequest<WordPressPublicSiteConfigResult>("/auth/public-site-config", {}),
  );
}

export async function getWordPressPrivacyPolicy() {
  return getCachedPublicWordPressData(
    "privacy-policy:v1",
    {},
    () => wpInternalRequest<WordPressPrivacyPolicyResult>("/auth/public-privacy-policy", {}),
  );
}

export async function getWordPressPublishingAccessStatus(payload: { wpUserId: number }) {
  return wpInternalRequest<PublishingAccessStatusResult>("/auth/publishing-access-status", payload);
}

export async function submitToWordPress(kind: SubmissionKind, payload: SubmissionPayload) {
  return wpInternalRequest<{
    id: number;
    postType: string;
    status: string;
    editLink?: string;
    finalizationStatus?: "processing" | "retrying" | "ready" | "failed";
    recovered?: boolean;
  }>(`/submissions/${kind}`, payload);
}

export async function getWordPressUserWorkspaceItems(
  kind: "classified" | "tender" | "article" | "job",
  payload: UserWorkspaceItemsPayload,
) {
  const result = await wpInternalRequest<UserWorkspaceItemsResult>(`/submissions/${kind}/mine`, payload);
  return {
    ...result,
    title: decodeHtmlEntities(result.title),
    items: result.items.map((item) => ({
      ...item,
      title: decodeHtmlEntities(item.title),
      description: decodeHtmlEntities(item.description),
      content: item.content ? decodeHtmlEntities(item.content) : item.content,
      meta: decodeHtmlEntities(item.meta),
      location: item.location ? decodeHtmlEntities(item.location) : item.location,
      category: item.category ? decodeHtmlEntities(item.category) : item.category,
      productTag: item.productTag ? decodeHtmlEntities(item.productTag) : item.productTag,
      type: item.type ? decodeHtmlEntities(item.type) : item.type,
      companyName: item.companyName ? decodeHtmlEntities(item.companyName) : item.companyName,
      profilePhoto: item.profilePhoto ? decodeHtmlEntities(item.profilePhoto) : item.profilePhoto,
      companyLogo: item.companyLogo ? decodeHtmlEntities(item.companyLogo) : item.companyLogo,
      skills: Array.isArray(item.skills) ? item.skills.map((skill) => decodeHtmlEntities(skill)) : item.skills,
      experienceYears: item.experienceYears ? decodeHtmlEntities(item.experienceYears) : item.experienceYears,
      needBy: item.needBy ? decodeHtmlEntities(item.needBy) : item.needBy,
      price: item.price ? decodeHtmlEntities(item.price) : item.price,
      budget: item.budget ? decodeHtmlEntities(item.budget) : item.budget,
      detailsPdfUrl: item.detailsPdfUrl ? decodeHtmlEntities(item.detailsPdfUrl) : item.detailsPdfUrl,
      detailsPdfName: item.detailsPdfName ? decodeHtmlEntities(item.detailsPdfName) : item.detailsPdfName,
      currency: item.currency ? decodeHtmlEntities(item.currency) : item.currency,
    })),
  };
}

export async function getWordPressUserWorkspaceItem(
  kind: "classified" | "tender" | "job",
  payload: UserWorkspaceItemsPayload & { listingId: number },
) {
  return wpInternalRequest<{ item: UserWorkspaceItemsResult["items"][number] }>(
    `/submissions/${kind}/mine/${payload.listingId}`,
    payload,
  );
}

export async function getWordPressPublicListings(kind: PublicListingKind, payload: PublicListingsPayload) {
  const listingScope = kind === "directory" ? "listings:directory:v3" : `listings:${kind}`;
  const result = await getCachedPublicWordPressData(
    listingScope,
    payload,
    () => wpInternalRequest<PublicListingsResult>(`/submissions/public/${kind}`, payload),
  );
  return {
    ...result,
    items: result.items.map((item) => ({
      ...item,
      title: decodeHtmlEntities(item.title),
      description: decodeHtmlEntities(item.description),
      excerpt: item.excerpt ? decodeHtmlEntities(item.excerpt) : item.excerpt,
      content: decodeHtmlEntities(item.content),
      location: decodeHtmlEntities(item.location),
      city: item.city ? decodeHtmlEntities(item.city) : item.city,
      area: item.area ? decodeHtmlEntities(item.area) : item.area,
      category: decodeHtmlEntities(item.category),
      productTag: item.productTag ? decodeHtmlEntities(item.productTag) : item.productTag,
      condition: item.condition ? decodeHtmlEntities(item.condition) : item.condition,
      regions: Array.isArray(item.regions) ? item.regions.map((region) => decodeHtmlEntities(region)) : item.regions,
      cities: Array.isArray(item.cities) ? item.cities.map((city) => decodeHtmlEntities(city)) : item.cities,
      type: item.type ? decodeHtmlEntities(item.type) : item.type,
      companyName: item.companyName ? decodeHtmlEntities(item.companyName) : item.companyName,
      website: item.website ? decodeHtmlEntities(item.website) : item.website,
      publisherName: item.publisherName ? decodeHtmlEntities(item.publisherName) : item.publisherName,
      budget: item.budget ? decodeHtmlEntities(item.budget) : item.budget,
      detailsPdfUrl: item.detailsPdfUrl ? decodeHtmlEntities(item.detailsPdfUrl) : item.detailsPdfUrl,
      detailsPdfName: item.detailsPdfName ? decodeHtmlEntities(item.detailsPdfName) : item.detailsPdfName,
      skills: Array.isArray(item.skills) ? item.skills.map((skill) => decodeHtmlEntities(skill)) : item.skills,
      experienceYears: item.experienceYears ? decodeHtmlEntities(item.experienceYears) : item.experienceYears,
      needBy: item.needBy ? decodeHtmlEntities(item.needBy) : item.needBy,
      deadline: item.deadline ? decodeHtmlEntities(item.deadline) : item.deadline,
      price: item.price ? decodeHtmlEntities(item.price) : item.price,
      currency: item.currency ? decodeHtmlEntities(item.currency) : item.currency,
      viewCount: Number.isFinite(Number(item.viewCount)) ? Number(item.viewCount) : undefined,
      ownerRatingAverage: Number.isFinite(Number(item.ownerRatingAverage)) ? Number(item.ownerRatingAverage) : undefined,
      ownerRatingCount: Number.isFinite(Number(item.ownerRatingCount)) ? Number(item.ownerRatingCount) : undefined,
      isAdminCreated: Boolean(item.isAdminCreated),
    })),
  };
}

export async function getWordPressSitemapListings(
  kind: Extract<PublicListingKind, "classified" | "job" | "tender">,
  payload: { page: number; perPage?: number },
) {
  return getCachedPublicWordPressData(
    `seo-sitemap:${kind}`,
    payload,
    () => wpInternalRequest<SitemapListingsResult>(`/seo/sitemap/${kind}`, payload),
  );
}

export async function searchWordPressTypesense(query: string) {
  return wpInternalRequest<WordPressTypesenseSearchResult>("/search/typesense", { q: query });
}

export async function incrementWordPressPublicListingView(payload: {
  kind: Extract<PublicListingKind, "classified" | "job" | "tender">;
  id: number;
}) {
  return wpInternalRequest<{
    ok: boolean;
    id: number;
    kind: "classified" | "job" | "tender";
    counted: boolean;
  }>("/submissions/public/view", payload);
}

export async function incrementWordPressNewsArticleView(payload: { slug?: string; postId?: number }) {
  try {
    return await wpEditorialRequest<{
      ok: boolean;
      postId: number;
      slug: string;
      counted: boolean;
    }>("/news/article/view", payload);
  } catch (error) {
    if (isMissingNewsPostError(error)) {
      return {
        ok: true,
        postId: payload.postId ?? 0,
        slug: payload.slug ?? "",
        counted: false,
      };
    }
    if (!isMissingRestRouteError(error)) {
      throw error;
    }

    try {
      return await wpInternalRequest<{
        ok: boolean;
        postId: number;
        slug: string;
        counted: boolean;
      }>("/news/article/view", payload);
    } catch (internalError) {
      if (!isMissingRestRouteError(internalError)) {
        throw internalError;
      }

      const post = await resolveEditorialNewsPost(payload);
      return {
        ok: true,
        postId: post.postId,
        slug: post.slug,
        counted: false,
      };
    }
  }
}

export async function getWordPressNewsArticleComments(payload: { slug?: string; postId?: number }) {
  return wpInternalRequest<NewsArticleCommentsResult>("/news/article/comments", payload);
}

export async function createWordPressNewsArticleComment(payload: {
  slug?: string;
  postId?: number;
  wpUserId: number;
  email: string;
  authorName: string;
  content: string;
}) {
  return wpInternalRequest<{
    ok: boolean;
    approved: boolean;
    commentId: number;
    commentCount: number;
    commentsOpen: boolean;
    message: string;
    item?: NewsArticleCommentItem;
  }>("/news/article/comments/create", payload);
}

export async function getWordPressPublicAds(placement: PublicAdPlacement, feature?: PublicAdFeature) {
  const result = await wpInternalRequest<PublicAdsResult>("/ads/public", {
    placement,
    ...(feature ? { feature } : {}),
  });

  return {
    placement: result.placement,
    feature: result.feature || feature || "all",
    items: result.items
      .map((item) => ({
        ...item,
        title: decodeHtmlEntities(item.title || ""),
        description: decodeHtmlEntities(item.description || ""),
        imageUrl: typeof item.imageUrl === "string" ? item.imageUrl.trim() : "",
        linkUrl: item.linkUrl ? item.linkUrl.trim() : "",
        ctaLabel: item.ctaLabel ? decodeHtmlEntities(item.ctaLabel) : "",
        altText: item.altText ? decodeHtmlEntities(item.altText) : "",
        feature: item.feature || feature || "all",
        position: Math.max(1, Number(item.position || 1)),
        placement,
      })),
  };
}

export type AdSlotContentType = "image" | "adsense" | "gam" | "script";

export type ResolvedAdItem = {
  id: number;
  type: AdSlotContentType;
  fallbackType: AdSlotContentType | "";
  title: string;
  advertiser: string;
  feature: PublicAdFeature;
  position: number;
  image?: { desktop: string; tablet: string; mobile: string };
  /** Dimensions du visuel, saisies dans le gestionnaire. Priment sur le format par défaut de l'emplacement. */
  format?: { width: number; height: number };
  linkUrl?: string;
  altText?: string;
  ctaLabel?: string;
  adsenseSlotId?: string;
  gamAdUnitPath?: string;
  scriptCode?: string;
};

export type ResolvedAdSlot = {
  key: string;
  label: string;
  format: string;
  rotation: boolean;
  items: ResolvedAdItem[];
};

export type ResolvedAdSlots = Record<string, ResolvedAdSlot>;

/**
 * Resout plusieurs emplacements en un seul appel WordPress. C'est le
 * gestionnaire de publicites qui decide du contenu : le frontend ne fournit que
 * les cles des positions qu'il sait rendre.
 */
export async function getWordPressAdSlots(slots: string[], feature: PublicAdFeature = "all") {
  const payload = { slots, feature };

  return getCachedPublicWordPressData("ad-slots", payload, () =>
    wpInternalRequest<{ feature: PublicAdFeature; slots: ResolvedAdSlots }>("/ads/public", payload),
  );
}

/**
 * Purge la resolution des emplacements. Le cache public a une duree de vie de
 * cinq minutes : sans cette invalidation, une publicite qu'on vient de
 * configurer n'apparait pas tout de suite, ce qui donne l'impression qu'elle ne
 * fonctionne pas.
 */
export async function invalidateAdSlotsCache() {
  clearPublicL1CacheForScopes(["ad-slots"]);

  const versionKey = buildPublicWpVersionKey("ad-slots");
  const nextVersion = await cacheStore.increment(versionKey, PUBLIC_WP_CACHE_VERSION_TTL_SECONDS);
  publicVersionL1Cache.set("ad-slots", { value: nextVersion, cachedAt: Date.now() });
}

const ALL_LISTINGS_PAGE_SIZE = 50;
const ALL_LISTINGS_MAX_PAGES = 40;
const ALL_LISTINGS_FETCH_CONCURRENCY = 2;

/**
 * Recupere l'integralite d'un listing en suivant sa pagination.
 *
 * L'endpoint WordPress plafonne `perPage` a 50 et reconstruit l'ensemble du
 * jeu de donnees a chaque appel. Les pages suivantes sont lues par petites
 * vagues pour raccourcir un cache froid sans surcharger les workers PHP.
 */
export async function getWordPressAllPublicListings(kind: PublicListingKind) {
  return getCachedPublicWordPressData(`listings-all:${kind}`, {}, async () => {
    const firstPage = await getWordPressPublicListings(kind, { page: 1, perPage: ALL_LISTINGS_PAGE_SIZE });
    const items = [...firstPage.items];
    const totalPages = Math.min(firstPage.pagination.totalPages, ALL_LISTINGS_MAX_PAGES);

    if (firstPage.pagination.totalPages > ALL_LISTINGS_MAX_PAGES) {
      console.warn("[wordpress-internal] pagination tronquee", {
        kind,
        totalPages: firstPage.pagination.totalPages,
        maxPages: ALL_LISTINGS_MAX_PAGES,
      });
    }

    for (let firstPageNumber = 2; firstPageNumber <= totalPages; firstPageNumber += ALL_LISTINGS_FETCH_CONCURRENCY) {
      const pageNumbers = Array.from(
        { length: Math.min(ALL_LISTINGS_FETCH_CONCURRENCY, totalPages - firstPageNumber + 1) },
        (_, index) => firstPageNumber + index,
      );
      const pages = await Promise.all(
        pageNumbers.map((page) => getWordPressPublicListings(kind, { page, perPage: ALL_LISTINGS_PAGE_SIZE })),
      );
      pages.forEach((page) => items.push(...page.items));
    }

    return items;
  });
}

export async function getWordPressTaxonomyTerms(kind: PublicListingKind) {
  const result = await getCachedPublicWordPressData(
    kind === "directory" ? "taxonomies:directory:v2" : `taxonomies:${kind}`,
    {},
    () => wpInternalRequest<TaxonomyTermsResult>(`/taxonomies/${kind}/terms`, {}),
  );
  return {
    terms: result.terms.map((term) => ({
      ...term,
      name: decodeHtmlEntities(term.name),
      slug: decodeHtmlEntities(term.slug),
      parentName: term.parentName ? decodeHtmlEntities(term.parentName) : term.parentName,
      parentSlug: term.parentSlug ? decodeHtmlEntities(term.parentSlug) : term.parentSlug,
      productTagNames: Array.isArray(term.productTagNames) ? term.productTagNames.map((value) => decodeHtmlEntities(value)) : term.productTagNames,
      productTagSlugs: Array.isArray(term.productTagSlugs) ? term.productTagSlugs.map((value) => decodeHtmlEntities(value)) : term.productTagSlugs,
    })),
    productTags: Array.isArray(result.productTags)
      ? result.productTags.map((term) => ({
          ...term,
          name: decodeHtmlEntities(term.name),
          slug: decodeHtmlEntities(term.slug),
          parentName: term.parentName ? decodeHtmlEntities(term.parentName) : term.parentName,
          parentSlug: term.parentSlug ? decodeHtmlEntities(term.parentSlug) : term.parentSlug,
        }))
      : [],
  };
}

export type TanyoraBook = {
  id: number;
  slug: string;
  title: string;
  author: string;
  isbn: string;
  summary: string;
  description: string;
  coverUrl: string;
  format: "digital" | "physical";
  price: string;
  currency: string;
};

export type TanyoraBooksResult = {
  items: TanyoraBook[];
  pagination: { page: number; perPage: number; total: number; totalPages: number };
};

export async function getTanyoraBooks(page = 1) {
  return wpInternalRequest<TanyoraBooksResult>("/shop/books", { page, perPage: 12 });
}

export async function getTanyoraBook(slug: string) {
  return wpInternalRequest<{ item: TanyoraBook | null }>("/shop/books", { slug });
}

export async function getWordPressLocationTerms(kind: Extract<PublicListingKind, "classified" | "job" | "tender" | "directory">) {
  const result = await getCachedPublicWordPressData(
    `locations:${kind}`,
    {},
    () => wpInternalRequest<{ terms: TaxonomyTermResult[] }>(`/taxonomies/${kind}/locations`, {}),
  );
  return {
    terms: dedupeTaxonomyTermsByHierarchy(
      result.terms.map((term) => ({
        ...term,
        name: decodeHtmlEntities(term.name),
        slug: decodeHtmlEntities(term.slug),
        parentName: term.parentName ? decodeHtmlEntities(term.parentName) : term.parentName,
        parentSlug: term.parentSlug ? decodeHtmlEntities(term.parentSlug) : term.parentSlug,
      })),
    ),
  };
}

export async function getWordPressPricingCatalog() {
  return wpInternalRequest<PricingCatalogResult>("/pricing/catalog", {});
}

export async function getWordPressListingFormConfig(
  kind: Extract<PublicListingKind, "classified" | "job" | "tender">,
  options: { categoryId?: number; cityId?: number } = {},
) {
  return wpInternalRequest<ListingFormConfigResult>(`/submissions/${kind}/form-config`, {
    categoryId: options.categoryId || undefined,
    cityId: options.cityId || undefined,
  });
}

export async function getWordPressSubscriptionPricingConfig() {
  return wpInternalRequest<import("@/types/subscriptions").SubscriptionPricingConfigResult>("/billing/subscription-pricing", {});
}

export async function activateWordPressStagingSubscriptionBypass(payload: {
  wpUserId: number;
  planId: Exclude<import("@/types/subscriptions").SubscriptionPlanId, "free">;
  billingPeriod: import("@/types/subscriptions").BillingPeriod;
}) {
  return wpInternalRequest<{
    ok: true;
    planId: import("@/types/subscriptions").SubscriptionPlanId;
    billingPeriod: import("@/types/subscriptions").BillingPeriod;
    startedAt: string;
    renewsAt: string;
  }>("/billing/subscription/staging-bypass", payload);
}

export async function getWordPressListingPayableQuote(payload: ListingPayableQuotePayload) {
  return wpInternalRequest<ListingPayableQuoteResult>("/submissions/listing/payable", payload);
}

export async function useWordPressAllPrivilegesListingAccess(payload: UseAllPrivilegesListingAccessPayload) {
  return wpInternalRequest<UseAllPrivilegesListingAccessResult>("/submissions/listing/use-all-privileges", payload);
}

export async function markWordPressListingPaid(payload: MarkListingPaidPayload) {
  return wpInternalRequest<MarkListingPaidResult>("/submissions/listing/mark-paid", payload);
}

export async function useWordPressIncludedListingAccess(payload: UseIncludedListingAccessPayload) {
  return wpInternalRequest<UseIncludedListingAccessResult>("/submissions/listing/use-included-access", payload);
}

export async function getWordPressClassifiedPayableQuote(payload: ListingPayableQuotePayload) {
  return getWordPressListingPayableQuote(payload);
}

export async function markWordPressClassifiedPaid(payload: MarkListingPaidPayload) {
  return markWordPressListingPaid(payload);
}

export async function updateWordPressClassified(payload: UpdateClassifiedPayload) {
  return wpInternalRequest<{
    id: number;
    status: "updated";
    cleanedMediaUrls?: string[];
    queuedMediaUrls?: string[];
    mediaCleanupActionIds?: number[];
  }>("/submissions/classified/update", payload);
}

export async function deleteWordPressClassified(payload: DeleteClassifiedPayload) {
  return wpInternalRequest<{
    id: number;
    status: "deleted";
    alreadyDeleted?: boolean;
    cleanedMediaUrls?: string[];
    queuedMediaUrls?: string[];
    mediaCleanupActionIds?: number[];
  }>("/submissions/classified/delete", payload);
}

export async function getWordPressClassifiedFinalizationStatus(payload: { wpUserId: number; listingId: number }) {
  return wpInternalRequest<{
    listingId: number;
    finalizationStatus: "processing" | "retrying" | "ready" | "failed";
    updatedAt?: string;
    message?: string;
  }>("/submissions/classified/finalization-status", payload);
}

export async function updateWordPressJob(payload: UpdateJobPayload) {
  return wpInternalRequest<{ id: number; status: "updated" }>("/submissions/job/update", payload);
}

export async function deleteWordPressJob(payload: DeleteJobPayload) {
  return wpInternalRequest<{ id: number; status: "deleted"; alreadyDeleted?: boolean }>("/submissions/job/delete", payload);
}

export async function updateWordPressTender(payload: UpdateTenderPayload) {
  return wpInternalRequest<{ id: number; status: "updated" }>("/submissions/tender/update", payload);
}

export async function deleteWordPressTender(payload: DeleteTenderPayload) {
  return wpInternalRequest<{ id: number; status: "deleted"; alreadyDeleted?: boolean }>("/submissions/tender/delete", payload);
}

export async function updateWordPressClassifiedStatus(payload: UpdateSubmissionStatusPayload) {
  return wpInternalRequest<{ id: number; status: "draft"; postStatus: string; expiresAt?: string; isExpired?: boolean }>(
    "/submissions/classified/status",
    payload,
  );
}

export async function updateWordPressJobStatus(payload: UpdateSubmissionStatusPayload) {
  return wpInternalRequest<{ id: number; status: "draft"; postStatus: string; expiresAt?: string; isExpired?: boolean }>(
    "/submissions/job/status",
    payload,
  );
}

export async function updateWordPressTenderStatus(payload: UpdateSubmissionStatusPayload) {
  return wpInternalRequest<{ id: number; status: "draft"; postStatus: string; expiresAt?: string; isExpired?: boolean }>(
    "/submissions/tender/status",
    payload,
  );
}

export async function upsertWordPressUserRating(payload: UpsertUserRatingPayload) {
  return wpInternalRequest<{ ratingId: number; sellerUserId: number; score: number; average: number; count: number }>(
    "/ratings/user/upsert",
    payload,
  );
}

export async function getWordPressUserRatingSummary(payload: UserRatingSummaryPayload) {
  return wpInternalRequest<{ average: number; count: number }>("/ratings/user/summary", payload);
}

export async function getWordPressCurrentUserRating(payload: {
  sellerUserId: number;
  raterUserId: number;
  listingId: number;
}) {
  return wpInternalRequest<{ hasRated: boolean; ratingId: number; score: number }>("/ratings/user/current", payload);
}

export async function getWooCommerceSubscriptionSnapshot(payload: SubscriptionSnapshotPayload) {
  return wpInternalRequest<import("@/types/subscriptions").UserSubscriptionSnapshot>("/billing/subscription-snapshot", payload);
}

export async function getWooCommerceBillingHistory(payload: BillingHistoryPayload) {
  return wpInternalRequest<import("@/types/subscriptions").BillingHistoryItem[]>("/billing/history", payload);
}

export async function syncStripeSubscriptionInWordPress(payload: SyncStripeSubscriptionPayload) {
  return wpInternalRequest<{
    orderId: number | null;
    subscriptionId: number | null;
    planId: import("@/types/subscriptions").SubscriptionPlanId;
    status: string;
  }>("/billing/stripe/sync", payload);
}

export async function saveStripeCustomerIdInWordPress(payload: SaveStripeCustomerPayload) {
  return wpInternalRequest<{
    ok: true;
    stripeCustomerId: string;
  }>("/billing/stripe/customer", payload);
}

export async function startMvolaSubscriptionInWordPress(payload: StartMvolaSubscriptionPayload) {
  return wpInternalRequest<StartMvolaCheckoutResult>("/billing/mvola/subscription/start", payload);
}

export async function startMvolaListingInWordPress(payload: StartMvolaListingPayload) {
  return wpInternalRequest<StartMvolaCheckoutResult>("/billing/mvola/listing/start", payload);
}

export async function getMvolaStatusFromWordPress(payload: GetMvolaStatusPayload) {
  return wpInternalRequest<MvolaStatusResult>("/billing/mvola/status", payload);
}

export async function relayMvolaCallbackToWordPress(payload: RelayMvolaCallbackPayload) {
  return wpInternalRequest<Record<string, unknown>>("/billing/mvola/callback", payload);
}


export async function getPapiStatusFromWordPress(payload: GetPapiStatusPayload) {
  return wpInternalRequest<{ orderId: number; status?: string; ok?: boolean; alreadyPaid?: boolean; planId?: import("@/types/subscriptions").SubscriptionPlanId; listingId?: number; paymentStatus?: string }>("/billing/papi/status", payload);
}

export async function retryPapiPaymentInWordPress(payload: GetPapiStatusPayload) {
  return wpInternalRequest<{ orderId: number; orderKey: string; checkoutUrl: string }>("/billing/papi/retry", payload);
}

export async function downgradeWordPressSubscriptionToFree(payload: DowngradeToFreePayload) {
  return wpInternalRequest<{
    ok: true;
    planId: "free";
    status: "none";
    cancelledSubscriptionIds: number[];
  }>("/billing/subscription/downgrade", payload);
}
import { fixMojibake } from "@/lib/text/mojibake";

export async function startPapiPaymentInWordPress(payload: Record<string, unknown>) {
  return wpInternalRequest<{ orderId?: number; orderKey?: string; checkoutUrl?: string; activated?: boolean; planId?: "essentiel" | "business" }>("/billing/papi/start", payload);
}
