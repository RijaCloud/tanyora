import { formatMoneyAmount } from "@/lib/pricing/format-money";

export function formatBookPrice(price: string, currency: string) {
  if (price === "") return "Prix à venir";
  if (Number(price) === 0) return "Gratuit";
  return formatMoneyAmount(price, { currency, useArForMga: true });
}
