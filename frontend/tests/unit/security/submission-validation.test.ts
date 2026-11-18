import { describe, expect, it } from "vitest";

import { submissionValidationErrorResponse } from "@/lib/security/submission-validation";
import { jobCreateSchema } from "@/lib/security/validation";

describe("submission validation responses", () => {
  it("returns a user-facing message for the failing job field", async () => {
    const result = jobCreateSchema.safeParse({ title: "", content: "" });
    expect(result.success).toBe(false);
    if (result.success) return;

    const response = submissionValidationErrorResponse(result.error, "Veuillez corriger les champs signalés.");
    const payload = await response.json() as { error: string; fieldErrors: Record<string, string> };

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Veuillez corriger les champs signalés.");
    expect(payload.fieldErrors.title).toBeTruthy();
    expect(payload.fieldErrors.content).toBeTruthy();
  });

  it("explains the maximum length for a job skill", async () => {
    const result = jobCreateSchema.safeParse({
      title: "Responsable logistique",
      content: "Description valide pour une offre d'emploi qui doit contenir suffisamment de details afin de passer la validation.".repeat(2),
      city: "Antananarivo",
      area: "Ivato",
      skills: ["Une competence volontairement plus longue que quarante caracteres"],
    });
    expect(result.success).toBe(false);
    if (result.success) return;

    const response = submissionValidationErrorResponse(result.error, "Veuillez corriger les champs signalés.");
    const payload = await response.json() as { fieldErrors: Record<string, string> };

    expect(payload.fieldErrors.skills).toBe("Chaque compétence ne peut pas dépasser 40 caractères.");
  });
});
