function parseFlexibleDate(raw: string): number {
  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (slashMatch) {
    const [, day, month, year, hours = "0", minutes = "0", seconds = "0"] = slashMatch;
    const timestamp = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
      Number(seconds),
    ).getTime();
    if (Number.isFinite(timestamp)) {
      return timestamp;
    }
  }

  const dashedMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dashedMatch) {
    const [, year, month, day] = dashedMatch;
    const timestamp = new Date(Number(year), Number(month) - 1, Number(day)).getTime();
    if (Number.isFinite(timestamp)) {
      return timestamp;
    }
  }

  const nativeTimestamp = new Date(raw).getTime();
  if (Number.isFinite(nativeTimestamp)) {
    return nativeTimestamp;
  }

  return Number.NaN;
}

function formatAbsoluteDate(timestamp: number) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(timestamp));
}

export function formatRelativeTime(value?: string | null, now = Date.now()): string {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  const timestamp = parseFlexibleDate(raw);
  if (!Number.isFinite(timestamp)) {
    return raw;
  }

  const diffMs = now - timestamp;
  const future = diffMs < 0;
  const absMs = Math.abs(diffMs);

  if (future) {
    return formatAbsoluteDate(timestamp);
  }

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (absMs < minute) {
    return "à l'instant";
  }
  if (absMs < hour) {
    const count = Math.max(1, Math.floor(absMs / minute));
    return `il y a ${count} min`;
  }
  if (absMs < day) {
    const count = Math.max(1, Math.floor(absMs / hour));
    return `il y a ${count} ${count > 1 ? "heures" : "heure"}`;
  }
  if (absMs < week) {
    const count = Math.max(1, Math.floor(absMs / day));
    return `il y a ${count} ${count > 1 ? "jours" : "jour"}`;
  }
  if (absMs < month) {
    const count = Math.max(1, Math.floor(absMs / week));
    return `il y a ${count} ${count > 1 ? "semaines" : "semaine"}`;
  }
  if (absMs < year) {
    const count = Math.max(1, Math.floor(absMs / month));
    return `il y a ${count} ${count > 1 ? "mois" : "mois"}`;
  }

  const count = Math.max(1, Math.floor(absMs / year));
  return `il y a ${count} ${count > 1 ? "ans" : "an"}`;
}
