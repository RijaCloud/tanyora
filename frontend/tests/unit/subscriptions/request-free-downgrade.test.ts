import { describe, expect, it, vi } from "vitest";
import { requestFreeDowngrade } from "@/features/subscriptions/lib/request-free-downgrade";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("requestFreeDowngrade", () => {
  it("only completes when the server confirms the Free plan", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true, planId: "free" }));

    await expect(requestFreeDowngrade(fetchMock as unknown as typeof fetch)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/billing/subscription/downgrade-free", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });
  });

  it("keeps the current client state intact when the server declines the downgrade", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: "Abonnement Business toujours actif." }, 500));

    await expect(requestFreeDowngrade(fetchMock as unknown as typeof fetch)).rejects.toThrow("Abonnement Business toujours actif.");
  });

  it("rejects a successful HTTP response that does not confirm the Free plan", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true, planId: "business" }));

    await expect(requestFreeDowngrade(fetchMock as unknown as typeof fetch)).rejects.toThrow(
      "Impossible de repasser en formule Free pour le moment.",
    );
  });
});
