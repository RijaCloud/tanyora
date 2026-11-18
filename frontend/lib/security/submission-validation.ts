import { NextResponse } from "next/server";
import type { ZodError } from "zod";

const FIELD_LABELS: Record<string, string> = {
  title: "Le titre",
  content: "La description",
  companyName: "L'entreprise",
  category: "La catégorie",
  type: "Le type",
  city: "La ville",
  area: "La zone",
  location: "Le lieu",
  price: "Le prix",
  budget: "Le budget",
  currency: "La devise",
  contactPhone: "Le numéro de téléphone",
  contactEmail: "L'adresse email",
  deadline: "La date limite",
  skills: "Les compétences",
};

function getIssueMessage(issue: { code: string; message: string }, label: string, field: string) {
  if (field === "skills" && issue.code === "too_big" && issue.message) return issue.message;
  if (issue.code === "too_small") return `${label} est trop court ou manquant.`;
  if (issue.code === "too_big") return `${label} est trop long.`;
  if (issue.code === "invalid_type") return `${label} est requis.`;
  if (issue.code === "invalid_format" || issue.code === "invalid_string") return `${label} n'est pas valide.`;
  if (issue.code === "custom" && issue.message) return issue.message;
  return `${label} n'est pas valide.`;
}

/** Expose les erreurs Zod sans divulguer le payload ni les détails internes. */
export function submissionValidationErrorResponse(error: ZodError, summary: string) {
  const fieldErrors: Record<string, string> = {};

  for (const rawIssue of error.issues) {
    const issue = rawIssue as { path: PropertyKey[]; code: string; message: string };
    const field = String(issue.path[0] || "form");
    if (fieldErrors[field]) continue;
    fieldErrors[field] = getIssueMessage(issue, FIELD_LABELS[field] || "Ce champ", field);
  }

  return NextResponse.json({ error: summary, fieldErrors }, { status: 400 });
}
