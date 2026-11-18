type FormatMoneyOptions = {
  currency?: string | null;
  suffix?: string;
  zeroLabel?: string;
  useArForMga?: boolean;
  includeCurrency?: boolean;
};

export function formatGroupedNumber(value: number | string | null | undefined) {
  if (value == null || value === "") {
    return "";
  }

  const numericValue = typeof value === "number" ? value : Number.parseFloat(String(value).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(numericValue)) {
    return String(value);
  }

  return Math.round(numericValue).toLocaleString("fr-FR");
}

export function formatMoneyAmount(
  value: number | string | null | undefined,
  options: FormatMoneyOptions = {},
) {
  if (value == null || value === "") {
    return "";
  }

  const numericValue = typeof value === "number" ? value : Number.parseFloat(String(value).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(numericValue)) {
    return String(value);
  }

  if (numericValue === 0 && options.zeroLabel) {
    return options.zeroLabel;
  }

  const formattedAmount = formatGroupedNumber(numericValue);
  const rawCurrency = String(options.currency || "MGA").trim();
  const currencyLabel =
    rawCurrency.toUpperCase() === "MGA" && options.useArForMga ? "Ar" : rawCurrency.toUpperCase();
  const suffix = options.suffix ? ` ${options.suffix.trim()}` : "";

  if (options.includeCurrency === false) {
    return `${formattedAmount}${suffix}`.trim();
  }

  return `${formattedAmount} ${currencyLabel}${suffix}`.trim();
}
