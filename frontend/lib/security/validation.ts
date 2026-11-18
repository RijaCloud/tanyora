import { z } from "zod";
import { extractPlainTextFromListingHtml } from "@/lib/content/listing-html";
import { MESSAGE_ATTACHMENT_MAX_TOTAL_BYTES, MESSAGE_ATTACHMENT_MIME_TYPES } from "@/lib/messages/attachments";
import { extractMessagePlainText } from "@/lib/messages/message-content";

const cleanString = z.string().trim();
function createRichListingContentSchema(maxPlainTextLength: number) {
  return cleanString
    .min(1)
    .max(12000)
    .refine((value) => {
      const plainText = extractPlainTextFromListingHtml(value);
      return plainText.length >= 80 && plainText.length <= maxPlainTextLength;
    }, "Description invalide.");
}

function createRichListingContentSchemaWithMinLength(minPlainTextLength: number, maxPlainTextLength: number) {
  return cleanString
    .min(1)
    .max(12000)
    .refine((value) => {
      const plainText = extractPlainTextFromListingHtml(value);
      return plainText.length >= minPlainTextLength && plainText.length <= maxPlainTextLength;
    }, "Description invalide.");
}

const classifiedRichListingContentSchema = createRichListingContentSchemaWithMinLength(30, 1500);
const extendedRichListingContentSchema = createRichListingContentSchema(5000);

const optionalShortText = cleanString.max(140).optional();
const optionalMediumText = cleanString.max(240).optional();
const optionalLocationArea = cleanString.max(120).optional();
const listingCurrencySchema = z.enum(["MGA", "EUR", "USD"]).optional();

const priceValueSchema = cleanString
  .regex(/^\d{1,12}$/, "Prix invalide.")
  .refine((value: string) => Number.parseInt(value, 10) > 0, "Prix invalide.");

const phoneCountrySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/)
  .or(z.literal(""))
  .optional()
  .transform((value) => (value ? value : undefined));

const imageUrlSchema = z
  .union([z.string().url(), z.literal("")])
  .transform((value) => value.trim())
  .optional();

const pdfUrlSchema = z
  .union([z.string().url(), z.literal("")])
  .transform((value) => value.trim())
  .optional();

const galleryImageUrlsSchema = z
  .array(z.string().url())
  .optional()
  .transform((value) => value ?? []);

