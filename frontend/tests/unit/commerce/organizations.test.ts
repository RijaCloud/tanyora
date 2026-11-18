import { afterEach, describe, expect, it, vi } from "vitest";
import { createPendingOrganization, listMemberOrganizations } from "@/lib/commerce/organizations";

const oldBase = process.env.WORDPRESS_INTERNAL_API_BASE_URL;
const oldSecret = process.env.PLATFORM_SUBMISSIONS_SECRET;

afterEach(() => {
  if (oldBase === undefined) delete process.env.WORDPRESS_INTERNAL_API_BASE_URL;
  else process.env.WORDPRESS_INTERNAL_API_BASE_URL = oldBase;
  if (oldSecret === undefined) delete process.env.PLATFORM_SUBMISSIONS_SECRET;
  else process.env.PLATFORM_SUBMISSIONS_SECRET = oldSecret;
  vi.unstubAllGlobals();
});

describe("commerce organizations", () => {
  it("does not call WordPress without internal configuration", async () => {
    delete process.env.WORDPRESS_INTERNAL_API_BASE_URL;
    delete process.env.PLATFORM_SUBMISSIONS_SECRET;
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await expect(listMemberOrganizations(1)).rejects.toThrow("commerce_unavailable");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("returns only the organization fields approved for the frontend", async () => {
    process.env.WORDPRESS_INTERNAL_API_BASE_URL = "http://wordpress/index.php?rest_route=/2424/v1";
    process.env.PLATFORM_SUBMISSIONS_SECRET = "test-only";
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "12", name: "Cabinet Test", country_code: "MG", status: "pending",
        creation_key: "hidden", created_by: 99,
      }),
    });
    vi.stubGlobal("fetch", fetcher);

    expect(await createPendingOrganization({
      wpUserId: 99, name: "Cabinet Test", countryCode: "MG", requestKey: "abc-12345678",
    })).toEqual({ id: 12, name: "Cabinet Test", countryCode: "MG", status: "pending", memberRole: undefined });
    expect(fetcher).toHaveBeenCalledWith(
      "http://wordpress/index.php?rest_route=/2424/v1/tanyora/commerce/organizations/create",
      expect.objectContaining({ method: "POST", cache: "no-store" }),
    );
  });

  it("fails closed on malformed or unavailable WordPress responses", async () => {
    process.env.WORDPRESS_INTERNAL_API_BASE_URL = "http://wordpress/index.php?rest_route=/2424/v1";
    process.env.PLATFORM_SUBMISSIONS_SECRET = "test-only";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [{ id: 1 }] }) }));
    await expect(listMemberOrganizations(1)).rejects.toThrow("commerce_unavailable");
  });
});
