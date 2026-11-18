import { getUserFacingErrorMessage } from "@/lib/errors/user-facing";

type DowngradeResponse = {
  ok?: boolean;
  planId?: string;
  error?: string;
};

export async function requestFreeDowngrade(fetchImpl: typeof fetch = fetch): Promise<void> {
  const response = await fetchImpl("/api/billing/subscription/downgrade-free", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as DowngradeResponse | null;

  if (!response.ok || payload?.ok !== true || payload.planId !== "free") {
    throw new Error(
      getUserFacingErrorMessage(payload?.error, "Impossible de repasser en formule Free pour le moment."),
    );
  }
}
