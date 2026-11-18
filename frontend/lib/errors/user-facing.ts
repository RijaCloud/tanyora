function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function removeTechnicalFragments(value: string) {
  return normalizeText(
    value
      .replace(/\s*\[(?:status|http_status|code)=[^\]]*\]/gi, "")
      .replace(/\s*\(\d{3}\)/g, "")
      .replace(/\bHTTP\s+\d{3}\b/gi, "")
      .replace(/https?:\/\/\S+/gi, "")
      .replace(/\s+\|\s+(request|details?|body|url|stack)\b[\s\S]*$/i, "")
      .replace(/\s+Detail:\s+[\s\S]*$/i, "")
      .replace(/\s+Details?:\s+[\s\S]*$/i, ""),
  );
}

function extractMessageFromRecord(record: unknown): string | null {
  if (!record || typeof record !== "object") {
    return null;
  }

  const candidates = [
    (record as { message?: unknown }).message,
    (record as { error?: unknown }).error,
    (record as { details?: unknown }).details,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && normalizeText(candidate)) {
      return candidate;
    }
  }

  return null;
}

function tryParseJson(value: string): unknown | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function extractEmbeddedJsonMessage(value: string): string | null {
  const firstBraceIndex = value.indexOf("{");
  if (firstBraceIndex === -1) {
    return null;
  }

  const parsed = tryParseJson(value.slice(firstBraceIndex));
  if (!parsed) {
    return null;
  }

  return extractMessageFromRecord(parsed);
}

function stripEmbeddedJson(value: string) {
  const firstBraceIndex = value.indexOf("{");
  if (firstBraceIndex === -1) {
    return value;
  }

  return value.slice(0, firstBraceIndex).replace(/[:\s-]+$/, "");
}

export function getUserFacingErrorMessage(input: unknown, fallback: string) {
  if (typeof input === "string") {
    const directJson = tryParseJson(input);
    if (directJson) {
      const extracted = extractMessageFromRecord(directJson);
      if (extracted) {
        return getUserFacingErrorMessage(extracted, fallback);
      }
    }

    const embeddedJsonMessage = extractEmbeddedJsonMessage(input);
    if (embeddedJsonMessage) {
      return getUserFacingErrorMessage(embeddedJsonMessage, fallback);
    }

    const cleaned = removeTechnicalFragments(stripEmbeddedJson(input));
    return cleaned || fallback;
  }

  if (input instanceof Error) {
    return getUserFacingErrorMessage(input.message, fallback);
  }

  const extracted = extractMessageFromRecord(input);
  if (extracted) {
    return getUserFacingErrorMessage(extracted, fallback);
  }

  return fallback;
}
