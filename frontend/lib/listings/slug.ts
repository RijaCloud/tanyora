export function slugifyListingTitle(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);
}

export function buildListingSlug(id: number | string, title: string, fallbackPrefix = "annonce"): string {
  const normalizedId = Number.parseInt(String(id), 10);
  const base = slugifyListingTitle(title || "") || fallbackPrefix;
  if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
    return base;
  }
  return `${base}-${normalizedId}`;
}

export function extractListingIdFromSlug(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d+$/.test(trimmed)) {
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  const match = trimmed.match(/-(\d+)$/);
  if (!match?.[1]) {
    return null;
  }

  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