function normalizeSkillsInput(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry || "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

export const JOB_SKILL_MAX_LENGTH = 40;

const jobSkillsSchema = z
  .preprocess(
    normalizeSkillsInput,
    z.array(cleanString.min(1).max(JOB_SKILL_MAX_LENGTH, `Chaque compétence ne peut pas dépasser ${JOB_SKILL_MAX_LENGTH} caractères.`))
      .max(5, "Vous pouvez ajouter au maximum 5 compétences."),
  )
  .optional()
  .transform((value) => value ?? []);

export const classifiedCreateSchema = z.object({
  title: cleanString.min(3).max(40),
  content: classifiedRichListingContentSchema,
  excerpt: optionalMediumText,
  category: optionalShortText,
  productTag: optionalShortText,
  type: optionalShortText,
  companyName: optionalShortText,
  location: cleanString.max(140).optional(),
  city: cleanString.min(2).max(120),
  area: optionalLocationArea,
  condition: optionalShortText,
  price: priceValueSchema,
  currency: listingCurrencySchema,
  contactPhone: cleanString.min(6).max(30).optional(),
  contactPhoneCountry: phoneCountrySchema,
  featuredImageUrl: imageUrlSchema,
  galleryImageUrls: galleryImageUrlsSchema,
});

export const classifiedUpdateSchema = z.object({
  title: cleanString.min(3).max(40),
  content: classifiedRichListingContentSchema,
  excerpt: optionalMediumText,
  category: optionalShortText,
  productTag: optionalShortText,
  type: optionalShortText,
  companyName: optionalShortText,
  location: cleanString.max(140).optional(),
  city: cleanString.min(2).max(120),
  area: optionalLocationArea,
  condition: optionalShortText,
  price: priceValueSchema.optional(),
  currency: listingCurrencySchema,
  contactPhone: cleanString.min(6).max(30).optional(),
  contactPhoneCountry: phoneCountrySchema,
  featuredImageUrl: imageUrlSchema,
  galleryImageUrls: galleryImageUrlsSchema,
});

export const jobCreateSchema = z.object({
  title: cleanString.min(3).max(160),
  content: extendedRichListingContentSchema,
  excerpt: optionalMediumText,
  category: optionalShortText,
  type: optionalShortText,
  companyName: optionalShortText,
  location: cleanString.max(140).optional(),
  city: cleanString.min(2).max(120),
  area: optionalLocationArea,
  skills: jobSkillsSchema,
  experienceYears: cleanString.max(40).optional(),
  needBy: cleanString.max(40).optional(),
  deadline: cleanString.max(40).optional(),
  contactPhone: cleanString.min(6).max(30).optional(),
  contactPhoneCountry: phoneCountrySchema,
  contactEmail: z.string().trim().email().optional(),
  featuredImageUrl: imageUrlSchema,
});

export const jobUpdateSchema = z.object({
  title: cleanString.min(3).max(160),
  content: extendedRichListingContentSchema,
  excerpt: optionalMediumText,
  category: optionalShortText,
  type: optionalShortText,
  companyName: optionalShortText,
  location: cleanString.max(140).optional(),
  city: cleanString.min(2).max(120),
  area: optionalLocationArea,
  skills: jobSkillsSchema,
  experienceYears: cleanString.max(40).optional(),
  needBy: cleanString.max(40).optional(),
  deadline: cleanString.max(40).optional(),
  contactPhone: cleanString.min(6).max(30).optional(),
  contactPhoneCountry: phoneCountrySchema,
  contactEmail: z.string().trim().email().optional(),
  featuredImageUrl: imageUrlSchema,
});

export const tenderCreateSchema = z.object({
  title: cleanString.min(3).max(160),
  content: extendedRichListingContentSchema,
  excerpt: optionalMediumText,
  category: optionalShortText,
  type: optionalShortText,
  companyName: optionalShortText,
  location: cleanString.min(2).max(140),
  deadline: cleanString.max(40).optional(),
  budget: cleanString.min(1).max(30).optional(),
  currency: listingCurrencySchema,
  detailsPdfUrl: pdfUrlSchema,
  detailsPdfName: optionalMediumText,
  contactPhone: cleanString.min(6).max(30).optional(),
  contactPhoneCountry: phoneCountrySchema,
  contactEmail: z.string().trim().email().optional(),
  featuredImageUrl: imageUrlSchema,
});

export const tenderUpdateSchema = z.object({
  title: cleanString.min(3).max(160),
  content: extendedRichListingContentSchema,
  excerpt: optionalMediumText,
  category: optionalShortText,
  type: optionalShortText,
  companyName: optionalShortText,
  location: cleanString.min(2).max(140),
  deadline: cleanString.max(40).optional(),
  budget: cleanString.min(1).max(30).optional(),
  currency: listingCurrencySchema,
  detailsPdfUrl: pdfUrlSchema,
  detailsPdfName: optionalMediumText,
  contactPhone: cleanString.min(6).max(30).optional(),
  contactPhoneCountry: phoneCountrySchema,
  contactEmail: z.string().trim().email().optional(),
  featuredImageUrl: imageUrlSchema,
});

export const classifiedMessageSchema = z.object({
  listingId: z.number().int().positive(),
  message: cleanString.min(2).max(2000),
  recipientEmail: cleanString.email().optional(),
});

const allowedMessageAttachmentMimeTypes = new Set<string>(MESSAGE_ATTACHMENT_MIME_TYPES);

const messageAttachmentSchema = z.object({
  url: z.string().trim().url(),
  fileName: cleanString.min(1).max(200),
  mimeType: cleanString.max(80).refine((value: string) => allowedMessageAttachmentMimeTypes.has(value), "Type de fichier invalide."),
  sizeBytes: z.number().int().positive().max(6 * 1024 * 1024),
});

export const messageAttachmentPresignSchema = z.object({
  mimeType: cleanString.max(80).refine((value: string) => allowedMessageAttachmentMimeTypes.has(value), "Type de fichier invalide."),
  sizeBytes: z.number().int().positive().max(6 * 1024 * 1024),
});

export const listingMessageSchema = z.object({
  listingId: z.number().int().positive(),
  message: cleanString
    .min(1)
    .max(12000)
    .refine((value) => {
      const plainText = extractMessagePlainText(value);
      return plainText.length >= 2 && plainText.length <= 2000;
    }, "Message invalide."),
  recipientEmail: cleanString.email().optional(),
  attachment: messageAttachmentSchema.optional(),
  attachments: z.array(messageAttachmentSchema).optional(),
}).superRefine((value, ctx) => {
  const attachments = Array.isArray(value.attachments) && value.attachments.length > 0
    ? value.attachments
    : value.attachment
      ? [value.attachment]
      : [];

  const totalBytes = attachments.reduce((sum, attachment) => sum + Number(attachment.sizeBytes || 0), 0);
  if (totalBytes > MESSAGE_ATTACHMENT_MAX_TOTAL_BYTES) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["attachments"],
      message: "La taille totale des fichiers ne doit pas dépasser 6 Mo.",
    });
  }
}).transform((value) => {
  const attachments = Array.isArray(value.attachments) && value.attachments.length > 0
    ? value.attachments
    : value.attachment
      ? [value.attachment]
      : [];

  return {
    ...value,
    attachment: attachments[0],
    attachments,
  };
});

export const mediaPresignSchema = z.object({
  mimeType: cleanString.max(80).refine((value: string) => value.startsWith("image/"), "Type de fichier invalide."),
  sizeBytes: z.number().int().positive().max(5 * 1024 * 1024),
});
