import { describe, expect, it } from "vitest";
import {
  classifiedCreateSchema,
  classifiedUpdateSchema,
  jobCreateSchema,
  tenderCreateSchema,
  listingMessageSchema,
  mediaPresignSchema,
  messageAttachmentPresignSchema,
} from "@/lib/security/validation";

const validClassifiedPayload = {
  title: "Ordinateur portable Lenovo",
  content: "<p>Annonce detaillee avec une description suffisamment longue pour depasser les quatre-vingts caracteres et rester valide pour la plateforme.</p>",
  excerpt: "Occasion tres propre",
  category: "Informatique",
  productTag: "Accessoires",
  type: "Ordinateurs",
  companyName: "Tech Mada",
  location: "Antananarivo",
  city: "Antananarivo",
  area: "Ankorondrano",
  price: "1250000",
  currency: "MGA" as const,
  contactPhone: "+261340000000",
  contactPhoneCountry: "MG",
  featuredImageUrl: "https://cdn.2424.mg/image.jpg",
  galleryImageUrls: [
    "https://cdn.2424.mg/image-1.jpg",
    "https://cdn.2424.mg/image-2.jpg",
  ],
};

const validJobPayload = {
  title: "Responsable logistique",
  content:
    "<p>Entreprise en croissance recherche un profil experimente capable de piloter les operations, l equipe et les priorites sur le terrain avec une communication claire et une vraie autonomie.</p>",
  excerpt: "CDI a Antananarivo",
  category: "Emploi",
  type: "Logistique",
  companyName: "Transit Mada",
  location: "Antananarivo",
  city: "Antananarivo",
  area: "Ivato",
  skills: ["Logistique", "Leadership", "Excel"],
  experienceYears: "3 ans",
  needBy: "2026-06-30",
  deadline: "2026-07-01",
  contactPhone: "+261340000001",
  contactPhoneCountry: "MG",
  contactEmail: "jobs@example.com",
  featuredImageUrl: "https://cdn.2424.mg/job.jpg",
};

const validTenderPayload = {
  title: "Construction d'un batiment administratif",
  content:
    "<p>Appel d offres detaille avec un descriptif suffisamment long pour couvrir le besoin, les contraintes techniques, les criteres de selection et les modalites de soumission de la reponse.</p>",
  excerpt: "Marche public",
  category: "BTP",
  type: "Construction",
  companyName: "Agence publique",
  location: "Toamasina",
  city: "Toamasina",
  area: "Centre",
  deadline: "2026-08-15",
  budget: "150000000",
  currency: "MGA" as const,
  detailsPdfUrl: "https://cdn.2424.mg/dossier.pdf",
  detailsPdfName: "Dossier d'appel d'offres",
  contactPhone: "+261340000002",
  contactPhoneCountry: "MG",
  contactEmail: "marches@example.com",
  featuredImageUrl: "https://cdn.2424.mg/tender.jpg",
};

