import { formatMoneyAmount } from "@/lib/pricing/format-money";

export function formatListingMoney(amount?: string | null, currency?: string | null) {
  const rawAmount = String(amount || "").trim();
  if (!rawAmount) {
    return "";
  }

  const digitsOnly = rawAmount.replace(/[^\d]/g, "");
  if (!digitsOnly) {
    return rawAmount;
  }

  return formatMoneyAmount(digitsOnly, { currency: currency || "MGA" });
}
