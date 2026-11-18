import { z } from "zod";

const organizationSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string(),
  country_code: z.string(),
  status: z.enum(["pending", "active", "suspended", "rejected"]),
  member_role: z.string().optional(),
});

export type CommerceOrganization = {
  id: number;
  name: string;
  countryCode: string;
  status: "pending" | "active" | "suspended" | "rejected";
  memberRole?: string;
};

function mapOrganization(value: z.infer<typeof organizationSchema>): CommerceOrganization {
  return {
    id: value.id,
    name: value.name,
    countryCode: value.country_code,
    status: value.status,
    memberRole: value.member_role,
  };
}

async function requestOrganizations(path: string, payload: Record<string, unknown>) {
  const base = process.env.WORDPRESS_INTERNAL_API_BASE_URL?.trim();
  const secret = process.env.PLATFORM_SUBMISSIONS_SECRET?.trim();
  if (!base || !secret) throw new Error("commerce_unavailable");

  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/tanyora/commerce/organizations/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-2424-internal-secret": secret,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("commerce_unavailable");
    return await response.json();
  } catch {
    throw new Error("commerce_unavailable");
  }
}

export async function createPendingOrganization(input: {
  wpUserId: number;
  name: string;
  countryCode: string;
  requestKey: string;
}): Promise<CommerceOrganization> {
  const raw = await requestOrganizations("create", input);
  const parsed = organizationSchema.safeParse(raw);
  if (!parsed.success) throw new Error("commerce_unavailable");
  return mapOrganization(parsed.data);
}

export async function listMemberOrganizations(wpUserId: number): Promise<CommerceOrganization[]> {
  const raw = await requestOrganizations("list", { wpUserId });
  const parsed = z.object({ items: z.array(organizationSchema) }).safeParse(raw);
  if (!parsed.success) throw new Error("commerce_unavailable");
  return parsed.data.items.map(mapOrganization);
}
