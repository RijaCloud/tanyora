import { z } from "zod";

const numericId = z.number().int().positive();

export const wordPressListingResultSchema = z.object({
  listingId: numericId,
  postStatus: z.string().min(1),
  paymentStatus: z.string().min(1),
  alreadyPaid: z.boolean().optional(),
  usedIncludedAccess: z.boolean().optional(),
  includedCreditConsumed: z.boolean().optional(),
});

export const wordPressPublishingAccessSchema = z.object({
  wpUserId: numericId,
  planId: z.enum(["free", "essentiel", "business"]),
  accessGrant: z.literal("all_privileges").nullable().optional(),
  classifieds: z.object({
    canCreateDraft: z.boolean(),
    canPublish: z.boolean(),
    monthlyLimit: z.number().int().nonnegative(),
    monthlyUsed: z.number().int().nonnegative(),
    monthlyRemaining: z.number().int().nonnegative(),
    maxPhotos: z.number().int().nonnegative(),
  }),
  jobs: z.object({
    canCreateDraft: z.boolean(),
    canPublish: z.boolean(),
    monthlyLimit: z.number().int().nonnegative(),
    monthlyUsed: z.number().int().nonnegative(),
    monthlyRemaining: z.number().int().nonnegative(),
  }),
  tenders: z.object({
    canCreateDraft: z.boolean(),
    canPublish: z.boolean(),
    monthlyLimit: z.number().int().nonnegative(),
    monthlyUsed: z.number().int().nonnegative(),
    monthlyRemaining: z.number().int().nonnegative(),
    canRespond: z.boolean(),
    minimumPlan: z.enum(["free", "essentiel", "business"]),
    responseMinimumPlan: z.enum(["free", "essentiel", "business"]),
  }),
  period: z.object({
    monthKey: z.string().min(1),
    resetsAt: z.string().datetime(),
  }),
});

export const wordPressFormConfigSchema = z.object({
  kind: z.enum(["classified", "job", "tender"]),
  categories: z.array(z.object({ id: numericId.optional(), name: z.string().min(1), slug: z.string().min(1) })).max(500),
  locations: z.array(z.object({ id: numericId.optional(), name: z.string().min(1), slug: z.string().min(1), parentId: numericId.optional() })).max(500),
});

export const wordPressHealthSchema = z.object({
  ok: z.boolean(),
  service: z.literal("2424-platform"),
  time: z.string().datetime(),
});
