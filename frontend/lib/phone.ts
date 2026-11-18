import { type CountryCode, parsePhoneNumberFromString } from "libphonenumber-js/min";

function toCountryCode(value?: string | null): CountryCode | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return undefined;
  return normalized as CountryCode;
}

export function normalizePhoneNumber(value: string, countryCode?: string | null) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const parsed = parsePhoneNumberFromString(trimmed, toCountryCode(countryCode));
  if (!parsed || !parsed.isValid()) {
    return "";
  }

  return parsed.number;
}

export function isValidPhoneNumber(value: string, countryCode?: string | null) {
  const trimmed = value.trim();
  if (!trimmed) return false;

  const parsed = parsePhoneNumberFromString(trimmed, toCountryCode(countryCode));
  return Boolean(parsed?.isValid());
}
