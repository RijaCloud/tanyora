import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getPapiStatusFromWordPress } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getPapiStatusFromWordPress: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/lib/api/wordpress-internal", () => ({ getPapiStatusFromWordPress }));

import { POST } from "@/app/api/billing/papi/status/route";

function request(body: unknown) {
  return new Request("http://localhost/api/billing/papi/status", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Papi payment status", () => {
  beforeEach(() => {
    getServerSession.mockReturnValue({ wpUserId: 42 });
  });

  it("requires an authenticated user", async () => {
    getServerSession.mockReturnValue(null);
    expect((await POST(request({ orderId: 123, key: "key" }))).status).toBe(401);
    expect(getPapiStatusFromWordPress).not.toHaveBeenCalled();
  });

  it("requires an order ID and key", async () => {
    expect((await POST(request({ orderId: 123 }))).status).toBe(400);
    expect(getPapiStatusFromWordPress).not.toHaveBeenCalled();
  });

  it.each(["pending", "failed"])("never confirms a %s payment", async (paymentStatus) => {
    getPapiStatusFromWordPress.mockResolvedValue({ orderId: 123, paymentStatus });
    const response = await POST(request({ orderId: 123, key: "key" }));
    expect(getPapiStatusFromWordPress).toHaveBeenCalledWith({ wpUserId: 42, orderId: 123, key: "key" });
    await expect(response.json()).resolves.toMatchObject({ status: paymentStatus, isConfirmed: false });
  });

  it("confirms only a paid order returned by WordPress", async () => {
    getPapiStatusFromWordPress.mockResolvedValue({ orderId: 123, paymentStatus: "paid", planId: "business" });
    const response = await POST(request({ orderId: 123, key: "key" }));
    await expect(response.json()).resolves.toMatchObject({ status: "paid", isConfirmed: true, planId: "business" });
  });

  it("does not confirm when WordPress fails", async () => {
    getPapiStatusFromWordPress.mockRejectedValue(new Error("WordPress unavailable"));
    expect((await POST(request({ orderId: 123, key: "key" }))).status).toBe(500);
  });
});