describe("security validation schemas", () => {
  it("accepts a valid classified create payload", () => {
    const result = classifiedCreateSchema.safeParse(validClassifiedPayload);
    expect(result.success).toBe(true);
  });

  it("rejects a classified description beyond the 1500 character plain-text limit", () => {
    const payload = {
      ...validClassifiedPayload,
      content: `<p>${"a".repeat(1501)}</p>`,
    };

    const result = classifiedCreateSchema.safeParse(payload);

    expect(result.success).toBe(false);
  });

  it("accepts classified updates without price", () => {
    const payload = { ...validClassifiedPayload };
    delete (payload as { price?: string }).price;

    const result = classifiedUpdateSchema.safeParse(payload);

    expect(result.success).toBe(true);
  });

  it("accepts an empty classified gallery so all existing photos can be removed", () => {
    const result = classifiedUpdateSchema.safeParse({
      ...validClassifiedPayload,
      featuredImageUrl: "",
      galleryImageUrls: [],
    });

    expect(result.success).toBe(true);
  });

  it("defers classified gallery limits to the account quota check", () => {
    const result = classifiedCreateSchema.safeParse({
      ...validClassifiedPayload,
      galleryImageUrls: [
        "https://cdn.2424.mg/image-1.jpg",
        "https://cdn.2424.mg/image-2.jpg",
        "https://cdn.2424.mg/image-3.jpg",
        "https://cdn.2424.mg/image-4.jpg",
        "https://cdn.2424.mg/image-5.jpg",
      ],
    });

    expect(result.success).toBe(true);
  });

  it("accepts classified payloads without an area", () => {
    const { area: _area, ...payload } = validClassifiedPayload;

    const result = classifiedCreateSchema.safeParse(payload);

    expect(result.success).toBe(true);
  });

  it("accepts a valid job payload", () => {
    const result = jobCreateSchema.safeParse(validJobPayload);

    expect(result.success).toBe(true);
  });

  it("rejects invalid job contact emails", () => {
    const result = jobCreateSchema.safeParse({
      ...validJobPayload,
      contactEmail: "not-an-email",
    });

    expect(result.success).toBe(false);
  });

  it("rejects job payloads with more than five skills", () => {
    const result = jobCreateSchema.safeParse({
      ...validJobPayload,
      skills: ["A", "B", "C", "D", "E", "F"],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a job skill longer than forty characters", () => {
    const result = jobCreateSchema.safeParse({
      ...validJobPayload,
      skills: ["Une competence volontairement plus longue que quarante caracteres"],
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid tender payload", () => {
    const result = tenderCreateSchema.safeParse(validTenderPayload);

    expect(result.success).toBe(true);
  });

  it("rejects tender attachments that are not valid URLs", () => {
    const result = tenderCreateSchema.safeParse({
      ...validTenderPayload,
      detailsPdfUrl: "brochure-locale.pdf",
    });

    expect(result.success).toBe(false);
  });

  it("rejects message attachments above the configured size limit", () => {
    const result = messageAttachmentPresignSchema.safeParse({
      mimeType: "application/pdf",
      sizeBytes: 6 * 1024 * 1024 + 1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects zip attachments for messaging", () => {
    const result = messageAttachmentPresignSchema.safeParse({
      mimeType: "application/zip",
      sizeBytes: 1024,
    });

    expect(result.success).toBe(false);
  });

  it("accepts Word and Excel attachments for messaging presign", () => {
    expect(
      messageAttachmentPresignSchema.safeParse({
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        sizeBytes: 1024,
      }).success,
    ).toBe(true);

    expect(
      messageAttachmentPresignSchema.safeParse({
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        sizeBytes: 1024,
      }).success,
    ).toBe(true);
  });

  it("rejects messaging payloads whose combined attachment size exceeds 6 MB", () => {
    const result = listingMessageSchema.safeParse({
      listingId: 42,
      message: "<p>Bonjour, veuillez trouver les documents joints.</p>",
      attachments: [
        {
          url: "https://cdn.2424.mg/doc-1.pdf",
          fileName: "doc-1.pdf",
          mimeType: "application/pdf",
          sizeBytes: 4 * 1024 * 1024,
        },
        {
          url: "https://cdn.2424.mg/doc-2.xlsx",
          fileName: "doc-2.xlsx",
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          sizeBytes: 3 * 1024 * 1024,
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("accepts only image mime types for media presign", () => {
    expect(
      mediaPresignSchema.safeParse({
        mimeType: "image/webp",
        sizeBytes: 1024,
      }).success,
    ).toBe(true);

    expect(
      mediaPresignSchema.safeParse({
        mimeType: "application/pdf",
        sizeBytes: 1024,
      }).success,
    ).toBe(false);
  });

  it("validates listing messages based on extracted plain text", () => {
    const result = listingMessageSchema.safeParse({
      listingId: 12,
      message: "<p>Bonjour, je suis interesse par votre annonce.</p>",
      recipientEmail: "contact@example.com",
    });

    expect(result.success).toBe(true);
  });
});
