import { describe, expect, it } from "vitest";
import { buildFollowUpEntriesFromMessages } from "@/lib/messages/profile-follow-up";

describe("profile follow-up entries", () => {
  it("keeps only external participants and sorts by latest message", () => {
    const entries = buildFollowUpEntriesFromMessages({
      kind: "job",
      listingSlug: "responsable-logistique-42",
      ownerEmail: "owner@example.com",
      titlePrefix: "Candidature",
      messages: [
        {
          id: "m1",
          listingId: 42,
          kind: "job",
          senderWpUserId: 42,
          senderEmail: "owner@example.com",
          senderName: "Owner",
          recipientEmail: "candidate-1@example.com",
          content: "<p>Bonjour</p>",
          createdAt: "2026-06-10T10:00:00.000Z",
          status: "reviewed",
        },
        {
          id: "m2",
          listingId: 42,
          kind: "job",
          senderWpUserId: 1001,
          senderEmail: "candidate-1@example.com",
          senderName: "Alice",
          recipientEmail: "owner@example.com",
          content: "<p>Je suis disponible pour un entretien.</p>",
          createdAt: "2026-06-10T12:00:00.000Z",
          status: "new",
        },
        {
          id: "m3",
          listingId: 42,
          kind: "job",
          senderWpUserId: 1002,
          senderEmail: "candidate-2@example.com",
          senderName: "Bob",
          recipientEmail: "owner@example.com",
          content: "",
          attachment: {
            url: "https://cdn.2424.mg/cv.pdf",
            fileName: "CV Bob.pdf",
            mimeType: "application/pdf",
            sizeBytes: 1024,
          },
          createdAt: "2026-06-10T13:00:00.000Z",
          status: "archived",
        },
      ],
    });

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      id: "job:candidate-2@example.com",
      title: "Candidature Bob",
      description: "Fichier joint : CV Bob.pdf",
      conversationHref: "/offres-emploi/responsable-logistique-42/contacter?participant=candidate-2%40example.com",
    });
    expect(entries[1]).toMatchObject({
      id: "job:candidate-1@example.com",
      title: "Candidature Alice",
      description: "Je suis disponible pour un entretien.",
      status: "new",
    });
  });

  it("builds tender conversation links with encoded participant emails", () => {
    const entries = buildFollowUpEntriesFromMessages({
      kind: "tender",
      listingSlug: "construction-immeuble-77",
      ownerEmail: "owner@example.com",
      titlePrefix: "Soumission",
      messages: [
        {
          id: "m4",
          listingId: 77,
          kind: "tender",
          senderWpUserId: 2001,
          senderEmail: "agency+ao@example.com",
          senderName: "Agence AO",
          recipientEmail: "owner@example.com",
          content: "<p>Notre dossier est joint.</p>",
          createdAt: "2026-06-11T09:00:00.000Z",
          status: "reviewed",
        },
      ],
    });

    expect(entries[0]?.conversationHref).toBe(
      "/appels-offres/construction-immeuble-77/contacter?participant=agency%2Bao%40example.com",
    );
  });
});
