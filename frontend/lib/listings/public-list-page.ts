export function readPublicListPageFromUrl() {
  if (typeof window === "undefined") {
    return 1;
  }

  const rawPage = new URLSearchParams(window.location.search).get("page");
  const page = Number.parseInt(rawPage || "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function readPublicListStringParamFromUrl(param: string, fallback = "") {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = new URLSearchParams(window.location.search).get(param);
  return typeof value === "string" ? value : fallback;
}

export function readPublicListNumberParamFromUrl(param: string, fallback = 0) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const rawValue = new URLSearchParams(window.location.search).get(param);
  const value = Number.parseInt(rawValue || String(fallback), 10);
  return Number.isFinite(value) ? value : fallback;
}

type PublicListQueryValue = string | number | null | undefined;

export function updatePublicListQueryParams(
  params: Record<string, PublicListQueryValue>,
  replace = true,
) {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      url.searchParams.delete(key);
      continue;
    }

    if (typeof value === "number") {
      if (!Number.isFinite(value) || value <= 0) {
        url.searchParams.delete(key);
        continue;
      }

      url.searchParams.set(key, String(value));
      continue;
    }

    const normalizedValue = value.trim();
    if (!normalizedValue.length) {
      url.searchParams.delete(key);
      continue;
    }

    url.searchParams.set(key, normalizedValue);
  }

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  if (replace) {
    window.history.replaceState({}, "", nextUrl);
    return;
  }

  window.history.pushState({}, "", nextUrl);
}

export function updatePublicListPageUrl(page: number, replace = false) {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  if (page <= 1) {
    url.searchParams.delete("page");
  } else {
    url.searchParams.set("page", String(page));
  }

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  if (replace) {
    window.history.replaceState({}, "", nextUrl);
    return;
  }

  window.history.pushState({}, "", nextUrl);
}

export function currentPublicListSearchSuffix() {
  if (typeof window === "undefined") {
    return "";
  }

  return `${window.location.search || ""}${window.location.hash || ""}`;
}
