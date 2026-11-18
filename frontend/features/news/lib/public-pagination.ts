export const MAX_EDITORIAL_PAGE = 50;
export const MAX_EDITORIAL_PER_PAGE = 24;

export function parseEditorialPage(value: string | null, fallback = 1) {
  const parsed = Number.parseInt(String(value || fallback), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, MAX_EDITORIAL_PAGE);
}

export function parseEditorialPerPage(value: string | null, fallback = 12) {
  const parsed = Number.parseInt(String(value || fallback), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, MAX_EDITORIAL_PER_PAGE);
}
